/* 个人工作台 · 云端同步 Worker（Cloudflare Workers + KV）
   部署：wrangler deploy
   环境变量：SYNC_KEY（同步密钥，部署时设置）
   KV 绑定：WB_KV（数据存储） */
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, PUT, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, X-Sync-Key"
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });

    /* 密钥校验（简单共享密钥，无登录系统的妥协方案） */
    const key = request.headers.get("X-Sync-Key") || "";
    if (key !== env.SYNC_KEY) return new Response("unauthorized", { status: 401, headers: cors });

    if (url.pathname === "/data") {
      if (request.method === "GET") {
        const v = await env.WB_KV.get("wb_main");
        return new Response(v || "{}", { headers: { ...cors, "Content-Type": "application/json" } });
      }
      if (request.method === "PUT") {
        const body = await request.text();
        if (!body || body.length > 20 * 1024 * 1024) {
          return new Response("too large (max 20MB)", { status: 413, headers: cors });
        }
        await env.WB_KV.put("wb_main", body);
        return new Response("ok", { headers: cors });
      }
    }
    return new Response("not found", { status: 404, headers: cors });
  }
};
