export type Locale = 'en' | 'es';

export type TargetType =
  'artist' | 'track' | 'album' | 'playlist' | 'genre' | 'mixed';

export type RecommendationType = Exclude<TargetType, 'mixed'>;

export type EvidenceKind =
  'spotify-supported' | 'keyword-based' | 'ai-suggested';

export type TraitOperator = 'AND' | 'OR';

export type TraitCategory =
  | 'instrument'
  | 'ensemble'
  | 'melodic-function'
  | 'harmony'
  | 'rhythm'
  | 'vocal-style'
  | 'tuning'
  | 'tone'
  | 'tempo'
  | 'meter'
  | 'mood'
  | 'era'
  | 'region'
  | 'language'
  | 'texture'
  | 'dynamics'
  | 'production';

export interface NativeSpotifyFilters {
  artist?: string;
  album?: string;
  track?: string;
  genre?: string;
  year?: string;
  label?: string;
  tag?: 'new';
}

export interface TraitGroup {
  category: TraitCategory;
  values: string[];
  operator: TraitOperator;
  evidence: Exclude<EvidenceKind, 'spotify-supported'>;
}

export interface Clarification {
  id: 'frequency-meaning';
  frequency: number;
  options: Array<'tuning' | 'tone'>;
}

export interface RecommendationExample {
  type: RecommendationType;
  name: string;
  artist?: string;
}

export interface MusicRecommendation {
  type: RecommendationType;
  name: string;
  artist?: string;
  explanation: string;
  evidence: Exclude<EvidenceKind, 'spotify-supported'>;
  examples: RecommendationExample[];
}

export interface DiscoveryRoute {
  title: string;
  rationale: string;
  queryTerms: string[];
  recommendations: MusicRecommendation[];
}

export interface DiscoveryIntent {
  target: TargetType;
  locale: Locale;
  mode: 'ai' | 'guided';
  interpretation: string;
  nativeFilters: NativeSpotifyFilters;
  freeTextTerms: string[];
  traitGroups: TraitGroup[];
  routes: DiscoveryRoute[];
  clarification?: Clarification;
}

export interface EvidenceItem {
  kind: EvidenceKind;
  label: string;
}

export interface CandidateQuery {
  id: string;
  routeId: string;
  routeTitle: string;
  routeRationale: string;
  entityType: RecommendationType | 'search';
  title: string;
  query: string;
  explanation: string;
  evidence: EvidenceItem[];
  exploratory: boolean;
  examples: CandidateExample[];
}

export interface CandidateExample {
  id: string;
  entityType: RecommendationType;
  title: string;
  query: string;
}

export interface ProviderUsage {
  providerName: string;
  contextUsage?: number;
  contextWindow?: number;
}

export type ProviderAvailability =
  'available' | 'downloadable' | 'downloading' | 'unavailable';

export interface ProviderCapabilities {
  text: ProviderAvailability;
  audio: ProviderAvailability;
}

export interface PrepareOptions {
  locale: Locale;
  signal?: AbortSignal;
  onDownloadProgress?: (progress: number) => void;
}

export interface ParseOptions {
  locale: Locale;
  selectedTraits: TraitGroup[];
  signal?: AbortSignal;
  onDownloadProgress?: (progress: number) => void;
}

export interface AudioParseResult {
  transcript: string;
}

export interface IntentProvider {
  readonly id: 'on-device' | 'rules';
  readonly label: string;
  capabilities(locale: Locale): Promise<ProviderCapabilities>;
  prepare(options: PrepareOptions): Promise<ProviderCapabilities>;
  parseText(text: string, options: ParseOptions): Promise<DiscoveryIntent>;
  parseAudio?(audio: Blob, options: ParseOptions): Promise<AudioParseResult>;
  usage(): ProviderUsage;
  dispose(): void;
}

export interface SearchRequestMessage {
  source: 'mdo-frame';
  nonce: string;
  type: 'search';
  query: string;
}

export interface OverlayStateMessage {
  source: 'mdo-frame';
  nonce: string;
  type: 'overlay-state';
  open: boolean;
}

export type FrameToContentMessage = SearchRequestMessage | OverlayStateMessage;

export interface SearchResultMessage {
  source: 'mdo-content';
  nonce: string;
  type: 'search-result';
  method: 'native' | 'route';
}

export interface OverlayStateResultMessage {
  source: 'mdo-content';
  nonce: string;
  type: 'overlay-state-result';
  open: boolean;
}

export type ContentToFrameMessage =
  SearchResultMessage | OverlayStateResultMessage;
