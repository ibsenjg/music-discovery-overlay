import { styled } from 'styled-components';
import { media } from '../styles/media';
import { Heading2, IconButton } from '../styles/primitives';
import { tokens, type AppTheme } from '../styles/theme';

export const SettingsPanel = styled.section`
  position: absolute;
  z-index: 4;
  right: 12px;
  bottom: 126px;
  left: 12px;
  max-height: min(600px, calc(100% - 150px));
  overflow-y: auto;
  margin: 0;
  border: 1px solid ${tokens.borderStrong};
  border-radius: 18px;
  padding: ${tokens.spaceFour};
  background: ${tokens.surfaceOverlay};
  box-shadow: 0 18px 45px ${tokens.shadowStrong};

  ${media.narrow} {
    bottom: 120px;
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
    color: CanvasText;
    background: Canvas;
  }
`;

export const PopoverHeading = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spaceTwo};
  margin-bottom: ${tokens.spaceThree};
`;

export const SettingsTitle = styled(Heading2)`
  margin: 0;
`;

export const CloseButton = IconButton;

export const FieldLabel = styled.label`
  display: grid;
  gap: ${tokens.spaceOne};
  margin-top: ${tokens.spaceThree};
  color: ${tokens.muted};
  font-size: 0.8rem;
  font-weight: 700;
`;

export const Select = styled.select`
  width: 100%;
  min-height: 40px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSmall};
  padding: 7px 9px;
  color: ${tokens.text};
  background: ${tokens.surfaceRaised};

  ${media.forcedColors} {
    border: 1px solid ButtonText;
  }
`;

export const ThemePicker = styled.fieldset`
  margin: ${tokens.spaceFour} 0 0;
  border: 0;
  padding: 0;
`;

export const ThemeLegend = styled.legend`
  color: ${tokens.muted};
  font-size: 0.8rem;
  font-weight: 700;
`;

export const ThemeSessionNote = styled.p`
  margin: ${tokens.spaceOne} 0 ${tokens.spaceTwo};
  color: ${tokens.muted};
  font-size: 0.72rem;
  line-height: 1.4;
`;

export const ThemeOptions = styled.div`
  display: grid;
  gap: ${tokens.spaceTwo};
`;

export const ThemeOption = styled.label<{ $selected: boolean }>`
  display: grid;
  grid-template-columns: auto 44px minmax(0, 1fr);
  align-items: center;
  gap: ${tokens.spaceTwo};
  min-height: 62px;
  border: 1px solid
    ${({ $selected }) => ($selected ? tokens.accent : tokens.border)};
  border-radius: ${tokens.radiusSmall};
  padding: ${tokens.spaceTwo};
  color: ${tokens.text};
  background: ${tokens.surfaceRaised};
  box-shadow: ${({ $selected }) =>
    $selected ? `inset 3px 0 0 ${tokens.accent}` : 'none'};
  cursor: pointer;

  &:hover {
    border-color: ${tokens.accent};
    background: ${tokens.buttonHover};
  }

  &:has(input:focus-visible) {
    outline: 3px solid ${tokens.focus};
    outline-offset: 2px;
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
  }
`;

export const ThemeRadio = styled.input`
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: ${tokens.accent};

  &:focus-visible {
    outline: 0;
  }
`;

export const ThemeSwatch = styled.span<{ $previewTheme: AppTheme }>`
  position: relative;
  display: block;
  width: 44px;
  height: 36px;
  overflow: hidden;
  border: 1px solid ${({ $previewTheme }) => $previewTheme.preview.border};
  border-radius: 10px;
  background: ${({ $previewTheme }) => $previewTheme.preview.surface};

  span {
    position: absolute;
    bottom: 7px;
    width: 5px;
    border-radius: 999px;
    transform: rotate(7deg);
  }

  span:nth-child(1) {
    left: 10px;
    height: 13px;
    background: ${({ $previewTheme }) => $previewTheme.preview.one};
  }

  span:nth-child(2) {
    left: 19px;
    height: 19px;
    background: ${({ $previewTheme }) => $previewTheme.preview.two};
  }

  span:nth-child(3) {
    left: 28px;
    height: 24px;
    background: ${({ $previewTheme }) => $previewTheme.preview.three};
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
    background: Canvas;

    span:nth-child(1),
    span:nth-child(3) {
      background: Highlight;
    }

    span:nth-child(2) {
      background: CanvasText;
    }
  }
`;

export const ThemeOptionCopy = styled.span`
  display: grid;
  min-width: 0;
  gap: 2px;

  strong {
    font-size: 0.8rem;
  }

  > span {
    color: ${tokens.muted};
    font-size: 0.7rem;
    line-height: 1.35;
  }
`;

export const Usage = styled.div`
  margin-top: ${tokens.spaceFour};
  border-top: 1px solid ${tokens.border};
  padding-top: ${tokens.spaceThree};

  p {
    margin: 0;
    color: ${tokens.muted};
    font-size: 0.78rem;
    line-height: 1.45;
  }
`;

export const Independent = styled.p`
  margin: ${tokens.spaceFour} 0 0;
  color: ${tokens.muted};
  text-align: center;
  font-size: 0.78rem;
  line-height: 1.45;
`;
