import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type OnboardingStore = {
	hasSeen: boolean
	markSeen: () => void
	hasSeenViewerTour: boolean
	markViewerSeen: () => void
	resetOnboarding: () => void
	_hasHydrated: boolean
	setHasHydrated: (value: boolean) => void
}

export const useOnboardingStore = create<OnboardingStore>()(
	persist(
		(set) => ({
			hasSeen: false,
			markSeen: () => set({ hasSeen: true }),
			hasSeenViewerTour: false,
			markViewerSeen: () => set({ hasSeenViewerTour: true }),
			resetOnboarding: () => set({ hasSeen: false, hasSeenViewerTour: false }),
			_hasHydrated: false,
			setHasHydrated: (value) => set({ _hasHydrated: value }),
		}),
		{
			name: 'onboarding-storage',
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true)
			},
		}
	)
)
