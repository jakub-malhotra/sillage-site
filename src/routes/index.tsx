import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useLocalStorage } from '~/hooks/useLocalStorage'
import { getCurrentWeather } from '~/lib/weather'
import { MY_FRAGRANCES } from '~/lib/fragrances'
import type { WeatherData, Fragrance } from '~/types'

export const Route = createFileRoute('/')({
  head: () => ({ meta: [{ title: 'Sillage' }] }),
  component: Dashboard,
})

function Dashboard() {
  const [myCollection] = useLocalStorage<string[]>('myCollection', [])
  const [history, setHistory] = useLocalStorage<Array<{ fragrance: Fragrance; reasoning: string; timestamp: number; weather: WeatherData }>>('history', [])
  
  const [weather, setWeather] = useState<WeatherData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [recommendation, setRecommendation] = useState<{ fragrance: Fragrance; reasoning: string } | null>(null)

  // Get fragrances from my collection
  const ownedFragrances: Fragrance[] = MY_FRAGRANCES.filter(f => myCollection.includes(f.id))

  // Load weather on mount
  useEffect(() => {
    loadWeather()
  }, [])

  const loadWeather = async () => {
    try {
      const data = await getCurrentWeather()
      setWeather(data)
      setError(null)
    } catch (err) {
      setError('Could not get location/weather. Please enable location access.')
    }
  }

  const handleRecommend = async () => {
    if (ownedFragrances.length === 0) {
      setError('Add fragrances to your wardrobe first')
      return
    }
    if (!weather) {
      setError('Weather data not available')
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fragrances: ownedFragrances, weather }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const rec = await response.json()
      setRecommendation(rec)
      
      // Save to history
      setHistory(prev => [{ ...rec, timestamp: Date.now(), weather }, ...prev].slice(0, 50))
    } catch (err) {
      console.error(err)
      setError(`Failed to get recommendation. ${err instanceof Error ? err.message : String(err)}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-amber-50">
      <div className="mx-auto max-w-md px-6 py-12">
        {/* Header */}
        <header className="mb-10 text-center">
          <h1 className="text-3xl font-light tracking-tight text-amber-900">Sillage</h1>
          <p className="mt-1 text-sm text-amber-700/70">One fragrance for today</p>
        </header>

        {/* Weather Card */}
        <div className="mb-8 rounded-2xl bg-white/70 p-6 shadow-sm backdrop-blur-sm">
          {weather ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-amber-700/60">Now</p>
                <p className="text-4xl font-light text-amber-900">{Math.round(weather.temperature)}°</p>
                <p className="text-sm text-amber-700/80 capitalize">{weather.condition}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase tracking-wider text-amber-700/60">Humidity</p>
                <p className="text-lg text-amber-900">{weather.humidity}%</p>
                <p className="text-xs text-amber-700/60">+6h: {Math.round(weather.forecastTemp)}°</p>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center py-4">
              {error ? (
                <div className="text-center">
                  <p className="text-sm text-red-600">{error}</p>
                  <button 
                    onClick={loadWeather}
                    className="mt-2 text-xs text-amber-700 underline hover:text-amber-900"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-amber-300 border-t-amber-700" />
              )}
            </div>
          )}
        </div>

        {/* Wardrobe Status */}
        <div className="mb-8 text-center">
          <p className="text-sm text-amber-700/70">
            {ownedFragrances.length === 0 ? (
              <span>
                Your wardrobe is empty.{' '}
                <a href="/wardrobe" className="text-amber-800 underline hover:text-amber-950">
                  Add fragrances
                </a>
              </span>
            ) : (
              <span>{ownedFragrances.length} fragrance{ownedFragrances.length !== 1 ? 's' : ''} in your wardrobe</span>
            )}
          </p>
        </div>

        {/* Main Action */}
        <button
          onClick={handleRecommend}
          disabled={loading || ownedFragrances.length === 0}
          className="group relative w-full overflow-hidden rounded-full bg-amber-900 py-5 text-center font-medium text-white shadow-lg transition-all hover:bg-amber-800 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className={`transition-opacity ${loading ? 'opacity-0' : 'opacity-100'}`}>
            {recommendation ? 'Recommend Another' : 'What Should I Wear Today?'}
          </span>
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            </div>
          )}
        </button>

        {/* Error Message */}
        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        {/* Recommendation Result */}
        {recommendation && (
          <div className="mt-10 rounded-2xl bg-white p-6 shadow-lg">
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-amber-700/60">Today&apos;s Pick</p>
            <h2 className="text-2xl font-light text-amber-950">
              {recommendation.fragrance.name}
            </h2>
            <p className="text-sm text-amber-700/80">{recommendation.fragrance.brand}</p>
            
            <div className="my-4 h-px bg-amber-100" />
            
            <p className="text-sm leading-relaxed text-amber-800">
              {recommendation.reasoning}
            </p>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-800">
                {recommendation.fragrance.family}
              </span>
              {recommendation.fragrance.notes_top.slice(0, 2).map(note => (
                <span key={note} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700/70">
                  {note}
                </span>
              ))}
              {recommendation.fragrance.notes_heart.slice(0, 2).map(note => (
                <span key={note} className="rounded-full bg-amber-50 px-3 py-1 text-xs text-amber-700/70">
                  {note}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="mt-12 flex justify-center gap-8 text-sm">
          <a 
            href="/wardrobe" 
            className="text-amber-700/80 underline-offset-4 hover:text-amber-900 hover:underline"
          >
            Wardrobe
          </a>
        </nav>
      </div>
    </div>
  )
}
