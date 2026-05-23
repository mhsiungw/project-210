import { createTheme } from '@mui/material/styles'

// primary/error/success/warning stay hex — MUI calls lighten()/darken() on
// them and cannot decompose var() strings.
//
// background/text/divider are wired to --p210-* CSS vars so they follow
// [data-theme] switching. Each color is paired with a `*Channel` entry that
// points at the underlying RGB triplet (e.g. "33 33 33") so MUI can build
// alpha overlays via `rgb(var(--mui-palette-text-primaryChannel) / 0.38)`.
const paletteRefs = {
  primary: { main: '#4692dd', dark: '#3a7fc4', light: '#5ea1e6', contrastText: '#ffffff' },
  error: { main: '#d32f2f', contrastText: '#ffffff' },
  success: { main: '#2e7d32', contrastText: '#ffffff' },
  warning: { main: '#b06d00', contrastText: '#ffffff' },
  background: {
    default: 'rgb(var(--p210-bg))',
    defaultChannel: 'var(--p210-bg)',
    paper: 'rgb(var(--p210-bg-elevated))',
    paperChannel: 'var(--p210-bg-elevated)',
  },
  text: {
    primary: 'rgb(var(--p210-fg))',
    primaryChannel: 'var(--p210-fg)',
    secondary: 'rgb(var(--p210-fg-muted))',
    secondaryChannel: 'var(--p210-fg-muted)',
    disabled: 'rgb(var(--p210-fg-faint))',
    disabledChannel: 'var(--p210-fg-faint)',
  },
  // --p210-divider is already alpha-baked (rgba) so it can't yield a meaningful
  // channel value; opt out of channel generation.
  divider: 'var(--p210-divider)',
  dividerChannel: undefined,
}

export const theme = createTheme({
  cssVariables: { colorSchemeSelector: "[data-theme='%s']" },
  defaultColorScheme: 'dark',
  colorSchemes: {
    light: { palette: paletteRefs },
    dark: { palette: paletteRefs },
  },
  typography: {
    fontFamily: 'inherit',
  },
})
