import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { App } from '../../src/frame/App';
import { providerMap, openDrawer, chooseRules } from './appTestUtils';

describe('Music discovery shell', () => {
  it('opens, moves focus to the composer, closes with Escape, and returns focus', async () => {
    const user = userEvent.setup();
    render(
      <App
        providers={providerMap({ text: 'unavailable', audio: 'unavailable' })}
      />,
    );
    await openDrawer(user);
    const input = screen.getByRole('textbox', {
      name: 'Describe the music you want to find',
    });
    await waitFor(() => expect(input).toHaveFocus());
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Discover music your way',
    );
    await user.keyboard('{Escape}');
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Open music discovery' }),
      ).toHaveFocus(),
    );
  });

  it('scrolls only the drawer to new suggestions without moving keyboard focus', async () => {
    const originalScrollTo = HTMLElement.prototype.scrollTo;
    const originalMatchMedia = window.matchMedia;
    const scrollTo = vi.fn();
    Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
      configurable: true,
      value: scrollTo,
    });
    Object.defineProperty(window, 'matchMedia', {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: true }),
    });

    try {
      const user = userEvent.setup();
      render(
        <App
          providers={providerMap({
            text: 'unavailable',
            audio: 'unavailable',
          })}
        />,
      );
      await openDrawer(user);
      await chooseRules(user);
      const input = screen.getByRole('textbox', {
        name: 'Describe the music you want to find',
      });
      await user.type(input, 'piano bass melody{Enter}');

      expect(
        await screen.findByRole('heading', { name: 'Reasoned music routes' }),
      ).toBeVisible();
      await waitFor(() => expect(scrollTo).toHaveBeenCalledOnce());
      expect(scrollTo).toHaveBeenCalledWith({
        behavior: 'auto',
        top: 0,
      });
      expect(input).toHaveFocus();

      await user.click(
        screen.getByRole('button', { name: 'Minimize music discovery' }),
      );
      await user.click(
        screen.getByRole('button', { name: 'Open music discovery' }),
      );
      await waitFor(() => expect(scrollTo).toHaveBeenCalledTimes(2));
      expect(scrollTo).toHaveBeenLastCalledWith({
        behavior: 'auto',
        top: 0,
      });
    } finally {
      if (originalScrollTo) {
        Object.defineProperty(HTMLElement.prototype, 'scrollTo', {
          configurable: true,
          value: originalScrollTo,
        });
      } else {
        Reflect.deleteProperty(HTMLElement.prototype, 'scrollTo');
      }
      if (originalMatchMedia) {
        Object.defineProperty(window, 'matchMedia', {
          configurable: true,
          value: originalMatchMedia,
        });
      } else {
        Reflect.deleteProperty(window, 'matchMedia');
      }
    }
  });
});
