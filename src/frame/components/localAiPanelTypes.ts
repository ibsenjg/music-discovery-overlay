import type { Locale } from '../../shared/types';
import type { LocalAiState, ProviderChoice } from '../appTypes';

export type LocalAiPanelModel = {
  locale: Locale;
  providerChoice: ProviderChoice;
  state: LocalAiState;
  canGenerate: boolean;
  lastGenerationUsedRules: boolean;
  generationError: boolean;
  modelRemovalOpen: boolean;
  modelManagerError: boolean;
};

export type LocalAiPanelActions = {
  prepare: () => void;
  cancelPreparation: () => void;
  useRules: () => void;
  selectRules: () => void;
  retryCapabilities: () => void;
  openModelManager: () => void;
  retryLocalAi: () => void;
  releaseSession: () => void;
  openModelRemoval: () => void;
  closeModelRemoval: () => void;
};
