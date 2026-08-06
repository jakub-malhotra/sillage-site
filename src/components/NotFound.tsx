import { Link } from '@tanstack/react-router'

export function NotFound() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-amber-50 via-zinc-50 to-amber-100/40 px-6 py-12">
      <div className="mx-auto max-w-md text-center">
        <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-amber-100 text-amber-900 shadow-inner">
          <span className="text-3xl font-light">404</span>
        </div>
        <h1 className="text-3xl font-light tracking-tight text-amber-950">Page Not Found</h1>
        <p className="mt-3 text-sm leading-relaxed text-amber-700/80">
          The page or fragrance route you are looking for does not exist or has moved.
        </p>
        <div className="mt-8">
          <Link
            to="/"
            className="inline-block rounded-full bg-amber-900 px-8 py-3.5 text-sm font-medium text-white shadow-md transition-all hover:bg-amber-800 hover:shadow-lg"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  )
}
