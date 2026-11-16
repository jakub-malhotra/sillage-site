# sillage

[live site](https://sillage-flax-kappa.vercel.app/)

a web app that picks a fragrance from your collection based on the day's weather. it fetches real-time temperature, humidity, and forecast conditions from open-meteo, then uses a serverless ai endpoint to match the climate against the scent profiles saved in your local storage. the ui dynamically updates its background gradients to reflect the recommended fragrance family.

### stack
react, typescript, vite, tailwind css, tanstack router, vercel serverless functions, groq api, open-meteo api.

### architecture & features
- **climate-aware matching:** pulls live weather telemetry (temperature, humidity, weather code, and 6-hour temperature delta) via open-meteo to weight scent families appropriately for the environment.
- **structured llm extraction:** uses groq with strict json schema prompts to extract top, heart, and base notes, seasonality, longevity, and sillage from unstructured fragrance inputs.
- **serverless api proxy:** isolates groq api credentials inside vercel serverless functions (`/api/recommend`) so no keys are ever exposed to the client bundle.
- **adaptive ui:** transitions ambient background gradients dynamically based on the recommended scent family while persisting user collections in local storage.

### benchmarks & reliability
tested `/api/recommend` across **50 global cities** (-34 °C to 32.6 °C across clear, cloudy, rainy, foggy, and snowy conditions) against an 18-fragrance collection:

- **schema reliability:** 50/50 first-try valid json responses matching strict field, enum, and anti-hallucination id checks with zero retries or fallbacks.
- **end-to-end latency:** 1.06 s median (1.36 s p95) across live open-meteo fetch (~70 ms median) + groq inference (~988 ms median).
- **lighthouse mobile (slow 4g):** 95+ performance (1.8 s lcp), 100 accessibility, 100 best practices, 100 seo.

see [`scripts/groq-reliability-test.mjs`](./scripts/groq-reliability-test.mjs) for the validation script and [`scripts/groq-reliability-results.md`](./scripts/groq-reliability-results.md) for the full run log.

### local setup
```bash
git clone [https://github.com/jakub-malhotra/sillage-site.git](https://github.com/jakub-malhotra/sillage-site.git)
cd sillage
npm install
echo "GROQ_API_KEY=your_key_here" > .env.local
vercel dev