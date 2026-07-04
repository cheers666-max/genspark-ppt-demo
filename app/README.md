# Genspark AI Slides 复刻版

基于工作目录里 Genspark AI Slides 的逆向分析文档（115 个弱点）+ 用户提供的完整 system prompt 与工具 schema，复刻构建的**前后端完整** AI 幻灯片生成系统。

## 架构

```
app/
├── backend/                 # Node + Express
│   └── src/
│       ├── index.js         # REST + SSE + 静态托管
│       ├── store/project.js # Project 文件系统存储（manifest + slides + .guide）
│       ├── tools/           # 工具层：镜像 Genspark 工具 schema
│       │   ├── registry.js  # initialize/insert/modify/screenshot/export/think/todo...
│       │   └── external.js  # web_search / image_generation 代理
│       ├── agent/           # Agent 编排：5 阶段 Guide Mode
│       │   ├── agent.js     # SlideAgent (LLM 模式 / Demo 模式)
│       │   ├── demoDeck.js  # 内置示例 deck：现代日本营销策略
│       │   └── slideHtml.js # HTML 生成器
│       ├── render/puppeteer.js  # 截图 + PDF + PPTX
│       └── util/pptx.js     # 零依赖最小 OOXML PPTX 生成
├── frontend/                # React + Vite
│   └── src/
│       ├── App.tsx          # 分屏 UI：左聊天 / 右预览 + View&Export 菜单
│       ├── api/client.ts    # SSE agent 流 + 工具直调
│       └── styles.css       # 手写 CSS（深色 IDE 风格）
├── OPTIMIZATION.md          # 优化分析：A 已落地 / B 高优待补 / C 系统根治
└── README.md
```

## 与原版对应关系

| Genspark 原版 | 复刻版 |
|---|---|
| 5 阶段 Guide Mode（Strategy→Substance→Structure→Surface→Execution） | `SlideAgent.runDemo/runLLM` 的 phase 事件流 |
| 工具 schema（initialize_slide/insert_new_slides/modify_slide/slide_screenshot/export_slides/think/TodoWrite/web_search/image_generation...） | `tools/registry.js` 同名 handler |
| Project store（manifest.json + slides/*.html + .guide/） | `store/project.js` 同构目录 |
| 分屏 UI（左 chat / 右 preview + View&Export） | `App.tsx` |
| Puppeteer 截图 + PPTX/PDF 导出 | `render/puppeteer.js` + `util/pptx.js` |
| Font 合规（Google Fonts） | `slideHtml.js` 内联 Noto Sans SC |
| Source A(custom) > Source B(imported) 模板去重 | `manifest.templates` + `modify_slide` 复用 `existing_temp_key` |

## 快速开始

```bash
cd app

# 1. 装依赖
cd backend && npm install && cd ../frontend && npm install && cd ..

# 2. 一键启动（前后端）
./start.sh
#   或分别启动：
#   cd backend && npm run dev   # :4000
#   cd frontend && npm run dev  # :5173

# 3. 打开 http://localhost:5173
```

## 两种运行模式

- **Demo 模式（默认）**：无 `360_API_KEY` / `OPENAI_API_KEY` 时，跑确定性 6 页「现代日本营销策略」deck，开箱即用，验证整条链路（初始化→大纲→逐页 HTML→截图→导出）。
- **360 LLM 模式（推荐）**：配置 `360_API_KEY` 后，agent 走 360 网关（`https://api.360.cn/v1`，174 个模型，OpenAI 兼容），用 `google/gemini-3.5-flash` 生成 outline 与每页 HTML。对齐 `360-api` skill（已同步到 `~/.claude/skills/360-api/`）。
- **OpenAI 模式（兼容）**：配置 `OPENAI_API_KEY` 后走 OpenAI。

```bash
# 360 LLM 模式（对齐 360-api skill）
export 360_API_KEY=fk1234.xxxxxxxx              # 或从 app-dev 取（见下）
export LLM_MODEL=google/gemini-3.5-flash        # 可选，默认 gemini-3.5-flash；也可 qwen/qwen3.7-max / deepseek-r1
# export AI360_IMAGE_MODEL=volcengine/doubao-seedream-5.0-lite  # 可选，图像生成模型

# key 从 app-dev / A800 共享卷取（本机没有该文件）：
# ssh app-dev "grep '^360_API_KEY' /home/yudejing/Agents-PPT-Template/.env | cut -d= -f2 | tr -d '\"'"

# 坑（来自 360-api skill，已内置处理）：
# - max_tokens：思考模型(gemini)给太小会返空；slide HTML 生成给 16000（已内置）
# - 网络：本机开代理时需让 360.cn 走直连，或启动前 unset http_proxy https_proxy
# - 重试：内置 retries=4 + backoff 3→30s + timeout 180s（任何异常都重试）

cd backend && npm run dev
```

三模式优先级：`360_API_KEY` > `OPENAI_API_KEY` > Demo。

## 导出

右上角 `View & Export` 菜单：
- **导出 PPTX**：每页 PNG 嵌入 OOXML，零依赖生成
- **导出 PDF**：Puppeteer print-to-pdf
- **Save as Template** / **Voice Your Slides**：预留入口（对齐原版下拉菜单）

## 优化路线

见 `OPTIMIZATION.md`。核心结论：

> 原版 115 个弱点的根因是**"规则以散文陈述，没有被强制"**。复刻版把规则下沉到后端工具层做硬拦截（phase gate / modify 上限 / 字体白名单 / 模板去重），是从根上解决的方向。

最高优先级补齐：B2 layout 几何检测 → B1 sample checkpoint → C 全部 procedural check。
