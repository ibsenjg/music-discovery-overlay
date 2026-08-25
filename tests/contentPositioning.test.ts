vi.mock('../src/content/spotifySearchAdapter', () => ({
  SpotifySearchAdapter: class {
    populateAndSubmit() {
      return 'native';
    }
  },
}));

describe('content overlay positioning', () => {
  afterEach(() => {
    window.dispatchEvent(new Event('pagehide'));
    document.documentElement.dataset.mdoDisableAutoMount = 'true';
    document.getElementById('music-discovery-overlay-host')?.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('coalesces mutation and resize bursts into one animation-frame layout pass', async () => {
    document.documentElement.dataset.mdoDisableAutoMount = 'true';
    const profile = document.createElement('button');
    profile.dataset.testid = 'user-widget-link';
    document.body.append(profile);
    const measureProfile = vi.spyOn(profile, 'getBoundingClientRect');
    let mutationCallback: MutationCallback | undefined;
    class TestMutationObserver implements MutationObserver {
      constructor(callback: MutationCallback) {
        mutationCallback = callback;
      }
      disconnect() {}
      observe() {}
      takeRecords(): MutationRecord[] {
        return [];
      }
    }
    vi.stubGlobal('MutationObserver', TestMutationObserver);
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: (path: string) => `https://extension.test/${path}`,
      },
    });
    const scheduled: FrameRequestCallback[] = [];
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockImplementation((callback) => {
        scheduled.push(callback);
        return scheduled.length;
      });
    const { mountMusicDiscoveryOverlay } = await import('../src/content/index');

    mountMusicDiscoveryOverlay();
    expect(measureProfile).toHaveBeenCalledOnce();
    mutationCallback?.([], {} as MutationObserver);
    mutationCallback?.([], {} as MutationObserver);
    window.dispatchEvent(new Event('resize'));

    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    scheduled.shift()?.(performance.now());
    expect(measureProfile).toHaveBeenCalledTimes(2);

    mutationCallback?.([], {} as MutationObserver);
    expect(requestAnimationFrame).toHaveBeenCalledTimes(2);
    profile.remove();
  });

  it('caches extension URLs so later messages do not touch an invalidated runtime', async () => {
    document.documentElement.dataset.mdoDisableAutoMount = 'true';
    const getURL = vi.fn((path: string) => `https://extension.test/${path}`);
    vi.stubGlobal('chrome', { runtime: { getURL } });
    const { mountMusicDiscoveryOverlay } = await import('../src/content/index');

    mountMusicDiscoveryOverlay();
    expect(getURL).toHaveBeenCalledTimes(2);
    const host = document.getElementById('music-discovery-overlay-host');
    const iframe = host?.shadowRoot?.querySelector('iframe');
    if (!iframe) throw new Error('Expected mounted test iframe');
    const nonce = new URL(iframe.src).hash.slice(1);
    const params = new URLSearchParams(nonce);
    getURL.mockImplementation(() => {
      throw new Error('Extension context invalidated.');
    });

    expect(() =>
      window.dispatchEvent(
        new MessageEvent('message', {
          source: iframe.contentWindow,
          origin: 'https://extension.test',
          data: {
            source: 'mdo-frame',
            nonce: params.get('nonce'),
            type: 'overlay-state',
            open: true,
          },
        }),
      ),
    ).not.toThrow();
    expect(getURL).toHaveBeenCalledTimes(2);
  });

  it('removes a stale host and fails closed when mounting starts after invalidation', async () => {
    document.documentElement.dataset.mdoDisableAutoMount = 'true';
    const staleHost = document.createElement('div');
    staleHost.id = 'music-discovery-overlay-host';
    document.documentElement.append(staleHost);
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: () => {
          throw new Error('Extension context invalidated.');
        },
      },
    });
    const { mountMusicDiscoveryOverlay } = await import('../src/content/index');

    expect(() => mountMusicDiscoveryOverlay()).not.toThrow();
    expect(
      document.getElementById('music-discovery-overlay-host'),
    ).not.toBeInTheDocument();
  });

  it('lets a fresh content-script instance replace a stale mounted host', async () => {
    document.documentElement.dataset.mdoDisableAutoMount = 'true';
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: (path: string) => `https://extension.test/${path}`,
      },
    });
    const firstModule = await import('../src/content/index');
    firstModule.mountMusicDiscoveryOverlay();
    const firstHost = document.getElementById('music-discovery-overlay-host');
    expect(firstHost).not.toBeNull();

    vi.resetModules();
    const freshModule = await import('../src/content/index');
    freshModule.mountMusicDiscoveryOverlay();
    const freshHost = document.getElementById('music-discovery-overlay-host');

    expect(freshHost).not.toBe(firstHost);
    expect(freshHost).toBeInTheDocument();
  });

  it('disconnects page resources and cancels pending layout work on page exit', async () => {
    document.documentElement.dataset.mdoDisableAutoMount = 'true';
    const disconnect = vi.fn();
    class TestMutationObserver implements MutationObserver {
      disconnect = disconnect;
      observe() {}
      takeRecords(): MutationRecord[] {
        return [];
      }
    }
    vi.stubGlobal('MutationObserver', TestMutationObserver);
    vi.stubGlobal('chrome', {
      runtime: {
        getURL: (path: string) => `https://extension.test/${path}`,
      },
    });
    const requestAnimationFrame = vi
      .spyOn(window, 'requestAnimationFrame')
      .mockReturnValue(42);
    const cancelAnimationFrame = vi.spyOn(window, 'cancelAnimationFrame');
    const { mountMusicDiscoveryOverlay } = await import('../src/content/index');

    mountMusicDiscoveryOverlay();
    window.dispatchEvent(new Event('resize'));
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
    window.dispatchEvent(new Event('pagehide'));

    expect(cancelAnimationFrame).toHaveBeenCalledWith(42);
    expect(disconnect).toHaveBeenCalledOnce();
    expect(
      document.getElementById('music-discovery-overlay-host'),
    ).not.toBeInTheDocument();
    window.dispatchEvent(new Event('resize'));
    expect(requestAnimationFrame).toHaveBeenCalledOnce();
  });
});
