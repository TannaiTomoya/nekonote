import { test, expect, seed, id } from "./fixtures";
import { emptyData, type Data } from "../src/lib/domain";
test("cloud contract: login, offline queue, re-login and account isolation", async ({
  page,
  context,
}) => {
  const snapshots = new Map<string, { data: Data; revision: number }>();
  const token = (uid: string) =>
    Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString(
      "base64url",
    ) +
    "." +
    Buffer.from(
      JSON.stringify({
        sub: uid,
        exp: Math.floor(Date.now() / 1000) + 3600,
        aud: "authenticated",
      }),
    ).toString("base64url") +
    ".test-signature";
  await context.route(
    "https://rqusgymjgkvzraoeekad.supabase.co/**",
    async (route) => {
      const req = route.request(),
        url = new URL(req.url());
      if (url.pathname === "/auth/v1/token") {
        const body = req.postDataJSON();
        const uid = body.email.startsWith("a@") ? id(101) : id(102);
        const user = {
          id: uid,
          aud: "authenticated",
          email: body.email,
          app_metadata: { provider: "email" },
          user_metadata: {},
          created_at: new Date().toISOString(),
        };
        return route.fulfill({
          json: {
            access_token: token(uid),
            refresh_token: "test-refresh",
            token_type: "bearer",
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
            user,
          },
        });
      }
      if (url.pathname === "/auth/v1/logout")
        return route.fulfill({ json: {} });
      const bearer = req.headers().authorization?.split(" ")[1];
      const uid = bearer
        ? JSON.parse(Buffer.from(bearer.split(".")[1], "base64url").toString())
            .sub
        : null;
      if (!uid)
        return route.fulfill({
          status: 401,
          json: { message: "not authenticated" },
        });
      if (!snapshots.has(uid)) {
        const data = emptyData();
        data.settings.onboarded = true;
        snapshots.set(uid, { data, revision: 0 });
      }
      const snapshot = snapshots.get(uid)!;
      if (url.pathname.endsWith("/nekonote_load"))
        return route.fulfill({ json: snapshot });
      if (url.pathname.endsWith("/nekonote_save")) {
        const body = req.postDataJSON();
        if (snapshot.revision !== body.expected_revision)
          return route.fulfill({
            status: 400,
            json: { message: "sync_conflict" },
          });
        snapshot.data = body.payload;
        snapshot.revision++;
        return route.fulfill({ json: snapshot.revision });
      }
      return route.fulfill({
        status: 404,
        json: { message: "unexpected endpoint" },
      });
    },
  );
  await seed(page);
  const login = async (email: string) => {
    await page.goto("/settings");
    await page.getByLabel("メールアドレス", { exact: true }).fill(email);
    await page
      .getByLabel("パスワード", { exact: true })
      .fill("test-password-not-real");
    await page.getByRole("button", { name: "ログイン", exact: true }).click();
    await expect(
      page.getByText(`ログイン中：${email}`, { exact: true }),
    ).toBeVisible();
  };
  await login("a@example.invalid");
  await page.goto("/today/mood");
  await page.getByRole("button", { name: "ふつう", exact: true }).click();
  await page.getByLabel("ひとことメモ", { exact: true }).fill("Aさんの記録");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect
    .poll(() => snapshots.get(id(101))?.data.logs[0]?.note)
    .toBe("Aさんの記録");
  await page.goto("/today/mood");
  await context.setOffline(true);
  await page
    .getByLabel("ひとことメモ", { exact: true })
    .fill("Aさんのオフライン記録");
  await page.getByRole("button", { name: "保存する", exact: true }).click();
  await expect(
    page.getByText("この日の記録：Aさんのオフライン記録"),
  ).toBeVisible();
  await context.setOffline(false);
  await expect
    .poll(() => snapshots.get(id(101))?.data.logs[0]?.note)
    .toBe("Aさんのオフライン記録");
  await page.goto("/settings");
  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "ログイン", exact: true }),
  ).toBeVisible();
  await login("b@example.invalid");
  await page.goto("/today");
  await expect(page.getByText(/Aさんの/)).toHaveCount(0);
  await page.goto("/settings");
  await page.getByRole("button", { name: "ログアウト", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "ログイン", exact: true }),
  ).toBeVisible();
  await login("a@example.invalid");
  await page.goto("/today");
  await expect(
    page.getByText("この日の記録：Aさんのオフライン記録"),
  ).toBeVisible();
});
