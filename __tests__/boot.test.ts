import { bootScript } from "components/system/Boot/bootstrap";

const completeAll = (): void => {
  window.LifeOSBoot?.complete("session");
  window.LifeOSBoot?.complete("desktop");
  window.LifeOSBoot?.complete("styles");
  window.LifeOSBoot?.complete("taskbar");
  window.LifeOSBoot?.complete("wallpaper");
};

describe("hTML startup controller", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    localStorage.clear();
    document.body.innerHTML = `<section id="lifeos-boot"><p id="lifeos-boot-status"></p><a id="lifeos-boot-retry" hidden href="">Reload</a></section><div id="lifeos-root" inert aria-hidden="true"></div>`;
  });

  afterEach(() => {
    completeAll();
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    document.body.innerHTML = "";
  });

  it("all real readiness signals release the desktop on the next frame", () => {
    window.eval(bootScript);
    window.LifeOSBoot?.complete("session");
    window.LifeOSBoot?.complete("desktop");
    window.LifeOSBoot?.complete("taskbar");
    expect(document.querySelector<HTMLElement>("#lifeos-boot")?.hidden).toBe(
      false
    );
    jest.advanceTimersByTime(5000);
    expect(document.querySelector<HTMLElement>("#lifeos-boot")?.hidden).toBe(
      false
    );
    window.LifeOSBoot?.complete("wallpaper");
    jest.advanceTimersByTime(16);
    expect(document.querySelector<HTMLElement>("#lifeos-boot")?.hidden).toBe(
      true
    );
    expect(document.querySelector("#lifeos-root")?.hasAttribute("inert")).toBe(
      false
    );
  });

  it("cached readiness has no minimum playback duration", () => {
    window.eval(bootScript);
    completeAll();
    jest.advanceTimersByTime(16);
    expect(document.querySelector<HTMLElement>("#lifeos-boot")?.hidden).toBe(
      true
    );
  });

  it("the slow connection timer offers retry while preserving the gate", () => {
    window.eval(bootScript);
    jest.advanceTimersByTime(20000);
    expect(
      document.querySelector("#lifeos-boot-status")?.textContent
    ).toContain("Still loading resources");
    expect(
      document.querySelector<HTMLElement>("#lifeos-boot-retry")?.hidden
    ).toBe(false);
    expect(document.querySelector("#lifeos-root")?.hasAttribute("inert")).toBe(
      true
    );
    completeAll();
    jest.advanceTimersByTime(16);
    expect(document.querySelector<HTMLElement>("#lifeos-boot")?.hidden).toBe(
      true
    );
  });

  it("script download errors work before React starts and remain closed", () => {
    window.eval(bootScript);
    const script = document.createElement("script");
    script.src = "/_next/static/chunks/pages/index-test.js";
    document.body.append(script);
    script.dispatchEvent(new Event("error"));
    jest.advanceTimersByTime(30000);
    expect(
      document.querySelector("#lifeos-boot-status")?.textContent
    ).toContain("could not load");
    expect(document.querySelector<HTMLElement>("#lifeos-boot")?.hidden).toBe(
      false
    );
  });

  it("saved Chinese preference is applied without the application bundle", () => {
    localStorage.setItem(
      "hyc.preferences.v1",
      JSON.stringify({ language: "zh" })
    );
    window.eval(bootScript);
    expect(document.querySelector("#lifeos-boot-status")?.textContent).toBe(
      "正在启动系统…"
    );
    expect(document.querySelector("#lifeos-boot-retry")?.textContent).toBe(
      "重新加载"
    );
  });
});
