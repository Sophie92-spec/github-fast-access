// Cloudflare Worker — 全站访问统计（GitHub Hosts 加速工具）
// KV 命名空间绑定变量名: GH_STATS
// 免费额度对个人项目足够：Workers 每日 10 万次请求，KV 免费档足够本项目量级。
//
// 接口：GET /  ->  { pv, uv, today, trend:[30] }   （每次请求同时 +1 计数）
//   pv    = 累计页面访问（Page Views）
//   uv    = 独立访客（按浏览器 cookie 去重，1 年有效期）
//   today = 今日访问次数
//   trend = 近 30 天每日访问次数，索引 0 = 29 天前 ... 索引 29 = 今天
//
// 部署：在 Cloudflare 控制台新建 Worker，粘贴本文件，绑一个 KV 命名空间（变量名 GH_STATS）；
// 或用 wrangler：先把 wrangler.toml 里的 id 换成你的 KV 命名空间 ID，再 `wrangler deploy`。

const DAYS = 30;

// 日期键：offset=0 今天，offset=1 昨天…… 用 UTC 与前端保持一致
function dayKey(offset) {
  const d = new Date(Date.now() - offset * 86400000);
  return 'd:' + d.toISOString().slice(0, 10);
}

function corsHeaders(origin) {
  const h = {
    'access-control-allow-methods': 'GET, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '86400',
  };
  if (origin) {
    // 跨站 fetch 带 cookie 必须回显具体源并允许凭证（不能用 *）
    h['access-control-allow-origin'] = origin;
    h['access-control-allow-credentials'] = 'true';
  } else {
    h['access-control-allow-origin'] = '*';
  }
  return h;
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...corsHeaders(origin),
    },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('origin');

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders(origin) });
    }
    if (request.method !== 'GET') {
      return json({ error: 'method not allowed' }, 405, origin);
    }

    const kv = env.GH_STATS;
    if (!kv) {
      return json({ error: 'KV not bound' }, 500, origin);
    }

    const cookie = request.headers.get('cookie') || '';
    const hasUid = /(^|;\s*)__gh_uid=/.test(cookie);

    // 读取累计值
    let pv = Number(await kv.get('pv')) || 0;
    let uv = Number(await kv.get('uv')) || 0;

    // 本次访问 +1
    pv += 1;
    const tk = dayKey(0);
    let today = Number(await kv.get(tk)) || 0;
    today += 1;

    // 回写（用 waitFor，不阻塞响应）
    const writes = [
      kv.put('pv', String(pv)),
      kv.put(tk, String(today)),
    ];
    if (!hasUid) {
      uv += 1;
      writes.push(kv.put('uv', String(uv)));
    }
    ctx.waitUntil(Promise.all(writes));

    // 近 30 天趋势（并行读取，oldest -> newest）
    const keys = [];
    for (let i = DAYS - 1; i >= 0; i--) keys.push(dayKey(i));
    const raw = await Promise.all(keys.map((k) => kv.get(k)));
    const trend = raw.map((v) => Number(v) || 0);

    const res = json({ pv, uv, today, trend }, 200, origin);

    // 给新访客下发 UV 去重 cookie（跨站 fetch 需 SameSite=None; Secure）
    if (!hasUid) {
      res.headers.append(
        'set-cookie',
        '__gh_uid=' + crypto.randomUUID() +
          '; Max-Age=31536000; Path=/; SameSite=None; Secure; HttpOnly'
      );
    }
    return res;
  },
};
