import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRouteWithContext,
} from '@tanstack/react-router'
import * as React from 'react'
import type { QueryClient } from '@tanstack/react-query'
import appCss from '~/styles/app.css?url'

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  head: () => ({
    meta: [
      {
        charSet: 'utf-8',
      },
      {
        name: 'viewport',
        content: 'width=device-width, initial-scale=1',
      },
      {
        title: 'Sillage',
      },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32-light.png', media: '(prefers-color-scheme: light)' },
      { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32-dark.png', media: '(prefers-color-scheme: dark)' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16-light.png', media: '(prefers-color-scheme: light)' },
      { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16-dark.png', media: '(prefers-color-scheme: dark)' },
      { rel: 'icon', href: '/favicon.ico' },
    ],
  }),
  notFoundComponent: () => <div>Route not found</div>,
  component: RootComponent,
})

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  )
}
