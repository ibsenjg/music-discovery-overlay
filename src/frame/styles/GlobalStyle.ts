import { createGlobalStyle } from 'styled-components';
import { media } from './media';
import { tokens } from './theme';

export const GlobalStyle = createGlobalStyle`
  :root {
    color-scheme: dark;
    font-family: ${({ theme }) => theme.typography.family};
    color: ${tokens.text};
    background: transparent;
    --surface: ${({ theme }) => theme.colors.surface};
    --surface-raised: ${({ theme }) => theme.colors.surfaceRaised};
    --surface-soft: ${({ theme }) => theme.colors.surfaceSoft};
    --surface-overlay: ${({ theme }) => theme.colors.surfaceOverlay};
    --surface-notice: ${({ theme }) => theme.colors.surfaceNotice};
    --surface-danger: ${({ theme }) => theme.colors.surfaceDanger};
    --text: ${({ theme }) => theme.colors.text};
    --muted: ${({ theme }) => theme.colors.muted};
    --accent: ${({ theme }) => theme.colors.accent};
    --accent-ink: ${({ theme }) => theme.colors.accentInk};
    --focus: ${({ theme }) => theme.colors.focus};
    --border: ${({ theme }) => theme.colors.border};
    --border-strong: ${({ theme }) => theme.colors.borderStrong};
    --button-hover: ${({ theme }) => theme.colors.buttonHover};
    --danger: ${({ theme }) => theme.colors.danger};
    --danger-ink: ${({ theme }) => theme.colors.dangerInk};
    --code-surface: ${({ theme }) => theme.colors.codeSurface};
    --code-text: ${({ theme }) => theme.colors.codeText};
    --brand-one: ${({ theme }) => theme.brand.one};
    --brand-two: ${({ theme }) => theme.brand.two};
    --brand-three: ${({ theme }) => theme.brand.three};
    --mark-surface: ${({ theme }) => theme.brand.markSurface};
    --mark-surface-hover: ${({ theme }) => theme.brand.markSurfaceHover};
    --shadow-strong: ${({ theme }) => theme.shadows.strong};
    --shadow-panel: ${({ theme }) => theme.shadows.panel};
    --shadow-soft: ${({ theme }) => theme.shadows.soft};
    --backdrop: ${({ theme }) => theme.colors.backdrop};
    --radius-sm: ${({ theme }) => theme.radii.small};
    --radius-md: ${({ theme }) => theme.radii.medium};
    --space-1: ${({ theme }) => theme.spacing.one};
    --space-2: ${({ theme }) => theme.spacing.two};
    --space-3: ${({ theme }) => theme.spacing.three};
    --space-4: ${({ theme }) => theme.spacing.four};
    --space-5: ${({ theme }) => theme.spacing.five};
    --motion-standard: ${({ theme }) => theme.motion.standard};
    --motion-spinner: ${({ theme }) => theme.motion.spinner};
  }

  * {
    box-sizing: border-box;
  }

  html,
  body,
  #root {
    width: 100%;
    height: 100%;
    overflow: hidden;
    margin: 0;
    overscroll-behavior: none;
    background: transparent;
  }

  button,
  textarea,
  select {
    font: inherit;
  }

  :focus-visible {
    outline: 3px solid ${tokens.focus};
    outline-offset: 3px;
  }

  ${media.forcedColors} {
    :root {
      --surface: Canvas;
      --surface-raised: Canvas;
      --surface-soft: ButtonFace;
      --surface-overlay: Canvas;
      --surface-notice: Canvas;
      --surface-danger: Canvas;
      --text: CanvasText;
      --muted: CanvasText;
      --accent: Highlight;
      --accent-ink: HighlightText;
      --focus: Highlight;
      --border: ButtonText;
      --border-strong: ButtonText;
      --button-hover: ButtonFace;
      --danger: CanvasText;
      --danger-ink: CanvasText;
      --code-surface: Canvas;
      --code-text: CanvasText;
      --brand-one: Highlight;
      --brand-two: CanvasText;
      --brand-three: Highlight;
      --mark-surface: Canvas;
      --mark-surface-hover: ButtonFace;
      --backdrop: Canvas;
      color: CanvasText;
      background: Canvas;
    }

    html,
    body,
    #root,
    h1,
    h2,
    h3 {
      color: CanvasText;
      background-color: Canvas;
    }

    code {
      color: CanvasText;
      background: Canvas;
    }
  }
`;
