import { SETTINGS_GEAR_PATH } from "components/system/LifeOS/settingsIcon";

// Uses the same inherited size/color as the upstream sidebar icons.
const StartSettingsIcon = (): React.ReactNode => (
  <svg
    aria-hidden="true"
    stroke="currentColor"
    strokeLinejoin="round"
    strokeWidth="1.5"
    style={{ fill: "none" }}
    viewBox="0 0 24 24"
  >
    <path d={SETTINGS_GEAR_PATH} />
    <circle cx="12" cy="12" r="3.25" />
  </svg>
);

export default StartSettingsIcon;
