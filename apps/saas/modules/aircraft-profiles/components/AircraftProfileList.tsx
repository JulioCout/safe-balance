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
	EditIcon,
	PlaneTakeoffIcon,
	PlusIcon,
	SearchIcon,
	Trash2Icon,
	WeightIcon,
	CalculatorIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState } from "react";

import { useAircraftProfilesQuery, useDeleteAircraftProfileMutation } from "../lib/api";
import type { AircraftProfileData, StationType } from "../lib/types";
import { getStationTypeIcon } from "./NewAircraftDialog";
import { NewAircraftDialog } from "./NewAircraftDialog";

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
			<PageHeader
				title={t("aircraftProfiles.title")}
				subtitle={t("aircraftProfiles.subtitle")}
			/>

			{/* Search + New button */}
			<div className="gap-3 mb-6 flex items-center">
				<div className="relative flex-1">
					<SearchIcon className="top-1/2 left-3 absolute size-4 -translate-y-1/2 text-muted-foreground" />
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
				<div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{[1, 2, 3].map((i) => (
						<Skeleton key={i} className="h-44 w-full rounded-xl" />
					))}
				</div>
			)}

			{/* Empty state */}
			{!isLoading && (!profiles || profiles.length === 0) && (
				<Card className="gap-2 py-16 flex flex-col items-center justify-center text-center">
					<div className="mb-2 flex size-16 items-center justify-center rounded-2xl bg-muted">
						<PlaneTakeoffIcon className="size-8 text-muted-foreground" />
					</div>
					<h3 className="font-medium text-lg">{t("aircraftProfiles.empty.title")}</h3>
					<p className="max-w-sm text-muted-foreground text-sm">
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
				<div className="gap-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
					{profiles.map((profile) => {
						const data = profile.data as unknown as AircraftProfileData;
						const stationCount = data?.stations?.length ?? 0;

						return (
							<Card key={profile.id} className="group gap-0 relative overflow-hidden p-0 transition-all flex flex-col border border-border shadow-sm">
									{/* Gradient header strip */}
									<div className="h-2 w-full bg-gradient-to-r from-sky-500 to-blue-600" />

									<div className="p-4 flex-1">
										{/* Title row */}
										<div className="mb-3 flex items-start justify-between">
											<div className="min-w-0 flex-1">
												<h3 className="truncate font-semibold text-sm">
													{profile.name}
												</h3>
												<p className="mt-0.5 truncate text-muted-foreground text-xs">
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
												className="ml-2 rounded-md p-1.5 opacity-0 transition-opacity hover:bg-destructive/10 group-hover:opacity-100 focus:opacity-100"
												aria-label={t("aircraftProfiles.delete")}
											>
												<Trash2Icon className="size-4 text-destructive" />
											</button>
										</div>

										{/* Stats */}
										<div className="gap-3 mb-3 flex items-center">
											<div className="gap-1.5 flex items-center">
												<WeightIcon className="size-3.5 text-muted-foreground" />
												<span className="font-medium text-xs">
													{data?.basicEmptyWeight ?? 0}
												</span>
												<span className="text-muted-foreground text-xs">lb</span>
											</div>
											<div className="h-3 w-px bg-border" />
											<div className="gap-1.5 flex items-center">
												<span className="font-medium text-xs">
													{data?.basicEmptyCG ?? 0}
												</span>
												<span className="text-muted-foreground text-xs">in</span>
											</div>
										</div>

											{/* Station badges */}
										{stationCount > 0 && (
											<div className="gap-1.5 flex flex-wrap">
												{data.stations.slice(0, 4).map((station) => {
													const StationIcon = getStationTypeIcon(
														station.type as StationType,
													);
													return (
														<span
															key={station.id}
															className="gap-1 inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground"
														>
															<StationIcon className="size-3" />
															<span className="max-w-20 truncate">
																{station.name}
															</span>
														</span>
													);
												})}
												{stationCount > 4 && (
													<span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
														+{stationCount - 4}
													</span>
												)}
											</div>
										)}
									</div>
									<div className="border-t bg-muted/30 p-3 flex gap-2">
										<Button asChild variant="secondary" className="flex-1 gap-2">
											<Link href={`/aircraft-profiles/${profile.id}`}>
												<EditIcon className="size-4" />
												{t("aircraftProfiles.edit")}
											</Link>
										</Button>
										<Button asChild className="flex-1 gap-2">
											<Link href={`/aircraft-profiles/${profile.id}/calculate`}>
												<CalculatorIcon className="size-4" />
												{t("aircraftProfiles.calculate")}
											</Link>
										</Button>
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
						<AlertDialogTitle>
							{t("aircraftProfiles.deleteConfirm.title")}
						</AlertDialogTitle>
						<AlertDialogDescription>
							{t("aircraftProfiles.deleteConfirm.description")}
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel className="text-foreground">{t("common.confirmation.cancel")}</AlertDialogCancel>
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
