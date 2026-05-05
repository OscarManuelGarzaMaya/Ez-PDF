import { supabase } from './supabase'

export const initSession = async (deviceId: string): Promise<void> => {
	console.log('[Session] Device ID:', deviceId)

	// getSession() reads local storage — use rpc or a real query to verify the connection
	const { error: pingError } = await supabase.from('summary_credits').select('count').limit(1)

	const { error: upsertError } = await supabase
		.from('summary_credits')
		.upsert({ device_id: deviceId, used_count: 0 }, { onConflict: 'device_id', ignoreDuplicates: true })
}
