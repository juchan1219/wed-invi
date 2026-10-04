import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import sharp from 'sharp';
import {
  sampleFrameSequence, frameAtlasRect, danceAtlasUrl,
  DANCE_ATLAS_PAGES, DANCE_FRAME_COUNT, DANCE_FRAME_SIZE, DANCE_FRAMES_PER_PAGE,
} from './frameSequence';

test('frame sampler reaches exact endpoints and reverses without state',()=>{
  assert.deepEqual(sampleFrameSequence(0),{first:0,second:1,blend:0});
  assert.deepEqual(sampleFrameSequence(1),{first:80,second:80,blend:0});
  assert.deepEqual(sampleFrameSequence(.5),{first:47,second:48,blend:0});
  assert.deepEqual(sampleFrameSequence(-2),sampleFrameSequence(0));
  assert.deepEqual(sampleFrameSequence(NaN),sampleFrameSequence(0));
});
test('the standing carry is brief and the ending picture appears as the final copy lands',()=>{
  assert.equal(sampleFrameSequence(.67).first,63);  // 입맞춤 장면 시작: 포옹
  assert.equal(sampleFrameSequence(.78).first,74);  // 들어 올리고 일어섬 (이전과 같은 속도)
  assert.equal(sampleFrameSequence(.8).first,79);   // 일어선 채 안은 프레임은 빠르게 지나감
  assert.equal(sampleFrameSequence(.83).first,79);  // 마지막 문구가 나타나는 동안만 유지
  assert.equal(sampleFrameSequence(.84).first,80);  // 마지막 장면 시작과 함께 엔딩 그림
  let previous=0;
  for(let step=0;step<=100;step++){ // monotonic, so reverse scroll replays it backwards
    const frame=sampleFrameSequence(step/100).first;
    assert.ok(frame>=previous);previous=frame;
  }
});
test('atlas coordinates switch pages without addressing outside a sheet',()=>{
  assert.deepEqual(frameAtlasRect(15),{page:0,x:2160,y:2160});
  assert.deepEqual(frameAtlasRect(16),{page:1,x:0,y:0});
  assert.deepEqual(frameAtlasRect(79),{page:4,x:2160,y:2160});
  assert.deepEqual(frameAtlasRect(80),{page:5,x:0,y:0});
  assert.deepEqual(frameAtlasRect(95),frameAtlasRect(80)); // 범위를 넘으면 마지막 프레임
  assert.equal(DANCE_ATLAS_PAGES,6);
});
test('renderer cell size matches the generated atlas registration',()=>{
  // DPR 2인 358 CSS px 무대에서도 확대되지 않는 720px 셀과 코드가 어긋나면 프레임이 잘린다.
  const registration=JSON.parse(readFileSync('public/story/wedding-dance/frames/registration.json','utf8'));
  assert.equal(DANCE_FRAME_SIZE,720);
  assert.equal(registration.cellSize,DANCE_FRAME_SIZE);
});
test('every atlas page exists, is transparent and matches the cells it holds',async()=>{
  for(let page=0;page<DANCE_ATLAS_PAGES;page++){
    const meta=await sharp(`public${danceAtlasUrl(page)}`).metadata();
    // 마지막 장(엔딩 그림)은 칸이 하나라 720px 한 칸이다.
    const frames=Math.min(DANCE_FRAMES_PER_PAGE,DANCE_FRAME_COUNT-page*DANCE_FRAMES_PER_PAGE);
    assert.equal(meta.width,DANCE_FRAME_SIZE*Math.min(4,frames));
    assert.equal(meta.height,DANCE_FRAME_SIZE*Math.ceil(frames/4));
    assert.equal(meta.hasAlpha,true);
  }
});

test('no frame carries a floating fragment of the neighbouring cell',async()=>{
  // 2026-10-04 사용자 보고: 신랑 왼쪽에 작은 검은 점이 떠 있었다. 시트의 열 경계가
  // 옆 칸 그림의 끝부분을 이 칸 안에 남겨 둔 것이다(`sheet-cells.mjs` 의 골짜기 탐색).
  // 사람·드레스는 전부 한 덩어리로 이어져 있으므로, 칸마다 연결 성분이 하나여야 한다.
  const ALPHA_MIN=32;
  for(let page=0;page<DANCE_ATLAS_PAGES;page++){
    const {data,info}=await sharp(`public${danceAtlasUrl(page)}`).ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const cols=info.width/DANCE_FRAME_SIZE,rows=info.height/DANCE_FRAME_SIZE;
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const ox=col*DANCE_FRAME_SIZE,oy=row*DANCE_FRAME_SIZE,n=DANCE_FRAME_SIZE;
      const seen=new Uint8Array(n*n),qx=new Int32Array(n*n),qy=new Int32Array(n*n);
      const solid=(x:number,y:number)=>data[((oy+y)*info.width+(ox+x))*4+3]>ALPHA_MIN;
      const found:number[]=[];
      for(let y=0;y<n;y++)for(let x=0;x<n;x++){
        if(seen[y*n+x])continue;
        seen[y*n+x]=1;
        if(!solid(x,y))continue;
        let head=0,tail=0,area=0;qx[tail]=x;qy[tail]=y;tail++;
        while(head<tail){
          const cx=qx[head],cy=qy[head];head++;area++;
          for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
            const nx=cx+dx,ny=cy+dy;
            if(nx<0||ny<0||nx>=n||ny>=n||seen[ny*n+nx])continue;
            seen[ny*n+nx]=1;
            if(solid(nx,ny)){qx[tail]=nx;qy[tail]=ny;tail++;}
          }
        }
        found.push(area);
      }
      assert.equal(found.length,1,
        `page ${page} r${row}c${col} 에 떠 있는 조각이 ${found.length-1}개 있습니다 (면적 ${found.slice(1).join(', ')})`);
    }
  }
});

test('the sharper dance atlases stay within a three megabyte mobile payload budget',()=>{
  const bytes=Array.from({length:DANCE_ATLAS_PAGES},(_,page)=>
    statSync(`public${danceAtlasUrl(page)}`).size,
  ).reduce((total,size)=>total+size,0);
  assert.ok(bytes<=3_000_000,`dance atlases use ${bytes} bytes`);
});

test('atlas loading starts with one page and prefetches only near a page boundary',async()=>{
  const module=await import('./frameSequence');
  const planner=(module as unknown as {danceAtlasPagesToLoad?: (frame:number)=>number[]}).danceAtlasPagesToLoad;
  assert.equal(typeof planner,'function','frame loading policy must be exported');
  assert.deepEqual(planner!(0),[0]);
  assert.deepEqual(planner!(11),[0]);
  assert.deepEqual(planner!(12),[0,1]);
  assert.deepEqual(planner!(16),[1]);
  assert.deepEqual(planner!(79),[4,5]);
  assert.deepEqual(planner!(80),[5]);
});

test('the loading placeholder is the exact first atlas frame, so the characters never resize',async()=>{
  const placeholder='public/story/wedding-dance/frames/first-frame.webp';
  assert.equal(existsSync(placeholder),true,'first-frame.webp must be generated with the atlases');
  const expected=await sharp('public/story/wedding-dance/frames/dance-1.webp')
    .extract({left:0,top:0,width:DANCE_FRAME_SIZE,height:DANCE_FRAME_SIZE})
    .ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const actual=await sharp(placeholder).ensureAlpha().raw().toBuffer({resolveWithObject:true});
  const alphaBounds=({data,info}:{data:Buffer;info:{width:number;height:number;channels:number}})=>{
    let left=info.width,top=info.height,right=-1,bottom=-1;
    for(let y=0;y<info.height;y+=1)for(let x=0;x<info.width;x+=1){
      if(data[(y*info.width+x)*info.channels+3]>8){
        left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);
      }
    }
    return {left,top,right,bottom};
  };
  assert.deepEqual(actual.info.width,expected.info.width);
  assert.deepEqual(actual.info.height,expected.info.height);
  assert.deepEqual(alphaBounds(actual),alphaBounds(expected));
});
