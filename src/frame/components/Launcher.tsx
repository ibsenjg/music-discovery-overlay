import type { RefObject } from 'react';
import { translate } from '../../shared/i18n';
import type { Locale } from '../../shared/types';
import type { VoiceState } from '../appTypes';
import { AppMark, LoadingSpinner } from './AppPrimitives';
import { BusyIndicator, LauncherButton } from './Launcher.styles';

export function Launcher({
  locale,
  loading,
  voiceState,
  launcherRef,
  onOpen,
}: {
  locale: Locale;
  loading: boolean;
  voiceState: VoiceState;
  launcherRef: RefObject<HTMLButtonElement | null>;
  onOpen: () => void;
}) {
  const busy = loading || voiceState === 'processing';
  const label = loading
    ? translate(locale, 'launcherAnalyzing')
    : voiceState === 'processing'
      ? translate(locale, 'launcherTranscribing')
      : translate(locale, 'launcher');

  return (
    <LauncherButton
      ref={launcherRef}
      type="button"
      aria-label={label}
      aria-busy={busy || undefined}
      onClick={onOpen}
    >
      <AppMark />
      {busy && (
        <BusyIndicator>
          <LoadingSpinner />
        </BusyIndicator>
      )}
    </LauncherButton>
  );
}
