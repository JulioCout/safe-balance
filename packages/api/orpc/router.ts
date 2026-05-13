import type { RouterClient } from "@orpc/server";

import { adminRouter } from "../modules/admin/router";
import { aircraftProfilesRouter } from "../modules/aircraft-profiles/router";
import { aiRouter } from "../modules/ai/router";
import { notificationsRouter } from "../modules/notifications/router";
import { organizationsRouter } from "../modules/organizations/router";
import { paymentsRouter } from "../modules/payments/router";
import { suggestionsRouter } from "../modules/suggestions/router";
import { usersRouter } from "../modules/users/router";
import { publicProcedure } from "./procedures";

export const router = publicProcedure.router({
	admin: adminRouter,
	aircraftProfiles: aircraftProfilesRouter,
	organizations: organizationsRouter,
	users: usersRouter,
	payments: paymentsRouter,
	ai: aiRouter,
	notifications: notificationsRouter,
	suggestions: suggestionsRouter,
});


export type ApiRouterClient = RouterClient<typeof router>;
