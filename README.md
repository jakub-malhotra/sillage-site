# sillage

[live site](https://sillage-flax-kappa.vercel.app/)

a web app that picks a fragrance from your collection based on the day's weather. it checks the local temperature, humidity, and forecast through open-meteo, then uses ai to match the weather against the fragrances saved in your browser. the background colors shift to match the scent family it picks.

### stack
react, typescript, vite, tailwind css, tanstack router, vercel serverless functions, groq api, open-meteo api.

### how it works
- **weather-aware picks:** checks live temperature, humidity, conditions, and the 6-hour forecast via open-meteo to suggest scents that fit the weather.
- **automatic note breakdown:** uses groq to turn a fragrance name into structured notes (top, heart, base), best seasons, longevity, and sillage in a consistent json format.
- **secure api calls:** routes groq requests through vercel serverless functions (`/api/recommend`) so api keys stay on the server and out of the browser.
- **dynamic ui:** saves your collection in local storage and shifts the page gradients to reflect the recommended fragrance family.

### benchmarks & reliability
tested `/api/recommend` across **50 global cities** (-34 °C to 32.6 °C across clear, cloudy, rainy, foggy, and snowy conditions) against an 18-fragrance collection:

- **schema reliability:** 50/50 first-try valid json responses matching strict field, enum, and anti-hallucination id checks with zero retries or fallbacks.
- **end-to-end latency:** 1.06 s median (1.36 s p95) across live open-meteo fetch (~70 ms median) + groq inference (~988 ms median).
- **lighthouse mobile (slow 4g):** 99 performance (1.8 s lcp), 100 accessibility, 100 best practices, 100 seo.

see [`scripts/groq-reliability-test.mjs`](./scripts/groq-reliability-test.mjs) for the validation script and [`scripts/groq-reliability-results.md`](./scripts/groq-reliability-results.md) for the full run log.

### local setup
```bash
git clone [https://github.com/jakub-malhotra/sillage-site.git](https://github.com/jakub-malhotra/sillage-site.git)
cd sillage
npm install
echo "GROQ_API_KEY=your_key_here" > .env.local
vercel dev
