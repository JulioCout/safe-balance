import { AircraftProfileForm } from "@aircraft-profiles/components/AircraftProfileForm";

export default async function AircraftProfilePage(props: {
	params: Promise<{ profileId: string }>;
}) {
	const { profileId } = await props.params;
	return <AircraftProfileForm profileId={profileId} />;
}
