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
  }
})

export default defineConfig({
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
