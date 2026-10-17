import { useEffect } from "react";
import { usePersonalOS } from "components/system/PersonalOS/context";
import useLaunch from "components/system/PersonalOS/useLaunch";
import { useSessionLoaded } from "contexts/session";

// Only explicit portfolio links need this route bridge. Plain visits show the desktop.
const PersonalShell = (): React.ReactNode => {
  const { route } = usePersonalOS();
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

export default PersonalShell;
