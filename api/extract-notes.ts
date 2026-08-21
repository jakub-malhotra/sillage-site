import type { IncomingMessage, ServerResponse } from 'http';

interface ExtendedRequest extends IncomingMessage {
  body?: any;
}

interface ExtendedResponse extends ServerResponse {
  status: (statusCode: number) => ExtendedResponse;
  json: (body: any) => void;
  send: (body: any) => void;
}

export default async function handler(req: ExtendedRequest, res: ExtendedResponse) {
  if (req.method !== 'POST') {
    return res.status(405).send('Method Not Allowed');
  }

  try {
    const { name } = req.body || {};
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Missing required parameter: name' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured on Vercel server. Please add GROQ_API_KEY to your Vercel environment variables.' });
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
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: 'You are a fragrance database API. Return precise raw JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      })
    });

    if (!groqRes.ok) {
      const errorText = await groqRes.text();
      return res.status(groqRes.status || 500).json({ error: errorText });
    }

    const groqData = await groqRes.json();
    const content = groqData.choices[0]?.message?.content;
    const result = JSON.parse(content);

    // Generate a unique id
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

    return res.status(200).json(fragrance);

  } catch (err: any) {
    console.error('Error in extract-notes handler:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
