import { create} from "zustand"
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from "@react-native-async-storage/async-storage"

type ThemeStore = {
	isDark: boolean
	toggleTheme: () => void
	setTheme: (isDark: boolean) => void
}

export const useThemeStore = create<ThemeStore>()(
	persist(
		(set) => ({
			isDark: true,
			toggleTheme: () => set((state) => ({ isDark: !state.isDark })),
			setTheme: (isDark) => set({ isDark }),
		}),
		{
			name: 'theme-storage',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
)