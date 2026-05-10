import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

type ThemeStore = {
	isDark: boolean
	isManual: boolean
	_hasHydrated: boolean
	toggleTheme: () => void
	syncWithSystem: (systemIsDark: boolean, respectManual?: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
	persist(
		(set) => ({
			isDark: false,
			isManual: false,
			_hasHydrated: false,
			// Flip theme and mark as manually overridden
			toggleTheme: () => set((state) => ({ isDark: !state.isDark, isManual: true })),
			// Called with the device system preference.
			// respectManual=true (initial hydration): keep manual override if set.
			// respectManual=false (real system change): always follow system and clear the manual flag.
			syncWithSystem: (systemIsDark: boolean, respectManual = false) =>
				set((state) => {
					if (respectManual && state.isManual) return state
					return { isDark: systemIsDark, isManual: false }
				}),
		}),
		{
			name: 'theme-storage',
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				if (state) state._hasHydrated = true
			},
		}
	)
)
