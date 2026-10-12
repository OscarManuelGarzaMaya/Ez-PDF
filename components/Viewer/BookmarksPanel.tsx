import { useMemo } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, FlatList, type GestureResponderHandlers } from 'react-native'
import Svg, { Path } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { colors } from '../../constants/theme'
import { useBookmarkStore, type Bookmark } from '../../store/bookmarkStore'
import { viewerStyles } from './viewerStyles'

type Props = {
	isDark: boolean
	anim: Animated.Value
	panHandlers: GestureResponderHandlers
	pdfId: string
	onClose: () => void
	onSelect: (page: number) => void
	onHeightChange: (height: number) => void
}

const formatDate = (ts: number) => {
	const d = new Date(ts)
	const pad = (n: number) => String(n).padStart(2, '0')
	return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const BookmarksPanel = ({ isDark, anim, panHandlers, pdfId, onClose, onSelect, onHeightChange }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const insets = useSafeAreaInsets()
	const { t } = useTranslation()

	const bookmarks = useBookmarkStore((state) => state.bookmarks[pdfId])
	const removeBookmark = useBookmarkStore((state) => state.removeBookmark)
	const sorted = useMemo(() => (bookmarks ?? []).slice().sort((a, b) => a.page - b.page), [bookmarks])

	return (
		<Animated.View
			onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}
			style={[
				viewerStyles.bottomPanel,
				{
					backgroundColor: theme.surface,
					paddingBottom: insets.bottom || 12,
					transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [400, 0] }) }],
				},
			]}
			{...panHandlers}
		>
			<View style={viewerStyles.panelHandle} />

			<View style={viewerStyles.panelHeader}>
				<Text style={[viewerStyles.panelTitle, { color: theme.text }]}>{t('viewer.bookmarksTitle')}</Text>
				<TouchableOpacity
					onPress={onClose}
					style={viewerStyles.panelCloseButton}
				>
					<Text style={[viewerStyles.panelCloseIcon, { color: theme.textMuted }]}>✕</Text>
				</TouchableOpacity>
			</View>

			{sorted.length === 0 ? (
				<View style={styles.empty}>
					<Text style={[styles.emptyText, { color: theme.textMuted }]}>{t('viewer.noBookmarks')}</Text>
				</View>
			) : (
				<FlatList
					data={sorted}
					keyExtractor={(item) => `${item.page}`}
					renderItem={({ item }: { item: Bookmark }) => (
						<TouchableOpacity
							style={[styles.item, { borderBottomColor: theme.border }]}
							onPress={() => onSelect(item.page)}
						>
							<View style={styles.itemLeft}>
								<Text style={[styles.page, { color: colors.accent.violet }]}>{t('viewer.page', { page: item.page })}</Text>
								<Text style={[styles.date, { color: theme.textMuted }]}>{formatDate(item.createdAt)}</Text>
							</View>
							<TouchableOpacity
								onPress={() => removeBookmark(pdfId, item.page)}
								style={styles.deleteButton}
								hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
							>
								<Svg
									width={18}
									height={18}
									viewBox="0 0 24 24"
									fill="none"
								>
									<Path
										d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6"
										stroke={colors.accent.red}
										strokeWidth={2}
										strokeLinecap="round"
										strokeLinejoin="round"
									/>
								</Svg>
							</TouchableOpacity>
						</TouchableOpacity>
					)}
				/>
			)}
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	empty: {
		paddingVertical: 32,
		alignItems: 'center',
	},
	emptyText: {
		fontSize: 14,
		textAlign: 'center',
		lineHeight: 20,
	},
	item: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		paddingVertical: 14,
		borderBottomWidth: StyleSheet.hairlineWidth,
	},
	itemLeft: {
		flex: 1,
	},
	page: {
		fontSize: 15,
		fontWeight: '600',
	},
	date: {
		fontSize: 12,
		marginTop: 2,
	},
	deleteButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
})

export default BookmarksPanel
