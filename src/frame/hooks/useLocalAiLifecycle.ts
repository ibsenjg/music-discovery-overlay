import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { translate } from '../../shared/i18n';
import type {
  Locale,
  ProviderCapabilities,
  ProviderUsage,
} from '../../shared/types';
import {
  CHROME_MODEL_MANAGER_URL,
  isReadyLocalAiState,
  localAiStatusText,
  stateFromCapabilities,
} from '../appModel';
import type {
  ActivePreparation,
  LocalAiState,
  ProviderChoice,
  ProviderMap,
} from '../appTypes';

type LifecycleCallbacks = {
  cancelVoice: () => void;
  invalidateActiveWork: () => void;
  setStatus: (status: string) => void;
  setVisibleNotice: (notice: string) => void;
  setGenerationError: (error: boolean) => void;
};

export function useLocalAiLifecycle({
  locale,
  providerChoice,
  providers,
  callbacks,
  modelRemovalFallbackRef,
}: {
  locale: Locale;
  providerChoice: ProviderChoice;
  providers: ProviderMap;
  callbacks: LifecycleCallbacks;
  modelRemovalFallbackRef: RefObject<HTMLElement | null>;
}) {
  const [state, setState] = useState<LocalAiState>({
    phase: 'checking',
    capabilities: { text: 'unavailable', audio: 'unavailable' },
  });
  const [usage, setUsage] = useState<ProviderUsage>();
  const [modelRemovalOpen, setModelRemovalOpen] = useState(false);
  const [modelManagerError, setModelManagerError] = useState(false);
  const removeModelButtonRef = useRef<HTMLButtonElement>(null);
  const modelRemovalFirstRef = useRef<HTMLButtonElement>(null);
  const preparationRef = useRef<ActivePreparation | undefined>(undefined);
  const preparationRequestIdRef = useRef(0);
  const capabilityRequestIdRef = useRef(0);
  const capabilityRequestRef = useRef<
    Promise<ProviderCapabilities | undefined> | undefined
  >(undefined);
  const mountedRef = useRef(false);

  const invalidateCapabilityCheck = useCallback((): void => {
    capabilityRequestIdRef.current += 1;
    capabilityRequestRef.current = undefined;
  }, []);

  const invalidatePreparation = useCallback((): void => {
    preparationRequestIdRef.current += 1;
    const activePreparation = preparationRef.current;
    preparationRef.current = undefined;
    activePreparation?.controller.abort();
  }, []);

  const refreshCapabilities = useCallback(
    async ({
      force = false,
      preserveGeneration = false,
    }: {
      force?: boolean;
      preserveGeneration?: boolean;
    } = {}): Promise<ProviderCapabilities | undefined> => {
      if (providerChoice === 'rules') return undefined;
      if (!force && preparationRef.current) return undefined;
      if (!force && capabilityRequestRef.current) {
        return capabilityRequestRef.current;
      }

      const requestId = capabilityRequestIdRef.current + 1;
      capabilityRequestIdRef.current = requestId;
      callbacks.setStatus(translate(locale, 'checkingModel'));
      setState((current) =>
        !force && isReadyLocalAiState(current)
          ? current
          : { phase: 'checking', capabilities: current.capabilities },
      );

      const request = (async () => {
        try {
          const next = await providers['on-device'].capabilities(locale);
          if (requestId !== capabilityRequestIdRef.current) return undefined;
          const nextState = stateFromCapabilities(next);
          if (!isReadyLocalAiState(nextState)) {
            if (preserveGeneration) callbacks.cancelVoice();
            else callbacks.invalidateActiveWork();
            providers['on-device'].dispose();
            setUsage(undefined);
          }
          setState(nextState);
          callbacks.setStatus(localAiStatusText(locale, nextState));
          return next;
        } catch {
          if (requestId === capabilityRequestIdRef.current) {
            if (preserveGeneration) callbacks.cancelVoice();
            else callbacks.invalidateActiveWork();
            providers['on-device'].dispose();
            setUsage(undefined);
            setState((current) => ({
              phase: 'error',
              capabilities: current.capabilities,
            }));
            callbacks.setStatus(translate(locale, 'modelError'));
          }
          return undefined;
        } finally {
          if (requestId === capabilityRequestIdRef.current) {
            capabilityRequestRef.current = undefined;
          }
        }
      })();

      capabilityRequestRef.current = request;
      return request;
    },
    [callbacks, locale, providerChoice, providers],
  );

  useEffect(() => {
    if (providerChoice === 'rules') {
      invalidateCapabilityCheck();
      callbacks.cancelVoice();
      return;
    }
    void refreshCapabilities({ force: true });
  }, [
    callbacks,
    invalidateCapabilityCheck,
    locale,
    providerChoice,
    refreshCapabilities,
  ]);

  useEffect(() => {
    if (providerChoice === 'rules') return;
    const refreshWhenVisible = (): void => {
      if (document.visibilityState === 'visible') {
        void refreshCapabilities();
      }
    };
    window.addEventListener('focus', refreshWhenVisible);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      window.removeEventListener('focus', refreshWhenVisible);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [providerChoice, refreshCapabilities]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      invalidateCapabilityCheck();
      invalidatePreparation();
      providers['on-device'].dispose();
    };
  }, [invalidateCapabilityCheck, invalidatePreparation, providers]);

  const prepare = useCallback(async (): Promise<void> => {
    if (
      state.phase !== 'downloadable' &&
      !(state.phase === 'download-in-progress' && !state.cancellable)
    ) {
      return;
    }
    callbacks.invalidateActiveWork();
    invalidateCapabilityCheck();
    invalidatePreparation();
    const operation: ActivePreparation = {
      id: preparationRequestIdRef.current + 1,
      controller: new AbortController(),
    };
    preparationRequestIdRef.current = operation.id;
    preparationRef.current = operation;
    const isCurrent = (): boolean =>
      mountedRef.current &&
      preparationRequestIdRef.current === operation.id &&
      preparationRef.current === operation &&
      !operation.controller.signal.aborted;
    callbacks.setGenerationError(false);
    setState({
      phase: 'download-in-progress',
      capabilities: state.capabilities,
      progress: 0,
      cancellable: true,
    });
    callbacks.setVisibleNotice('');
    try {
      const next = await providers['on-device'].prepare({
        locale,
        signal: operation.controller.signal,
        onDownloadProgress: (progress) => {
          if (!isCurrent()) return;
          callbacks.setStatus(translate(locale, 'modelDownload', { progress }));
          setState((current) => ({
            phase: 'download-in-progress',
            capabilities: current.capabilities,
            progress,
            cancellable: true,
          }));
        },
      });
      if (!isCurrent()) return;
      const nextState = stateFromCapabilities(next);
      setState(nextState);
      callbacks.setStatus(localAiStatusText(locale, nextState));
      setUsage(providers['on-device'].usage());
    } catch {
      if (!isCurrent()) return;
      preparationRef.current = undefined;
      await refreshCapabilities({ force: true });
      if (
        !mountedRef.current ||
        preparationRequestIdRef.current !== operation.id
      ) {
        return;
      }
      callbacks.setVisibleNotice(translate(locale, 'modelError'));
    } finally {
      if (preparationRef.current === operation) {
        preparationRef.current = undefined;
      }
    }
  }, [
    callbacks,
    invalidateCapabilityCheck,
    invalidatePreparation,
    locale,
    providers,
    refreshCapabilities,
    state,
  ]);

  const cancelPreparation = useCallback((): void => {
    invalidatePreparation();
    void refreshCapabilities({ force: true });
  }, [invalidatePreparation, refreshCapabilities]);

  const releaseSession = useCallback(async (): Promise<void> => {
    callbacks.invalidateActiveWork();
    invalidatePreparation();
    providers['on-device'].dispose();
    setUsage(undefined);
    await refreshCapabilities({ force: true });
    callbacks.setStatus(translate(locale, 'sessionReleased'));
    callbacks.setVisibleNotice(translate(locale, 'sessionReleased'));
  }, [
    callbacks,
    invalidatePreparation,
    locale,
    providers,
    refreshCapabilities,
  ]);

  const openModelRemoval = useCallback((): void => {
    setModelRemovalOpen(true);
    setModelManagerError(false);
    window.setTimeout(() => modelRemovalFirstRef.current?.focus(), 0);
  }, []);

  const closeModelRemoval = useCallback(
    (restoreFocus: boolean): void => {
      setModelRemovalOpen(false);
      setModelManagerError(false);
      if (restoreFocus) {
        window.setTimeout(
          () =>
            (
              removeModelButtonRef.current ?? modelRemovalFallbackRef.current
            )?.focus(),
          0,
        );
      }
    },
    [modelRemovalFallbackRef],
  );

  const openChromeModelManager = useCallback(async (): Promise<void> => {
    callbacks.invalidateActiveWork();
    invalidatePreparation();
    providers['on-device'].dispose();
    setUsage(undefined);
    setModelManagerError(false);
    try {
      if (typeof chrome === 'undefined' || !chrome.tabs?.create) {
        throw new Error('Chrome tabs API unavailable');
      }
      await chrome.tabs.create({ url: CHROME_MODEL_MANAGER_URL });
      callbacks.setStatus(translate(locale, 'modelManagerOpened'));
      callbacks.setVisibleNotice(translate(locale, 'modelManagerOpened'));
    } catch {
      setModelManagerError(true);
      callbacks.setStatus(translate(locale, 'modelManagerOpenError'));
      callbacks.setVisibleNotice(translate(locale, 'modelManagerOpenError'));
    }
  }, [callbacks, invalidatePreparation, locale, providers]);

  const reconcileAfterFailure = useCallback(
    async (signal: AbortSignal): Promise<void> => {
      providers['on-device'].dispose();
      setUsage(undefined);
      if (signal.aborted) return;
      await refreshCapabilities({ force: true, preserveGeneration: true });
    },
    [providers, refreshCapabilities],
  );

  const resetForContextChange = useCallback((): void => {
    invalidateCapabilityCheck();
    invalidatePreparation();
    providers['on-device'].dispose();
    setUsage(undefined);
  }, [invalidateCapabilityCheck, invalidatePreparation, providers]);

  const closePanels = useCallback((): void => {
    setModelRemovalOpen(false);
    setModelManagerError(false);
  }, []);

  return {
    state,
    usage,
    setUsage,
    modelRemovalOpen,
    modelManagerError,
    removeModelButtonRef,
    modelRemovalFirstRef,
    refreshCapabilities,
    prepare,
    cancelPreparation,
    releaseSession,
    openModelRemoval,
    closeModelRemoval,
    openChromeModelManager,
    reconcileAfterFailure,
    resetForContextChange,
    closePanels,
  };
}
