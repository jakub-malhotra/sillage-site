import { performance } from 'node:perf_hooks'
import { MY_FRAGRANCES } from '../src/lib/fragrances.ts'

const API_URL =
  process.env.API_URL || 'https://sillage-flax-kappa.vercel.app/api/recommend'
const DELAY_BETWEEN_REQUESTS_MS = Number(process.env.DELAY_MS ?? 5500)
const MAX_RETRIES = 2

const CITIES = [
  { name: 'New York', lat: 40.7128, lon: -74.006 },
  { name: 'London', lat: 51.5072, lon: -0.1276 },
  { name: 'Tokyo', lat: 35.6762, lon: 139.6503 },
  { name: 'Reykjavik', lat: 64.1466, lon: -21.9426 },
  { name: 'Dubai', lat: 25.2048, lon: 55.2708 },
  { name: 'Singapore', lat: 1.3521, lon: 103.8198 },
  { name: 'Sydney', lat: -33.8688, lon: 151.2093 },
  { name: 'Cairo', lat: 30.0444, lon: 31.2357 },
  { name: 'Moscow', lat: 55.7558, lon: 37.6173 },
  { name: 'Rio de Janeiro', lat: -22.9068, lon: -43.1729 },
  { name: 'Seattle', lat: 47.6062, lon: -122.3321 },
  { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  { name: 'Paris', lat: 48.8566, lon: 2.3522 },
  { name: 'Toronto', lat: 43.6532, lon: -79.3832 },
  { name: 'Mexico City', lat: 19.4326, lon: -99.1332 },
  { name: 'Nairobi', lat: -1.2921, lon: 36.8219 },
  { name: 'Bangkok', lat: 13.7563, lon: 100.5018 },
  { name: 'Oslo', lat: 59.9139, lon: 10.7522 },
  { name: 'Phoenix', lat: 33.4484, lon: -112.074 },
  { name: 'Buenos Aires', lat: -34.6037, lon: -58.3816 },
  { name: 'Cape Town', lat: -33.9249, lon: 18.4241 },
  { name: 'Seoul', lat: 37.5665, lon: 126.978 },
  { name: 'Fairbanks', lat: 64.8378, lon: -147.7164 },
  { name: 'Marrakech', lat: 31.6295, lon: -7.9811 },
  { name: 'Bergen', lat: 60.3913, lon: 5.3221 },
  { name: 'Lima', lat: -12.0464, lon: -77.0428 },
  { name: 'Jakarta', lat: -6.2088, lon: 106.8456 },
  { name: 'Helsinki', lat: 60.1699, lon: 24.9384 },
  { name: 'Riyadh', lat: 24.7136, lon: 46.6753 },
  { name: 'Bogota', lat: 4.711, lon: -74.0721 },
  { name: 'Anchorage', lat: 61.2181, lon: -149.9003 },
  { name: 'Honolulu', lat: 21.3069, lon: -157.8583 },
  { name: 'Istanbul', lat: 41.0082, lon: 28.9784 },
  { name: 'Denver', lat: 39.7392, lon: -104.9903 },
  { name: 'Kathmandu', lat: 27.7172, lon: 85.324 },
  { name: 'Ushuaia', lat: -54.8019, lon: -68.303 },
  { name: 'Tromso', lat: 69.6492, lon: 18.9553 },
  { name: 'Manaus', lat: -3.119, lon: -60.0217 },
  { name: 'Athens', lat: 37.9838, lon: 23.7275 },
  { name: 'Dublin', lat: 53.3498, lon: -6.2603 },
  { name: 'Lagos', lat: 6.5244, lon: 3.3792 },
  { name: 'Yakutsk', lat: 62.0355, lon: 129.6755 },
  { name: 'Doha', lat: 25.2854, lon: 51.531 },
  { name: 'Zurich', lat: 47.3769, lon: 8.5417 },
  { name: 'Havana', lat: 23.1136, lon: -82.3666 },
  { name: 'Wellington', lat: -41.2865, lon: 174.7762 },
  { name: 'San Francisco', lat: 37.7749, lon: -122.4194 },
  { name: 'Harbin', lat: 45.8038, lon: 126.535 },
  { name: 'Lisbon', lat: 38.7223, lon: -9.1393 },
  { name: 'Ulaanbaatar', lat: 47.8864, lon: 106.9057 },
]

// Representative 18-fragrance collection spanning aquatic, citrus, woody, floral, oriental, leather, gourmand
const TEST_FRAGRANCES = MY_FRAGRANCES.slice(0, 18)
const SENT_IDS = new Set(TEST_FRAGRANCES.map((f) => f.id))

const VALID_SEASONS = new Set(['spring', 'summer', 'autumn', 'winter'])
const VALID_TIMES = new Set(['day', 'night', 'both'])
const VALID_LONGEVITY = new Set(['poor', 'moderate', 'long', 'very_long'])
const VALID_SILLAGE = new Set(['intimate', 'moderate', 'heavy', 'enormous'])

function isStringArray(val) {
  return Array.isArray(val) && val.every((item) => typeof item === 'string')
}

function validateRecommendResponse(parsed) {
  if (!parsed || typeof parsed !== 'object') {
    return { valid: false, error: 'Response is not an object' }
  }
  if (typeof parsed.reasoning !== 'string' || parsed.reasoning.trim().length < 10) {
    return { valid: false, error: 'Missing or too-short reasoning string' }
  }
  const f = parsed.fragrance
  if (!f || typeof f !== 'object') {
    return { valid: false, error: 'Missing fragrance object' }
  }
  for (const field of ['id', 'name', 'brand', 'family']) {
    if (typeof f[field] !== 'string' || f[field].trim().length === 0) {
      return { valid: false, error: `Invalid fragrance.${field}` }
    }
  }
  if (!isStringArray(f.notes_top) || !isStringArray(f.notes_heart) || !isStringArray(f.notes_base)) {
    return { valid: false, error: 'Invalid fragrance notes arrays' }
  }
  if (!Array.isArray(f.best_seasons) || !f.best_seasons.every((s) => VALID_SEASONS.has(s))) {
    return { valid: false, error: 'Invalid fragrance.best_seasons' }
  }
  if (!VALID_TIMES.has(f.best_time)) {
    return { valid: false, error: 'Invalid fragrance.best_time' }
  }
  if (!VALID_LONGEVITY.has(f.longevity)) {
    return { valid: false, error: 'Invalid fragrance.longevity' }
  }
  if (!VALID_SILLAGE.has(f.sillage)) {
    return { valid: false, error: 'Invalid fragrance.sillage' }
  }
  if (!SENT_IDS.has(f.id)) {
    return { valid: false, error: `Returned fragrance id "${f.id}" not in input list` }
  }
  return { valid: true, error: null }
}

function getWeatherCondition(code) {
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

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function fetchCityWeather(city) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,weather_code&hourly=temperature_2m&forecast_days=1`
  const start = performance.now()
  const res = await fetch(url)
  const raw = await res.text()
  const elapsedMs = performance.now() - start

  if (!res.ok) {
    throw new Error(`Open-Meteo HTTP ${res.status}: ${raw.slice(0, 120)}`)
  }
  const data = JSON.parse(raw)
  const currentHour = new Date().getHours()
  const forecastIndex = Math.min(currentHour + 6, 23)
  const forecastTemp =
    data.hourly?.temperature_2m?.[forecastIndex] ?? data.current.temperature_2m

  return {
    weather: {
      temperature: data.current.temperature_2m,
      humidity: data.current.relative_humidity_2m,
      condition: getWeatherCondition(data.current.weather_code),
      forecastTemp,
    },
    weatherMs: elapsedMs,
  }
}

function detectServerFallback(parsed, fragrances) {
  if (parsed.fragrance.id !== fragrances[0].id) return false
  const reasoningLower = parsed.reasoning.toLowerCase()
  const firstNameLower = fragrances[0].name.toLowerCase()
  if (reasoningLower.includes(firstNameLower)) return false
  // Check if reasoning names another fragrance in the collection instead
  return fragrances
    .slice(1)
    .some((f) => reasoningLower.includes(f.name.toLowerCase()))
}

async function callRecommendOnce(weather) {
  const start = performance.now()
  let res
  let rawText = ''
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fragrances: TEST_FRAGRANCES, weather }),
    })
    rawText = await res.text()
  } catch (err) {
    return {
      elapsedMs: performance.now() - start,
      status: 0,
      ok: false,
      validJson: false,
      schemaValid: false,
      serverFallback: false,
      error: err instanceof Error ? err.message : String(err),
      parsed: null,
    }
  }
  const elapsedMs = performance.now() - start

  let parsed = null
  let validJson = false
  try {
    parsed = JSON.parse(rawText)
    validJson = true
  } catch {
    validJson = false
  }

  if (!res.ok) {
    return {
      elapsedMs,
      status: res.status,
      ok: false,
      validJson: false, // HTTP error response is not a valid recommendation JSON
      rawErrorJson: validJson,
      schemaValid: false,
      serverFallback: false,
      error: `HTTP ${res.status}: ${rawText.slice(0, 160)}`,
      parsed,
    }
  }

  if (!validJson) {
    return {
      elapsedMs,
      status: res.status,
      ok: true,
      validJson: false,
      schemaValid: false,
      serverFallback: false,
      error: `Invalid JSON: ${rawText.slice(0, 160)}`,
      parsed: null,
    }
  }

  const validation = validateRecommendResponse(parsed)
  const schemaValid = validation.valid
  const serverFallback = schemaValid
    ? detectServerFallback(parsed, TEST_FRAGRANCES)
    : false

  return {
    elapsedMs,
    status: res.status,
    ok: true,
    validJson: true,
    schemaValid,
    serverFallback,
    error: validation.error,
    parsed,
  }
}

function percentile(sortedValues, p) {
  if (sortedValues.length === 0) return 0
  if (p === 0.5) {
    const mid = Math.floor(sortedValues.length / 2)
    return sortedValues.length % 2 === 0
      ? (sortedValues[mid - 1] + sortedValues[mid]) / 2
      : sortedValues[mid]
  }
  const idx = Math.ceil(p * sortedValues.length) - 1
  return sortedValues[Math.max(0, Math.min(idx, sortedValues.length - 1))]
}

async function main() {
  console.log(`Testing ${CITIES.length} cities against ${API_URL}`)
  console.log(`Fragrance wardrobe size: ${TEST_FRAGRANCES.length}`)
  console.log('---')

  const records = []

  for (let i = 0; i < CITIES.length; i++) {
    const city = CITIES[i]
    const { weather, weatherMs } = await fetchCityWeather(city)

    let attempt = 0
    let firstAttempt = null
    let finalAttempt = null
    let totalGroqMs = 0

    while (attempt <= MAX_RETRIES) {
      attempt++
      const res = await callRecommendOnce(weather)
      totalGroqMs += res.elapsedMs
      if (attempt === 1) firstAttempt = res
      finalAttempt = res

      if (res.validJson && res.schemaValid && !res.serverFallback) {
        break
      }
      if (attempt <= MAX_RETRIES) {
        const backoff = res.status === 429 ? 5000 : 1500
        await sleep(backoff)
      }
    }

    const neededRetry = attempt > 1
    const neededFallback =
      Boolean(firstAttempt?.serverFallback) ||
      !(finalAttempt?.validJson && finalAttempt?.schemaValid)

    const fullMs = weatherMs + totalGroqMs

    records.push({
      index: i + 1,
      city: city.name,
      weather,
      weatherMs,
      groqFirstAttemptMs: firstAttempt.elapsedMs,
      groqTotalMs: totalGroqMs,
      fullMs,
      attempts: attempt,
      firstTryValidJson: Boolean(firstAttempt?.validJson),
      firstTrySchemaValid: Boolean(firstAttempt?.schemaValid),
      finalSuccess: Boolean(finalAttempt?.validJson && finalAttempt?.schemaValid),
      neededRetryOrFallback: neededRetry || neededFallback,
      neededRetry,
      firstStatus: firstAttempt?.status ?? 0,
      serverFallback: Boolean(firstAttempt?.serverFallback),
      selectedId: finalAttempt?.parsed?.fragrance?.id ?? null,
      firstError: firstAttempt?.error ?? null,
    })

    const statusTag = firstAttempt.schemaValid
      ? firstAttempt.serverFallback
        ? 'FALLBACK'
        : 'OK'
      : `FAIL(${firstAttempt.error}) -> final=${finalAttempt?.schemaValid ? 'OK' : 'FAIL'}`

    console.log(
      `[${String(i + 1).padStart(2, '0')}/50] ${city.name.padEnd(15)} | ${String(weather.temperature).padStart(5)}°C ${String(weather.humidity).padStart(3)}% ${weather.condition.padEnd(7)} | weather=${weatherMs.toFixed(0)}ms groq=${totalGroqMs.toFixed(0)}ms full=${fullMs.toFixed(0)}ms | ${statusTag}`
    )

    if (i < CITIES.length - 1 && DELAY_BETWEEN_REQUESTS_MS > 0) {
      await sleep(DELAY_BETWEEN_REQUESTS_MS)
    }
  }

  const total = records.length
  const validJsonCount = records.filter((r) => r.firstTryValidJson).length
  const schemaMatchCount = records.filter((r) => r.firstTrySchemaValid).length
  const retryOrFallbackCount = records.filter((r) => r.neededRetryOrFallback).length
  const finalSuccessCount = records.filter((r) => r.finalSuccess).length
  const rateLimitCount = records.filter((r) => r.firstStatus === 429).length
  const serverFallbackCount = records.filter((r) => r.serverFallback).length

  const weatherTimes = records.map((r) => r.weatherMs).sort((a, b) => a - b)
  const groqTimes = records
    .map((r) => r.groqTotalMs)
    .sort((a, b) => a - b)
  const fullTimes = records.map((r) => r.fullMs).sort((a, b) => a - b)

  const temps = records.map((r) => r.weather.temperature)
  const conditions = [...new Set(records.map((r) => r.weather.condition))]

  console.log('\n=== SUMMARY ===')
  console.log(
    `Weather variety: min=${Math.min(...temps)}°C, max=${Math.max(...temps)}°C, conditions=${conditions.join(', ')}`
  )
  console.log(`Valid JSON on first try: ${validJsonCount} out of ${total}`)
  console.log(`Matched expected schema: ${schemaMatchCount} out of ${total}`)
  console.log(`Needed retry or fallback: ${retryOrFallbackCount} out of ${total}`)
  console.log(
    `Breakdown -> 429 rate limits: ${rateLimitCount} out of ${total} | server fallbacks: ${serverFallbackCount} out of ${total} | final valid after retries: ${finalSuccessCount} out of ${total}`
  )
  console.log('\n=== LATENCY (ms) ===')
  console.log(
    `Full request  -> median: ${percentile(fullTimes, 0.5).toFixed(1)} ms | p95: ${percentile(fullTimes, 0.95).toFixed(1)} ms | max: ${fullTimes[fullTimes.length - 1].toFixed(1)} ms`
  )
  console.log(
    `Weather fetch -> median: ${percentile(weatherTimes, 0.5).toFixed(1)} ms | p95: ${percentile(weatherTimes, 0.95).toFixed(1)} ms | max: ${weatherTimes[weatherTimes.length - 1].toFixed(1)} ms`
  )
  console.log(
    `Groq API call -> median: ${percentile(groqTimes, 0.5).toFixed(1)} ms | p95: ${percentile(groqTimes, 0.95).toFixed(1)} ms | max: ${groqTimes[groqTimes.length - 1].toFixed(1)} ms`
  )
}

main().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
