import { withProviders } from './providers'
import { App } from './ui/app'

export const AppRoot = withProviders(App)

export type { AppProps } from './ui/app'
