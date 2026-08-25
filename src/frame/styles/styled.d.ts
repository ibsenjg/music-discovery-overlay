import 'styled-components';
import type { AppTheme } from './theme';

declare module 'styled-components' {
  export interface DefaultTheme {
    colors: AppTheme['colors'];
    brand: AppTheme['brand'];
    preview: AppTheme['preview'];
    shadows: AppTheme['shadows'];
    radii: AppTheme['radii'];
    spacing: AppTheme['spacing'];
    typography: AppTheme['typography'];
    motion: AppTheme['motion'];
  }
}
