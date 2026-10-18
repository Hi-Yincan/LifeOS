import styled from "styled-components";
import StyledPictureEditor from "components/apps/Messenger/StyledPictureEditor";

const StyledBannerEditor = styled(StyledPictureEditor)`
  .banner-preview {
    border: 1px solid var(--hyc-line);
    margin-bottom: 16px;
    overflow: hidden;
  }

  .banner-presets {
    display: grid;
    gap: 8px;
    grid-template-columns: repeat(2, minmax(0, 1fr));

    button {
      align-items: stretch;
      display: flex;
      flex-direction: column;
      gap: 0;
      min-width: 0;
      padding: 0;
      text-align: left;

      &[aria-pressed="true"] {
        background: var(--hyc-selected);
        border-color: var(--hyc-accent);
      }
    }

    .banner-swatch {
      height: 42px;
      width: 100%;
    }

    .banner-name {
      padding: 3px 8px;
    }
  }

  details {
    margin-top: 16px;

    label {
      margin-top: 8px;
    }
  }
`;

export default StyledBannerEditor;
