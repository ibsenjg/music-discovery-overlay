import type { ThemeChoice } from '../appTypes';

export type AppTheme = {
  colors: {
    surface: string;
    surfaceRaised: string;
    surfaceSoft: string;
    surfaceOverlay: string;
    surfaceNotice: string;
    surfaceDanger: string;
    text: string;
    muted: string;
    accent: string;
    accentInk: string;
    focus: string;
    border: string;
    borderStrong: string;
    buttonHover: string;
    danger: string;
    dangerInk: string;
    codeSurface: string;
    codeText: string;
    backdrop: string;
  };
  brand: {
    one: string;
    two: string;
    three: string;
    markSurface: string;
    markSurfaceHover: string;
  };
  preview: {
    surface: string;
    border: string;
    one: string;
    two: string;
    three: string;
  };
  shadows: {
    strong: string;
    panel: string;
    soft: string;
  };
  radii: {
    small: string;
    medium: string;
  };
  spacing: {
    one: string;
    two: string;
    three: string;
    four: string;
    five: string;
  };
  typography: {
    family: string;
  };
  motion: {
    standard: string;
    spinner: string;
  };
};

const sharedTheme = {
  shadows: {
    strong: 'rgb(0 0 0 / 55%)',
    panel: 'rgb(0 0 0 / 48%)',
    soft: 'rgb(0 0 0 / 24%)',
  },
  radii: {
    small: '10px',
    medium: '16px',
  },
  spacing: {
    one: '4px',
    two: '8px',
    three: '12px',
    four: '16px',
    five: '24px',
  },
  typography: {
    family:
      "Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  },
  motion: {
    standard: '140ms ease',
    spinner: '700ms linear infinite',
  },
} satisfies Pick<
  AppTheme,
  'shadows' | 'radii' | 'spacing' | 'typography' | 'motion'
>;

export const appThemes: Record<ThemeChoice, AppTheme> = {
  aurora: {
    ...sharedTheme,
    colors: {
      surface: '#0f1320',
      surfaceRaised: '#181e2e',
      surfaceSoft: '#242c3e',
      surfaceOverlay: '#151b29',
      surfaceNotice: '#1c2638',
      surfaceDanger: '#2a171d',
      text: '#f7f8ff',
      muted: '#c0c6d8',
      accent: '#8fdcf2',
      accentInk: '#081820',
      focus: '#ffd166',
      border: '#4f5a73',
      borderStrong: '#63708c',
      buttonHover: '#303a54',
      danger: '#ffb4bd',
      dangerInk: '#2d0710',
      codeSurface: '#080b12',
      codeText: '#dff9ff',
      backdrop: 'rgb(0 0 0 / 48%)',
    },
    brand: {
      one: '#6ee7f2',
      two: '#a78bfa',
      three: '#ff8fc6',
      markSurface:
        'linear-gradient(145deg, #243354 0%, #30264f 54%, #151827 100%)',
      markSurfaceHover:
        'linear-gradient(145deg, #2d426a 0%, #3c2e63 54%, #1a1e31 100%)',
    },
    preview: {
      surface: '#171d31',
      border: '#63708c',
      one: '#6ee7f2',
      two: '#a78bfa',
      three: '#ff8fc6',
    },
  },
  pulse: {
    ...sharedTheme,
    colors: {
      surface: '#171114',
      surfaceRaised: '#24191d',
      surfaceSoft: '#312229',
      surfaceOverlay: '#20161a',
      surfaceNotice: '#2b1d22',
      surfaceDanger: '#32171d',
      text: '#fff8f5',
      muted: '#d4c1c4',
      accent: '#ff9a88',
      accentInk: '#2b0a05',
      focus: '#ffe082',
      border: '#654c55',
      borderStrong: '#80616c',
      buttonHover: '#443039',
      danger: '#ffb3c0',
      dangerInk: '#310810',
      codeSurface: '#0e090b',
      codeText: '#ffe8df',
      backdrop: 'rgb(0 0 0 / 48%)',
    },
    brand: {
      one: '#ffcf70',
      two: '#ff826f',
      three: '#ed5cae',
      markSurface:
        'linear-gradient(145deg, #4a2d26 0%, #4c233d 55%, #201419 100%)',
      markSurfaceHover:
        'linear-gradient(145deg, #62392e 0%, #622d4e 55%, #29191f 100%)',
    },
    preview: {
      surface: '#25171c',
      border: '#80616c',
      one: '#ffcf70',
      two: '#ff826f',
      three: '#ed5cae',
    },
  },
  nightwave: {
    ...sharedTheme,
    colors: {
      surface: '#090f1f',
      surfaceRaised: '#111b31',
      surfaceSoft: '#1a2842',
      surfaceOverlay: '#0e172b',
      surfaceNotice: '#14213a',
      surfaceDanger: '#251525',
      text: '#f3f7ff',
      muted: '#b7c4df',
      accent: '#8eb8ff',
      accentInk: '#071128',
      focus: '#f2cc70',
      border: '#40547c',
      borderStrong: '#536b9a',
      buttonHover: '#24375a',
      danger: '#ffb4c8',
      dangerInk: '#2c0716',
      codeSurface: '#050913',
      codeText: '#dbe8ff',
      backdrop: 'rgb(0 0 0 / 48%)',
    },
    brand: {
      one: '#5ce1e6',
      two: '#6883ff',
      three: '#b17cff',
      markSurface:
        'linear-gradient(145deg, #153252 0%, #242a63 55%, #10152b 100%)',
      markSurfaceHover:
        'linear-gradient(145deg, #1b426a 0%, #303681 55%, #151c38 100%)',
    },
    preview: {
      surface: '#0f1830',
      border: '#536b9a',
      one: '#5ce1e6',
      two: '#6883ff',
      three: '#b17cff',
    },
  },
};

export const tokens = {
  surface: 'var(--surface)',
  surfaceRaised: 'var(--surface-raised)',
  surfaceSoft: 'var(--surface-soft)',
  surfaceOverlay: 'var(--surface-overlay)',
  surfaceNotice: 'var(--surface-notice)',
  surfaceDanger: 'var(--surface-danger)',
  text: 'var(--text)',
  muted: 'var(--muted)',
  accent: 'var(--accent)',
  accentInk: 'var(--accent-ink)',
  focus: 'var(--focus)',
  border: 'var(--border)',
  borderStrong: 'var(--border-strong)',
  buttonHover: 'var(--button-hover)',
  danger: 'var(--danger)',
  dangerInk: 'var(--danger-ink)',
  codeSurface: 'var(--code-surface)',
  codeText: 'var(--code-text)',
  brandOne: 'var(--brand-one)',
  brandTwo: 'var(--brand-two)',
  brandThree: 'var(--brand-three)',
  markSurface: 'var(--mark-surface)',
  markSurfaceHover: 'var(--mark-surface-hover)',
  shadowStrong: 'var(--shadow-strong)',
  shadowPanel: 'var(--shadow-panel)',
  shadowSoft: 'var(--shadow-soft)',
  backdrop: 'var(--backdrop)',
  radiusSmall: 'var(--radius-sm)',
  radiusMedium: 'var(--radius-md)',
  spaceOne: 'var(--space-1)',
  spaceTwo: 'var(--space-2)',
  spaceThree: 'var(--space-3)',
  spaceFour: 'var(--space-4)',
  spaceFive: 'var(--space-5)',
  motionStandard: 'var(--motion-standard)',
  motionSpinner: 'var(--motion-spinner)',
} as const;
