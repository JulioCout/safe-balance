import { ORPCError } from "@orpc/server";
import { getAircraftProfileById, updateAircraftProfile } from "@repo/database";
import type { Prisma } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const updateAircraftProfileProcedure = protectedProcedure
	.route({
		method: "PUT",
		path: "/aircraft-profiles/{id}",
		tags: ["AircraftProfiles"],
		summary: "Update aircraft profile",
		description: "Update an existing aircraft profile owned by the current user",
	})
	.input(
		z.object({
			id: z.string().min(1),
			name: z.string().min(1),
			model: z.string().min(1),
			data: z.record(z.string(), z.unknown()),
		}),
	)
	.handler(async ({ input: { id, name, model, data }, context: { user } }) => {
		const existing = await getAircraftProfileById(id);

		if (!existing || existing.userId !== user.id) {
			throw new ORPCError("NOT_FOUND");
		}

		const profile = await updateAircraftProfile(id, {
			name,
			model,
			data: data as unknown as Prisma.InputJsonValue,
		});

		return profile;
	});
