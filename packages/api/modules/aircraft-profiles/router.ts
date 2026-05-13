import { createAircraftProfileProcedure } from "./procedures/create";
import { deleteAircraftProfileProcedure } from "./procedures/delete";
import { listAircraftProfiles } from "./procedures/list";
import { updateAircraftProfileProcedure } from "./procedures/update";

export const aircraftProfilesRouter = {
	list: listAircraftProfiles,
	create: createAircraftProfileProcedure,
	update: updateAircraftProfileProcedure,
	delete: deleteAircraftProfileProcedure,
};
