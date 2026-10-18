import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import { type DashboardViewProps } from "components/apps/Dashboard/model";
import Personal from "components/apps/Dashboard/views/Personal/index";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("personal records", () => {
  let container: HTMLDivElement;
  let root: Root;
  const renderView = (props: Partial<DashboardViewProps> = {}): void => {
    act(() =>
      root.render(
        <Personal
          data={makeDemoData()}
          locale="en"
          onNavigate={jest.fn()}
          {...props}
        />
      )
    );
  };

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });
  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("renders all four health records without mutation or editing controls", () => {
    const data = makeDemoData();
    const snapshot = JSON.stringify(data);

    renderView({ data, selectedId: "steps" });
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector('input[type="number"]')).toBeNull();
    expect(container.textContent).not.toContain("Edit health sample");
    expect(container.textContent).not.toContain("Visitor visibility");
    data.personal.health.forEach(({ label }) => {
      expect(container.textContent).toContain(label.en);
    });
    expect(JSON.stringify(data)).toBe(snapshot);
  });

  it("keeps missing readings and chart gaps distinct from zero", () => {
    const data = makeDemoData();
    const weight = data.personal.health.find(({ id }) => id === "weight");

    expect(weight?.value).toBeNull();
    renderView({ data, selectedId: "weight" });
    expect(
      container.querySelector('[data-health-metric="weight"] strong')
        ?.textContent
    ).toBe("—");
    expect(container.textContent).toContain("No sample provided");
    expect(container.textContent).toContain("Missing sample");
    expect(container.textContent).toContain("kg");
    expect(
      data.personal.health
        .find(({ id }) => id === "heartRate")
        ?.points.some(({ value }) => value === null)
    ).toBe(true);
  });

  it("keeps activity detail navigation and bilingual checkup records readable", () => {
    const data = makeDemoData();
    const onNavigate = jest.fn();
    const activity = data.personal.activities[0];

    renderView({ data, onNavigate, selectedId: "activity" });
    const entry = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === activity.title.en
    );

    if (!entry) throw new Error("MISSING_ACTIVITY_ENTRY");
    act(() => entry.click());
    expect(onNavigate).toHaveBeenCalledWith("personal", activity.id);
    const checkup = data.personal.checkups[0];

    renderView({ data, locale: "zh", selectedId: checkup.id });
    expect(container.textContent).toContain(checkup.title.zh);
    expect(container.textContent).toContain("未提供");
    expect(container.querySelector("form")).toBeNull();
  });
});
