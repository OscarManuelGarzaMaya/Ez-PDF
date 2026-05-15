import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	StyleSheet,
} from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useTranslation } from 'react-i18next'
import { PDF } from '../../store/pdfStore'
import { colors, ICON_COLORS } from '../../constants/theme'

type Props = {
	isDark: boolean
	pdfs: PDF[]
	onPress: (pdf: PDF) => void
}

const RecentCarousel = ({ isDark, pdfs, onPress}: Props)=>{
    const theme = isDark ? colors.dark : colors.light
    const { t } = useTranslation()

    return (
					<View style={styles.wrapper}>
						<Text style={[styles.sectionTitle, { color: theme.text }]}>
							{t('recentCarousel.title')}
						</Text>
						<View>
							<ScrollView
								horizontal
								showsHorizontalScrollIndicator={false}
								contentContainerStyle={styles.scrollContent}
							>
								{pdfs.map((pdf) => (
									<TouchableOpacity
										key={pdf.id}
										style={[styles.card, { backgroundColor: theme.surface }]}
										onPress={() => onPress(pdf)}
									>
										<View style={[styles.cardIcon, { backgroundColor: ICON_COLORS[pdf.colorIndex ?? pdf.id.charCodeAt(0) % ICON_COLORS.length] }]}>
											<Text style={styles.cardIconText}>PDF</Text>
										</View>
										<Text
											style={[styles.cardName, { color: theme.text }]}
											numberOfLines={2}
										>
											{pdf.name}
										</Text>
										<Text style={[styles.cardSize, { color: theme.textMuted }]}>
											{(pdf.size / 1024).toFixed(1)} KB
										</Text>
									</TouchableOpacity>
								))}
							</ScrollView>
							<LinearGradient
								colors={[
									'transparent',
									isDark ? colors.dark.background : colors.light.background,
								]}
								start={{ x: 0, y: 1}}
								end={{ x: 1, y: 1 }}
								style={styles.fadeRight}
								pointerEvents="none"
							/>
						</View>
					</View>
				)
}

const styles = StyleSheet.create({
	wrapper: {
		marginTop: 10,
	},
	sectionTitle: {
		fontSize: 18,
		fontWeight: 'bold',
		marginHorizontal: 20,
		marginBottom: 12,
	},
	scrollContent: {
		paddingHorizontal: 20,
		gap: 12,
		paddingRight: 60,
	},
	card: {
		width: 140,
		borderRadius: 16,
		padding: 14,
		gap: 8,
	},
	cardIcon: {
		width: 44,
		height: 44,
		borderRadius: 10,
		alignItems: 'center',
		justifyContent: 'center',
	},
	cardIconText: {
		color: '#fff',
		fontWeight: 'bold',
		fontSize: 12,
	},
	cardName: {
		fontSize: 13,
		fontWeight: '600',
	},
	cardSize: {
		fontSize: 11,
	},
	fadeRight: {
		position: 'absolute',
		right: 0,
		top: 0,
		bottom: 0,
		width: 80,
	},
})

export default RecentCarousel