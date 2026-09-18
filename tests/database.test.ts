import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { emptyData } from "../src/lib/domain";
test("migration, owner isolation, revision conflict and self-deletion on real Postgres engine", async () => {
  const db = new PGlite();
  await db.exec(
    "create role anon; create role authenticated; create schema auth; create table auth.users(id uuid primary key); create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$; grant usage on schema public,auth to anon,authenticated; grant execute on function auth.uid() to anon,authenticated;",
  );
  await db.exec(
    readFileSync("supabase/migrations/202609180001_nekonote.sql", "utf8"),
  );
  const a = "00000000-0000-4000-8000-000000000001",
    b = "00000000-0000-4000-8000-000000000002";
  await db.query("insert into auth.users values($1),($2)", [a, b]);
  const payload = emptyData();
  payload.logs = [
    {
      id: "00000000-0000-4000-8000-000000000010",
      date: "2026-09-18",
      mood: 3,
      note: "sample",
    },
  ];
  await db.exec(`set role authenticated; set request.jwt.claim.sub='${a}';`);
  const saved = await db.query<{ rev: number }>(
    "select public.nekonote_save($1,0) rev",
    [payload],
  );
  assert.equal(Number(saved.rows[0].rev), 1);
  const loaded = await db.query<{ snapshot: { data: typeof payload } }>(
    "select public.nekonote_load() snapshot",
  );
  assert.equal(loaded.rows[0].snapshot.data.logs.length, 1);
  await assert.rejects(
    () => db.query("select public.nekonote_save($1,0)", [emptyData()]),
    /sync_conflict/,
  );
  assert.equal(
    (await db.query("select * from public.daily_logs")).rows.length,
    1,
  );
  await db.exec(`set request.jwt.claim.sub='${b}';`);
  assert.equal(
    (await db.query("select * from public.daily_logs")).rows.length,
    0,
  );
  assert.equal(
    (await db.query("select * from public.v_mood_trend")).rows.length,
    0,
  );
  await assert.rejects(
    () =>
      db.query(
        "insert into public.daily_logs(user_id,log_date,mood) values($1,$2,3)",
        [a, "2026-09-17"],
      ),
    /row-level security/,
  );
  await db.exec("reset role; set role anon;");
  await assert.rejects(
    () => db.query("select * from public.daily_logs"),
    /permission denied/,
  );
  await assert.rejects(
    () => db.query("select public.nekonote_load()"),
    /permission denied/,
  );
  await db.exec(
    `reset role; set role authenticated; set request.jwt.claim.sub='${a}';`,
  );
  await db.query("select public.nekonote_delete_account()");
  await db.exec("reset role;");
  assert.equal(
    (await db.query("select * from public.daily_logs")).rows.length,
    0,
  );
  const users = await db.query<{ id: string }>("select * from auth.users");
  assert.deepEqual(
    users.rows.map((u) => u.id),
    [b],
  );
  await db.close();
});
