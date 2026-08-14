export type StationType = "crew" | "pax" | "cargo" | "fuel";

export interface AircraftStation {
	id: string;
	name: string;
	type: StationType;
	arm: number; // meters from datum
	maxMass?: number; // kg
}

export interface EnvelopePoint {
	x: number; // CG (m)
	y: number; // Mass (kg)
}

export interface AircraftLimits {
	MTOM: number; // Maximum Take-Off Mass (kg)
	MZFM: number; // Maximum Zero Fuel Mass (kg)
	MLDM: number; // Maximum Landing Mass (kg)
}

export interface AircraftProfileData {
	profileName: string;
	aircraftModel: string;
	registration?: string;
	bem: number; // Basic Empty Mass (kg)
	bemCG: number; // Basic Empty Mass CG (m)
	limits: AircraftLimits;
	stations: AircraftStation[];
	envelope: EnvelopePoint[];
}

export interface AircraftProfileTemplate {
	id: string;
	name: string;
	data: AircraftProfileData;
}

export const STATION_TYPES: StationType[] = ["crew", "pax", "cargo", "fuel"];

export const STATION_TYPE_LABELS: Record<StationType, string> = {
	crew: "Tripulação",
	pax: "Passageiro",
	cargo: "Carga",
	fuel: "Combustível",
};

// ── Template: Cessna Caravan C-208 ─────────────────────────────────
export const CESSNA_CARAVAN_C208_TEMPLATE: AircraftProfileTemplate = {
	id: "cessna-caravan-c208",
	name: "Cessna Caravan C-208",
	data: {
		profileName: "Cessna Caravan C-208",
		aircraftModel: "Cessna Caravan C-208",
		registration: "",
		bem: 2424,
		bemCG: 3.33,
		limits: {
			MTOM: 3969,
			MZFM: 3266,
			MLDM: 3946,
		},
		stations: [
			{ id: "pilot", name: "Piloto", type: "crew", arm: 2.87, maxMass: 120 },
			{ id: "copilot", name: "Co-piloto", type: "crew", arm: 2.87, maxMass: 120 },
			{ id: "seat3", name: "Assento 3", type: "pax", arm: 3.42, maxMass: 110 },
			{ id: "seat4", name: "Assento 4", type: "pax", arm: 3.42, maxMass: 110 },
			{ id: "seat5", name: "Assento 5", type: "pax", arm: 3.75, maxMass: 110 },
			{ id: "seat6", name: "Assento 6", type: "pax", arm: 3.75, maxMass: 110 },
			{ id: "seat7", name: "Assento 7", type: "pax", arm: 4.05, maxMass: 110 },
			{ id: "cargo1", name: "Cargo Est. 1", type: "cargo", arm: 2.2, maxMass: 200 },
			{ id: "cargo2", name: "Cargo Est. 2", type: "cargo", arm: 4.8, maxMass: 150 },
			{ id: "fuel", name: "Combustível", type: "fuel", arm: 3.35, maxMass: 1200 },
		],
		envelope: [
			{ x: 3.213, y: 2200 },
			{ x: 3.213, y: 3300 },
			{ x: 3.25, y: 3700 },
			{ x: 3.272, y: 3969 },
			{ x: 3.454, y: 3969 },
			{ x: 3.454, y: 2200 },
			{ x: 3.213, y: 2200 },
		],
	},
};

export const AIRCRAFT_TEMPLATES: AircraftProfileTemplate[] = [CESSNA_CARAVAN_C208_TEMPLATE];

// ── Empty profile factory ───────────────────────────────────────────
export function createEmptyProfileData(): AircraftProfileData {
	return {
		profileName: "",
		aircraftModel: "",
		registration: "",
		bem: 0,
		bemCG: 0,
		limits: { MTOM: 0, MZFM: 0, MLDM: 0 },
		stations: [],
		envelope: [],
	};
}

let _stationCounter = 0;
export function generateStationId(): string {
	_stationCounter += 1;
	return `station-${Date.now()}-${_stationCounter}`;
}
