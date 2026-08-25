import {
  ChromeOnDeviceProvider,
  sanitizeTranscript,
} from '../src/providers/chromeOnDeviceProvider';

function fakeSession(promptResult = '{}') {
  const session = {
    contextUsage: 4,
    contextWindow: 128,
    prompt: vi.fn().mockResolvedValue(promptResult),
    destroy: vi.fn(),
    clone: vi.fn(),
  };
  session.clone.mockImplementation(async () => fakeSession(promptResult));
  return session;
}

function intentJson(locale: 'en' | 'es' = 'en') {
  return JSON.stringify({
    target: 'artist',
    locale,
    interpretation:
      locale === 'es' ? 'Encuentra artistas de piano.' : 'Find piano artists.',
    nativeFilters: {},
    freeTextTerms: ['piano'],
    traitGroups: [],
    routes: [],
  });
}

function deferred<T>() {
  let resolve!: (value: T | PromiseLike<T>) => void;
  const promise = new Promise<T>((nextResolve) => {
    resolve = nextResolve;
  });
  return { promise, resolve };
}

describe('ChromeOnDeviceProvider lifecycle', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('checks text and audio with matching declarations without creating a session', async () => {
    const availability = vi.fn().mockResolvedValue('downloadable');
    const create = vi.fn();
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();

    await expect(provider.capabilities('en')).resolves.toEqual({
      text: 'downloadable',
      audio: 'downloadable',
    });
    expect(create).not.toHaveBeenCalled();
    expect(availability).toHaveBeenNthCalledWith(1, {
      expectedInputs: [{ type: 'text', languages: ['en', 'es'] }],
      expectedOutputs: [{ type: 'text', languages: ['en', 'es'] }],
    });
    expect(availability).toHaveBeenNthCalledWith(2, {
      expectedInputs: [
        { type: 'text', languages: ['en', 'es'] },
        { type: 'audio' },
      ],
      expectedOutputs: [{ type: 'text', languages: ['en', 'es'] }],
    });
  });

  it('creates the text session only during explicit preparation and reports progress', async () => {
    const progress = vi.fn();
    const session = fakeSession();
    const availability = vi
      .fn()
      .mockResolvedValueOnce('downloadable')
      .mockResolvedValueOnce('unavailable')
      .mockResolvedValueOnce('available')
      .mockResolvedValueOnce('unavailable');
    const create = vi.fn(async (options) => {
      const listeners: Array<(event: { loaded: number }) => void> = [];
      options.monitor?.({
        addEventListener: (
          _type: string,
          listener: (event: { loaded: number }) => void,
        ) => listeners.push(listener),
      });
      listeners.forEach((listener) => listener({ loaded: 0.42 }));
      return session;
    });
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();

    expect(create).not.toHaveBeenCalled();
    await expect(
      provider.prepare({ locale: 'en', onDownloadProgress: progress }),
    ).resolves.toEqual({ text: 'available', audio: 'unavailable' });
    expect(create).toHaveBeenCalledOnce();
    expect(progress).toHaveBeenCalledWith(42);
    expect(create.mock.calls[0]?.[0].initialPrompts[0].content).toContain(
      'concise music curator',
    );
    expect(create.mock.calls[0]?.[0].initialPrompts[0].content).toContain(
      'standalone Hz value',
    );
  });

  it('never calls create when Chrome reports the text model as unavailable', async () => {
    const availability = vi.fn().mockResolvedValue('unavailable');
    const create = vi.fn();
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();

    await expect(provider.prepare({ locale: 'en' })).rejects.toThrow(
      'On-device model unavailable',
    );
    expect(create).not.toHaveBeenCalled();
  });

  it('returns a sanitized transcript only and destroys both sessions on release', async () => {
    const textSession = fakeSession();
    const audioTask = fakeSession(
      JSON.stringify({ transcript: '<script>piano\u0000 and violin</script>' }),
    );
    const audioSession = fakeSession(
      JSON.stringify({ transcript: 'baseline must not be prompted' }),
    );
    audioSession.clone.mockResolvedValue(audioTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi
      .fn()
      .mockResolvedValueOnce(textSession)
      .mockResolvedValueOnce(audioSession);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    await provider.prepare({ locale: 'en' });

    await expect(
      provider.parseAudio(new Blob(['voice']), {
        locale: 'en',
        selectedTraits: [],
      }),
    ).resolves.toEqual({ transcript: 'scriptpiano and violin/script' });
    expect(audioSession.prompt).not.toHaveBeenCalled();
    expect(audioSession.clone).toHaveBeenCalledOnce();
    expect(audioTask.destroy).toHaveBeenCalledOnce();
    provider.dispose();
    expect(textSession.destroy).toHaveBeenCalledOnce();
    expect(audioSession.destroy).toHaveBeenCalledOnce();
    expect(provider.usage()).toEqual({ providerName: 'Chrome on-device AI' });
  });

  it('rejects a sanitized-empty transcript without destroying reusable baselines', async () => {
    const textSession = fakeSession();
    const audioTask = fakeSession(JSON.stringify({ transcript: '  <>  ' }));
    const audioSession = fakeSession();
    audioSession.clone.mockResolvedValue(audioTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi
      .fn()
      .mockResolvedValueOnce(textSession)
      .mockResolvedValueOnce(audioSession);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    await provider.prepare({ locale: 'en' });

    await expect(
      provider.parseAudio(new Blob(['silence']), {
        locale: 'en',
        selectedTraits: [],
      }),
    ).rejects.toMatchObject({ name: 'NoSpeechError' });
    expect(audioTask.destroy).toHaveBeenCalledOnce();
    expect(textSession.destroy).not.toHaveBeenCalled();
    expect(audioSession.destroy).not.toHaveBeenCalled();

    provider.dispose();
    expect(textSession.destroy).toHaveBeenCalledOnce();
    expect(audioSession.destroy).toHaveBeenCalledOnce();
  });

  it('clones and destroys independent text tasks instead of accumulating context', async () => {
    const textSession = fakeSession();
    const firstTask = fakeSession(intentJson());
    const secondTask = fakeSession(intentJson());
    textSession.clone
      .mockResolvedValueOnce(firstTask)
      .mockResolvedValueOnce(secondTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockResolvedValue(textSession);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    await provider.prepare({ locale: 'en' });

    await provider.parseText('piano', { locale: 'en', selectedTraits: [] });
    await provider.parseText('piano again', {
      locale: 'en',
      selectedTraits: [],
    });

    expect(textSession.prompt).not.toHaveBeenCalled();
    expect(textSession.clone).toHaveBeenCalledTimes(2);
    expect(firstTask.prompt).toHaveBeenCalledOnce();
    expect(secondTask.prompt).toHaveBeenCalledOnce();
    const responseConstraint = firstTask.prompt.mock.calls[0]?.[1]
      ?.responseConstraint as { properties?: Record<string, unknown> };
    expect(responseConstraint.properties).toHaveProperty('interpretation');
    expect(responseConstraint.properties).toHaveProperty('routes');
    expect(JSON.stringify(responseConstraint)).not.toContain('maxLength');
    expect(firstTask.destroy).toHaveBeenCalledOnce();
    expect(secondTask.destroy).toHaveBeenCalledOnce();
  });

  it('keeps the audio baseline across recordings separated by text generation', async () => {
    const textSession = fakeSession();
    const textTask = fakeSession(intentJson());
    textSession.clone.mockResolvedValue(textTask);
    const audioSession = fakeSession(
      JSON.stringify({ transcript: 'baseline must not be prompted' }),
    );
    const firstAudioTask = fakeSession(
      JSON.stringify({ transcript: 'first recording' }),
    );
    const secondAudioTask = fakeSession(
      JSON.stringify({ transcript: 'second recording' }),
    );
    audioSession.clone
      .mockResolvedValueOnce(firstAudioTask)
      .mockResolvedValueOnce(secondAudioTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi
      .fn()
      .mockResolvedValueOnce(textSession)
      .mockResolvedValueOnce(audioSession);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    await provider.prepare({ locale: 'en' });

    const firstSignal = new AbortController();
    await expect(
      provider.parseAudio(new Blob(['first']), {
        locale: 'en',
        selectedTraits: [],
        signal: firstSignal.signal,
      }),
    ).resolves.toEqual({ transcript: 'first recording' });
    await provider.parseText('piano', {
      locale: 'en',
      selectedTraits: [],
    });
    await expect(
      provider.parseAudio(new Blob(['second']), {
        locale: 'en',
        selectedTraits: [],
      }),
    ).resolves.toEqual({ transcript: 'second recording' });

    expect(create).toHaveBeenCalledTimes(2);
    const audioInitializationSignal = create.mock.calls[1][0]
      .signal as AbortSignal;
    expect(audioInitializationSignal).toBeInstanceOf(AbortSignal);
    expect(audioInitializationSignal).not.toBe(firstSignal.signal);
    expect(audioInitializationSignal.aborted).toBe(false);
    expect(audioSession.prompt).not.toHaveBeenCalled();
    expect(audioSession.clone).toHaveBeenCalledTimes(2);
    expect(audioSession.clone).toHaveBeenNthCalledWith(1, {
      signal: firstSignal.signal,
    });
    expect(audioSession.clone).toHaveBeenNthCalledWith(2, undefined);
    expect(firstAudioTask.prompt).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({ signal: firstSignal.signal }),
    );
    expect(firstAudioTask.destroy).toHaveBeenCalledOnce();
    expect(secondAudioTask.destroy).toHaveBeenCalledOnce();
    expect(textTask.destroy).toHaveBeenCalledOnce();
  });

  it('deduplicates concurrent text initialization and gives each request an independent task clone', async () => {
    const baseline = fakeSession();
    const firstTask = fakeSession(intentJson());
    const secondTask = fakeSession(intentJson());
    baseline.clone
      .mockResolvedValueOnce(firstTask)
      .mockResolvedValueOnce(secondTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockResolvedValue(baseline);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();

    await Promise.all([
      provider.parseText('first request', {
        locale: 'en',
        selectedTraits: [],
      }),
      provider.parseText('second request', {
        locale: 'en',
        selectedTraits: [],
      }),
    ]);

    expect(create).toHaveBeenCalledOnce();
    expect(baseline.clone).toHaveBeenCalledTimes(2);
    expect(firstTask.prompt).toHaveBeenCalledOnce();
    expect(secondTask.prompt).toHaveBeenCalledOnce();
    expect(firstTask.destroy).toHaveBeenCalledOnce();
    expect(secondTask.destroy).toHaveBeenCalledOnce();
  });

  it('deduplicates concurrent audio initialization and gives each recording an independent task clone', async () => {
    const baseline = fakeSession();
    const firstTask = fakeSession(
      JSON.stringify({ transcript: 'first recording' }),
    );
    const secondTask = fakeSession(
      JSON.stringify({ transcript: 'second recording' }),
    );
    baseline.clone
      .mockResolvedValueOnce(firstTask)
      .mockResolvedValueOnce(secondTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockResolvedValue(baseline);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();

    await expect(
      Promise.all([
        provider.parseAudio(new Blob(['first']), {
          locale: 'en',
          selectedTraits: [],
        }),
        provider.parseAudio(new Blob(['second']), {
          locale: 'en',
          selectedTraits: [],
        }),
      ]),
    ).resolves.toEqual([
      { transcript: 'first recording' },
      { transcript: 'second recording' },
    ]);

    expect(create).toHaveBeenCalledOnce();
    expect(baseline.clone).toHaveBeenCalledTimes(2);
    expect(firstTask.destroy).toHaveBeenCalledOnce();
    expect(secondTask.destroy).toHaveBeenCalledOnce();
  });

  it('keeps a shared text initialization alive when one concurrent caller cancels', async () => {
    const baselineCreation = deferred<ReturnType<typeof fakeSession>>();
    const baseline = fakeSession();
    const remainingTask = fakeSession(intentJson());
    baseline.clone.mockResolvedValue(remainingTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockReturnValue(baselineCreation.promise);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    const cancelled = new AbortController();

    const first = provider.parseText('cancelled request', {
      locale: 'en',
      selectedTraits: [],
      signal: cancelled.signal,
    });
    const second = provider.parseText('remaining request', {
      locale: 'en',
      selectedTraits: [],
    });
    await vi.waitFor(() => expect(availability).toHaveBeenCalledTimes(4));
    await vi.waitFor(() => expect(create).toHaveBeenCalledOnce());

    cancelled.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const initializationSignal = create.mock.calls[0][0].signal as AbortSignal;
    expect(initializationSignal.aborted).toBe(false);
    baselineCreation.resolve(baseline);

    await expect(second).resolves.toMatchObject({ locale: 'en' });
    expect(baseline.clone).toHaveBeenCalledOnce();
    expect(remainingTask.destroy).toHaveBeenCalledOnce();
  });

  it('keeps a shared audio initialization alive when one concurrent caller cancels', async () => {
    const baselineCreation = deferred<ReturnType<typeof fakeSession>>();
    const baseline = fakeSession();
    const remainingTask = fakeSession(
      JSON.stringify({ transcript: 'remaining recording' }),
    );
    baseline.clone.mockResolvedValue(remainingTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockReturnValue(baselineCreation.promise);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    const cancelled = new AbortController();

    const first = provider.parseAudio(new Blob(['cancelled']), {
      locale: 'en',
      selectedTraits: [],
      signal: cancelled.signal,
    });
    const second = provider.parseAudio(new Blob(['remaining']), {
      locale: 'en',
      selectedTraits: [],
    });
    await vi.waitFor(() => expect(availability).toHaveBeenCalledTimes(2));
    await vi.waitFor(() => expect(create).toHaveBeenCalledOnce());

    cancelled.abort();
    await expect(first).rejects.toMatchObject({ name: 'AbortError' });
    const initializationSignal = create.mock.calls[0][0].signal as AbortSignal;
    expect(initializationSignal.aborted).toBe(false);
    baselineCreation.resolve(baseline);

    await expect(second).resolves.toEqual({
      transcript: 'remaining recording',
    });
    expect(baseline.clone).toHaveBeenCalledOnce();
    expect(remainingTask.destroy).toHaveBeenCalledOnce();
  });

  it('reuses one locale-neutral text baseline while each task carries its locale', async () => {
    const baseline = fakeSession();
    const englishTask = fakeSession(intentJson('en'));
    const spanishTask = fakeSession(intentJson('es'));
    baseline.clone
      .mockResolvedValueOnce(englishTask)
      .mockResolvedValueOnce(spanishTask);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockResolvedValue(baseline);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    await provider.prepare({ locale: 'en' });

    await provider.parseText('piano artists', {
      locale: 'en',
      selectedTraits: [],
    });
    await provider.parseText('artistas de piano', {
      locale: 'es',
      selectedTraits: [],
    });

    expect(create).toHaveBeenCalledOnce();
    const system = create.mock.calls[0]?.[0].initialPrompts[0].content;
    expect(system).toContain('locale named by each user task payload');
    expect(system).not.toMatch(/reply in English|reply in Spanish/i);
    expect(JSON.parse(englishTask.prompt.mock.calls[0]?.[0])).toMatchObject({
      locale: 'en',
    });
    expect(JSON.parse(spanishTask.prompt.mock.calls[0]?.[0])).toMatchObject({
      locale: 'es',
    });
  });

  it('destroys a baseline that finishes creating after disposal', async () => {
    const baseline = fakeSession();
    let resolveCreate:
      ((session: ReturnType<typeof fakeSession>) => void) | undefined;
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn((options?: { signal?: AbortSignal }) => {
      void options;
      return new Promise<ReturnType<typeof fakeSession>>((resolve) => {
        resolveCreate = resolve;
      });
    });
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();

    const preparation = provider.prepare({ locale: 'en' });
    await vi.waitFor(() => expect(create).toHaveBeenCalledOnce());
    provider.dispose();
    expect(create.mock.calls[0]?.[0]?.signal?.aborted).toBe(true);
    resolveCreate?.(baseline);

    await expect(preparation).rejects.toThrow('On-device session disposed');
    expect(baseline.destroy).toHaveBeenCalledOnce();
  });

  it('destroys a task that resolves after the provider is disposed', async () => {
    const textSession = fakeSession();
    const pendingTask = fakeSession(intentJson());
    let resolveClone:
      ((session: ReturnType<typeof fakeSession>) => void) | undefined;
    textSession.clone.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveClone = resolve;
        }),
    );
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockResolvedValue(textSession);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    await provider.prepare({ locale: 'en' });

    const parsing = provider.parseText('piano', {
      locale: 'en',
      selectedTraits: [],
    });
    await vi.waitFor(() => expect(textSession.clone).toHaveBeenCalledOnce());
    provider.dispose();
    resolveClone?.(pendingTask);

    await expect(parsing).rejects.toThrow('On-device session disposed');
    expect(pendingTask.destroy).toHaveBeenCalledOnce();
    expect(textSession.destroy).toHaveBeenCalledOnce();
  });

  it('cancels a task prompt without destroying its reusable baseline', async () => {
    const textSession = fakeSession();
    const taskSession = fakeSession(intentJson());
    let rejectPrompt: ((error: Error & { name?: string }) => void) | undefined;
    taskSession.prompt.mockImplementation(
      () =>
        new Promise((_resolve, reject) => {
          rejectPrompt = reject;
        }),
    );
    textSession.clone.mockResolvedValue(taskSession);
    const availability = vi.fn().mockResolvedValue('available');
    const create = vi.fn().mockResolvedValue(textSession);
    vi.stubGlobal('LanguageModel', { availability, create });
    const provider = new ChromeOnDeviceProvider();
    await provider.prepare({ locale: 'en' });

    const controller = new AbortController();
    const parsing = provider.parseText('piano', {
      locale: 'en',
      selectedTraits: [],
      signal: controller.signal,
    });
    await vi.waitFor(() => expect(taskSession.prompt).toHaveBeenCalledOnce());
    controller.abort();
    rejectPrompt?.(
      Object.assign(new Error('cancelled'), { name: 'AbortError' }),
    );

    await expect(parsing).rejects.toMatchObject({ name: 'AbortError' });
    expect(taskSession.prompt).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    );
    expect(textSession.clone).toHaveBeenCalledWith({
      signal: controller.signal,
    });
    expect(taskSession.destroy).toHaveBeenCalledOnce();
    expect(textSession.destroy).not.toHaveBeenCalled();
  });

  it('bounds and strips executable transcript delimiters', () => {
    expect(sanitizeTranscript(`<b>${'a'.repeat(600)}</b>`)).toHaveLength(500);
    expect(sanitizeTranscript('<img onerror=alert(1)>')).toBe(
      'img onerror=alert(1)',
    );
  });
});
