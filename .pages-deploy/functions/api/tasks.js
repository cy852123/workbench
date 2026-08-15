/* 个人工作台 · AI 任务下发（Cloudflare Pages Function）
   GET  /api/tasks → 返回 {date, tasks:[{title, note, subject}]}（网页今日页展示）
   PUT  /api/tasks → 写入（Hermes 定时任务每天调用）
   依赖 Secret：SYNC_KEY */
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

  const kvUrl = "https://api.cloudflare.com/client/v4/accounts/" + env.CF_ACCOUNT_ID +
    "/storage/kv/namespaces/" + env.CF_KV_NS + "/values/wb_tasks";
  const auth = { "Authorization": "Bearer " + env.CF_TOKEN };

  if (request.method === "GET") {
    const r = await fetch(kvUrl, { headers: auth });
    const body = r.ok ? await r.text() : "{}";
    return new Response(body, { headers: { ...cors, "Content-Type": "application/json" } });
  }
  if (request.method === "PUT") {
    const body = await request.text();
    if (!body || body.length > 200 * 1024) return new Response("too large", { status: 413, headers: cors });
    const r = await fetch(kvUrl, { method: "PUT", headers: { ...auth, "Content-Type": "text/plain" }, body });
    return new Response(r.ok ? "ok" : "kv error", { status: r.ok ? 200 : 502, headers: cors });
  }
  return new Response("not found", { status: 404, headers: cors });
}
