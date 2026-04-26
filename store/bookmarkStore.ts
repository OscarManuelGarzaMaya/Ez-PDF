import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export type Bookmark = {
    page: number
    createdAt: number
}

type BookmarkStore = {
	bookmarks: Record<string, Bookmark[]>
	addBookmark: (fileId: string, page: number) => void
	removeBookmark: (filedId: string, page: number) => void
	getBookmark: (fieldId: string) => Bookmark[]
}

export const useBookmarkStore = create<BookmarkStore>()(
	persist(
		(set, get) => ({
			bookmarks: {},
			addBookmark: (fileId, page) => {
				const current = get().bookmarks[fileId] ?? []
				const already = current.some((b) => b.page === page)
				if (already) return

				set((state) => ({
					bookmarks: {
						...state.bookmarks,
						[fileId]: [...current, { page, createdAt: Date.now() }],
					},
				}))
			},
			removeBookmark: (fileId, page) => {
				const current = get().bookmarks[fileId] ?? []
				set((state) => ({
					bookmarks: {
						...state.bookmarks,
						[fileId]: current.filter((b) => b.page !== page),
					},
				}))
			},
			getBookmark: (fileId) => get().bookmarks[fileId] ?? [],
		}),
		{
			name: 'bookmark-storage',
			storage: createJSONStorage(() => AsyncStorage),
		},
	),
)