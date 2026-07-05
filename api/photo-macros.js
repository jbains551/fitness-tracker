import { generateObject, jsonSchema } from 'ai';
import { getUserIdFromRequest } from './_clerk.js';

export const config = { runtime: 'nodejs' };

// Vision-capable model. Sonnet gives stronger food recognition and portion
// reasoning than Haiku, at higher cost/latency. Swap back to
// 'anthropic/claude-haiku-4-5' if speed/cost matters more than accuracy.
const MODEL = 'anthropic/claude-sonnet-5';

const SYSTEM_PROMPT = `You are a nutrition estimation assistant. Given a photo of a meal, identify each distinct food/drink item and estimate its macronutrients.

Rules:
- Break the plate into separate items (e.g. "grilled chicken breast", "white rice", "side salad"), not one combined entry.
- Estimate a realistic restaurant/home portion for each item based on visual size cues (plate size, utensils, comparison to known objects).
- Give calories (cal), protein (p), carbs (c), and fat (f) in grams. Numbers must be whole integers and internally consistent (roughly cal ≈ 4*p + 4*c + 9*f).
- Account for likely hidden ingredients (cooking oil, butter, dressing, sauce) that a plain visual scan would miss.
- Set confidence per item: "high" when the food and portion are clear, "medium" when the food is clear but portion is uncertain, "low" when the food itself is ambiguous or hidden.
- "portion" is a short human description of the estimated serving, e.g. "~6 oz" or "1 cup".
- In "note", add one short sentence of caveats (e.g. what's hidden or uncertain). Keep it brief.
- If the image is not food, return an empty items array and say so in the note.`;

const schema = jsonSchema({
  type: 'object',
  additionalProperties: false,
  required: ['items', 'note'],
  properties: {
    items: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['name', 'portion', 'cal', 'p', 'c', 'f', 'confidence'],
        properties: {
          name: { type: 'string' },
          portion: { type: 'string' },
          cal: { type: 'number' },
          p: { type: 'number' },
          c: { type: 'number' },
          f: { type: 'number' },
          confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
        },
      },
    },
    note: { type: 'string' },
  },
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method not allowed' });
    return;
  }

  let userId;
  try {
    userId = await getUserIdFromRequest(req);
  } catch (err) {
    res.status(500).json({ error: 'auth misconfigured', detail: String(err?.message || err) });
    return;
  }
  if (!userId) {
    res.status(401).json({ error: 'unauthorized' });
    return;
  }

  const body = req.body ?? {};
  const image = body.image;

  if (typeof image !== 'string' || !image.startsWith('data:image/')) {
    res.status(400).json({ error: 'image required (data URL)' });
    return;
  }

  try {
    const result = await generateObject({
      model: MODEL,
      schema,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Estimate the macros for this meal.' },
            { type: 'image', image },
          ],
        },
      ],
    });

    res.status(200).json(result.object);
  } catch (error) {
    console.error('photo-macros error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      hint: 'If this mentions AI Gateway, enable it in your Vercel project (Project → AI Gateway tab) or set AI_GATEWAY_API_KEY.',
    });
  }
}
