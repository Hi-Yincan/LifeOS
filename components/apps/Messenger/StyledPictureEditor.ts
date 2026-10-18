import styled from "styled-components";
import Surface from "components/system/LifeOS/Surface";
import ScrollBars from "styles/common/ScrollBars";

const StyledPictureEditor = styled(Surface)`
  display: flex;
  flex-direction: column;
  height: 100%;
  min-height: 0;

  .picture-navigation {
    flex-shrink: 0;

    h2 {
      font-size: 12px;
      font-weight: 400;
      line-height: 22px;
    }

    .picture-path {
      color: var(--hyc-muted);
    }
  }

  .picture-body {
    ${ScrollBars()}
    flex: 1;
    min-height: 0;
    padding: 16px 12px;

    > * {
      max-width: 560px;
    }
  }

  .file-label {
    display: block;
    margin-bottom: 6px;
  }

  .file-row {
    align-items: center;
    display: flex;
    gap: 8px;

    .file-name {
      background: var(--hyc-panel);
      border: 1px solid var(--hyc-line);
      flex: 1;
      min-width: 0;
      overflow: hidden;
      padding: 3px 6px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    button {
      flex-shrink: 0;
      min-width: 76px;
      width: auto;
    }
  }

  input[type="file"] {
    display: none;
  }

  fieldset {
    border: 1px solid var(--hyc-line);
    margin-top: 20px;
    min-width: 0;
    padding: 16px 12px;

    legend {
      padding: 0 6px;
    }
  }

  .crop {
    align-items: center;
    display: flex;
    flex-wrap: wrap;
    gap: 20px;
  }

  .picture-preview {
    align-items: center;
    background: var(--hyc-panel);
    border: 1px solid #383838;
    display: flex;
    flex: 1 0 144px;
    height: 164px;
    justify-content: center;
    min-width: 0;

    canvas,
    svg {
      border: 1px solid var(--hyc-line);
      border-radius: 50%;
      height: 128px;
      width: 128px;
    }

    svg {
      opacity: 35%;
    }
  }

  .crop-controls {
    flex: 1 1 144px;
    min-width: 0;

    label + label {
      margin-top: 12px;
    }
  }

  .range-label {
    display: flex;
    justify-content: space-between;

    output {
      color: var(--hyc-muted);
      font-variant-numeric: tabular-nums;
    }
  }

  input[type="range"] {
    appearance: none;
    background: transparent;
    border: 0;
    height: 18px;
    margin: 0;
    padding: 0;

    &::-webkit-slider-runnable-track {
      background: #777;
      height: 2px;
    }

    &::-moz-range-track {
      background: #777;
      height: 2px;
    }

    &::-webkit-slider-thumb {
      appearance: none;
      background: var(--hyc-accent);
      border: 0;
      border-radius: 1px;
      height: 14px;
      margin-top: -6px;
      width: 6px;
    }

    &::-moz-range-thumb {
      background: var(--hyc-accent);
      border: 0;
      border-radius: 1px;
      height: 14px;
      width: 6px;
    }

    &:disabled {
      opacity: 40%;
    }
  }

  .picture-hint {
    color: var(--hyc-muted);
    margin-top: 12px;
  }

  .picture-error {
    color: #ffb3b3;
    margin-top: 12px;
  }

  .picture-actions {
    background: var(--hyc-panel);
    border-top: 1px solid #383838;
    display: flex;
    flex-shrink: 0;
    gap: 8px;
    justify-content: flex-end;
    padding: 10px 12px;

    button {
      min-width: 80px;
      width: auto;
    }
  }

  .picture-status {
    flex-shrink: 0;
    font-weight: 400;
    padding-left: 12px;
    position: static;
  }

  button:focus-visible,
  input:focus-visible {
    outline: 1px dotted var(--hyc-text);
    outline-offset: -4px;
  }
`;

export default StyledPictureEditor;
