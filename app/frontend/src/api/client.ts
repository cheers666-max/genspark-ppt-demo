// 前端 API 客户端：启动 agent SSE 流 + 工具直调
export async function runAgent(prompt: string, onEvent: (e: any) => void) {
  const resp = await fetch('/api/agent/run', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt })
  });
  if (!resp.body) return;
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n\n');
    buf = lines.pop() || '';
    for (const line of lines) {
      const data = line.replace(/^data: /, '').trim();
      if (data) {
        try { onEvent(JSON.parse(data)); } catch {}
      }
    }
  }
}

export async function getManifest(projectId: string) {
  const r = await fetch(`/api/projects/${projectId}/manifest`);
  return r.json();
}

export async function callTool(name: string, params: any) {
  const r = await fetch(`/api/tools/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  return r.json();
}

export function slideUrl(projectId: string, index: number) {
  return `/api/projects/${projectId}/slides/${index}`;
}

export function exportUrl(projectId: string, format: 'pptx' | 'pdf') {
  return `/api/projects/${projectId}/exports/japan_marketing.${format}`;
}
