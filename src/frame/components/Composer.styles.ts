import { styled } from 'styled-components';
import { media } from '../styles/media';
import { BaseButton } from '../styles/primitives';
import { tokens } from '../styles/theme';

export const ComposerWrap = styled.footer`
  position: relative;
  z-index: 3;
  flex: 0 0 auto;
  border-top: 1px solid ${tokens.border};
  padding: 10px 12px 8px;
  background: color-mix(in srgb, ${tokens.surface} 94%, transparent);
  box-shadow: 0 -10px 24px ${tokens.shadowSoft};
`;

export const ComposerBody = styled.div`
  border: 1px solid ${tokens.borderStrong};
  border-radius: 22px;
  padding: 10px 10px 8px;
  background: ${tokens.surfaceRaised};

  ${media.forcedColors} {
    border: 1px solid ButtonText;
    color: CanvasText;
    background: Canvas;
  }
`;

export const ComposerInput = styled.textarea`
  display: block;
  width: 100%;
  min-height: 28px;
  max-height: 104px;
  overflow-y: auto;
  resize: none;
  border: 0;
  border-radius: 8px;
  padding: 2px 4px 8px;
  color: ${tokens.text};
  outline: 0;
  background: transparent;
  line-height: 1.45;

  &:focus-visible {
    outline: 3px solid ${tokens.focus};
    outline-offset: 2px;
  }
`;

export const ComposerControls = styled.div`
  display: flex;
  align-items: center;
  gap: 7px;
`;

export const ComposerSpacer = styled.span`
  flex: 1;
`;

export const RoundControl = styled(BaseButton)`
  display: grid;
  width: 36px;
  min-width: 36px;
  min-height: 36px;
  place-items: center;
  border-radius: 50%;
  padding: 0;

  svg {
    width: 20px;
    height: 20px;
    fill: none;
    stroke: currentColor;
    stroke-width: 2;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
`;

export const GenerateControl = styled(RoundControl)`
  border-color: ${tokens.text};
  color: ${tokens.accentInk};
  background: ${tokens.text};

  &:hover:not(:disabled) {
    color: ${tokens.accentInk};
    background: ${tokens.accent};
  }

  ${media.forcedColors} {
    color: HighlightText;
    background: Highlight;
  }
`;

export const StopSquare = styled.span`
  width: 11px;
  height: 11px;
  border-radius: 2px;
  background: ${tokens.danger};
`;

export const ComposerHelp = styled.p`
  margin: 5px 0 0;
  color: ${tokens.muted};
  text-align: center;
  font-size: 0.68rem;
`;
