import styled from "styled-components";
import { ActionButton } from "components/apps/Dashboard/shared";

export const ServiceList = styled.ul`
  border: 1px solid var(--hyc-line);
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const ServiceRow = styled.li`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  padding: 12px;

  & + & {
    border-top: 1px solid var(--hyc-line);
  }

  p {
    line-height: 1.5;
    overflow-wrap: anywhere;
  }
`;

export const ServiceName = styled(ActionButton)`
  font-weight: 600;
  max-width: 100%;
  overflow-wrap: anywhere;
  text-align: left;
  width: fit-content;
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
