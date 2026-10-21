import site from "lifeos.json";
import StartButtonIcon from "components/system/Taskbar/StartButton/StartButtonIcon";
import colors from "styles/defaultTheme/colors";
import formats from "styles/defaultTheme/formats";

export const bootStyles = `
  #lifeos-boot {
    align-content: center;
    background: ${colors.background};
    box-sizing: border-box;
    color: ${colors.text};
    display: grid;
    font: 14px/1.5 ${formats.systemFont};
    gap: 24px;
    inset: 0;
    justify-items: center;
    padding: 24px;
    position: fixed;
    text-align: center;
    z-index: 2147483647;
  }
  #lifeos-boot[hidden] { display: none; }
  #lifeos-root[aria-hidden="true"] { visibility: hidden; }
  #lifeos-boot svg { fill: ${colors.highlight}; height: 56px; width: 56px; }
  #lifeos-boot p { margin: 0; }
  #lifeos-boot .boot-name { font-size: 20px; font-weight: 400; }
  #lifeos-boot .boot-status { max-width: 32em; min-height: 21px; }
  #lifeos-boot .boot-dots { display: flex; gap: 6px; height: 6px; }
  #lifeos-boot .boot-dots i {
    animation: lifeos-boot-pulse 1.2s ease-in-out infinite;
    background: currentColor;
    border-radius: 50%;
    height: 4px;
    opacity: .25;
    width: 4px;
  }
  #lifeos-boot .boot-dots i:nth-child(2) { animation-delay: .15s; }
  #lifeos-boot .boot-dots i:nth-child(3) { animation-delay: .3s; }
  #lifeos-boot .boot-dots i:nth-child(4) { animation-delay: .45s; }
  #lifeos-boot .boot-dots i:nth-child(5) { animation-delay: .6s; }
  #lifeos-boot .boot-retry {
    border: 1px solid rgb(83 83 83);
    color: inherit;
    padding: 5px 18px;
    text-decoration: none;
  }
  #lifeos-boot .boot-retry:focus-visible { outline: 2px solid ${colors.highlight}; outline-offset: 3px; }
  #lifeos-boot .boot-retry:hover { background: rgb(51 51 51); }
  #lifeos-boot[data-state="error"] .boot-dots { visibility: hidden; }
  @keyframes lifeos-boot-pulse {
    0%, 80%, 100% { opacity: .25; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-3px); }
  }
  @media (prefers-reduced-motion: reduce) {
    #lifeos-boot .boot-dots i { animation: none; opacity: .65; }
  }
`;

const BootScreen = (): React.JSX.Element => (
  <section aria-label="LifeOS" id="lifeos-boot">
    <StartButtonIcon />
    <p className="boot-name">{site.name}</p>
    <div aria-hidden="true" className="boot-dots">
      <i />
      <i />
      <i />
      <i />
      <i />
    </div>
    <p
      aria-live="polite"
      className="boot-status"
      id="lifeos-boot-status"
      role="status"
    >
      Starting up…
    </p>
    {/* eslint-disable-next-line next/no-html-link-for-pages -- 应用 bundle 失败时仍需要完整重载入口。 */}
    <a className="boot-retry" href="/" id="lifeos-boot-retry" hidden>
      Reload
    </a>
    <noscript>
      JavaScript is required to start LifeOS. / 请启用 JavaScript 后重新加载。
    </noscript>
  </section>
);

export default BootScreen;
