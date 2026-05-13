"use client";

import {
	Button,
	Card,
	cn,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import {
	ArmchairIcon,
	BoxIcon,
	FuelIcon,
	PlaneTakeoffIcon,
	SettingsIcon,
	UsersIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useCreateAircraftProfileMutation } from "../lib/api";
import type { AircraftProfileData, AircraftProfileTemplate, StationType } from "../lib/types";
import { AIRCRAFT_TEMPLATES, createEmptyProfileData } from "../lib/types";

// ── Station type icon helper ────────────────────────────────────────
export function getStationTypeIcon(type: StationType) {
	switch (type) {
		case "SINGLE_SEAT":
			return ArmchairIcon;
		case "ROW_OF_SEATS":
			return UsersIcon;
		case "CARGO":
			return BoxIcon;
		case "FUEL":
			return FuelIcon;
		case "AIRCRAFT_ITEMS":
			return SettingsIcon;
		default:
			return SettingsIcon;
	}
}

interface NewAircraftDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function NewAircraftDialog({ open, onOpenChange }: NewAircraftDialogProps) {
	const t = useTranslations();
	const router = useRouter();
	const createMutation = useCreateAircraftProfileMutation();

	const [step, setStep] = useState<"choose" | "name">("choose");
	const [selectedTemplate, setSelectedTemplate] = useState<AircraftProfileTemplate | null>(null);
	const [profileName, setProfileName] = useState("");

	function handleChooseBlank() {
		setSelectedTemplate(null);
		setProfileName("");
		setStep("name");
	}

	function handleChooseTemplate(template: AircraftProfileTemplate) {
		setSelectedTemplate(template);
		setProfileName(template.name);
		setStep("name");
	}

	function handleBack() {
		setStep("choose");
		setSelectedTemplate(null);
		setProfileName("");
	}

	async function handleCreate() {
		if (!profileName.trim()) return;

		const data: AircraftProfileData = selectedTemplate
			? { ...selectedTemplate.data, profileName: profileName.trim() }
			: { ...createEmptyProfileData(), profileName: profileName.trim() };

		try {
			const profile = await createMutation.mutateAsync({
				name: profileName.trim(),
				model: data.aircraftModel || profileName.trim(),
				data: data as unknown as Record<string, unknown>,
			});

			toastSuccess(t("aircraftProfiles.notifications.created"));
			onOpenChange(false);
			resetState();
			router.push(`/aircraft-profiles/${profile.id}`);
		} catch {
			toastError(t("aircraftProfiles.notifications.createError"));
		}
	}

	function resetState() {
		setStep("choose");
		setSelectedTemplate(null);
		setProfileName("");
	}

	return (
		<Dialog
			open={open}
			onOpenChange={(val) => {
				onOpenChange(val);
				if (!val) resetState();
			}}
		>
			<DialogContent className="sm:max-w-lg">
				<DialogHeader>
					<DialogTitle>
						{step === "choose"
							? t("aircraftProfiles.newDialog.title")
							: t("aircraftProfiles.newDialog.nameTitle")}
					</DialogTitle>
					<DialogDescription>
						{step === "choose"
							? t("aircraftProfiles.newDialog.description")
							: t("aircraftProfiles.newDialog.nameDescription")}
					</DialogDescription>
				</DialogHeader>

				{step === "choose" ? (
					<div className="gap-3 mt-2 flex flex-col">
						{/* Blank option */}
						<button
							type="button"
							onClick={handleChooseBlank}
							className="gap-4 rounded-xl border border-border/60 bg-background p-4 text-left transition-all flex items-center hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
						>
							<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-muted">
								<PlaneTakeoffIcon className="size-6 text-muted-foreground" />
							</div>
							<div>
								<p className="font-medium text-sm">
									{t("aircraftProfiles.newDialog.blank")}
								</p>
								<p className="mt-0.5 text-muted-foreground text-xs">
									{t("aircraftProfiles.newDialog.blankDescription")}
								</p>
							</div>
						</button>

						{/* Templates */}
						{AIRCRAFT_TEMPLATES.map((template) => (
							<button
								key={template.id}
								type="button"
								onClick={() => handleChooseTemplate(template)}
								className="gap-4 rounded-xl border border-border/60 bg-background p-4 text-left transition-all flex items-center hover:border-primary/40 hover:bg-primary/5 hover:shadow-sm"
							>
								<div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-sky-500/20 to-blue-600/20">
									<PlaneTakeoffIcon className="size-6 text-sky-600 dark:text-sky-400" />
								</div>
								<div>
									<p className="font-medium text-sm">{template.name}</p>
									<p className="mt-0.5 text-muted-foreground text-xs">
										{t("aircraftProfiles.newDialog.templateDescription", {
											stations: template.data.stations.length,
											weight: template.data.basicEmptyWeight,
										})}
									</p>
								</div>
							</button>
						))}
					</div>
				) : (
					<div className="gap-4 mt-2 flex flex-col">
						{selectedTemplate && (
							<Card className="gap-0 border-sky-200/50 bg-sky-50/50 p-3 dark:border-sky-800/30 dark:bg-sky-950/20">
								<p className="text-muted-foreground text-xs">
									{t("aircraftProfiles.newDialog.basedOn")}
								</p>
								<p className="font-medium text-sm">{selectedTemplate.name}</p>
							</Card>
						)}

						<div className="gap-2 flex flex-col">
							<Label htmlFor="profile-name">
								{t("aircraftProfiles.form.profileName")}
							</Label>
							<Input
								id="profile-name"
								value={profileName}
								onChange={(e) => setProfileName(e.target.value)}
								placeholder={t("aircraftProfiles.form.profileNamePlaceholder")}
								autoFocus
								onKeyDown={(e) => {
									if (e.key === "Enter" && profileName.trim()) {
										handleCreate();
									}
								}}
							/>
						</div>

						<div className="gap-2 flex justify-between">
							<Button variant="outline" onClick={handleBack} className="text-foreground">
								{t("aircraftProfiles.newDialog.back")}
							</Button>
							<Button
								onClick={handleCreate}
								disabled={!profileName.trim() || createMutation.isPending}
							>
								{createMutation.isPending
									? t("aircraftProfiles.notifications.creating")
									: t("aircraftProfiles.newDialog.create")}
							</Button>
						</div>
					</div>
				)}
			</DialogContent>
		</Dialog>
	);
}
