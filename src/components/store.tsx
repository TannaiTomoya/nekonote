"use client";
import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  emptyData,
  localDate,
  shouldWelcome,
  STORAGE_KEY,
  type Data,
} from "@/lib/domain";
import { supabase } from "@/lib/supabase";
type CloudCache = { data: Data; revision: number; dirty: boolean };
type Store = {
  data: Data;
  ready: boolean;
  error: string;
  update: (fn: (d: Data) => Data) => boolean;
  welcome: boolean;
  dismissWelcome: () => void;
  erase: () => Promise<boolean>;
  user: User | null;
  syncStatus: string;
  sync: () => Promise<void>;
  importGuest: () => void;
  reloadCloud: () => Promise<void>;
};
const Context = createContext<Store | null>(null);
const cloudKey = (id: string) => `nekonote.cloud.${id}`;
function readData(value: unknown): Data {
  const v = value as Data;
  if (
    !v ||
    v.version !== 1 ||
    !Array.isArray(v.logs) ||
    !Array.isArray(v.transactions) ||
    !Array.isArray(v.recurring) ||
    !Array.isArray(v.care) ||
    !Array.isArray(v.events) ||
    !v.settings ||
    !v.drafts
  )
    throw new Error("invalid_data");
  return v;
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(emptyData),
    [ready, setReady] = useState(false),
    [error, setError] = useState(""),
    [welcome, setWelcome] = useState(false),
    [user, setUser] = useState<User | null>(null),
    [syncStatus, setSyncStatus] = useState("");
  const current = useRef(data),
    scope = useRef<string | null>(null),
    meta = useRef({ revision: 0, dirty: false }),
    inFlight = useRef(false),
    blocked = useRef(false),
    generation = useRef(0),
    change = useRef(0);
  const persist = useCallback((next: Data) => {
    if (blocked.current) return false;
    try {
      localStorage.setItem(
        scope.current ? cloudKey(scope.current) : STORAGE_KEY,
        JSON.stringify(scope.current ? { data: next, ...meta.current } : next),
      );
      current.current = next;
      setData(next);
      setError("");
      return true;
    } catch {
      setError(
        "保存できませんでした。ブラウザの空き容量・保存設定を確認してください。入力内容は画面に残っています。",
      );
      return false;
    }
  }, []);
  const update = useCallback(
    (fn: (d: Data) => Data) => {
      const old = current.current,
        next = fn(old);
      const substantive = [
        "logs",
        "transactions",
        "recurring",
        "care",
        "events",
        "settings",
      ].some((k) => old[k as keyof Data] !== next[k as keyof Data]);
      if (substantive) {
        meta.current.dirty = true;
        change.current++;
      }
      return persist(next);
    },
    [persist],
  );
  const sync = useCallback(async () => {
    const db = supabase(),
      id = scope.current;
    if (!db || !id || inFlight.current || blocked.current || !navigator.onLine)
      return;
    inFlight.current = true;
    const gen = generation.current;
    try {
      while (
        meta.current.dirty &&
        scope.current === id &&
        gen === generation.current
      ) {
        const serial = change.current,
          snapshot = current.current;
        setSyncStatus("同期しています…");
        const { data: rev, error: err } = await db.rpc("nekonote_save", {
          payload: { ...snapshot, drafts: {} },
          expected_revision: meta.current.revision,
        });
        if (gen !== generation.current) return;
        if (err) {
          setSyncStatus(
            err.message.includes("sync_conflict")
              ? "別の端末で更新されています。書き出してからクラウドを読み直してください。"
              : "クラウドへ未同期です。端末内の記録は保存されています。",
          );
          return;
        }
        meta.current = {
          revision: Number(rev),
          dirty: serial !== change.current,
        };
        persist(current.current);
        setSyncStatus("同期しました");
      }
    } catch {
      setSyncStatus("接続待ちです。端末内の記録は保存されています。");
    } finally {
      inFlight.current = false;
    }
  }, [persist]);
  const activate = useCallback(
    async (nextUser: User | null) => {
      const gen = ++generation.current;
      scope.current = nextUser?.id || null;
      setUser(nextUser);
      setReady(false);
      setError("");
      blocked.current = false;
      meta.current = { revision: 0, dirty: false };
      let local = emptyData();
      try {
        const raw = localStorage.getItem(
          nextUser ? cloudKey(nextUser.id) : STORAGE_KEY,
        );
        if (raw) {
          const parsed = JSON.parse(raw);
          if (nextUser) {
            const cache = parsed as CloudCache;
            local = readData(cache.data);
            meta.current = { revision: cache.revision, dirty: cache.dirty };
          } else local = readData(parsed);
        }
      } catch {
        blocked.current = true;
        setError(
          "保存データを読み込めませんでした。元のデータは変更していません。設定から全データを削除するまで保存を停止しています。",
        );
      }
      if (nextUser && !meta.current.dirty && navigator.onLine) {
        try {
          const result = await supabase()!.rpc("nekonote_load");
          if (gen !== generation.current) return;
          if (result.error) {
            setSyncStatus(
              "クラウドの準備を確認してください。端末内には保存できます。",
            );
          } else {
            local = { ...readData(result.data.data), drafts: local.drafts };
            meta.current.revision = Number(result.data.revision);
            setSyncStatus("同期しました");
          }
        } catch {
          setSyncStatus("接続待ちです。端末内には保存できます。");
        }
      }
      if (gen !== generation.current) return;
      const last = local.settings.lastOpened;
      setWelcome(shouldWelcome(last, localDate()));
      if (last !== localDate()) {
        local = {
          ...local,
          settings: { ...local.settings, lastOpened: localDate() },
        };
        meta.current.dirty = true;
        change.current++;
      }
      current.current = local;
      setData(local);
      persist(local);
      setReady(true);
    },
    [persist],
  );
  useEffect(() => {
    const db = supabase();
    let alive = true;
    if (!db) void activate(null);
    else
      void db.auth
        .getSession()
        .then(({ data }) => {
          if (alive) void activate(data.session?.user || null);
        })
        .catch(() => {
          if (alive) void activate(null);
        });
    const sub = db?.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
        setTimeout(() => {
          if (alive && (session?.user.id || null) !== scope.current)
            void activate(session?.user || null);
        }, 0);
      }
    });
    const online = () => void sync();
    window.addEventListener("online", online);
    return () => {
      alive = false;
      generation.current++;
      sub?.data.subscription.unsubscribe();
      window.removeEventListener("online", online);
    };
  }, [activate, sync]);
  useEffect(() => {
    if (ready && user && meta.current.dirty) {
      const timer = setTimeout(() => void sync(), 800);
      return () => clearTimeout(timer);
    }
  }, [data, ready, user, sync]);
  useEffect(() => {
    if (!ready) return;
    document.documentElement.dataset.stimulus = String(data.settings.stimulus);
    try {
      localStorage.setItem("nekonote.stimulus", String(data.settings.stimulus));
    } catch {
      /* The data store reports storage errors; this is only an LP preference. */
    }
  }, [data.settings.stimulus, ready]);
  useEffect(() => {
    const resume = () => {
      if (!ready || document.visibilityState !== "visible") return;
      const today = localDate();
      if (shouldWelcome(current.current.settings.lastOpened, today))
        setWelcome(true);
      if (current.current.settings.lastOpened !== today)
        update((d) => ({
          ...d,
          settings: { ...d.settings, lastOpened: today },
        }));
      void sync();
    };
    const retry = setInterval(() => void sync(), 30000);
    document.addEventListener("visibilitychange", resume);
    return () => {
      clearInterval(retry);
      document.removeEventListener("visibilitychange", resume);
    };
  }, [update, sync, ready]);
  useEffect(() => {
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator)
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  useEffect(() => {
    const storage = (e: StorageEvent) => {
      const key = scope.current ? cloudKey(scope.current) : STORAGE_KEY;
      if (e.key !== key) return;
      try {
        if (!e.newValue) {
          current.current = emptyData();
          setData(current.current);
          return;
        }
        const parsed = JSON.parse(e.newValue);
        const next = scope.current ? readData(parsed.data) : readData(parsed);
        if (scope.current)
          meta.current = { revision: parsed.revision, dirty: parsed.dirty };
        current.current = next;
        setData(next);
      } catch {}
    };
    window.addEventListener("storage", storage);
    return () => window.removeEventListener("storage", storage);
  }, []);
  const erase = async () => {
    const id = scope.current;
    if (id) {
      const { error: err } = await supabase()!.rpc("nekonote_delete_account");
      if (err) {
        setError(
          "クラウドの削除に失敗しました。記録は残しています。接続を確認してください。",
        );
        return false;
      }
      localStorage.removeItem(cloudKey(id));
      await supabase()!.auth.signOut();
    } else localStorage.removeItem(STORAGE_KEY);
    blocked.current = false;
    await activate(null);
    setWelcome(false);
    return true;
  };
  const importGuest = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const guest = readData(JSON.parse(raw));
      update((d) => {
        const merge = <T extends { id: string }>(a: T[], b: T[]) => [
          ...a.filter((x) => !b.some((y) => y.id === x.id)),
          ...b,
        ];
        return {
          ...d,
          logs: [
            ...d.logs.filter((l) => !guest.logs.some((g) => g.date === l.date)),
            ...guest.logs,
          ],
          transactions: merge(d.transactions, guest.transactions),
          events: merge(d.events, guest.events),
          care: merge(d.care, guest.care),
          recurring: merge(d.recurring, guest.recurring),
        };
      });
    } catch {
      setError("端末内の記録を読み込めませんでした。");
    }
  };
  const reloadCloud = async () => {
    const { data: result, error: err } = await supabase()!.rpc("nekonote_load");
    if (err) {
      setError("クラウドを読み込めませんでした。");
      return;
    }
    meta.current = { revision: Number(result.revision), dirty: false };
    persist({ ...readData(result.data), drafts: current.current.drafts });
    setSyncStatus("クラウドを読み直しました");
  };
  return (
    <Context.Provider
      value={{
        data,
        ready,
        error,
        update,
        welcome,
        dismissWelcome: () => setWelcome(false),
        erase,
        user,
        syncStatus,
        sync,
        importGuest,
        reloadCloud,
      }}
    >
      {children}
    </Context.Provider>
  );
}
export function useStore() {
  const value = useContext(Context);
  if (!value) throw new Error("StoreProvider required");
  return value;
}
export function useDraft(key: string, initial: Record<string, string>) {
  const { data, update } = useStore();
  const [value, setValue] = useState(() => ({
    ...initial,
    ...data.drafts[key],
  }));
  const set = (patch: Record<string, string>) => {
    const next = { ...value, ...patch };
    setValue(next);
    update((d) => ({ ...d, drafts: { ...d.drafts, [key]: next } }));
  };
  return [value, set] as const;
}
