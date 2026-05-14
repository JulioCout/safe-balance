"use client";

import { Button, Card, Input, Label, Skeleton, cn } from "@repo/ui";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@repo/ui/components/chart";
import { PageHeader } from "@shared/components/PageHeader";
import { ArrowLeftIcon, CalculatorIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useState, useMemo } from "react";
import { CartesianGrid, ReferenceLine, Scatter, ScatterChart, XAxis, YAxis, ResponsiveContainer } from "recharts";

import { useAircraftProfilesQuery } from "../lib/api";
import type { AircraftProfileData } from "../lib/types";

interface AircraftBalanceCalculatorProps {
	profileId: string;
}

export function AircraftBalanceCalculator({ profileId }: AircraftBalanceCalculatorProps) {
	const t = useTranslations();
	const { data: profiles, isLoading } = useAircraftProfilesQuery();

	const profile = profiles?.find((p) => p.id === profileId);
	const data = profile?.data as unknown as AircraftProfileData;

	// State for actual station weights input by the user
	const [stationWeights, setStationWeights] = useState<Record<string, number>>({});

	const handleWeightChange = (stationId: string, weight: number) => {
		setStationWeights((prev) => ({
			...prev,
			[stationId]: isNaN(weight) ? 0 : weight,
		}));
	};

	// Calculations
	const calculations = useMemo(() => {
		if (!data) return null;

		let totalWeight = data.basicEmptyWeight || 0;
		let totalMoment = (data.basicEmptyWeight || 0) * (data.basicEmptyCG || 0);

		const items = data.stations.map((station) => {
			const weight = stationWeights[station.id] || 0;
			const moment = weight * station.arm;
			totalWeight += weight;
			totalMoment += moment;

			return {
				id: station.id,
				name: station.name,
				weight,
				arm: station.arm,
				moment,
			};
		});

		const cg = totalWeight > 0 ? totalMoment / totalWeight : 0;

		return {
			totalWeight,
			totalMoment,
			cg,
			items,
		};
	}, [data, stationWeights]);

	// Graph Data preparation
	const graphData = useMemo(() => {
		if (!data || !calculations) return null;

		// Build the envelope loop
		const forward = data.forwardCGLimits || [];
		const aft = data.aftCGLimits || [];

		// Connect forward limits top-to-bottom, then aft bottom-to-top, then close loop
		const envelopePoints = [
			...forward.map((limit) => ({ arm: limit.arm, weight: limit.weight })),
			...aft.slice().reverse().map((limit) => ({ arm: limit.arm, weight: limit.weight })),
		];
		// Close the loop if points exist
		if (forward.length > 0) {
			envelopePoints.push({ arm: forward[0].arm, weight: forward[0].weight });
		}

		const currentPoint = [{ arm: calculations.cg, weight: calculations.totalWeight }];
		const bewPoint = [{ arm: data.basicEmptyCG, weight: data.basicEmptyWeight }];

		return {
			envelope: envelopePoints,
			current: currentPoint,
			bew: bewPoint,
		};
	}, [data, calculations]);

	if (isLoading) {
		return (
			<div className="gap-6 flex flex-col">
				<Skeleton className="h-10 w-48" />
				<div className="gap-6 grid grid-cols-1 md:grid-cols-2">
					<Skeleton className="h-[400px] rounded-xl" />
					<Skeleton className="h-[400px] rounded-xl" />
				</div>
			</div>
		);
	}

	if (!profile || !data || !calculations || !graphData) {
		return (
			<div className="py-16 text-center">
				<p className="text-muted-foreground">{t("aircraftProfiles.notFound")}</p>
				<Button asChild variant="outline" className="mt-4">
					<Link href="/aircraft-profiles">{t("aircraftProfiles.backToList")}</Link>
				</Button>
			</div>
		);
	}

	// Dynamic Chart Config for colors
	const chartConfig = {
		envelope: { label: t("aircraftProfiles.calculator.envelope"), color: "hsl(var(--primary))" },
		current: { label: t("aircraftProfiles.calculator.currentCG"), color: "hsl(var(--destructive))" },
		bew: { label: t("aircraftProfiles.form.basicEmptyWeight"), color: "hsl(var(--muted-foreground))" },
	};

	return (
		<div>
			{/* Header */}
			<div className="gap-4 mb-6 flex items-center">
				<Button asChild variant="ghost" size="icon" className="shrink-0">
					<Link href="/aircraft-profiles">
						<ArrowLeftIcon className="size-5" />
					</Link>
				</Button>
				<PageHeader
					title={`${t("aircraftProfiles.calculate")} - ${profile.name}`}
					subtitle={data.aircraftModel}
					className="mb-0"
				/>
			</div>

			<div className="gap-6 grid grid-cols-1 md:grid-cols-2 items-start">
				{/* Left Column: Inputs */}
				<div className="gap-4 flex flex-col">
					<Card className="p-5">
						<div className="gap-2 mb-4 flex items-center">
							<CalculatorIcon className="size-5 text-primary" />
							<h2 className="font-semibold">{t("aircraftProfiles.calculator.flightWeights")}</h2>
						</div>

						<div className="gap-4 flex flex-col">
							{data.stations.map((station) => (
								<div key={station.id} className="gap-1.5 flex flex-col">
									<div className="flex items-center justify-between">
										<Label htmlFor={station.id}>{station.name}</Label>
										<span className="text-muted-foreground text-xs">
											{t("aircraftProfiles.form.arm")}: {station.arm.toFixed(1)} in
										</span>
									</div>
									<Input
										id={station.id}
										type="number"
										step="0.1"
										placeholder="0.0"
										value={stationWeights[station.id] || ""}
										onChange={(e) => handleWeightChange(station.id, parseFloat(e.target.value))}
									/>
								</div>
							))}

							{data.stations.length === 0 && (
								<p className="py-4 text-center text-muted-foreground text-sm">
									{t("aircraftProfiles.form.noStations")}
								</p>
							)}
						</div>
					</Card>
				</div>

				{/* Right Column: Results & Chart */}
				<div className="gap-4 flex flex-col">
					{/* Table of results */}
					<Card className="p-5 overflow-hidden">
						<h2 className="font-semibold mb-4">{t("aircraftProfiles.calculator.results")}</h2>
						<div className="overflow-x-auto">
							<table className="w-full text-sm text-left">
								<thead className="border-b text-muted-foreground">
									<tr>
										<th className="pb-2 font-medium">Item</th>
										<th className="pb-2 font-medium text-right">{t("aircraftProfiles.form.weight")} (lb)</th>
										<th className="pb-2 font-medium text-right">{t("aircraftProfiles.form.arm")} (in)</th>
										<th className="pb-2 font-medium text-right">{t("aircraftProfiles.calculator.moment")}</th>
									</tr>
								</thead>
								<tbody className="divide-y">
									<tr>
										<td className="py-2 text-muted-foreground">{t("aircraftProfiles.form.basicEmptyWeight")}</td>
										<td className="py-2 text-right">{data.basicEmptyWeight.toFixed(1)}</td>
										<td className="py-2 text-right">{data.basicEmptyCG.toFixed(1)}</td>
										<td className="py-2 text-right">{(data.basicEmptyWeight * data.basicEmptyCG).toFixed(1)}</td>
									</tr>
									{calculations.items.map((item) => (
										<tr key={item.id}>
											<td className="py-2 text-muted-foreground">{item.name}</td>
											<td className="py-2 text-right">{item.weight.toFixed(1)}</td>
											<td className="py-2 text-right">{item.arm.toFixed(1)}</td>
											<td className="py-2 text-right">{item.moment.toFixed(1)}</td>
										</tr>
									))}
								</tbody>
								<tfoot className="border-t font-semibold">
									<tr>
										<td className="pt-2">{t("aircraftProfiles.calculator.totals")}</td>
										<td className="pt-2 text-right">{calculations.totalWeight.toFixed(1)}</td>
										<td className="pt-2 text-right text-primary">{calculations.cg.toFixed(2)}</td>
										<td className="pt-2 text-right">{calculations.totalMoment.toFixed(1)}</td>
									</tr>
								</tfoot>
							</table>
						</div>
						
						{/* MTOW Validation */}
						<div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
							<span className="text-sm font-medium">MTOW ({data.mtow} lb)</span>
							<span className={cn("text-sm font-bold", calculations.totalWeight > data.mtow ? "text-destructive" : "text-emerald-500")}>
								{calculations.totalWeight > data.mtow ? t("aircraftProfiles.calculator.overweight") : t("aircraftProfiles.calculator.withinLimit")}
							</span>
						</div>
					</Card>

					{/* CG Envelope Chart */}
					<Card className="p-5 flex flex-col">
						<h2 className="font-semibold mb-4">{t("aircraftProfiles.calculator.envelope")}</h2>
						{graphData.envelope.length > 0 ? (
							<ChartContainer config={chartConfig} className="h-[300px] w-full mt-2">
								<ScatterChart margin={{ top: 10, right: 10, bottom: 20, left: 0 }}>
									<CartesianGrid strokeDasharray="3 3" vertical={false} />
									<XAxis 
										type="number" 
										dataKey="arm" 
										name={t("aircraftProfiles.form.arm")} 
										domain={['dataMin - 2', 'dataMax + 2']} 
										tickCount={8}
										unit="in"
									/>
									<YAxis 
										type="number" 
										dataKey="weight" 
										name={t("aircraftProfiles.form.weight")} 
										domain={['dataMin - 100', 'dataMax + 200']}
										unit="lb"
									/>
									<ChartTooltip content={<ChartTooltipContent />} />
									
									{/* Envelope Limits */}
									<Scatter 
										name={chartConfig.envelope.label}
										data={graphData.envelope} 
										fill="var(--color-envelope)"
										line={{ stroke: "var(--color-envelope)", strokeWidth: 2 }}
										shape="circle"
										isAnimationActive={false}
									/>

									{/* Empty Weight Point */}
									<Scatter 
										name={chartConfig.bew.label}
										data={graphData.bew} 
										fill="var(--color-bew)" 
										shape="cross"
									/>

									{/* Current Calculated CG Point */}
									<Scatter 
										name={chartConfig.current.label}
										data={graphData.current} 
										fill="var(--color-current)" 
										shape="circle"
									/>
								</ScatterChart>
							</ChartContainer>
						) : (
							<div className="h-[300px] flex items-center justify-center border-2 border-dashed rounded-lg">
								<p className="text-sm text-muted-foreground">{t("aircraftProfiles.calculator.noEnvelopeLimits")}</p>
							</div>
						)}
					</Card>
				</div>
			</div>
		</div>
	);
}
