import { useEffect, useRef, useState } from 'react';
import { runAgent, slideUrl, exportUrl, getManifest } from './api/client';

type Msg = { id: string; who: 'user' | 'agent'; text: string };
type Todo = { id: string; content: string; status: 'pending' | 'in_progress' | 'completed'; priority: string };
type SlideInfo = { index: number; title: string; screenshot?: string };

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([
    { id: '0', who: 'agent', text: '你好，我是 Genspark AI Slides 复刻版。输入主题即可生成演示文稿（默认 Demo 模式，配 OPENAI_API_KEY 后走 LLM 模式）。' }
  ]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [phase, setPhase] = useState<string>('');
  const [projectId, setProjectId] = useState<string>('');
  const [slides, setSlides] = useState<SlideInfo[]>([]);
  const [current, setCurrent] = useState(1);
  const [total, setTotal] = useState(0);
  const [running, setRunning] = useState(false);
  const [input, setInput] = useState('现代日本营销策略：从「物」到「事」的体验经济打法');
  const [menuOpen, setMenuOpen] = useState(false);
  const [hasLLM, setHasLLM] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/projects').then(r => r.json()).then(() => {});
  }, []);

  useEffect(() => { logRef.current?.scrollTo(0, logRef.current.scrollHeight); }, [messages, phase]);

  const addMsg = (who: 'user' | 'agent', text: string) =>
    setMessages(m => [...m, { id: Math.random().toString(36), who, text }]);

  const handleEvent = (e: any) => {
    switch (e.type) {
      case 'project': setProjectId(e.data.project_id); setTotal(e.data.manifest?.slides?.length || 0); break;
      case 'phase': setPhase(`Phase ${e.data.phase} · ${e.data.name} — ${e.data.note}`); break;
      case 'reply': addMsg('agent', e.data.text); break;
      case 'todo': setTodos(e.data.todos); break;
      case 'tool_call':
        setMessages(m => [...m, { id: Math.random().toString(36), who: 'agent', text: `🔧 工具调用: ${e.data.name}` }]);
        break;
      case 'outline': addMsg('agent', `大纲已生成：${e.data.outline?.pages?.length || 0} 页`); break;
      case 'slide':
        setSlides(s => [...s.filter(x => x.index !== e.data.index), { index: e.data.index, title: e.data.title, screenshot: e.data.screenshot }]);
        setCurrent(e.data.index);
        break;
      case 'done':
        setRunning(false);
        if (e.data.ok) { setPhase(''); addMsg('agent', '✅ 全部完成，可导出 PPTX/PDF。'); }
        else addMsg('agent', `❌ 出错：${e.data.error}`);
        break;
      case 'error': addMsg('agent', `错误：${e.data.message}`); break;
    }
  };

  const start = async () => {
    if (!input.trim() || running) return;
    setRunning(true); setSlides([]); setTodos([]); setPhase('');
    addMsg('user', input);
    await runAgent(input, handleEvent);
  };

  const handleExport = async (format: 'pptx' | 'pdf') => {
    setMenuOpen(false);
    if (!projectId) return;
    addMsg('agent', `导出 ${format.toUpperCase()} 中，约需 1 分钟…`);
    const r = await fetch('/api/tools/export_slides', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ project_id: projectId, format })
    });
    const j = await r.json();
    if (j.ok) {
      window.open(j.result.url, '_blank');
      addMsg('agent', `导出完成：${j.result.url}`);
    } else addMsg('agent', `导出失败：${j.error}`);
  };

  // 自适应缩放
  const scale = Math.min(1, (window.innerWidth - 420 - 80) / 1280);

  return (
    <div className="app">
      {/* 左：聊天 */}
      <div className="chat">
        <div className="chat-head">
          <div className="logo">GS</div>
          <div>
            <h1>AI Slides · 复刻版</h1>
            <div className="sub">Genspark Guide Mode 5 阶段流程</div>
          </div>
        </div>

        <div className="messages" ref={logRef}>
          {messages.map(m => (
            <div key={m.id} className={`msg ${m.who}`}>
              <div className="who">{m.who === 'user' ? '你' : 'AI 设计师'}</div>
              {m.text}
            </div>
          ))}
          {phase && <div className="phase">{phase}</div>}
        </div>

        <div className="todos">
          <h4>TASKS</h4>
          {todos.map(t => (
            <div key={t.id} className={`todo-item ${t.status === 'completed' ? 'done' : t.status === 'in_progress' ? 'active' : ''}`}>
              <span className="box">{t.status === 'completed' ? '✓' : ''}</span>
              <span>{t.content}</span>
            </div>
          ))}
        </div>

        <div className="input-area">
          <textarea rows={3} value={input} onChange={e => setInput(e.target.value)} placeholder="输入演示主题…" />
          <div className="row">
            <button className="btn" onClick={start} disabled={running}>{running ? '生成中…' : '生成幻灯片'}</button>
            <span className="mode-tag">{hasLLM ? <span className="live">● LLM 模式</span> : '● Demo 模式'}</span>
          </div>
        </div>
      </div>

      {/* 右：预览 */}
      <div className="preview">
        <div className="prev-head">
          <div className="title">{projectId ? `project: ${projectId}` : '尚未生成'}</div>
          <div className="pages">
            {slides.sort((a,b)=>a.index-b.index).map(s => (
              <span key={s.index} className={`page-chip ${current === s.index ? 'active' : ''}`} onClick={() => setCurrent(s.index)}>
                {s.index}. {s.title}
              </span>
            ))}
          </div>
          <div className="dropdown">
            <button className="btn ghost" onClick={() => setMenuOpen(o => !o)}>View & Export ▾</button>
            {menuOpen && (
              <div className="menu">
                <button onClick={() => handleExport('pptx')}>导出 PPTX</button>
                <button onClick={() => handleExport('pdf')}>导出 PDF</button>
                <button onClick={() => { setMenuOpen(false); addMsg('agent', '「Save as Template」：在 Genspark 原版中可保存为复用模板（本复刻版已将每页模板写入 manifest.templates）。'); }}>Save as Template</button>
                <button onClick={() => { setMenuOpen(false); addMsg('agent', '「Voice Your Slides」：可用 create_agent(type=podcasts) 生成播客音频（本复刻版预留接口）。'); }}>Voice Your Slides</button>
              </div>
            )}
          </div>
        </div>

        <div className="stage">
          {!projectId ? (
            <div className="empty">
              <h3>预览面板</h3>
              <p>左侧输入主题并点击「生成幻灯片」，这里会实时渲染 1280×720 的 HTML 幻灯片。</p>
            </div>
          ) : (
            <div className="slide-frame" style={{ transform: `scale(${scale})` }}>
              <iframe src={slideUrl(projectId, current)} title={`slide ${current}`} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
