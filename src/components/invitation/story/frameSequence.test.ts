import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleFrameSequence, frameAtlasRect } from './frameSequence';

test('frame sampler reaches exact endpoints and reverses without state',()=>{
  assert.deepEqual(sampleFrameSequence(0),{first:0,second:1,blend:0});
  assert.deepEqual(sampleFrameSequence(1),{first:79,second:79,blend:0});
  assert.deepEqual(sampleFrameSequence(.5),{first:47,second:48,blend:0});
  assert.deepEqual(sampleFrameSequence(.84),{first:79,second:79,blend:0});
  assert.deepEqual(sampleFrameSequence(-2),sampleFrameSequence(0));
  assert.deepEqual(sampleFrameSequence(NaN),sampleFrameSequence(0));
});
test('atlas coordinates switch pages without addressing outside a sheet',()=>{
  assert.deepEqual(frameAtlasRect(15),{page:0,x:1152,y:1152});
  assert.deepEqual(frameAtlasRect(16),{page:1,x:0,y:0});
  assert.deepEqual(frameAtlasRect(79),{page:4,x:1152,y:1152});
});
