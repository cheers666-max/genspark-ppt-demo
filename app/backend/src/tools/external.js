// 外部服务代理 —— web_search / image_generation
// 对齐 360-api skill：360 网关 OpenAI 兼容，原生 fetch 零依赖
// 无 key 或调用失败时返回确定性占位，保持流程可演示
import { provider, chat, imageGen } from '../util/llm.js';
import { WEB_SEARCH_SYSTEM } from '../agent/prompts.js';

export async function webSearchProxy(q) {
  if (!provider) return demoSearchResult(q);
  try {
    const text = await chat([
      { role: 'system', content: WEB_SEARCH_SYSTEM },
      { role: 'user', content: q }
    ], { temperature: 0.3, max_tokens: 2048 });
    return { query: q, results: [{ title: 'LLM 概览', url: '', snippet: text }], llm: true, provider: provider.name };
  } catch (e) {
    return { ...demoSearchResult(q), fallback: true, error: e.message };
  }
}

export async function imageGenerationProxy({ query, aspect_ratio = '16:9', task_summary, image_urls = [] }) {
  if (!provider) {
    return { image_url: svgDataUri(query, aspect_ratio), demo: true };
  }
  try {
    const size = aspectRatioToSize(aspect_ratio);
    const url = await imageGen(query, { size });
    if (url) return { image_url: url, provider: provider.name };
    return { image_url: svgDataUri(query, aspect_ratio), fallback: true };
  } catch (e) {
    return { image_url: svgDataUri(query, aspect_ratio), fallback: true, error: e.message };
  }
}

function demoSearchResult(q) {
  return {
    query: q,
    results: [
      { title: `[demo] ${q} —— 搜索结果占位`, url: 'https://example.com/search-result',
        snippet: '这是复刻版的搜索占位结果。配置 360_API_KEY（推荐）或 OPENAI_API_KEY 后可获取真实内容。' }
    ],
    demo: true
  };
}

function aspectRatioToSize(ar) {
  const map = { '16:9': '1536x1024', '9:16': '1024x1536', '1:1': '1024x1024', '4:3': '1536x1024', '3:4': '1024x1536' };
  return map[ar] || '1536x1024';
}

function svgDataUri(prompt, ar) {
  return `data:image/svg+xml;utf8,` + encodeURIComponent(placeholderSvg(prompt, ar));
}

function placeholderSvg(prompt, ar) {
  const [w, h] = ar === '9:16' || ar === '3:4' ? [400, 600] : ar === '1:1' ? [500, 500] : [640, 360];
  const label = (prompt || 'image').slice(0, 60).replace(/[<>&]/g, '');
  return `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${h}'>
    <defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>
      <stop offset='0' stop-color='#1e293b'/><stop offset='1' stop-color='#475569'/>
    </linearGradient></defs>
    <rect width='100%' height='100%' fill='url(#g)'/>
    <text x='50%' y='48%' fill='#e2e8f0' font-size='${Math.floor(w/20)}' text-anchor='middle' font-family='sans-serif'>[demo image]</text>
    <text x='50%' y='56%' fill='#94a3b8' font-size='${Math.floor(w/32)}' text-anchor='middle' font-family='sans-serif'>${label}</text>
  </svg>`;
}
