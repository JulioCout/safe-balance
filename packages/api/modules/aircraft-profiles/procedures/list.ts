import { listAircraftProfilesByUserId } from "@repo/database";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

export const listAircraftProfiles = protectedProcedure
	.route({
		method: "GET",
		path: "/aircraft-profiles",
		tags: ["AircraftProfiles"],
		summary: "List aircraft profiles",
		description: "Returns all aircraft profiles for the current user",
	})
	.input(
		z.object({
			search: z.string().optional(),
		}),
	)
	.handler(async ({ input: { search }, context: { user } }) => {
		const profiles = await listAircraftProfilesByUserId(user.id);

		if (search && search.trim().length > 0) {
			const query = search.toLowerCase().trim();
			return profiles.filter(
				(p) =>
					p.name.toLowerCase().includes(query) ||
					p.model.toLowerCase().includes(query),
			);
		}

		return profiles;
	});
