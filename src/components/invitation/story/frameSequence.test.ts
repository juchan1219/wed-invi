import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
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
  assert.deepEqual(frameAtlasRect(15),{page:0,x:1728,y:1728});
  assert.deepEqual(frameAtlasRect(16),{page:1,x:0,y:0});
  assert.deepEqual(frameAtlasRect(79),{page:4,x:1728,y:1728});
  assert.deepEqual(frameAtlasRect(80),{page:5,x:0,y:0});
  assert.deepEqual(frameAtlasRect(95),frameAtlasRect(80)); // 범위를 넘으면 마지막 프레임
  assert.equal(DANCE_ATLAS_PAGES,6);
});
test('renderer cell size matches the generated atlas registration',()=>{
  // 업스케일 atlas(576px 셀)와 코드의 셀 크기가 어긋나면 프레임이 잘리거나 이웃 셀이 섞인다.
  const registration=JSON.parse(readFileSync('public/story/wedding-dance/frames/registration.json','utf8'));
  assert.equal(DANCE_FRAME_SIZE,576);
  assert.equal(registration.cellSize,DANCE_FRAME_SIZE);
});
test('every atlas page exists, is transparent and matches the cells it holds',async()=>{
  for(let page=0;page<DANCE_ATLAS_PAGES;page++){
    const meta=await sharp(`public${danceAtlasUrl(page)}`).metadata();
    // 마지막 장(엔딩 그림)은 칸이 하나라 576px 한 칸이다.
    const frames=Math.min(DANCE_FRAMES_PER_PAGE,DANCE_FRAME_COUNT-page*DANCE_FRAMES_PER_PAGE);
    assert.equal(meta.width,DANCE_FRAME_SIZE*Math.min(4,frames));
    assert.equal(meta.height,DANCE_FRAME_SIZE*Math.ceil(frames/4));
    assert.equal(meta.hasAlpha,true);
  }
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
