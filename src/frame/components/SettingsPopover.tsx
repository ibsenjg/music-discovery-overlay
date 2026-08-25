import type { RefObject } from 'react';
import { translate } from '../../shared/i18n';
import type { Locale, ProviderUsage } from '../../shared/types';
import { THEME_OPTIONS } from '../appModel';
import type { ProviderChoice, ThemeChoice } from '../appTypes';
import { appThemes } from '../styles/theme';
import { LocalAiStatePanel } from './LocalAiStatePanel';
import type {
  LocalAiPanelActions,
  LocalAiPanelModel,
} from './localAiPanelTypes';
import {
  CloseButton,
  FieldLabel,
  Independent,
  PopoverHeading,
  Select,
  SettingsPanel,
  SettingsTitle,
  ThemeLegend,
  ThemeOption,
  ThemeOptionCopy,
  ThemeOptions,
  ThemePicker,
  ThemeRadio,
  ThemeSessionNote,
  ThemeSwatch,
  Usage,
} from './SettingsPopover.styles';

export function SettingsPopover({
  locale,
  providerChoice,
  theme,
  usage,
  panelModel,
  panelActions,
  settingsPanelRef,
  settingsFirstRef,
  removeModelButtonRef,
  modelRemovalFirstRef,
  onClose,
  onChangeLocale,
  onChangeProvider,
  onChangeTheme,
}: {
  locale: Locale;
  providerChoice: ProviderChoice;
  theme: ThemeChoice;
  usage?: ProviderUsage;
  panelModel: LocalAiPanelModel;
  panelActions: LocalAiPanelActions;
  settingsPanelRef: RefObject<HTMLElement | null>;
  settingsFirstRef: RefObject<HTMLSelectElement | null>;
  removeModelButtonRef: RefObject<HTMLButtonElement | null>;
  modelRemovalFirstRef: RefObject<HTMLButtonElement | null>;
  onClose: () => void;
  onChangeLocale: (locale: Locale) => void;
  onChangeProvider: (provider: ProviderChoice) => void;
  onChangeTheme: (theme: ThemeChoice) => void;
}) {
  return (
    <SettingsPanel
      ref={settingsPanelRef}
      role="dialog"
      aria-modal="false"
      aria-labelledby="settings-title"
    >
      <PopoverHeading>
        <SettingsTitle id="settings-title">
          {translate(locale, 'settings')}
        </SettingsTitle>
        <CloseButton
          type="button"
          aria-label={translate(locale, 'closeSettings')}
          onClick={onClose}
        >
          <span aria-hidden="true">×</span>
        </CloseButton>
      </PopoverHeading>
      <FieldLabel>
        <span>{translate(locale, 'language')}</span>
        <Select
          ref={settingsFirstRef}
          value={locale}
          onChange={(event) => onChangeLocale(event.target.value as Locale)}
        >
          <option value="en">English</option>
          <option value="es">Español</option>
        </Select>
      </FieldLabel>
      <FieldLabel>
        <span>{translate(locale, 'provider')}</span>
        <Select
          value={providerChoice}
          onChange={(event) =>
            onChangeProvider(event.target.value as ProviderChoice)
          }
        >
          <option value="on-device">{translate(locale, 'onDevice')}</option>
          <option value="rules">{translate(locale, 'rules')}</option>
        </Select>
      </FieldLabel>
      <ThemePicker aria-describedby="theme-session-note">
        <ThemeLegend>{translate(locale, 'theme')}</ThemeLegend>
        <ThemeSessionNote id="theme-session-note">
          {translate(locale, 'themeSession')}
        </ThemeSessionNote>
        <ThemeOptions>
          {THEME_OPTIONS.map((option) => (
            <ThemeOption key={option.id} $selected={theme === option.id}>
              <ThemeRadio
                type="radio"
                name="discovery-theme"
                value={option.id}
                checked={theme === option.id}
                onChange={() => onChangeTheme(option.id)}
              />
              <ThemeSwatch
                $previewTheme={appThemes[option.id]}
                aria-hidden="true"
              >
                <span />
                <span />
                <span />
              </ThemeSwatch>
              <ThemeOptionCopy>
                <strong>{translate(locale, option.nameKey)}</strong>
                <span>{translate(locale, option.descriptionKey)}</span>
              </ThemeOptionCopy>
            </ThemeOption>
          ))}
        </ThemeOptions>
      </ThemePicker>
      <LocalAiStatePanel
        variant="settings"
        model={panelModel}
        actions={panelActions}
        refs={{
          removeModelButton: removeModelButtonRef,
          modelRemovalFirstAction: modelRemovalFirstRef,
        }}
      />
      <Usage>
        {usage?.contextUsage !== undefined &&
        usage.contextWindow !== undefined ? (
          <p>
            {translate(locale, 'usage', {
              used: usage.contextUsage,
              total: usage.contextWindow,
            })}
          </p>
        ) : (
          <p>{translate(locale, 'noUsage')}</p>
        )}
      </Usage>
      <Independent>{translate(locale, 'independent')}</Independent>
    </SettingsPanel>
  );
}
