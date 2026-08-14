import { createAircraftProfileProcedure } from "./procedures/create";
import { deleteAircraftProfileProcedure } from "./procedures/delete";
import { listAircraftProfiles } from "./procedures/list";
import { sendReportProcedure } from "./procedures/send-report";
import { updateAircraftProfileProcedure } from "./procedures/update";

export const aircraftProfilesRouter = {
	list: listAircraftProfiles,
	create: createAircraftProfileProcedure,
	update: updateAircraftProfileProcedure,
	delete: deleteAircraftProfileProcedure,
	sendReport: sendReportProcedure,
};
