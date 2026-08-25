import { styled } from 'styled-components';
import { media } from '../styles/media';
import { BaseButton, Heading4 } from '../styles/primitives';
import { tokens } from '../styles/theme';

export const RemovalPanel = styled.div.attrs({
  className: 'model-removal-panel',
})`
  display: grid;
  gap: ${tokens.spaceTwo};
  border: 1px solid ${tokens.danger};
  border-radius: ${tokens.radiusSmall};
  padding: ${tokens.spaceThree};
  background: ${tokens.surfaceDanger};

  p,
  ol {
    margin: 0;
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
  }
`;

export const RemovalHeading = styled(Heading4)`
  font-size: 0.9rem;
`;

export const RemovalSteps = styled.ol`
  display: grid;
  gap: ${tokens.spaceOne};
  padding-left: 20px;
  color: ${tokens.muted};
  font-size: 0.78rem;
  line-height: 1.45;
`;

export const AddressLabel = styled.span`
  color: ${tokens.muted};
  font-size: 0.75rem;
  font-weight: 700;
`;

export const AddressCode = styled.code`
  overflow-wrap: anywhere;
  border-radius: 8px;
  padding: 10px;
  color: ${tokens.codeText};
  background: ${tokens.codeSurface};
  font-size: 0.82rem;
  line-height: 1.45;
  user-select: all;

  ${media.forcedColors} {
    color: CanvasText;
    background: Canvas;
  }
`;

export const DangerButton = styled(BaseButton)`
  border-color: ${tokens.danger};
  color: ${tokens.dangerInk};
  background: ${tokens.danger};
  font-weight: 800;
`;

export const CancelButton = BaseButton;

export const ErrorCopy = styled.p`
  color: ${tokens.danger} !important;
`;
