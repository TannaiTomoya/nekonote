-- ネコのて v2.1. Run once in the supplied project's SQL Editor.
-- No service-role key is needed by the application. Every read/write is owner scoped.
begin;
create table public.daily_logs (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 log_date date not null, mood smallint check(mood between 1 and 5), note text check(length(note)<=200),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id,log_date)
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 kind text not null check(kind in('income','expense')),
 category text not null check(category in('housing','food','comm','transit','medical','joy','other')),
 amount integer not null check(amount between 1 and 999999999), occurred_on date not null,
 memo text check(length(memo)<=200), created_at timestamptz not null default now()
);
create table public.recurring_payments (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 80), amount integer not null check(amount between 1 and 999999999),
 pay_day smallint not null check(pay_day between 1 and 31), is_active boolean not null default true,
 created_at timestamptz not null default now()
);
create table public.care_places (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check(length(name) between 1 and 100), memo text check(length(memo)<=2000),
 lat double precision check(lat between -90 and 90), lng double precision check(lng between -180 and 180), next_visit date,
 created_at timestamptz not null default now(), unique(id,user_id), check((lat is null)=(lng is null))
);
create table public.events (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 title text not null check(length(title) between 1 and 100), event_date date not null, event_time time,
 kind text not null default 'other' check(kind in('care','payment','other')), care_id uuid,
 memo text check(length(memo)<=2000), created_at timestamptz not null default now(),
 foreign key(care_id,user_id) references public.care_places(id,user_id) on delete cascade
);
create table public.display_settings (
 user_id uuid primary key references auth.users(id) on delete cascade,
 stimulus_level smallint not null default 2 check(stimulus_level between 1 and 3),
 notify_enabled boolean not null default false,
 open_trigger text check(open_trigger in('morning','after_meal','after_bath','before_sleep')),
 last_opened_on date, onboarded boolean not null default true, revision bigint not null default 0,
 updated_at timestamptz not null default now()
);
do $$ declare tab text; begin
 foreach tab in array array['daily_logs','transactions','recurring_payments','care_places','events','display_settings'] loop
 execute format('alter table public.%I enable row level security',tab);
 execute format('create policy owner_only on public.%I for all to authenticated using ((select auth.uid())=user_id) with check ((select auth.uid())=user_id)',tab);
 execute format('revoke all on public.%I from anon',tab);
 execute format('grant select,insert,update,delete on public.%I to authenticated',tab);
 end loop;
end $$;
create index transactions_user_date on public.transactions(user_id,occurred_on);
create index recurring_user on public.recurring_payments(user_id);
create index events_user_date on public.events(user_id,event_date);
create index care_user on public.care_places(user_id);
create view public.v_mood_trend with (security_invoker=true) as
select user_id, avg(mood) filter(where log_date between current_date-6 and current_date) recent_avg,
 avg(mood) overall_avg, count(*) filter(where log_date between current_date-13 and current_date) logged_in_14d
from public.daily_logs where mood is not null and log_date<=current_date group by user_id;
revoke all on public.v_mood_trend from anon;
grant select on public.v_mood_trend to authenticated;

-- Returns one consistent snapshot. Empty arrays remain arrays, never null.
create function public.nekonote_load() returns jsonb language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); s public.display_settings; begin
 if uid is null then raise exception 'authentication_required'; end if;
 select * into s from public.display_settings where user_id=uid;
 return jsonb_build_object('revision',coalesce(s.revision,0),'data',jsonb_build_object(
 'version',1,'drafts','{}'::jsonb,
 'logs',coalesce((select jsonb_agg(jsonb_build_object('id',id,'date',log_date,'mood',mood,'note',coalesce(note,''))) from public.daily_logs where user_id=uid),'[]'::jsonb),
 'transactions',coalesce((select jsonb_agg(jsonb_build_object('id',id,'date',occurred_on,'kind',kind,'category',category,'amount',amount,'memo',coalesce(memo,''))) from public.transactions where user_id=uid),'[]'::jsonb),
 'recurring',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name,'amount',amount,'day',pay_day,'active',is_active)) from public.recurring_payments where user_id=uid),'[]'::jsonb),
 'care',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'name',name,'memo',coalesce(memo,''),'nextVisit',coalesce(next_visit::text,''),'lat',lat,'lng',lng))) from public.care_places where user_id=uid),'[]'::jsonb),
 'events',coalesce((select jsonb_agg(jsonb_strip_nulls(jsonb_build_object('id',id,'title',title,'date',event_date,'time',coalesce(to_char(event_time,'HH24:MI'),''),'kind',kind,'careId',care_id,'memo',coalesce(memo,'')))) from public.events where user_id=uid),'[]'::jsonb),
 'settings',jsonb_build_object('stimulus',coalesce(s.stimulus_level,2),'trigger',coalesce(s.open_trigger,''),'notify',coalesce(s.notify_enabled,false),'lastOpened',s.last_opened_on,'onboarded',coalesce(s.onboarded,true))));
end $$;

-- Atomic, optimistic concurrency: stale devices cannot overwrite a newer snapshot.
create function public.nekonote_save(payload jsonb, expected_revision bigint) returns bigint language plpgsql security invoker set search_path='' as $$
declare uid uuid:=auth.uid(); rev bigint; r jsonb; begin
 if uid is null then raise exception 'authentication_required'; end if;
 if (payload->>'version')::int<>1 or jsonb_typeof(payload->'logs')<>'array' then raise exception 'invalid_payload'; end if;
 insert into public.display_settings(user_id) values(uid) on conflict(user_id) do nothing;
 select revision into rev from public.display_settings where user_id=uid for update;
 if rev<>expected_revision then raise exception 'sync_conflict'; end if;
 -- This replacement is transactional, and only the caller's own records are affected.
 delete from public.events where user_id=uid;
 delete from public.care_places where user_id=uid;
 delete from public.daily_logs where user_id=uid;
 delete from public.transactions where user_id=uid;
 delete from public.recurring_payments where user_id=uid;
 for r in select value from jsonb_array_elements(payload->'logs') loop
 insert into public.daily_logs(id,user_id,log_date,mood,note) values((r->>'id')::uuid,uid,(r->>'date')::date,(r->>'mood')::smallint,r->>'note'); end loop;
 for r in select value from jsonb_array_elements(payload->'transactions') loop
 insert into public.transactions(id,user_id,kind,category,amount,occurred_on,memo) values((r->>'id')::uuid,uid,r->>'kind',r->>'category',(r->>'amount')::int,(r->>'date')::date,r->>'memo'); end loop;
 for r in select value from jsonb_array_elements(payload->'recurring') loop
 insert into public.recurring_payments(id,user_id,name,amount,pay_day,is_active) values((r->>'id')::uuid,uid,r->>'name',(r->>'amount')::int,(r->>'day')::smallint,(r->>'active')::boolean); end loop;
 for r in select value from jsonb_array_elements(payload->'care') loop
 insert into public.care_places(id,user_id,name,memo,next_visit,lat,lng) values((r->>'id')::uuid,uid,r->>'name',r->>'memo',nullif(r->>'nextVisit','')::date,(r->>'lat')::double precision,(r->>'lng')::double precision); end loop;
 for r in select value from jsonb_array_elements(payload->'events') loop
 insert into public.events(id,user_id,title,event_date,event_time,kind,care_id,memo) values((r->>'id')::uuid,uid,r->>'title',(r->>'date')::date,nullif(r->>'time','')::time,r->>'kind',(r->>'careId')::uuid,r->>'memo'); end loop;
 update public.display_settings set stimulus_level=(payload->'settings'->>'stimulus')::smallint,
 open_trigger=nullif(payload->'settings'->>'trigger',''), notify_enabled=coalesce((payload->'settings'->>'notify')::boolean,false),
 last_opened_on=nullif(payload->'settings'->>'lastOpened','')::date,onboarded=coalesce((payload->'settings'->>'onboarded')::boolean,true),
 revision=rev+1,updated_at=now() where user_id=uid;
 return rev+1;
end $$;

-- An authenticated user can delete only their own auth row; FK cascades remove all data.
create function public.nekonote_delete_account() returns void language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid(); begin
 if uid is null then raise exception 'authentication_required'; end if;
 delete from auth.users where id=uid;
end $$;
revoke all on function public.nekonote_load() from public,anon;
revoke all on function public.nekonote_save(jsonb,bigint) from public,anon;
revoke all on function public.nekonote_delete_account() from public,anon;
grant execute on function public.nekonote_load() to authenticated;
grant execute on function public.nekonote_save(jsonb,bigint) to authenticated;
grant execute on function public.nekonote_delete_account() to authenticated;
commit;
