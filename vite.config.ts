import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import { defineConfig, loadEnv } from 'vite'
import tsConfigPaths from 'vite-tsconfig-paths'
import tailwindcss from '@tailwindcss/vite'
import viteReact from '@vitejs/plugin-react'

// Simple robust middleware to replace the broken AI API route
const groqApiMiddleware = () => ({
  name: 'groq-api-middleware',
  configureServer(server: any) {
    server.middlewares.use('/api/recommend', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        return res.end('Method not allowed')
      }

      let body = ''
      req.on('data', (chunk: any) => { body += chunk })
      req.on('end', async () => {
        try {
          const { fragrances, weather } = JSON.parse(body)

          const env = loadEnv('', process.cwd(), '')
          const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY

          if (!apiKey) {
            console.log('Groq API key not found, using mock response for demo')
            const selectedFragrance = fragrances[Math.floor(Math.random() * fragrances.length)] || fragrances[0]
            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({
              fragrance: selectedFragrance,
              reasoning: `(Demo Mode) This is a perfect choice for ${weather.temperature}°C and ${weather.condition} weather.`
            }))
          }

          const prompt = `You are a fragrance expert. Given the current weather and a collection of fragrances, recommend exactly ONE fragrance that best fits today.

Current Weather:
- Temperature: ${weather.temperature}°C
- Humidity: ${weather.humidity}%
- Condition: ${weather.condition}

Available Fragrances:
${fragrances.map((f: any) => `- ${f.id}: ${f.name} by ${f.brand} (${f.family})`).join('\n')}

Respond with ONLY a JSON object in this exact format:
{
  "fragranceId": "the exact id of the fragrance",
  "reasoning": "One elegant sentence explaining why this scent fits today's weather."
}`

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: 'You are a fragrance recommendation engine. Return precise JSON.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.5,
              max_tokens: 200,
              response_format: { type: 'json_object' }
            })
          })

          if (!groqRes.ok) throw new Error(await groqRes.text())

          const content = (await groqRes.json()).choices[0]?.message?.content
          const result = JSON.parse(content)

          const selectedFragrance = fragrances.find((f: any) => f.id === result.fragranceId) || fragrances[0]

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ fragrance: selectedFragrance, reasoning: result.reasoning }))

        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    })

    server.middlewares.use('/api/extract-notes', (req: any, res: any) => {
      if (req.method !== 'POST') {
        res.statusCode = 405
        return res.end('Method not allowed')
      }

      let body = ''
      req.on('data', (chunk: any) => { body += chunk })
      req.on('end', async () => {
        try {
          const { name } = JSON.parse(body)

          const env = loadEnv('', process.cwd(), '')
          const apiKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY

          if (!apiKey) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ error: 'Groq API key not found' }))
          }

          const prompt = `You are a fragrance note database. Look up the following fragrance and extract its details.

Fragrance to look up: "${name}"

If the fragrance is real, return its actual details. If the fragrance is fictional or unknown, use your expertise to guess reasonable notes and family based on the name.

Respond with ONLY a JSON object in this exact format (all lowercase values for best_seasons, best_time, longevity, sillage):
{
  "name": "Standardized Fragrance Name",
  "brand": "Standardized Brand/House Name",
  "family": "Fragrance Family (e.g., Woody, Floral, Fresh, Citrus, Oriental, Chypre, Gourmand, Leather)",
  "notes_top": ["note1", "note2", "note3"],
  "notes_heart": ["note1", "note2", "note3"],
  "notes_base": ["note1", "note2", "note3"],
  "best_seasons": ["spring", "summer", "autumn", "winter"],
  "best_time": "day", 
  "longevity": "moderate",
  "sillage": "moderate"
}

Constraints:
- "best_seasons" must only contain array values from: "spring", "summer", "autumn", "winter"
- "best_time" must be exactly one of: "day", "night", "both"
- "longevity" must be exactly one of: "poor", "moderate", "long", "very_long"
- "sillage" must be exactly one of: "intimate", "moderate", "heavy", "enormous"
- Do not output any markdown formatting (no backticks, no \`\`\`json blocks), just the raw JSON object.`;

          const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
              model: 'llama-3.1-8b-instant',
              messages: [
                { role: 'system', content: 'You are a fragrance database API. Return precise raw JSON.' },
                { role: 'user', content: prompt },
              ],
              temperature: 0.2,
              max_tokens: 400,
              response_format: { type: 'json_object' }
            })
          })

          if (!groqRes.ok) throw new Error(await groqRes.text())

          const content = (await groqRes.json()).choices[0]?.message?.content
          const result = JSON.parse(content)

          const cleanName = result.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const cleanBrand = result.brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          const id = `custom-${cleanBrand}-${cleanName}-${Date.now().toString().slice(-4)}`;

          const fragrance = {
            id,
            name: result.name,
            brand: result.brand,
            family: result.family,
            notes_top: Array.isArray(result.notes_top) ? result.notes_top : [],
            notes_heart: Array.isArray(result.notes_heart) ? result.notes_heart : [],
            notes_base: Array.isArray(result.notes_base) ? result.notes_base : [],
            best_seasons: Array.isArray(result.best_seasons) ? result.best_seasons.filter((s: string) => ['spring', 'summer', 'autumn', 'winter'].includes(s)) : ['spring', 'summer', 'autumn', 'winter'],
            best_time: ['day', 'night', 'both'].includes(result.best_time) ? result.best_time : 'both',
            longevity: ['poor', 'moderate', 'long', 'very_long'].includes(result.longevity) ? result.longevity : 'moderate',
            sillage: ['intimate', 'moderate', 'heavy', 'enormous'].includes(result.sillage) ? result.sillage : 'moderate'
          };

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(fragrance))

        } catch (err: any) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: err.message }))
        }
      })
    })
  }
})

export default defineConfig({
  build: {
    sourcemap: false,
  },
  server: {
    port: 3000,
    allowedHosts: true,
  },
  plugins: [
    tailwindcss(),
    tsConfigPaths({
      projects: ['./tsconfig.json'],
    }),
    tanstackStart({
      spa: {
        enabled: true,
      },
    }),
    viteReact(),
    groqApiMiddleware(),
  ],
})
