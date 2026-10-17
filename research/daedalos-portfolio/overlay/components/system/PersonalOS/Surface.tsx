import styled from "styled-components";
import ScrollBars from "styles/common/ScrollBars";

// Typography, focus/selection colors and scrollbars come from daedalOS.
// Neutral surfaces match File Explorer; this does not style any other App.
const Surface = styled.section`
  --hyc-bg: #202020;
  --hyc-panel: rgb(25 25 25);
  --hyc-side: #202020;
  --hyc-text: ${({ theme }) => theme.colors.text};
  --hyc-muted: #b7b7b7;
  --hyc-line: rgb(83 83 83);
  --hyc-accent: ${({ theme }) => theme.colors.highlight};
  --hyc-hover: ${({ theme }) => theme.colors.fileEntry.background};
  --hyc-selected: ${({ theme }) => theme.colors.fileEntry.backgroundFocused};
  --hyc-selected-border: ${({ theme }) => theme.colors.fileEntry.borderFocused};
  font-family: ${({ theme }) => theme.formats.systemFont};

  .hyc-main, &.hyc-settings {
    ${ScrollBars()}
  }
`;

export default Surface;
