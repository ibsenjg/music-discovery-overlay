import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { translate } from '../../shared/i18n';
import {
  compileCandidateQueries,
  resolveFrequencyClarification,
} from '../../shared/intent';
import { ALL_CHIPS, chipToTraitGroup } from '../../shared/ontology';
import type {
  CandidateQuery,
  DiscoveryIntent,
  Locale,
  TraitGroup,
} from '../../shared/types';
import type {
  ProviderChoice,
  ProviderMap,
  UndoSnapshot,
  VoiceState,
} from '../appTypes';

type DiscoveryCallbacks = {
  reconcileLocalAiAfterFailure: (signal: AbortSignal) => Promise<void>;
  setUsageFromProvider: (providerChoice: ProviderChoice) => void;
  setStatus: (status: string) => void;
  setVisibleNotice: (notice: string) => void;
};

export function useDiscoverySession({
  locale,
  providerChoice,
  providers,
  voiceState,
  canGenerate,
  status,
  visibleNotice,
  callbacks,
}: {
  locale: Locale;
  providerChoice: ProviderChoice;
  providers: ProviderMap;
  voiceState: VoiceState;
  canGenerate: boolean;
  status: string;
  visibleNotice: string;
  callbacks: DiscoveryCallbacks;
}) {
  const [input, setInput] = useState('');
  const [selectedChipIds, setSelectedChipIds] = useState<string[]>([]);
  const [intent, setIntent] = useState<DiscoveryIntent>();
  const [candidates, setCandidates] = useState<CandidateQuery[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastGenerationUsedRules, setLastGenerationUsedRules] = useState(false);
  const [localAiGenerationError, setLocalAiGenerationError] = useState(false);
  const [undoSnapshot, setUndoSnapshot] = useState<UndoSnapshot>();
  const abortRef = useRef<AbortController | undefined>(undefined);
  const generationRequestIdRef = useRef(0);

  const selectedTraits = useMemo<TraitGroup[]>(
    () =>
      selectedChipIds
        .map((id) => ALL_CHIPS.find((chip) => chip.id === id))
        .filter((chip) => chip !== undefined)
        .map(chipToTraitGroup),
    [selectedChipIds],
  );
  const hasDiscoveryRequest = Boolean(
    input.trim() || selectedTraits.length > 0,
  );
  const submissionReady =
    hasDiscoveryRequest && !loading && voiceState === 'idle';
  const canSubmit = canGenerate && submissionReady;

  const cancel = useCallback((): void => {
    generationRequestIdRef.current += 1;
    abortRef.current?.abort();
    abortRef.current = undefined;
    setLoading(false);
    setIntent(undefined);
    setCandidates([]);
    setLastGenerationUsedRules(false);
    setLocalAiGenerationError(false);
    callbacks.setStatus('');
    callbacks.setVisibleNotice('');
  }, [callbacks]);

  useEffect(
    () => () => {
      generationRequestIdRef.current += 1;
      abortRef.current?.abort();
      providers.rules.dispose();
    },
    [providers],
  );

  const analyze = useCallback(
    async (providerOverride?: ProviderChoice): Promise<void> => {
      const activeProviderChoice = providerOverride ?? providerChoice;
      if (!hasDiscoveryRequest) {
        callbacks.setStatus(translate(locale, 'empty'));
        callbacks.setVisibleNotice(translate(locale, 'empty'));
        return;
      }
      if (!submissionReady) return;
      if (activeProviderChoice === 'on-device' && !canGenerate) return;

      const requestId = generationRequestIdRef.current + 1;
      generationRequestIdRef.current = requestId;
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      setIntent(undefined);
      setCandidates([]);
      setLoading(true);
      setLastGenerationUsedRules(false);
      setLocalAiGenerationError(false);
      callbacks.setVisibleNotice('');
      callbacks.setStatus(translate(locale, 'analyzing'));
      try {
        const provider = providers[activeProviderChoice];
        let parsed: DiscoveryIntent;
        try {
          parsed = await provider.parseText(input, {
            locale,
            selectedTraits,
            signal: controller.signal,
          });
        } catch (error) {
          if (
            controller.signal.aborted ||
            requestId !== generationRequestIdRef.current
          ) {
            return;
          }
          if (activeProviderChoice !== 'on-device') throw error;
          setIntent(undefined);
          setCandidates([]);
          await callbacks.reconcileLocalAiAfterFailure(controller.signal);
          if (
            controller.signal.aborted ||
            requestId !== generationRequestIdRef.current
          ) {
            return;
          }
          setLocalAiGenerationError(true);
          callbacks.setStatus(translate(locale, 'localAiGenerationError'));
          callbacks.setVisibleNotice(
            translate(locale, 'localAiGenerationError'),
          );
          return;
        }
        if (
          controller.signal.aborted ||
          requestId !== generationRequestIdRef.current
        ) {
          return;
        }
        const nextCandidates = parsed.clarification
          ? []
          : compileCandidateQueries(parsed);
        if (
          activeProviderChoice === 'on-device' &&
          !parsed.clarification &&
          nextCandidates.length === 0
        ) {
          setIntent(undefined);
          setCandidates([]);
          await callbacks.reconcileLocalAiAfterFailure(controller.signal);
          if (
            controller.signal.aborted ||
            requestId !== generationRequestIdRef.current
          ) {
            return;
          }
          setLocalAiGenerationError(true);
          callbacks.setStatus(translate(locale, 'localAiGenerationError'));
          callbacks.setVisibleNotice(
            translate(locale, 'localAiGenerationError'),
          );
          return;
        }
        setIntent(parsed);
        setCandidates(nextCandidates);
        callbacks.setUsageFromProvider(activeProviderChoice);
        setLastGenerationUsedRules(activeProviderChoice === 'rules');
        callbacks.setStatus(
          parsed.clarification
            ? translate(locale, 'clarificationTitle', {
                frequency: parsed.clarification.frequency,
              })
            : translate(locale, 'ready'),
        );
      } catch (error) {
        if (
          controller.signal.aborted ||
          requestId !== generationRequestIdRef.current
        ) {
          return;
        }
        const name =
          typeof error === 'object' && error && 'name' in error
            ? String(error.name)
            : '';
        if (name !== 'AbortError') {
          callbacks.setStatus(translate(locale, 'error'));
          callbacks.setVisibleNotice(translate(locale, 'error'));
        }
      } finally {
        if (requestId === generationRequestIdRef.current) {
          setLoading(false);
          if (abortRef.current === controller) abortRef.current = undefined;
        }
      }
    },
    [
      callbacks,
      canGenerate,
      hasDiscoveryRequest,
      input,
      locale,
      providerChoice,
      providers,
      selectedTraits,
      submissionReady,
    ],
  );

  const resolveClarification = useCallback(
    (choice: 'tuning' | 'tone'): void => {
      if (!intent) return;
      const resolved = resolveFrequencyClarification(intent, choice);
      setIntent(resolved);
      setCandidates(compileCandidateQueries(resolved));
      callbacks.setStatus(translate(locale, 'ready'));
    },
    [callbacks, intent, locale],
  );

  const toggleChip = useCallback(
    (id: string): void => {
      cancel();
      setSelectedChipIds((current) =>
        current.includes(id)
          ? current.filter((item) => item !== id)
          : [...current, id],
      );
    },
    [cancel],
  );

  const editInput = useCallback(
    (value: string): void => {
      cancel();
      setInput(value);
    },
    [cancel],
  );

  const applyTranscript = useCallback((transcript: string): void => {
    setInput(transcript);
    setIntent(undefined);
    setCandidates([]);
  }, []);

  const clearAll = useCallback((): void => {
    const preserveCompletedFeedback = !loading && voiceState === 'idle';
    setUndoSnapshot({
      input,
      selectedChipIds,
      intent,
      candidates,
      status: preserveCompletedFeedback ? status : '',
      visibleNotice: preserveCompletedFeedback ? visibleNotice : '',
      lastGenerationUsedRules,
      localAiGenerationError,
    });
    cancel();
    setInput('');
    setSelectedChipIds([]);
  }, [
    cancel,
    candidates,
    input,
    intent,
    lastGenerationUsedRules,
    loading,
    localAiGenerationError,
    selectedChipIds,
    status,
    visibleNotice,
    voiceState,
  ]);

  const undoClear = useCallback((): void => {
    if (!undoSnapshot) return;
    cancel();
    setInput(undoSnapshot.input);
    setSelectedChipIds(undoSnapshot.selectedChipIds);
    setIntent(undoSnapshot.intent);
    setCandidates(undoSnapshot.candidates);
    callbacks.setStatus(undoSnapshot.status);
    callbacks.setVisibleNotice(undoSnapshot.visibleNotice);
    setLastGenerationUsedRules(undoSnapshot.lastGenerationUsedRules);
    setLocalAiGenerationError(undoSnapshot.localAiGenerationError);
    setUndoSnapshot(undefined);
  }, [callbacks, cancel, undoSnapshot]);

  return {
    input,
    selectedChipIds,
    selectedTraits,
    intent,
    candidates,
    loading,
    lastGenerationUsedRules,
    localAiGenerationError,
    canSubmit,
    hasDiscoveryRequest,
    undoSnapshot,
    setLocalAiGenerationError,
    cancel,
    analyze,
    resolveClarification,
    toggleChip,
    editInput,
    applyTranscript,
    clearAll,
    undoClear,
  };
}
