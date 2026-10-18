import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import { type DashboardViewProps } from "components/apps/Dashboard/model";
import Memberships from "components/apps/Dashboard/views/Memberships";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

describe("membership records", () => {
  let container: HTMLDivElement;
  let root: Root;
  const renderView = (props: Partial<DashboardViewProps> = {}): void => {
    act(() =>
      root.render(
        <Memberships
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

  it("reads cancelled renewal, active access and payment history independently without mutation", () => {
    const data = makeDemoData();
    const snapshot = JSON.stringify(data);

    renderView({ data, selectedId: "demo-design" });
    expect(container.textContent).toContain("Access active");
    expect(container.textContent).toContain("Renewal cancelled");
    expect(container.textContent).toContain("Payment history");
    expect(container.querySelector("tbody")?.textContent).toMatch(
      /CNY\s*68\.00/
    );
    expect(container.querySelector("form")).toBeNull();
    expect(container.querySelector('button[type="submit"]')).toBeNull();
    expect(container.textContent).not.toContain("Edit sample");
    expect(container.textContent).not.toContain("Record sample payment");
    expect(JSON.stringify(data)).toBe(snapshot);
  });

  it("does not present unknown amounts as free or invent trial payments", () => {
    renderView({ selectedId: "demo-archive" });
    expect(container.textContent).toContain("Unconfirmed");
    expect(container.textContent).not.toMatch(/CNY\s*0\.00/);
    renderView({ selectedId: "demo-notes" });
    expect(container.textContent).toMatch(/CNY\s*0\.00/);
    renderView({ selectedId: "demo-study" });
    expect(container.textContent).toContain("Trial access");
    expect(container.textContent).toContain("No confirmed payments recorded");
  });

  it("preserves list filters across detail navigation and returning to the list", () => {
    const onNavigate = jest.fn();

    renderView({ onNavigate });
    const category = container.querySelector("select");

    if (!category) throw new Error("MISSING_CATEGORY_FILTER");
    act(() => {
      category.value = "media";
      category.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const details = container.querySelector<HTMLButtonElement>(
      '[aria-label="Details: Demo Cinema"]'
    );

    if (!details) throw new Error("MISSING_MEMBERSHIP_DETAIL");
    act(() => details.click());
    expect(onNavigate).toHaveBeenCalledWith("memberships", "demo-cinema");
    renderView({ onNavigate, selectedId: "demo-cinema" });
    const back = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Back to memberships"
    );

    if (!back) throw new Error("MISSING_BACK_BUTTON");
    act(() => back.click());
    expect(onNavigate).toHaveBeenLastCalledWith("memberships");
    renderView({ onNavigate });
    expect(container.querySelector("select")?.value).toBe("media");
    expect(container.querySelector("tbody")?.textContent).toContain(
      "Demo Cinema"
    );
    expect(container.querySelector("tbody")?.textContent).not.toContain(
      "Demo Cloud"
    );
  });

  it("defaults to CNY and retains USD across list and detail navigation", () => {
    const data = makeDemoData();
    const before = JSON.stringify(data);
    renderView({ data });
    const currencyButton = (currency: string): HTMLButtonElement => {
      const button = [
        ...container.querySelectorAll<HTMLButtonElement>("button"),
      ].find((item) => item.textContent === currency);
      if (!button) throw new Error("MISSING_CURRENCY_BUTTON");
      return button;
    };
    expect(currencyButton("CNY").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("dl")?.textContent).toMatch(/CNY\s*136\.00/);
    act(() => currencyButton("USD").click());
    expect(container.querySelector("dl")?.textContent).toMatch(/USD\s*18\.89/);
    expect(container.querySelector("dl")?.textContent).toMatch(/USD\s*132\.92/);
    renderView({ data, selectedId: "demo-cinema" });
    expect(currencyButton("USD").getAttribute("aria-pressed")).toBe("true");
    expect(container.querySelector("tbody")?.textContent).toMatch(
      /USD\s*3\.47/
    );
    renderView({ data, locale: "zh" });
    expect(currencyButton("USD").getAttribute("aria-pressed")).toBe("true");
    act(() => currencyButton("CNY").click());
    expect(container.querySelector("dl")?.textContent).toMatch(/CNY\s*136\.00/);
    expect(JSON.stringify(data)).toBe(before);
  });
});
