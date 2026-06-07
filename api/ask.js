import { streamText, convertToModelMessages } from 'ai';

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

export default async function handler(request) {
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'method not allowed' }), {
      status: 405,
      headers: { 'content-type': 'application/json' },
    });
  }

  let messages;
  try {
    const body = await request.json();
    messages = body.messages;
  } catch {
    return new Response(JSON.stringify({ error: 'invalid json' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'messages required' }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  try {
    const result = streamText({
      model: 'anthropic/claude-haiku-4-5',
      system: SYSTEM_PROMPT,
      messages: convertToModelMessages(messages),
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => {
        console.error('streamText error:', error);
        return error instanceof Error ? error.message : 'Unknown error';
      },
    });
  } catch (error) {
    console.error('handler error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'If this mentions AI Gateway, enable it in your Vercel project (vercel.com → project → AI Gateway tab) or set AI_GATEWAY_API_KEY.',
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}
