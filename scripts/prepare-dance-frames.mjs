// Registration/slicing only: keep generated drawings unchanged, align their
// ground line, and pack into five small transparent atlases for the browser.
// 셀 경계는 원본 시트에서 찾고, 픽셀은 Real-ESRGAN 4배 업스케일본에서 가져온다
// (`npm run dance:upscale` 먼저). 원본 셀(~313px)을 그대로 쓰면 화면에서 약 1.9배
// 늘어나 선이 뭉개진다.
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
import { findSheetCells } from './dance/sheet-cells.mjs';
const args = process.argv.slice(2);
const sources = args.length ? args : ['opening','embrace','turn','turn','lift'].map(name=>resolve(`assets/dance-frames/${name}.png`));
if (sources.length !== 5) throw new Error('Provide the five sprite sheet PNG paths in choreography order.');
const UPSCALE = 4;
const upscaled = sources.map((source) => resolve('assets/dance-frames/upscaled', basename(source).replace(/\.png$/, `@${UPSCALE}x.png`)));
for (const file of upscaled) if (!existsSync(file)) throw new Error(`Missing ${file}. Run \`npm run dance:upscale\` first.`);
const destination = resolve('public/story/wedding-dance/frames');
await mkdir(destination, { recursive: true });
// 576px = 레티나에서 358 CSS px로 그릴 때 필요한 716px에 가까우면서 용량을 억제한 값.
// WebP 품질 60: 선화라 q70과 눈으로 구분되지 않고, 384px/q94 atlas보다 작다.
const cellSize = 576;
const layoutScale = cellSize / 384; // 기존 384px 셀 배치(비율·바닥 여백)를 그대로 키운다
const groundMargin = Math.round(18 * layoutScale);
const audit=[];
for(let page=0;page<5;page++) {
  const composites=[];
  for(const {row,col,left,top,width,height} of findSheetCells(await sharp(sources[page]).ensureAlpha().raw().toBuffer({resolveWithObject:true}))) {
    // One scale for all frames; never scale each pose to its own bounding box.
    const scale=1.02*layoutScale;
    const w=Math.round(width*scale),h=Math.round(height*scale);
    if(w>cellSize || h>cellSize-groundMargin)throw new Error(`Frame ${page}:${row}:${col} exceeds atlas cell`);
    const input=await sharp(upscaled[page])
      .extract({left:left*UPSCALE,top:top*UPSCALE,width:width*UPSCALE,height:height*UPSCALE})
      .resize(w,h,{kernel:'lanczos3'}).png().toBuffer();
    // Return from the twirl along the same drawn arc; discard the generated
    // side-swap sheet whose consecutive frames teleport the two characters.
    const targetRow=page===3?3-row:row, targetCol=page===3?3-col:col;
    composites.push({input,left:targetCol*cellSize+Math.round((cellSize-w)/2),top:targetRow*cellSize+cellSize-groundMargin-h});
    audit.push({page,frame:row*4+col,bounds:{left,top,width,height}});
  }
  await sharp({create:{width:cellSize*4,height:cellSize*4,channels:4,background:'#00000000'}})
    .composite(composites).webp({quality:60,alphaQuality:70,effort:6}).toFile(resolve(destination,`dance-${page+1}.webp`));
}
await writeFile(resolve(destination,'registration.json'),JSON.stringify({cellSize,columns:4,rows:4,frames:80,upscale:UPSCALE,audit},null,2));
console.log(`Registered 80 drawings into five ${cellSize*4}px transparent atlases.`);
