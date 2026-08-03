/** 업로드 전 브라우저에서 줄일 긴 변 최대 픽셀. 편지 본문 폭(최대 416px)에는 충분하다. */
const MAX_EDGE = 1600;
const QUALITY = 0.82;

export type ResizedImage = { file: File; width: number; height: number };

/**
 * 업로드 전에 브라우저에서 이미지를 줄인다.
 *
 * 요즘 폰 사진은 장당 3~5MB다. 그대로 올리면 Vercel Blob 무료 1GB가 금방 차고
 * 하객 쪽 전송량도 커진다. 어차피 편지 본문은 400px 남짓 폭이라 원본이 필요 없다.
 *
 * 크기를 함께 돌려주는 이유: 업로드 파일명에 넣어 두면 next/image가
 * width/height를 알 수 있어 레이아웃이 밀리지 않는다.
 */
export async function resizeImage(file: File): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    // 축소가 필요 없고 이미 웹 포맷이면 원본을 그대로 쓴다.
    if (scale === 1 && file.type === "image/jpeg") {
      return { file, width, height };
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) throw new Error("캔버스를 만들지 못했습니다.");
    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", QUALITY),
    );
    if (!blob) throw new Error("이미지를 변환하지 못했습니다.");

    return {
      file: new File([blob], replaceExtension(file.name, "jpg"), { type: "image/jpeg" }),
      width,
      height,
    };
  } finally {
    // ImageBitmap은 GC 대상이 아니라 명시적으로 닫아야 메모리가 돌아온다.
    bitmap.close();
  }
}

function replaceExtension(name: string, extension: string): string {
  return `${name.replace(/\.[^.]+$/, "")}.${extension}`;
}
