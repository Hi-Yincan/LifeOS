import { useEffect } from "react";
import { useLifeOS } from "components/system/LifeOS/context";
import useLaunch from "components/system/LifeOS/useLaunch";
import { useSessionLoaded } from "contexts/session";

// Only explicit portfolio links need this route bridge. Plain visits show the desktop.
const LifeOSShell = (): React.ReactNode => {
  const { route } = useLifeOS();
  const open = useLaunch();
  const loaded = useSessionLoaded();
  useEffect(() => {
    if (
      loaded &&
      route &&
      new URLSearchParams(location.search).get("app") === "Portfolio"
    ) open("Portfolio");
  }, [route, loaded, open]);
  // eslint-disable-next-line react/jsx-no-useless-fragment -- This route bridge renders no UI.
  return <></>;
};

export default LifeOSShell;
