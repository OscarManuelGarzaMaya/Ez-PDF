import { createClient } from 'npm:@supabase/supabase-js@2'

const MAX_CREDITS = 5

const CORS = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const json = (body: unknown, status = 200) =>
	new Response(JSON.stringify(body), {
		status,
		headers: { ...CORS, 'Content-Type': 'application/json' },
	})

Deno.serve(async (req: Request) => {
	if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })

	let device_id: string, pdf_text: string
	try {
		;({ device_id, pdf_text } = await req.json())
	} catch {
		return json({ error: 'Invalid JSON body' }, 400)
	}

	if (!device_id?.trim() || !pdf_text?.trim()) {
		return json({ error: 'device_id and pdf_text are required' }, 400)
	}

	const supabase = createClient(
		Deno.env.get('SUPABASE_URL')!,
		Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
	)

	// Get credits and apply monthly reset if needed
	const { data: credits, error: creditsError } = await supabase
		.rpc('get_or_init_credits', { p_device_id: device_id })

	if (creditsError || !credits) {
		return json({ error: 'Failed to validate credits' }, 500)
	}

	if (credits.used_count >= MAX_CREDITS) {
		return json({ error: 'Monthly limit reached', reset_date: credits.reset_date }, 403)
	}

	// Call Anthropic
	const anthropicRes = await fetch('https://api.anthropic.com/v1/messages', {
		method: 'POST',
		headers: {
			'x-api-key': Deno.env.get('ANTHROPIC_API_KEY')!,
			'anthropic-version': '2023-06-01',
			'content-type': 'application/json',
		},
		body: JSON.stringify({
			model: 'claude-haiku-4-5-20251001',
			max_tokens: 1024,
			messages: [
				{
					role: 'user',
					content: `Summarize the following PDF document clearly and concisely. Use bullet points for key topics and findings.\n\n${pdf_text}`,
				},
			],
		}),
	})

	if (!anthropicRes.ok) {
		console.error('Anthropic error:', await anthropicRes.text())
		return json({ error: 'Failed to generate summary' }, 502)
	}

	const { content } = await anthropicRes.json()
	const summary: string = content[0].text

	// Increment used_count after successful summary
	await supabase
		.from('summary_credits')
		.update({ used_count: credits.used_count + 1 })
		.eq('device_id', device_id)

	return json({
		summary,
		used_count: credits.used_count + 1,
		reset_date: credits.reset_date,
	})
})
