'use client'
import type { JSX } from 'react'
import { StyledEngineProvider, ThemeProvider } from '@mui/material/styles'
import CssBaseline from '@mui/material/CssBaseline'
import GlobalStyles from '@mui/material/GlobalStyles'
import theme from '../theme'
import AppAppBar from '../components/AppAppBar'
import Hero from '../components/Hero'
import Footer from '../components/Footer'

export default function Page(): JSX.Element {
  return (
    <StyledEngineProvider enableCssLayer>
      <GlobalStyles styles="@layer theme, base, mui, components, utilities;" />
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <AppAppBar />
        <Hero />
        <Footer />
      </ThemeProvider>
    </StyledEngineProvider>
  )
}
