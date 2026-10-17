import { MAX_UPLOAD_BYTES } from "./image-upload";

/** 편지 본문 폭은 최대 약 317px이다. DPR 3~4에서도 선명하게 보일 원본 상한. */
const MAX_WIDTH = 1280;
const MAX_HEIGHT = 1600;
const QUALITY = 0.85;

export class ImageTooLargeError extends Error {
  constructor() {
    super("최적화 후에도 이미지가 4MB를 넘습니다. 다른 사진을 선택해 주세요.");
  }
}

export type ResizedImage = { file: File; width: number; height: number };

/**
 * 업로드 전에 브라우저에서 이미지를 줄인다.
 *
 * 요즘 폰 사진은 장당 3~5MB다. 그대로 올리면 Vercel Blob 무료 1GB가 금방 차고
 * 하객 쪽 전송량도 커진다. 편지 본문은 최대 약 317px 폭이라 카메라 원본이 필요 없다.
 *
 * 크기를 함께 돌려주는 이유: 업로드 파일명에 넣어 두면 next/image가
 * width/height를 알 수 있어 레이아웃이 밀리지 않는다.
 */
export async function resizeImage(file: File): Promise<ResizedImage> {
  const bitmap = await createImageBitmap(file);

  try {
    const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height);
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

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

    // 원본이 이미 충분히 작다면 불필요한 재압축으로 화질과 용량을 악화시키지 않는다.
    const useOriginal = scale === 1 && file.size <= blob.size && file.size <= MAX_UPLOAD_BYTES;
    const result = useOriginal
      ? file
      : new File([blob], replaceExtension(file.name, "jpg"), { type: "image/jpeg" });
    if (result.size > MAX_UPLOAD_BYTES) throw new ImageTooLargeError();

    return { file: result, width, height };
  } finally {
    // ImageBitmap은 GC 대상이 아니라 명시적으로 닫아야 메모리가 돌아온다.
    bitmap.close();
  }
}

function replaceExtension(name: string, extension: string): string {
  return `${name.replace(/\.[^.]+$/, "")}.${extension}`;
}
