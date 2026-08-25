import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frame/App';
import type { DiscoveryIntent } from '../../src/shared/types';
import {
  localIntent,
  deferred,
  providerMap,
  openDrawer,
  chooseRules,
} from './appTestUtils';

describe('Music discovery session', () => {
  it('creates guided suggestions with Enter and retains explicit Spotify confirmation', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'unavailable', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    await chooseRules(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'genre:classical piano or violin{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    expect(screen.getAllByText(/Spotify-supported/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Keyword-based/).length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('button', { name: /^Search for .* in Spotify$/ })[0],
    ).toBeVisible();
    expect(
      screen.queryByRole('button', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();
  });

  it('restores generated suggestions when Clear all is undone', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'unavailable', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    await chooseRules(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'genre:classical piano or violin{Enter}');
    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    const searchButtonCount = screen.getAllByRole('button', {
      name: /^Search for .* in Spotify$/,
    }).length;

    await user.click(screen.getByRole('button', { name: 'Clear all' }));
    expect(input).toHaveValue('');
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(input).toHaveValue('genre:classical piano or violin');
    expect(
      screen.getByRole('heading', { name: 'Reasoned music routes' }),
    ).toBeVisible();
    expect(
      screen.getAllByRole('button', { name: /^Search for .* in Spotify$/ }),
    ).toHaveLength(searchButtonCount);
    expect(
      screen.queryByRole('button', { name: 'Undo' }),
    ).not.toBeInTheDocument();
  });

  it('uses Shift+Enter for a newline without generating', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'unavailable', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    await chooseRules(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'piano{Shift>}{Enter}{/Shift}violin');
    expect(input).toHaveValue('piano\nviolin');
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();
  });

  it('prevents repeated Enter submissions while generation is pending', async () => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    const parseText = vi.fn().mockReturnValue(pendingIntent.promise);
    render(
      <App
        providers={providerMap(
          { text: 'available', audio: 'unavailable' },
          { parseText },
        )}
      />,
    );
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'ambient piano');
    fireEvent.keyDown(input, { key: 'Enter' });
    fireEvent.keyDown(input, { key: 'Enter' });

    expect(parseText).toHaveBeenCalledOnce();
    expect(input).toHaveValue('ambient piano');
    expect(
      screen.getByRole('button', { name: 'Creating suggestions…' }),
    ).toBeDisabled();

    await act(async () => pendingIntent.resolve(localIntent('ambient piano')));
    expect(
      await screen.findByRole('heading', { name: 'Reasoned music routes' }),
    ).toBeVisible();
  });

  it('requires a frequency clarification before showing candidates', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'unavailable', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    await chooseRules(user);
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      '432 Hz with piano{Enter}',
    );
    expect(
      await screen.findByRole('heading', {
        name: 'What does 432 Hz mean here?',
      }),
    ).toBeVisible();
    await user.click(
      screen.getByRole('button', { name: 'A4 tuning reference' }),
    );
    expect(
      screen.getByRole('heading', { name: 'Reasoned music routes' }),
    ).toBeVisible();
  });

  it('treats a valid local-AI intent with no usable query as recoverable', async () => {
    const user = userEvent.setup();
    const emptyIntent: DiscoveryIntent = {
      target: 'mixed',
      locale: 'en',
      mode: 'ai',
      interpretation: 'No confident route was produced.',
      nativeFilters: {},
      freeTextTerms: [],
      traitGroups: [],
      routes: [],
    };
    const providers = providerMap(
      { text: 'available', audio: 'unavailable' },
      { parseText: vi.fn().mockResolvedValue(emptyIntent) },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      'obscure request',
    );
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    expect(
      await screen.findByRole('button', { name: 'Retry local AI' }),
    ).toBeVisible();
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent(
      'Local AI could not create this suggestion',
    );
  });

  it.each([
    {
      name: 'editing the request',
      mutate: async (user: ReturnType<typeof userEvent.setup>) => {
        await user.type(
          screen.getByRole('textbox', {
            name: 'Describe the music you want to find',
          }),
          ' revised',
        );
      },
    },
    {
      name: 'toggling a filter',
      mutate: async (user: ReturnType<typeof userEvent.setup>) => {
        await user.click(screen.getByRole('button', { name: 'Piano' }));
      },
    },
    {
      name: 'changing provider',
      mutate: async (user: ReturnType<typeof userEvent.setup>) => {
        await user.click(screen.getByRole('button', { name: 'Open settings' }));
        await user.selectOptions(
          screen.getByRole('combobox', { name: 'Discovery provider' }),
          'rules',
        );
      },
    },
    {
      name: 'changing locale',
      mutate: async (user: ReturnType<typeof userEvent.setup>) => {
        await user.click(screen.getByRole('button', { name: 'Open settings' }));
        await user.selectOptions(
          screen.getByRole('combobox', { name: 'Language' }),
          'es',
        );
      },
    },
  ])('invalidates delayed generation after $name', async ({ mutate }) => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    let generationSignal: AbortSignal | undefined;
    const parseText = vi.fn().mockImplementation((_text, options) => {
      generationSignal = options.signal;
      return pendingIntent.promise;
    });
    render(
      <App
        providers={providerMap(
          { text: 'available', audio: 'unavailable' },
          { parseText },
        )}
      />,
    );
    await openDrawer(user);
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      '432 Hz piano',
    );
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    await mutate(user);
    expect(generationSignal?.aborted).toBe(true);
    await act(async () =>
      pendingIntent.resolve({
        ...localIntent('stale'),
        routes: [],
        clarification: {
          id: 'frequency-meaning',
          frequency: 432,
          options: ['tuning', 'tone'],
        },
      }),
    );

    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: /432 Hz/ }),
    ).not.toBeInTheDocument();
  });

  it('keeps Clear all authoritative over delayed generation and Undo coherent', async () => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    const parseText = vi.fn().mockReturnValue(pendingIntent.promise);
    render(
      <App
        providers={providerMap(
          { text: 'available', audio: 'unavailable' },
          { parseText },
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
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    await act(async () => pendingIntent.resolve(localIntent('stale result')));
    expect(input).toHaveValue('');
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(input).toHaveValue('ambient piano');
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();
  });

  it('groups reasoned recommendations and searches primaries and examples independently', async () => {
    const user = userEvent.setup();
    const reasonedIntent: DiscoveryIntent = {
      target: 'artist',
      locale: 'en',
      mode: 'ai',
      interpretation:
        'Find artists where piano and bass contribute to melodic arrangements.',
      nativeFilters: {},
      freeTextTerms: ['piano bass melody'],
      traitGroups: [],
      routes: [
        {
          title: 'Contemporary piano trios',
          rationale: 'Piano and bass can exchange melodic roles in a trio.',
          queryTerms: ['piano trio melodic bass'],
          recommendations: ['GoGo Penguin', 'Avishai Cohen', 'EST'].map(
            (name, index) => ({
              type: 'artist' as const,
              name,
              explanation: `Specific trio fit ${index + 1}.`,
              evidence: 'ai-suggested' as const,
              examples:
                index === 0
                  ? [
                      {
                        type: 'track' as const,
                        name: 'Hopopono',
                        artist: 'GoGo Penguin',
                      },
                    ]
                  : [],
            }),
          ),
        },
        {
          title: 'Piano-led soul and pop',
          rationale:
            'A contrasting route with voice, piano, and clear bass lines.',
          queryTerms: ['piano-led soul melodic bass'],
          recommendations: ['Alicia Keys', 'Norah Jones', 'Sara Bareilles'].map(
            (name, index) => ({
              type: 'artist' as const,
              name,
              explanation: `Specific vocal arrangement fit ${index + 1}.`,
              evidence: 'ai-suggested' as const,
              examples: [],
            }),
          ),
        },
      ],
    };
    const providers = providerMap(
      { text: 'available', audio: 'unavailable' },
      { parseText: vi.fn().mockResolvedValue(reasonedIntent) },
    );
    const postMessage = vi.spyOn(window, 'postMessage');
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      'artists with piano, bass and melody',
    );
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );

    expect(
      await screen.findByRole('heading', {
        level: 3,
        name: 'Contemporary piano trios',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('heading', {
        level: 3,
        name: 'Piano-led soul and pop',
      }),
    ).toBeVisible();
    expect(screen.getAllByRole('heading', { level: 4 })).toHaveLength(6);
    expect(screen.getByText('Specific trio fit 1.')).toBeVisible();
    expect(screen.getAllByText(/AI-suggested/)).toHaveLength(6);
    expect(screen.getByText('Start with')).toBeVisible();
    expect(
      screen.getByRole('button', {
        name: 'Search for GoGo Penguin in Spotify',
      }),
    ).toHaveTextContent('Search GoGo Penguin');
    expect(screen.getAllByText('Hopopono — GoGo Penguin')).toHaveLength(1);

    postMessage.mockClear();
    await user.click(
      screen.getByRole('button', {
        name: 'Search for GoGo Penguin in Spotify',
      }),
    );
    expect(postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'search',
        query: 'GoGo Penguin',
      }),
      expect.any(String),
    );
    await user.click(
      screen.getByRole('button', {
        name: 'Search for Hopopono — GoGo Penguin in Spotify',
      }),
    );
    expect(postMessage).toHaveBeenLastCalledWith(
      expect.objectContaining({
        type: 'search',
        query: 'Hopopono — GoGo Penguin',
      }),
      expect.any(String),
    );
    postMessage.mockRestore();
  });

  it('shows the same loader while Rules creates suggestions', async () => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    const providers = providerMap({
      text: 'unavailable',
      audio: 'unavailable',
    });
    const rulesParseText = vi
      .spyOn(providers.rules, 'parseText')
      .mockReturnValue(pendingIntent.promise);
    render(<App providers={providers} />);
    await openDrawer(user);
    await chooseRules(user);
    await user.type(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
      'jazz trumpet',
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
    expect(rulesParseText).toHaveBeenCalledOnce();

    pendingIntent.resolve(localIntent('jazz trumpet'));
    expect(
      await screen.findByRole('heading', {
        name: 'Reasoned music routes',
      }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    ).toBeEnabled();
  });
});
