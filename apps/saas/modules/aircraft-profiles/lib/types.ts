export type StationType =
	| "SINGLE_SEAT"
	| "ROW_OF_SEATS"
	| "CARGO"
	| "FUEL"
	| "AIRCRAFT_ITEMS";

export interface AircraftStation {
	id: string;
	name: string;
	type: StationType;
	arm: number;
	seatCount?: number;
	fuelCapacityGallons?: number;
	weightPerGallon?: number;
}

export interface CGLimit {
	arm: number;
	weight: number;
}

export interface AircraftProfileData {
	profileName: string;
	aircraftModel: string;
	registration?: string;
	basicEmptyWeight: number;
	basicEmptyCG: number;
	mtow: number;
	stations: AircraftStation[];
	forwardCGLimits: CGLimit[];
	aftCGLimits: CGLimit[];
}

export interface AircraftProfileTemplate {
	id: string;
	name: string;
	data: AircraftProfileData;
}

// ── Station type helpers ────────────────────────────────────────────
export const STATION_TYPES: StationType[] = [
	"SINGLE_SEAT",
	"ROW_OF_SEATS",
	"CARGO",
	"FUEL",
	"AIRCRAFT_ITEMS",
];

// ── Template: Cessna 172 Skyhawk ────────────────────────────────────
export const CESSNA_172_TEMPLATE: AircraftProfileTemplate = {
	id: "cessna-172-skyhawk",
	name: "Cessna 172 Skyhawk",
	data: {
		profileName: "Cessna 172 Skyhawk",
		aircraftModel: "Cessna 172 Skyhawk",
		registration: "",
		basicEmptyWeight: 1642,
		basicEmptyCG: 38.3,
		mtow: 2550,
		stations: [
			{
				id: "station-front-seats",
				name: "Piloto e Passageiro Dianteiro",
				type: "ROW_OF_SEATS",
				arm: 37,
				seatCount: 2,
			},
			{
				id: "station-rear-seats",
				name: "Passageiros Traseiros",
				type: "ROW_OF_SEATS",
				arm: 73,
				seatCount: 2,
			},
			{
				id: "station-baggage-1",
				name: "Bagagem (Área 1)",
				type: "CARGO",
				arm: 95,
			},
			{
				id: "station-fuel",
				name: "Combustível (30 gal)",
				type: "FUEL",
				arm: 48,
				fuelCapacityGallons: 30,
				weightPerGallon: 6,
			},
		],
		forwardCGLimits: [
			{ arm: 35.0, weight: 1500 },
			{ arm: 35.0, weight: 1950 },
		],
		aftCGLimits: [
			{ arm: 41.0, weight: 1950 },
			{ arm: 41.0, weight: 2550 },
		],
	},
};

export const AIRCRAFT_TEMPLATES: AircraftProfileTemplate[] = [CESSNA_172_TEMPLATE];

// ── Empty profile factory ───────────────────────────────────────────
export function createEmptyProfileData(): AircraftProfileData {
	return {
		profileName: "",
		aircraftModel: "",
		registration: "",
		basicEmptyWeight: 0,
		basicEmptyCG: 0,
		mtow: 0,
		stations: [],
		forwardCGLimits: [],
		aftCGLimits: [],
	};
}

let _stationCounter = 0;
export function generateStationId(): string {
	_stationCounter += 1;
	return `station-${Date.now()}-${_stationCounter}`;
}
