// 원본 댄스 시트를 Real-ESRGAN(anime 모델)으로 4배 키워 assets/dance-frames/upscaled/에 둔다.
// 원본 셀(약 313px)이 화면에서 약 1.9배 늘어나 선이 뭉개지는 문제를 해결하기 위한 단계다.
// 결과물은 장당 약 16MB라 git에서 제외한다. `npm run dance:frames`가 이 파일을 읽는다.
//
// 바이너리(공식 배포본): https://github.com/xinntao/Real-ESRGAN/releases/tag/v0.2.5.0
//   macOS: realesrgan-ncnn-vulkan-20220424-macos.zip 압축을 풀고 `chmod +x realesrgan-ncnn-vulkan`
// 실행: REALESRGAN=/absolute/path/to/realesrgan-ncnn-vulkan npm run dance:upscale
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const binary = process.env.REALESRGAN;
if (!binary) throw new Error('Set REALESRGAN=/absolute/path/to/realesrgan-ncnn-vulkan (see comment at top of this file).');
const destination = resolve('assets/dance-frames/upscaled');
mkdirSync(destination, { recursive: true });
for (const name of ['opening', 'embrace', 'turn', 'lift']) {
  const output = resolve(destination, `${name}@4x.png`);
  execFileSync(binary, [
    '-i', resolve(`assets/dance-frames/${name}.png`),
    '-o', output,
    '-n', 'realesrgan-x4plus-anime',
    '-m', resolve(dirname(binary), 'models'),
  ], { stdio: ['ignore', 'ignore', 'pipe'] }); // 진행률(%) 출력은 숨기고, 실패하면 stderr가 에러에 담긴다
  console.log(`upscaled ${name} → ${output}`);
}
