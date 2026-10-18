import { BASE_COUNTS } from "components/system/Desktop/Wallpapers/Galaxy/config";

/**
 * Render pass a layer belongs to, in paint order: background (far stars),
 * glow (soft gas, accumulated at reduced resolution), stars (crisp old
 * stars), dust (dark lanes, reduced resolution), foreground (young stars,
 * H-II regions, near field).
 */
export type GalaxyLayerTarget =
  "background" | "dust" | "foreground" | "glow" | "stars";

export type GalaxyLayer = {
  alpha: number;
  count: number;
  data: ArrayBuffer;
  /**
   * Gaussian falloff exponent of the sprite profile. Crisp stars use 4.5;
   * soft media use 3.0 together with `sizeMul` 0.82, which renders the same
   * gaussian sigma on a third less sprite area.
   */
  falloffK: number;
  maxPointSize: number;
  /**
   * Enables the supernova channel: about once a minute one star of the
   * layer flares brilliantly and decays over seconds. Only the young
   * population hosts core-collapse events, so only it sets this to 1.
   */
  novaAmp: number;
  patternMul: number;
  sizeMul: number;
  /**
   * Strength of the four-point diffraction spikes drawn on sprites large
   * enough to read as saturated stars, the signature of telescope optics
   * in NASA/ESA photography. Zero for soft media and small-star layers.
   */
  spikeAmp: number;
  target: GalaxyLayerTarget;
  /**
   * Amplitude of the slow brightness shimmer. There is no atmosphere in
   * space, so this stays subtle: a hint of life standing in for real
   * stellar variability rather than earthly twinkle.
   */
  twinkleAmp: number;
};

// 8 floats (a, axisRatio, theta0, phase0, omegaRel, z, size, twinklePhase)
// followed by 4 unsigned bytes (r, g, b, brightness)
export const PARTICLE_STRIDE = 36;
export const PARTICLE_FLOATS = 8;

const TAU = Math.PI * 2;

/* eslint-disable no-bitwise */
const createRng = (seed: number): (() => number) => {
  let state = seed;

  return () => {
    state = Math.trunc(state + 0x6d2b79f5);

    let t = state;

    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);

    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};
/* eslint-enable no-bitwise */

const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

// 将线性 sRGB 转换为采用同一 D65 白点的线性 Display P3。
const SRGB_TO_P3 = [
  0.8225, 0.1774, 0, 0.0332, 0.9669, 0, 0.0171, 0.0724, 0.9108,
];

const srgbToLinear = (value: number): number =>
  value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;

const linearToSrgb = (value: number): number =>
  value <= 0.0031308 ? value * 12.92 : 1.055 * value ** (1 / 2.4) - 0.055;

// The gamma curves via ** are the hot spot of generation (six calls per
// particle); interpolated lookup tables are exact to ~1e-5, far below one
// 8-bit color step, and cut the warm-up time roughly in half
const TRANSFER_LUT_SIZE = 2048;

const buildTransferLut = (
  transfer: (value: number) => number
): Float32Array => {
  const lut = new Float32Array(TRANSFER_LUT_SIZE + 1);

  for (let index = 0; index <= TRANSFER_LUT_SIZE; index += 1) {
    lut[index] = transfer(index / TRANSFER_LUT_SIZE);
  }

  return lut;
};

const srgbToLinearLut = buildTransferLut(srgbToLinear);
const linearToSrgbLut = buildTransferLut(linearToSrgb);

const sampleLut = (lut: Float32Array, value: number): number => {
  const scaled = clamp(value, 0, 1) * TRANSFER_LUT_SIZE;
  const index = Math.trunc(scaled);
  const next = lut[Math.min(index + 1, TRANSFER_LUT_SIZE)];

  return lut[index] + (next - lut[index]) * (scaled - index);
};

type ColorGrade = (
  red: number,
  green: number,
  blue: number
) => [number, number, number];

/**
 * Grades a particle color in linear light: converts into Display P3 when the
 * drawing buffer is wide gamut (same hues, but headroom to saturate beyond
 * sRGB like the film scans in NASA photography), then boosts saturation.
 */
const createColorGrade = (
  wideGamut: boolean,
  saturation: number
): ColorGrade => {
  // Shared result tuple: consumed immediately by the writer, so no
  // per-particle allocation
  const graded: [number, number, number] = [0, 0, 0];

  return (red, green, blue) => {
    let r = sampleLut(srgbToLinearLut, red / 255);
    let g = sampleLut(srgbToLinearLut, green / 255);
    let b = sampleLut(srgbToLinearLut, blue / 255);

    if (wideGamut) {
      [r, g, b] = [
        SRGB_TO_P3[0] * r + SRGB_TO_P3[1] * g + SRGB_TO_P3[2] * b,
        SRGB_TO_P3[3] * r + SRGB_TO_P3[4] * g + SRGB_TO_P3[5] * b,
        SRGB_TO_P3[6] * r + SRGB_TO_P3[7] * g + SRGB_TO_P3[8] * b,
      ];
    }

    const boost = wideGamut ? saturation : 1 + (saturation - 1) * 0.5;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    r = clamp(luminance + (r - luminance) * boost, 0, 1);
    g = clamp(luminance + (g - luminance) * boost, 0, 1);
    b = clamp(luminance + (b - luminance) * boost, 0, 1);

    graded[0] = sampleLut(linearToSrgbLut, r) * 255;
    graded[1] = sampleLut(linearToSrgbLut, g) * 255;
    graded[2] = sampleLut(linearToSrgbLut, b) * 255;

    return graded;
  };
};

/** Approximate conversion of blackbody temperature (K) to sRGB. */
const kelvinToRgb = (kelvin: number): [number, number, number] => {
  const t = clamp(kelvin, 1500, 40000) / 100;
  let red = 255;
  let blue = 255;
  let green: number;

  if (t > 66) {
    red = 329.698727446 * (t - 60) ** -0.1332047592;
    green = 288.1221695283 * (t - 60) ** -0.0755148492;
  } else {
    green = 99.4708025861 * Math.log(t) - 161.1195681661;
    blue = t <= 19 ? 0 : 138.5177312231 * Math.log(t - 10) - 305.0447927307;
  }

  return [clamp(red, 0, 255), clamp(green, 0, 255), clamp(blue, 0, 255)];
};

// 黑体颜色使用插值查找表与共享结果，避免重复幂、对数运算和数组分配。
const KELVIN_LUT_SIZE = 512;
const KELVIN_MIN = 1500;
const KELVIN_STEP = (40000 - KELVIN_MIN) / KELVIN_LUT_SIZE;
const kelvinLut = ((): Float32Array => {
  const lut = new Float32Array((KELVIN_LUT_SIZE + 1) * 3);

  for (let index = 0; index <= KELVIN_LUT_SIZE; index += 1) {
    const [red, green, blue] = kelvinToRgb(KELVIN_MIN + KELVIN_STEP * index);

    lut[index * 3] = red;
    lut[index * 3 + 1] = green;
    lut[index * 3 + 2] = blue;
  }

  return lut;
})();
const kelvinScratch: [number, number, number] = [0, 0, 0];

const kelvinRgb = (kelvin: number): [number, number, number] => {
  const scaled = clamp((kelvin - KELVIN_MIN) / KELVIN_STEP, 0, KELVIN_LUT_SIZE);
  const index = Math.trunc(scaled);
  const next = Math.min(index + 1, KELVIN_LUT_SIZE) * 3;
  const fraction = scaled - index;

  for (let channel = 0; channel < 3; channel += 1) {
    const from = kelvinLut[index * 3 + channel];

    kelvinScratch[channel] =
      from + (kelvinLut[next + channel] - from) * fraction;
  }

  return kelvinScratch;
};

type LayerMeta = Omit<GalaxyLayer, "count" | "data">;

type ParticleWriter = {
  add: (
    a: number,
    orbitRatio: number,
    theta0: number,
    phase0: number,
    omegaRel: number,
    z: number,
    size: number,
    twinklePhase: number,
    red: number,
    green: number,
    blue: number,
    brightness: number
  ) => void;
  build: (meta: LayerMeta) => GalaxyLayer;
};

// Particles are written straight into the interleaved GPU layout (stride 9
// words: 8 floats then 4 packed color bytes) through a growing typed array,
// skipping the intermediate number array of the naive push-then-pack
const PARTICLE_WORDS = PARTICLE_STRIDE / 4;

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));

const createWriter = (grade: ColorGrade): ParticleWriter => {
  let capacity = 4096;
  let floats = new Float32Array(capacity * PARTICLE_WORDS);
  let bytes = new Uint8Array(floats.buffer);
  let count = 0;

  return {
    // Positional parameters, no rest/spread: this is the hottest call site
    // of generation, and a rest parameter would allocate per particle
    add: (
      a,
      orbitRatio,
      theta0,
      phase0,
      omegaRel,
      z,
      size,
      twinklePhase,
      red,
      green,
      blue,
      brightness
    ) => {
      if (count === capacity) {
        capacity *= 2;

        const grown = new Float32Array(capacity * PARTICLE_WORDS);

        grown.set(floats);
        floats = grown;
        bytes = new Uint8Array(floats.buffer);
      }

      const floatOffset = count * PARTICLE_WORDS;
      const colorOffset = count * PARTICLE_STRIDE + PARTICLE_FLOATS * 4;
      const [r, g, b] = grade(red, green, blue);

      floats[floatOffset] = a;
      floats[floatOffset + 1] = orbitRatio;
      floats[floatOffset + 2] = theta0;
      floats[floatOffset + 3] = phase0;
      floats[floatOffset + 4] = omegaRel;
      floats[floatOffset + 5] = z;
      floats[floatOffset + 6] = size;
      floats[floatOffset + 7] = twinklePhase;
      bytes[colorOffset] = clamp(Math.round(r), 0, 255);
      bytes[colorOffset + 1] = clamp(Math.round(g), 0, 255);
      bytes[colorOffset + 2] = clamp(Math.round(b), 0, 255);
      bytes[colorOffset + 3] = clamp(Math.round(brightness), 0, 255);
      count += 1;
    },
    build: (meta) => {
      // 质量调节只绘制各层前段，使用与数量互质的黄金比例步长重排，
      // 保证降低质量时仍均匀保留各处恒星。层内混合不依赖绘制顺序。
      const data = new ArrayBuffer(count * PARTICLE_STRIDE);
      const gathered = new Uint32Array(data);
      const words = new Uint32Array(floats.buffer);
      let stride = Math.max(Math.round(count * 0.618034), 1);

      while (gcd(stride, count) !== 1) stride += 1;

      for (let index = 0, source = 0; index < count; index += 1) {
        const from = source * PARTICLE_WORDS;
        const to = index * PARTICLE_WORDS;

        for (let word = 0; word < PARTICLE_WORDS; word += 1) {
          gathered[to + word] = words[from + word];
        }

        source = (source + stride) % count;
      }

      return { ...meta, count, data };
    },
  };
};

export const generateGalaxy = (
  quality = 1,
  wideGamut = false,
  seed = 0x1a2b3c4d
): GalaxyLayer[] => {
  const random = createRng(seed);

  const scaled = (count: number): number => Math.round(count * quality);
  const grade = (saturation: number): ColorGrade =>
    createColorGrade(wideGamut, saturation);

  // Far background starfield on a large sphere
  const farStars = createWriter(grade(1.06));

  for (let index = 0; index < scaled(BASE_COUNTS.farStars); index += 1) {
    const azimuth = random() * TAU;
    const cosPolar = random() * 2 - 1;
    const sinPolar = Math.sqrt(1 - cosPolar * cosPolar);
    const radius = 7 + random() * 3;
    const warmth = random();
    let [red, green, blue] = [235, 235, 240];

    if (warmth < 0.1) {
      [red, green, blue] = kelvinRgb(3400 + random() * 1600);
    } else if (warmth < 0.22) {
      [red, green, blue] = kelvinRgb(9000 + random() * 12000);
    }

    farStars.add(
      radius * sinPolar,
      1,
      azimuth,
      0,
      0,
      radius * cosPolar,
      0.025 + random() ** 3 * 0.045,
      random() * TAU,
      red,
      green,
      blue,
      70 + random() * 180
    );
  }

  // 近景恒星保留稀疏的小光点，为背景增加深度视差。
  const nearStars = createWriter(grade(1.08));

  for (let index = 0; index < scaled(BASE_COUNTS.nearStars); index += 1) {
    const azimuth = random() * TAU;
    const cosPolar = random() * 2 - 1;
    const sinPolar = Math.sqrt(1 - cosPolar * cosPolar);
    const radius = 1.05 + random() * 0.35;
    const warmth = random();
    let [red, green, blue] = [240, 238, 245];

    if (warmth < 0.18) {
      [red, green, blue] = kelvinRgb(3200 + random() * 1500);
    } else if (warmth < 0.36) {
      [red, green, blue] = kelvinRgb(10000 + random() * 15000);
    }

    nearStars.add(
      radius * sinPolar,
      1,
      azimuth,
      0,
      0,
      radius * cosPolar,
      0.003 + random() ** 2 * 0.004,
      random() * TAU,
      red,
      green,
      blue,
      80 + random() * 80
    );
  }

  return [
    farStars.build({
      alpha: 1,
      falloffK: 4.5,
      maxPointSize: 3.5,
      novaAmp: 0,
      patternMul: 0,
      sizeMul: 1,
      spikeAmp: 0,
      target: "background",
      twinkleAmp: 0.22,
    }),
    nearStars.build({
      alpha: 0.6,
      falloffK: 4.5,
      // Foreground stars stay pinpoints however close they drift: a real
      // star's image is the optics' PSF, never a big soft disc
      maxPointSize: 4,
      novaAmp: 0,
      patternMul: 0,
      sizeMul: 1,
      spikeAmp: 0,
      target: "foreground",
      twinkleAmp: 0.2,
    }),
  ];
};
