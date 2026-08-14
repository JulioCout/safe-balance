import type { I18nConfig } from "./types";

export const config = {
	locales: {
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
		pt: {
			label: "Português",
			currency: "BRL",
		},
	},
	defaultLocale: "pt",
	defaultCurrency: "BRL",
	localeCookieName: "NEXT_LOCALE",
} as const satisfies I18nConfig;

export type Locale = keyof typeof config.locales;
