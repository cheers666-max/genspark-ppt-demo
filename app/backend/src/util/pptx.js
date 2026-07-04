// 极简 PPTX 生成器：每页一张全图幻灯片
// 不依赖 pptxgenjs，手写最小 OOXML + zip 打包
// EMU: 914400 per inch; 1280x720 @ 96dpi => 13.333"x 7.5" => 12192000 x 6858000
import fs from 'node:fs/promises';
import path from 'node:path';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const sh = promisify(exec);

const EMU_PER_PX = 9525; // 914400/96

export async function buildPptxFromImages(pngs, manifest, outFile) {
  const tmp = path.join(path.dirname(outFile), `_tmp_${Date.now()}`);
  await fs.mkdir(tmp, { recursive: true });
  const dirs = ['ppt', 'ppt/slides', 'ppt/slides/_rels', 'ppt/media', 'ppt/_rels', '_rels'];
  for (const d of dirs) await fs.mkdir(path.join(tmp, d), { recursive: true });

  const slideFiles = [];
  let relId = 1;
  const slideXmls = [];
  const slideRels = [];
  const slideNames = [];

  for (let i = 0; i < pngs.length; i++) {
    const idx = i + 1;
    const mediaName = `image${idx}.png`;
    await fs.copyFile(pngs[i].abs, path.join(tmp, 'ppt', 'media', mediaName));

    const w = manifest.width * EMU_PER_PX;
    const h = manifest.height * EMU_PER_PX;
    const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:cSld><p:spTree>
    <p:pic>
      <p:nvPicPr><p:cNvPr id="1" name=""/><p:cNvPicPr/><p:nvPr/></p:nvPicPr>
      <p:blipFill><a:blip r:embed="rId${relId}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>
      <p:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="${w}" cy="${h}"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>
    </p:pic>
  </p:spTree></p:cSld>
</p:sld>`;
    await fs.writeFile(path.join(tmp, 'ppt', 'slides', `slide${idx}.xml`), slideXml);

    const rel = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId${relId}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="media/${mediaName}"/>
</Relationships>`;
    await fs.mkdir(path.join(tmp, 'ppt', 'slides', '_rels'), { recursive: true });
    await fs.writeFile(path.join(tmp, 'ppt', 'slides', '_rels', `slide${idx}.xml.rels`), rel);

    slideNames.push(`ppt/slides/slide${idx}.xml`);
    relId++;
  }

  // presentation.xml
  const sldIdLst = slideNames.map((_, i) => {
    const r = 1000 + i;
    return `<p:sldId id="${r + 1}"><p:relId r:id="rId${i + 2}"/></p:sldId>`;
  }).join('');
  const presRels = slideNames.map((n, i) =>
    `<Relationship Id="rId${i + 2}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="${n}"/>`
  ).join('\n');
  const presSize = `<p:sldSz cx="${manifest.width * EMU_PER_PX}" cy="${manifest.height * EMU_PER_PX}" type="screen16x9"/>`;

  await fs.writeFile(path.join(tmp, 'ppt', 'presentation.xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">
  <p:sldIdLst>${sldIdLst}</p:sldIdLst>${presSize}
</p:presentation>`);
  await fs.writeFile(path.join(tmp, 'ppt', '_rels', 'presentation.xml.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${presRels}
</Relationships>`);

  // [Content_Types].xml
  await fs.writeFile(path.join(tmp, '[Content_Types].xml'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="xml" ContentType="application/xml"/>
  <Default Extension="png" ContentType="image/png"/>
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${slideNames.map((n, i) => `<Override PartName="/${n}" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide.main+xml"/>`).join('\n  ')}
</Types>`);

  // _rels/.rels
  await fs.mkdir(path.join(tmp, '_rels'), { recursive: true });
  await fs.writeFile(path.join(tmp, '_rels', '.rels'), `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`);

  // 打包为 zip 并改名为 .pptx
  await sh(`cd ${tmp} && zip -r -X ${outFile} . > /dev/null`);
  await fs.rm(tmp, { recursive: true, force: true });
  return outFile;
}
