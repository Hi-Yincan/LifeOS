import { useCallback } from "react";
import { getProcesses, useProcessesActions } from "contexts/process";
import { useSessionActions } from "contexts/session";

export default function useLaunch(): (app: string) => void {
  const { open, minimize } = useProcessesActions();
  const { setForegroundId } = useSessionActions();
  return useCallback((app: string) => {
    const found = Object.entries(getProcesses()).find(([id]) => id === app);
    if (found) {
      const [id, process] = found;
      if (process.minimized) minimize(id);
      setForegroundId(id);
      process.componentWindow?.focus({ preventScroll: true });
    } else open(app);
  }, [open, minimize, setForegroundId]);
}
