// Express 服务器 —— REST 工具 API + SSE agent 事件流 + 静态资源 + 前端静态托管
import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import * as store from './store/project.js';
import { dispatch, getViewport } from './tools/registry.js';
import { SlideAgent } from './agent/agent.js';
import { DEMO_DECK } from './agent/demoDeck.js';
import { provider } from './util/llm.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.use(cors());
app.use(express.json({ limit: '20mb' }));

const activeAgents = new Map(); // project_id -> SlideAgent

// ---------- REST：通用工具 dispatch（前端可直接调用单个工具） ----------
app.post('/api/tools/:name', async (req, res) => {
  try {
    const result = await dispatch(req.params.name, req.body || {});
    res.json({ ok: true, result });
  } catch (e) {
    res.status(400).json({ ok: false, error: e.message });
  }
});

// ---------- 项目 CRUD ----------
app.get('/api/projects', async (req, res) => {
  res.json({ projects: await store.listProjects() });
});

app.get('/api/projects/:id/manifest', async (req, res) => {
  try { res.json(await store.readManifest(req.params.id)); }
  catch { res.status(404).json({ error: 'not found' }); }
});

// 单页 HTML（前端 iframe src）
app.get('/api/projects/:id/slides/:index', async (req, res) => {
  const html = await store.readSlide(req.params.id, parseInt(req.params.index));
  if (!html) return res.status(404).send('not found');
  res.type('html').send(html);
});

// 截图 / 导出 / 资源 静态文件
app.use('/api/projects/:id/screenshots', (req, res, next) => {
  const dir = path.join(store.projectDir(req.params.id), 'screenshots');
  express.static(dir)(req, res, next);
});
app.use('/api/projects/:id/exports', (req, res, next) => {
  const dir = path.join(store.projectDir(req.params.id), 'exports');
  express.static(dir)(req, res, next);
});
app.use('/api/projects/:id/assets', (req, res, next) => {
  const dir = path.join(store.projectDir(req.params.id), 'assets');
  express.static(dir)(req, res, next);
});

// ---------- Agent SSE：启动一次完整 5 阶段流程 ----------
app.post('/api/agent/run', async (req, res) => {
  const { prompt, project_id } = req.body || {};
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive'
  });
  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  const agent = new SlideAgent({ project_id, userPrompt: prompt || '现代日本营销策略' });
  activeAgents.set(agent.project_id || 'temp', agent);

  agent.on('event', ({ type, data, ts }) => send({ type, data, ts }));

  agent.on('done', ({ ok, error }) => {
    send({ type: 'done', data: { ok, error, project_id: agent.project_id } });
    res.end();
  });

  // 前端可通过单独 endpoint 回答 ask_user_questions
  agent._answerEndpoint = send;

  // 异步跑
  agent.run().catch(e => send({ type: 'error', data: { message: e.message } }));
});

// ---------- 前端回答交互问题 ----------
app.post('/api/agent/:pid/answer', (req, res) => {
  const agent = activeAgents.get(req.params.pid);
  if (agent) agent.submitAnswer(req.body);
  res.json({ ok: true });
});

// ---------- demo deck 元数据（前端首页用） ----------
app.get('/api/demo', (req, res) => res.json(DEMO_DECK));

// ---------- 前端静态托管 ----------
const frontendDir = path.resolve(__dirname, '../../frontend/dist');
app.use(express.static(frontendDir));
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(path.join(frontendDir, 'index.html'), err => {
    if (err) res.status(404).send('前端未构建，请先 cd frontend && npm run build');
  });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Genspark AI Slides 复刻后端: http://localhost:${PORT}`);
  console.log(`  LLM provider: ${provider?.name || 'demo (无 key)'}${provider ? ' chat=' + provider.chatModel : ''}`);
});
