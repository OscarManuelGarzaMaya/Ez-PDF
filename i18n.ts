import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import { getLocales } from 'expo-localization'

import es from './locales/es.json'
import en from './locales/en.json'
import fr from './locales/fr.json'

const SUPPORTED = ['es', 'en', 'fr'] as const
export type SupportedLocale = (typeof SUPPORTED)[number]

export const resolveLocale = (code: string | null | undefined): SupportedLocale =>
	SUPPORTED.includes(code as SupportedLocale) ? (code as SupportedLocale) : 'en'

const deviceLang = resolveLocale(getLocales()[0]?.languageCode)

i18n.use(initReactI18next).init({
	resources: {
		es: { translation: es },
		en: { translation: en },
		fr: { translation: fr },
	},
	lng: deviceLang,
	fallbackLng: 'en',
	interpolation: { escapeValue: false },
})

export default i18n
