import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import { type DashboardViewProps } from "components/apps/Dashboard/model";
import Services from "components/apps/Dashboard/views/Services";

let container: HTMLDivElement;
let root: Root;

const renderView = (overrides: Partial<DashboardViewProps> = {}): void => {
  act(() => {
    root.render(
      <Services
        data={makeDemoData()}
        locale="zh"
        onNavigate={jest.fn()}
        {...overrides}
      />
    );
  });
};

const button = (text: string): HTMLButtonElement => {
  const match = [...container.querySelectorAll("button")].find(
    (item) => item.textContent === text
  );

  if (!match) throw new Error(`Missing button: ${text}`);
  return match;
};

beforeEach(() => {
  Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
});

test("pending checks without an observation remain selectable and unmonitored entries stay separate", () => {
  renderView();
  const select = container.querySelector("select");

  if (!select) throw new Error("Missing status filter");
  act(() => {
    select.value = "pending";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(container.textContent).toContain("演示检索服务");
  expect(container.textContent).not.toContain("演示内部服务");
  expect(container.textContent).not.toContain("上次观测状态");

  act(() => {
    select.value = "unmonitored";
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(container.textContent).toContain("演示内部服务");
  expect(container.textContent).not.toContain("演示检索服务");
});

test("reading details and changing the chart window preserves observations", () => {
  const data = makeDemoData();
  const original = data.services.find(({ id }) => id === "demo-notebook");

  if (!original) throw new Error("Missing notebook fixture");
  const snapshot = JSON.stringify(data);
  const onNavigate = jest.fn();

  renderView({ data, onNavigate, selectedId: original.id });
  expect(container.querySelector("form")).toBeNull();
  expect(container.textContent).not.toContain("编辑示例");
  act(() => button("最近 6 个示例小时").click());
  expect(button("最近 6 个示例小时").getAttribute("aria-pressed")).toBe("true");
  act(() => button("返回服务列表").click());
  expect(onNavigate).toHaveBeenCalledWith("services");
  expect(JSON.stringify(data)).toBe(snapshot);
});

test("read-only browsing cannot edit and source failure does not establish a target outage", () => {
  const data = makeDemoData();
  const original = data.services.find(({ id }) => id === "demo-notebook");

  if (!original) throw new Error("Missing notebook fixture");
  data.services = [{ ...original, freshness: "unavailable" }];
  renderView({ data, selectedId: original.id });
  expect(container.textContent).toContain(
    "监测来源不可用，不能据此判断目标服务宕机"
  );
  expect(container.textContent).toContain("上次观测状态: 正常");
  expect(container.textContent).not.toContain("编辑示例");
  expect(container.querySelector("a")).toBeNull();
});

test("list and detail use the same health counts and expose no clear-filter action", () => {
  const data = makeDemoData();

  data.services = data.services.filter(({ id }) => id === "demo-drive");
  renderView({ data });
  const rate = container.querySelector('[aria-label="90 日可用率"]');

  expect(rate?.textContent).toContain("可用率 99.50%");
  expect(rate?.textContent).toContain("覆盖 100.00%");
  expect(container.querySelectorAll("[data-health]")).toHaveLength(90);
  expect(container.textContent).not.toContain("清除筛选");
  renderView({ data, selectedId: "demo-drive" });
  expect(
    container.querySelector('[aria-label="90 日可用率"]')?.textContent
  ).toBe(rate?.textContent);
});

test("health history offers one keyboard stop with day navigation, pointer selection and Escape dismissal", () => {
  const data = makeDemoData();

  data.services = data.services.filter(({ id }) => id === "demo-notebook");
  renderView({ data });
  const slider = container.querySelector<HTMLElement>('[role="slider"]');

  if (!slider) throw new Error("Missing health history slider");
  expect(slider.tabIndex).toBe(0);
  expect(slider.querySelectorAll("[tabindex],button")).toHaveLength(0);
  expect(
    slider.querySelector<HTMLElement>('[data-date="2026-08-01"]')?.dataset
      .health
  ).toBe("unknown");
  act(() => slider.focus());
  act(() =>
    slider.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Home" })
    )
  );
  expect(slider.getAttribute("aria-valuetext")).toContain("2026-07-20 UTC");
  act(() =>
    slider.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowRight" })
    )
  );
  expect(slider.getAttribute("aria-valuenow")).toBe("2");
  act(() =>
    slider.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "End" })
    )
  );
  expect(slider.getAttribute("aria-valuetext")).toContain("2026-10-17 UTC");
  act(() =>
    slider.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "Escape" })
    )
  );
  expect(slider.parentElement?.querySelector('[role="status"]')).toBeNull();
  act(() =>
    slider.dispatchEvent(
      new KeyboardEvent("keydown", { bubbles: true, key: "ArrowLeft" })
    )
  );
  expect(slider.parentElement?.querySelector('[role="status"]')).not.toBeNull();
  jest.spyOn(slider, "getBoundingClientRect").mockReturnValue({
    bottom: 28,
    height: 28,
    left: 0,
    right: 900,
    toJSON: () => ({}),
    top: 0,
    width: 900,
    x: 0,
    y: 0,
  });
  act(() =>
    slider.dispatchEvent(
      new MouseEvent("pointerdown", { bubbles: true, clientX: 125 })
    )
  );
  expect(slider.getAttribute("aria-valuenow")).toBe("13");
  expect(slider.getAttribute("aria-valuetext")).toContain(
    "2026-08-01 UTC · 缺少样本"
  );
  expect(slider.getAttribute("aria-valuetext")).toContain("覆盖 720/1440");
  act(() => slider.blur());
  expect(slider.parentElement?.querySelector('[role="status"]')).toBeNull();
});

test("an unavailable source without an observation cannot present a current healthy result", () => {
  const data = makeDemoData();
  const original = data.services.find(({ id }) => id === "demo-notebook");

  if (!original) throw new Error("Missing notebook fixture");
  data.services = [
    {
      ...original,
      freshness: "unavailable",
      // eslint-disable-next-line unicorn/no-null -- 明确验证没有已知观测的来源失联场景。
      observedAt: null,
    },
  ];
  renderView({ data });
  expect(
    [...container.querySelectorAll("span")].some(
      (element) => element.textContent === "正常"
    )
  ).toBe(false);
  expect(container.textContent).toContain("未知");
});
