interface LanguageModelCreateMonitor {
  addEventListener(
    type: 'downloadprogress',
    listener: (event: { loaded: number }) => void,
  ): void;
}

interface LanguageModelPromptOptions {
  signal?: AbortSignal;
  responseConstraint?: object;
  omitResponseConstraintInput?: boolean;
}

interface LanguageModelSession {
  readonly contextUsage: number;
  readonly contextWindow: number;
  clone(options?: { signal?: AbortSignal }): Promise<LanguageModelSession>;
  prompt(
    input:
      | string
      | Array<{
          role: 'user';
          content: Array<
            { type: 'text'; value: string } | { type: 'audio'; value: Blob }
          >;
        }>,
    options?: LanguageModelPromptOptions,
  ): Promise<string>;
  destroy(): void;
}

interface LanguageModelCreateOptions {
  signal?: AbortSignal;
  initialPrompts?: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  expectedInputs?: Array<{
    type: 'text' | 'audio';
    languages?: string[];
  }>;
  expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>;
  monitor?: (monitor: LanguageModelCreateMonitor) => void;
}

declare const LanguageModel:
  | {
      availability(options?: {
        expectedInputs?: Array<{
          type: 'text' | 'audio';
          languages?: string[];
        }>;
        expectedOutputs?: Array<{ type: 'text'; languages?: string[] }>;
      }): Promise<'available' | 'downloadable' | 'downloading' | 'unavailable'>;
      create(
        options?: LanguageModelCreateOptions,
      ): Promise<LanguageModelSession>;
    }
  | undefined;
