import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

/**
 * 편지 본문에 넣을 이미지 업로드.
 *
 * 파일명에 크기를 박아 넣는다 (`letters/<uuid>-1200x900.jpg`).
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

/** 로컬 폴백이 파일을 떨구는 곳. .gitignore 대상. */
const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

export async function POST(request: Request) {
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

  // 크기를 파일명에 박는 규칙은 저장 위치와 무관하게 동일해야 한다.
  const filename = `${randomUUID()}-${width}x${height}.${extension}`;

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    // Blob을 아직 안 붙였어도 로컬에서는 사진 붙인 편지를 그대로 써볼 수 있어야 한다.
    // 배포 환경에서는 파일시스템이 읽기 전용이라 절대 이 경로를 타면 안 된다.
    if (process.env.NODE_ENV === "production") {
      return NextResponse.json(
        { error: "이미지 저장소가 설정되지 않았습니다. BLOB_READ_WRITE_TOKEN을 확인해 주세요." },
        { status: 503 },
      );
    }
    return saveLocally(file, filename);
  }

  // addRandomSuffix는 확장자 바로 앞에 무작위 문자열을 끼워 넣어
  // `-1200x900.jpg` 규칙을 깨뜨린다. 그래서 직접 UUID를 앞에 붙이고 끈다.
  const blob = await put(`letters/${filename}`, file, {
    access: "public",
    addRandomSuffix: false,
    contentType: file.type,
  });

  return NextResponse.json({ url: blob.url });
}

/**
 * 개발 환경 폴백. public/uploads/ 에 저장하고 그 경로를 돌려준다.
 * 반환하는 파일명 규칙이 Blob과 같아서 렌더링 경로(next/image)는 완전히 동일하게 탄다.
 */
async function saveLocally(file: File, filename: string) {
  try {
    await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
    await writeFile(
      path.join(LOCAL_UPLOAD_DIR, filename),
      Buffer.from(await file.arrayBuffer()),
    );
    console.warn(
      `[upload] BLOB_READ_WRITE_TOKEN이 없어 public/uploads/ 에 저장했습니다. ` +
        `배포 전에 Vercel Blob을 연결하세요. (docs/deploy.md 3번)`,
    );
    return NextResponse.json({ url: `/uploads/${filename}` });
  } catch (error) {
    console.error("[upload] 로컬 저장 실패", error);
    return NextResponse.json({ error: "이미지를 저장하지 못했습니다." }, { status: 500 });
  }
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0 && value <= 20000;
}
