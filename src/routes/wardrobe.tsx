import { createFileRoute } from '@tanstack/react-router'
import { useState, useMemo } from 'react'
import { useLocalStorage } from '~/hooks/useLocalStorage'
import { MY_FRAGRANCES } from '~/lib/fragrances'
import type { FragranceData } from '~/lib/fragrances'

export const Route = createFileRoute('/wardrobe')({
  head: () => ({
    meta: [
      { title: 'Wardrobe | Sillage' },
      {
        name: 'description',
        content: 'Manage and organize your personal fragrance collection, explore notes, and search scents with AI on Sillage.',
      },
      { property: 'og:title', content: 'Wardrobe | Sillage' },
      {
        property: 'og:description',
        content: 'Manage and organize your personal fragrance collection, explore notes, and search scents with AI on Sillage.',
      },
      { property: 'og:image', content: '/og-image.png' },
    ],
  }),
  component: Wardrobe,
})

function Wardrobe() {
  const [myCollection, setMyCollection] = useLocalStorage<any[]>('myCollection', [])
  const [searchQuery, setSearchQuery] = useState('')
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState<string | null>(null)

  // Resolve full fragrance objects, migrating string IDs automatically
  const myFragrances: FragranceData[] = useMemo(() => {
    let changed = false
    const migrated = myCollection.map(item => {
      if (typeof item === 'string') {
        const found = MY_FRAGRANCES.find(f => f.id === item)
        if (found) {
          changed = true
          return found
        }
        return null
      }
      return item
    }).filter((f): f is FragranceData => f !== null)

    if (changed) {
      setTimeout(() => setMyCollection(migrated), 0)
    }
    return migrated
  }, [myCollection, setMyCollection])

  // Filter hardcoded fragrances by search query
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return []
    const query = searchQuery.toLowerCase()
    return MY_FRAGRANCES.filter(
      f =>
        (f.name.toLowerCase().includes(query) || f.brand.toLowerCase().includes(query)) &&
        !myFragrances.some(myF => myF.id === f.id)
    ).slice(0, 5)
  }, [searchQuery, myFragrances])

  const addToCollection = (fragrance: FragranceData) => {
    if (myFragrances.some(f => f.id === fragrance.id)) return
    setMyCollection(prev => [...prev, fragrance])
    setSearchQuery('')
    setExtractError(null)
  }

  const handleExtractNotes = async () => {
    if (!searchQuery.trim()) return
    setExtracting(true)
    setExtractError(null)
    try {
      const response = await fetch('/api/extract-notes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: searchQuery }),
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || `HTTP error! status: ${response.status}`)
      }

      const fragrance: FragranceData = await response.json()
      addToCollection(fragrance)
    } catch (err: any) {
      console.error(err)
      setExtractError(err.message || 'Failed to extract fragrance notes')
    } finally {
      setExtracting(false)
    }
  }

  const removeFromCollection = (id: string) => {
    setMyCollection(prev => prev.filter(f => (typeof f === 'string' ? f : f.id) !== id))
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="mx-auto max-w-md px-6 py-12">
        {/* Header */}
        <header className="mb-8">
          <a href="/" className="text-sm text-amber-700/70 hover:text-amber-900">← Back</a>
          <h1 className="mt-4 text-3xl font-light tracking-tight text-amber-900">Wardrobe</h1>
          <p className="text-sm text-amber-700/70">{myCollection.length} fragrances in your collection</p>
        </header>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search fragrances..."
              className="w-full rounded-xl border border-amber-200 bg-white px-4 py-3 text-sm outline-none transition-all focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400 hover:text-amber-600"
              >
                ×
              </button>
            )}
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-2 overflow-hidden rounded-xl border border-amber-100 bg-white shadow-sm">
              {searchResults.map((fragrance) => (
                <button
                  key={fragrance.id}
                  onClick={() => addToCollection(fragrance)}
                  className="flex w-full items-center justify-between border-b border-amber-50 px-4 py-3 text-left last:border-0 hover:bg-amber-50"
                >
                  <div>
                    <p className="text-sm font-medium text-amber-900">{fragrance.name}</p>
                    <p className="text-xs text-amber-700/70">{fragrance.brand}</p>
                    <p className="text-xs text-amber-600/60">{fragrance.family}</p>
                  </div>
                  <span className="text-lg text-amber-400">+</span>
                </button>
              ))}
            </div>
          )}

          {searchQuery.trim() && searchResults.length === 0 && (
            <p className="mt-3 text-center text-sm text-amber-600/60">No matches found in standard library.</p>
          )}

          {searchQuery.trim() && (
            <div className="mt-3">
              <button
                onClick={handleExtractNotes}
                disabled={extracting}
                className="w-full rounded-xl bg-amber-900 py-3 text-center text-sm font-medium text-white shadow-sm transition-all hover:bg-amber-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {extracting ? 'Searching with AI...' : `Search "${searchQuery}" with AI`}
              </button>
              {extractError && (
                <p className="mt-2 text-center text-xs text-red-600">{extractError}</p>
              )}
            </div>
          )}
        </div>

        {/* My Collection */}
        {myFragrances.length === 0 ? (
          <div className="rounded-xl border border-dashed border-amber-300 bg-amber-100/50 py-12 text-center">
            <p className="text-amber-700/70">Your collection is empty</p>
            <p className="mt-1 text-sm text-amber-600/60">Search above to add fragrances</p>
          </div>
        ) : (
          <div>
            <h2 className="mb-4 text-sm font-medium uppercase tracking-wider text-amber-700/60">
              My Collection
            </h2>
            <div className="grid gap-3">
              {myFragrances.map((fragrance) => (
                <div
                  key={fragrance.id}
                  className="flex items-start justify-between rounded-xl bg-white p-4 shadow-sm"
                >
                  <div className="flex-1">
                    <h3 className="font-medium text-amber-950">{fragrance.name}</h3>
                    <p className="text-sm text-amber-700/70">{fragrance.brand}</p>
                    <p className="mt-1 text-xs text-amber-600/60">{fragrance.family}</p>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {fragrance.notes_top.slice(0, 2).map((note) => (
                        <span key={note} className="rounded-full bg-amber-50 px-2 py-0.5 text-xs text-amber-700/70">
                          {note}
                        </span>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => removeFromCollection(fragrance.id)}
                    className="ml-3 rounded-full p-2 text-amber-400 transition-colors hover:bg-amber-50 hover:text-red-500"
                    aria-label="Remove from collection"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
