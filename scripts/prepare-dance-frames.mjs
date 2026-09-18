// Registration/slicing only: keep generated drawings unchanged, align their
// ground line, and pack into five small transparent atlases for the browser.
// 셀 경계는 원본 시트에서 찾고, 픽셀은 Real-ESRGAN 4배 업스케일본에서 가져온다
// (`npm run dance:upscale` 먼저). 원본 셀(~313px)을 그대로 쓰면 화면에서 약 1.9배
// 늘어나 선이 뭉개진다.
import sharp from 'sharp';
import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { basename, resolve } from 'node:path';
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
function valley(counts, expected, radius) {
  const lo = Math.max(1,Math.round(expected-radius));
  const hi = Math.min(counts.length-1,Math.round(expected+radius));
  let best = lo, score = Infinity;
  for(let i=lo;i<=hi;i++) {
    let density=0;
    for(let j=Math.max(lo,i-3);j<=Math.min(hi,i+3);j++) density+=counts[j];
    const cost=density + Math.abs(i-expected)*.03;
    if(cost<score){score=cost;best=i;}
  }
  return best;
}
const audit=[];
for(let page=0;page<5;page++) {
  const {data,info} = await sharp(sources[page]).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const rows=Array(info.height).fill(0);
  for(let y=0;y<info.height;y++) for(let x=0;x<info.width;x++) if(data[(y*info.width+x)*4+3]>160)rows[y]++;
  const ys=[0,...[1,2,3].map(i=>valley(rows,info.height*i/4,info.height*.045)),info.height];
  const composites=[];
  for(let row=0;row<4;row++) {
    const columns=Array(info.width).fill(0);
    for(let y=ys[row];y<ys[row+1];y++)for(let x=0;x<info.width;x++)if(data[(y*info.width+x)*4+3]>160)columns[x]++;
    const xs=[0,...[1,2,3].map(i=>valley(columns,info.width*i/4,info.width*.04)),info.width];
    for(let col=0;col<4;col++) {
      let left=xs[col+1],right=xs[col],top=ys[row+1],bottom=ys[row];
      // Ignore isolated transparency fringes by requiring nearby opaque pixels.
      for(let y=ys[row]+1;y<ys[row+1]-1;y++)for(let x=xs[col]+1;x<xs[col+1]-1;x++) {
        const idx=(y*info.width+x)*4;
        if(data[idx+3]>220 && data[idx-4+3]>160 && data[idx+4+3]>160) {
          left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);
        }
      }
      left=Math.max(xs[col],left-2);right=Math.min(xs[col+1]-1,right+2);
      top=Math.max(ys[row],top-2);bottom=Math.min(ys[row+1]-1,bottom+2);
      const width=right-left+1,height=bottom-top+1;
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
  }
  await sharp({create:{width:cellSize*4,height:cellSize*4,channels:4,background:'#00000000'}})
    .composite(composites).webp({quality:60,alphaQuality:70,effort:6}).toFile(resolve(destination,`dance-${page+1}.webp`));
}
await writeFile(resolve(destination,'registration.json'),JSON.stringify({cellSize,columns:4,rows:4,frames:80,upscale:UPSCALE,audit},null,2));
console.log(`Registered 80 drawings into five ${cellSize*4}px transparent atlases.`);
