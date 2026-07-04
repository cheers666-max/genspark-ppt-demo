// Project store —— 持久化、按 project 隔离的文件系统存储
// 镜像 Genspark 的 Project store：每个 deck 一个 .slides 目录 + .guide 内部目录
import fs from 'node:fs/promises';
import path from 'node:path';
import { nanoid } from 'nanoid';

export const ROOT = path.resolve(process.cwd(), 'projects');

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
  return p;
}

export async function listProjects() {
  try {
    const entries = await fs.readdir(ROOT, { withFileTypes: true });
    const out = [];
    for (const e of entries) {
      if (!e.isDirectory()) continue;
      const manifestPath = path.join(ROOT, e.name, 'manifest.json');
      try {
        const m = JSON.parse(await fs.readFile(manifestPath, 'utf8'));
        out.push({ id: e.name, ...m });
      } catch {
        out.push({ id: e.name, display_name: e.name, slides: [] });
      }
    }
    return out;
  } catch {
    return [];
  }
}

export async function createProject({ display_name, file_prefix, description, width = 1280, height = 720, design_brand_reference = '' }) {
  const id = nanoid(10);
  const dir = await ensureDir(path.join(ROOT, id));
  await ensureDir(path.join(dir, 'slides'));
  await ensureDir(path.join(dir, 'assets'));
  await ensureDir(path.join(dir, '.guide'));
  await ensureDir(path.join(dir, 'research'));
  const manifest = {
    id,
    display_name: display_name || 'Untitled',
    file_prefix: file_prefix || 'deck',
    description: description || '',
    width,
    height,
    design_brand_reference,
    mode: 'professional',
    slides: [],
    todos: [],
    created_at: new Date().toISOString()
  };
  await writeManifest(id, manifest);
  return manifest;
}

export function projectDir(id) {
  return path.join(ROOT, id);
}

export async function readManifest(id) {
  const raw = await fs.readFile(path.join(ROOT, id, 'manifest.json'), 'utf8');
  return JSON.parse(raw);
}

export async function writeManifest(id, manifest) {
  await fs.writeFile(path.join(ROOT, id, 'manifest.json'), JSON.stringify(manifest, null, 2));
  return manifest;
}

export async function writeSlide(id, index, html) {
  const dir = await ensureDir(path.join(ROOT, id, 'slides'));
  const file = path.join(dir, `${String(index).padStart(2, '0')}.html`);
  await fs.writeFile(file, html);
  return file;
}

export async function readSlide(id, index) {
  try {
    return await fs.readFile(path.join(ROOT, id, 'slides', `${String(index).padStart(2, '0')}.html`), 'utf8');
  } catch {
    return null;
  }
}

export async function writeGuide(id, name, content) {
  const dir = await ensureDir(path.join(ROOT, id, '.guide'));
  await fs.writeFile(path.join(dir, name), content);
  return path.join(dir, name);
}

export async function readGuide(id, name) {
  try {
    return await fs.readFile(path.join(ROOT, id, '.guide', name), 'utf8');
  } catch {
    return null;
  }
}

export async function writeAsset(id, name, buf) {
  const dir = await ensureDir(path.join(ROOT, id, 'assets'));
  const file = path.join(dir, name);
  await fs.writeFile(file, buf);
  return `/api/projects/${id}/assets/${name}`;
}
