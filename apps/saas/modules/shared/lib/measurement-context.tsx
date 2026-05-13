"use client";

import Cookies from "js-cookie";
import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

export type MeasurementSystem = "metric" | "imperial";

const MEASUREMENT_COOKIE = "measurement-system";

interface MeasurementContextValue {
	measurementSystem: MeasurementSystem;
	setMeasurementSystem: (system: MeasurementSystem) => void;
	isMetric: boolean;
}

const MeasurementContext = createContext<MeasurementContextValue | undefined>(undefined);

export function MeasurementProvider({ children }: { children: ReactNode }) {
	const [measurementSystem, setMeasurementSystem] = useState<MeasurementSystem>("metric");

	useEffect(() => {
		// Read from cookie on mount
		const cookieValue = Cookies.get(MEASUREMENT_COOKIE);
		if (cookieValue === "metric" || cookieValue === "imperial") {
			setMeasurementSystem(cookieValue);
		}
	}, []);

	const handleSetMeasurementSystem = (system: MeasurementSystem) => {
		setMeasurementSystem(system);
		Cookies.set(MEASUREMENT_COOKIE, system, {
			expires: 365, // Persist for 1 year
		});
	};

	return (
		<MeasurementContext.Provider
			value={{
				measurementSystem,
				setMeasurementSystem: handleSetMeasurementSystem,
				isMetric: measurementSystem === "metric",
			}}
		>
			{children}
		</MeasurementContext.Provider>
	);
}

export function useMeasurement() {
	const context = useContext(MeasurementContext);
	if (context === undefined) {
		throw new Error("useMeasurement must be used within a MeasurementProvider");
	}
	return context;
}
