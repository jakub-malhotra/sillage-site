import type { WeatherData } from '~/types'

export async function getCurrentWeather(): Promise<WeatherData> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const weather = await fetchWeatherData(latitude, longitude)
          resolve(weather)
        } catch (error) {
          reject(error)
        }
      },
      (error) => {
        reject(new Error(`Location access denied: ${error.message}`))
      },
      { timeout: 10000, enableHighAccuracy: false }
    )
  })
}

async function fetchWeatherData(lat: number, lon: number): Promise<WeatherData> {
  const currentUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m&forecast_days=1`
  
  const response = await fetch(currentUrl)
  if (!response.ok) {
    throw new Error('Weather fetch failed')
  }
  
  const data = await response.json()
  
  // Get 6-hour forecast (6 hours from now)
  const currentHour = new Date().getHours()
  const forecastIndex = currentHour + 6
  const forecastTemp = data.hourly.temperature_2m[Math.min(forecastIndex, 23)] ?? data.current.temperature_2m
  
  return {
    temperature: data.current.temperature_2m,
    humidity: data.current.relative_humidity_2m,
    condition: getWeatherCondition(data.current.weather_code),
    forecastTemp,
  }
}

function getWeatherCondition(code: number): string {
  // WMO Weather interpretation codes
  if (code === 0) return 'clear'
  if (code >= 1 && code <= 3) return 'cloudy'
  if (code >= 45 && code <= 48) return 'foggy'
  if (code >= 51 && code <= 67) return 'rainy'
  if (code >= 71 && code <= 77) return 'snowy'
  if (code >= 80 && code <= 82) return 'rainy'
  if (code >= 85 && code <= 86) return 'snowy'
  if (code >= 95) return 'stormy'
  return 'unknown'
}

export function getSeasonFromMonth(): 'spring' | 'summer' | 'autumn' | 'winter' {
  const month = new Date().getMonth()
  if (month >= 2 && month <= 4) return 'spring'
  if (month >= 5 && month <= 7) return 'summer'
  if (month >= 8 && month <= 10) return 'autumn'
  return 'winter'
}

export function getTimeOfDay(): 'day' | 'night' {
  const hour = new Date().getHours()
  return hour >= 6 && hour < 18 ? 'day' : 'night'
}
