import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { translate } from '../../shared/i18n';
import type { Locale, TraitGroup } from '../../shared/types';
import { microphoneErrorKey } from '../appModel';
import type { ProviderMap, VoiceState } from '../appTypes';

type VoiceCallbacks = {
  beforeStart: () => void;
  applyTranscript: (transcript: string) => void;
  reconcileLocalAiAfterFailure: (signal: AbortSignal) => Promise<void>;
  setUsage: () => void;
  setStatus: (status: string) => void;
  setVisibleNotice: (notice: string) => void;
};

export function useVoiceCapture({
  locale,
  providers,
  selectedTraitsRef,
  canUseMicrophone,
  inputRef,
  callbacks,
}: {
  locale: Locale;
  providers: ProviderMap;
  selectedTraitsRef: RefObject<TraitGroup[]>;
  canUseMicrophone: boolean;
  inputRef: RefObject<HTMLTextAreaElement | null>;
  callbacks: VoiceCallbacks;
}) {
  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const [microphoneConsented, setMicrophoneConsented] = useState(false);
  const [state, setState] = useState<VoiceState>('idle');
  const stateRef = useRef<VoiceState>('idle');
  const disclosureRef = useRef<HTMLElement>(null);
  const consentAllowRef = useRef<HTMLButtonElement>(null);
  const microphoneButtonRef = useRef<HTMLButtonElement>(null);
  const recorderRef = useRef<MediaRecorder | undefined>(undefined);
  const mediaStreamRef = useRef<MediaStream | undefined>(undefined);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<number | undefined>(undefined);
  const audioAbortRef = useRef<AbortController | undefined>(undefined);
  const operationIdRef = useRef(0);

  const updateState = useCallback((nextState: VoiceState): void => {
    stateRef.current = nextState;
    setState(nextState);
  }, []);

  const cleanupResources = useCallback(
    ({ stopRecorder = true }: { stopRecorder?: boolean } = {}): void => {
      window.clearTimeout(recordingTimerRef.current);
      recordingTimerRef.current = undefined;
      const recorder = recorderRef.current;
      recorderRef.current = undefined;
      if (recorder) {
        recorder.ondataavailable = null;
        recorder.onstop = null;
        recorder.onerror = null;
        if (stopRecorder && recorder.state !== 'inactive') recorder.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = undefined;
      audioChunksRef.current = [];
    },
    [],
  );

  const cancel = useCallback((): void => {
    const hadActiveVoiceOperation = stateRef.current !== 'idle';
    operationIdRef.current += 1;
    audioAbortRef.current?.abort();
    audioAbortRef.current = undefined;
    cleanupResources();
    updateState('idle');
    setDisclosureOpen(false);
    if (hadActiveVoiceOperation) {
      callbacks.setStatus('');
      callbacks.setVisibleNotice('');
    }
  }, [callbacks, cleanupResources, updateState]);

  useEffect(
    () => () => {
      operationIdRef.current += 1;
      audioAbortRef.current?.abort();
      cleanupResources();
    },
    [cleanupResources],
  );

  const processRecordedAudio = useCallback(
    async (audio: Blob, operationId: number): Promise<void> => {
      if (operationId !== operationIdRef.current) return;
      const controller = new AbortController();
      audioAbortRef.current = controller;
      updateState('processing');
      callbacks.setStatus(translate(locale, 'processingVoice'));
      callbacks.setVisibleNotice(translate(locale, 'processingVoice'));
      try {
        const parseAudio = providers['on-device'].parseAudio;
        if (!parseAudio) throw new Error('Audio unavailable');
        const result = await parseAudio.call(providers['on-device'], audio, {
          locale,
          selectedTraits: selectedTraitsRef.current,
          signal: controller.signal,
        });
        if (
          controller.signal.aborted ||
          operationId !== operationIdRef.current
        ) {
          return;
        }
        callbacks.applyTranscript(result.transcript);
        callbacks.setUsage();
        callbacks.setStatus(translate(locale, 'voiceDraftReady'));
        callbacks.setVisibleNotice(translate(locale, 'voiceDraftReady'));
      } catch (error) {
        if (
          controller.signal.aborted ||
          operationId !== operationIdRef.current
        ) {
          return;
        }
        const name =
          typeof error === 'object' && error && 'name' in error
            ? String(error.name)
            : '';
        if (name === 'NoSpeechError') {
          callbacks.setStatus(translate(locale, 'voiceNoSpeech'));
          callbacks.setVisibleNotice(translate(locale, 'voiceNoSpeech'));
        } else if (name !== 'AbortError') {
          await callbacks.reconcileLocalAiAfterFailure(controller.signal);
          if (
            controller.signal.aborted ||
            operationId !== operationIdRef.current
          ) {
            return;
          }
          callbacks.setStatus(translate(locale, 'voiceModelError'));
          callbacks.setVisibleNotice(translate(locale, 'voiceModelError'));
        }
      } finally {
        if (operationId === operationIdRef.current) {
          if (audioAbortRef.current === controller) {
            audioAbortRef.current = undefined;
          }
          updateState('idle');
          inputRef.current?.focus();
        }
      }
    },
    [callbacks, inputRef, locale, providers, selectedTraitsRef, updateState],
  );

  const stop = useCallback((): void => {
    window.clearTimeout(recordingTimerRef.current);
    recordingTimerRef.current = undefined;
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === 'inactive') return;
    updateState('processing');
    recorder.stop();
  }, [updateState]);

  const startRecorder = useCallback(async (): Promise<void> => {
    if (stateRef.current !== 'idle') return;
    if (
      !canUseMicrophone ||
      !providers['on-device'].parseAudio ||
      !navigator.mediaDevices?.getUserMedia ||
      typeof MediaRecorder === 'undefined'
    ) {
      const message = translate(locale, 'voiceAudioUnsupported');
      callbacks.setStatus(message);
      callbacks.setVisibleNotice(message);
      return;
    }
    callbacks.beforeStart();
    cancel();
    const operationId = operationIdRef.current + 1;
    operationIdRef.current = operationId;
    updateState('requesting');
    callbacks.setStatus(translate(locale, 'requestingMicrophone'));
    callbacks.setVisibleNotice(translate(locale, 'requestingMicrophone'));
    let requestedStream: MediaStream | undefined;
    try {
      requestedStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      if (operationId !== operationIdRef.current) {
        requestedStream.getTracks().forEach((track) => track.stop());
        return;
      }
      mediaStreamRef.current = requestedStream;
      audioChunksRef.current = [];
      const recorder = new MediaRecorder(requestedStream, {
        audioBitsPerSecond: 64_000,
      });
      recorder.ondataavailable = (event) => {
        if (
          operationId === operationIdRef.current &&
          recorderRef.current === recorder &&
          event.data.size > 0
        ) {
          audioChunksRef.current.push(event.data);
        }
      };
      recorder.onstop = () => {
        if (
          operationId !== operationIdRef.current ||
          recorderRef.current !== recorder
        ) {
          return;
        }
        const audio = new Blob(audioChunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        cleanupResources({ stopRecorder: false });
        void processRecordedAudio(audio, operationId);
      };
      recorder.onerror = (event) => {
        if (operationId !== operationIdRef.current) return;
        operationIdRef.current += 1;
        cleanupResources();
        updateState('idle');
        const error = event instanceof ErrorEvent ? event.error : event;
        const message = translate(locale, microphoneErrorKey(error));
        callbacks.setStatus(message);
        callbacks.setVisibleNotice(message);
        inputRef.current?.focus();
      };
      recorderRef.current = recorder;
      recorder.start();
      updateState('recording');
      callbacks.setStatus(translate(locale, 'recordingLimit'));
      callbacks.setVisibleNotice(translate(locale, 'recordingLimit'));
      window.setTimeout(() => microphoneButtonRef.current?.focus(), 0);
      recordingTimerRef.current = window.setTimeout(() => {
        if (
          operationId === operationIdRef.current &&
          recorderRef.current === recorder &&
          recorder.state !== 'inactive'
        ) {
          updateState('processing');
          recorder.stop();
        }
      }, 30_000);
    } catch (error) {
      if (operationId !== operationIdRef.current) {
        requestedStream?.getTracks().forEach((track) => track.stop());
        return;
      }
      operationIdRef.current += 1;
      cleanupResources();
      updateState('idle');
      const message = translate(locale, microphoneErrorKey(error));
      callbacks.setStatus(message);
      callbacks.setVisibleNotice(message);
      inputRef.current?.focus();
    }
  }, [
    callbacks,
    canUseMicrophone,
    cancel,
    cleanupResources,
    inputRef,
    locale,
    processRecordedAudio,
    providers,
    updateState,
  ]);

  const request = useCallback((): void => {
    if (stateRef.current !== 'idle') return;
    if (microphoneConsented) {
      void startRecorder();
      return;
    }
    setDisclosureOpen(true);
    window.setTimeout(() => consentAllowRef.current?.focus(), 0);
  }, [microphoneConsented, startRecorder]);

  const allowAndStart = useCallback((): void => {
    setMicrophoneConsented(true);
    setDisclosureOpen(false);
    window.setTimeout(() => inputRef.current?.focus(), 0);
    void startRecorder();
  }, [inputRef, startRecorder]);

  const closeDisclosure = useCallback((): void => {
    setDisclosureOpen(false);
    microphoneButtonRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!disclosureOpen) return;
    const trapFocus = (event: KeyboardEvent): void => {
      if (event.key !== 'Tab') return;
      const focusable = disclosureRef.current?.querySelectorAll<HTMLElement>(
        'button:not(:disabled), [href], select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (!disclosureRef.current?.contains(document.activeElement)) {
        event.preventDefault();
        first.focus();
      } else if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', trapFocus);
    return () => window.removeEventListener('keydown', trapFocus);
  }, [disclosureOpen]);

  return {
    state,
    stateRef,
    disclosureOpen,
    disclosureRef,
    consentAllowRef,
    microphoneButtonRef,
    cancel,
    request,
    allowAndStart,
    closeDisclosure,
    stop,
  };
}
