import type { ComponentType } from 'react'
import { StrictMode } from 'react'

export const withProviders = <Props extends object>(Component: ComponentType<Props>) => {
  const WithProviders = (props: Props) => {
    return (
      <StrictMode>
        <Component {...props} />
      </StrictMode>
    )
  }

  WithProviders.displayName = `withProviders(${Component.displayName ?? Component.name ?? 'Component'})`

  return WithProviders
}
