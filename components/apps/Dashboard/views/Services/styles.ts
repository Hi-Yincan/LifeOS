import styled from "styled-components";
import { ActionButton } from "components/apps/Dashboard/shared";

export const ServiceGrid = styled.ul`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  list-style: none;
  margin: 0;
  min-width: 0;
  padding: 0;
`;

export const ServiceCard = styled.li`
  background: var(--hyc-bg);
  border: 1px solid var(--hyc-line);
  display: grid;
  gap: 10px;
  grid-template-rows: auto 1fr auto auto;
  min-width: 0;
  padding: 12px;

  &:focus-within {
    border-color: var(--hyc-selected-border);
  }
`;

export const ServiceHeader = styled.div`
  align-items: baseline;
  display: flex;
  flex-wrap: wrap;
  gap: 4px 10px;
  justify-content: space-between;

  h3 {
    min-width: 0;
  }
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

export const ServiceDescription = styled.p`
  color: var(--hyc-muted);
  line-height: 1.5;
  overflow-wrap: anywhere;
`;

export const ServiceObservation = styled.div`
  border-top: 1px solid var(--hyc-line);
  color: var(--hyc-muted);
  display: grid;
  font-size: 11px;
  font-variant-numeric: tabular-nums;
  gap: 3px;
  line-height: 1.5;
  overflow-wrap: anywhere;
  padding-top: 8px;
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

export const ServiceForm = styled.form`
  display: grid;
  gap: 12px;
  min-width: 0;

  input,
  select,
  textarea {
    box-sizing: border-box;
    min-width: 0;
    width: 100%;
  }

  textarea {
    min-height: 72px;
    resize: vertical;
  }
`;
