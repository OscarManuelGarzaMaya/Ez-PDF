import { useEffect, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated, type GestureResponderHandlers } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import { searchTextDirect } from 'react-native-pdf-jsi'
import { colors } from '../../constants/theme'
import { viewerStyles } from './viewerStyles'

export type HighlightRect = { page: number; rect: string }
type SearchResult = HighlightRect & { text: string }

type Props = {
	isDark: boolean
	anim: Animated.Value
	panHandlers: GestureResponderHandlers
	pdfId: string
	totalPages: number
	keyboardHeight: number
	onClose: () => void
	onGoToPage: (page: number) => void
	onHighlightsChange: (highlights: HighlightRect[]) => void
	onHeightChange: (height: number) => void
}

const SEARCH_DEBOUNCE_MS = 300

const SearchPanel = ({ isDark, anim, panHandlers, pdfId, totalPages, keyboardHeight, onClose, onGoToPage, onHighlightsChange, onHeightChange }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const insets = useSafeAreaInsets()
	const { t } = useTranslation()

	const [query, setQuery] = useState('')
	const [results, setResults] = useState<SearchResult[]>([])
	const [currentMatch, setCurrentMatch] = useState(0)
	const debounce = useRef<ReturnType<typeof setTimeout> | null>(null)
	const mounted = useRef(true)

	const applyResults = (next: SearchResult[]) => {
		// A search still in flight when the panel closed must not repaint highlights
		if (!mounted.current) return
		setResults(next)
		setCurrentMatch(0)
		onHighlightsChange(next.map((r) => ({ page: r.page, rect: r.rect })))
	}

	// Closing the panel unmounts it: drop pending searches and clear highlights from the document
	useEffect(
		() => () => {
			mounted.current = false
			if (debounce.current) clearTimeout(debounce.current)
			onHighlightsChange([])
		},
		[onHighlightsChange],
	)

	const performSearch = (text: string) => {
		if (debounce.current) clearTimeout(debounce.current)
		if (!text.trim() || totalPages === 0) {
			applyResults([])
			return
		}
		debounce.current = setTimeout(async () => {
			try {
				const found = (await searchTextDirect(pdfId, text, 1, totalPages)) as SearchResult[]
				applyResults(found)
				if (found.length > 0 && mounted.current) onGoToPage(found[0].page)
			} catch {
				applyResults([])
			}
		}, SEARCH_DEBOUNCE_MS)
	}

	const goToMatch = (index: number) => {
		if (results.length === 0) return
		const next = (index + results.length) % results.length
		setCurrentMatch(next)
		onGoToPage(results[next].page)
	}

	return (
		<Animated.View
			onLayout={(e) => onHeightChange(e.nativeEvent.layout.height)}
			style={[
				viewerStyles.bottomPanel,
				{
					backgroundColor: theme.surface,
					paddingBottom: insets.bottom || 12,
					bottom: keyboardHeight,
					transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [200, 0] }) }],
				},
			]}
			{...panHandlers}
		>
			<View style={viewerStyles.panelHandle} />

			<View style={styles.searchRow}>
				<TouchableOpacity
					onPress={onClose}
					style={viewerStyles.panelCloseButton}
				>
					<Text style={[viewerStyles.panelCloseIcon, { color: theme.textMuted }]}>✕</Text>
				</TouchableOpacity>

				<TextInput
					style={[viewerStyles.input, { color: theme.text, borderColor: theme.border, backgroundColor: theme.background }]}
					placeholder={t('viewer.searchPlaceholder')}
					placeholderTextColor={theme.textMuted}
					value={query}
					onChangeText={(text) => {
						setQuery(text)
						performSearch(text)
					}}
					autoFocus
					returnKeyType="search"
				/>

				{results.length > 0 && (
					<Text style={[styles.searchCounter, { color: theme.textMuted }]}>
						{currentMatch + 1}/{results.length}
					</Text>
				)}
			</View>

			{results.length > 0 && (
				<View style={styles.searchNavRow}>
					<TouchableOpacity
						onPress={() => goToMatch(currentMatch - 1)}
						style={viewerStyles.textButton}
					>
						<Text style={[viewerStyles.textButtonText, { color: theme.text }]}>{t('viewer.searchPrev')}</Text>
					</TouchableOpacity>
					<TouchableOpacity
						onPress={() => goToMatch(currentMatch + 1)}
						style={viewerStyles.textButton}
					>
						<Text style={[viewerStyles.textButtonText, { color: theme.text }]}>{t('viewer.searchNext')}</Text>
					</TouchableOpacity>
				</View>
			)}
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	searchRow: {
		flexDirection: 'row',
		alignItems: 'center',
		gap: 8,
		marginBottom: 8,
	},
	searchCounter: {
		fontSize: 13,
		minWidth: 44,
		textAlign: 'right',
	},
	searchNavRow: {
		flexDirection: 'row',
		justifyContent: 'center',
		gap: 24,
		paddingBottom: 4,
	},
})

export default SearchPanel
