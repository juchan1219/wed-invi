import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { sampleFrameSequence, frameAtlasRect, DANCE_FRAME_SIZE } from './frameSequence';

test('frame sampler reaches exact endpoints and reverses without state',()=>{
  assert.deepEqual(sampleFrameSequence(0),{first:0,second:1,blend:0});
  assert.deepEqual(sampleFrameSequence(1),{first:79,second:79,blend:0});
  assert.deepEqual(sampleFrameSequence(.5),{first:47,second:48,blend:0});
  assert.deepEqual(sampleFrameSequence(.84),{first:79,second:79,blend:0});
  assert.deepEqual(sampleFrameSequence(-2),sampleFrameSequence(0));
  assert.deepEqual(sampleFrameSequence(NaN),sampleFrameSequence(0));
});
test('atlas coordinates switch pages without addressing outside a sheet',()=>{
  assert.deepEqual(frameAtlasRect(15),{page:0,x:1728,y:1728});
  assert.deepEqual(frameAtlasRect(16),{page:1,x:0,y:0});
  assert.deepEqual(frameAtlasRect(79),{page:4,x:1728,y:1728});
});
test('renderer cell size matches the generated atlas registration',()=>{
  // 업스케일 atlas(576px 셀)와 코드의 셀 크기가 어긋나면 프레임이 잘리거나 이웃 셀이 섞인다.
  const registration=JSON.parse(readFileSync('public/story/wedding-dance/frames/registration.json','utf8'));
  assert.equal(DANCE_FRAME_SIZE,576);
  assert.equal(registration.cellSize,DANCE_FRAME_SIZE);
});
