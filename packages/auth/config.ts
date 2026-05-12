import type { AuthConfig } from "./types";

export const config = {
	enableSignup: true,
	enableMagicLink: false,
	enableSocialLogin: false,
	enablePasskeys: false,
	enablePasswordLogin: true,
	enableTwoFactor: true,
	sessionCookieMaxAge: 60 * 60 * 24 * 30,
	users: {
		enableOnboarding: false,
	},
	organizations: {
		enable: false,
		hideOrganization: true,
		enableUsersToCreateOrganizations: false,
		requireOrganization: false,
		forbiddenOrganizationSlugs: [
			"new-organization",
			"admin",
			"settings",
			"ai-demo",
			"organization-invitation",
			"chatbot",
		],
	},
} as const satisfies AuthConfig;
