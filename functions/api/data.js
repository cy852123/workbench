/* 个人工作台 · 云端同步（Cloudflare Pages Function）
   依赖 Pages 环境变量/Secret：SYNC_KEY（同步密钥）、CF_TOKEN（API Token）、CF_ACCOUNT_ID、CF_KV_NS（KV 命名空间 ID） */
export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Sync-Key"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  const key = request.headers.get("X-Sync-Key") || "";
  if (key !== env.SYNC_KEY) return new Response("unauthorized", { status: 401, headers: cors });

  const kvUrl = "https://api.cloudflare.com/client/v4/accounts/" + env.CF_ACCOUNT_ID +
    "/storage/kv/namespaces/" + env.CF_KV_NS + "/values/wb_main";
  const auth = { "Authorization": "Bearer " + env.CF_TOKEN };

  if (url.pathname.endsWith("/data")) {
    if (request.method === "GET") {
      const r = await fetch(kvUrl, { headers: auth });
      const body = r.ok ? await r.text() : "{}";
      return new Response(body, { headers: { ...cors, "Content-Type": "application/json" } });
    }
    if (request.method === "PUT") {
      const body = await request.text();
      if (!body || body.length > 20 * 1024 * 1024) {
        return new Response("too large (max 20MB)", { status: 413, headers: cors });
      }
      const r = await fetch(kvUrl, { method: "PUT", headers: { ...auth, "Content-Type": "text/plain" }, body });
      return new Response(r.ok ? "ok" : "kv error", { status: r.ok ? 200 : 502, headers: cors });
    }
  }
  return new Response("not found", { status: 404, headers: cors });
}
