import styled from "styled-components";

export const PersonalLayout = styled.div`
  display: grid;
  gap: 12px;
  min-width: 0;

  button[aria-pressed="true"] {
    background: var(--hyc-selected);
    border-color: var(--hyc-selected-border);
  }

  h3 {
    font-size: 14px;
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
  gap: 8px;
  list-style: none;
  margin: 0;
  padding: 0;

  li {
    border-bottom: 1px solid var(--hyc-line);
    display: grid;
    gap: 5px;
    padding-bottom: 8px;
  }
`;
export const DetailsGrid = styled.dl`
  display: grid;
  gap: 8px;
  grid-template-columns: minmax(70px, auto) minmax(0, 1fr);
  margin: 0;

  dt {
    color: var(--hyc-muted);
  }

  dd {
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
  padding: 10px;

  summary {
    cursor: pointer;
    padding: 2px 0;
  }

  &[open] > summary {
    margin-bottom: 12px;
  }
`;
