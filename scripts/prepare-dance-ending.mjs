// 엔딩 그림(frames/dance-6.webp) 생성. 춤의 마지막 프레임(79) 뒤에 이어지는 한 장(프레임 80)이다.
// 원본: assets/dance-frames/ending.png (ChatGPT로 생성해 사용자가 승인한 최종 자세, 1254px 한 장)
//
// 프레임과 같은 비율이 되도록 한다.
//  - 크기: 신랑 키(머리 위 ~ 신발 밑)를 프레임 79의 신랑 키와 같게. 전체 상자는 부케·든 손이 위로 나와 기준이 될 수 없다.
//  - 위치: 신랑 신발 중심과 바닥을 프레임 79와 같은 자리에 둔다(두 그림 모두 신랑이 서서 신부를 안고 있다).
//  - 선 굵기: 원본이 커서 그냥 줄이면 선이 프레임보다 약 1px 가늘다(중앙값 4px vs 5px). 2배 크기에서 검은 선을
//    1px 넓힌 뒤 줄여 약 1px 두껍게 맞춘다.
// 원본 해상도가 충분해(신랑 키 약 980px → 419px로 축소) 업스케일은 필요 없다.
import sharp from 'sharp';
import { resolve } from 'node:path';

const cellSize = 576;
const source = resolve('assets/dance-frames/ending.png');
const lastPage = resolve('public/story/wedding-dance/frames/dance-5.webp'); // 마지막 칸 = 프레임 79

const isDark = (data, i) => data[i + 3] > 128 && data[i] < 90;

/** 신랑: 신발(바닥 띠의 꽉 찬 검정) 중심, 바닥, 머리 위(발 근처 열에서 처음 나오는 굵은 검정 줄 = 머리카락). */
function measureGroom({ data, info }) {
  const { width: W, height: H } = info;
  const dark = (x, y) => isDark(data, (y * W + x) * 4);
  let bottom = 0;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 128) bottom = Math.max(bottom, y);
  const r = Math.max(2, Math.round(W / 300));
  const solid = (x, y) => { for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (!dark(x + dx, y + dy)) return false; return true; };
  let sum = 0, n = 0;
  for (let y = bottom - Math.round(H * 0.035); y <= bottom - r; y++) for (let x = r; x < W - r; x++) if (solid(x, y)) { sum += x; n++; }
  const feet = sum / n;
  // 든 손(왼쪽 멀리)과 부케(오른쪽 멀리)를 피하도록 발 근처 열에서만 머리카락을 찾는다.
  const minRun = Math.round(W * 0.045), lo = Math.max(0, Math.round(feet - W * 0.19)), hi = Math.min(W, Math.round(feet + W * 0.07));
  for (let y = 0; y < H; y++) {
    let run = 0;
    for (let x = lo; x < hi; x++) { run = dark(x, y) ? run + 1 : 0; if (run >= minRun) return { head: y, bottom, feet, height: bottom - y }; }
  }
  throw new Error('Groom head not found');
}

/** 검은 선을 한 픽셀 넓힌다: 3×3 이웃에 검은 잉크가 있으면 그 색·알파를 가져온다. */
function thickenInk({ data, info }) {
  const { width: W, height: H } = info;
  const out = Buffer.from(data);
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    let best = -1, bestL = 256;
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const j = ((y + dy) * W + x + dx) * 4;
      if (!isDark(data, j)) continue;
      const L = data[j] + data[j + 1] + data[j + 2];
      if (L < bestL) { bestL = L; best = j; }
    }
    if (best < 0) continue;
    const i = (y * W + x) * 4;
    out[i] = data[best]; out[i + 1] = data[best + 1]; out[i + 2] = data[best + 2];
    out[i + 3] = Math.max(data[i + 3], data[best + 3]);
  }
  return out;
}

const target = measureGroom(await sharp(lastPage)
  .extract({ left: cellSize * 3, top: cellSize * 3, width: cellSize, height: cellSize })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true }));
const original = await sharp(source).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const groom = measureGroom(original);
const scale = target.height / groom.height;

const doubled = await sharp(source)
  .resize(Math.round(original.info.width * scale * 2), Math.round(original.info.height * scale * 2), { kernel: 'lanczos3' })
  .ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const drawing = await sharp(thickenInk(doubled), { raw: doubled.info })
  .resize(Math.round(original.info.width * scale), Math.round(original.info.height * scale), { kernel: 'lanczos3' })
  .png().toBuffer({ resolveWithObject: true });

// 원본 캔버스 전체를 줄였으므로, 신랑 신발·바닥이 프레임 79와 같은 자리에 오도록 옮긴 뒤 칸 크기로 자른다.
const left = Math.round(target.feet - groom.feet * scale);
const top = Math.round(target.bottom - groom.bottom * scale);
const cell = await sharp({ create: { width: cellSize, height: cellSize, channels: 4, background: '#00000000' } })
  .composite([{ input: drawing.data, left, top }]).raw().toBuffer({ resolveWithObject: true });

// 칸 밖으로 잘린 그림이 없는지 확인한다(원본 캔버스의 빈 여백만 잘려야 한다).
const { width: dw, height: dh } = drawing.info;
let clipped = 0;
for (let y = 0; y < dh; y++) for (let x = 0; x < dw; x++) {
  const cx = x + left, cy = y + top;
  if ((cx < 0 || cy < 0 || cx >= cellSize || cy >= cellSize) && drawing.data[(y * dw + x) * 4 + 3] > 40) clipped++;
}
if (clipped) throw new Error(`Ending drawing is clipped by the cell (${clipped}px)`);

for (let i = 3; i < cell.data.length; i += 4) if (cell.data[i] <= 8) cell.data[i] = 0;
await sharp(cell.data, { raw: cell.info })
  .webp({ quality: 60, alphaQuality: 70, effort: 6 })
  .toFile(resolve('public/story/wedding-dance/frames/dance-6.webp'));
console.log(`Ending: scale ${scale.toFixed(4)} (groom ${groom.height}px → ${target.height}px), placed at (${left}, ${top}), wrote frames/dance-6.webp`);
