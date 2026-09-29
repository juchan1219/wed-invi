import sharp from "sharp";

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const WEDDING_COUPLE_CROP = {
  zoom: 1.15,
  focalX: 0.56,
  focalY: 0.67,
} as const;

export type FocalCropOptions = {
  sourceWidth: number;
  sourceHeight: number;
  targetWidth: number;
  targetHeight: number;
  zoom: number;
  focalX: number;
  focalY: number;
};

export type CropRegion = {
  left: number;
  top: number;
  width: number;
  height: number;
};

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function calculateFocalCrop({
  sourceWidth,
  sourceHeight,
  targetWidth,
  targetHeight,
  zoom,
  focalX,
  focalY,
}: FocalCropOptions): CropRegion {
  const targetRatio = targetWidth / targetHeight;
  const maxCropWidth = Math.min(sourceWidth, sourceHeight * targetRatio);
  const width = Math.max(1, Math.floor(maxCropWidth / zoom));
  const height = Math.max(1, Math.round(width / targetRatio));
  const focalLeft = sourceWidth * focalX - width / 2;
  const focalTop = sourceHeight * focalY - height / 2;

  return {
    left: Math.round(clamp(focalLeft, 0, sourceWidth - width)),
    top: Math.round(clamp(focalTop, 0, sourceHeight - height)),
    width,
    height,
  };
}

export async function buildOgImage(source: string, output: string): Promise<void> {
  const { data, info } = await sharp(source, { failOn: "none" })
    .rotate()
    .toBuffer({ resolveWithObject: true });
  const crop = calculateFocalCrop({
    sourceWidth: info.width,
    sourceHeight: info.height,
    targetWidth: OG_WIDTH,
    targetHeight: OG_HEIGHT,
    ...WEDDING_COUPLE_CROP,
  });

  await sharp(data)
    .extract(crop)
    .resize(OG_WIDTH, OG_HEIGHT)
    .jpeg({ quality: 85, mozjpeg: true })
    .toFile(output);
}
