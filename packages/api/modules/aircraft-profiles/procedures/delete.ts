import { ORPCError } from "@orpc/server";
import { deleteAircraftProfile, getAircraftProfileById } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const deleteAircraftProfileProcedure = protectedProcedure
	.route({
		method: "DELETE",
		path: "/aircraft-profiles/{id}",
		tags: ["AircraftProfiles"],
		summary: "Delete aircraft profile",
		description: "Delete an aircraft profile owned by the current user",
	})
	.input(
		z.object({
			id: z.string().min(1),
		}),
	)
	.handler(async ({ input: { id }, context: { user } }) => {
		const existing = await getAircraftProfileById(id);

		if (!existing || existing.userId !== user.id) {
			throw new ORPCError("NOT_FOUND");
		}

		await deleteAircraftProfile(id);

		return { ok: true as const };
	});
