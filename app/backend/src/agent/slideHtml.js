// Slide HTML 生成器 —— 把 demo deck 的页数据渲染成 1280x720 HTML
// 风格：现代日本极简，深蓝 + 朱红 + 米白，Noto Sans SC
import { DEMO_DECK } from './demoDeck.js';

const { primary, accent, ink, paper, muted } = DEMO_DECK.palette;

const BASE_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:1280px;height:720px;overflow:hidden}
body{font-family:'Noto Sans SC','PingFang SC',sans-serif;color:${ink};background:${paper};position:relative}
.eyebrow{font-size:14px;letter-spacing:.3em;color:${accent};font-weight:700}
.cover{display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 90px;position:relative}
.cover::before{content:"";position:absolute;left:0;top:120px;width:8px;height:480px;background:${accent}}
.cover h1{font-size:84px;font-weight:900;color:${primary};line-height:1.05;margin-top:18px;letter-spacing:-.01em}
.cover .sub{font-size:26px;color:${muted};margin-top:24px;max-width:780px;line-height:1.5}
.cover .meta{position:absolute;right:90px;bottom:60px;font-size:16px;color:${muted};letter-spacing:.1em}
.cover .jp{position:absolute;right:90px;top:120px;font-size:160px;font-weight:900;color:${primary};opacity:.06;letter-spacing:-.02em}
.page-head{display:flex;align-items:baseline;gap:18px;padding:54px 90px 0}
.page-head .num{font-size:20px;font-weight:900;color:${accent}}
.page-head h2{font-size:44px;font-weight:900;color:${primary};letter-spacing:-.01em}
.divider{height:3px;width:60px;background:${accent};margin:14px 90px 0}
.body{padding:30px 90px}
.stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:24px}
.stat{background:#fff;border:1px solid #e5e0d6;padding:34px 30px;border-radius:4px;position:relative}
.stat::before{content:"";position:absolute;left:0;top:0;width:100%;height:3px;background:${primary}}
.stat .k{font-size:46px;font-weight:900;color:${primary}}
.stat .v{font-size:17px;color:${muted};margin-top:10px;line-height:1.5}
.insight{margin-top:34px;background:${primary};color:#fff;padding:24px 30px;border-radius:4px;font-size:20px;font-weight:500}
.grid2{display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:22px}
.cell{background:#fff;border:1px solid #e5e0d6;padding:30px;border-radius:4px;border-top:4px solid ${accent}}
.cell h3{font-size:24px;color:${primary};margin-bottom:12px}
.cell p{font-size:16px;color:${ink};line-height:1.6}
.cases{display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:24px}
.case{background:#fff;border:1px solid #e5e0d6;padding:34px;border-radius:4px;position:relative}
.case .brand{font-size:30px;font-weight:900;color:${primary}}
.case .pt{font-size:17px;color:${ink};margin-top:14px;line-height:1.6}
.case .rs{font-size:15px;color:${accent};margin-top:18px;font-weight:700;border-top:1px dashed #e5e0d6;padding-top:14px}
.chart-row{display:grid;grid-template-columns:1.4fr 1fr;gap:36px;margin-top:24px;align-items:center}
.bars{display:flex;flex-direction:column;gap:14px}
.bar-row{display:grid;grid-template-columns:96px 1fr 48px;align-items:center;gap:14px;font-size:16px}
.bar-track{height:22px;background:#eee;border-radius:2px;overflow:hidden}
.bar-fill{height:100%;background:linear-gradient(90deg,${primary},${accent})}
.bar-val{text-align:right;font-weight:700;color:${primary}}
.takeaway{background:${primary};color:#fff;padding:26px 30px;border-radius:4px;font-size:20px;line-height:1.6}
.cap{font-size:13px;color:${muted};margin-top:10px}
.closing{display:flex;flex-direction:column;justify-content:center;height:100%;padding:0 90px}
.closing h2{font-size:54px;font-weight:900;color:${primary};margin-bottom:30px}
.closing ol{list-style:none;counter-reset:s}
.closing li{counter-increment:s;font-size:22px;color:${ink};padding:14px 0 14px 56px;position:relative;line-height:1.5;border-bottom:1px solid #e5e0d6}
.closing li::before{content:counter(s);position:absolute;left:0;top:12px;width:36px;height:36px;background:${accent};color:#fff;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:18px}
.closing .end{margin-top:34px;font-size:20px;color:${accent};font-weight:700}
`;

export function buildSlideHtml(page, deck = DEMO_DECK, idx = 0, total = 6) {
  const fontLink = `<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap" rel="stylesheet">`;
  const wrap = (inner) => `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8">${fontLink}
<style>${BASE_CSS}</style></head><body>${inner}</body></html>`;

  if (page.template === 'cover') {
    return wrap(`
      <div class="cover">
        <div class="jp">日本</div>
        <div class="eyebrow">${page.eyebrow}</div>
        <h1>${page.title}</h1>
        <div class="sub">${page.subtitle}</div>
        <div class="meta">${page.meta} · ${total} 页</div>
      </div>`);
  }

  if (page.template === 'closing') {
    return wrap(`
      <div class="closing">
        <h2>${page.title}</h2>
        <ol>${page.actions.map(a => `<li>${a}</li>`).join('')}</ol>
        <div class="end">${page.closing}</div>
      </div>`);
  }

  // 通用内容页头
  const head = `
    <div class="page-head">
      <span class="num">${String(idx + 1).padStart(2, '0')} / ${String(total).padStart(2, '0')}</span>
      <h2>${page.title}</h2>
    </div>
    <div class="divider"></div>`;

  let body = '';
  if (page.bullets) {
    body = `<div class="body">
      <div class="stat-row">${page.bullets.map(b => `<div class="stat"><div class="k">${b.k}</div><div class="v">${b.v}</div></div>`).join('')}</div>
      <div class="insight">${page.insight}</div>
    </div>`;
  } else if (page.grid) {
    body = `<div class="body"><div class="grid2">${page.grid.map(g => `<div class="cell"><h3>${g.title}</h3><p>${g.desc}</p></div>`).join('')}</div></div>`;
  } else if (page.cases) {
    body = `<div class="body"><div class="cases">${page.cases.map(c => `<div class="case"><div class="brand">${c.brand}</div><div class="pt">${c.point}</div><div class="rs">${c.result}</div></div>`).join('')}</div></div>`;
  } else if (page.chart) {
    const max = Math.max(...page.chart.values);
    body = `<div class="body">
      <div class="chart-row">
        <div>
          <div class="bars">${page.chart.labels.map((l, i) => `
            <div class="bar-row">
              <span>${l}</span>
              <div class="bar-track"><div class="bar-fill" style="width:${(page.chart.values[i] / max) * 100}%"></div></div>
              <span class="bar-val">${page.chart.values[i]}${page.chart.unit}</span>
            </div>`).join('')}
          </div>
          <div class="cap">${page.chart.caption}</div>
        </div>
        <div class="takeaway">${page.takeaway}</div>
      </div>
    </div>`;
  }

  return wrap(head + body);
}
