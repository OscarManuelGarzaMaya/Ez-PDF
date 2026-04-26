import { create } from 'zustand'

export type PDF = {
	id: string
	name: string
	uri: string
	size: number
	pages: number
	lastOpened: number
}

type PDFStore = {
	pdfs: PDF[]
	activePdf: PDF | null
	addPdf: (pdf: PDF) => void
	setActivePdf: (pdf: PDF) => void
	removePdf: (id: string) => void
}

export const usePdfStore = create<PDFStore>((set) => ({
	pdfs: [],
	activePdf: null,
	addPdf: (pdf) => set((state) => ({ pdfs: [...state.pdfs, pdf] })),
	setActivePdf: (pdf) => set({ activePdf: pdf }),
	removePdf: (id) =>
		set((state) => ({ pdfs: state.pdfs.filter((p) => p.id !== id) })),
}))