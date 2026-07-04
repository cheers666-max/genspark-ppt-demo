// 从 prompts.js 自动生成 prompts.html（prompt 改了页面自动同步）
import { writeFileSync } from 'node:fs';
import * as P from './prompts.js';

const list = [
  ['SYSTEM_PROMPT', '全局', 'Agent 人设 + 5 阶段 + 核心原则', 'gen', P.SYSTEM_PROMPT],
  ['OUTLINE_USER', 'Phase 3', 'outline 生成 user prompt（含 researchCtx）', 'gen', P.OUTLINE_USER('搜索素材摘要示例...')],
  ['HTML_CONTENT_SYSTEM', 'Phase 5', '生成 content 页 system（含 palette 变量）', 'gen', P.HTML_CONTENT_SYSTEM(['#1e3a5f','#d63031','#6b7280','#f7f3ec'])],
  ['HTML_CONTENT_USER', 'Phase 5', '生成 content 页 user', 'gen', P.HTML_CONTENT_USER({page:3,title:'消费者告别物欲',brief:'四大体验消费浪潮...'}, '\n# 可用图片\n<img src="...">')],
  ['HTML_TOC_SYSTEM', 'Phase 5', '生成 toc 目录页 system', 'gen', P.HTML_TOC_SYSTEM(['#1e3a5f','#d63031','#6b7280','#f7f3ec'])],
  ['HTML_TOC_USER', 'Phase 5', '生成 toc 目录页 user（含条目）', 'gen', P.HTML_TOC_USER({title:'目录/CONTENTS',brief:'列出后续各页'}, ['3. 消费者告别物欲','4. 星野リゾート','5. 中目黑星巴克','6. 重构 CX 触点','7. 创造瞬间'])],
  ['FIX_SYSTEM', 'Phase 5', '修复循环 system（按 issue 类型修法）', 'fix', P.FIX_SYSTEM],
  ['FIX_USER', 'Phase 5', '修复循环 user（curBody + issues）', 'fix', P.FIX_USER('<div>当前 HTML body 示例...</div>', [{type:'overflow',severity:'high',msg:'元素溢出 viewport (50,600 - 1320,720)'}])],
  ['READ_IMAGE_SELFCHECK', 'Phase 6', 'VLM 自检 6 维评价', 'vlm', P.READ_IMAGE_SELFCHECK],
  ['READ_IMAGE_VERIFY', 'Phase 4', 'VLM 验图相关性', 'vlm', P.READ_IMAGE_VERIFY],
  ['WEB_SEARCH_SYSTEM', 'Phase 2', 'web_search 研究', 'res', P.WEB_SEARCH_SYSTEM],
  ['SCHOLAR_SYSTEM', 'Phase 2', 'scholar_search 学术', 'res', P.SCHOLAR_SYSTEM],
  ['VIDEO_SEARCH_SYSTEM', 'Phase 2', 'video_search YouTube', 'res', P.VIDEO_SEARCH_SYSTEM],
  ['UNDERSTAND_VIDEO_SYSTEM', 'Phase 2', 'understand_video 转录', 'res', P.UNDERSTAND_VIDEO_SYSTEM],
  ['CRAWLER_FALLBACK_SYSTEM', 'Phase 2', 'crawler 抓取 fallback', 'res', P.CRAWLER_FALLBACK_SYSTEM],
  ['SUMMARIZE_SYSTEM', 'Phase 2', 'summarize_large_document 问答', 'res', P.SUMMARIZE_SYSTEM],
  ['IMAGE_GEN_QUERY', 'Phase 4', 'image_generation 主题图', 'gen', P.IMAGE_GEN_QUERY('现代日本营销策略', ['#1e3a5f','#d63031','#6b7280','#f7f3ec'])],
];

const esc = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const pillCls = { gen:'gen', fix:'fix', vlm:'vlm', res:'res' };
const pillLabel = { gen:'生成', fix:'修复', vlm:'VLM', res:'研究' };

const cards = list.map(([name, phase, purpose, type, content]) => `
<div class="card ${type}">
  <div class="card-head">
    <span class="tool">${name}</span>
    <span class="phase">${phase}</span>
    <span class="purpose">${purpose}</span>
    <span class="pill ${pillCls[type]}">${pillLabel[type]}</span>
  </div>
  <div class="field"><div class="lbl">完整 prompt</div><pre>${esc(content)}</pre></div>
</div>`).join('');

const html = `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Prompt 规范化全览 · 自动生成</title><link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:'Noto Sans SC',sans-serif;background:#0b1220;color:#e2e8f0;line-height:1.6}
.wrap{max-width:1200px;margin:0 auto;padding:32px 20px 60px}
.hero{padding:28px 0 32px;border-bottom:1px solid #1e293b;margin-bottom:24px}
.hero .tag{font-size:12px;letter-spacing:.3em;color:#d9383a;font-weight:700}
.hero h1{font-size:28px;font-weight:900;color:#fff;margin-top:8px}
.hero .sub{font-size:13px;color:#94a3b8;margin-top:8px}
.hero .auto{font-size:11px;color:#22c55e;margin-top:10px;font-family:'JetBrains Mono',monospace}
.legend{background:#111827;border:1px solid #1e293b;border-radius:8px;padding:14px 18px;margin-bottom:24px;font-size:13px;color:#cbd5e1}
.legend .pill{display:inline-block;font-size:10px;padding:2px 8px;border-radius:10px;margin:0 4px;font-weight:700}
.pill.gen{background:#d9383a;color:#fff}.pill.fix{background:#f59e0b;color:#000}.pill.vlm{background:#a855f7;color:#fff}.pill.res{background:#22c55e;color:#000}
.card{background:#111827;border:1px solid #1e293b;border-radius:10px;padding:18px 20px;margin-bottom:14px;border-left:3px solid #334155}
.card.gen{border-left-color:#d9383a}.card.fix{border-left-color:#f59e0b}.card.vlm{border-left-color:#a855f7}.card.res{border-left-color:#22c55e}
.card-head{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:10px}
.tool{font-family:'JetBrains Mono',monospace;font-weight:700;color:#fff;font-size:14px}
.phase{font-size:11px;color:#06b6d4;border:1px solid #06b6d4;padding:1px 8px;border-radius:10px}
.purpose{font-size:12px;color:#94a3b8}
.card-head .pill{margin-left:auto}
.field .lbl{font-size:10px;letter-spacing:.2em;color:#64748b;font-weight:700;text-transform:uppercase;margin-bottom:6px}
pre{background:#0b1220;border:1px solid #1e293b;border-radius:6px;padding:14px;font-family:'JetBrains Mono',monospace;font-size:11.5px;color:#cbd5e1;white-space:pre-wrap;word-break:break-word;line-height:1.6;overflow-x:auto}
.foot{margin-top:36px;padding-top:18px;border-top:1px solid #1e293b;font-size:12px;color:#64748b;text-align:center}
.foot a{color:#06b6d4;text-decoration:none}
</style></head><body><div class="wrap">
<div class="hero">
<div class="tag">PROMPT 规范化全览</div>
<h1>17 个 LLM Prompt 完整内容</h1>
<div class="sub">从 prompts.js 自动生成 · 角色定义/输出格式/约束/失败模式/语言风格 全面规范化</div>
<div class="auto">✓ auto-generated from backend/src/agent/prompts.js — prompt 改了页面自动同步</div>
</div>
<div class="legend">
<b>图例：</b><span class="pill gen">生成</span> 生成 HTML/内容/图 &nbsp; <span class="pill fix">修复</span> 布局修复 &nbsp; <span class="pill vlm">VLM</span> 视觉理解 &nbsp; <span class="pill res">研究</span> 搜索/摘要<br>
<b>优化维度：</b>① 角色定义精确 ② 输出格式明确（JSON schema/HTML 约束）③ 约束与禁止项 ④ 质量要求 ⑤ 失败模式 ⑥ 语言风格 ⑦ 色彩一致性（HTML 用 CSS 变量 var(--c1) 而非自填 hex）
</div>
${cards}
<div class="foot">17 个 prompt 自动生成自 <a href="https://github.com/cheers666-max/genspark-ppt-demo/blob/main/app/backend/src/agent/prompts.js" target="_blank">prompts.js</a> · 仓库 <a href="https://github.com/cheers666-max/genspark-ppt-demo" target="_blank">cheers666-max/genspark-ppt-demo</a></div>
</div></body></html>`;

writeFileSync('/tmp/prompts_auto.html', html);
console.log('wrote /tmp/prompts_auto.html', html.length, 'bytes,', list.length, 'prompts');
