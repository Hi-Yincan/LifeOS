import AppsLoader from "components/system/Apps/AppsLoader";
import Boot from "components/system/Boot";
import Desktop from "components/system/Desktop";
import LifeOSShell from "components/system/LifeOS/Shell";
import Taskbar from "components/system/Taskbar";
import useGlobalErrorHandler from "hooks/useGlobalErrorHandler";
import useGlobalKeyboardShortcuts from "hooks/useGlobalKeyboardShortcuts";
import useIFrameFocuser from "hooks/useIFrameFocuser";
import useUrlLoader from "hooks/useUrlLoader";
import { keepCanvasesReadable } from "utils/readableCanvas";

// Before any app creates a canvas context
if (typeof window !== "undefined") keepCanvasesReadable(window);

const Index: FC = () => {
  useIFrameFocuser();
  useUrlLoader();
  useGlobalKeyboardShortcuts();
  useGlobalErrorHandler();

  return (
    <Desktop>
      <Boot />
      <Taskbar />
      <AppsLoader />
      <LifeOSShell />
    </Desktop>
  );
};

export default Index;
