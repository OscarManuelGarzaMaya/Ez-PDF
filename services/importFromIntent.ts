import * as FileSystem from 'expo-file-system/legacy'
import { usePdfStore, PDF } from '../store/pdfStore'
import { ICON_COLORS } from '../constants/theme'

// Deterministic numeric hash so the same URI always produces the same filename
const stableNum = (str: string): number => {
	let h = 0
	for (let i = 0; i < str.length; i++) {
		h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
	}
	return Math.abs(h)
}

const extractFilename = (uri: string): string => {
	const decoded = decodeURIComponent(uri)

	// Samsung Downloads (and some other providers) encode the real path after "raw:"
	// e.g. content://downloads/document/raw:/storage/emulated/0/Download/file.pdf
	const rawMatch = decoded.match(/raw:(.+)$/)
	if (rawMatch) {
		const name = rawMatch[1].split('/').pop() ?? ''
		if (name.toLowerCase().endsWith('.pdf')) return name
	}

	// Standard last-segment extraction — works for most file managers
	// (Samsung Files, Mi Files, Huawei Files, OPPO, etc.)
	const lastSegment = (decoded.split('/').pop() ?? '').split('?')[0]
	if (lastSegment.toLowerCase().endsWith('.pdf') && lastSegment.length > 4) {
		return lastSegment
	}

	// Fallback: stable hash so the same source URI always maps to the same filename
	// This ensures deduplication works even when the real name can't be extracted
	return `document-${stableNum(uri).toString(36)}.pdf`
}

export const importFromUri = async (uri: string): Promise<string | null> => {
	try {
		const filename = extractFilename(uri)
		const destination = `${FileSystem.documentDirectory}${filename}`

		await FileSystem.copyAsync({ from: uri, to: destination })

		const info = await FileSystem.getInfoAsync(destination)
		if (!info.exists) return null

		const pdf: PDF = {
			id: `${filename}-${stableNum(uri).toString(36)}`,
			name: filename,
			uri: destination,
			size: 'size' in info ? info.size : 0,
			pages: 0,
			lastOpened: Date.now(),
			colorIndex: Math.floor(Math.random() * ICON_COLORS.length),
		}

		usePdfStore.getState().addPdf(pdf)

		const stored = usePdfStore.getState().pdfs.find((p) => p.uri === destination)
		return stored?.id ?? null
	} catch (error) {
		console.error('importFromUri error:', error)
		return null
	}
}
