import { styled } from 'styled-components';
import { media } from '../styles/media';
import { BaseButton } from '../styles/primitives';
import { tokens } from '../styles/theme';

export const LauncherButton = styled(BaseButton)`
  position: relative;
  display: grid;
  width: 44px;
  height: 44px;
  min-height: 44px;
  place-items: center;
  border: 1px solid ${tokens.borderStrong};
  border-radius: 50%;
  padding: 0;
  color: ${tokens.accent};
  background: ${tokens.markSurface};
  box-shadow: 0 8px 24px ${tokens.shadowStrong};

  &:hover:not(:disabled) {
    border-color: ${tokens.accent};
    background: ${tokens.markSurfaceHover};
  }

  &:focus-visible {
    outline-offset: -4px;
  }

  svg {
    width: 34px;
    height: 34px;
  }

  ${media.motionAllowed} {
    &:hover {
      transform: none;
    }

    svg {
      transition: transform ${tokens.motionStandard};
    }

    &:hover svg {
      transform: translateY(2px);
    }
  }
`;

export const BusyIndicator = styled.span`
  position: absolute;
  right: 1px;
  bottom: 1px;
  display: grid;
  width: 17px;
  height: 17px;
  place-items: center;
  border: 1px solid ${tokens.border};
  border-radius: 50%;
  color: ${tokens.accent};
  background: ${tokens.surface};

  .loading-spinner {
    width: 11px;
    height: 11px;
    border-width: 1.5px;
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
  }
`;
