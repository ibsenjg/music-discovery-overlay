import { css, keyframes, styled } from 'styled-components';
import { media } from './media';
import { tokens } from './theme';

export const buttonStyles = css`
  min-height: 40px;
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusSmall};
  padding: 8px 12px;
  color: ${tokens.text};
  background: ${tokens.surfaceSoft};
  cursor: pointer;

  &:hover:not(:disabled) {
    border-color: ${tokens.accent};
    background: ${tokens.buttonHover};
  }

  &:disabled {
    cursor: not-allowed;
    opacity: 0.55;
  }

  ${media.motionAllowed} {
    transition:
      background-color ${tokens.motionStandard},
      border-color ${tokens.motionStandard},
      transform ${tokens.motionStandard};
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
  }
`;

export const BaseButton = styled.button`
  ${buttonStyles}
`;

export const PrimaryButton = styled(BaseButton)`
  border-color: ${tokens.accent};
  color: ${tokens.accentInk};
  background: ${tokens.accent};
  font-weight: 800;
`;

export const IconButton = styled(BaseButton)`
  display: grid;
  width: 40px;
  min-width: 40px;
  min-height: 40px;
  place-items: center;
  border-radius: 50%;
  padding: 0;
  font-size: 1.35rem;
  line-height: 1;
`;

export const ButtonRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${tokens.spaceTwo};
`;

export const ButtonStack = styled.div`
  display: grid;
  gap: ${tokens.spaceThree};
`;

export const Heading2 = styled.h2`
  margin: 0 0 ${tokens.spaceThree};
  font-size: 1.05rem;
`;

export const Heading3 = styled.h3`
  margin: 0;
  font-size: 0.95rem;
`;

export const Heading4 = styled.h4`
  margin: 0;
  font-size: 0.94rem;
`;

export const visuallyHiddenStyles = css`
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
`;

export const ScreenReaderOnlyBlock = styled.div.attrs({
  className: 'sr-only',
})`
  ${visuallyHiddenStyles}
`;

export const ScreenReaderOnlyInline = styled.span.attrs({
  className: 'sr-only',
})`
  ${visuallyHiddenStyles}
`;

const spinnerRotation = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const Spinner = styled.span.attrs({
  className: 'loading-spinner',
  'aria-hidden': 'true',
})`
  box-sizing: border-box;
  width: 18px;
  height: 18px;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;

  ${media.motionAllowed} {
    animation: ${spinnerRotation} ${tokens.motionSpinner};
  }

  ${media.forcedColors} {
    border-color: currentColor;
    border-right-color: transparent;
  }
`;
