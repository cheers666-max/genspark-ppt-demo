# Genspark AI Slides 复刻版 —— 优化分析

本文基于 `app/` 复刻实现 + 工作目录里 115 个已识别弱点，提炼出**可执行**的优化点，分三层：A. 复刻版已落地的改进；B. 高优先级待补；C. 系统级根治。

---

## A. 复刻版相对原版的改进（已落地）

| # | 原版弱点（出处） | 复刻版做法 |
|---|---|---|
| A1 | "规则以散文形式陈述，没有强制检查"（06-prompt CX1） | 把 Phase 门禁做成**代码级状态机**（`SlideAgent` 的 phase 字段 + `callTool` 钩子），slide-creation 工具在 Phase<5 时直接拒绝 |
| A2 | TodoWrite 可见性靠 LLM 自觉（00-overview） | 后端持久化 `manifest.todos`，前端实时渲染，agent 每步自动 `markTodo` |
| A3 | 工具调用对用户不透明 | SSE 推送每次 `tool_call`/`tool_result`，前端显示工具徽章 |
| A4 | screenshot 只给 LLM 看，用户看不到 | 截图同时落盘 `screenshots/` 并前端可访问，debug 时用户也能看 |
| A5 | PPTX 导出是黑盒 | 手写最小 OOXML PPTX 生成器（`util/pptx.js`），零依赖、可读、可改 |
| A6 | 无 key 无法体验流程 | Demo 模式：确定性 6 页 deck，开箱即用，验证整条链路 |
| A7 | 单页修改上限靠 LLM 自控 | 后端 `modify_slide` 计数，>10 次硬停（对齐原版规则但真正落地） |

## B. 高优先级待补（按影响排序）

### B1. 真正的「sample checkpoint」门禁 ⭐⭐⭐
原版 Phase 5 要求先做 1-2 页 sample 经用户确认再批量建。复刻版目前直接全建。
**改法**：`SlideAgent.runDemo` 拆两段，第 1 页后 `askUser`，前端 `QuestionCard` 组件回传后再继续。

### B2. layout 几何检测（check_slide_layout） ⭐⭐⭐
原版有 headless 几何分析（重叠/溢出/越界）。复刻版只有截图。
**改法**：在 `render/puppeteer.js` 里加 `checkLayout(project_id, index)`，用 `page.evaluate` 取所有元素 boundingRect，检测溢出 viewport / 重叠，返回 FIX 列表。已有现成 skill `ppt-layout-repair` 可对接 `http://10.242.11.84:8765`。

### B3. data_verify 子代理闭环 ⭐⭐
原版用 sub-agent 跑事实核查直到 PASS。复刻版只有 `think` 自检。
**改法**：`agent/subAgent.js` 用 `Task` 模式起独立 `SlideAgent` 实例跑 review，输出 `review/<deck>.md`，主 agent 读后修复再跑一轮，直到 PASS。

### B4. source-map 强制溯源 ⭐⭐
原版要求每条事实可溯源到 user material 或 session-retrieved source。复刻版 demo 数据是虚构示意。
**改法**：`modify_slide` 入参加 `claims: [{text, source_url}]`，写进 manifest，前端在 slide 上标角标链接 source。

### B5. outline 先于建页 ⭐⭐
原版 `insert_new_slides` 会生成正式 outline 决定模板分配。复刻版 outline 较弱。
**改法**：LLM 模式已有；Demo 模式应把 `DEMO_DECK.pages` 的 template/layout_desc 写进 outline 让用户先确认。

## C. 系统级根治（对应 06-prompt-mechanism 5 个跨切模式）

| 模式 | 根治方式 |
|---|---|
| CX1 规则不强制 | **全部 prose 规则转成 procedural check**：phase gate / modify count / source-required / template-exists，在 `callTool` 钩子里统一拦截 |
| CX2 长流程注意力衰减 | `.guide/` 工件每 phase 末落盘，agent 每 turn 重新 `readGuide` 重建状态，而非靠上下文记忆 |
| CX3 工具语义漂移 | 工具 schema 固定 + 后端校验入参（zod），LLM 不能传错参 |
| CX4 模板去重优先级 | manifest.templates 维护，Source A(custom) > Source B(imported)，`modify_slide` 用 `existing_temp_key` 时复用 |
| CX5 字体合规 | 后端在 `modify_slide` 里扫 html，非 Google Fonts 白名单则替换为 Noto Sans SC |

## D. 工程化提升

- **并发**：原版鼓励研究/截图并行。复刻版截图当前串行，可改 `Promise.all` 批量截图（每批 5-8 页）
- **缓存**：相同 HTML 内容的截图用 SHA-256 缓存（已有 skill `content-hash-cache-pattern`）
- **可观测**：SSE 事件加 `ts` 已做；补一个 `/api/projects/:id/timeline` 回放整次构建
- **沙箱**：原版 Computer 沙箱隔离执行；复刻版可直接用 Docker 跑 puppeteer，避免污染宿主
- **导出质量**：当前 PPTX 是"每页一张全图"，升级为真实文本+图层（用 pptxgenjs 或 puppeteer print-to-pptx）

## E. 优先级建议（落地顺序）

1. B2 layout 检测（对接已有 ppt-layout-repair 服务，1 天）
2. B1 sample checkpoint 门禁（半天）
3. C 全部 procedural check（1-2 天，最高杠杆）
4. B3 data_verify 闭环（1 天）
5. B4 source-map 强制溯源（半天）
6. D 工程化（按需）

> 一句话总结：原版 115 个弱点的根因是**"规则存在但不被强制"**。复刻版把规则下沉到后端工具层做硬拦截，是从根上解决的方向。
