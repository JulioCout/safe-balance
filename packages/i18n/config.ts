import type { I18nConfig } from "./types";

export const config = {
	locales: {
		pt: {
			label: "Português",
			currency: "BRL",
		},
		en: {
			label: "English",
			currency: "USD",
		},
		de: {
			label: "Deutsch",
			currency: "USD",
		},
		es: {
			label: "Español",
			currency: "USD",
		},
		fr: {
			label: "Français",
			currency: "USD",
		},
	},
	defaultLocale: "pt",
	defaultCurrency: "BRL",
	localeCookieName: "NEXT_LOCALE",
} as const satisfies I18nConfig;

export type Locale = keyof typeof config.locales;
