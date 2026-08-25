import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import { ChromeOnDeviceProvider } from '../providers/chromeOnDeviceProvider';
import { RulesProvider } from '../providers/rulesProvider';
import { translate } from '../shared/i18n';
import type { Locale, TraitGroup } from '../shared/types';
import type { ProviderChoice, ProviderMap, ThemeChoice } from './appTypes';
import { StatusAnnouncer } from './components/AppPrimitives';
import { Composer } from './components/Composer';
import { DiscoveryFilters } from './components/DiscoveryFilters';
import { DiscoveryResults } from './components/DiscoveryResults';
import { DrawerHeader } from './components/DrawerHeader';
import { Launcher } from './components/Launcher';
import { LocalAiStatePanel } from './components/LocalAiStatePanel';
import type {
  LocalAiPanelActions,
  LocalAiPanelModel,
} from './components/localAiPanelTypes';
import { SettingsPopover } from './components/SettingsPopover';
import { VoiceDisclosureDialog } from './components/VoiceDisclosureDialog';
import { useDiscoverySession } from './hooks/useDiscoverySession';
import { useLocalAiLifecycle } from './hooks/useLocalAiLifecycle';
import { useOverlayShell } from './hooks/useOverlayShell';
import { useVoiceCapture } from './hooks/useVoiceCapture';
import { Drawer, DrawerScroll, VisibleNotice } from './App.styles';
import { GlobalStyle } from './styles/GlobalStyle';
import { appThemes } from './styles/theme';

const DEFAULT_PROVIDERS: ProviderMap = {
  'on-device': new ChromeOnDeviceProvider(),
  rules: new RulesProvider(),
};

export function App({
  providers = DEFAULT_PROVIDERS,
}: {
  providers?: ProviderMap;
}) {
  const [locale, setLocale] = useState<Locale>(() =>
    navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en',
  );
  const [theme, setTheme] = useState<ThemeChoice>('aurora');
  const [providerChoice, setProviderChoice] =
    useState<ProviderChoice>('on-device');
  const [status, setStatus] = useState('');
  const [visibleNotice, setVisibleNotice] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const settingsFirstRef = useRef<HTMLSelectElement>(null);
  const selectedTraitsRef = useRef<TraitGroup[]>([]);
  const cancelVoiceRef = useRef<() => void>(() => undefined);
  const cancelDiscoveryRef = useRef<() => void>(() => undefined);
  const applyTranscriptRef = useRef<(transcript: string) => void>(
    () => undefined,
  );
  const setGenerationErrorRef = useRef<(error: boolean) => void>(
    () => undefined,
  );

  const invalidateActiveWork = useCallback((): void => {
    cancelDiscoveryRef.current();
    cancelVoiceRef.current();
  }, []);

  const localAiCallbacks = useMemo(
    () => ({
      cancelVoice: () => cancelVoiceRef.current(),
      invalidateActiveWork,
      setStatus,
      setVisibleNotice,
      setGenerationError: (error: boolean) =>
        setGenerationErrorRef.current(error),
    }),
    [invalidateActiveWork],
  );
  const localAi = useLocalAiLifecycle({
    locale,
    providerChoice,
    providers,
    callbacks: localAiCallbacks,
    modelRemovalFallbackRef: settingsFirstRef,
  });
  const canGenerate =
    providerChoice === 'rules' ||
    localAi.state.phase === 'ready-text' ||
    localAi.state.phase === 'ready-text-audio';
  const canUseMicrophone =
    providerChoice === 'on-device' &&
    localAi.state.phase === 'ready-text-audio';

  const voiceCallbacks = useMemo(
    () => ({
      beforeStart: () => cancelDiscoveryRef.current(),
      applyTranscript: (transcript: string) =>
        applyTranscriptRef.current(transcript),
      reconcileLocalAiAfterFailure: localAi.reconcileAfterFailure,
      setUsage: () => localAi.setUsage(providers['on-device'].usage()),
      setStatus,
      setVisibleNotice,
    }),
    [localAi.reconcileAfterFailure, localAi.setUsage, providers],
  );
  const voice = useVoiceCapture({
    locale,
    providers,
    selectedTraitsRef,
    canUseMicrophone,
    inputRef,
    callbacks: voiceCallbacks,
  });

  const discoveryCallbacks = useMemo(
    () => ({
      reconcileLocalAiAfterFailure: localAi.reconcileAfterFailure,
      setUsageFromProvider: (choice: ProviderChoice) =>
        localAi.setUsage(providers[choice].usage()),
      setStatus,
      setVisibleNotice,
    }),
    [localAi.reconcileAfterFailure, localAi.setUsage, providers],
  );
  const discovery = useDiscoverySession({
    locale,
    providerChoice,
    providers,
    voiceState: voice.state,
    canGenerate,
    status,
    visibleNotice,
    callbacks: discoveryCallbacks,
  });

  cancelVoiceRef.current = voice.cancel;
  cancelDiscoveryRef.current = discovery.cancel;
  applyTranscriptRef.current = discovery.applyTranscript;
  setGenerationErrorRef.current = discovery.setLocalAiGenerationError;
  useEffect(() => {
    selectedTraitsRef.current = discovery.selectedTraits;
  }, [discovery.selectedTraits]);

  const shellCallbacks = useMemo(
    () => ({
      cancelVoice: voice.cancel,
      closeVoiceDisclosure: voice.closeDisclosure,
      closeModelRemoval: localAi.closeModelRemoval,
      closeModelPanels: localAi.closePanels,
      refreshCapabilities: () => void localAi.refreshCapabilities(),
      setStatus,
    }),
    [
      localAi.closeModelRemoval,
      localAi.closePanels,
      localAi.refreshCapabilities,
      voice.cancel,
      voice.closeDisclosure,
    ],
  );
  const shell = useOverlayShell({
    locale,
    theme,
    providerChoice,
    input: discovery.input,
    candidateCount: discovery.candidates.length,
    voiceStateRef: voice.stateRef,
    voiceDisclosureOpen: voice.disclosureOpen,
    modelRemovalOpen: localAi.modelRemovalOpen,
    inputRef,
    settingsFirstRef,
    callbacks: shellCallbacks,
  });

  const changeLocale = useCallback(
    (nextLocale: Locale): void => {
      if (nextLocale === locale) return;
      localAi.resetForContextChange();
      invalidateActiveWork();
      setLocale(nextLocale);
      if (providerChoice === 'rules') {
        setStatus(translate(nextLocale, 'rulesReady'));
      }
    },
    [invalidateActiveWork, localAi, locale, providerChoice],
  );

  const changeProvider = useCallback(
    (nextProvider: ProviderChoice): void => {
      if (nextProvider === providerChoice) return;
      localAi.resetForContextChange();
      invalidateActiveWork();
      if (nextProvider === 'rules') {
        setStatus(translate(locale, 'rulesReady'));
      }
      setProviderChoice(nextProvider);
      localAi.closePanels();
    },
    [invalidateActiveWork, localAi, locale, providerChoice],
  );

  const localAiModel: LocalAiPanelModel = {
    locale,
    providerChoice,
    state: localAi.state,
    canGenerate,
    lastGenerationUsedRules: discovery.lastGenerationUsedRules,
    generationError: discovery.localAiGenerationError,
    modelRemovalOpen: localAi.modelRemovalOpen,
    modelManagerError: localAi.modelManagerError,
  };
  const localAiActions = useMemo<LocalAiPanelActions>(
    () => ({
      prepare: () => void localAi.prepare(),
      cancelPreparation: localAi.cancelPreparation,
      useRules: () => void discovery.analyze('rules'),
      selectRules: () => changeProvider('rules'),
      retryCapabilities: () =>
        void localAi.refreshCapabilities({ force: true }),
      openModelManager: () => void localAi.openChromeModelManager(),
      retryLocalAi: () => void discovery.analyze('on-device'),
      releaseSession: () => void localAi.releaseSession(),
      openModelRemoval: localAi.openModelRemoval,
      closeModelRemoval: () => localAi.closeModelRemoval(true),
    }),
    [changeProvider, discovery, localAi],
  );

  const handleInputChange = useCallback(
    (value: string): void => {
      if (voice.stateRef.current !== 'idle') voice.cancel();
      discovery.editInput(value);
    },
    [discovery, voice],
  );
  const handleClearAll = useCallback((): void => {
    discovery.clearAll();
    voice.cancel();
  }, [discovery, voice]);
  const handleUndo = useCallback((): void => {
    voice.cancel();
    discovery.undoClear();
  }, [discovery, voice]);

  const composerLocalAiPanel =
    providerChoice === 'on-device' &&
    !shell.settingsOpen &&
    (localAi.state.phase !== 'ready-text-audio' ||
      discovery.lastGenerationUsedRules ||
      discovery.localAiGenerationError) ? (
      <LocalAiStatePanel
        variant="composer"
        model={localAiModel}
        actions={localAiActions}
        refs={{
          removeModelButton: localAi.removeModelButtonRef,
          modelRemovalFirstAction: localAi.modelRemovalFirstRef,
        }}
      />
    ) : undefined;

  const content = !shell.open ? (
    <Launcher
      locale={locale}
      loading={discovery.loading}
      voiceState={voice.state}
      launcherRef={shell.launcherRef}
      onOpen={() => shell.setOverlayOpen(true)}
    />
  ) : (
    <Drawer aria-labelledby="discovery-title">
      <DrawerHeader
        locale={locale}
        onMinimize={() => shell.setOverlayOpen(false)}
      />
      <DrawerScroll ref={shell.drawerScrollRef}>
        <DiscoveryFilters
          locale={locale}
          selectedChipIds={discovery.selectedChipIds}
          canUndo={Boolean(discovery.undoSnapshot)}
          onToggleChip={discovery.toggleChip}
          onClearAll={handleClearAll}
          onUndo={handleUndo}
        />
        <DiscoveryResults
          locale={locale}
          intent={discovery.intent}
          candidates={discovery.candidates}
          suggestionsRef={shell.suggestionsRef}
          onResolveClarification={discovery.resolveClarification}
          onSearch={shell.submitSearch}
        />
        {visibleNotice && <VisibleNotice>{visibleNotice}</VisibleNotice>}
      </DrawerScroll>

      {shell.settingsOpen && (
        <SettingsPopover
          locale={locale}
          providerChoice={providerChoice}
          theme={theme}
          usage={localAi.usage}
          panelModel={localAiModel}
          panelActions={localAiActions}
          settingsPanelRef={shell.settingsPanelRef}
          settingsFirstRef={settingsFirstRef}
          removeModelButtonRef={localAi.removeModelButtonRef}
          modelRemovalFirstRef={localAi.modelRemovalFirstRef}
          onClose={shell.closeSettings}
          onChangeLocale={changeLocale}
          onChangeProvider={changeProvider}
          onChangeTheme={setTheme}
        />
      )}

      {voice.disclosureOpen && (
        <VoiceDisclosureDialog
          locale={locale}
          dialogRef={voice.disclosureRef}
          allowRef={voice.consentAllowRef}
          onAllow={voice.allowAndStart}
          onCancel={voice.closeDisclosure}
        />
      )}

      <Composer
        locale={locale}
        input={discovery.input}
        loading={discovery.loading}
        voiceState={voice.state}
        canUseMicrophone={canUseMicrophone}
        canGenerate={canGenerate}
        canSubmit={discovery.canSubmit}
        settingsOpen={shell.settingsOpen}
        inputRef={inputRef}
        settingsButtonRef={shell.settingsButtonRef}
        microphoneButtonRef={voice.microphoneButtonRef}
        localAiPanel={composerLocalAiPanel}
        onInputChange={handleInputChange}
        onGenerate={() => void discovery.analyze()}
        onToggleSettings={shell.toggleSettings}
        onRequestVoice={voice.request}
        onStopVoice={voice.stop}
      />
    </Drawer>
  );

  return (
    <ThemeProvider theme={appThemes[theme]}>
      <GlobalStyle />
      {content}
      <StatusAnnouncer status={status} />
    </ThemeProvider>
  );
}
