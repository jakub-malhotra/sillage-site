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
    const { fragrances, weather } = req.body || {};
    if (!fragrances || !weather) {
      return res.status(400).json({ error: 'Missing required parameters: fragrances or weather' });
    }

    const apiKey = process.env.GROQ_API_KEY;

    if (!apiKey) {
      return res.status(500).json({ error: 'Groq API key not configured on Vercel server. Please add GROQ_API_KEY to your Vercel environment variables.' });
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
}`;

    const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'openai/gpt-oss-120b',
        messages: [
          { role: 'system', content: 'You are a fragrance recommendation engine. Return precise JSON.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.5,
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

    const selectedFragrance = fragrances.find((f: any) => f.id === result.fragranceId) || fragrances[0];

    return res.status(200).json({ fragrance: selectedFragrance, reasoning: result.reasoning });

  } catch (err: any) {
    console.error('Error in recommendation handler:', err);
    return res.status(500).json({ error: err.message || 'Internal Server Error' });
  }
}
