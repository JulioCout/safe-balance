"use client";

import {
	Button,
	Card,
	cn,
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Skeleton,
} from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { PageHeader } from "@shared/components/PageHeader";
import {
	ArrowLeftIcon,
	PlusIcon,
	SaveIcon,
	Trash2Icon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAircraftProfilesQuery, useUpdateAircraftProfileMutation } from "../lib/api";
import type { AircraftProfileData, AircraftStation, CGLimit, StationType } from "../lib/types";
import { generateStationId, STATION_TYPES } from "../lib/types";
import { getStationTypeIcon } from "./NewAircraftDialog";

interface AircraftProfileFormProps {
	profileId: string;
}

export function AircraftProfileForm({ profileId }: AircraftProfileFormProps) {
	const t = useTranslations();
	const updateMutation = useUpdateAircraftProfileMutation();
	const { data: profiles, isLoading } = useAircraftProfilesQuery();

	const [formData, setFormData] = useState<AircraftProfileData | null>(null);
	const [stationDialogOpen, setStationDialogOpen] = useState(false);
	const [isDirty, setIsDirty] = useState(false);

	// Find the profile in the list
	const profile = profiles?.find((p) => p.id === profileId);

	useEffect(() => {
		if (profile && !formData) {
			setFormData(profile.data as unknown as AircraftProfileData);
		}
	}, [profile, formData]);

	const updateField = useCallback(
		<K extends keyof AircraftProfileData>(key: K, value: AircraftProfileData[K]) => {
			setFormData((prev) => (prev ? { ...prev, [key]: value } : prev));
			setIsDirty(true);
		},
		[],
	);

	// ── Station management ──────────────────────────────────────────
	function addStation(type: StationType) {
		if (!formData) return;

		const newStation: AircraftStation = {
			id: generateStationId(),
			name: t(`aircraftProfiles.stationTypes.${type}`),
			type,
			arm: 0,
			maxWeight: 0,
			...(type === "SINGLE_SEAT" ? { seatCount: 1 } : {}),
			...(type === "ROW_OF_SEATS" ? { seatCount: 2 } : {}),
			...(type === "FUEL" ? { fuelCapacityGallons: 0, weightPerGallon: 6 } : {}),
		};

		updateField("stations", [...formData.stations, newStation]);
		setStationDialogOpen(false);
	}

	function updateStation(stationId: string, updates: Partial<AircraftStation>) {
		if (!formData) return;
		updateField(
			"stations",
			formData.stations.map((s) => (s.id === stationId ? { ...s, ...updates } : s)),
		);
	}

	function removeStation(stationId: string) {
		if (!formData) return;
		updateField(
			"stations",
			formData.stations.filter((s) => s.id !== stationId),
		);
	}

	// ── CG Limit management ─────────────────────────────────────────
	function addCGLimit(type: "forwardCGLimits" | "aftCGLimits") {
		if (!formData) return;
		updateField(type, [...formData[type], { arm: 0, weight: 0 }]);
	}

	function updateCGLimit(
		type: "forwardCGLimits" | "aftCGLimits",
		index: number,
		updates: Partial<CGLimit>,
	) {
		if (!formData) return;
		const limits = [...formData[type]];
		limits[index] = { ...limits[index], ...updates };
		updateField(type, limits);
	}

	function removeCGLimit(type: "forwardCGLimits" | "aftCGLimits", index: number) {
		if (!formData) return;
		updateField(
			type,
			formData[type].filter((_, i) => i !== index),
		);
	}

	// ── Save ────────────────────────────────────────────────────────
	async function handleSave() {
		if (!formData || !profile) return;

		try {
			await updateMutation.mutateAsync({
				id: profileId,
				name: formData.profileName || profile.name,
				model: formData.aircraftModel || profile.model,
				data: formData as unknown as Record<string, unknown>,
			});
			toastSuccess(t("aircraftProfiles.notifications.saved"));
			setIsDirty(false);
		} catch {
			toastError(t("aircraftProfiles.notifications.saveError"));
		}
	}

	// ── Loading state ───────────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="gap-6 flex flex-col">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-64 w-full rounded-xl" />
			</div>
		);
	}

	if (!profile || !formData) {
		return (
			<div className="py-16 text-center">
				<p className="text-muted-foreground">{t("aircraftProfiles.notFound")}</p>
				<Button asChild variant="outline" className="mt-4">
					<Link href="/aircraft-profiles">{t("aircraftProfiles.backToList")}</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="mx-auto max-w-3xl">
			{/* Header */}
			<div className="gap-4 mb-6 flex items-center">
				<Button asChild variant="ghost" size="icon" className="shrink-0">
					<Link href="/aircraft-profiles">
						<ArrowLeftIcon className="size-5" />
					</Link>
				</Button>
				<PageHeader
					title={formData.profileName || t("aircraftProfiles.newAircraft")}
					subtitle={formData.aircraftModel}
					className="mb-0"
				/>
			</div>

			{/* Basic info */}
			<Card className="gap-4 mb-6 p-5 flex flex-col">
				<h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
					{t("aircraftProfiles.form.basicInfo")}
				</h3>

				<div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="profileName">{t("aircraftProfiles.form.profileName")}</Label>
						<Input
							id="profileName"
							value={formData.profileName}
							onChange={(e) => updateField("profileName", e.target.value)}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="aircraftModel">{t("aircraftProfiles.form.aircraftModel")}</Label>
						<Input
							id="aircraftModel"
							value={formData.aircraftModel}
							onChange={(e) => updateField("aircraftModel", e.target.value)}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="registration">{t("aircraftProfiles.form.registration")}</Label>
						<Input
							id="registration"
							value={formData.registration ?? ""}
							onChange={(e) => updateField("registration", e.target.value)}
							placeholder="PT-ABC"
						/>
					</div>
				</div>

				<div className="my-1 h-px bg-border" />

				<div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="basicEmptyWeight">
							{t("aircraftProfiles.form.basicEmptyWeight")} (lb)
						</Label>
						<Input
							id="basicEmptyWeight"
							type="number"
							step="0.1"
							value={formData.basicEmptyWeight || ""}
							onChange={(e) =>
								updateField("basicEmptyWeight", Number.parseFloat(e.target.value) || 0)
							}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="basicEmptyCG">
							{t("aircraftProfiles.form.basicEmptyCG")} (in)
						</Label>
						<Input
							id="basicEmptyCG"
							type="number"
							step="0.1"
							value={formData.basicEmptyCG || ""}
							onChange={(e) =>
								updateField("basicEmptyCG", Number.parseFloat(e.target.value) || 0)
							}
						/>
					</div>
				</div>
			</Card>

			{/* Stations */}
			<Card className="gap-4 mb-6 p-5 flex flex-col">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
						{t("aircraftProfiles.form.stations")}
					</h3>
					<span className="text-muted-foreground text-xs">
						{formData.stations.length}{" "}
						{formData.stations.length === 1
							? t("aircraftProfiles.form.station")
							: t("aircraftProfiles.form.stationsCount")}
					</span>
				</div>

				{formData.stations.length === 0 && (
					<p className="py-6 text-center text-muted-foreground text-sm">
						{t("aircraftProfiles.form.noStations")}
					</p>
				)}

				<div className="gap-3 flex flex-col">
					{formData.stations.map((station) => {
						const StationIcon = getStationTypeIcon(station.type);
						return (
							<div
								key={station.id}
								className="gap-3 rounded-xl border border-border/60 bg-background p-4 flex flex-col"
							>
								{/* Station header */}
								<div className="gap-3 flex items-center">
									<div
										className={cn(
											"flex size-9 shrink-0 items-center justify-center rounded-lg",
											station.type === "FUEL"
												? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
												: station.type === "CARGO"
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
										)}
									>
										<StationIcon className="size-5" />
									</div>
									<div className="min-w-0 flex-1">
										<Input
											value={station.name}
											onChange={(e) =>
												updateStation(station.id, { name: e.target.value })
											}
											className="h-8 border-0 bg-transparent p-0 font-medium text-sm shadow-none focus-visible:ring-0"
										/>
										<p className="text-muted-foreground text-xs">
											{t(`aircraftProfiles.stationTypes.${station.type}`)}
										</p>
									</div>
									<button
										type="button"
										onClick={() => removeStation(station.id)}
										className="rounded-md p-1.5 transition-colors hover:bg-destructive/10"
										aria-label={t("aircraftProfiles.form.removeStation")}
									>
										<Trash2Icon className="size-4 text-destructive/70" />
									</button>
								</div>

								{/* Station fields */}
								<div className="gap-3 grid grid-cols-2 sm:grid-cols-3">
									<div className="gap-1 flex flex-col">
										<Label className="text-muted-foreground text-xs">
											{t("aircraftProfiles.form.arm")} (in)
										</Label>
										<Input
											type="number"
											step="0.1"
											value={station.arm || ""}
											onChange={(e) =>
												updateStation(station.id, {
													arm: Number.parseFloat(e.target.value) || 0,
												})
											}
											className="h-8 text-sm"
										/>
									</div>
									<div className="gap-1 flex flex-col">
										<Label className="text-muted-foreground text-xs">
											{t("aircraftProfiles.form.maxWeight")} (lb)
										</Label>
										<Input
											type="number"
											step="0.1"
											value={station.maxWeight || ""}
											onChange={(e) =>
												updateStation(station.id, {
													maxWeight: Number.parseFloat(e.target.value) || 0,
												})
											}
											className="h-8 text-sm"
										/>
									</div>

									{(station.type === "SINGLE_SEAT" ||
										station.type === "ROW_OF_SEATS") && (
										<div className="gap-1 flex flex-col">
											<Label className="text-muted-foreground text-xs">
												{t("aircraftProfiles.form.seatCount")}
											</Label>
											<Input
												type="number"
												step="1"
												min="1"
												value={station.seatCount || ""}
												onChange={(e) =>
													updateStation(station.id, {
														seatCount:
															Number.parseInt(e.target.value, 10) || 1,
													})
												}
												className="h-8 text-sm"
											/>
										</div>
									)}

									{station.type === "FUEL" && (
										<>
											<div className="gap-1 flex flex-col">
												<Label className="text-muted-foreground text-xs">
													{t("aircraftProfiles.form.fuelCapacity")} (gal)
												</Label>
												<Input
													type="number"
													step="0.1"
													value={station.fuelCapacityGallons || ""}
													onChange={(e) =>
														updateStation(station.id, {
															fuelCapacityGallons:
																Number.parseFloat(e.target.value) || 0,
														})
													}
													className="h-8 text-sm"
												/>
											</div>
											<div className="gap-1 flex flex-col">
												<Label className="text-muted-foreground text-xs">
													{t("aircraftProfiles.form.weightPerGallon")} (lb/gal)
												</Label>
												<Input
													type="number"
													step="0.01"
													value={station.weightPerGallon || ""}
													onChange={(e) =>
														updateStation(station.id, {
															weightPerGallon:
																Number.parseFloat(e.target.value) || 0,
														})
													}
													className="h-8 text-sm"
												/>
											</div>
										</>
									)}
								</div>
							</div>
						);
					})}
				</div>

				{/* Add station button */}
				<Button
					variant="outline"
					onClick={() => setStationDialogOpen(true)}
					className="gap-2 mt-1 w-full border-dashed text-foreground"
				>
					<PlusIcon className="size-4" />
					{t("aircraftProfiles.form.addStation")}
				</Button>
			</Card>

			{/* CG Limits - Forward */}
			<Card className="gap-4 mb-6 p-5 flex flex-col">
				<h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
					{t("aircraftProfiles.form.forwardCGLimits")}
				</h3>

				{formData.forwardCGLimits.map((limit, index) => (
					<div key={`fwd-${index}`} className="gap-3 flex items-end">
						<div className="gap-1 flex flex-1 flex-col">
							<Label className="text-muted-foreground text-xs">
								{t("aircraftProfiles.form.arm")} (in)
							</Label>
							<Input
								type="number"
								step="0.1"
								value={limit.arm || ""}
								onChange={(e) =>
									updateCGLimit("forwardCGLimits", index, {
										arm: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="gap-1 flex flex-1 flex-col">
							<Label className="text-muted-foreground text-xs">
								{t("aircraftProfiles.form.weight")} (lb)
							</Label>
							<Input
								type="number"
								step="0.1"
								value={limit.weight || ""}
								onChange={(e) =>
									updateCGLimit("forwardCGLimits", index, {
										weight: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<button
							type="button"
							onClick={() => removeCGLimit("forwardCGLimits", index)}
							className="mb-0.5 rounded-md p-1.5 transition-colors hover:bg-destructive/10"
						>
							<Trash2Icon className="size-4 text-destructive/70" />
						</button>
					</div>
				))}

				<Button
					variant="outline"
					onClick={() => addCGLimit("forwardCGLimits")}
					className="gap-2 w-full border-dashed text-foreground"
					size="sm"
				>
					<PlusIcon className="size-4" />
					{t("aircraftProfiles.form.addForwardLimit")}
				</Button>
			</Card>

			{/* CG Limits - Aft */}
			<Card className="gap-4 mb-6 p-5 flex flex-col">
				<h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
					{t("aircraftProfiles.form.aftCGLimits")}
				</h3>

				{formData.aftCGLimits.map((limit, index) => (
					<div key={`aft-${index}`} className="gap-3 flex items-end">
						<div className="gap-1 flex flex-1 flex-col">
							<Label className="text-muted-foreground text-xs">
								{t("aircraftProfiles.form.arm")} (in)
							</Label>
							<Input
								type="number"
								step="0.1"
								value={limit.arm || ""}
								onChange={(e) =>
									updateCGLimit("aftCGLimits", index, {
										arm: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<div className="gap-1 flex flex-1 flex-col">
							<Label className="text-muted-foreground text-xs">
								{t("aircraftProfiles.form.weight")} (lb)
							</Label>
							<Input
								type="number"
								step="0.1"
								value={limit.weight || ""}
								onChange={(e) =>
									updateCGLimit("aftCGLimits", index, {
										weight: Number.parseFloat(e.target.value) || 0,
									})
								}
								className="h-8 text-sm"
							/>
						</div>
						<button
							type="button"
							onClick={() => removeCGLimit("aftCGLimits", index)}
							className="mb-0.5 rounded-md p-1.5 transition-colors hover:bg-destructive/10"
						>
							<Trash2Icon className="size-4 text-destructive/70" />
						</button>
					</div>
				))}

				<Button
					variant="outline"
					onClick={() => addCGLimit("aftCGLimits")}
					className="gap-2 w-full border-dashed text-foreground"
					size="sm"
				>
					<PlusIcon className="size-4" />
					{t("aircraftProfiles.form.addAftLimit")}
				</Button>
			</Card>

			{/* Save bar */}
			<div className="sticky bottom-4 z-10">
				<Card
					className={cn(
						"gap-3 p-4 transition-all flex items-center justify-between border-primary/20 bg-card/95 shadow-lg backdrop-blur-sm",
						isDirty
							? "translate-y-0 opacity-100"
							: "pointer-events-none translate-y-2 opacity-0",
					)}
				>
					<p className="text-muted-foreground text-sm">
						{t("aircraftProfiles.form.unsavedChanges")}
					</p>
					<Button
						onClick={handleSave}
						disabled={updateMutation.isPending}
						className="gap-2"
					>
						<SaveIcon className="size-4" />
						{updateMutation.isPending
							? t("aircraftProfiles.notifications.saving")
							: t("aircraftProfiles.form.save")}
					</Button>
				</Card>
			</div>

			{/* Add Station Type Dialog */}
			<Dialog open={stationDialogOpen} onOpenChange={setStationDialogOpen}>
				<DialogContent className="sm:max-w-sm">
					<DialogHeader>
						<DialogTitle>{t("aircraftProfiles.form.stationType")}</DialogTitle>
					</DialogHeader>
					<div className="gap-2 mt-2 grid grid-cols-2">
						{STATION_TYPES.map((type) => {
							const Icon = getStationTypeIcon(type);
							return (
								<button
									key={type}
									type="button"
									onClick={() => addStation(type)}
									className="gap-2 rounded-xl border border-border/60 bg-background p-4 text-center transition-all flex flex-col items-center justify-center hover:border-primary/40 hover:bg-primary/5"
								>
									<div
										className={cn(
											"flex size-10 items-center justify-center rounded-lg",
											type === "FUEL"
												? "bg-amber-500/10 text-amber-600 dark:text-amber-400"
												: type === "CARGO"
													? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
													: type === "AIRCRAFT_ITEMS"
														? "bg-violet-500/10 text-violet-600 dark:text-violet-400"
														: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
										)}
									>
										<Icon className="size-5" />
									</div>
									<span className="font-medium text-xs">
										{t(`aircraftProfiles.stationTypes.${type}`)}
									</span>
								</button>
							);
						})}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
