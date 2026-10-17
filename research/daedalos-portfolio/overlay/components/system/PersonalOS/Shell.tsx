import { useEffect, useRef } from "react";
import { useSessionLoaded } from "contexts/session";
import { usePersonalOS } from "components/system/PersonalOS/context";
import useLaunch from "components/system/PersonalOS/useLaunch";

// Only the startup policy belongs here. Desktop, taskbar and responsive
// window behavior remain entirely owned by the upstream daedalOS shell.
export default function PersonalShell(): React.ReactNode {
  const { route } = usePersonalOS();
  const open = useLaunch();
  const loaded = useSessionLoaded();
  const started = useRef(false);
  useEffect(() => {
    if (!loaded || started.current) return;
    started.current = true;
    const params = new URLSearchParams(location.search);
    if (!params.has("app") && !params.has("url")) open("Portfolio");
  }, [loaded, open]);
  useEffect(() => {
    if (loaded && new URLSearchParams(location.search).get("app") === "Portfolio") open("Portfolio");
  }, [route, loaded, open]);
  return null;
}
