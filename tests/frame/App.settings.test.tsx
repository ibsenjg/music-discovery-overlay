import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frame/App';
import type { DiscoveryIntent } from '../../src/shared/types';
import {
  localIntent,
  deferred,
  visibleLocalAiCard,
  providerMap,
  openDrawer,
} from './appTestUtils';

describe('Discovery settings', () => {
  it('opens settings, closes it with Escape, and restores focus to plus', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    const settings = screen.getByRole('button', { name: 'Open settings' });
    await user.click(settings);
    expect(
      screen.getByRole('dialog', { name: 'Discovery settings' }),
    ).toBeVisible();
    expect(screen.getByRole('combobox', { name: 'Language' })).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Discovery settings' }),
    ).not.toBeInTheDocument();
    expect(settings).toHaveFocus();
  });

  it('defaults to Aurora and switches accessible themes', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'unavailable' })}
      />,
    );

    expect(document.documentElement).toHaveAttribute('data-theme', 'aurora');
    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const settings = screen.getByRole('dialog', {
      name: 'Discovery settings',
    });
    await waitFor(() =>
      expect(
        within(settings).getByText(
          'Local AI is ready for text. Microphone input needs compatible GPU audio support.',
        ),
      ).toBeVisible(),
    );

    const themeGroup = within(settings).getByRole('group', { name: 'Theme' });
    expect(
      within(themeGroup).getByRole('radio', { name: /Aurora/ }),
    ).toBeChecked();

    await user.click(within(themeGroup).getByRole('radio', { name: /Pulse/ }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'pulse');

    await user.click(
      within(themeGroup).getByRole('radio', { name: /Nightwave/ }),
    );
    expect(document.documentElement).toHaveAttribute('data-theme', 'nightwave');
  });

  it('offers distinct tuning references and exploratory tone filters', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'unavailable', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    const soundFilters = screen.getByRole('group', {
      name: 'Tuning, tones and production',
    });

    for (const label of [
      '415 Hz · Baroque tuning',
      '430 Hz · Classical tuning',
      '432 Hz · Alt tuning',
      '440 Hz · Standard tuning',
      '442 Hz · Orchestral tuning',
      '111 Hz · Tone',
      '174 Hz · Tone',
      '285 Hz · Tone',
      '396 Hz · Tone',
      '417 Hz · Tone',
      '432 Hz · Tone',
      '528 Hz · Tone',
      '639 Hz · Tone',
      '741 Hz · Tone',
      '852 Hz · Tone',
      '963 Hz · Tone',
    ]) {
      expect(
        within(soundFilters).getByRole('button', { name: label }),
      ).toBeVisible();
    }
  });

  it('releases the active session and resets displayed usage', async () => {
    const user = userEvent.setup();
    const providers = providerMap({ text: 'available', audio: 'unavailable' });
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await user.click(
      await screen.findByRole('button', { name: 'Release active AI session' }),
    );
    expect(providers['on-device'].dispose).toHaveBeenCalledOnce();
    expect(
      screen.getByText(/Chrome manages the shared downloaded model files/),
    ).toBeVisible();
  });

  it('uses one canonical live status without nesting live semantics in cards', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);

    expect(screen.getAllByRole('status')).toHaveLength(1);
    expect(
      visibleLocalAiCard().querySelectorAll('[aria-live], [role="status"]'),
    ).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await user.click(
      await screen.findByRole('button', { name: 'Release active AI session' }),
    );
    const visibleNotice =
      document.querySelector<HTMLElement>('.visible-status');
    expect(visibleNotice).not.toBeNull();
    expect(visibleNotice?.matches('[aria-live], [role="status"]')).toBe(false);

    const remove = await screen.findByRole('button', {
      name: 'Remove downloaded local AI…',
    });
    await user.click(remove);
    const settings = screen.getByRole('dialog', {
      name: 'Discovery settings',
    });
    expect(
      settings.querySelectorAll(
        '.model-removal-panel [aria-live], .model-removal-panel [role="status"]',
      ),
    ).toHaveLength(0);
    expect(screen.getAllByRole('status')).toHaveLength(1);
  });

  it('cancels active generation and releases sessions before opening Chrome’s model manager', async () => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    let generationSignal: AbortSignal | undefined;
    const providers = providerMap(
      { text: 'available', audio: 'unavailable' },
      {
        parseText: vi.fn().mockImplementation((_text, options) => {
          generationSignal = options.signal;
          return pendingIntent.promise;
        }),
      },
    );
    const createTab = vi.fn().mockResolvedValue({});
    vi.stubGlobal('chrome', { tabs: { create: createTab } });

    try {
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
      await user.click(screen.getByRole('button', { name: 'Open settings' }));
      await user.click(
        await screen.findByRole('button', {
          name: 'Remove downloaded local AI…',
        }),
      );
      await user.click(
        screen.getByRole('button', {
          name: 'Open Chrome AI model manager',
        }),
      );

      expect(generationSignal?.aborted).toBe(true);
      expect(providers['on-device'].dispose).toHaveBeenCalledOnce();
      expect(createTab).toHaveBeenCalledWith({
        url: 'chrome://on-device-internals',
      });
      await act(async () =>
        pendingIntent.resolve(localIntent('ambient piano')),
      );
      expect(
        screen.queryByRole('heading', { name: 'Reasoned music routes' }),
      ).not.toBeInTheDocument();
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('opens the shared-model removal flow with one restart-based completion path', async () => {
    const user = userEvent.setup();
    const providers = providerMap({
      text: 'available',
      audio: 'unavailable',
    });
    const createTab = vi.fn().mockResolvedValue({});
    vi.stubGlobal('chrome', { tabs: { create: createTab } });

    try {
      render(<App providers={providers} />);
      await openDrawer(user);
      await user.click(screen.getByRole('button', { name: 'Open settings' }));
      const remove = await screen.findByRole('button', {
        name: 'Remove downloaded local AI…',
      });
      await user.click(remove);
      expect(
        screen.queryByRole('button', {
          name: 'Remove downloaded local AI…',
        }),
      ).not.toBeInTheDocument();

      expect(
        screen.getByRole('heading', {
          level: 4,
          name: 'Remove local AI from Chrome',
        }),
      ).toBeVisible();
      expect(
        screen.getByText(/affects every site and extension/),
      ).toBeVisible();
      expect(
        screen.getByText(/Quit Chrome completely using its Quit command/),
      ).toBeVisible();
      expect(
        screen.queryByRole('button', { name: 'Refresh local AI status' }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', {
          name: 'Reload overlay and check again',
        }),
      ).not.toBeInTheDocument();
      const openManager = screen.getByRole('button', {
        name: 'Open Chrome AI model manager',
      });
      expect(openManager).toHaveFocus();
      await user.click(openManager);
      expect(createTab).toHaveBeenCalledWith({
        url: 'chrome://on-device-internals',
      });
      expect(providers['on-device'].dispose).toHaveBeenCalledOnce();
      expect(
        screen.getAllByText(
          /Remove the model in Broker State, then quit Chrome completely and reopen it/,
        ).length,
      ).toBeGreaterThan(0);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps a manual Chrome address fallback and restores focus when removal is cancelled with Escape', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    const remove = await screen.findByRole('button', {
      name: 'Remove downloaded local AI…',
    });
    await user.click(remove);
    expect(screen.getByText('chrome://on-device-internals')).toBeVisible();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('heading', {
        level: 4,
        name: 'Remove local AI from Chrome',
      }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Remove downloaded local AI…' }),
    ).toHaveFocus();
  });

  it('closes settings on outside activation and switches visible controls to Spanish', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Language' }),
      'es',
    );
    expect(
      screen.getByRole('heading', {
        level: 1,
        name: 'Descubre música a tu manera',
      }),
    ).toBeVisible();
    fireEvent.pointerDown(
      screen.getByRole('heading', { name: 'Categorías de filtros' }),
    );
    expect(
      screen.queryByRole('dialog', { name: 'Ajustes de descubrimiento' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Generar sugerencias de búsqueda' }),
    ).toBeVisible();
  });
});
