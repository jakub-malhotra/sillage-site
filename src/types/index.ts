export interface Fragrance {
  id: string
  name: string
  brand: string
  family: string
  notes_top: string[]
  notes_heart: string[]
  notes_base: string[]
  best_seasons: ('spring' | 'summer' | 'autumn' | 'winter')[]
  best_time: 'day' | 'night' | 'both'
  longevity: 'poor' | 'moderate' | 'long' | 'very_long'
  sillage: 'intimate' | 'moderate' | 'heavy' | 'enormous'
}

export interface WeatherData {
  temperature: number
  humidity: number
  condition: string
  forecastTemp: number
}

export interface Recommendation {
  fragrance: Fragrance
  reasoning: string
  timestamp: number
  weather: WeatherData
}
