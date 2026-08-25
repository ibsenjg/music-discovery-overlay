import { styled } from 'styled-components';
import { media } from '../styles/media';
import {
  BaseButton,
  ButtonRow,
  Heading2,
  PrimaryButton,
} from '../styles/primitives';
import { tokens } from '../styles/theme';

export const Backdrop = styled.div`
  position: absolute;
  z-index: 5;
  inset: 0;
  background: ${tokens.backdrop};

  ${media.forcedColors} {
    background: Canvas;
  }
`;

export const Disclosure = styled.section`
  position: absolute;
  right: 12px;
  bottom: 126px;
  left: 12px;
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

export const DisclosureHeading = styled(Heading2)`
  margin-bottom: ${tokens.spaceTwo};
`;

export const DisclosureCopy = styled.p`
  color: ${tokens.muted};
  line-height: 1.45;
`;

export const DisclosureActions = ButtonRow;
export const AllowButton = PrimaryButton;
export const CancelButton = BaseButton;
