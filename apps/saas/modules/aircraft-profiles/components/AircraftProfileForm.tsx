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
	BoxIcon,
	FuelIcon,
	PlusIcon,
	SaveIcon,
	Trash2Icon,
	UserIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { useAircraftProfilesQuery, useUpdateAircraftProfileMutation } from "../lib/api";
import type {
	AircraftProfileData,
	AircraftStation,
	EnvelopePoint,
	StationType,
} from "../lib/types";
import { generateStationId, STATION_TYPES, STATION_TYPE_LABELS } from "../lib/types";

// ── Station type helpers (also exported for AircraftProfileList) ────
export function getStationTypeIcon(type: string) {
	switch (type) {
		case "crew":
			return UserIcon;
		case "pax":
			return UsersIcon;
		case "cargo":
			return BoxIcon;
		case "fuel":
			return FuelIcon;
		default:
			return BoxIcon;
	}
}

const STATION_TYPE_COLOR: Record<string, string> = {
	crew: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
	pax: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
	cargo: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
	fuel: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

// ────────────────────────────────────────────────────────────────────
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

	const profile = profiles?.find((p) => p.id === profileId);

	useEffect(() => {
		if (profile && !formData) {
			const raw = profile.data as unknown as Partial<AircraftProfileData>;
			setFormData({
				profileName: raw.profileName ?? "",
				aircraftModel: raw.aircraftModel ?? "",
				registration: raw.registration ?? "",
				bem: raw.bem ?? 0,
				bemCG: raw.bemCG ?? 0,
				limits: raw.limits ?? { MTOM: 0, MZFM: 0, MLDM: 0 },
				stations: raw.stations ?? [],
				envelope: raw.envelope ?? [],
			});
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
		const defaults: Record<StationType, number> = {
			crew: 120,
			pax: 110,
			cargo: 200,
			fuel: 1000,
		};
		const newStation: AircraftStation = {
			id: generateStationId(),
			name: STATION_TYPE_LABELS[type],
			type,
			arm: 0,
			maxMass: defaults[type],
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

	// ── Envelope management ─────────────────────────────────────────
	function addEnvelopePoint() {
		if (!formData) return;
		updateField("envelope", [...formData.envelope, { x: 0, y: 0 }]);
	}

	function updateEnvelopePoint(index: number, updates: Partial<EnvelopePoint>) {
		if (!formData) return;
		const next = [...formData.envelope];
		next[index] = { ...next[index], ...updates };
		updateField("envelope", next);
	}

	function removeEnvelopePoint(index: number) {
		if (!formData) return;
		updateField(
			"envelope",
			formData.envelope.filter((_, i) => i !== index),
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

	// ── Loading / not found ─────────────────────────────────────────
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
				<Button
					variant="outline"
					className="mt-4"
					render={(props) => (
						<Link {...props} href="/aircraft-profiles">
							{t("aircraftProfiles.backToList")}
						</Link>
					)}
				/>
			</div>
		);
	}

	// ── Render ──────────────────────────────────────────────────────
	return (
		<div className="max-w-3xl mx-auto">
			{/* Header */}
			<div className="gap-4 mb-6 flex items-center">
				<Button
					variant="ghost"
					size="icon"
					className="shrink-0"
					render={(props) => (
						<Link {...props} href="/aircraft-profiles">
							<ArrowLeftIcon className="size-5" />
						</Link>
					)}
				/>
				<PageHeader
					title={formData.profileName || t("aircraftProfiles.newAircraft")}
					subtitle={formData.aircraftModel}
					className="mb-0"
				/>
			</div>

			{/* ── Basic info ──────────────────────────────────────────── */}
			<Card className="gap-4 mb-6 p-5 flex flex-col">
				<h3 className="font-semibold text-sm tracking-wider text-muted-foreground uppercase">
					{t("aircraftProfiles.form.basicInfo")}
				</h3>

				<div className="gap-4 sm:grid-cols-2 grid grid-cols-1">
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

				{/* BEM */}
				<h4 className="text-sm font-medium text-muted-foreground">Peso Básico Vazio</h4>
				<div className="gap-4 sm:grid-cols-2 grid grid-cols-1">
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="bem">BEM (kg)</Label>
						<Input
							id="bem"
							type="number"
							step="0.1"
							value={formData.bem || ""}
							onChange={(e) => updateField("bem", Number.parseFloat(e.target.value) || 0)}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="bemCG">BEM CG (m)</Label>
						<Input
							id="bemCG"
							type="number"
							step="0.001"
							value={formData.bemCG || ""}
							onChange={(e) => updateField("bemCG", Number.parseFloat(e.target.value) || 0)}
						/>
					</div>
				</div>

				{/* Limits */}
				<h4 className="text-sm font-medium text-muted-foreground">Limites de Massa</h4>
				<div className="gap-4 sm:grid-cols-3 grid grid-cols-1">
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="mtom">MTOM (kg)</Label>
						<Input
							id="mtom"
							type="number"
							step="1"
							value={formData.limits?.MTOM || ""}
							onChange={(e) =>
								updateField("limits", {
									...formData.limits,
									MTOM: Number.parseFloat(e.target.value) || 0,
								})
							}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="mzfm">MZFM (kg)</Label>
						<Input
							id="mzfm"
							type="number"
							step="1"
							value={formData.limits?.MZFM || ""}
							onChange={(e) =>
								updateField("limits", {
									...formData.limits,
									MZFM: Number.parseFloat(e.target.value) || 0,
								})
							}
						/>
					</div>
					<div className="gap-1.5 flex flex-col">
						<Label htmlFor="mldm">MLDM (kg)</Label>
						<Input
							id="mldm"
							type="number"
							step="1"
							value={formData.limits?.MLDM || ""}
							onChange={(e) =>
								updateField("limits", {
									...formData.limits,
									MLDM: Number.parseFloat(e.target.value) || 0,
								})
							}
						/>
					</div>
				</div>
			</Card>

			{/* ── Stations ────────────────────────────────────────────── */}
			<Card className="gap-4 mb-6 p-5 flex flex-col">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-sm tracking-wider text-muted-foreground uppercase">
						{t("aircraftProfiles.form.stations")}
					</h3>
					<span className="text-xs text-muted-foreground">{formData.stations.length} estações</span>
				</div>

				{formData.stations.length === 0 && (
					<p className="py-6 text-sm text-center text-muted-foreground">
						{t("aircraftProfiles.form.noStations")}
					</p>
				)}

				<div className="gap-3 flex flex-col">
					{formData.stations.map((station) => {
						const StationIcon = getStationTypeIcon(station.type);
						return (
							<div
								key={station.id}
								className="gap-3 p-4 flex flex-col rounded-xl border border-border/60 bg-background"
							>
								{/* Station header */}
								<div className="gap-3 flex items-center">
									<div
										className={cn(
											"size-8 flex shrink-0 items-center justify-center rounded-lg",
											STATION_TYPE_COLOR[station.type] ?? "bg-muted text-muted-foreground",
										)}
									>
										<StationIcon className="size-4" />
									</div>
									<div className="min-w-0 flex-1">
										<Input
											value={station.name}
											onChange={(e) => updateStation(station.id, { name: e.target.value })}
											className="h-8 font-medium text-sm"
										/>
									</div>
									<button
										type="button"
										onClick={() => removeStation(station.id)}
										className="p-1.5 cursor-pointer rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
										aria-label={t("aircraftProfiles.form.removeStation")}
									>
										<Trash2Icon className="size-4" />
									</button>
								</div>

								{/* Station fields */}
								<div className="gap-3 sm:grid-cols-3 grid grid-cols-2">
									<div className="gap-1 flex flex-col">
										<Label className="text-xs">{t("aircraftProfiles.form.arm")} (m)</Label>
										<Input
											type="number"
											step="0.001"
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
										<Label className="text-xs">{t("aircraftProfiles.form.maxWeight")} (kg)</Label>
										<Input
											type="number"
											step="1"
											value={station.maxMass ?? ""}
											onChange={(e) =>
												updateStation(station.id, {
													maxMass: Number.parseFloat(e.target.value) || undefined,
												})
											}
											className="h-8 text-sm"
										/>
									</div>
									<div className="gap-1 sm:col-span-1 col-span-2 flex flex-col">
										<Label className="text-xs">{t("aircraftProfiles.form.stationType")}</Label>
										<span className="h-8 px-2.5 text-xs font-medium flex items-center rounded-md border border-border/50 bg-muted/40 text-muted-foreground">
											{STATION_TYPE_LABELS[station.type] ?? station.type}
										</span>
									</div>
								</div>
							</div>
						);
					})}
				</div>

				<Button
					variant="outline"
					onClick={() => setStationDialogOpen(true)}
					className="gap-2 self-start"
				>
					<PlusIcon className="size-4" />
					{t("aircraftProfiles.form.addStation")}
				</Button>
			</Card>

			{/* ── Envelope ────────────────────────────────────────────── */}
			<Card className="gap-4 mb-6 p-5 flex flex-col">
				<div className="flex items-center justify-between">
					<h3 className="font-semibold text-sm tracking-wider text-muted-foreground uppercase">
						Envelope de CG
					</h3>
					<span className="text-xs text-muted-foreground">{formData.envelope.length} pontos</span>
				</div>

				{formData.envelope.length === 0 && (
					<p className="py-6 text-sm text-center text-muted-foreground">
						Nenhum ponto de envelope adicionado.
					</p>
				)}

				<div className="gap-2 flex flex-col">
					{formData.envelope.map((point, idx) => (
						<div
							key={idx}
							className="gap-3 p-3 flex items-center rounded-lg border border-border/40 bg-background"
						>
							<span className="size-6 text-xs font-medium leading-6 shrink-0 rounded-full bg-muted text-center text-muted-foreground">
								{idx + 1}
							</span>
							<div className="gap-2 flex flex-1 items-center">
								<div className="gap-1 flex flex-1 items-center">
									<Label className="text-xs shrink-0 text-muted-foreground">CG (m):</Label>
									<Input
										type="number"
										step="0.001"
										value={point.x || ""}
										onChange={(e) =>
											updateEnvelopePoint(idx, {
												x: Number.parseFloat(e.target.value) || 0,
											})
										}
										className="h-8 text-sm"
									/>
								</div>
								<div className="gap-1 flex flex-1 items-center">
									<Label className="text-xs shrink-0 text-muted-foreground">Massa (kg):</Label>
									<Input
										type="number"
										step="1"
										value={point.y || ""}
										onChange={(e) =>
											updateEnvelopePoint(idx, {
												y: Number.parseFloat(e.target.value) || 0,
											})
										}
										className="h-8 text-sm"
									/>
								</div>
							</div>
							<button
								type="button"
								onClick={() => removeEnvelopePoint(idx)}
								className="p-1 cursor-pointer rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
							>
								<Trash2Icon className="size-4" />
							</button>
						</div>
					))}
				</div>

				<Button variant="outline" onClick={addEnvelopePoint} className="gap-2 self-start">
					<PlusIcon className="size-4" />
					Adicionar Ponto do Envelope
				</Button>
			</Card>

			{/* ── Save Bar ────────────────────────────────────────────── */}
			<div className="bottom-4 p-4 shadow-lg backdrop-blur-sm sticky z-10 flex items-center justify-end rounded-xl border border-border bg-card/95">
				<Button
					onClick={handleSave}
					disabled={updateMutation.isPending || !isDirty}
					className="gap-2"
				>
					<SaveIcon className="size-4" />
					{updateMutation.isPending
						? t("aircraftProfiles.notifications.saving")
						: t("aircraftProfiles.form.save")}
				</Button>
			</div>

			{/* ── Add Station Dialog ──────────────────────────────────── */}
			<Dialog open={stationDialogOpen} onOpenChange={setStationDialogOpen}>
				<DialogContent className="sm:max-w-md">
					<DialogHeader>
						<DialogTitle>{t("aircraftProfiles.form.addStation")}</DialogTitle>
					</DialogHeader>
					<div className="gap-2 mt-2 flex flex-col">
						{STATION_TYPES.map((type) => {
							const Icon = getStationTypeIcon(type);
							return (
								<button
									key={type}
									type="button"
									onClick={() => addStation(type)}
									className="gap-3 p-3 flex cursor-pointer items-center rounded-xl border border-border/60 bg-background text-left transition-all hover:border-primary/40 hover:bg-primary/5"
								>
									<div
										className={cn(
											"size-10 flex shrink-0 items-center justify-center rounded-lg",
											STATION_TYPE_COLOR[type] ?? "bg-muted text-muted-foreground",
										)}
									>
										<Icon className="size-5" />
									</div>
									<div>
										<p className="font-medium text-sm">{STATION_TYPE_LABELS[type]}</p>
									</div>
								</button>
							);
						})}
					</div>
				</DialogContent>
			</Dialog>
		</div>
	);
}
