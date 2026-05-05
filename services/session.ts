import { supabase } from './supabase'

export const initSession = async (deviceId: string): Promise<void> => {
	await supabase.rpc('get_or_init_credits', { p_device_id: deviceId })
}
