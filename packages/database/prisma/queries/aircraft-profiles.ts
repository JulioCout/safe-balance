import type { Prisma } from "../generated/client";
import { db } from "../client";

export async function listAircraftProfilesByUserId(userId: string) {
	return db.aircraftProfile.findMany({
		where: { userId },
		orderBy: { updatedAt: "desc" },
	});
}

export async function getAircraftProfileById(id: string) {
	return db.aircraftProfile.findUnique({
		where: { id },
	});
}

export async function createAircraftProfile(input: {
	userId: string;
	name: string;
	model: string;
	data: Prisma.InputJsonValue;
}) {
	return db.aircraftProfile.create({
		data: {
			userId: input.userId,
			name: input.name,
			model: input.model,
			data: input.data,
		},
	});
}

export async function updateAircraftProfile(
	id: string,
	input: {
		name: string;
		model: string;
		data: Prisma.InputJsonValue;
	},
) {
	return db.aircraftProfile.update({
		where: { id },
		data: {
			name: input.name,
			model: input.model,
			data: input.data,
		},
	});
}

export async function deleteAircraftProfile(id: string) {
	return db.aircraftProfile.delete({
		where: { id },
	});
}
