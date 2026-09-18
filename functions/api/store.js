/* 个人工作台 · Hermes 内容存储（Cloudflare Pages Function）
   GET /api/store?key=feed    → Hermes 整理的学习资料流（网页端展示）
   GET /api/store?key=report  → Hermes 生成的周报/月报
   PUT /api/store?key=feed    → 写入（Hermes 调用，body 为 JSON）
   PUT /api/store?key=report  → 写入

   设计说明：
   - 只开放白名单里的 key，避免这个接口变成「任意 KV 读写代理」。
   - 与 /api/learnpack 同构（同样存 KV、同样用 X-Sync-Key 校验），
     但把 key 收敛到白名单里，以后加内容类型只改 ALLOW 一行。
   依赖 Secret：SYNC_KEY、CF_ACCOUNT_ID、CF_KV_NS、CF_TOKEN */
const ALLOW = { feed: "wb_feed", report: "wb_report" };

export async function onRequest(context) {
  const { request, env } = context;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Sync-Key"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  const key = request.headers.get("X-Sync-Key") || "";
  if (key !== env.SYNC_KEY) return new Response("unauthorized", { status: 401, headers: cors });

  const name = ALLOW[new URL(request.url).searchParams.get("key") || ""];
  if (!name) return new Response("bad key", { status: 400, headers: cors });

  const kvUrl = "https://api.cloudflare.com/client/v4/accounts/" + env.CF_ACCOUNT_ID +
    "/storage/kv/namespaces/" + env.CF_KV_NS + "/values/" + name;
  const auth = { "Authorization": "Bearer " + env.CF_TOKEN };

  if (request.method === "GET") {
    const r = await fetch(kvUrl, { headers: auth });
    const body = r.ok ? await r.text() : "{}";
    return new Response(body, { headers: { ...cors, "Content-Type": "application/json" } });
  }
  if (request.method === "PUT") {
    const body = await request.text();
    if (!body || body.length > 300 * 1024) return new Response("too large", { status: 413, headers: cors });
    const r = await fetch(kvUrl, {
      method: "PUT",
      headers: { ...auth, "Content-Type": "text/plain" },
      body
    });
    return new Response(r.ok ? "ok" : "kv error", { status: r.ok ? 200 : 502, headers: cors });
  }
  return new Response("not found", { status: 404, headers: cors });
}
