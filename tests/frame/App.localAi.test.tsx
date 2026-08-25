import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frame/App';
import type {
  DiscoveryIntent,
  ProviderCapabilities,
} from '../../src/shared/types';
import {
  localIntent,
  deferred,
  visibleLocalAiCard,
  providerMap,
  openDrawer,
} from './appTestUtils';

describe('Local AI lifecycle', () => {
  it('hides AI controls until a downloadable model is prepared by explicit action', async () => {
    const user = userEvent.setup();
    const providers = providerMap({
      text: 'downloadable',
      audio: 'unavailable',
    });
    render(<App providers={providers} />);
    await openDrawer(user);
    expect(
      await screen.findByRole('button', { name: 'Download local AI' }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 2,
        name: 'Local AI model required',
      }),
    ).toBeVisible();
    expect(screen.getByText(/Reasoned on-device AI suggestions/)).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Use Guided discovery' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Generate search suggestions' }),
    ).not.toBeInTheDocument();
    expect(providers['on-device'].prepare).not.toHaveBeenCalled();
    await user.click(screen.getByRole('button', { name: 'Download local AI' }));
    await waitFor(() =>
      expect(providers['on-device'].prepare).toHaveBeenCalledOnce(),
    );
    expect(
      await screen.findByRole('button', {
        name: 'Generate search suggestions',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Local AI model required' }),
    ).not.toBeInTheDocument();
  });

  it('explains a Chrome-managed download before explicitly attaching setup progress', async () => {
    const user = userEvent.setup();
    const prepare = vi.fn().mockResolvedValue({
      text: 'available',
      audio: 'unavailable',
    });
    const providers = providerMap(
      { text: 'downloading', audio: 'downloading' },
      { prepare },
    );
    render(<App providers={providers} />);
    await openDrawer(user);

    expect(
      await screen.findByRole('heading', {
        level: 2,
        name: 'Local AI model required',
      }),
    ).toBeVisible();
    expect(
      within(visibleLocalAiCard()).getByText(
        /This extension has not created an AI session yet/,
      ),
    ).toBeVisible();
    expect(prepare).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Use Guided discovery' }),
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Continue and show progress' }),
    );
    expect(prepare).toHaveBeenCalledOnce();
  });

  it('shows checking without AI controls and exposes a specific retry state', async () => {
    const user = userEvent.setup();
    const checkingProviders = providerMap(
      { text: 'unavailable', audio: 'unavailable' },
      {
        capabilities: vi.fn(
          () => new Promise<ProviderCapabilities>(() => undefined),
        ),
      },
    );
    const { unmount } = render(<App providers={checkingProviders} />);
    await openDrawer(user);
    expect(
      within(visibleLocalAiCard()).getByText('Checking local AI capabilities…'),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Generate search suggestions' }),
    ).not.toBeInTheDocument();
    unmount();

    const errorProviders = providerMap(
      { text: 'unavailable', audio: 'unavailable' },
      {
        capabilities: vi.fn().mockRejectedValue(new Error('capability error')),
      },
    );
    render(<App providers={errorProviders} />);
    await openDrawer(user);
    expect(await screen.findByRole('button', { name: 'Retry' })).toBeVisible();
  });

  it('shows download progress and aborts extension preparation from Stop setup', async () => {
    const user = userEvent.setup();
    let preparationSignal: AbortSignal | undefined;
    const prepare = vi.fn((options) => {
      preparationSignal = options.signal;
      options.onDownloadProgress?.(35);
      return new Promise<ProviderCapabilities>(() => undefined);
    });
    const providers = providerMap(
      { text: 'downloadable', audio: 'unavailable' },
      { prepare },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Download local AI' }),
    );
    expect(
      within(visibleLocalAiCard()).getByText(
        'Downloading the on-device model: 35%',
      ),
    ).toBeVisible();
    expect(
      screen.getByRole('progressbar', {
        name: 'Local AI model download progress',
      }),
    ).toHaveAttribute('value', '35');
    await user.click(screen.getByRole('button', { name: 'Stop setup' }));
    expect(preparationSignal?.aborted).toBe(true);
    expect(
      screen.getByRole('button', { name: 'Download local AI' }),
    ).toBeVisible();
  });

  it('keeps explicit local-AI preparation alive across focus and visibility checks', async () => {
    const user = userEvent.setup();
    const pendingPreparation = deferred<ProviderCapabilities>();
    let preparationSignal: AbortSignal | undefined;
    const capabilities = vi.fn().mockResolvedValue({
      text: 'downloadable',
      audio: 'unavailable',
    });
    const prepare = vi.fn((options) => {
      preparationSignal = options.signal;
      options.onDownloadProgress?.(22);
      return pendingPreparation.promise;
    });
    const providers = providerMap(
      { text: 'downloadable', audio: 'unavailable' },
      { capabilities, prepare },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Download local AI' }),
    );
    const capabilityChecksBeforeFocus = capabilities.mock.calls.length;
    const disposalsBeforeFocus = vi.mocked(providers['on-device'].dispose).mock
      .calls.length;

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      document.dispatchEvent(new Event('visibilitychange'));
    });

    expect(capabilities).toHaveBeenCalledTimes(capabilityChecksBeforeFocus);
    expect(preparationSignal?.aborted).toBe(false);
    expect(providers['on-device'].dispose).toHaveBeenCalledTimes(
      disposalsBeforeFocus,
    );
    expect(screen.getByRole('button', { name: 'Stop setup' })).toBeVisible();

    await act(async () => {
      pendingPreparation.resolve({ text: 'available', audio: 'unavailable' });
    });
    expect(
      await screen.findByRole('button', {
        name: 'Generate search suggestions',
      }),
    ).toBeVisible();
  });

  it('aborts local-AI preparation and ignores its late completion after unmount', async () => {
    const user = userEvent.setup();
    const pendingPreparation = deferred<ProviderCapabilities>();
    let preparationSignal: AbortSignal | undefined;
    const capabilities = vi.fn().mockResolvedValue({
      text: 'downloadable',
      audio: 'unavailable',
    });
    const prepare = vi.fn((options) => {
      preparationSignal = options.signal;
      return pendingPreparation.promise;
    });
    const providers = providerMap(
      { text: 'downloadable', audio: 'unavailable' },
      { capabilities, prepare },
    );
    const { unmount } = render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Download local AI' }),
    );
    const capabilityChecksBeforeUnmount = capabilities.mock.calls.length;
    const disposalsBeforeUnmount = vi.mocked(providers['on-device'].dispose)
      .mock.calls.length;

    unmount();
    expect(preparationSignal?.aborted).toBe(true);
    expect(providers['on-device'].dispose).toHaveBeenCalledTimes(
      disposalsBeforeUnmount + 1,
    );

    await act(async () => {
      pendingPreparation.resolve({ text: 'available', audio: 'available' });
      await pendingPreparation.promise;
    });
    expect(capabilities).toHaveBeenCalledTimes(capabilityChecksBeforeUnmount);
  });

  it('shows text generation without a microphone when audio is unsupported', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    expect(
      await screen.findByRole('button', {
        name: 'Generate search suggestions',
      }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(
      screen.getAllByText(
        /Microphone input needs compatible GPU audio support/,
      )[0],
    ).toBeVisible();
  });

  it('uses local AI text parsing for Generate without invoking Rules', async () => {
    const user = userEvent.setup();
    const localParseText = vi
      .fn()
      .mockResolvedValue(localIntent('ambient piano'));
    const providers = providerMap(
      { text: 'available', audio: 'unavailable' },
      { parseText: localParseText },
    );
    const rulesParseText = vi.spyOn(providers.rules, 'parseText');
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'ambient piano');
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    expect(localParseText).toHaveBeenCalledOnce();
    expect(localParseText).toHaveBeenCalledWith(
      'ambient piano',
      expect.objectContaining({ locale: 'en', selectedTraits: [] }),
    );
    expect(rulesParseText).not.toHaveBeenCalled();
  });

  it('shows an accessible loader while local AI creates suggestions', async () => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    const localParseText = vi.fn().mockReturnValue(pendingIntent.promise);
    const providers = providerMap(
      { text: 'available', audio: 'unavailable' },
      { parseText: localParseText },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      'ambient piano',
    );
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    const loadingButton = screen.getByRole('button', {
      name: 'Creating suggestions…',
    });
    expect(loadingButton).toBeDisabled();
    expect(loadingButton).toHaveAttribute('aria-busy', 'true');
    expect(loadingButton.querySelector('.loading-spinner')).not.toBeNull();
    expect(screen.getByText('Creating suggestions…')).toBeInTheDocument();
    await user.click(loadingButton);
    expect(localParseText).toHaveBeenCalledOnce();

    pendingIntent.resolve(localIntent('ambient piano'));
    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    const restoredButton = screen.getByRole('button', {
      name: 'Generate search suggestions',
    });
    expect(restoredButton).toBeEnabled();
    expect(restoredButton).not.toHaveAttribute('aria-busy');
    expect(restoredButton.querySelector('.loading-spinner')).toBeNull();
    expect(
      screen.getAllByRole('button', { name: /^Search for .* in Spotify$/ })[0],
    ).toBeVisible();
  });

  it('keeps local generation running while minimized and restores its results', async () => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    let generationSignal: AbortSignal | undefined;
    const localParseText = vi.fn().mockImplementation((_text, options) => {
      generationSignal = options.signal;
      return pendingIntent.promise;
    });
    render(
      <App
        providers={providerMap(
          { text: 'available', audio: 'unavailable' },
          { parseText: localParseText },
        )}
      />,
    );
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'ambient piano');
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    const minimize = screen.getByRole('button', {
      name: 'Minimize music discovery',
    });
    expect(minimize).toHaveTextContent('−');
    await user.click(minimize);

    const busyLauncher = screen.getByRole('button', {
      name: 'Creating suggestions… Open music discovery',
    });
    expect(busyLauncher).toHaveAttribute('aria-busy', 'true');
    expect(busyLauncher.querySelector('.loading-spinner')).not.toBeNull();
    expect(generationSignal?.aborted).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Creating suggestions…',
    );

    await act(async () => pendingIntent.resolve(localIntent('ambient piano')));
    const launcher = await screen.findByRole('button', {
      name: 'Open music discovery',
    });
    expect(launcher).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status')).toHaveTextContent(
      'Suggestions are ready for review.',
    );
    await user.click(launcher);

    expect(
      await screen.findByRole('heading', { name: 'Reasoned music routes' }),
    ).toBeVisible();
    expect(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
    ).toHaveValue('ambient piano');
  });

  it('preserves the draft and offers an explicit local retry after a recoverable failure', async () => {
    const user = userEvent.setup();
    let shouldFail = true;
    const localParseText = vi.fn().mockImplementation(() => {
      if (shouldFail) return Promise.reject(new Error('temporary model error'));
      return Promise.resolve(localIntent('ambient piano'));
    });
    const providers = providerMap(
      { text: 'available', audio: 'unavailable' },
      { parseText: localParseText },
    );
    const rulesParseText = vi.spyOn(providers.rules, 'parseText');
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'ambient piano');
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    expect(
      (
        await screen.findAllByText(/Local AI could not create this suggestion/)
      )[0],
    ).toBeVisible();
    expect(input).toHaveValue('ambient piano');
    expect(localParseText).toHaveBeenCalledOnce();
    expect(rulesParseText).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Retry local AI' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    ).toBeEnabled();

    shouldFail = false;
    await user.click(screen.getByRole('button', { name: 'Retry local AI' }));
    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    expect(localParseText).toHaveBeenCalledTimes(2);
    expect(rulesParseText).not.toHaveBeenCalled();
  });

  it('keeps capability recovery visible when generation and its recheck both fail', async () => {
    const user = userEvent.setup();
    let failCapabilities = false;
    const capabilities = vi.fn(() =>
      failCapabilities
        ? Promise.reject(new Error('capability failure'))
        : Promise.resolve<ProviderCapabilities>({
            text: 'available',
            audio: 'unavailable',
          }),
    );
    const providers = providerMap(
      { text: 'available', audio: 'unavailable' },
      {
        capabilities,
        parseText: vi.fn().mockImplementation(() => {
          failCapabilities = true;
          return Promise.reject(new Error('generation failure'));
        }),
      },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      'ambient piano',
    );
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    expect(
      (
        await screen.findAllByText(/Local AI could not create this suggestion/)
      )[0],
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Open Chrome AI status' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Use Guided discovery' }),
    ).toBeVisible();
  });

  it('shows one safe recovery card while Chrome reports unavailable and never prepares the model', async () => {
    const user = userEvent.setup();
    const providers = providerMap({
      text: 'unavailable',
      audio: 'unavailable',
    });
    render(<App providers={providers} />);
    await openDrawer(user);

    await screen.findByRole('button', { name: 'Check again' });
    expect(
      within(visibleLocalAiCard()).getByText(
        /Chrome currently reports local AI as unavailable/,
      ),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Check again' })).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Open Chrome AI status' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Use Guided discovery' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate search suggestions' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Check again' }));
    await waitFor(() =>
      expect(
        within(visibleLocalAiCard()).getByText(
          /Chrome currently reports local AI as unavailable/,
        ),
      ).toBeVisible(),
    );
    expect(providers['on-device'].prepare).not.toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'Open Chrome AI status' }),
    );
    expect(
      screen
        .getAllByText(/could not open its model manager automatically/)
        .filter((element) => !element.classList.contains('sr-only')),
    ).toHaveLength(1);

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Language' }),
      'es',
    );
    await screen.findByRole('button', { name: 'Comprobar de nuevo' });
    const settings = screen.getByRole('dialog', {
      name: 'Ajustes de descubrimiento',
    });
    expect(
      within(settings).getByText(/Chrome marca actualmente la IA local/),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Comprobar de nuevo' }),
    ).toBeVisible();
  });

  it('reacts to focus and visibility capability changes without a search', async () => {
    const user = userEvent.setup();
    let currentCapabilities: ProviderCapabilities = {
      text: 'unavailable',
      audio: 'unavailable',
    };
    const capabilities = vi.fn(() => Promise.resolve(currentCapabilities));
    const providers = providerMap(currentCapabilities, { capabilities });
    render(<App providers={providers} />);
    await openDrawer(user);
    expect(
      await screen.findByRole('button', { name: 'Check again' }),
    ).toBeVisible();

    currentCapabilities = {
      text: 'downloadable',
      audio: 'downloadable',
    };
    await act(async () => window.dispatchEvent(new Event('focus')));

    expect(
      await screen.findByRole('button', { name: 'Download local AI' }),
    ).toBeVisible();
    expect(providers['on-device'].prepare).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();

    currentCapabilities = {
      text: 'unavailable',
      audio: 'unavailable',
    };
    await act(async () =>
      document.dispatchEvent(new Event('visibilitychange')),
    );
    expect(
      await screen.findByRole('button', { name: 'Check again' }),
    ).toBeVisible();

    currentCapabilities = {
      text: 'downloadable',
      audio: 'downloadable',
    };
    await act(async () =>
      document.dispatchEvent(new Event('visibilitychange')),
    );
    expect(
      await screen.findByRole('button', { name: 'Download local AI' }),
    ).toBeVisible();
  });

  it('keeps ready controls and focus mounted during a background capability check', async () => {
    const user = userEvent.setup();
    const pendingRefresh = deferred<ProviderCapabilities>();
    const capabilities = vi
      .fn()
      .mockResolvedValueOnce({ text: 'available', audio: 'unavailable' })
      .mockReturnValueOnce(pendingRefresh.promise);
    render(
      <App
        providers={providerMap(
          { text: 'available', audio: 'unavailable' },
          { capabilities },
        )}
      />,
    );
    await openDrawer(user);
    const generate = await screen.findByRole('button', {
      name: 'Generate search suggestions',
    });
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      'ambient piano',
    );
    generate.focus();
    expect(generate).toHaveFocus();

    await act(async () => window.dispatchEvent(new Event('focus')));
    await waitFor(() => expect(capabilities).toHaveBeenCalledTimes(2));
    expect(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    ).toBe(generate);
    expect(generate).toHaveFocus();

    await act(async () => {
      pendingRefresh.resolve({ text: 'available', audio: 'unavailable' });
    });
    expect(generate).toHaveFocus();
  });

  it('deduplicates checks and ignores an older result after locale changes', async () => {
    const user = userEvent.setup();
    let finishOlder: ((value: ProviderCapabilities) => void) | undefined;
    let finishNewer: ((value: ProviderCapabilities) => void) | undefined;
    const capabilities = vi
      .fn()
      .mockImplementationOnce(
        () =>
          new Promise<ProviderCapabilities>((resolve) => {
            finishOlder = resolve;
          }),
      )
      .mockImplementationOnce(
        () =>
          new Promise<ProviderCapabilities>((resolve) => {
            finishNewer = resolve;
          }),
      );
    render(
      <App
        providers={providerMap(
          { text: 'unavailable', audio: 'unavailable' },
          { capabilities },
        )}
      />,
    );
    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(capabilities).toHaveBeenCalledOnce();

    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Language' }),
      'es',
    );
    await waitFor(() => expect(capabilities).toHaveBeenCalledTimes(2));
    await act(async () => {
      finishNewer?.({ text: 'downloadable', audio: 'downloadable' });
    });
    expect(
      await screen.findByRole('button', { name: 'Descargar IA local' }),
    ).toBeVisible();

    await act(async () => {
      finishOlder?.({ text: 'available', audio: 'available' });
    });
    expect(
      screen.getByRole('button', { name: 'Descargar IA local' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Usar micrófono' }),
    ).not.toBeInTheDocument();
  });

  it('preserves the draft and requires an explicit Rules action after local generation fails', async () => {
    const user = userEvent.setup();
    let currentCapabilities: ProviderCapabilities = {
      text: 'available',
      audio: 'available',
    };
    const capabilities = vi.fn(() => Promise.resolve(currentCapabilities));
    const localParseText = vi
      .fn()
      .mockResolvedValueOnce(localIntent('piano and trumpet'))
      .mockImplementationOnce(() => {
        currentCapabilities = {
          text: 'downloadable',
          audio: 'downloadable',
        };
        return Promise.reject(new Error('model was removed'));
      });
    const providers = providerMap(
      { text: 'available', audio: 'available' },
      {
        capabilities,
        parseText: localParseText,
      },
    );
    const rulesParseText = vi.spyOn(providers.rules, 'parseText');
    render(<App providers={providers} />);
    await openDrawer(user);
    expect(
      await screen.findByRole('button', { name: 'Use microphone' }),
    ).toBeVisible();
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      'piano and trumpet{Enter}',
    );

    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    expect(localParseText).toHaveBeenCalledOnce();

    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    expect(
      (
        await screen.findAllByText(/Local AI could not create this suggestion/)
      )[0],
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
    ).toHaveValue('piano and trumpet');
    expect(localParseText).toHaveBeenCalledTimes(2);
    expect(rulesParseText).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Download local AI' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: 'Generate search suggestions' }),
    ).not.toBeInTheDocument();
    expect(providers['on-device'].dispose).toHaveBeenCalled();

    await user.click(
      screen.getByRole('button', { name: 'Use Guided discovery' }),
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    expect(rulesParseText).toHaveBeenCalledOnce();

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    expect(
      screen.getByRole('combobox', { name: 'Discovery provider' }),
    ).toHaveValue('on-device');
    expect(
      screen.getAllByRole('button', { name: 'Download local AI' }).length,
    ).toBeGreaterThan(0);
  });
});
