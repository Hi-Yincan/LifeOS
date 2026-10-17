import { useEffect, useRef, useState } from "react";
import { usePersonalOS } from "components/system/PersonalOS/context";
import StartSettingsIcon from "components/system/PersonalOS/StartSettingsIcon";
import useLaunch from "components/system/PersonalOS/useLaunch";
import SidebarButton, {
  type SidebarButtons,
} from "components/system/StartMenu/Sidebar/SidebarButton";
import {
  AllApps,
  Power,
  SideMenu,
} from "components/system/StartMenu/Sidebar/SidebarIcons";
import StyledSidebar from "components/system/StartMenu/Sidebar/StyledSidebar";
import { useRootFs } from "contexts/fileSystem";
import { resetStorageAndReload } from "contexts/fileSystem/useAsyncFs";
import { useSessionActions } from "contexts/session";
import { haltEvent } from "utils/functions";

type SidebarGroupProps = {
  sidebarButtons: SidebarButtons;
};

const SidebarGroup: FC<SidebarGroupProps> = ({ sidebarButtons }) => (
  <ol>
    {sidebarButtons.map((button) => (
      <SidebarButton key={button.name} {...button} />
    ))}
  </ol>
);

type SidebarProps = {
  height?: string;
};

const Sidebar: FC<SidebarProps> = ({ height }) => {
  const rootFs = useRootFs();
  const { t } = usePersonalOS();
  const launch = useLaunch();
  const { setHaltSession } = useSessionActions();
  const [collapsed, setCollapsed] = useState(true);
  const expandTimer = useRef(0);
  const sidebarRef = useRef<HTMLElement>(null);
  const clearTimer = (): void => {
    if (expandTimer.current) {
      clearTimeout(expandTimer.current);
      expandTimer.current = 0;
    }
  };
  const topButtons: SidebarButtons = [
    {
      heading: true,
      icon: <SideMenu />,
      name: "START",
      ...(collapsed && { tooltip: "Expand" }),
    },
    {
      active: true,
      icon: <AllApps />,
      name: "All apps",
      ...(collapsed && { tooltip: "All apps" }),
    },
  ];
  const bottomButtons: SidebarButtons = [
    {
      action: () => launch("SystemSettings"),
      icon: <StartSettingsIcon />,
      name: t("settings"),
      ...(collapsed && { tooltip: t("settings") }),
    },
    {
      action: () => {
        setHaltSession(true);

        resetStorageAndReload(rootFs);
      },
      icon: <Power />,
      name: "Power",
      tooltip: "Clears session data and reloads the page.",
    },
  ];

  useEffect(() => clearTimer, [clearTimer]);

  return (
    <StyledSidebar
      ref={sidebarRef}
      aria-label="Start"
      className={collapsed ? "collapsed" : undefined}
      onClick={({ target }) => {
        clearTimer();

        if (
          target instanceof HTMLElement &&
          ((target === sidebarRef.current && collapsed) ||
            (sidebarRef.current?.contains(target) &&
              target.textContent === "START"))
        ) {
          setCollapsed((collapsedState) => !collapsedState);
        }
      }}
      onContextMenu={haltEvent}
      onMouseEnter={() => {
        expandTimer.current = window.setTimeout(() => setCollapsed(false), 700);
      }}
      onMouseLeave={() => {
        clearTimer();
        setCollapsed(true);
      }}
      style={{ height }}
    >
      <SidebarGroup sidebarButtons={topButtons} />
      <SidebarGroup sidebarButtons={bottomButtons} />
    </StyledSidebar>
  );
};

export default Sidebar;
