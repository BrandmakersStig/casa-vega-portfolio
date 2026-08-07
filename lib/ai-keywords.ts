import 'server-only'

/**
 * Pluggable AI keyword/description generator. No provider is wired up by
 * default (this repo intentionally ships without an AI API key baked in) —
 * swap the body of `generateAiMetadata` for a real call once you have one
 * (Anthropic/OpenAI vision models both work well for this: send the image
 * URL/bytes, ask for a short description + 8-12 keywords in Danish).
 *
 * Results are stored in `images.ai_keywords` / `images.ai_description`
 * (see supabase/migrations/0001_init.sql) and are always editable by the
 * admin afterwards — they never overwrite manually-entered title/keywords.
 */
export interface AiMetadataResult {
  description: string
  keywords: string[]
}

export async function generateAiMetadata(imageUrl: string): Promise<AiMetadataResult> {
  if (!process.env.AI_PROVIDER_API_KEY) {
    throw new Error(
      'AI_PROVIDER_API_KEY er ikke sat — AI-generering af keywords/beskrivelser kræver en API-nøgle. Se lib/ai-keywords.ts.'
    )
  }

  // Example shape for wiring up a real provider:
  //
  // const res = await fetch('https://api.anthropic.com/v1/messages', {
  //   method: 'POST',
  //   headers: {
  //     'x-api-key': process.env.AI_PROVIDER_API_KEY!,
  //     'anthropic-version': '2023-06-01',
  //     'content-type': 'application/json',
  //   },
  //   body: JSON.stringify({
  //     model: 'claude-sonnet-5',
  //     max_tokens: 300,
  //     messages: [{
  //       role: 'user',
  //       content: [
  //         { type: 'image', source: { type: 'url', url: imageUrl } },
  //         { type: 'text', text: 'Giv en kort dansk billedbeskrivelse (1-2 sætninger) og 8-12 relevante keywords som JSON: {"description": "...", "keywords": ["..."]}' },
  //       ],
  //     }],
  //   }),
  // })
  // const data = await res.json()
  // return JSON.parse(data.content[0].text)

  throw new Error('Ingen AI-provider forbundet endnu.')
}
