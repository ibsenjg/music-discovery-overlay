import { translate } from '../../shared/i18n';
import type { Locale } from '../../shared/types';
import { AppMark } from './AppPrimitives';
import {
  Header,
  HeaderMark,
  MinimizeButton,
  Title,
} from './DrawerHeader.styles';

export function DrawerHeader({
  locale,
  onMinimize,
}: {
  locale: Locale;
  onMinimize: () => void;
}) {
  return (
    <Header>
      <HeaderMark>
        <AppMark />
      </HeaderMark>
      <Title id="discovery-title">{translate(locale, 'title')}</Title>
      <MinimizeButton
        type="button"
        aria-label={translate(locale, 'minimize')}
        onClick={onMinimize}
      >
        <span aria-hidden="true">−</span>
      </MinimizeButton>
    </Header>
  );
}
