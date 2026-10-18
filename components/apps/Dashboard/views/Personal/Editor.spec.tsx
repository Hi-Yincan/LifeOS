import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { makeDemoData } from "components/apps/Dashboard/fixtures";
import { type DashboardDemoData } from "components/apps/Dashboard/model";
import { selectVisibleDemoData } from "components/apps/Dashboard/shared";
import Editor from "components/apps/Dashboard/views/Personal/Editor";
import Personal from "components/apps/Dashboard/views/Personal/index";

Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });

const changeInput = (
  input: HTMLInputElement | HTMLTextAreaElement,
  value: string
): void => {
  const setValue = Object.getOwnPropertyDescriptor(
    input instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype,
    "value"
  )?.set;

  if (!setValue) throw new Error("MISSING_INPUT_SETTER");
  act(() => {
    setValue.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};

describe("personal sample editing", () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement("div");
    document.body.append(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => root.unmount());
    container.remove();
  });

  it("submits through the save button and replaces the same instant without duplicate samples", () => {
    const state = { data: makeDemoData() };
    const original = state.data.personal.health.find(
      ({ id }) => id === "steps"
    );
    const onClose = jest.fn();
    const onDirtyChange = jest.fn();
    const onUpdate = jest.fn(
      (update: (data: DashboardDemoData) => DashboardDemoData) => {
        state.data = update(state.data);
      }
    );

    act(() =>
      root.render(
        <Editor
          data={state.data}
          locale="en"
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onNavigate={jest.fn()}
          onUpdate={onUpdate}
          target={{ id: "steps", kind: "health" }}
        />
      )
    );
    const input =
      container.querySelector<HTMLInputElement>("input[type=number]");
    const save = container.querySelector<HTMLButtonElement>(
      "button[type=submit]"
    );

    if (!input || !save) throw new Error("MISSING_EDITOR_CONTROLS");
    expect(onDirtyChange).not.toHaveBeenCalled();
    changeInput(input, "7000");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    act(() => save.click());
    const updated = state.data.personal.health.find(({ id }) => id === "steps");

    expect(onUpdate).toHaveBeenCalledTimes(1);
    expect(updated?.value).toBe(7000);
    expect(updated?.points).toHaveLength(original?.points.length || 0);
    expect(
      updated?.points.filter(
        ({ at }) => Date.parse(at) === Date.parse(original?.observedAt || "")
      )
    ).toHaveLength(1);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("keeps an empty health reading missing instead of converting it to zero", () => {
    const state = { data: makeDemoData() };

    act(() =>
      root.render(
        <Editor
          data={state.data}
          locale="en"
          onClose={jest.fn()}
          onNavigate={jest.fn()}
          onUpdate={(update) => {
            state.data = update(state.data);
          }}
          target={{ id: "heartRate", kind: "health" }}
        />
      )
    );
    const input =
      container.querySelector<HTMLInputElement>("input[type=number]");
    const save = container.querySelector<HTMLButtonElement>(
      "button[type=submit]"
    );

    if (!input || !save) throw new Error("MISSING_EDITOR_CONTROLS");
    changeInput(input, "");
    act(() => save.click());
    const updated = state.data.personal.health.find(
      ({ id }) => id === "heartRate"
    );

    expect(updated?.value).toBeNull();
    expect(updated?.points[updated.points.length - 1].value).toBeNull();
  });

  it("discards changes without calling the shared updater", () => {
    const onUpdate = jest.fn();
    const onClose = jest.fn();
    const onDirtyChange = jest.fn();

    act(() =>
      root.render(
        <Editor
          data={makeDemoData()}
          locale="en"
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onNavigate={jest.fn()}
          onUpdate={onUpdate}
          target={{ id: "demo-focus", kind: "activity" }}
        />
      )
    );
    const input = container.querySelector<HTMLInputElement>("input");

    if (!input) throw new Error("MISSING_TITLE_INPUT");
    changeInput(input, "Changed sample");
    const cancel = [...container.querySelectorAll("button")].find(
      (button) => button.textContent === "Discard changes"
    );

    if (!cancel) throw new Error("MISSING_CANCEL_BUTTON");
    act(() => cancel.click());
    expect(onUpdate).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalledWith(false);
    expect(onDirtyChange).toHaveBeenLastCalledWith(false);
  });

  it("preserves the draft language when the interface language changes before saving", () => {
    const state = { data: makeDemoData() };
    const original = state.data.personal.checkups[0];
    const onClose = jest.fn();
    const onDirtyChange = jest.fn();
    const onNavigate = jest.fn();
    const onUpdate = (
      update: (data: DashboardDemoData) => DashboardDemoData
    ): void => {
      state.data = update(state.data);
    };

    act(() =>
      root.render(
        <Editor
          data={state.data}
          locale="en"
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onNavigate={onNavigate}
          onUpdate={onUpdate}
          target={{ id: original.id, kind: "checkup" }}
        />
      )
    );
    const title = container.querySelector<HTMLInputElement>("input");
    const note = container.querySelector<HTMLTextAreaElement>("textarea");

    if (!title || !note) throw new Error("MISSING_TEXT_FIELDS");
    changeInput(title, "Edited English checkup");
    changeInput(note, "Edited English note");
    act(() =>
      root.render(
        <Editor
          data={state.data}
          locale="zh"
          onClose={onClose}
          onDirtyChange={onDirtyChange}
          onNavigate={onNavigate}
          onUpdate={onUpdate}
          target={{ id: original.id, kind: "checkup" }}
        />
      )
    );
    expect(container.querySelector<HTMLInputElement>("input")?.value).toBe(
      "Edited English checkup"
    );
    expect(
      container.querySelector<HTMLTextAreaElement>("textarea")?.value
    ).toBe("Edited English note");
    expect(container.textContent).toContain("当前编辑文字语言：英文");
    expect(onDirtyChange).toHaveBeenLastCalledWith(true);
    const save = container.querySelector<HTMLButtonElement>(
      "button[type=submit]"
    );

    if (!save) throw new Error("MISSING_SAVE_BUTTON");
    act(() => save.click());
    const updated = state.data.personal.checkups[0];

    expect(updated.title.en).toBe("Edited English checkup");
    expect(updated.note.en).toBe("Edited English note");
    expect(updated.title.zh).toBe(original.title.zh);
    expect(updated.note.zh).toBe(original.note.zh);
    expect(onClose).toHaveBeenCalledWith(true);
  });

  it("renders the visitor preview without editing or policy controls", () => {
    const data = selectVisibleDemoData(makeDemoData(), "visitor");

    act(() =>
      root.render(
        <Personal
          data={data}
          locale="en"
          onNavigate={jest.fn()}
          onUpdate={jest.fn()}
          previewMode="visitor"
          selectedId="steps"
        />
      )
    );
    expect(container.querySelector("form")).toBeNull();
    expect(container.textContent).not.toContain("Edit health sample");
    expect(container.textContent).not.toContain("Visitor visibility");
    expect(container.textContent).toContain("Read-only visitor preview");
  });
});
