import { desc, eq } from "drizzle-orm";

import { db } from "../client";
import { aircraftProfile } from "../schema/postgres";

export async function listAircraftProfilesByUserId(userId: string) {
	return await db.query.aircraftProfile.findMany({
		where: (profile, { eq }) => eq(profile.userId, userId),
		orderBy: [desc(aircraftProfile.updatedAt)],
	});
}

export async function getAircraftProfileById(id: string) {
	return await db.query.aircraftProfile.findFirst({
		where: (profile, { eq }) => eq(profile.id, id),
	});
}

export async function createAircraftProfile(input: {
	userId: string;
	name: string;
	model: string;
	data: unknown;
}) {
	const [created] = await db
		.insert(aircraftProfile)
		.values({
			userId: input.userId,
			name: input.name,
			model: input.model,
			data: input.data as any,
			createdAt: new Date(),
			updatedAt: new Date(),
		})
		.returning();

	return created;
}

export async function updateAircraftProfile(
	id: string,
	input: {
		name: string;
		model: string;
		data: unknown;
	},
) {
	const [updated] = await db
		.update(aircraftProfile)
		.set({
			name: input.name,
			model: input.model,
			data: input.data as any,
			updatedAt: new Date(),
		})
		.where(eq(aircraftProfile.id, id))
		.returning();

	return updated;
}

export async function deleteAircraftProfile(id: string) {
	const [deleted] = await db.delete(aircraftProfile).where(eq(aircraftProfile.id, id)).returning();

	return deleted;
}
