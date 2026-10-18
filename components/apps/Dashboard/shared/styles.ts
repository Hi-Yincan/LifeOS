import styled from "styled-components";
import Button from "styles/common/Button";

export const Section = styled.section`
  display: grid;
  gap: 10px;
  min-width: 0;
`;
export const SectionHeading = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: space-between;

  h2 {
    font-size: 15px;
    line-height: 1.4;
  }
`;
export const MetricGrid = styled.div`
  display: grid;
  gap: 8px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 140px), 1fr));
`;
export const Card = styled.div`
  background: var(--hyc-bg);
  border: 1px solid var(--hyc-line);
  min-width: 0;
  padding: 10px;
`;
export const CardGrid = styled.div`
  display: grid;
  gap: 10px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 250px), 1fr));
`;
export const DataTable = styled.table`
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
  width: 100%;

  caption {
    padding: 8px 0;
    text-align: left;
  }

  td,
  th {
    border-bottom: 1px solid var(--hyc-line);
    padding: 7px 6px;
    vertical-align: top;
  }

  th {
    color: var(--hyc-muted);
    font-weight: 400;
  }

  tbody tr:hover {
    background: var(--hyc-hover);
  }
`;
export const Toolbar = styled.div`
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  min-width: 0;

  input,
  select {
    max-width: min(100%, 240px);
  }
`;
export const Stack = styled.div`
  display: grid;
  gap: 10px;
  min-width: 0;
`;
export const Split = styled.div`
  align-items: start;
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
`;
export const Field = styled.label`
  display: grid;
  gap: 4px;
  min-width: 0;
`;
export const Notice = styled.p`
  background: var(--hyc-panel);
  border: 1px solid var(--hyc-line);
  color: var(--hyc-muted);
  padding: 6px 8px;
`;
export const ActionButton = styled(Button)`
  width: auto;

  &:focus-visible {
    outline: 1px solid var(--hyc-accent);
    outline-offset: 2px;
  }
`;
export const Muted = styled.span`
  color: var(--hyc-muted);
`;
