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
        onUpdate={jest.fn()}
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

test("saving directory edits updates shared memory without changing observations", () => {
  const data = makeDemoData();
  const original = data.services.find(({ id }) => id === "demo-notebook");
  const onUpdate = jest.fn<void, Parameters<DashboardViewProps["onUpdate"]>>();
  const onDirtyChange = jest.fn();

  if (!original) throw new Error("Missing notebook fixture");
  renderView({ data, onDirtyChange, onUpdate, selectedId: original.id });
  act(() => button("编辑示例").click());
  const input = container.querySelector("input");
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  if (!input || !setValue) throw new Error("Missing editable name");
  act(() => {
    setValue.call(input, "修改后的演示服务");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  expect(onDirtyChange).toHaveBeenLastCalledWith(true);
  const save = button("保存示例");

  expect(save.type).toBe("submit");
  act(() => save.click());
  expect(onUpdate).toHaveBeenCalledTimes(1);
  const [update] = onUpdate.mock.calls[0];
  const updated = update(data).services.find(({ id }) => id === original.id);

  expect(updated?.name.zh).toBe("修改后的演示服务");
  expect(updated?.observedAt).toBe(original.observedAt);
  expect(updated?.monitor).toBe(original.monitor);
  expect(updated?.events).toBe(original.events);
  expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  expect(container.textContent).toContain("示例已保存在本窗口");
});

test("visitor preview cannot edit and source failure does not establish a target outage", () => {
  const data = makeDemoData();
  const original = data.services.find(({ id }) => id === "demo-notebook");

  if (!original) throw new Error("Missing notebook fixture");
  data.services = [{ ...original, freshness: "unavailable" }];
  renderView({ data, previewMode: "visitor", selectedId: original.id });
  expect(container.textContent).toContain(
    "监测来源不可用，不能据此判断目标服务宕机"
  );
  expect(container.textContent).toContain("上次观测状态: 正常");
  expect(container.textContent).toContain("访客预览为只读");
  expect(container.textContent).not.toContain("编辑示例");
  expect(container.querySelector("a")).toBeNull();
});

test("cancelling offers a way to keep editing or discard without saving", () => {
  const onUpdate = jest.fn();
  const onDirtyChange = jest.fn();

  renderView({ onDirtyChange, onUpdate, selectedId: "demo-notebook" });
  act(() => button("编辑示例").click());
  const input = container.querySelector("input");
  const setValue = Object.getOwnPropertyDescriptor(
    HTMLInputElement.prototype,
    "value"
  )?.set;

  if (!input || !setValue) throw new Error("Missing editable name");
  act(() => {
    setValue.call(input, "尚未保存的服务名称");
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
  act(() => button("取消").click());
  expect(container.textContent).toContain("放弃此示例尚未保存的修改");
  act(() => button("继续编辑").click());
  expect(input.value).toBe("尚未保存的服务名称");
  act(() => button("取消").click());
  act(() => button("放弃修改").click());
  expect(onUpdate).not.toHaveBeenCalled();
  expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  expect(container.textContent).toContain("演示笔记服务");
  expect(container.textContent).not.toContain("尚未保存的服务名称");
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
