import styled from "styled-components";
import { ActionButton } from "components/apps/Dashboard/shared";
import { type HealthDayState } from "components/apps/Dashboard/views/Services/health";

export const ServiceGrid = styled.ul`
  display: grid;
  gap: 0;
  list-style: none;
  margin: 0;
  min-width: 0;
  padding: 0;
`;

export const ServiceCard = styled.li`
  background: var(--hyc-bg);
  border-bottom: 1px solid var(--hyc-line);
  display: grid;
  gap: 8px;
  min-width: 0;
  padding: 14px 0;

  &:focus-within {
    border-color: var(--hyc-selected-border);
  }
`;

export const ServiceHeader = styled.div`
  align-items: start;
  display: grid;
  gap: 12px;
  grid-template-columns: minmax(0, 1fr) auto;

  h3 {
    min-width: 0;
  }
`;

export const ServiceIdentity = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  min-width: 0;
`;

export const ServiceName = styled(ActionButton)`
  && {
    background: transparent;
    border-color: transparent;
    font-weight: 500;
    justify-content: flex-start;
    max-width: 100%;
    overflow-wrap: anywhere;
    padding: 0;
    text-align: left;
    width: fit-content;
  }
`;

export const ServiceObservation = styled.div`
  color: var(--hyc-muted);
  display: flex;
  flex-wrap: wrap;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  gap: 3px 12px;
  justify-content: space-between;
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

export const UptimeSummary = styled.div`
  display: grid;
  font-variant-numeric: tabular-nums;
  gap: 2px;
  text-align: right;
  white-space: nowrap;

  strong {
    font-size: 18px;
    font-weight: 400;
  }

  span {
    color: var(--hyc-muted);
    font-size: 11px;
  }
`;

export const HealthTrack = styled.div`
  min-width: 0;
  position: relative;
`;

export const HealthStrip = styled.div`
  box-sizing: border-box;
  cursor: pointer;
  display: grid;
  gap: 1px;
  grid-template-columns: repeat(90, minmax(0, 1fr));
  height: 28px;
  outline-offset: 2px;
  padding: 4px 0;

  &:focus-visible {
    outline: 1px solid var(--hyc-accent);
  }
`;

export const HealthBar = styled.span<{
  $active: boolean;
  $state: HealthDayState;
}>`
  background: ${({ $state }) => ({ degraded: "#d9b85c", down: "#d88585", unknown: "#686868", up: "#79b889" })[$state]};
  border-radius: 1px;
  min-width: 0;
  outline: ${({ $active }) => ($active ? "1px solid var(--hyc-text)" : "none")};
  outline-offset: 1px;
`;

export const HealthTooltip = styled.div`
  background: var(--hyc-panel);
  border: 1px solid var(--hyc-line);
  bottom: calc(100% + 4px);
  font-size: 11px;
  left: 0;
  line-height: 1.5;
  overflow-wrap: anywhere;
  padding: 6px 8px;
  pointer-events: none;
  position: absolute;
  right: 0;
  z-index: 2;
`;

export const HealthHelp = styled.details`
  color: var(--hyc-muted);
  font-size: 11px;
  line-height: 1.6;

  summary {
    cursor: pointer;
    width: fit-content;
  }

  p {
    margin-top: 6px;
  }
`;

export const Facts = styled.dl`
  display: grid;
  gap: 8px 12px;
  grid-template-columns: minmax(0, 130px) minmax(0, 1fr);
  margin: 0;

  dt {
    color: var(--hyc-muted);
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;

export const EventDetails = styled.details`
  border: 1px solid var(--hyc-line);
  padding: 10px;

  summary {
    cursor: pointer;
    line-height: 1.7;
    overflow-wrap: anywhere;

    &:focus-visible {
      outline: 1px solid var(--hyc-accent);
      outline-offset: 2px;
    }
  }

  &[open] summary {
    margin-bottom: 12px;
  }

  p {
    line-height: 1.5;
    margin-bottom: 12px;
    overflow-wrap: anywhere;
  }
`;
