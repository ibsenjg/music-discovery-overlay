import { translate } from '../../shared/i18n';
import type { Locale } from '../../shared/types';
import type {
  LocalAiPanelActions,
  LocalAiPanelModel,
} from './localAiPanelTypes';
import {
  ModelCallToAction,
  ModelRequirement,
  PlainAction,
  PrimaryAction,
  Progress,
  RecoveryActions,
  RequirementHeading2,
  RequirementHeading4,
} from './LocalAiStatePanel.styles';

export function LocalAiRequirement({
  locale,
  headingLevel,
}: {
  locale: Locale;
  headingLevel: 2 | 4;
}) {
  const Heading =
    headingLevel === 2 ? RequirementHeading2 : RequirementHeading4;
  return (
    <ModelRequirement>
      <Heading>{translate(locale, 'modelRequiredTitle')}</Heading>
      <p>{translate(locale, 'modelRequiredFeatures')}</p>
      <p>{translate(locale, 'modelRequiredAlternative')}</p>
    </ModelRequirement>
  );
}

export function CurrentStateText({ model }: { model: LocalAiPanelModel }) {
  const { locale, state } = model;
  return (
    <p>
      {state.phase === 'checking' && translate(locale, 'checkingModel')}
      {state.phase === 'downloadable' &&
        translate(locale, 'modelDownloadRequired')}
      {state.phase === 'download-in-progress' &&
        (state.progress === undefined
          ? translate(locale, 'modelDownloadDetected')
          : translate(locale, 'modelDownload', { progress: state.progress }))}
      {state.phase === 'ready-text' && translate(locale, 'modelReadyText')}
      {state.phase === 'ready-text-audio' && translate(locale, 'modelReady')}
      {state.phase === 'unavailable' && translate(locale, 'modelUnavailable')}
      {state.phase === 'error' && translate(locale, 'modelError')}
    </p>
  );
}

export function GenerationError({
  model,
  actions,
  variant,
}: {
  model: LocalAiPanelModel;
  actions: LocalAiPanelActions;
  variant: 'settings' | 'composer';
}) {
  if (!model.generationError) return null;
  const actionsContent = (
    <>
      {model.canGenerate && (
        <PrimaryAction type="button" onClick={actions.retryLocalAi}>
          {translate(model.locale, 'retryLocalAi')}
        </PrimaryAction>
      )}
      <PlainAction type="button" onClick={actions.useRules}>
        {translate(model.locale, 'useRules')}
      </PlainAction>
    </>
  );
  return variant === 'settings' ? (
    <RecoveryActions>
      <p>{translate(model.locale, 'localAiGenerationError')}</p>
      {actionsContent}
    </RecoveryActions>
  ) : (
    <>
      <p>{translate(model.locale, 'localAiGenerationError')}</p>
      <RecoveryActions>{actionsContent}</RecoveryActions>
    </>
  );
}

export function StateActions({
  model,
  actions,
  variant,
}: {
  model: LocalAiPanelModel;
  actions: LocalAiPanelActions;
  variant: 'settings' | 'composer';
}) {
  const { locale, state, generationError } = model;
  const MainAction = variant === 'composer' ? ModelCallToAction : PrimaryAction;
  const useRules = !generationError && (
    <PlainAction type="button" onClick={actions.selectRules}>
      {translate(locale, 'useRules')}
    </PlainAction>
  );

  if (state.phase === 'downloadable') {
    return (
      <RecoveryActions>
        <MainAction type="button" onClick={actions.prepare}>
          {translate(locale, 'downloadModel')}
        </MainAction>
        {useRules}
      </RecoveryActions>
    );
  }
  if (state.phase === 'download-in-progress' && state.cancellable) {
    return (
      <>
        <Progress
          aria-label={translate(locale, 'modelDownloadProgress')}
          max="100"
          value={state.progress ?? 0}
        />
        <PlainAction type="button" onClick={actions.cancelPreparation}>
          {translate(locale, 'cancelDownload')}
        </PlainAction>
        {useRules}
      </>
    );
  }
  if (state.phase === 'download-in-progress') {
    return (
      <RecoveryActions>
        <MainAction type="button" onClick={actions.prepare}>
          {translate(locale, 'continueDownload')}
        </MainAction>
        {useRules}
      </RecoveryActions>
    );
  }
  if (state.phase === 'unavailable') {
    return (
      <RecoveryActions>
        {variant === 'settings' && (
          <p>{translate(locale, 'modelRecoveryRequirements')}</p>
        )}
        <PrimaryAction type="button" onClick={actions.retryCapabilities}>
          {translate(locale, 'checkAgain')}
        </PrimaryAction>
        <PlainAction type="button" onClick={actions.openModelManager}>
          {translate(locale, 'openAiStatus')}
        </PlainAction>
        {useRules}
      </RecoveryActions>
    );
  }
  if (state.phase === 'error') {
    return (
      <RecoveryActions>
        <PrimaryAction type="button" onClick={actions.retryCapabilities}>
          {translate(locale, 'retry')}
        </PrimaryAction>
        <PlainAction type="button" onClick={actions.openModelManager}>
          {translate(locale, 'openAiStatus')}
        </PlainAction>
      </RecoveryActions>
    );
  }
  return null;
}
