import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { PDF } from '../store/pdfStore'

export const pickPDF = async (): Promise<PDF | null> => {
	try {
		const result = await DocumentPicker.getDocumentAsync({
			type: 'application/pdf',
			copyToCacheDirectory: true,
		})

		if (result.canceled) return null

		const file = result.assets[0]

		const destination = `${FileSystem.documentDirectory}${file.name}`
		await FileSystem.copyAsync({
			from: file.uri,
			to: destination,
		})

		const pdf: PDF = {
			id: `${file.name}-${Date.now()}`,
			name: file.name,
			uri: destination,
			size: file.size ?? 0,
			pages: 0,
			lastOpened: Date.now(),
		}

		return pdf
	} catch (error) {
		console.error('Error picking PDF:', error)
		return null
	}
}
