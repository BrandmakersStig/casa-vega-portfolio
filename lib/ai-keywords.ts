import 'server-only'

/**
 * AI keyword/description generation via the Anthropic Messages API
 * (vision). Requires `ANTHROPIC_API_KEY` — the admin "Generate with AI"
 * button (components/admin/ai-generate-button.tsx) surfaces a clear error
 * if it's unset rather than failing silently.
 *
 * Results are stored in `images.ai_keywords` / `images.ai_description`
 * (see supabase/migrations/0001_init.sql) and are always editable
 * afterwards — they never overwrite manually-entered title/keywords, only
 * populate the dedicated AI fields for the admin to review and apply.
 */
export interface AiMetadataResult {
  description: string
  keywords: string[]
}

const MODEL = 'claude-sonnet-5'

export async function generateAiMetadata(imageUrl: string): Promise<AiMetadataResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY ?? process.env.AI_PROVIDER_API_KEY
  if (!apiKey) {
    throw new Error(
      'ANTHROPIC_API_KEY er ikke sat — AI-generering af keywords/beskrivelser kræver en API-nøgle. Se lib/ai-keywords.ts.'
    )
  }

  // Fetch and base64-encode the image ourselves rather than relying on the
  // API to fetch the URL — keeps this working regardless of Storage bucket
  // visibility/CORS and API URL-fetch support.
  const imageRes = await fetch(imageUrl)
  if (!imageRes.ok) throw new Error(`Kunne ikke hente billedet (${imageRes.status})`)
  const contentType = imageRes.headers.get('content-type') ?? 'image/webp'
  const buffer = Buffer.from(await imageRes.arrayBuffer())
  const base64 = buffer.toString('base64')

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 400,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: contentType, data: base64 } },
            {
              type: 'text',
              text: [
                'Du beskriver fotografier til et fotografi-portfolio.',
                'Svar KUN med gyldig JSON i denne form, intet andet:',
                '{"description": "1-2 sætninger på dansk, poetisk men præcist", "keywords": ["8-12 relevante danske keywords, ét ord eller kort frase hver"]}',
              ].join('\n'),
            },
          ],
        },
      ],
    }),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(`Anthropic API fejl (${res.status}): ${text.slice(0, 200)}`)
  }

  const data = await res.json()
  const text: string = data.content?.[0]?.text ?? ''
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Kunne ikke fortolke AI-svaret som JSON')

  const parsed = JSON.parse(jsonMatch[0])
  return {
    description: String(parsed.description ?? ''),
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
  }
}
