import {
  AppMarkGraphic,
  LoadingIndicator,
  MarkBeamOne,
  MarkBeamThree,
  MarkBeamTwo,
  MarkStar,
  PersistentStatus,
} from './AppPrimitives.styles';

export function AppMark() {
  return (
    <AppMarkGraphic viewBox="0 0 44 44" aria-hidden="true" focusable="false">
      <MarkBeamOne
        x="10"
        y="20"
        width="6"
        height="15"
        rx="3"
        transform="rotate(-9 13 27.5)"
      />
      <MarkBeamTwo
        x="19"
        y="14"
        width="6"
        height="21"
        rx="3"
        transform="rotate(4 22 24.5)"
      />
      <MarkBeamThree
        x="28"
        y="9"
        width="6"
        height="26"
        rx="3"
        transform="rotate(12 31 22)"
      />
      <MarkStar d="m10.2 7.3 1.1 2.8 2.8 1.1-2.8 1.1-1.1 2.8-1.1-2.8-2.8-1.1 2.8-1.1 1.1-2.8Z" />
    </AppMarkGraphic>
  );
}

export function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function MicrophoneIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="9" y="3" width="6" height="12" rx="3" />
      <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3M9 21h6" />
    </svg>
  );
}

export function ArrowIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 19V5m-6 6 6-6 6 6" />
    </svg>
  );
}

export function LoadingSpinner() {
  return <LoadingIndicator />;
}

export function StatusAnnouncer({ status }: { status: string }) {
  return (
    <PersistentStatus role="status" aria-live="polite" aria-atomic="true">
      {status}
    </PersistentStatus>
  );
}
