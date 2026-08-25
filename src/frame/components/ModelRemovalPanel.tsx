import type { RefObject } from 'react';
import { translate } from '../../shared/i18n';
import type { Locale } from '../../shared/types';
import { CHROME_MODEL_MANAGER_URL } from '../appModel';
import {
  AddressCode,
  AddressLabel,
  CancelButton,
  DangerButton,
  ErrorCopy,
  RemovalHeading,
  RemovalPanel,
  RemovalSteps,
} from './ModelRemovalPanel.styles';

export function ModelRemovalPanel({
  locale,
  firstActionRef,
  modelManagerError,
  onOpenManager,
  onCancel,
}: {
  locale: Locale;
  firstActionRef: RefObject<HTMLButtonElement | null>;
  modelManagerError: boolean;
  onOpenManager: () => void;
  onCancel: () => void;
}) {
  return (
    <RemovalPanel
      id="model-removal-panel"
      role="group"
      aria-labelledby="model-removal-title"
    >
      <RemovalHeading id="model-removal-title">
        {translate(locale, 'removeModelTitle')}
      </RemovalHeading>
      <p>{translate(locale, 'removeModelImpact')}</p>
      <p>{translate(locale, 'removeModelBoundary')}</p>
      <AddressLabel>{translate(locale, 'modelManagerAddress')}</AddressLabel>
      <AddressCode>{CHROME_MODEL_MANAGER_URL}</AddressCode>
      <RemovalSteps>
        <li>{translate(locale, 'modelRemovalStepOne')}</li>
        <li>{translate(locale, 'modelRemovalStepTwo')}</li>
        <li>{translate(locale, 'modelRemovalStepThree')}</li>
      </RemovalSteps>
      <DangerButton ref={firstActionRef} type="button" onClick={onOpenManager}>
        {translate(locale, 'openModelManager')}
      </DangerButton>
      <CancelButton type="button" onClick={onCancel}>
        {translate(locale, 'cancelRemoval')}
      </CancelButton>
      {modelManagerError && (
        <ErrorCopy>{translate(locale, 'modelManagerOpenError')}</ErrorCopy>
      )}
    </RemovalPanel>
  );
}
