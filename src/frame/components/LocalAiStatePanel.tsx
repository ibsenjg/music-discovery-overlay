import type { RefObject } from 'react';
import { translate } from '../../shared/i18n';
import {
  CurrentStateText,
  GenerationError,
  LocalAiRequirement,
  StateActions,
} from './LocalAiStateContent';
import { ModelRemovalPanel } from './ModelRemovalPanel';
import type {
  LocalAiPanelActions,
  LocalAiPanelModel,
} from './localAiPanelTypes';
import {
  AiStatus,
  AiStatusHeading,
  DangerOutlineButton,
  FallbackContext,
  LocalAiCard,
  PlainAction,
  ReleaseSection,
} from './LocalAiStatePanel.styles';

type PanelRefs = {
  removeModelButton: RefObject<HTMLButtonElement | null>;
  modelRemovalFirstAction: RefObject<HTMLButtonElement | null>;
};

export function LocalAiStatePanel({
  variant,
  model,
  actions,
  refs,
}: {
  variant: 'settings' | 'composer';
  model: LocalAiPanelModel;
  actions: LocalAiPanelActions;
  refs: PanelRefs;
}) {
  const { locale, providerChoice, state } = model;
  if (variant === 'settings') {
    const needsConsent =
      state.phase === 'downloadable' ||
      (state.phase === 'download-in-progress' && !state.cancellable);
    return (
      <AiStatus>
        <AiStatusHeading>{translate(locale, 'localAiStatus')}</AiStatusHeading>
        {providerChoice === 'rules' ? (
          <p>{translate(locale, 'rulesReady')}</p>
        ) : (
          <>
            <CurrentStateText model={model} />
            {needsConsent && (
              <LocalAiRequirement locale={locale} headingLevel={4} />
            )}
            <GenerationError
              model={model}
              actions={actions}
              variant="settings"
            />
            {model.lastGenerationUsedRules && (
              <FallbackContext>{translate(locale, 'fallback')}</FallbackContext>
            )}
            <StateActions model={model} actions={actions} variant="settings" />
            {(state.phase === 'ready-text' ||
              state.phase === 'ready-text-audio') && (
              <ReleaseSection>
                <PlainAction type="button" onClick={actions.releaseSession}>
                  {translate(locale, 'releaseSession')}
                </PlainAction>
                <p>{translate(locale, 'releaseExplanation')}</p>
                {!model.modelRemovalOpen && (
                  <DangerOutlineButton
                    ref={refs.removeModelButton}
                    type="button"
                    aria-expanded="false"
                    aria-controls="model-removal-panel"
                    onClick={actions.openModelRemoval}
                  >
                    {translate(locale, 'removeModel')}
                  </DangerOutlineButton>
                )}
              </ReleaseSection>
            )}
            {model.modelRemovalOpen && (
              <ModelRemovalPanel
                locale={locale}
                firstActionRef={refs.modelRemovalFirstAction}
                modelManagerError={model.modelManagerError}
                onOpenManager={actions.openModelManager}
                onCancel={actions.closeModelRemoval}
              />
            )}
          </>
        )}
      </AiStatus>
    );
  }

  return (
    <LocalAiCard>
      <GenerationError model={model} actions={actions} variant="composer" />
      {state.phase === 'checking' && (
        <p>{translate(locale, 'checkingModel')}</p>
      )}
      {state.phase === 'ready-text' && (
        <p>{translate(locale, 'modelReadyText')}</p>
      )}
      {state.phase === 'downloadable' && (
        <LocalAiRequirement locale={locale} headingLevel={2} />
      )}
      {state.phase === 'download-in-progress' && !state.cancellable && (
        <LocalAiRequirement locale={locale} headingLevel={2} />
      )}
      {(state.phase === 'downloadable' ||
        state.phase === 'download-in-progress') && (
        <p>
          {state.phase === 'downloadable'
            ? translate(locale, 'modelDownloadRequired')
            : state.progress === undefined
              ? translate(locale, 'modelDownloadDetected')
              : translate(locale, 'modelDownload', {
                  progress: state.progress,
                })}
        </p>
      )}
      {state.phase === 'unavailable' && (
        <>
          <p>{translate(locale, 'modelUnavailable')}</p>
          {model.lastGenerationUsedRules && (
            <p>{translate(locale, 'fallback')}</p>
          )}
          <p>{translate(locale, 'modelRecoveryRequirements')}</p>
        </>
      )}
      {state.phase === 'error' && <p>{translate(locale, 'modelError')}</p>}
      {state.phase !== 'unavailable' && model.lastGenerationUsedRules && (
        <p>{translate(locale, 'fallback')}</p>
      )}
      <StateActions model={model} actions={actions} variant="composer" />
    </LocalAiCard>
  );
}
