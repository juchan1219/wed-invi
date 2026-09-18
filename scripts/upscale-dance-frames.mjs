// 댄스 시트를 Real-ESRGAN(anime 모델)으로 4배 키운다.
// 원본 셀(약 313px)이 화면에서 약 1.9배 늘어나 선이 뭉개지는 문제를 해결하기 위한 단계다.
// 결과물은 장당 약 16MB라 git에서 제외한다. 이미 있는 결과는 건너뛴다(`--force`로 다시 생성).
//   assets/dance-frames/<시트>.png → assets/dance-frames/upscaled/<시트>@4x.png (`npm run dance:frames`가 읽음)
//   엔딩 그림(ending.png)은 원본이 충분히 커서 업스케일하지 않는다.
//
// 바이너리(공식 배포본): https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0
//   macOS: realesrgan-ncnn-vulkan-20220424-macos.zip 압축을 풀고 `chmod +x realesrgan-ncnn-vulkan`
// 실행: REALESRGAN=/absolute/path/to/realesrgan-ncnn-vulkan npm run dance:upscale
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const binary = process.env.REALESRGAN;
if (!binary) throw new Error('Set REALESRGAN=/absolute/path/to/realesrgan-ncnn-vulkan (see comment at top of this file).');
const force = process.argv.includes('--force');

const jobs = ['opening', 'embrace', 'turn', 'lift'].map((name) => [`assets/dance-frames/${name}.png`, `assets/dance-frames/upscaled/${name}@4x.png`]);
for (const [input, output] of jobs.map((job) => job.map((path) => resolve(path)))) {
  if (!force && existsSync(output)) { console.log(`skip (exists) ${output}`); continue; }
  mkdirSync(dirname(output), { recursive: true });
  execFileSync(binary, [
    '-i', input,
    '-o', output,
    '-n', 'realesrgan-x4plus-anime',
    '-m', resolve(dirname(binary), 'models'),
  ], { stdio: ['ignore', 'ignore', 'pipe'] }); // 진행률(%) 출력은 숨기고, 실패하면 stderr가 에러에 담긴다
  console.log(`upscaled ${input} → ${output}`);
}
