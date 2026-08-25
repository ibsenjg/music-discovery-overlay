import { styled } from 'styled-components';
import { media } from '../styles/media';
import {
  BaseButton,
  Heading2,
  Heading3,
  Heading4,
  PrimaryButton,
} from '../styles/primitives';
import { tokens } from '../styles/theme';

export const RecoveryActions = styled.div`
  display: grid;
  gap: ${tokens.spaceTwo};

  p {
    margin: 0;
  }
`;

export const AiStatus = styled.div`
  display: grid;
  gap: ${tokens.spaceTwo};
  margin-top: ${tokens.spaceFour};
  border-top: 1px solid ${tokens.border};
  padding-top: ${tokens.spaceFour};

  p {
    margin: 0;
    color: ${tokens.muted};
    font-size: 0.78rem;
    line-height: 1.45;
  }

  ${RecoveryActions} {
    margin-top: ${tokens.spaceTwo};
  }
`;

export const AiStatusHeading = Heading3;

export const Progress = styled.progress`
  display: block;
  width: 100%;
  accent-color: ${tokens.accent};
`;

export const ReleaseSection = styled.div`
  display: grid;
  gap: ${tokens.spaceTwo};
  border-top: 1px solid ${tokens.border};
  padding-top: ${tokens.spaceThree};
`;

export const PlainAction = BaseButton;
export const PrimaryAction = PrimaryButton;

export const ModelCallToAction = styled(PrimaryButton)`
  width: 100%;
  margin-bottom: 0;
`;

export const DangerOutlineButton = styled(BaseButton)`
  border-color: ${tokens.danger};
  color: ${tokens.danger};
  background: transparent;
`;

export const LocalAiCard = styled.div.attrs({
  className: 'local-ai-state-card',
})`
  display: grid;
  gap: ${tokens.spaceTwo};
  margin-bottom: ${tokens.spaceTwo};
  border: 1px solid ${tokens.border};
  border-radius: 16px;
  padding: ${tokens.spaceThree};
  background: ${tokens.surfaceSoft};
  font-size: 0.78rem;
  line-height: 1.45;

  p {
    margin: 0;
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
  }
`;

export const ModelRequirement = styled.div`
  display: grid;
  gap: ${tokens.spaceOne};
  border-left: 3px solid ${tokens.accent};
  padding-left: ${tokens.spaceTwo};

  p {
    margin: 0;
    color: ${tokens.muted};
  }
`;

const requirementHeadingStyles = `
  margin: 0;
  color: ${tokens.text};
  font-size: 0.88rem;
`;

export const RequirementHeading2 = styled(Heading2)`
  ${requirementHeadingStyles}
`;

export const RequirementHeading4 = styled(Heading4)`
  ${requirementHeadingStyles}
`;

export const FallbackContext = styled.p`
  margin: 0;
`;
