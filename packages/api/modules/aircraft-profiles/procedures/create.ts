import { createAircraftProfile } from "@repo/database";
import type { Prisma } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const createAircraftProfileProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/aircraft-profiles",
		tags: ["AircraftProfiles"],
		summary: "Create aircraft profile",
		description: "Create a new aircraft profile for the current user",
	})
	.input(
		z.object({
			name: z.string().min(1),
			model: z.string().min(1),
			data: z.record(z.string(), z.unknown()),
		}),
	)
	.handler(async ({ input: { name, model, data }, context: { user } }) => {
		const profile = await createAircraftProfile({
			userId: user.id,
			name,
			model,
			data: data as unknown as Prisma.InputJsonValue,
		});

		return profile;
	});
