"use client";

import { AircraftProfileForm } from "@aircraft-profiles/components/AircraftProfileForm";
import { useParams } from "next/navigation";

export default function AircraftProfileEditPage() {
	const params = useParams();
	const profileId = params.profileId as string;

	return <AircraftProfileForm profileId={profileId} />;
}
