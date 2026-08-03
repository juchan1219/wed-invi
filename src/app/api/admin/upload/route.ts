import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * 편지 본문에 넣을 이미지 업로드.
 *
 * 파일명에 크기를 박아 넣는다 (`letters/<id>-1200x900.jpg`).
 * 원격 이미지는 next/image가 width/height를 미리 알 수 없는데,
 * 파일명에서 읽어오면 별도 저장소 없이 최적화와 레이아웃 안정성을 모두 얻는다.
 * (읽는 쪽: src/components/letter/LetterMarkdown.tsx)
 *
 * ⚠️ Vercel Blob 스토어는 반드시 **Public** 으로 만들어야 한다.
 *    하객이 로그인 없이 편지 이미지를 봐야 하므로 access: "public" 으로 올린다.
 *    Private 스토어는 생성 후 Public 으로 바꿀 수 없으니, 잘못 만들었다면 지우고 다시 만들 것.
 */

const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
  ["image/avif", "avif"],
]);

export async function POST(request: Request) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "이미지 저장소가 설정되지 않았습니다. BLOB_READ_WRITE_TOKEN을 확인해 주세요." },
      { status: 503 },
    );
  }

  const form = await request.formData();
  const file = form.get("file");
  const width = Number(form.get("width"));
  const height = Number(form.get("height"));

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "파일이 없습니다." }, { status: 400 });
  }

  const extension = ALLOWED.get(file.type);
  if (!extension) {
    return NextResponse.json(
      { error: "JPG, PNG, WebP, AVIF 이미지만 올릴 수 있습니다." },
      { status: 400 },
    );
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "이미지가 너무 큽니다. (최대 8MB)" }, { status: 400 });
  }
  if (!isPositiveInteger(width) || !isPositiveInteger(height)) {
    return NextResponse.json({ error: "이미지 크기를 읽지 못했습니다." }, { status: 400 });
  }

  // addRandomSuffix는 확장자 바로 앞에 무작위 문자열을 끼워 넣어
  // `-1200x900.jpg` 규칙을 깨뜨린다. 그래서 직접 UUID를 앞에 붙이고 끈다.
  const blob = await put(
    `letters/${randomUUID()}-${width}x${height}.${extension}`,
    file,
    { access: "public", addRandomSuffix: false, contentType: file.type },
  );

  return NextResponse.json({ url: blob.url });
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 20000;
}
