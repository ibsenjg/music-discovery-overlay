import { act, fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frame/App';
import type {
  DiscoveryIntent,
  ProviderCapabilities,
} from '../../src/shared/types';
import {
  localIntent,
  deferred,
  installVoiceMocks,
  providerMap,
  openDrawer,
} from './appTestUtils';

describe('Voice capture', () => {
  it('discloses local processing before requesting microphone permission', async () => {
    const user = userEvent.setup();
    const getUserMedia = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: { getUserMedia },
    });
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'available' })}
      />,
    );
    await openDrawer(user);
    const microphone = await screen.findByRole('button', {
      name: 'Use microphone',
    });
    await user.click(microphone);
    const consent = screen.getByRole('dialog', { name: 'Use microphone' });
    expect(consent).toHaveAttribute('aria-modal', 'true');
    expect(
      screen.getByText(/Audio is processed locally and is not saved/),
    ).toBeVisible();
    const allow = screen.getByRole('button', { name: 'Allow and start' });
    const cancel = screen.getByRole('button', { name: 'Cancel' });
    expect(allow).toHaveFocus();
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(cancel).toHaveFocus();
    await user.keyboard('{Tab}');
    expect(allow).toHaveFocus();
    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();
    expect(microphone).toHaveFocus();
    expect(getUserMedia).not.toHaveBeenCalled();
  });

  it('closes the microphone modal before an open settings surface on Escape', async () => {
    const user = userEvent.setup();
    installVoiceMocks();
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'available' })}
      />,
    );
    await openDrawer(user);
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    fireEvent.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    expect(
      screen.getByRole('dialog', { name: 'Use microphone' }),
    ).toBeVisible();
    expect(
      screen.getByRole('dialog', { name: 'Discovery settings' }),
    ).toBeVisible();

    await user.keyboard('{Escape}');
    expect(
      screen.queryByRole('dialog', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole('dialog', { name: 'Discovery settings' }),
    ).toBeVisible();
    vi.unstubAllGlobals();
  });

  it('invalidates a pending permission request when minimized and ignores repeat activation', async () => {
    const user = userEvent.setup();
    const pendingStream = deferred<MediaStream>();
    const voice = installVoiceMocks({
      getUserMedia: vi.fn().mockReturnValue(pendingStream.promise),
    });
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'available' })}
      />,
    );
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    const requesting = screen.getByRole('button', {
      name: 'Requesting microphone access…',
    });
    expect(requesting).toBeDisabled();
    fireEvent.click(requesting);
    expect(voice.getUserMedia).toHaveBeenCalledOnce();

    await user.click(
      screen.getByRole('button', { name: 'Minimize music discovery' }),
    );
    await act(async () => pendingStream.resolve(voice.stream));

    expect(voice.stopTrack).toHaveBeenCalledOnce();
    expect(voice.recorders).toHaveLength(0);
    expect(
      screen.getByRole('button', { name: 'Open music discovery' }),
    ).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.click(
      screen.getByRole('button', { name: 'Open music discovery' }),
    );
    expect(
      screen.queryByText('Requesting microphone access…'),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('stops a stream that resolves after unmounting during permission', async () => {
    const user = userEvent.setup();
    const pendingStream = deferred<MediaStream>();
    const voice = installVoiceMocks({
      getUserMedia: vi.fn().mockReturnValue(pendingStream.promise),
    });
    const { unmount } = render(
      <App
        providers={providerMap({ text: 'available', audio: 'available' })}
      />,
    );
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    expect(voice.getUserMedia).toHaveBeenCalledOnce();

    unmount();
    await act(async () => pendingStream.resolve(voice.stream));

    expect(voice.stopTrack).toHaveBeenCalledOnce();
    expect(voice.recorders).toHaveLength(0);
    vi.unstubAllGlobals();
  });

  it('invalidates a pending permission request when the provider changes', async () => {
    const user = userEvent.setup();
    const pendingStream = deferred<MediaStream>();
    const voice = installVoiceMocks({
      getUserMedia: vi.fn().mockReturnValue(pendingStream.promise),
    });
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'available' })}
      />,
    );
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await user.click(screen.getByRole('button', { name: 'Open settings' }));
    await user.selectOptions(
      screen.getByRole('combobox', { name: 'Discovery provider' }),
      'rules',
    );

    await act(async () => pendingStream.resolve(voice.stream));
    expect(voice.stopTrack).toHaveBeenCalledOnce();
    expect(voice.recorders).toHaveLength(0);
    expect(
      screen.getByRole('combobox', { name: 'Discovery provider' }),
    ).toHaveValue('rules');
    vi.unstubAllGlobals();
  });

  it('invalidates a pending permission request when capability becomes unavailable', async () => {
    const user = userEvent.setup();
    const pendingStream = deferred<MediaStream>();
    const voice = installVoiceMocks({
      getUserMedia: vi.fn().mockReturnValue(pendingStream.promise),
    });
    let capabilities: ProviderCapabilities = {
      text: 'available',
      audio: 'available',
    };
    const providers = providerMap(capabilities, {
      capabilities: vi.fn(() => Promise.resolve(capabilities)),
    });
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));

    capabilities = { text: 'unavailable', audio: 'unavailable' };
    await act(async () => window.dispatchEvent(new Event('focus')));
    await screen.findByRole('button', { name: 'Check again' });
    await act(async () => pendingStream.resolve(voice.stream));

    expect(voice.stopTrack).toHaveBeenCalledOnce();
    expect(voice.recorders).toHaveLength(0);
    expect(
      screen.queryByRole('button', { name: 'Use microphone' }),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('cancels pending permission when the user edits the draft', async () => {
    const user = userEvent.setup();
    const pendingStream = deferred<MediaStream>();
    const voice = installVoiceMocks({
      getUserMedia: vi.fn().mockReturnValue(pendingStream.promise),
    });
    const providers = providerMap({ text: 'available', audio: 'available' });
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'original draft');
    await user.click(screen.getByRole('button', { name: 'Use microphone' }));
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await user.clear(input);
    await user.type(input, 'edited draft');
    await act(async () => pendingStream.resolve(voice.stream));

    expect(input).toHaveValue('edited draft');
    expect(voice.stopTrack).toHaveBeenCalledOnce();
    expect(voice.recorders).toHaveLength(0);
    expect(providers['on-device'].parseAudio).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('stops an active recording when the user edits the draft', async () => {
    const user = userEvent.setup();
    const voice = installVoiceMocks();
    const providers = providerMap({ text: 'available', audio: 'available' });
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'original draft');
    await user.click(screen.getByRole('button', { name: 'Use microphone' }));
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await screen.findByRole('button', { name: 'Stop recording' });
    await user.clear(input);
    await user.type(input, 'edited draft');

    expect(input).toHaveValue('edited draft');
    expect(voice.stopTrack).toHaveBeenCalledOnce();
    expect(providers['on-device'].parseAudio).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Use microphone' }),
    ).toBeEnabled();
    vi.unstubAllGlobals();
  });

  it('keeps the active microphone control visible during a capability refresh', async () => {
    const user = userEvent.setup();
    const voice = installVoiceMocks();
    const delayedCapabilities = deferred<ProviderCapabilities>();
    let delayNextCheck = false;
    const capabilities = vi.fn(() =>
      delayNextCheck
        ? delayedCapabilities.promise
        : Promise.resolve<ProviderCapabilities>({
            text: 'available',
            audio: 'available',
          }),
    );
    render(
      <App
        providers={providerMap(
          { text: 'available', audio: 'available' },
          { capabilities },
        )}
      />,
    );
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    const stop = await screen.findByRole('button', { name: 'Stop recording' });
    expect(stop).toHaveFocus();

    delayNextCheck = true;
    await act(async () => window.dispatchEvent(new Event('focus')));
    expect(
      screen.getByRole('button', { name: 'Stop recording' }),
    ).toBeVisible();
    delayedCapabilities.resolve({ text: 'available', audio: 'available' });
    await act(async () => delayedCapabilities.promise);
    await user.click(
      screen.getByRole('button', { name: 'Minimize music discovery' }),
    );
    expect(voice.stopTrack).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('blocks Enter during permission and recording without changing the draft', async () => {
    const user = userEvent.setup();
    const pendingStream = deferred<MediaStream>();
    const voice = installVoiceMocks({
      getUserMedia: vi.fn().mockReturnValue(pendingStream.promise),
    });
    const parseText = vi.fn().mockResolvedValue(localIntent('unused'));
    render(
      <App
        providers={providerMap(
          { text: 'available', audio: 'available' },
          { parseText },
        )}
      />,
    );
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'piano draft');
    await user.click(screen.getByRole('button', { name: 'Use microphone' }));
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('piano draft');
    expect(parseText).not.toHaveBeenCalled();

    await act(async () => pendingStream.resolve(voice.stream));
    await screen.findByRole('button', { name: 'Stop recording' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(input).toHaveValue('piano draft');
    expect(parseText).not.toHaveBeenCalled();
    await user.click(
      screen.getByRole('button', { name: 'Minimize music discovery' }),
    );
    vi.unstubAllGlobals();
  });

  it('cleans up a recorder error without starting transcription', async () => {
    const user = userEvent.setup();
    const clearTimeout = vi.spyOn(window, 'clearTimeout');
    const voice = installVoiceMocks();
    const providers = providerMap({ text: 'available', audio: 'available' });
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await screen.findByRole('button', { name: 'Stop recording' });

    await act(async () => voice.recorders[0]?.onerror?.(new Event('error')));

    expect(voice.stopTrack).toHaveBeenCalledOnce();
    expect(clearTimeout).toHaveBeenCalled();
    expect(providers['on-device'].parseAudio).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Use microphone' }),
    ).toBeEnabled();
    clearTimeout.mockRestore();
    vi.unstubAllGlobals();
  });

  it('shows distinct permission-denied copy after consent', async () => {
    const user = userEvent.setup();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi
          .fn()
          .mockRejectedValue(
            Object.assign(new Error('denied'), { name: 'NotAllowedError' }),
          ),
      },
    });
    vi.stubGlobal(
      'MediaRecorder',
      class {
        readonly state = 'inactive';
      },
    );
    render(
      <App
        providers={providerMap({ text: 'available', audio: 'available' })}
      />,
    );
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    expect(
      (await screen.findAllByText(/Microphone permission was denied/))[0],
    ).toBeVisible();
    expect(
      screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      }),
    ).toHaveFocus();
    vi.unstubAllGlobals();
  });

  it('stops tracks and adds transcript-only audio as an editable draft', async () => {
    const user = userEvent.setup();
    const pendingTranscript = deferred<{ transcript: string }>();
    let transcriptionSignal: AbortSignal | undefined;
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
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
        this.ondataavailable?.({ data: new Blob(['voice']) });
        this.onstop?.();
      }
    }
    vi.stubGlobal('MediaRecorder', Recorder);
    const providers = providerMap(
      { text: 'available', audio: 'available' },
      {
        parseAudio: vi.fn().mockImplementation((_audio, options) => {
          transcriptionSignal = options.signal;
          return pendingTranscript.promise;
        }),
      },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await user.click(
      await screen.findByRole('button', { name: 'Stop recording' }),
    );
    const transcribingButton = screen.getByRole('button', {
      name: 'Transcribing locally…',
    });
    expect(transcribingButton).toBeDisabled();
    expect(transcribingButton).toHaveAttribute('aria-busy', 'true');
    expect(transcribingButton.querySelector('.loading-spinner')).not.toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'Minimize music discovery' }),
    );
    const busyLauncher = screen.getByRole('button', {
      name: 'Transcribing locally… Open music discovery',
    });
    expect(busyLauncher).toHaveAttribute('aria-busy', 'true');
    expect(transcriptionSignal?.aborted).toBe(false);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Transcribing locally…',
    );

    await act(async () =>
      pendingTranscript.resolve({ transcript: 'piano and violin' }),
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Transcript added as a draft. Review it, then generate suggestions.',
    );
    await user.click(
      await screen.findByRole('button', { name: 'Open music discovery' }),
    );
    expect(await screen.findByDisplayValue('piano and violin')).toBeVisible();
    expect(providers['on-device'].parseAudio).toHaveBeenCalledOnce();
    expect(providers['on-device'].parseText).not.toHaveBeenCalled();
    expect(stopTrack).toHaveBeenCalledOnce();
    const restoredMicrophone = screen.getByRole('button', {
      name: 'Use microphone',
    });
    expect(restoredMicrophone).toBeEnabled();
    expect(restoredMicrophone).not.toHaveAttribute('aria-busy');
    expect(restoredMicrophone.querySelector('.loading-spinner')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('preserves the existing draft when local transcription detects no speech', async () => {
    const user = userEvent.setup();
    installVoiceMocks();
    const noSpeechError = Object.assign(new Error('No speech was detected'), {
      name: 'NoSpeechError',
    });
    const providers = providerMap(
      { text: 'available', audio: 'available' },
      { parseAudio: vi.fn().mockRejectedValue(noSpeechError) },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'existing piano draft');
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await user.click(
      await screen.findByRole('button', { name: 'Stop recording' }),
    );

    expect(
      (
        await screen.findAllByText(
          'No speech was detected. Your existing draft was left unchanged.',
        )
      )[0],
    ).toBeVisible();
    expect(input).toHaveValue('existing piano draft');
    expect(providers['on-device'].dispose).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Use microphone' }),
    ).toBeEnabled();
    vi.unstubAllGlobals();
  });

  it('ignores a stale no-speech result after Clear all cancels transcription', async () => {
    const user = userEvent.setup();
    const pendingTranscript = deferred<{ transcript: string }>();
    installVoiceMocks();
    const providers = providerMap(
      { text: 'available', audio: 'available' },
      { parseAudio: vi.fn().mockReturnValue(pendingTranscript.promise) },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'draft to clear');
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await user.click(
      await screen.findByRole('button', { name: 'Stop recording' }),
    );
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    await act(async () => {
      pendingTranscript.reject(
        Object.assign(new Error('No speech was detected'), {
          name: 'NoSpeechError',
        }),
      );
      try {
        await pendingTranscript.promise;
      } catch {
        // The App owns and handles this provider rejection.
      }
    });

    expect(input).toHaveValue('');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();
    expect(
      screen.queryByText(
        'No speech was detected. Your existing draft was left unchanged.',
      ),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('keeps Clear all authoritative over delayed transcription and Undo coherent', async () => {
    const user = userEvent.setup();
    const pendingTranscript = deferred<{ transcript: string }>();
    installVoiceMocks();
    const providers = providerMap(
      { text: 'available', audio: 'available' },
      { parseAudio: vi.fn().mockReturnValue(pendingTranscript.promise) },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'existing draft');
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    await user.click(
      await screen.findByRole('button', { name: 'Stop recording' }),
    );
    await user.click(screen.getByRole('button', { name: 'Clear all' }));

    await act(async () =>
      pendingTranscript.resolve({ transcript: 'stale transcript' }),
    );
    expect(input).toHaveValue('');
    expect(
      screen.queryByDisplayValue('stale transcript'),
    ).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Undo' }));
    expect(input).toHaveValue('existing draft');
    expect(providers['on-device'].parseText).not.toHaveBeenCalled();
    vi.unstubAllGlobals();
  });

  it('stops an active microphone recording when the drawer is minimized', async () => {
    const user = userEvent.setup();
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
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
        this.ondataavailable?.({ data: new Blob(['voice']) });
        this.onstop?.();
      }
    }
    vi.stubGlobal('MediaRecorder', Recorder);
    const providers = providerMap({ text: 'available', audio: 'available' });
    render(<App providers={providers} />);
    await openDrawer(user);
    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    expect(
      await screen.findByRole('button', { name: 'Stop recording' }),
    ).toBeVisible();

    await user.click(
      screen.getByRole('button', { name: 'Minimize music discovery' }),
    );

    expect(stopTrack).toHaveBeenCalledOnce();
    expect(providers['on-device'].parseAudio).not.toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Open music discovery' }),
    ).not.toHaveAttribute('aria-busy');
    expect(screen.getByRole('status')).toBeEmptyDOMElement();

    await user.click(
      screen.getByRole('button', { name: 'Open music discovery' }),
    );
    expect(
      screen.queryByText('Recording locally · 30 second limit'),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });

  it('cancels stale suggestion generation when a new recording starts', async () => {
    const user = userEvent.setup();
    const pendingIntent = deferred<DiscoveryIntent>();
    let generationSignal: AbortSignal | undefined;
    const localParseText = vi.fn().mockImplementation((_text, options) => {
      generationSignal = options.signal;
      return pendingIntent.promise;
    });
    const stopTrack = vi.fn();
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({
          getTracks: () => [{ stop: stopTrack }],
        }),
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
        this.ondataavailable?.({ data: new Blob(['voice']) });
        this.onstop?.();
      }
    }
    vi.stubGlobal('MediaRecorder', Recorder);
    const providers = providerMap(
      { text: 'available', audio: 'available' },
      { parseText: localParseText },
    );
    render(<App providers={providers} />);
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await user.type(input, 'old piano request');
    await user.click(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    );
    expect(
      screen.getByRole('button', { name: 'Creating suggestions…' }),
    ).toBeDisabled();

    await user.click(
      await screen.findByRole('button', { name: 'Use microphone' }),
    );
    await user.click(screen.getByRole('button', { name: 'Allow and start' }));
    expect(
      await screen.findByRole('button', { name: 'Stop recording' }),
    ).toBeVisible();
    expect(generationSignal?.aborted).toBe(true);
    expect(
      screen.queryByRole('button', { name: 'Creating suggestions…' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();

    await act(async () => pendingIntent.resolve(localIntent('stale result')));
    expect(
      screen.queryByRole('heading', { name: 'Reasoned music routes' }),
    ).not.toBeInTheDocument();
    expect(input).toHaveValue('old piano request');

    await user.click(screen.getByRole('button', { name: 'Stop recording' }));
    expect(await screen.findByDisplayValue('piano and violin')).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Generate search suggestions' }),
    ).toBeEnabled();
    expect(providers['on-device'].parseAudio).toHaveBeenCalledOnce();
    vi.unstubAllGlobals();
  });

  it('automatically stops a recording at the 30 second limit', async () => {
    const timeoutSpy = vi.spyOn(window, 'setTimeout');
    try {
      const user = userEvent.setup();
      const stopTrack = vi.fn();
      Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: {
          getUserMedia: vi.fn().mockResolvedValue({
            getTracks: () => [{ stop: stopTrack }],
          }),
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
          this.ondataavailable?.({ data: new Blob(['voice']) });
          this.onstop?.();
        }
      }
      vi.stubGlobal('MediaRecorder', Recorder);
      render(
        <App
          providers={providerMap({ text: 'available', audio: 'available' })}
        />,
      );
      await openDrawer(user);
      await user.click(
        await screen.findByRole('button', { name: 'Use microphone' }),
      );
      await user.click(screen.getByRole('button', { name: 'Allow and start' }));
      const timeoutCall = timeoutSpy.mock.calls.find(
        (call) => call[1] === 30_000,
      );
      expect(timeoutCall).toBeDefined();
      const callback = timeoutCall?.[0];
      if (typeof callback !== 'function')
        throw new Error('Recording timeout missing');
      await act(async () => callback());
      expect(stopTrack).toHaveBeenCalledOnce();
      expect(
        screen.queryByRole('button', { name: 'Stop recording' }),
      ).not.toBeInTheDocument();
    } finally {
      timeoutSpy.mockRestore();
      vi.unstubAllGlobals();
    }
  });
});
