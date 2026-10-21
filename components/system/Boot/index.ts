import { useEffect } from "react";
import {
  BOOT_READY_EVENT,
  completeBootStage,
} from "components/system/Boot/bootstrap";
import { getProcess } from "contexts/process";
import { useForegroundId, useSessionLoaded } from "contexts/session";
import { focusWithin } from "utils/keyboard";

const Boot = (): React.ReactNode => {
  const sessionLoaded = useSessionLoaded();
  const foregroundId = useForegroundId();

  useEffect(() => {
    // 启动隔离会阻止初始窗口获取焦点；放行后交回原生焦点逻辑维护层叠顺序。
    const restoreWindowFocus = (): void =>
      focusWithin(getProcess(foregroundId)?.componentWindow);
    if (!window.LifeOSBoot?.ready) {
      window.addEventListener(BOOT_READY_EVENT, restoreWindowFocus, {
        once: true,
      });
    }
    return () =>
      window.removeEventListener(BOOT_READY_EVENT, restoreWindowFocus);
  }, [foregroundId]);

  useEffect(() => {
    let disposed = false;
    let revision = 0;
    const checkDesktop: MutationCallback = (_records, observer) => {
      revision += 1;
      const currentRevision = revision;
      const desktop = document.querySelector('main > ol[aria-label="Desktop"]');
      if (
        !desktop ||
        desktop.getAttribute("aria-busy") === "true" ||
        desktop.querySelector('[data-boot-icon-ready="false"]')
      ) {
        return;
      }

      const images = [...desktop.querySelectorAll("img")];
      Promise.all([
        document.fonts.ready,
        ...images.map((image) => image.decode()),
      ])
        .then(() => {
          if (!disposed && revision === currentRevision) {
            completeBootStage("desktop");
            observer.disconnect();
          }
        })
        .catch(() => {
          if (!disposed && revision === currentRevision) {
            window.LifeOSBoot?.fail();
          }
        });
    };
    const observer = new MutationObserver(checkDesktop);
    const desktop = document.querySelector("main");
    if (sessionLoaded && desktop) {
      completeBootStage("session");
      observer.observe(desktop, {
        attributeFilter: ["aria-busy", "data-boot-icon-ready", "src", "srcset"],
        attributes: true,
        childList: true,
        subtree: true,
      });
      checkDesktop([], observer);
    }
    return () => {
      disposed = true;
      observer.disconnect();
    };
  }, [sessionLoaded]);

  return undefined;
};

export default Boot;
