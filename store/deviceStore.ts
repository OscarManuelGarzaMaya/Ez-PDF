import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

const generateUUID = (): string => {
	if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
		return crypto.randomUUID()
	}
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
		const r = (Math.random() * 16) | 0
		return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
	})
}

type DeviceStore = {
	deviceId: string
	_hasHydrated: boolean
	setHasHydrated: (value: boolean) => void
}

export const useDeviceStore = create<DeviceStore>()(
	persist(
		(set) => ({
			deviceId: generateUUID(),
			_hasHydrated: false,
			setHasHydrated: (value) => set({ _hasHydrated: value }),
		}),
		{
			name: 'device-storage',
			storage: createJSONStorage(() => AsyncStorage),
			onRehydrateStorage: () => (state) => {
				state?.setHasHydrated(true)
			},
		}
	)
)
