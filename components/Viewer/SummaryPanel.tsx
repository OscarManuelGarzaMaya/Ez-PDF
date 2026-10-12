import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Animated, ScrollView, ActivityIndicator, Dimensions, type GestureResponderHandlers } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useTranslation } from 'react-i18next'
import * as Clipboard from 'expo-clipboard'
import { colors } from '../../constants/theme'
import { useDeviceStore } from '../../store/deviceStore'
import { generateSummary, type SummaryResult } from '../../services/summary'
import { viewerStyles } from './viewerStyles'

const { height: SCREEN_HEIGHT } = Dimensions.get('window')
const MAX_CREDITS = 5

type Props = {
	isDark: boolean
	anim: Animated.Value
	panHandlers: GestureResponderHandlers
	pdfUri: string
	onClose: () => void
}

const formatResetDate = (dateStr: string, lang: string): string => {
	const [year, month, day] = dateStr.split('-').map(Number)
	const d = new Date(year, month - 1, day)
	return d.toLocaleDateString(lang, { day: 'numeric', month: 'short' })
}

const SummaryPanel = ({ isDark, anim, panHandlers, pdfUri, onClose }: Props) => {
	const theme = isDark ? colors.dark : colors.light
	const insets = useSafeAreaInsets()
	const { t, i18n } = useTranslation()
	const deviceId = useDeviceStore((state) => state.deviceId)

	// null while generating
	const [result, setResult] = useState<SummaryResult | null>(null)

	// The panel is only opened after the user confirms, so mounting it is what starts generation
	useEffect(() => {
		let cancelled = false
		generateSummary(deviceId, pdfUri).then((res) => {
			if (!cancelled) setResult(res)
		})
		return () => {
			cancelled = true
		}
	}, [deviceId, pdfUri])

	const renderContent = () => {
		if (!result) {
			return (
				<View style={viewerStyles.state}>
					<ActivityIndicator
						size="large"
						color={colors.accent.teal}
					/>
					<Text style={[viewerStyles.stateMessage, { color: theme.textMuted }]}>{t('viewer.generating')}</Text>
				</View>
			)
		}

		if (result.ok) {
			return (
				<>
					<ScrollView
						showsVerticalScrollIndicator
						style={styles.scroll}
					>
						<View style={[styles.box, { borderColor: colors.accent.teal, backgroundColor: theme.background }]}>
							<Text style={[styles.text, { color: theme.text }]}>{result.summary}</Text>
						</View>
					</ScrollView>

					<View style={[styles.creditSection, { borderTopColor: theme.border }]}>
						<Text style={[styles.creditLabel, { color: theme.textMuted }]}>{t('viewer.creditsUsed', { used: result.used_count, max: MAX_CREDITS })}</Text>
						<View style={[styles.progressTrack, { backgroundColor: theme.border }]}>
							<View
								style={[
									styles.progressFill,
									{
										width: `${(result.used_count / MAX_CREDITS) * 100}%`,
										backgroundColor: colors.accent.teal,
									},
								]}
							/>
						</View>
						<Text style={[styles.resetDate, { color: theme.textMuted }]}>{t('viewer.renewsOn', { date: formatResetDate(result.reset_date, i18n.language) })}</Text>
					</View>

					<TouchableOpacity
						style={[viewerStyles.primaryButton, { backgroundColor: colors.accent.teal }]}
						onPress={() => Clipboard.setStringAsync(result.summary)}
					>
						<Text style={viewerStyles.primaryButtonText}>{t('viewer.copySummary')}</Text>
					</TouchableOpacity>
				</>
			)
		}

		if (result.limitReached) {
			return (
				<View style={viewerStyles.state}>
					<Text style={viewerStyles.stateIcon}>📋</Text>
					<Text style={[viewerStyles.stateTitle, { color: theme.text }]}>{t('viewer.limitTitle')}</Text>
					<Text style={[viewerStyles.stateMessage, { color: theme.textMuted }]}>
						{t('viewer.renewsOn', { date: formatResetDate(result.reset_date, i18n.language) })}
					</Text>
				</View>
			)
		}

		return (
			<View style={viewerStyles.state}>
				<Text style={viewerStyles.stateIcon}>⚠️</Text>
				<Text style={[viewerStyles.stateTitle, { color: theme.text }]}>{t('viewer.errorTitle')}</Text>
				<Text style={[viewerStyles.stateMessage, { color: theme.textMuted }]}>{t('viewer.errorMessage')}</Text>
			</View>
		)
	}

	return (
		<Animated.View
			style={[
				viewerStyles.bottomPanel,
				styles.panel,
				{
					backgroundColor: theme.surface,
					paddingBottom: insets.bottom || 12,
					transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
				},
			]}
			{...panHandlers}
		>
			<View style={viewerStyles.panelHandle} />

			<View style={viewerStyles.panelHeader}>
				<Text style={[viewerStyles.panelTitle, { color: theme.text }]}>{t('viewer.summaryTitle')}</Text>
				<TouchableOpacity
					onPress={onClose}
					style={viewerStyles.panelCloseButton}
				>
					<Text style={[viewerStyles.panelCloseIcon, { color: theme.textMuted }]}>✕</Text>
				</TouchableOpacity>
			</View>

			{renderContent()}
		</Animated.View>
	)
}

const styles = StyleSheet.create({
	panel: {
		maxHeight: SCREEN_HEIGHT * 0.78,
	},
	scroll: {
		flexGrow: 0,
	},
	box: {
		borderLeftWidth: 3,
		borderRadius: 4,
		padding: 14,
		marginBottom: 16,
	},
	text: {
		fontSize: 14,
		lineHeight: 22,
	},
	creditSection: {
		gap: 6,
		paddingTop: 12,
		marginHorizontal: 16,
		marginBottom: 12,
		borderTopWidth: StyleSheet.hairlineWidth,
	},
	creditLabel: {
		fontSize: 13,
		fontWeight: '600',
	},
	progressTrack: {
		height: 6,
		borderRadius: 3,
		overflow: 'hidden',
	},
	progressFill: {
		height: 6,
		borderRadius: 3,
	},
	resetDate: {
		fontSize: 12,
	},
})

export default SummaryPanel
