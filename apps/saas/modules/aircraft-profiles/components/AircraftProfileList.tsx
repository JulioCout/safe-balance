"use client";

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	Button,
	Card,
	Input,
	Skeleton,
} from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { PageHeader } from "@shared/components/PageHeader";
import {
	CalculatorIcon,
	EditIcon,
	PlaneTakeoffIcon,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
	WeightIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { useAircraftProfilesQuery, useDeleteAircraftProfileMutation } from "../lib/api";
import type { AircraftProfileData } from "../lib/types";
import { getStationTypeIcon, NewAircraftDialog } from "./NewAircraftDialog";

export function AircraftProfileList() {
	const t = useTranslations();
	const [search, setSearch] = useState("");
	const [dialogOpen, setDialogOpen] = useState(false);
	const [deleteId, setDeleteId] = useState<string | null>(null);

	const { data: profiles, isLoading } = useAircraftProfilesQuery(search);
	const deleteMutation = useDeleteAircraftProfileMutation();

	async function handleDelete() {
		if (!deleteId) return;
		try {
			await deleteMutation.mutateAsync(deleteId);
			toastSuccess(t("aircraftProfiles.notifications.deleted"));
		} catch {
			toastError(t("aircraftProfiles.notifications.deleteError"));
		} finally {
			setDeleteId(null);
		}
	}

	return (
		<div>
			<PageHeader title={t("aircraftProfiles.title")} subtitle={t("aircraftProfiles.subtitle")} />

			{/* Search + New button */}
			<div className="gap-3 mb-6 flex items-center">
				<div className="relative flex-1">
					<SearchIcon className="left-3 size-4 absolute top-1/2 -translate-y-1/2 text-muted-foreground" />
					<Input
						id="aircraft-search"
						placeholder={t("aircraftProfiles.searchPlaceholder")}
						value={search}
						onChange={(e) => setSearch(e.target.value)}
						className="pl-9"
					/>
				</div>
				<Button
					id="new-aircraft-btn"
					onClick={() => setDialogOpen(true)}
					className="gap-2 shrink-0"
				>
					<PlusIcon className="size-4" />
					<span className="sm:inline hidden">{t("aircraftProfiles.newAircraft")}</span>
				</Button>
			</div>

			{/* Loading */}
			{isLoading && (
				<div className="gap-4 sm:grid-cols-2 lg:grid-cols-3 grid grid-cols-1">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-44 w-full rounded-xl" />
					))}
				</div>
			)}

			{/* Empty state */}
			{!isLoading && (!profiles || profiles.length === 0) && (
				<Card className="gap-2 py-16 flex flex-col items-center justify-center text-center">
					<div className="mb-2 size-16 flex items-center justify-center rounded-2xl bg-muted">
						<PlaneTakeoffIcon className="size-8 text-muted-foreground" />
					</div>
					<h3 className="font-medium text-lg">{t("aircraftProfiles.empty.title")}</h3>
					<p className="max-w-sm text-sm text-muted-foreground">
						{t("aircraftProfiles.empty.description")}
					</p>
					<Button onClick={() => setDialogOpen(true)} className="gap-2 mt-4">
						<PlusIcon className="size-4" />
						{t("aircraftProfiles.newAircraft")}
					</Button>
				</Card>
			)}

			{/* Profile cards */}
			{!isLoading && profiles && profiles.length > 0 && (
				<div className="gap-4 sm:grid-cols-2 lg:grid-cols-3 grid grid-cols-1">
					{profiles.map((profile) => {
						const data = profile.data as unknown as AircraftProfileData;
						const stationCount = data?.stations?.length ?? 0;

						return (
							<Card
								key={profile.id}
								className="group gap-0 p-0 shadow-sm relative flex flex-col overflow-hidden border border-border transition-all"
							>
								{/* Gradient header strip */}
								<div className="h-2 from-sky-500 to-blue-600 w-full bg-gradient-to-r" />

								<div className="p-4 flex-1">
									{/* Title row */}
									<div className="mb-3 flex items-start justify-between">
										<div className="min-w-0 flex-1">
											<h3 className="font-semibold text-sm truncate">{profile.name}</h3>
											<p className="mt-0.5 text-xs truncate text-muted-foreground">
												{data?.aircraftModel || profile.model}
											</p>
										</div>
										<button
											type="button"
											onClick={(e) => {
												e.preventDefault();
												e.stopPropagation();
												setDeleteId(profile.id);
											}}
											className="ml-2 p-1.5 cursor-pointer rounded-md opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 focus:opacity-100"
											aria-label={t("aircraftProfiles.delete")}
										>
											<Trash2Icon className="size-4 text-destructive" />
										</button>
									</div>

									{/* Stats */}
									<div className="gap-3 mb-3 flex items-center">
										<div className="gap-1.5 flex items-center">
											<WeightIcon className="size-3.5 text-muted-foreground" />
											<span className="font-medium text-xs">{data?.bem ?? 0}</span>
											<span className="text-xs text-muted-foreground">kg</span>
										</div>
										<div className="h-3 w-px bg-border" />
										<div className="gap-1.5 flex items-center">
											<span className="font-medium text-xs">{data?.bemCG ?? 0}</span>
											<span className="text-xs text-muted-foreground">m</span>
										</div>
									</div>

									{/* Station badges */}
									{stationCount > 0 && (
										<div className="gap-1.5 flex flex-wrap">
											{data.stations.slice(0, 4).map((station) => {
												const StationIcon = getStationTypeIcon(station.type);
												return (
													<span
														key={station.id}
														className="gap-1 px-2 py-0.5 text-xs font-medium inline-flex items-center rounded-full bg-muted text-muted-foreground"
													>
														<StationIcon className="size-3" />
														<span className="max-w-20 truncate">{station.name}</span>
													</span>
												);
											})}
											{stationCount > 4 && (
												<span className="px-2 py-0.5 text-xs font-medium inline-flex items-center rounded-full bg-muted text-muted-foreground">
													+{stationCount - 4}
												</span>
											)}
										</div>
									)}
								</div>

								<div className="p-3 gap-2 flex border-t bg-muted/30">
									<Button
										variant="secondary"
										className="gap-2 flex-1"
										render={(props) => (
											<Link {...props} href={`/aircraft-profiles/${profile.id}`}>
												<EditIcon className="size-4" />
												{t("aircraftProfiles.edit")}
											</Link>
										)}
									/>
									<Button
										className="gap-2 flex-1"
										render={(props) => (
											<Link {...props} href={`/aircraft-profiles/${profile.id}/calculate`}>
												<CalculatorIcon className="size-4" />
												{t("aircraftProfiles.calculate")}
											</Link>
										)}
									/>
								</div>
							</Card>
						);
					})}
				</div>
			)}

			{/* New Aircraft Dialog */}
			<NewAircraftDialog open={dialogOpen} onOpenChange={setDialogOpen} />

			{/* Delete Confirmation */}
			<AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>{t("aircraftProfiles.deleteConfirm.title")}</AlertDialogTitle>
						<AlertDialogDescription>
							{t("aircraftProfiles.deleteConfirm.description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="text-foreground">
							{t("common.confirmation.cancel")}
						</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleDelete}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{t("aircraftProfiles.deleteConfirm.confirm")}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</div>
	);
}
