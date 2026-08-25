import type { RefObject } from 'react';
import { translate } from '../../shared/i18n';
import type { Locale } from '../../shared/types';
import {
  AllowButton,
  Backdrop,
  CancelButton,
  Disclosure,
  DisclosureActions,
  DisclosureCopy,
  DisclosureHeading,
} from './VoiceDisclosureDialog.styles';

export function VoiceDisclosureDialog({
  locale,
  dialogRef,
  allowRef,
  onAllow,
  onCancel,
}: {
  locale: Locale;
  dialogRef: RefObject<HTMLElement | null>;
  allowRef: RefObject<HTMLButtonElement | null>;
  onAllow: () => void;
  onCancel: () => void;
}) {
  return (
    <Backdrop>
      <Disclosure
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="voice-consent-title"
        aria-describedby="voice-consent-description"
      >
        <DisclosureHeading id="voice-consent-title">
          {translate(locale, 'microphone')}
        </DisclosureHeading>
        <DisclosureCopy id="voice-consent-description">
          {translate(locale, 'voiceDisclosure')}
        </DisclosureCopy>
        <DisclosureActions>
          <AllowButton ref={allowRef} type="button" onClick={onAllow}>
            {translate(locale, 'allowAndStart')}
          </AllowButton>
          <CancelButton type="button" onClick={onCancel}>
            {translate(locale, 'cancel')}
          </CancelButton>
        </DisclosureActions>
      </Disclosure>
    </Backdrop>
  );
}
