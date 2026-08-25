import type { Page } from '@playwright/test';

export async function mockLocalAudio(
  page: Page,
  denied = false,
  textDelayMs = 0,
): Promise<void> {
  await page.addInitScript(
    ({ deny, textDelay }) => {
      type PromptCounters = { audio: number; text: number };
      const testChrome =
        (globalThis as typeof globalThis & { chrome?: Record<string, unknown> })
          .chrome ?? {};
      Object.assign(testChrome, {
        tabs: { create: async () => ({}) },
      });
      const promptCounters: PromptCounters = { audio: 0, text: 0 };
      const makeSession = () => {
        const session = {
          contextUsage: 7,
          contextWindow: 128,
          prompt: async (input: unknown) => {
            if (Array.isArray(input)) {
              promptCounters.audio += 1;
              return JSON.stringify({ transcript: 'local piano transcript' });
            }
            promptCounters.text += 1;
            if (textDelay > 0) {
              await new Promise((resolve) => setTimeout(resolve, textDelay));
            }
            return JSON.stringify({
              target: 'artist',
              locale: 'en',
              interpretation:
                'Find piano-led artists with strong bass and melodic interplay.',
              nativeFilters: {},
              freeTextTerms: ['local piano transcript'],
              traitGroups: [
                {
                  category: 'instrument',
                  values: ['piano', 'bass'],
                  operator: 'AND',
                  evidence: 'ai-suggested',
                },
              ],
              routes: [
                {
                  title: 'Contemporary piano trios',
                  rationale:
                    'Piano and bass can exchange melodic and rhythmic roles.',
                  queryTerms: ['piano trio melodic bass'],
                  recommendations: [
                    {
                      type: 'artist',
                      name: 'GoGo Penguin',
                      explanation:
                        'A piano-led trio where bass participates in the melodic motion.',
                      evidence: 'ai-suggested',
                      examples: [
                        {
                          type: 'track',
                          name: 'Hopopono',
                          artist: 'GoGo Penguin',
                        },
                      ],
                    },
                  ],
                },
                {
                  title: 'Jazz and hip-hop crossover',
                  rationale:
                    'A contrasting route with keyboards and prominent electric bass.',
                  queryTerms: ['keyboard bass jazz hip-hop'],
                  recommendations: [
                    {
                      type: 'artist',
                      name: 'BADBADNOTGOOD',
                      explanation:
                        'Keys and bass anchor arrangements influenced by jazz and hip-hop.',
                      evidence: 'ai-suggested',
                      examples: [],
                    },
                  ],
                },
              ],
            });
          },
          clone: async () => makeSession(),
          destroy() {},
        };
        return session;
      };
      Object.assign(globalThis, {
        chrome: testChrome,
        LanguageModel: {
          availability: async () => 'available',
          create: async () => makeSession(),
        },
        __mdoPromptCounters: promptCounters,
      });
      const stop = () => {
        (
          globalThis as typeof globalThis & { __trackStops?: number }
        ).__trackStops =
          ((globalThis as typeof globalThis & { __trackStops?: number })
            .__trackStops ?? 0) + 1;
      };
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: async () => {
            if (deny) throw new DOMException('denied', 'NotAllowedError');
            return { getTracks: () => [{ stop }] };
          },
        },
      });
      class Recorder {
        state: 'inactive' | 'recording' = 'inactive';
        mimeType = 'audio/webm';
        ondataavailable: ((event: { data: Blob }) => void) | null = null;
        onstop: (() => void) | null = null;
        start() {
          this.state = 'recording';
        }
        stop() {
          this.state = 'inactive';
          this.ondataavailable?.({
            data: new Blob(['voice'], { type: this.mimeType }),
          });
          this.onstop?.();
        }
      }
      Object.assign(globalThis, { MediaRecorder: Recorder });
    },
    { deny: denied, textDelay: textDelayMs },
  );
}

export async function mockRecoveringLocalAi(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type RecoveryGlobals = typeof globalThis & {
      __mdoAvailability?:
        'available' | 'downloadable' | 'downloading' | 'unavailable';
      __mdoCreateCalls?: number;
    };
    const recoveryGlobals = globalThis as RecoveryGlobals;
    recoveryGlobals.__mdoAvailability = 'unavailable';
    recoveryGlobals.__mdoCreateCalls = 0;
    Object.assign(globalThis, {
      LanguageModel: {
        availability: async () =>
          recoveryGlobals.__mdoAvailability ?? 'unavailable',
        create: async (options: {
          monitor?: (monitor: {
            addEventListener: (
              type: string,
              listener: (event: { loaded: number }) => void,
            ) => void;
          }) => void;
        }) => {
          recoveryGlobals.__mdoCreateCalls =
            (recoveryGlobals.__mdoCreateCalls ?? 0) + 1;
          options.monitor?.({
            addEventListener: (_type, listener) => listener({ loaded: 0.5 }),
          });
          recoveryGlobals.__mdoAvailability = 'available';
          return {
            contextUsage: 0,
            contextWindow: 128,
            prompt: async () => '{}',
            destroy() {},
          };
        },
      },
    });
  });
}

export async function mockDownloadingLocalAi(page: Page): Promise<void> {
  await page.addInitScript(() => {
    type DownloadGlobals = typeof globalThis & {
      __mdoCreateCalls?: number;
    };
    const downloadGlobals = globalThis as DownloadGlobals;
    downloadGlobals.__mdoCreateCalls = 0;
    Object.assign(globalThis, {
      LanguageModel: {
        availability: async () => 'downloading',
        create: async (options: {
          monitor?: (monitor: {
            addEventListener: (
              type: string,
              listener: (event: { loaded: number }) => void,
            ) => void;
          }) => void;
        }) => {
          downloadGlobals.__mdoCreateCalls =
            (downloadGlobals.__mdoCreateCalls ?? 0) + 1;
          options.monitor?.({
            addEventListener: (_type, listener) => listener({ loaded: 0.25 }),
          });
          return new Promise<never>(() => undefined);
        },
      },
    });
  });
}
