export interface StorageBucketNamesConfig {
	/**
	 * Bucket used for user and organization avatar uploads.
	 */
	avatars: string;
	/**
	 * Bucket used for calculation reports.
	 */
	relatorios: string;
}

export interface StorageConfig {
	/**
	 * Logical storage bucket names used throughout the application.
	 */
	bucketNames: StorageBucketNamesConfig;
}

export type CreateBucketHandler = (
	name: string,
	options?: {
		public?: boolean;
	},
) => Promise<void>;

export type GetSignedUploadUrlHandler = (
	path: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
	},
) => Promise<string>;

export type GetSignedUrlHander = (
	path: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
		expiresIn?: number;
	},
) => Promise<string>;

export type UploadFileHandler = (
	path: string,
	file: Buffer | Uint8Array,
	options: {
		bucket: keyof StorageBucketNamesConfig;
		contentType?: string;
	},
) => Promise<void>;

export interface FileObject {
	key: string;
	lastModified?: Date;
	size?: number;
}

export type ListFilesHandler = (
	prefix: string,
	options: {
		bucket: keyof StorageBucketNamesConfig;
	},
) => Promise<FileObject[]>;

