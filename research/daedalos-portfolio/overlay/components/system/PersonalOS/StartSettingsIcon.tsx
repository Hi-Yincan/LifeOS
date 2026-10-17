// Uses the same inherited size/color as the upstream sidebar icons.
export default function StartSettingsIcon(): React.ReactNode {
  return <svg aria-hidden="true" viewBox="0 0 24 24" style={{ fill: "none" }} stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round">
    <path d="m10 2-.7 2.5-2.2 1.3-2.6-.6-2 3.5 1.8 1.9v2.8l-1.8 1.9 2 3.5 2.6-.6 2.2 1.3.7 2.5h4l.7-2.5 2.2-1.3 2.6.6 2-3.5-1.8-1.9v-2.8l1.8-1.9-2-3.5-2.6.6-2.2-1.3L14 2Z"/>
    <circle cx="12" cy="12" r="3.25"/>
  </svg>;
}
