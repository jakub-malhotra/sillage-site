import { createFileRoute } from '@tanstack/react-router'
import { NotFound } from '~/components/NotFound'

export const Route = createFileRoute('/$')({
  head: () => ({
    meta: [
      { title: '404 - Page Not Found | Sillage' },
      {
        name: 'description',
        content: 'The requested page could not be found on Sillage.',
      },
      { property: 'og:title', content: '404 - Page Not Found | Sillage' },
      {
        property: 'og:description',
        content: 'The requested page could not be found on Sillage.',
      },
      { property: 'og:image', content: '/og-image.png' },
    ],
  }),
  component: NotFound,
})
