import * as FileSystem from 'expo-file-system/legacy'
import { supabase } from './supabase'

export type SummaryResult =
	| { ok: true; summary: string; used_count: number; reset_date: string }
	| { ok: false; limitReached: true; reset_date: string }
	| { ok: false; limitReached: false; error: string }

export const generateSummary = async (
	deviceId: string,
	pdfUri: string
): Promise<SummaryResult> => {
	const pdf_base64 = await FileSystem.readAsStringAsync(pdfUri, {
		encoding: FileSystem.EncodingType.Base64,
	})

	const { data, error } = await supabase.functions.invoke('generate-summary', {
		body: { device_id: deviceId, pdf_base64 },
	})

	if (error) {
		const body = (error as any).context
		if (body?.reset_date) {
			return { ok: false, limitReached: true, reset_date: body.reset_date }
		}
		return { ok: false, limitReached: false, error: error.message }
	}

	return {
		ok: true,
		summary: data.summary,
		used_count: data.used_count,
		reset_date: data.reset_date,
	}
}
