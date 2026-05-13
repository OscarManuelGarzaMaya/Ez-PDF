import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

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
    _hasHydrated: boolean
    setHasHydrated: (value: boolean) => void
	addPdf: (pdf: PDF) => void
	setActivePdf: (pdf: PDF) => void
	removePdf: (id: string) => void
	pruneDeleted: (ids: string[]) => void
	updateLastOpened: (id: string) => void
}

export const usePdfStore = create<PDFStore>()(
	persist(
		(set) => ({
			pdfs: [],
			activePdf: null,
			_hasHydrated: false,
			setHasHydrated: (value) => set({ _hasHydrated: value }),
			addPdf: (pdf) => set((state) => ({ pdfs: [...state.pdfs, pdf] })),
			setActivePdf: (pdf) => set({ activePdf: pdf }),
			removePdf: (id) =>
				set((state) => ({ pdfs: state.pdfs.filter((p) => p.id !== id) })),
			pruneDeleted: (ids) =>
				set((state) => ({ pdfs: state.pdfs.filter((p) => !ids.includes(p.id)) })),
			updateLastOpened: (id) =>
				set((state) => ({
					pdfs: state.pdfs.map((p) => p.id === id ? { ...p, lastOpened: Date.now() } : p),
				})),
		}),
		{
			name: 'pdf-storage',
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true)
			}
		},
	),
)
