export const MAX_PICTURE_FILE_BYTES = 10 * 1024 * 1024;
export const PICTURE_SIZE = 192;
const MAX_PICTURE_URL_LENGTH = 16 * 1024;

export const readPicture = async (file: File): Promise<HTMLImageElement> => {
  const url = URL.createObjectURL(file);

  try {
    const image = new Image();

    image.src = url;
    await image.decode();
    if (
      !image.naturalWidth ||
      !image.naturalHeight ||
      image.naturalWidth * image.naturalHeight > 40_000_000
    ) {
      throw new Error("Invalid image dimensions");
    }

    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
};

export const drawPicture = (
  canvas: HTMLCanvasElement,
  image: HTMLImageElement,
  zoom: number,
  horizontal: number,
  vertical: number
): void => {
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Canvas is unavailable");

  const size = Math.min(image.naturalWidth, image.naturalHeight) / zoom;

  context.fillStyle = "#fff";
  context.fillRect(0, 0, PICTURE_SIZE, PICTURE_SIZE);
  context.drawImage(
    image,
    ((image.naturalWidth - size) * horizontal) / 100,
    ((image.naturalHeight - size) * vertical) / 100,
    size,
    size,
    0,
    0,
    PICTURE_SIZE,
    PICTURE_SIZE
  );
};

export const encodePicture = (canvas: HTMLCanvasElement): string => {
  // 限制资料事件中的图片大小，避免将原始照片直接发送到中继。
  for (const quality of [0.85, 0.65, 0.45, 0.25]) {
    const picture = canvas.toDataURL("image/jpeg", quality);

    if (
      picture.startsWith("data:image/jpeg;") &&
      picture.length <= MAX_PICTURE_URL_LENGTH
    ) {
      return picture;
    }
  }

  throw new Error("Picture is too large");
};
