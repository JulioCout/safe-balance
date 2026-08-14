import { AircraftBalanceCalculator } from "@aircraft-profiles/components/AircraftBalanceCalculator";

export default async function AircraftCalculatePage(props: {
	params: Promise<{ profileId: string }>;
}) {
	const { profileId } = await props.params;
	return <AircraftBalanceCalculator profileId={profileId} />;
}
