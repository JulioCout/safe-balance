import type { StorageConfig } from "./types";

export const config = {
	bucketNames: {
		avatars: process.env.NEXT_PUBLIC_AVATARS_BUCKET_NAME ?? "avatars",
		relatorios: process.env.NEXT_PUBLIC_RELATORIOS_BUCKET_NAME ?? "relatorios",
	},
} as const satisfies StorageConfig;
