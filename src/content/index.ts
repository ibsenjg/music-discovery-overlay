import { isFrameToContentMessage } from '../shared/messageValidation';
import { SpotifySearchAdapter } from './spotifySearchAdapter';

const HOST_ID = 'music-discovery-overlay-host';

interface ActiveOverlay {
  host: HTMLDivElement;
  cleanup(): void;
}

let activeOverlay: ActiveOverlay | undefined;

export function mountMusicDiscoveryOverlay(): void {
  if (activeOverlay?.host.isConnected) return;
  activeOverlay?.cleanup();

  const staleHost = document.getElementById(HOST_ID);
  staleHost?.remove();

  let extensionRootUrl: URL;
  let frameUrl: URL;
  try {
    extensionRootUrl = new URL(chrome.runtime.getURL(''));
    frameUrl = new URL(chrome.runtime.getURL('frame/index.html'));
  } catch {
    // A reloaded or removed extension invalidates the old content-script
    // runtime. Leave no stale launcher behind and wait for a fresh page load.
    return;
  }

  const nonce = crypto.randomUUID();
  const adapter = new SpotifySearchAdapter();
  const host = document.createElement('div');
  host.id = HOST_ID;
  host.style.cssText = [
    'all: initial',
    'position: fixed',
    'z-index: 2147483647',
    'top: 72px',
    'right: 12px',
    'width: 44px',
    'height: 44px',
    'overflow: hidden',
    'border-radius: 50%',
    'background: transparent',
    'pointer-events: auto',
  ].join(';');

  const shadow = host.attachShadow({
    mode: extensionRootUrl.protocol === 'chrome-extension:' ? 'closed' : 'open',
  });
  frameUrl.hash = new URLSearchParams({
    nonce,
    parentOrigin: window.location.origin,
  }).toString();
  const iframe = document.createElement('iframe');
  iframe.title = 'Music discovery wizard';
  iframe.src = frameUrl.href;
  iframe.allow = 'language-model; microphone';
  iframe.style.cssText = [
    'border: 0',
    'width: 100%',
    'height: 100%',
    'display: block',
    'border-radius: 50%',
    'background: transparent',
    'color-scheme: dark',
  ].join(';');
  shadow.append(iframe);
  document.documentElement.append(host);

  let isOpen = false;
  let disposed = false;
  let pendingPositionFrame: number | undefined;

  const positionHost = (): void => {
    if (isOpen) {
      const narrow = window.innerWidth < 640;
      host.style.overflow = 'visible';
      host.style.borderRadius = '0';
      iframe.style.borderRadius = '0';
      host.style.top = narrow ? '20vh' : '0';
      host.style.left = 'auto';
      host.style.right = '0';
      host.style.width = narrow ? '100vw' : 'min(430px, 100vw)';
      host.style.height = narrow ? '80vh' : '100vh';
      return;
    }
    host.style.overflow = 'hidden';
    host.style.borderRadius = '50%';
    iframe.style.borderRadius = '50%';
    const profileButton = document.querySelector(
      'button[data-testid="user-widget-link"]',
    );
    const rect =
      profileButton instanceof HTMLElement
        ? profileButton.getBoundingClientRect()
        : undefined;
    host.style.width = '44px';
    host.style.height = '44px';
    host.style.left = 'auto';
    host.style.top = rect ? `${Math.round(rect.bottom + 8)}px` : '72px';
    host.style.right = rect
      ? `${Math.round(
          Math.max(8, window.innerWidth - rect.right + (rect.width - 44) / 2),
        )}px`
      : '12px';
  };

  const schedulePositionHost = (): void => {
    if (disposed || pendingPositionFrame !== undefined) return;
    pendingPositionFrame = window.requestAnimationFrame(() => {
      pendingPositionFrame = undefined;
      if (disposed) return;
      positionHost();
    });
  };

  const onMessage = (event: MessageEvent): void => {
    if (disposed) return;
    if (
      event.source !== iframe.contentWindow ||
      event.origin !== extensionRootUrl.origin ||
      !isFrameToContentMessage(event.data, nonce)
    ) {
      return;
    }
    if (event.data.type === 'overlay-state') {
      isOpen = event.data.open;
      positionHost();
      iframe.contentWindow?.postMessage(
        {
          source: 'mdo-content',
          nonce,
          type: 'overlay-state-result',
          open: isOpen,
        },
        extensionRootUrl.origin,
      );
      return;
    }
    const method = adapter.populateAndSubmit(event.data.query);
    iframe.contentWindow?.postMessage(
      { source: 'mdo-content', nonce, type: 'search-result', method },
      extensionRootUrl.origin,
    );
  };

  const observer = new MutationObserver(() => {
    if (!host.isConnected) {
      cleanup();
      return;
    }
    if (!isOpen) schedulePositionHost();
  });

  const cleanup = (): void => {
    if (disposed) return;
    disposed = true;
    if (pendingPositionFrame !== undefined) {
      window.cancelAnimationFrame(pendingPositionFrame);
      pendingPositionFrame = undefined;
    }
    window.removeEventListener('message', onMessage);
    window.removeEventListener('resize', schedulePositionHost);
    window.removeEventListener('pagehide', cleanup);
    observer.disconnect();
    host.remove();
    if (activeOverlay?.host === host) activeOverlay = undefined;
  };

  window.addEventListener('message', onMessage);
  window.addEventListener('resize', schedulePositionHost, { passive: true });
  window.addEventListener('pagehide', cleanup, { once: true });
  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
  activeOverlay = { host, cleanup };
  positionHost();
}

if (document.documentElement.dataset.mdoDisableAutoMount !== 'true') {
  mountMusicDiscoveryOverlay();
}
