export type BootStage =
  "desktop" | "session" | "styles" | "taskbar" | "wallpaper";
export const BOOT_READY_EVENT = "lifeos-boot-ready";

declare global {
  interface Window {
    LifeOSBoot?: {
      complete: (stage: BootStage) => void;
      fail: () => void;
      ready: boolean;
    };
  }
}

export const completeBootStage = (stage: BootStage): void => {
  window.LifeOSBoot?.complete(stage);
};

// 随 HTML 执行，资源失败和重试不依赖 React 或 Next chunk 成功加载。
export const bootScript = `
(function () {
  var screen = document.getElementById("lifeos-boot");
  var root = document.getElementById("lifeos-root");
  var status = document.getElementById("lifeos-boot-status");
  var retry = document.getElementById("lifeos-boot-retry");
  var stages = { desktop: false, session: false, styles: false, taskbar: false, wallpaper: false };
  var finished = false;
  var frame = 0;
  var zh = false;
  var languages = navigator.languages || [navigator.language];
  for (var i = 0; i < languages.length; i++) {
    if (/^zh/i.test(languages[i])) { zh = true; break; }
    if (/^en/i.test(languages[i])) break;
  }
  try {
    var preferences = JSON.parse(localStorage.getItem("hyc.preferences.v1") || "{}");
    if (preferences.language === "zh") zh = true;
    else if (preferences.language === "en") zh = false;
  } catch (_) { /* 存储不可用时使用浏览器语言。 */ }
  screen.lang = zh ? "zh-CN" : "en";
  retry.href = location.href;
  retry.addEventListener("click", function (event) {
    event.preventDefault();
    location.reload();
  });
  retry.textContent = zh ? "重新加载" : "Reload";
  function update() {
    status.textContent = !stages.session || !stages.styles
      ? (zh ? "正在启动系统…" : "Starting up…")
      : !stages.desktop || !stages.taskbar
        ? (zh ? "正在准备桌面…" : "Preparing desktop…")
        : (zh ? "正在加载壁纸…" : "Loading wallpaper…");
  }
  function stopKeyPropagation(event) {
    event.stopImmediatePropagation();
  }
  function resourceError(event) {
    var target = event.target;
    if (target && ((target.tagName === "SCRIPT" && target.src.indexOf("/_next/") !== -1) ||
      (target.tagName === "LINK" && target.hasAttribute("data-boot-styles")))) fail();
  }
  function complete(stage) {
    if (finished) return;
    stages[stage] = true;
    if (screen.dataset.state !== "error") update();
    if (!frame && stages.desktop && stages.session && stages.styles && stages.taskbar && stages.wallpaper) {
      frame = requestAnimationFrame(function () {
        finished = true;
        clearTimeout(slowTimer);
        screen.hidden = true;
        root.removeAttribute("inert");
        root.removeAttribute("aria-hidden");
        document.removeEventListener("keydown", stopKeyPropagation, true);
        document.removeEventListener("error", resourceError, true);
        document.removeEventListener("load", loadStyles, true);
        window.LifeOSBoot.ready = true;
        window.dispatchEvent(new Event("${BOOT_READY_EVENT}"));
      });
    }
  }
  function fail() {
    if (finished) return;
    screen.dataset.state = "error";
    status.textContent = zh ? "部分启动资源加载失败，请检查网络后重新加载。" : "Some startup resources could not load. Check your connection and reload.";
    retry.hidden = false;
  }
  function loadStyles() {
    var links = document.querySelectorAll("link[data-boot-styles]");
    var ready = true;
    for (var i = 0; i < links.length; i++) {
      if (links[i].sheet) links[i].media = "all";
      else ready = false;
    }
    if (ready) complete("styles");
  }
  var slowTimer = setTimeout(function () {
    if (!finished && screen.dataset.state !== "error") {
      status.textContent = zh ? "仍在加载资源，网络较慢时可能需要更久。" : "Still loading resources. This may take longer on a slow connection.";
      retry.hidden = false;
    }
  }, 20000);
  window.LifeOSBoot = { complete: complete, fail: fail, ready: false };
  document.addEventListener("keydown", stopKeyPropagation, true);
  document.addEventListener("error", resourceError, true);
  document.addEventListener("load", loadStyles, true);
  update();
  loadStyles();
})();
`;
