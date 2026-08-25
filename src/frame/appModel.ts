import { translate, type CopyKey } from '../shared/i18n';
import type {
  CandidateQuery,
  EvidenceKind,
  Locale,
  ProviderCapabilities,
  RecommendationType,
} from '../shared/types';
import type { LocalAiState, ThemeChoice } from './appTypes';

export const CHROME_MODEL_MANAGER_URL = 'chrome://on-device-internals';

export const THEME_OPTIONS: Array<{
  id: ThemeChoice;
  nameKey: CopyKey;
  descriptionKey: CopyKey;
}> = [
  {
    id: 'aurora',
    nameKey: 'themeAurora',
    descriptionKey: 'themeAuroraDescription',
  },
  {
    id: 'pulse',
    nameKey: 'themePulse',
    descriptionKey: 'themePulseDescription',
  },
  {
    id: 'nightwave',
    nameKey: 'themeNightwave',
    descriptionKey: 'themeNightwaveDescription',
  },
];

export function stateFromCapabilities(
  capabilities: ProviderCapabilities,
): LocalAiState {
  if (capabilities.text === 'unavailable') {
    return { phase: 'unavailable', capabilities };
  }
  if (capabilities.text === 'downloading') {
    return {
      phase: 'download-in-progress',
      capabilities,
      cancellable: false,
    };
  }
  if (capabilities.text === 'downloadable') {
    return { phase: 'downloadable', capabilities };
  }
  return capabilities.audio === 'available'
    ? { phase: 'ready-text-audio', capabilities }
    : { phase: 'ready-text', capabilities };
}

export function isReadyLocalAiState(state: LocalAiState): boolean {
  return state.phase === 'ready-text' || state.phase === 'ready-text-audio';
}

export function localAiStatusText(locale: Locale, state: LocalAiState): string {
  if (state.phase === 'checking') return translate(locale, 'checkingModel');
  if (state.phase === 'downloadable') {
    return translate(locale, 'modelDownloadRequired');
  }
  if (state.phase === 'download-in-progress') {
    return state.progress === undefined
      ? translate(locale, 'modelDownloadDetected')
      : translate(locale, 'modelDownload', { progress: state.progress });
  }
  if (state.phase === 'ready-text') {
    return translate(locale, 'modelReadyText');
  }
  if (state.phase === 'ready-text-audio') {
    return translate(locale, 'modelReady');
  }
  if (state.phase === 'unavailable') {
    return translate(locale, 'modelUnavailable');
  }
  return translate(locale, 'modelError');
}

export function microphoneErrorKey(error: unknown): CopyKey {
  const name =
    typeof error === 'object' && error && 'name' in error
      ? String(error.name)
      : '';
  if (name === 'NotAllowedError' || name === 'SecurityError') {
    return 'voicePermissionDenied';
  }
  if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
    return 'voiceNoDevice';
  }
  if (name === 'NotReadableError' || name === 'TrackStartError') {
    return 'voiceBusy';
  }
  return 'voiceModelError';
}

export function evidenceLabel(locale: Locale, kind: EvidenceKind): string {
  if (kind === 'spotify-supported') {
    return translate(locale, 'spotifySupported');
  }
  if (kind === 'ai-suggested') return translate(locale, 'aiSuggested');
  return translate(locale, 'keywordBased');
}

export function recommendationTypeLabel(
  locale: Locale,
  type: RecommendationType | 'search',
): string {
  const labels: Record<
    RecommendationType | 'search',
    Record<Locale, string>
  > = {
    artist: { en: 'Artist', es: 'Artista' },
    track: { en: 'Track', es: 'Canción' },
    album: { en: 'Album', es: 'Álbum' },
    playlist: { en: 'Playlist', es: 'Playlist' },
    genre: { en: 'Genre', es: 'Género' },
    search: { en: 'Exploratory route', es: 'Ruta exploratoria' },
  };
  return labels[type][locale];
}

export type CandidateRoute = {
  id: string;
  title: string;
  rationale: string;
  candidates: CandidateQuery[];
};

export function groupCandidates(
  candidates: CandidateQuery[],
): CandidateRoute[] {
  const groups = new Map<string, CandidateRoute>();
  for (const candidate of candidates) {
    const existing = groups.get(candidate.routeId);
    if (existing) {
      existing.candidates.push(candidate);
    } else {
      groups.set(candidate.routeId, {
        id: candidate.routeId,
        title: candidate.routeTitle,
        rationale: candidate.routeRationale,
        candidates: [candidate],
      });
    }
  }
  return [...groups.values()];
}
