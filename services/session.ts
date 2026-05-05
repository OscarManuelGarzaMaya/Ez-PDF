import { supabase } from './supabase'

export const initSession = async (deviceId: string): Promise<void> => {
	console.log('[Session] Device ID:', deviceId)

	// getSession() reads local storage — use rpc or a real query to verify the connection
	const { error: pingError } = await supabase.from('summary_credits').select('count').limit(1)
	if (pingError) {
		const isTableMissing = pingError.code === '42P01' || pingError.message.includes('schema cache')
		if (isTableMissing) {
			console.log('[Session] Supabase connection OK (summary_credits not created yet — Issue #11 pending)')
		} else {
			console.warn('[Session] Supabase connection failed:', pingError.message)
		}
		return
	}

	const { error: upsertError } = await supabase
		.from('summary_credits')
		.upsert({ device_id: deviceId, used_count: 0 }, { onConflict: 'device_id', ignoreDuplicates: true })

	if (upsertError) {
		console.warn('[Session] Upsert error:', upsertError.message)
	} else {
		console.log('[Session] Session initialized OK')
	}
}
