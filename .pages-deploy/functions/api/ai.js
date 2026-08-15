/* 个人工作台 · AI 对话代理（Cloudflare Pages Function）
   作用：网页端把对话请求发到这里，服务端用 DEEPSEEK_KEY 调 DeepSeek API 再返回，
         API 密钥不进入网页代码，别人也无法直接用（需同步密钥校验）。
   依赖 Secret：SYNC_KEY（同步密钥，校验用）、DEEPSEEK_KEY（DeepSeek API 密钥） */
export async function onRequest(context) {
  const { request, env } = context;
  const cors = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Sync-Key"
  };
  if (request.method === "OPTIONS") return new Response(null, { headers: cors });

  const key = request.headers.get("X-Sync-Key") || "";
  if (key !== env.SYNC_KEY) return new Response("unauthorized", { status: 401, headers: cors });

  if (request.method === "POST") {
    let body;
    try { body = await request.json(); } catch (e) { return new Response("bad json", { status: 400, headers: cors }); }
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response("no messages", { status: 400, headers: cors });
    }
    const r = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.DEEPSEEK_KEY },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: messages,
        temperature: 0.6
      })
    });
    const j = await r.json().catch(() => ({}));
    const content = j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content;
    if (!content) {
      return new Response(JSON.stringify({ error: "AI 服务返回异常：" + (j.error ? j.error.message || JSON.stringify(j.error) : "未知错误") }), { status: 502, headers: { ...cors, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ content: content }), { headers: { ...cors, "Content-Type": "application/json" } });
  }
  return new Response("not found", { status: 404, headers: cors });
}
