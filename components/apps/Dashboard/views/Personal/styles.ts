import styled from "styled-components";

export const PersonalLayout = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
  overflow-wrap: anywhere;

  button[aria-pressed="true"] {
    background: var(--hyc-selected);
    border-color: var(--hyc-selected-border);
  }

  h3 {
    font-size: 13px;
  }

  input,
  select,
  textarea {
    min-width: 0;
    width: 100%;
  }

  textarea {
    min-height: 72px;
    resize: vertical;
  }
`;
export const RecordList = styled.ul`
  display: grid;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    border-bottom: 1px solid var(--hyc-line);
    display: grid;
    gap: 4px;
    padding-bottom: 8px;
  }
`;
export const DetailsGrid = styled.dl`
  display: grid;
  gap: 6px 10px;
  grid-template-columns: minmax(60px, auto) minmax(0, 1fr);
  margin: 0;

  dt {
    color: var(--hyc-muted);
  }

  dd {
    font-variant-numeric: tabular-nums;
    margin: 0;
    overflow-wrap: anywhere;
  }
`;
export const RouteDiagram = styled.svg`
  background: var(--hyc-panel);
  border: 1px solid var(--hyc-line);
  height: auto;
  max-height: 220px;
  width: 100%;
`;
export const TableScroll = styled.div`
  min-width: 0;
  overflow-x: auto;
`;
export const Disclosure = styled.details`
  border: 1px solid var(--hyc-line);
  padding: 8px;

  summary {
    cursor: pointer;
    padding: 2px 0;
  }

  &[open] > summary {
    margin-bottom: 10px;
  }
`;
