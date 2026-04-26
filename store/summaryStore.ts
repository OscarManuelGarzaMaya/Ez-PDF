import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const MAX_CREDITS = 5

type SummaryStore = {
	usedCount: number
	resetDate: string
	incrementUsed: () => void
	resetIfNeeded: () => void
	hasCredits: () => boolean
}

export const useSummaryStore = create<SummaryStore>()(
	persist(
		(set, get) => ({
			usedCount: 0,
			resetDate: getNextMonthDate(),
			incrementUsed: () => set((state) => ({ usedCount: state.usedCount + 1 })),
			resetIfNeeded: () => {
				const today = new Date().toISOString().split('T')[0]
				if (today >= get().resetDate) {
					set({ usedCount: 0, resetDate: getNextMonthDate() })
				}
			},
			hasCredits: () => get().usedCount < MAX_CREDITS,
		}),
		{
			name: 'summary-storage',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
)

function getNextMonthDate(): string {
    const d = new Date()
    d.setMonth(d.getMonth()+1)
    return d.toISOString().split('T')[0]
}