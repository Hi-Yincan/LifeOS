import { encodePicture } from "components/apps/Messenger/picture";

export const BANNER_PRESETS = [
  {
    colors: ["#10283f", "#315f87", "#6a91a6"],
    en: "Deep sea",
    id: "sea",
    zh: "深海",
  },
  {
    colors: ["#163947", "#427a72", "#706a91"],
    en: "Aurora",
    id: "aurora",
    zh: "极光",
  },
  {
    colors: ["#604b75", "#a96779", "#dba080"],
    en: "Sunset",
    id: "sunset",
    zh: "晚霞",
  },
  {
    colors: ["#203c36", "#4e7562", "#9aab82"],
    en: "Pine forest",
    id: "forest",
    zh: "松林",
  },
  {
    colors: ["#292746", "#57527c", "#8c7a9e"],
    en: "Violet night",
    id: "violet",
    zh: "紫夜",
  },
  {
    colors: ["#252b31", "#4a535d", "#838b93"],
    en: "Graphite",
    id: "graphite",
    zh: "石墨",
  },
] as const;

export const bannerPresetImage = (colors: readonly string[]): string => {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 160;
  const context = canvas.getContext("2d");

  if (!context) throw new Error("Canvas is unavailable");

  const gradient = context.createLinearGradient(0, 0, canvas.width, 0);

  colors.forEach((color, index) =>
    gradient.addColorStop(index / (colors.length - 1), color)
  );
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  return encodePicture(canvas);
};
