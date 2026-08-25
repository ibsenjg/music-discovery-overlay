import type { RefObject } from 'react';
import { translate } from '../../shared/i18n';
import type {
  CandidateExample,
  CandidateQuery,
  DiscoveryIntent,
  Locale,
} from '../../shared/types';
import {
  evidenceLabel,
  groupCandidates,
  recommendationTypeLabel,
} from '../appModel';
import {
  CandidateCard,
  CandidateList,
  CandidateRoute,
  CandidateRouteList,
  CandidateSearchButton,
  CandidateTitle,
  CandidateTrust,
  ClarificationActions,
  ClarificationButton,
  ClarificationHeading,
  ClarificationSection,
  EvidenceLabel,
  IntentInterpretation,
  RecommendationExplanation,
  RecommendationType,
  RouteHeading,
  RouteTitle,
  Suggestions,
  SuggestionsHeading,
  SupportingExample,
  SupportingExampleButton,
  SupportingExampleCopy,
  SupportingExamples,
  SupportingExamplesLabel,
  SupportingExamplesList,
  TrustDot,
} from './DiscoveryResults.styles';

type SearchableCandidate = Pick<CandidateQuery | CandidateExample, 'query'>;

export function DiscoveryResults({
  locale,
  intent,
  candidates,
  suggestionsRef,
  onResolveClarification,
  onSearch,
}: {
  locale: Locale;
  intent?: DiscoveryIntent;
  candidates: CandidateQuery[];
  suggestionsRef: RefObject<HTMLElement | null>;
  onResolveClarification: (choice: 'tuning' | 'tone') => void;
  onSearch: (candidate: SearchableCandidate) => void;
}) {
  const candidateRoutes = groupCandidates(candidates);

  return (
    <>
      {intent?.clarification && (
        <ClarificationSection aria-labelledby="clarification-title">
          <ClarificationHeading id="clarification-title">
            {translate(locale, 'clarificationTitle', {
              frequency: intent.clarification.frequency,
            })}
          </ClarificationHeading>
          <p>{translate(locale, 'exploratory')}</p>
          <ClarificationActions>
            <ClarificationButton
              type="button"
              onClick={() => onResolveClarification('tuning')}
            >
              {translate(locale, 'tuningOption')}
            </ClarificationButton>
            <ClarificationButton
              type="button"
              onClick={() => onResolveClarification('tone')}
            >
              {translate(locale, 'toneOption')}
            </ClarificationButton>
          </ClarificationActions>
        </ClarificationSection>
      )}

      {candidates.length > 0 && (
        <Suggestions ref={suggestionsRef} aria-labelledby="suggestions-title">
          <SuggestionsHeading id="suggestions-title">
            {translate(locale, 'suggestions')}
          </SuggestionsHeading>
          {intent?.interpretation && (
            <IntentInterpretation>
              <strong>{translate(locale, 'interpretation')}:</strong>{' '}
              {intent.interpretation}
            </IntentInterpretation>
          )}
          <CandidateRouteList>
            {candidateRoutes.map((candidateRoute) => (
              <CandidateRoute
                key={candidateRoute.id}
                aria-labelledby={`${candidateRoute.id}-title`}
              >
                <RouteHeading>
                  <RouteTitle id={`${candidateRoute.id}-title`}>
                    {candidateRoute.title}
                  </RouteTitle>
                  <p>{candidateRoute.rationale}</p>
                </RouteHeading>
                <CandidateList>
                  {candidateRoute.candidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      aria-labelledby={`${candidate.id}-title`}
                    >
                      <RecommendationType>
                        {recommendationTypeLabel(locale, candidate.entityType)}
                      </RecommendationType>
                      <CandidateTitle id={`${candidate.id}-title`}>
                        {candidate.title}
                      </CandidateTitle>
                      <RecommendationExplanation>
                        {candidate.explanation}
                      </RecommendationExplanation>
                      <CandidateTrust>
                        <TrustDot aria-hidden="true" />
                        <span>
                          <EvidenceLabel>
                            {translate(locale, 'evidence')}:{' '}
                          </EvidenceLabel>
                          {[
                            ...candidate.evidence.map((evidence) =>
                              evidenceLabel(locale, evidence.kind),
                            ),
                            ...(candidate.exploratory
                              ? [translate(locale, 'exploratoryCompact')]
                              : []),
                          ].join(' · ')}
                        </span>
                      </CandidateTrust>
                      {candidate.examples.length > 0 && (
                        <SupportingExamples>
                          <SupportingExamplesLabel>
                            {translate(locale, 'supportingExamples')}
                          </SupportingExamplesLabel>
                          <SupportingExamplesList>
                            {candidate.examples.map((example) => (
                              <SupportingExample key={example.id}>
                                <SupportingExampleCopy>
                                  <RecommendationType>
                                    {recommendationTypeLabel(
                                      locale,
                                      example.entityType,
                                    )}
                                  </RecommendationType>
                                  <strong>{example.title}</strong>
                                </SupportingExampleCopy>
                                <SupportingExampleButton
                                  type="button"
                                  onClick={() => onSearch(example)}
                                  aria-label={translate(locale, 'searchFor', {
                                    name: example.title,
                                  })}
                                >
                                  {translate(locale, 'searchShort')}
                                </SupportingExampleButton>
                              </SupportingExample>
                            ))}
                          </SupportingExamplesList>
                        </SupportingExamples>
                      )}
                      <CandidateSearchButton
                        type="button"
                        onClick={() => onSearch(candidate)}
                        aria-label={translate(locale, 'searchFor', {
                          name: candidate.title,
                        })}
                      >
                        {translate(locale, 'searchNamed', {
                          name: candidate.title,
                        })}
                      </CandidateSearchButton>
                    </CandidateCard>
                  ))}
                </CandidateList>
              </CandidateRoute>
            ))}
          </CandidateRouteList>
        </Suggestions>
      )}
    </>
  );
}
