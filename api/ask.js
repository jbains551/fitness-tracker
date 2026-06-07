import { streamText, convertToModelMessages } from 'ai';
import { getUserIdFromRequest } from './_clerk.js';

export const config = { runtime: 'nodejs' };

const SYSTEM_PROMPT = `You are a knowledgeable assistant focused on health, nutrition, training, sleep, and general wellness topics. You're embedded in a personal fitness and nutrition tracking app.

Guidelines:
- Be concise and direct. Default to short, practical answers.
- Cite evidence where relevant (mechanism, study type, general consensus).
- When a question touches medication, diagnosis, treatment, or symptoms, briefly answer the factual question and recommend the user consult a qualified medical professional for personal decisions.
- Refuse to give individualized medical, prescription, or dosage advice.
- If asked about supplements or nutrients, mention typical ranges and key caveats (interactions, lab markers worth checking) without prescribing a regimen.
- Format with light Markdown when it helps (short lists, bold key terms). Avoid heavy formatting for short answers.
- You do not have access to the user's logged data.`;

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
  const messages = Array.isArray(body) ? body : body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: 'messages required' });
    return;
  }

  try {
    const modelMessages = await convertToModelMessages(messages);
    const result = streamText({
      model: 'anthropic/claude-haiku-4-5',
      system: SYSTEM_PROMPT,
      messages: modelMessages,
    });

    result.pipeUIMessageStreamToResponse(res, {
      onError: (error) => {
        console.error('stream error:', error);
        return error instanceof Error ? error.message : String(error);
      },
    });
  } catch (error) {
    console.error('handler error:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : String(error),
      hint: 'If this mentions AI Gateway, enable it in your Vercel project (Project → AI Gateway tab) or set AI_GATEWAY_API_KEY.',
    });
  }
}
