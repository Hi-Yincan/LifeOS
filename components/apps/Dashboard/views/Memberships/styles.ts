import styled from "styled-components";

export const Facts = styled.dl`
  display: grid;
  gap: 8px 12px;
  grid-template-columns: minmax(90px, auto) minmax(0, 1fr);
  margin: 12px 0;

  dt {
    color: var(--hyc-muted);
  }

  dd {
    margin: 0;
    overflow-wrap: anywhere;
  }
`;
export const SummaryStrip = styled.dl`
  border-bottom: 1px solid var(--hyc-line);
  display: flex;
  flex-wrap: wrap;
  gap: 14px 24px;
  margin: 0;
  min-width: 0;
  padding: 2px 0 14px;

  > div {
    flex: 1 1 130px;
    min-width: 0;
  }

  dt {
    color: var(--hyc-muted);
    font-size: 11px;
    margin-bottom: 7px;
  }

  dd {
    font-size: 18px;
    font-variant-numeric: tabular-nums;
    line-height: 1.35;
    margin: 0;
    overflow-wrap: anywhere;
  }

  small {
    color: var(--hyc-muted);
    font-size: 12px;
  }
`;
export const ListControls = styled.div`
  align-items: end;
  display: flex;
  flex-wrap: wrap;
  gap: 8px;

  > label {
    flex: 1 1 130px;
    max-width: 240px;
  }

  input,
  select {
    box-sizing: border-box;
    max-width: 100%;
  }
`;
export const ResultCount = styled.span`
  color: var(--hyc-muted);
  font-size: 11px;
  margin-left: auto;
  padding-bottom: 5px;
  white-space: nowrap;
`;
export const TableRegion = styled.div`
  container-type: inline-size;
  min-width: 0;
  overflow-x: auto;
`;
export const MembershipTable = styled.table`
  border-collapse: collapse;
  font-size: 12px;
  text-align: left;
  width: 100%;

  td,
  th {
    border-bottom: 1px solid var(--hyc-line);
    overflow-wrap: anywhere;
    padding: 9px 8px;
    vertical-align: middle;
  }

  th {
    font-weight: 400;
  }

  thead th {
    background: var(--hyc-panel);
    color: var(--hyc-muted);
    padding-bottom: 8px;
    padding-top: 8px;
  }

  tbody tr:hover,
  tbody tr:focus-within {
    background: var(--hyc-hover);
  }

  .membership-price {
    font-variant-numeric: tabular-nums;
  }

  @container (max-width: 590px) {
    .membership-price {
      display: none;
    }
  }

  @container (max-width: 420px) {
    .membership-date {
      display: none;
    }

    td,
    th {
      padding-left: 5px;
      padding-right: 5px;
    }
  }
`;
export const RowLink = styled.button`
  && {
    background: transparent;
    border-color: transparent;
    font-size: 13px;
    justify-content: flex-start;
    max-width: 100%;
    min-height: 26px;
    overflow-wrap: anywhere;
    padding: 0;
    text-align: left;
  }

  &&:hover {
    background: transparent;
    border-color: transparent;
    color: var(--hyc-accent);
    text-decoration: underline;
  }

  &:focus-visible {
    outline: 1px solid var(--hyc-accent);
    outline-offset: 2px;
  }
`;
export const RowMeta = styled.span`
  color: var(--hyc-muted);
  display: block;
  font-size: 11px;
  line-height: 1.45;
  margin-top: 3px;
`;
export const RowStates = styled.div`
  align-items: flex-start;
  display: flex;
  flex-direction: column;
  gap: 3px;
`;
export const MoneyList = styled.span`
  display: grid;
  font-variant-numeric: tabular-nums;
  gap: 4px;
`;
