/* eslint-disable unicorn/no-null -- 缺失样本和空图范围保持显式 null。 */
import { type ChartPoint } from "components/apps/Dashboard/model";

export type ChartCoordinate = {
  at: string;
  value: number;
  x: number;
  y: number;
};
export type ChartGeometry = {
  max: null | number;
  min: null | number;
  segments: ChartCoordinate[][];
};
export const getChartGeometry = (points: ChartPoint[]): ChartGeometry => {
  const ordered = [...points].sort(
    (first, second) => Date.parse(first.at) - Date.parse(second.at)
  );
  const times = ordered.map(({ at }) => Date.parse(at)).filter(Number.isFinite);
  const values = ordered
    .filter(
      ({ at, value }) =>
        Number.isFinite(Date.parse(at)) &&
        value !== null &&
        Number.isFinite(value)
    )
    .map(({ value }) => value as number);

  if (values.length === 0 || times.length === 0) {
    return { max: null, min: null, segments: [] };
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const firstTime = Math.min(...times);
  const timeSpan = Math.max(...times) - firstTime;
  const segments: ChartCoordinate[][] = [];
  let segment: ChartCoordinate[] = [];

  ordered.forEach(({ at, value }) => {
    const time = Date.parse(at);

    if (value === null || !Number.isFinite(value) || !Number.isFinite(time)) {
      if (segment.length > 0) segments.push(segment);
      segment = [];
      return;
    }
    segment.push({
      at,
      value,
      x: timeSpan === 0 ? 150 : 8 + ((time - firstTime) / timeSpan) * 284,
      y: max === min ? 40 : 70 - ((value - min) / (max - min)) * 60,
    });
  });
  if (segment.length > 0) segments.push(segment);
  return { max, min, segments };
};
