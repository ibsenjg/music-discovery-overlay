import { styled } from 'styled-components';
import { media } from '../styles/media';
import {
  BaseButton,
  ButtonStack,
  Heading2,
  Heading3,
  Heading4,
  PrimaryButton,
  ScreenReaderOnlyInline,
} from '../styles/primitives';
import { tokens } from '../styles/theme';

export const ClarificationSection = styled.section`
  margin-top: ${tokens.spaceFive};
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusMedium};
  padding: ${tokens.spaceThree};
  background: ${tokens.surfaceNotice};

  p {
    color: ${tokens.muted};
    line-height: 1.45;
  }

  ${media.forcedColors} {
    border: 1px solid ButtonText;
    color: CanvasText;
    background: Canvas;
  }
`;

export const ClarificationHeading = Heading2;
export const ClarificationActions = ButtonStack;
export const ClarificationButton = BaseButton;

export const Suggestions = styled.section.attrs({ className: 'suggestions' })`
  min-height: 100%;
  margin-top: ${tokens.spaceFive};
`;

export const SuggestionsHeading = Heading2;

export const IntentInterpretation = styled.p`
  margin: 0 0 ${tokens.spaceFour};
  color: ${tokens.muted};
  font-size: 0.86rem;
  line-height: 1.5;
`;

export const CandidateRouteList = styled.div`
  display: grid;
  gap: ${tokens.spaceThree};
`;

export const CandidateRoute = styled.section`
  display: grid;
  gap: ${tokens.spaceThree};
  margin: 0;
  border-left: 3px solid ${tokens.accent};
  padding-left: ${tokens.spaceThree};
`;

export const RouteHeading = styled.div`
  display: grid;
  gap: ${tokens.spaceOne};

  p {
    margin: 0;
    color: ${tokens.muted};
    font-size: 0.84rem;
    line-height: 1.5;
  }
`;

export const RouteTitle = Heading3;

export const CandidateList = styled.div`
  display: grid;
  gap: ${tokens.spaceThree};
`;

export const CandidateCard = styled.article.attrs({
  className: 'candidate-card',
})`
  display: grid;
  gap: ${tokens.spaceThree};
  border: 1px solid ${tokens.border};
  border-radius: ${tokens.radiusMedium};
  padding: ${tokens.spaceFour};
  background: ${tokens.surfaceRaised};

  ${media.forcedColors} {
    border: 1px solid ButtonText;
  }
`;

export const RecommendationType = styled.span`
  color: ${tokens.accent};
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
`;

export const CandidateTitle = Heading4;

export const RecommendationExplanation = styled.p`
  margin: 0;
  color: ${tokens.muted};
  font-size: 0.84rem;
  line-height: 1.5;
`;

export const CandidateTrust = styled.p`
  display: flex;
  align-items: flex-start;
  gap: ${tokens.spaceTwo};
  margin: 0;
  color: ${tokens.muted};
  font-size: 0.74rem;
  line-height: 1.45;
`;

export const TrustDot = styled.span`
  width: 7px;
  height: 7px;
  flex: 0 0 auto;
  margin-top: 0.35em;
  border-radius: 50%;
  background: ${tokens.accent};
`;

export const EvidenceLabel = ScreenReaderOnlyInline;

export const SupportingExamples = styled.div`
  display: grid;
  gap: ${tokens.spaceTwo};
  border-top: 1px solid ${tokens.border};
  padding-top: ${tokens.spaceThree};
`;

export const SupportingExamplesLabel = styled.p`
  margin: 0;
  color: ${tokens.muted};
  font-size: 0.78rem;
  font-weight: 700;
`;

export const SupportingExamplesList = styled.ul`
  display: grid;
  gap: 0;
  margin: 0;
  padding: 0;
  list-style: none;
`;

export const SupportingExample = styled.li`
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: ${tokens.spaceTwo};
  min-height: 58px;
  border-bottom: 1px solid ${tokens.border};
  padding: ${tokens.spaceTwo} 0;

  &:last-child {
    border-bottom: 0;
  }
`;

export const SupportingExampleCopy = styled.div`
  display: grid;
  min-width: 0;
  gap: ${tokens.spaceOne};
`;

export const SupportingExampleButton = styled(BaseButton)`
  min-height: 44px;
  padding: 7px 10px;
  font-size: 0.74rem;
`;

export const CandidateSearchButton = PrimaryButton;
