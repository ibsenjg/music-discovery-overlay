import {
  DISCOVERY_INTENT_SCHEMA,
  validateDiscoveryIntent,
} from '../shared/intent';
import { ONTOLOGY_PROMPT_SUMMARY } from '../shared/ontology';
import type {
  AudioParseResult,
  DiscoveryIntent,
  IntentProvider,
  Locale,
  ParseOptions,
  PrepareOptions,
  ProviderCapabilities,
  ProviderUsage,
} from '../shared/types';

const TRANSCRIPT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['transcript'],
  properties: {
    transcript: { type: 'string' },
  },
} as const;

interface SessionInitialization {
  controller: AbortController;
  promise: Promise<LanguageModelSession>;
  waiters: number;
  settled: boolean;
}

function abortReason(signal: AbortSignal): unknown {
  return (
    signal.reason ?? new DOMException('The operation was aborted', 'AbortError')
  );
}

function textDeclarations() {
  return {
    expectedInputs: [{ type: 'text' as const, languages: ['en', 'es'] }],
    expectedOutputs: [{ type: 'text' as const, languages: ['en', 'es'] }],
  };
}

function audioDeclarations() {
  return {
    expectedInputs: [
      { type: 'text' as const, languages: ['en', 'es'] },
      { type: 'audio' as const },
    ],
    expectedOutputs: [{ type: 'text' as const, languages: ['en', 'es'] }],
  };
}

function systemPrompt(): string {
  return `Act as a concise music curator. Interpret the user's goal before proposing discovery routes.
Return only JSON matching the supplied schema in the locale named by each user task payload. Do not expose hidden reasoning, chain-of-thought, or analysis. The interpretation and rationales must be short, specific conclusions.

Infer target as artist, track, album, playlist, genre, or mixed. Use mixed only when the user did not make the result type explicit.
Create 2 or 3 substantially different routes, never keyword permutations. Across all routes return at most 6 primary recommendations.
If the user asks for artists, make artists primary and use at most 2 tracks as secondary examples for each artist. Apply the same primary-versus-example rule to other explicit target types. For mixed requests, vary the primary entity types when useful.
Each route needs a distinct title, concise rationale, contextual backup queryTerms, and recommendations. Each recommendation needs type, name, optional associated artist, a specific non-repetitive explanation, evidence, and up to 2 secondary examples.
Relate instruments and their melodic, harmonic, or rhythmic functions with ensemble format, style, era, region, production, voice, mood, and listening context. Prefer relevance and variety over quantity.
You may use music knowledge as an exploratory starting point, but never claim that Spotify contains an entity or that Spotify, metadata, or audio analysis verified an instrument, tuning, chord, tone, mood, acoustic property, or relationship.
Mark proposed entities as ai-suggested. If you are not confident enough to name an entity, leave recommendations empty and provide a reasoned, contextual set of queryTerms; never split the request into isolated one-word routes.
Preserve user-requested health, therapeutic, spiritual, wellness, healing, and acoustic concepts in freeTextTerms and route queryTerms when relevant. Treat them only as exploratory requested language: never attribute effects, medical benefit, spiritual truth, therapeutic outcomes, or acoustic certainty.
Use spotify-supported nativeFilters only for artist, album, track, genre, year, label, and tag:new.
Put instruments, ensembles, melodic function, harmony, rhythm, vocal styles, tuning, tones, tempo, meter, mood, era, region, language, texture, dynamics, and production in traitGroups.
Preserve explicit alternatives such as "piano, trumpet, or violin" as one OR group.
When a standalone Hz value is ambiguous between an A4 tuning reference and a prominent tone or title keyword, include clarification with id frequency-meaning and options tuning and tone.

For a request seeking artists who use piano, bass, and melody, do not return piano/bass term variations. Use distinct routes such as a contemporary instrumental trio, piano-led soul/pop, and ambient or neoclassical music; propose different artists with concise fit explanations and optional tracks as secondary examples.

Available ontology examples:
${ONTOLOGY_PROMPT_SUMMARY}`;
}

function userPrompt(text: string, options: ParseOptions): string {
  return JSON.stringify({
    request: text.slice(0, 500),
    selectedTraits: options.selectedTraits,
    locale: options.locale,
  });
}

export function sanitizeTranscript(value: string): string {
  return [...value]
    .filter((character) => {
      const code = character.charCodeAt(0);
      return (
        character !== '<' && character !== '>' && (code >= 32 || code === 10)
      );
    })
    .join('')
    .slice(0, 500);
}

export class ChromeOnDeviceProvider implements IntentProvider {
  readonly id = 'on-device' as const;
  readonly label = 'Chrome on-device AI';
  private textSession?: LanguageModelSession;
  private audioSession?: LanguageModelSession;
  private textInitialization?: SessionInitialization;
  private audioInitialization?: SessionInitialization;
  private readonly taskSessions = new Set<LanguageModelSession>();
  private readonly destroyedSessions = new WeakSet<LanguageModelSession>();
  private sessionGeneration = 0;
  private currentUsage: ProviderUsage = { providerName: this.label };

  async capabilities(locale: Locale): Promise<ProviderCapabilities> {
    void locale;
    if (typeof LanguageModel === 'undefined') {
      return { text: 'unavailable', audio: 'unavailable' };
    }

    const [text, audio] = await Promise.all([
      LanguageModel.availability(textDeclarations()),
      LanguageModel.availability(audioDeclarations()),
    ]);
    return { text, audio };
  }

  async prepare(options: PrepareOptions): Promise<ProviderCapabilities> {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('On-device model unavailable');
    }

    const capabilities = await this.capabilities(options.locale);
    if (capabilities.text === 'unavailable') {
      throw new Error('On-device model unavailable');
    }

    const session = await this.ensureTextBaseline(options, options.signal);
    this.updateUsage(session);
    return this.capabilities(options.locale);
  }

  private updateUsage(session: LanguageModelSession): void {
    this.currentUsage = {
      providerName: this.label,
      contextUsage: session.contextUsage,
      contextWindow: session.contextWindow,
    };
  }

  private async createTextSession(
    options: Pick<PrepareOptions, 'locale' | 'onDownloadProgress'>,
    signal?: AbortSignal,
  ) {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('On-device model unavailable');
    }
    return LanguageModel.create({
      ...textDeclarations(),
      ...(signal ? { signal } : {}),
      initialPrompts: [{ role: 'system', content: systemPrompt() }],
      monitor(monitor) {
        monitor.addEventListener('downloadprogress', (event) => {
          options.onDownloadProgress?.(Math.round(event.loaded * 100));
        });
      },
    });
  }

  private async ensureTextBaseline(
    options: Pick<PrepareOptions, 'locale' | 'onDownloadProgress'>,
    signal?: AbortSignal,
  ): Promise<LanguageModelSession> {
    if (signal?.aborted) throw abortReason(signal);
    if (this.textSession) return this.textSession;
    if (
      !this.textInitialization ||
      this.textInitialization.controller.signal.aborted
    ) {
      const generation = this.sessionGeneration;
      const initialization: SessionInitialization = {
        controller: new AbortController(),
        promise: Promise.resolve(undefined as never),
        waiters: 0,
        settled: false,
      };
      initialization.promise = this.createTextSession(
        options,
        initialization.controller.signal,
      )
        .then((session) => {
          if (generation !== this.sessionGeneration) {
            this.destroySession(session);
            throw new Error('On-device session disposed');
          }
          this.textSession = session;
          return session;
        })
        .finally(() => {
          initialization.settled = true;
          if (this.textInitialization === initialization) {
            this.textInitialization = undefined;
          }
        });
      this.textInitialization = initialization;
    }
    return this.waitForInitialization(this.textInitialization, signal);
  }

  private waitForInitialization(
    initialization: SessionInitialization,
    signal?: AbortSignal,
  ): Promise<LanguageModelSession> {
    if (signal?.aborted) {
      if (initialization.waiters === 0 && !initialization.settled) {
        initialization.controller.abort();
      }
      return Promise.reject(abortReason(signal));
    }

    initialization.waiters += 1;
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = (): boolean => {
        if (finished) return false;
        finished = true;
        signal?.removeEventListener('abort', onAbort);
        initialization.waiters -= 1;
        if (initialization.waiters === 0 && !initialization.settled) {
          initialization.controller.abort();
        }
        return true;
      };
      const onAbort = (): void => {
        if (!finish() || !signal) return;
        reject(abortReason(signal));
      };
      signal?.addEventListener('abort', onAbort, { once: true });
      initialization.promise.then(
        (session) => {
          if (finish()) resolve(session);
        },
        (error: unknown) => {
          if (finish()) reject(error);
        },
      );
    });
  }

  private async ensureTextSession(
    options: ParseOptions,
  ): Promise<LanguageModelSession> {
    if (this.textSession) return this.textSession;

    const { text: availability } = await this.capabilities(options.locale);
    if (availability !== 'available') {
      throw new Error('On-device text model is not prepared');
    }
    return this.ensureTextBaseline(options, options.signal);
  }

  private async cloneTaskSession(
    session: LanguageModelSession,
    signal?: AbortSignal,
  ): Promise<LanguageModelSession> {
    const generation = this.sessionGeneration;
    const taskSession = await session.clone(signal ? { signal } : undefined);
    if (generation !== this.sessionGeneration) {
      this.destroySession(taskSession);
      throw new Error('On-device session disposed');
    }
    this.taskSessions.add(taskSession);
    return taskSession;
  }

  private disposeTaskSession(session: LanguageModelSession): void {
    this.taskSessions.delete(session);
    this.destroySession(session);
  }

  private destroySession(session: LanguageModelSession): void {
    if (this.destroyedSessions.has(session)) return;
    this.destroyedSessions.add(session);
    session.destroy();
  }

  async parseText(
    text: string,
    options: ParseOptions,
  ): Promise<DiscoveryIntent> {
    const baseline = await this.ensureTextSession(options);
    const taskSession = await this.cloneTaskSession(baseline, options.signal);
    try {
      const raw = await taskSession.prompt(userPrompt(text, options), {
        signal: options.signal,
        responseConstraint: DISCOVERY_INTENT_SCHEMA,
        omitResponseConstraintInput: true,
      });
      const intent = validateDiscoveryIntent(JSON.parse(raw), options.locale);
      this.updateUsage(taskSession);
      return intent;
    } finally {
      this.disposeTaskSession(taskSession);
    }
  }

  private async createAudioSession(signal?: AbortSignal) {
    if (typeof LanguageModel === 'undefined') {
      throw new Error('On-device model unavailable');
    }
    return LanguageModel.create({
      ...audioDeclarations(),
      ...(signal ? { signal } : {}),
      initialPrompts: [
        {
          role: 'system',
          content:
            'Transcribe the spoken music discovery request. Return only JSON matching the response schema. Do not answer the request.',
        },
      ],
    });
  }

  private async ensureAudioSession(
    options: ParseOptions,
  ): Promise<LanguageModelSession> {
    if (options.signal?.aborted) throw abortReason(options.signal);
    if (this.audioSession) return this.audioSession;
    if (
      !this.audioInitialization ||
      this.audioInitialization.controller.signal.aborted
    ) {
      const generation = this.sessionGeneration;
      const initialization: SessionInitialization = {
        controller: new AbortController(),
        promise: Promise.resolve(undefined as never),
        waiters: 0,
        settled: false,
      };
      initialization.promise = (async () => {
        const { audio: availability } = await this.capabilities(options.locale);
        if (availability !== 'available') {
          throw new Error('On-device audio model is unavailable');
        }
        const session = await this.createAudioSession(
          initialization.controller.signal,
        );
        if (generation !== this.sessionGeneration) {
          this.destroySession(session);
          throw new Error('On-device session disposed');
        }
        this.audioSession = session;
        return session;
      })().finally(() => {
        initialization.settled = true;
        if (this.audioInitialization === initialization) {
          this.audioInitialization = undefined;
        }
      });
      this.audioInitialization = initialization;
    }
    return this.waitForInitialization(this.audioInitialization, options.signal);
  }

  async parseAudio(
    audio: Blob,
    options: ParseOptions,
  ): Promise<AudioParseResult> {
    const baseline = await this.ensureAudioSession(options);
    const taskSession = await this.cloneTaskSession(baseline, options.signal);
    try {
      const raw = await taskSession.prompt(
        [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                value: 'Transcribe this request as editable text.',
              },
              { type: 'audio', value: audio },
            ],
          },
        ],
        {
          signal: options.signal,
          responseConstraint: TRANSCRIPT_SCHEMA,
          omitResponseConstraintInput: true,
        },
      );
      const parsed = JSON.parse(raw) as { transcript?: unknown };
      if (typeof parsed.transcript !== 'string') {
        throw new Error('Audio transcript missing');
      }

      const transcript = sanitizeTranscript(parsed.transcript).trim();
      if (!transcript) {
        const error = new Error('No speech was detected');
        error.name = 'NoSpeechError';
        throw error;
      }

      this.updateUsage(taskSession);
      return { transcript };
    } finally {
      this.disposeTaskSession(taskSession);
    }
  }

  usage(): ProviderUsage {
    return this.currentUsage;
  }

  dispose(): void {
    this.sessionGeneration += 1;
    this.textInitialization?.controller.abort();
    this.audioInitialization?.controller.abort();
    this.taskSessions.forEach((session) => this.destroySession(session));
    this.taskSessions.clear();
    if (this.textSession) this.destroySession(this.textSession);
    if (this.audioSession) this.destroySession(this.audioSession);
    this.textSession = undefined;
    this.audioSession = undefined;
    this.textInitialization = undefined;
    this.audioInitialization = undefined;
    this.currentUsage = { providerName: this.label };
  }
}
