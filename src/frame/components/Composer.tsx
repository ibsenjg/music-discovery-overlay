import type { ChangeEvent, KeyboardEvent, RefObject, ReactNode } from 'react';
import { translate } from '../../shared/i18n';
import type { Locale } from '../../shared/types';
import type { VoiceState } from '../appTypes';
import {
  ArrowIcon,
  LoadingSpinner,
  MicrophoneIcon,
  PlusIcon,
} from './AppPrimitives';
import {
  ComposerBody,
  ComposerControls,
  ComposerHelp,
  ComposerInput,
  ComposerSpacer,
  ComposerWrap,
  GenerateControl,
  RoundControl,
  StopSquare,
} from './Composer.styles';

export function Composer({
  locale,
  input,
  loading,
  voiceState,
  canUseMicrophone,
  canGenerate,
  canSubmit,
  settingsOpen,
  inputRef,
  settingsButtonRef,
  microphoneButtonRef,
  localAiPanel,
  onInputChange,
  onGenerate,
  onToggleSettings,
  onRequestVoice,
  onStopVoice,
}: {
  locale: Locale;
  input: string;
  loading: boolean;
  voiceState: VoiceState;
  canUseMicrophone: boolean;
  canGenerate: boolean;
  canSubmit: boolean;
  settingsOpen: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  settingsButtonRef: RefObject<HTMLButtonElement | null>;
  microphoneButtonRef: RefObject<HTMLButtonElement | null>;
  localAiPanel?: ReactNode;
  onInputChange: (value: string) => void;
  onGenerate: () => void;
  onToggleSettings: () => void;
  onRequestVoice: () => void;
  onStopVoice: () => void;
}) {
  const handleInputChange = (event: ChangeEvent<HTMLTextAreaElement>): void => {
    onInputChange(event.target.value);
  };
  const handleInputKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ): void => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      if (canSubmit) onGenerate();
    }
  };

  return (
    <ComposerWrap>
      {localAiPanel}
      <ComposerBody>
        <ComposerInput
          ref={inputRef}
          id="discovery-request"
          rows={1}
          maxLength={500}
          value={input}
          aria-label={translate(locale, 'inputLabel')}
          placeholder={translate(locale, 'inputPlaceholder')}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
        />
        <ComposerControls>
          <RoundControl
            ref={settingsButtonRef}
            type="button"
            aria-label={translate(locale, 'openSettings')}
            aria-expanded={settingsOpen}
            onClick={onToggleSettings}
          >
            <PlusIcon />
          </RoundControl>
          <ComposerSpacer />
          {(canUseMicrophone || voiceState !== 'idle') && (
            <RoundControl
              ref={microphoneButtonRef}
              type="button"
              aria-label={
                voiceState === 'recording'
                  ? translate(locale, 'stopMicrophone')
                  : voiceState === 'requesting'
                    ? translate(locale, 'requestingMicrophone')
                    : voiceState === 'processing'
                      ? translate(locale, 'processingVoice')
                      : translate(locale, 'microphone')
              }
              aria-pressed={voiceState === 'recording'}
              aria-busy={
                voiceState === 'requesting' || voiceState === 'processing'
                  ? true
                  : undefined
              }
              disabled={
                voiceState === 'requesting' || voiceState === 'processing'
              }
              onClick={
                voiceState === 'recording' ? onStopVoice : onRequestVoice
              }
            >
              {voiceState === 'recording' ? (
                <StopSquare aria-hidden="true" />
              ) : voiceState === 'requesting' || voiceState === 'processing' ? (
                <LoadingSpinner />
              ) : (
                <MicrophoneIcon />
              )}
            </RoundControl>
          )}
          {(canGenerate || loading) && (
            <GenerateControl
              type="button"
              aria-label={
                loading
                  ? translate(locale, 'analyzing')
                  : translate(locale, 'generate')
              }
              aria-busy={loading || undefined}
              disabled={!canSubmit}
              onClick={onGenerate}
            >
              {loading ? <LoadingSpinner /> : <ArrowIcon />}
            </GenerateControl>
          )}
        </ComposerControls>
      </ComposerBody>
      <ComposerHelp>
        {voiceState === 'recording'
          ? translate(locale, 'recordingLimit')
          : voiceState === 'requesting'
            ? translate(locale, 'requestingMicrophone')
            : voiceState === 'processing'
              ? translate(locale, 'processingVoice')
              : translate(locale, 'composerHelp')}
      </ComposerHelp>
    </ComposerWrap>
  );
}
