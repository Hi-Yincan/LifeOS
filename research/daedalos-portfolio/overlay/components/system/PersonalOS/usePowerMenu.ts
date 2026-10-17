import { Power } from "components/system/StartMenu/Sidebar/SidebarIcons";
import { useMenuActions } from "contexts/menu";
import { usePersonalOS } from "components/system/PersonalOS/context";
import useLaunch from "components/system/PersonalOS/useLaunch";

export default function usePowerMenu(
  resetSession: () => void,
  anchor: () => HTMLElement | null | undefined
): () => void {
  const { contextMenu } = useMenuActions();
  const { t } = usePersonalOS();
  const open = useLaunch();

  return () => {
    const button = anchor();
    if (!button) return;
    contextMenu(() => [
      {
        action: () => open("SystemSettings"),
        icon: "/System/PersonalOS/settings.svg",
        label: t("settings"),
      },
      { seperator: true },
      {
        action: resetSession,
        label: t("resetSession"),
        SvgIcon: Power,
      },
    ], t("power")).onContextMenuCapture(undefined, button.getBoundingClientRect());
  };
}
