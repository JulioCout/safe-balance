"use client";

import { AircraftBalanceCalculator } from "@aircraft-profiles/components/AircraftBalanceCalculator";
import { useParams } from "next/navigation";

export default function CalculateAircraftProfilePage() {
	const params = useParams();
	const profileId = params.profileId as string;

	return <AircraftBalanceCalculator profileId={profileId} />;
}
