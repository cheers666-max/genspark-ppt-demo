// LLM provider 抽象 —— 零依赖（原生 fetch），对齐 360-api skill 的 call_360.py
// 优先级：360_API_KEY → 360 网关；OPENAI_API_KEY → OpenAI；无 key → null（Demo 模式）
// 关键坑（来自 360-api skill）：
//   - max_tokens：思考模型(gemini)给太小会返空，长输出(HTML)给 16000
//   - 重试：任何异常都重试 retries=4，backoff 3→30s（不限 429）
//   - timeout：180s
//   - temperature：修复/确定性 0.3
//   - 网络：本机代理时需让 360.cn 走直连或 unset http_proxy

function pickProvider() {
  const key360 = process.env['360_API_KEY'] || process.env.API_KEY_360 || process.env.VLM_API_KEY;
  if (key360) {
    const base = process.env.LLM_BASE_URL || 'https://api.360.cn/v1';
    return {
      name: '360',
      apiKey: key360,
      chatURL: base + '/chat/completions',
      imageURL: base + '/images/generations',
      chatModel: process.env.LLM_MODEL || 'google/gemini-3.5-flash',
      imageModel: process.env.AI360_IMAGE_MODEL || process.env.IMAGE_MODEL || 'volcengine/doubao-seedream-5.0-lite'
    };
  }
  if (process.env.OPENAI_API_KEY) {
    const base = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
    return {
      name: 'openai',
      apiKey: process.env.OPENAI_API_KEY,
      chatURL: base + '/chat/completions',
      imageURL: base + '/images/generations',
      chatModel: process.env.LLM_MODEL || 'gpt-4o-mini',
      imageModel: process.env.IMAGE_MODEL || 'dall-e-3'
    };
  }
  return null;
}

export const provider = pickProvider();

// 对齐 call_360.py：retries=4, backoff 3→30s, timeout 180s, 任何异常都重试
export async function chat(messages, { temperature = 0.3, max_tokens = 4096, timeout = 180000, retries = 4 } = {}) {
  if (!provider) throw new Error('no llm provider');
  const payload = { model: provider.chatModel, messages, temperature, max_tokens };
  const headers = { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' };
  let backoff = 3000;
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      const r = await fetch(provider.chatURL, {
        method: 'POST', headers, body: JSON.stringify(payload), signal: ctrl.signal
      });
      clearTimeout(t);
      if (r.ok) {
        const j = await r.json();
        const content = j?.choices?.[0]?.message?.content;
        if (content) return content;
        console.error(`[llm] empty content (max_tokens too small? try 16000)`);
      } else {
        console.error(`[llm] http ${r.status}: ${(await r.text()).slice(0, 160)}`);
      }
    } catch (e) {
      lastErr = e;
      console.error(`[llm] ${e.message}`);
    }
    if (i < retries - 1) {
      await sleep(backoff);
      backoff = Math.min(backoff * 2, 30000);
    }
  }
  throw new Error(`${provider.name} chat failed after ${retries} retries${lastErr ? ': ' + lastErr.message : ''}`);
}

// 图像生成（对齐 ian-xiaohei gen.py：images/generations，b64_json 优先）
export async function imageGen(prompt, { size = '1536x1024', timeout = 180000, retries = 3 } = {}) {
  if (!provider) return null;
  const headers = { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' };
  let backoff = 3000;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      const r = await fetch(provider.imageURL, {
        method: 'POST', headers, body: JSON.stringify({ model: provider.imageModel, prompt, n: 1, size }),
        signal: ctrl.signal
      });
      clearTimeout(t);
      if (r.ok) {
        const d = (await r.json()).data?.[0];
        if (d?.b64_json) return `data:image/png;base64,${d.b64_json}`;
        if (d?.url) return d.url;
        return null;
      }
      console.error(`[llm:image] http ${r.status}: ${(await r.text()).slice(0, 160)}`);
    } catch (e) { console.error(`[llm:image] ${e.message}`); }
    if (i < retries - 1) { await sleep(backoff); backoff = Math.min(backoff * 2, 30000); }
  }
  throw new Error(`${provider.name} image failed after ${retries} retries`);
}

// 视觉调用（360 VLM bytedance/doubao-seed-1-6-vision，OpenAI vision 兼容格式）
export async function chatVision(messages, { temperature = 0.3, max_tokens = 2048, timeout = 180000, retries = 3, model } = {}) {
  if (!provider) throw new Error('no llm provider');
  const vlmModel = model || process.env.VLM_MODEL || 'bytedance/doubao-seed-1-6-vision';
  const payload = { model: vlmModel, messages, temperature, max_tokens };
  const headers = { Authorization: `Bearer ${provider.apiKey}`, 'Content-Type': 'application/json' };
  let backoff = 3000;
  for (let i = 0; i < retries; i++) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), timeout);
      const r = await fetch(provider.chatURL, { method: 'POST', headers, body: JSON.stringify(payload), signal: ctrl.signal });
      clearTimeout(t);
      if (r.ok) {
        const j = await r.json();
        const c = j?.choices?.[0]?.message?.content;
        if (c) return c;
      } else { console.error(`[vlm] http ${r.status}: ${(await r.text()).slice(0,160)}`); }
    } catch (e) { console.error(`[vlm] ${e.message}`); }
    if (i < retries - 1) { await sleep(backoff); backoff = Math.min(backoff * 2, 30000); }
  }
  throw new Error(`vlm failed after ${retries} retries`);
}

// 剥离 LLM 输出的 markdown 代码块包裹（```html ... ``` 或 ``` ... ```）
export function stripCodeFence(s) {
  if (!s) return s;
  let t = s.trim();
  if (t.startsWith('```')) {
    t = t.replace(/^```[a-zA-Z]*\n?/, '');
    t = t.replace(/```\s*$/, '');
  }
  return t.trim();
}

// JSON 容错（复刻 ppt-vlm-auto-eval 的 split ```json 策略）
export function parseJsonLoose(s) {
  if (!s) return null;
  try { return JSON.parse(s); } catch {}
  if (s.includes('```json')) {
    try { return JSON.parse(s.split('```json')[1].split('```')[0]); } catch {}
  }
  const m = s.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

const sleep = ms => new Promise(r => setTimeout(r, ms));
