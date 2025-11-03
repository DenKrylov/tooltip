import type { ComponentType } from 'react'
import { StrictMode } from 'react'

import { ThemeProvider } from '@/shared/ui/theme'

export const withProviders = <Props extends object>(Component: ComponentType<Props>) => {
  const WithProviders = (props: Props) => {
    return (
      <StrictMode>
        <ThemeProvider>
          <Component {...props} />
        </ThemeProvider>
      </StrictMode>
    )
  }

  WithProviders.displayName = `withProviders(${Component.displayName ?? Component.name ?? 'Component'})`

  return WithProviders
}
