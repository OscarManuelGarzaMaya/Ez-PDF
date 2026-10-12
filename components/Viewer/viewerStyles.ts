import { StyleSheet } from 'react-native'

// Building blocks shared by the viewer's panels, dialogs and error state
export const viewerStyles = StyleSheet.create({
	bottomPanel: {
		position: 'absolute',
		left: 0,
		right: 0,
		bottom: 0,
		borderTopLeftRadius: 16,
		borderTopRightRadius: 16,
		paddingTop: 8,
		paddingHorizontal: 16,
		elevation: 12,
		shadowColor: '#000',
		shadowOffset: { width: 0, height: -3 },
		shadowOpacity: 0.2,
		shadowRadius: 8,
		zIndex: 30,
	},
	panelHandle: {
		width: 40,
		height: 4,
		borderRadius: 2,
		backgroundColor: 'rgba(150,150,150,0.4)',
		alignSelf: 'center',
		marginBottom: 12,
	},
	panelHeader: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'space-between',
		marginBottom: 12,
	},
	panelTitle: {
		fontSize: 16,
		fontWeight: '700',
	},
	panelCloseButton: {
		width: 32,
		height: 32,
		alignItems: 'center',
		justifyContent: 'center',
	},
	panelCloseIcon: {
		fontSize: 16,
	},
	// Centered icon + title + message (empty, error and limit states)
	state: {
		alignItems: 'center',
		paddingVertical: 36,
		gap: 10,
	},
	stateIcon: {
		fontSize: 44,
	},
	stateTitle: {
		fontSize: 16,
		fontWeight: '600',
		textAlign: 'center',
	},
	stateMessage: {
		fontSize: 14,
		textAlign: 'center',
	},
	primaryButton: {
		borderRadius: 10,
		paddingVertical: 13,
		alignItems: 'center',
	},
	primaryButtonText: {
		color: '#fff',
		fontSize: 15,
		fontWeight: '600',
	},
	textButton: {
		paddingVertical: 6,
		paddingHorizontal: 12,
	},
	textButtonText: {
		fontSize: 14,
		fontWeight: '600',
	},
	input: {
		flex: 1,
		height: 40,
		borderWidth: 1,
		borderRadius: 10,
		paddingHorizontal: 12,
		fontSize: 15,
	},
})
