import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RulesProvider } from '../../src/providers/rulesProvider';
import type {
  DiscoveryIntent,
  IntentProvider,
  ProviderCapabilities,
} from '../../src/shared/types';

export function localIntent(terms: string): DiscoveryIntent {
  return {
    target: 'artist',
    locale: 'en',
    mode: 'ai',
    interpretation: `Find artists related to ${terms}.`,
    nativeFilters: {},
    freeTextTerms: [terms],
    traitGroups: [],
    routes: [
      {
        title: 'Reasoned route',
        rationale: 'Keeps the requested musical context together.',
        queryTerms: [terms],
        recommendations: [],
      },
    ],
  };
}

export function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((nextResolve, nextReject) => {
    resolve = nextResolve;
    reject = nextReject;
  });
  return { promise, resolve, reject };
}

export function installVoiceMocks({
  getUserMedia,
}: {
  getUserMedia?: ReturnType<typeof vi.fn>;
} = {}) {
  const stopTrack = vi.fn();
  const stream = {
    getTracks: () => [{ stop: stopTrack }],
  } as unknown as MediaStream;
  const request = getUserMedia ?? vi.fn().mockResolvedValue(stream);
  const recorders: Array<{
    state: 'inactive' | 'recording';
    onerror: ((event: Event) => void) | null;
    stop: () => void;
  }> = [];

  Object.defineProperty(navigator, 'mediaDevices', {
    configurable: true,
    value: { getUserMedia: request },
  });
  class Recorder {
    state: 'inactive' | 'recording' = 'inactive';
    mimeType = 'audio/webm';
    ondataavailable: ((event: { data: Blob }) => void) | null = null;
    onstop: (() => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    constructor() {
      recorders.push(this);
    }

    start() {
      this.state = 'recording';
    }

    stop() {
      this.state = 'inactive';
      this.ondataavailable?.({ data: new Blob(['voice']) });
      this.onstop?.();
    }
  }
  vi.stubGlobal('MediaRecorder', Recorder);
  return { getUserMedia: request, recorders, stopTrack, stream };
}

export function visibleLocalAiCard(): HTMLElement {
  const card = document.querySelector<HTMLElement>('.local-ai-state-card');
  if (!card) throw new Error('Expected visible local-AI card');
  return card;
}

export function providerMap(
  initialCapabilities: ProviderCapabilities,
  overrides: Partial<IntentProvider> = {},
) {
  const rules = new RulesProvider();
  const onDevice: IntentProvider = {
    id: 'on-device',
    label: 'Test local AI',
    capabilities: vi.fn().mockResolvedValue(initialCapabilities),
    prepare: vi.fn().mockResolvedValue({
      text: 'available',
      audio: initialCapabilities.audio,
    }),
    parseText: vi.fn((text, options) => rules.parseText(text, options)),
    parseAudio: vi.fn().mockResolvedValue({ transcript: 'piano and violin' }),
    usage: vi.fn().mockReturnValue({
      providerName: 'Test local AI',
      contextUsage: 12,
      contextWindow: 100,
    }),
    dispose: vi.fn(),
    ...overrides,
  };
  return { 'on-device': onDevice, rules };
}

export async function openDrawer(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole('button', { name: 'Open music discovery' }),
  );
}

export async function chooseRules(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole('button', { name: 'Open settings' }));
  await user.selectOptions(
    screen.getByRole('combobox', { name: 'Discovery provider' }),
    'rules',
  );
  await user.keyboard('{Escape}');
}
