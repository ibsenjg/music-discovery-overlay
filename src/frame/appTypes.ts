import type {
  CandidateQuery,
  DiscoveryIntent,
  IntentProvider,
  ProviderCapabilities,
} from '../shared/types';

export type ProviderChoice = 'on-device' | 'rules';
export type ThemeChoice = 'aurora' | 'pulse' | 'nightwave';
export type VoiceState = 'idle' | 'requesting' | 'recording' | 'processing';

export type LocalAiState =
  | { phase: 'checking'; capabilities: ProviderCapabilities }
  | { phase: 'downloadable'; capabilities: ProviderCapabilities }
  | {
      phase: 'download-in-progress';
      capabilities: ProviderCapabilities;
      progress?: number;
      cancellable: boolean;
    }
  | { phase: 'ready-text'; capabilities: ProviderCapabilities }
  | { phase: 'ready-text-audio'; capabilities: ProviderCapabilities }
  | { phase: 'unavailable'; capabilities: ProviderCapabilities }
  | { phase: 'error'; capabilities: ProviderCapabilities };

export type UndoSnapshot = {
  input: string;
  selectedChipIds: string[];
  intent?: DiscoveryIntent;
  candidates: CandidateQuery[];
  status: string;
  visibleNotice: string;
  lastGenerationUsedRules: boolean;
  localAiGenerationError: boolean;
};

export type ProviderMap = {
  'on-device': IntentProvider;
  rules: IntentProvider;
};

export type ActivePreparation = {
  id: number;
  controller: AbortController;
};
