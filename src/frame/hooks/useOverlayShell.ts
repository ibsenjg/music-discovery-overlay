import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { translate } from '../../shared/i18n';
import { isContentToFrameMessage } from '../../shared/messageValidation';
import type { Locale } from '../../shared/types';
import { nonceFromHash, parentOriginFromHash } from '../bridge';
import type { ProviderChoice, ThemeChoice, VoiceState } from '../appTypes';

type ShellCallbacks = {
  cancelVoice: () => void;
  closeVoiceDisclosure: () => void;
  closeModelRemoval: (restoreFocus: boolean) => void;
  closeModelPanels: () => void;
  refreshCapabilities: () => void;
  setStatus: (status: string) => void;
};

function resetFrameViewport(): void {
  if (document.scrollingElement) {
    document.scrollingElement.scrollTop = 0;
    document.scrollingElement.scrollLeft = 0;
  }
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;
}

export function useOverlayShell({
  locale,
  theme,
  providerChoice,
  input,
  candidateCount,
  voiceStateRef,
  voiceDisclosureOpen,
  modelRemovalOpen,
  inputRef,
  settingsFirstRef,
  callbacks,
}: {
  locale: Locale;
  theme: ThemeChoice;
  providerChoice: ProviderChoice;
  input: string;
  candidateCount: number;
  voiceStateRef: RefObject<VoiceState>;
  voiceDisclosureOpen: boolean;
  modelRemovalOpen: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  settingsFirstRef: RefObject<HTMLSelectElement | null>;
  callbacks: ShellCallbacks;
}) {
  const [open, setOpen] = useState(false);
  const [overlayExpanded, setOverlayExpanded] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const settingsButtonRef = useRef<HTMLButtonElement>(null);
  const settingsPanelRef = useRef<HTMLElement>(null);
  const drawerScrollRef = useRef<HTMLDivElement>(null);
  const suggestionsRef = useRef<HTMLElement>(null);
  const nonce = useMemo(nonceFromHash, []);
  const expectedParentOrigin = useMemo(parentOriginFromHash, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = theme;
    return () => {
      if (root.dataset.theme === theme) delete root.dataset.theme;
    };
  }, [theme]);

  useEffect(() => {
    const onMessage = (event: MessageEvent): void => {
      if (
        event.source !== window.parent ||
        event.origin !== expectedParentOrigin ||
        !isContentToFrameMessage(event.data, nonce)
      ) {
        return;
      }
      const message = event.data;
      if (message.type === 'search-result') {
        callbacks.setStatus(translate(locale, 'searched'));
      } else if (
        message.type === 'overlay-state-result' &&
        typeof message.open === 'boolean'
      ) {
        resetFrameViewport();
        setOverlayExpanded(message.open);
        if (message.open) {
          window.setTimeout(() => {
            resetFrameViewport();
            inputRef.current?.focus({ preventScroll: true });
          }, 0);
        } else {
          setOpen(false);
          window.setTimeout(() => {
            resetFrameViewport();
            launcherRef.current?.focus({ preventScroll: true });
          }, 0);
        }
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [callbacks, expectedParentOrigin, locale, nonce]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.style.height = 'auto';
    inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 104)}px`;
  }, [input]);

  useEffect(() => {
    if (!open || !overlayExpanded || candidateCount === 0) return;
    const scrollTimer = window.setTimeout(() => {
      const scroller = drawerScrollRef.current;
      const suggestions = suggestionsRef.current;
      if (!scroller || !suggestions) return;
      const top =
        scroller.scrollTop +
        suggestions.getBoundingClientRect().top -
        scroller.getBoundingClientRect().top;
      scroller.scrollTo?.({ behavior: 'auto', top: Math.max(0, top) });
    }, 0);
    return () => window.clearTimeout(scrollTimer);
  }, [candidateCount, open, overlayExpanded]);

  useEffect(() => {
    if (!settingsOpen) return;
    const onPointerDown = (event: PointerEvent): void => {
      const target = event.target as Node;
      if (
        !settingsPanelRef.current?.contains(target) &&
        !settingsButtonRef.current?.contains(target)
      ) {
        setSettingsOpen(false);
        callbacks.closeModelPanels();
        settingsButtonRef.current?.focus();
      }
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [callbacks, settingsOpen]);

  const notifyOverlayState = useCallback(
    (nextOpen: boolean): void => {
      window.parent.postMessage(
        { source: 'mdo-frame', nonce, type: 'overlay-state', open: nextOpen },
        expectedParentOrigin,
      );
    },
    [expectedParentOrigin, nonce],
  );

  const setOverlayOpen = useCallback(
    (nextOpen: boolean): void => {
      resetFrameViewport();
      setOverlayExpanded(nextOpen && window.parent === window);
      if (!nextOpen) {
        if (
          voiceStateRef.current === 'requesting' ||
          voiceStateRef.current === 'recording'
        ) {
          callbacks.cancelVoice();
        }
        setSettingsOpen(false);
        callbacks.closeModelPanels();
        callbacks.closeVoiceDisclosure();
      }
      if (nextOpen) setOpen(true);
      if (nextOpen && providerChoice === 'on-device') {
        callbacks.refreshCapabilities();
      }
      notifyOverlayState(nextOpen);
      if (!nextOpen && window.parent === window) {
        setOpen(false);
        window.setTimeout(() => {
          resetFrameViewport();
          launcherRef.current?.focus({ preventScroll: true });
        }, 0);
      }
      if (nextOpen && window.parent === window) {
        window.setTimeout(() => {
          resetFrameViewport();
          inputRef.current?.focus({ preventScroll: true });
        }, 0);
      }
    },
    [callbacks, notifyOverlayState, providerChoice, voiceStateRef],
  );

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (voiceDisclosureOpen && event.key === 'Tab') return;
      if (event.key !== 'Escape') return;
      if (voiceDisclosureOpen) {
        callbacks.closeVoiceDisclosure();
      } else if (modelRemovalOpen) {
        callbacks.closeModelRemoval(true);
      } else if (settingsOpen) {
        setSettingsOpen(false);
        settingsButtonRef.current?.focus();
      } else if (open) {
        setOverlayOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    callbacks,
    modelRemovalOpen,
    open,
    setOverlayOpen,
    settingsOpen,
    voiceDisclosureOpen,
  ]);

  const openSettings = useCallback((): void => {
    setSettingsOpen(true);
    if (providerChoice === 'on-device') callbacks.refreshCapabilities();
    window.setTimeout(() => settingsFirstRef.current?.focus(), 0);
  }, [callbacks, providerChoice]);

  const closeSettings = useCallback((): void => {
    setSettingsOpen(false);
    callbacks.closeModelPanels();
    settingsButtonRef.current?.focus();
  }, [callbacks]);

  const toggleSettings = useCallback((): void => {
    if (settingsOpen) closeSettings();
    else openSettings();
  }, [closeSettings, openSettings, settingsOpen]);

  const submitSearch = useCallback(
    (candidate: { query: string }): void => {
      window.parent.postMessage(
        {
          source: 'mdo-frame',
          nonce,
          type: 'search',
          query: candidate.query,
        },
        expectedParentOrigin,
      );
    },
    [expectedParentOrigin, nonce],
  );

  return {
    open,
    overlayExpanded,
    settingsOpen,
    inputRef,
    launcherRef,
    settingsButtonRef,
    settingsPanelRef,
    settingsFirstRef,
    drawerScrollRef,
    suggestionsRef,
    setOverlayOpen,
    openSettings,
    closeSettings,
    toggleSettings,
    submitSearch,
  };
}
