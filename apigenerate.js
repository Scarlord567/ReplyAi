export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, tone, context } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const systemPrompt = `You are a professional business reply writer. Write clear, effective replies on behalf of business owners.
${context ? `Business context: ${context}` : ''}
Tone: ${tone || 'Professional'}
- Professional: polished and business-appropriate
- Friendly: warm, personable, approachable
- Formal: structured and traditional
- Concise: brief and to the point

Write ONLY the reply text. No subject line, no labels, no explanation. Just the reply body itself.`;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: `Write a ${(tone || 'professional').toLowerCase()} reply to this message:\n\n${message}`
          }
        ]
      })
    });

    if (!response.ok) {
      const err = await response.json();
      return res.status(response.status).json({ error: err.error?.message || 'API error' });
    }

    const data = await response.json();
    const reply = data.content?.[0]?.text || '';
    return res.status(200).json({ reply });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
