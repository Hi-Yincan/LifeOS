import styled from "styled-components";

export const Fields = styled.div`
  display: grid;
  gap: 12px;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 210px), 1fr));
`;
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
export const MemberCard = styled.article`
  background: var(--hyc-bg);
  border: 1px solid var(--hyc-line);
  min-width: 0;
  padding: 12px;

  h3 {
    font-size: 14px;
    overflow-wrap: anywhere;
  }

  p {
    margin: 6px 0;
    overflow-wrap: anywhere;
  }
`;
export const Form = styled.form`
  display: grid;
  gap: 16px;

  input,
  select,
  textarea {
    box-sizing: border-box;
    max-width: 100%;
    min-width: 0;
    width: 100%;
  }

  textarea {
    min-height: 64px;
    resize: vertical;
  }
`;
export const MoneyList = styled.span`
  display: grid;
  font-variant-numeric: tabular-nums;
  gap: 4px;
`;
