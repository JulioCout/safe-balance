"use client";

import {
	Button,
	Card,
	cn,
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Skeleton,
} from "@repo/ui";
import { ChartContainer, ChartTooltip } from "@repo/ui/components/chart";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { PageHeader } from "@shared/components/PageHeader";
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";
import { ArrowLeftIcon, FileTextIcon, Loader2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis } from "recharts";

import { useAircraftProfilesQuery, useSendReportMutation } from "../lib/api";
import type { AircraftProfileData, EnvelopePoint } from "../lib/types";

// ── W&B types ───────────────────────────────────────────────────────
interface WBPoint {
	mass: number;
	cg: number;
	moment: number;
}

// ── Point-in-polygon (ray casting) — identical to HTML prototype ────
function isInsideEnvelope(env: EnvelopePoint[], cg: number, mass: number): boolean {
	let inside = false;
	for (let i = 0, j = env.length - 1; i < env.length; j = i++) {
		const xi = env[i].x;
		const yi = env[i].y;
		const xj = env[j].x;
		const yj = env[j].y;
		if (yi > mass !== yj > mass && cg < ((xj - xi) * (mass - yi)) / (yj - yi) + xi) {
			inside = !inside;
		}
	}
	return inside;
}

// ── Colors (same palette as HTML) ───────────────────────────────────
const C = {
	envelope: "#1D9E75",
	ZFM: "#1D9E75",
	RAMP: "#378ADD",
	TOM: "#7F77DD",
	LDM: "#BA7517",
	error: "#E24B4A",
};

// ── Station type tag colors ──────────────────────────────────────────
const TAG_CLASS: Record<string, string> = {
	crew: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
	pax: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
	cargo: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
};

// ── Invisible dot for recharts Scatter used only as line ─────────────
function NoShape(props: { cx?: number; cy?: number }) {
	return <circle cx={props.cx ?? 0} cy={props.cy ?? 0} r={0} />;
}

// ────────────────────────────────────────────────────────────────────
export function AircraftBalanceCalculator({ profileId }: { profileId: string }) {
	const t = useTranslations();
	const { data: profiles, isLoading } = useAircraftProfilesQuery();
	const { mutateAsync: sendReport } = useSendReportMutation();

	const reportRef = useRef<HTMLDivElement>(null);
	const sigCanvasRef = useRef<SignatureCanvas>(null);

	// modal state
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isGenerating, setIsGenerating] = useState(false);
	const [captainName, setCaptainName] = useState("");

	const profile = profiles?.find((p) => p.id === profileId);
	const data: AircraftProfileData | undefined = useMemo(() => {
		const rawData = profile?.data as unknown as Partial<AircraftProfileData> | undefined;
		if (!rawData) return undefined;
		return {
			profileName: rawData.profileName ?? "",
			aircraftModel: rawData.aircraftModel ?? "",
			registration: rawData.registration ?? "",
			bem: rawData.bem ?? 0,
			bemCG: rawData.bemCG ?? 0,
			limits: rawData.limits ?? { MTOM: 0, MZFM: 0, MLDM: 0 },
			stations: rawData.stations ?? [],
			envelope: rawData.envelope ?? [],
		};
	}, [profile]);

	// Editable BEM / BEM CG — pre-filled from profile, overridable per-flight
	const [bemOverride, setBemOverride] = useState("");
	const [bemCGOverride, setBemCGOverride] = useState("");
	const effectiveBem = bemOverride !== "" ? Number(bemOverride) : (data?.bem ?? 0);
	const effectiveBemCG = bemCGOverride !== "" ? Number(bemCGOverride) : (data?.bemCG ?? 0);

	// Payload loads per station (kg)
	const [loads, setLoads] = useState<Record<string, number>>({});

	// Fuel inputs (kg)
	const [fuelRamp, setFuelRamp] = useState("0");
	const [fuelTaxi, setFuelTaxi] = useState("0");
	const [fuelTrip, setFuelTrip] = useState("0");

	// ── W&B calculation — identical to HTML calcWB() ─────────────────
	const wb = useMemo((): {
		ZFM: WBPoint;
		RAMP: WBPoint;
		TOM: WBPoint;
		LDM: WBPoint;
	} | null => {
		if (!data) return null;
		const fuelStation = data.stations.find((s) => s.type === "fuel");
		if (!fuelStation) return null;

		const fRamp = Number.parseFloat(fuelRamp) || 0;
		const fTaxi = Number.parseFloat(fuelTaxi) || 0;
		const fTrip = Number.parseFloat(fuelTrip) || 0;

		let mass = effectiveBem;
		let moment = effectiveBem * effectiveBemCG;

		for (const s of data.stations.filter((s) => s.type !== "fuel")) {
			const v = loads[s.id] || 0;
			mass += v;
			moment += v * s.arm;
		}
		const ZFM: WBPoint = { mass, cg: mass ? moment / mass : 0, moment };

		mass += fRamp;
		moment += fRamp * fuelStation.arm;
		const RAMP: WBPoint = { mass, cg: mass ? moment / mass : 0, moment };

		mass -= fTaxi;
		moment -= fTaxi * fuelStation.arm;
		const TOM: WBPoint = { mass, cg: mass ? moment / mass : 0, moment };

		mass -= fTrip;
		moment -= fTrip * fuelStation.arm;
		const LDM: WBPoint = { mass, cg: mass ? moment / mass : 0, moment };

		return { ZFM, RAMP, TOM, LDM };
	}, [data, effectiveBem, effectiveBemCG, loads, fuelRamp, fuelTaxi, fuelTrip]);

	// ── Envelope checks — identical to HTML checkPoint() ─────────────
	const checks = useMemo(() => {
		if (!data || !wb) return null;
		const { ZFM, RAMP, TOM, LDM } = wb;
		const { MTOM, MZFM, MLDM } = data.limits;
		return {
			ZFM: ZFM.mass <= MZFM && isInsideEnvelope(data.envelope, ZFM.cg, ZFM.mass),
			RAMP: RAMP.mass <= MTOM * 1.01 && isInsideEnvelope(data.envelope, RAMP.cg, RAMP.mass),
			TOM: TOM.mass <= MTOM && isInsideEnvelope(data.envelope, TOM.cg, TOM.mass),
			LDM: LDM.mass <= MLDM && isInsideEnvelope(data.envelope, LDM.cg, LDM.mass),
		};
	}, [data, wb]);

	const allOk = checks ? Object.values(checks).every(Boolean) : false;
	const badPhases = checks
		? Object.entries(checks)
				.filter(([, ok]) => !ok)
				.map(([k]) => k)
		: [];

	// ── Chart data ────────────────────────────────────────────────────
	const chartData = useMemo(() => {
		if (!data || !wb || data.envelope.length === 0) return null;
		const { ZFM, RAMP, TOM, LDM } = wb;
		const env = data.envelope;
		const xs = env.map((p) => p.x);
		const ys = env.map((p) => p.y);
		return {
			envelope: env,
			trajectory: [ZFM, RAMP, TOM, LDM].map((p) => ({ x: p.cg, y: p.mass })),
			ZFM: [{ x: ZFM.cg, y: ZFM.mass }],
			RAMP: [{ x: RAMP.cg, y: RAMP.mass }],
			TOM: [{ x: TOM.cg, y: TOM.mass }],
			LDM: [{ x: LDM.cg, y: LDM.mass }],
			xDomain: [Math.min(...xs) - 0.03, Math.max(...xs) + 0.03] as [number, number],
			yDomain: [Math.min(...ys) - 100, Math.max(...ys) + 150] as [number, number],
		};
	}, [data, wb]);

	// ── PDF generation ───────────────────────────────────────────────
	const handleGenerateReport = async () => {
		if (!captainName.trim()) {
			toastError("Por favor, digite o nome do capitão.");
			return;
		}
		if (sigCanvasRef.current?.isEmpty()) {
			toastError("Por favor, assine o relatório antes de gerar.");
			return;
		}
		if (!reportRef.current) return;

		try {
			setIsGenerating(true);
			const timestamp = new Date().toLocaleString("pt-BR", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				hour: "2-digit",
				minute: "2-digit",
				second: "2-digit",
			});
			const signatureDataUrl = sigCanvasRef.current?.getTrimmedCanvas().toDataURL("image/png");
			const imgData = await toJpeg(reportRef.current, {
				cacheBust: true,
				quality: 0.85,
				pixelRatio: 1,
				backgroundColor: "hsl(var(--background))",
			});
			const pdf = new jsPDF({
				orientation: "p",
				unit: "pt",
				format: "a4",
				compress: true,
			});
			const pdfWidth = pdf.internal.pageSize.getWidth();
			const rect = reportRef.current.getBoundingClientRect();
			const pdfHeight = (rect.height * pdfWidth) / rect.width;
			pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight, undefined, "FAST");

			if (signatureDataUrl) {
				const sigWidth = 150;
				const sigHeight = 50;
				const startY =
					pdfHeight + 20 < pdf.internal.pageSize.getHeight() - 140
						? pdfHeight + 20
						: pdf.internal.pageSize.getHeight() - 140;
				pdf.addImage(signatureDataUrl, "PNG", 50, startY, sigWidth, sigHeight);
				pdf.setFontSize(10);
				pdf.setFont("helvetica", "bold");
				pdf.text("CÁLCULO CONFIRMADO PELO CAPITÃO", 50, startY + sigHeight + 15);
				pdf.setFont("helvetica", "normal");
				pdf.text(`Nome: ${captainName}`, 50, startY + sigHeight + 30);
				pdf.text(`Data/Hora da Assinatura: ${timestamp}`, 50, startY + sigHeight + 45);
			}

			const base64 = pdf.output("datauristring");
			await sendReport({
				profileName: profile?.name || "Aeronave",
				pdfBase64: base64,
			});
			toastSuccess("Relatório gerado e enviado para seu e-mail!");
			setIsModalOpen(false);
		} catch (error) {
			console.error(error);
			toastError("Ocorreu um erro ao gerar o relatório.");
		} finally {
			setIsGenerating(false);
		}
	};

	// ── Loading / not found ───────────────────────────────────────────
	if (isLoading) {
		return (
			<div className="gap-4 flex flex-col">
				<Skeleton className="h-10 w-48" />
				<Skeleton className="h-40 w-full rounded-xl" />
				<Skeleton className="h-40 w-full rounded-xl" />
				<Skeleton className="h-96 w-full rounded-xl" />
			</div>
		);
	}

	if (!profile || !data) {
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

	const payloadStations = data.stations.filter((s) => s.type !== "fuel");

	// ── Render ────────────────────────────────────────────────────────
	return (
		<div>
			{/* Header */}
			<div className="gap-4 mb-6 flex items-center justify-between">
				<div className="gap-4 flex items-center">
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
						title={`Weight & Balance — ${profile.name}`}
						subtitle={data.aircraftModel}
						className="mb-0"
					/>
				</div>
				<Button onClick={() => setIsModalOpen(true)} className="gap-2 shrink-0">
					<FileTextIcon className="size-4" />
					Gerar Relatório
				</Button>
			</div>

			<div ref={reportRef} className="gap-4 p-2 -mx-2 flex flex-col rounded-xl bg-background">
				{/* ── Registro da Matrícula ──────────────────────────────── */}
				<Card className="p-5">
					<p className="text-xs font-semibold tracking-wider mb-3 text-muted-foreground uppercase">
						Registro da Matrícula
					</p>
					<div className="sm:grid-cols-3 gap-3 grid grid-cols-1">
						<div className="gap-1.5 flex flex-col">
							<Label className="text-xs">Matrícula</Label>
							<Input value={data.registration ?? ""} readOnly className="h-8 text-sm bg-muted/40" />
						</div>
						<div className="gap-1.5 flex flex-col">
							<Label className="text-xs">BEM (kg)</Label>
							<Input
								type="number"
								step="0.1"
								value={bemOverride !== "" ? bemOverride : data.bem}
								onChange={(e) => setBemOverride(e.target.value)}
								className="h-8 text-sm"
							/>
						</div>
						<div className="gap-1.5 flex flex-col">
							<Label className="text-xs">BEM CG (m)</Label>
							<Input
								type="number"
								step="0.001"
								value={bemCGOverride !== "" ? bemCGOverride : data.bemCG}
								onChange={(e) => setBemCGOverride(e.target.value)}
								className="h-8 text-sm"
							/>
						</div>
					</div>
				</Card>

				{/* ── Payload ────────────────────────────────────────────── */}
				<Card className="p-5">
					<p className="text-xs font-semibold tracking-wider mb-3 text-muted-foreground uppercase">
						Payload
					</p>
					<div className="flex flex-col divide-y">
						{payloadStations.length === 0 && (
							<p className="py-4 text-sm text-center text-muted-foreground">
								Nenhuma estação de payload cadastrada.
							</p>
						)}
						{payloadStations.map((station) => (
							<div key={station.id} className="gap-3 py-2.5 flex items-center">
								<div className="gap-2 min-w-0 flex flex-[2] items-center">
									<span className="text-sm truncate">{station.name}</span>
									<span
										className={cn(
											"font-medium px-2 py-0.5 shrink-0 rounded-full text-[11px]",
											TAG_CLASS[station.type] ?? "bg-muted text-muted-foreground",
										)}
									>
										{station.type}
									</span>
								</div>
								<span className="text-xs sm:block hidden flex-1 text-center text-muted-foreground">
									braço {station.arm.toFixed(3)} m
								</span>
								<div className="gap-1.5 flex flex-1 items-center">
									<Input
										type="number"
										min={0}
										max={station.maxMass}
										step="1"
										value={loads[station.id] ?? 0}
										onChange={(e) =>
											setLoads((prev) => ({
												...prev,
												[station.id]: Number.parseFloat(e.target.value) || 0,
											}))
										}
										className="h-8 text-sm"
									/>
									<span className="text-xs shrink-0 text-muted-foreground">kg</span>
								</div>
							</div>
						))}
					</div>
				</Card>

				{/* ── Combustível ───────────────────────────────────────── */}
				<Card className="p-5">
					<p className="text-xs font-semibold tracking-wider mb-3 text-muted-foreground uppercase">
						Combustível
					</p>
					<div className="sm:grid-cols-3 gap-3 grid grid-cols-1">
						<div className="gap-1.5 flex flex-col">
							<Label className="text-xs">Combustível Ramp (kg)</Label>
							<Input
								type="number"
								step="1"
								value={fuelRamp}
								onChange={(e) => setFuelRamp(e.target.value)}
								className="h-8 text-sm"
							/>
						</div>
						<div className="gap-1.5 flex flex-col">
							<Label className="text-xs">Táxi (kg)</Label>
							<Input
								type="number"
								step="1"
								value={fuelTaxi}
								onChange={(e) => setFuelTaxi(e.target.value)}
								className="h-8 text-sm"
							/>
						</div>
						<div className="gap-1.5 flex flex-col">
							<Label className="text-xs">Trip / Destino (kg)</Label>
							<Input
								type="number"
								step="1"
								value={fuelTrip}
								onChange={(e) => setFuelTrip(e.target.value)}
								className="h-8 text-sm"
							/>
						</div>
					</div>
				</Card>

				{/* ── Alert ─────────────────────────────────────────────── */}
				{wb && checks && (
					<div
						className={cn(
							"px-4 py-3 text-sm font-medium rounded-lg border",
							allOk
								? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800/40"
								: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800/40",
						)}
					>
						{allOk
							? "✓ Todos os pontos estão dentro do envelope — operação aprovada."
							: `⚠ Pontos FORA do envelope: ${badPhases.join(", ")}. Redistribua carga ou ajuste combustível.`}
					</div>
				)}

				{/* ── Results grid — ZFM / RAMP / TOM / LDM ────────────── */}
				{wb && checks && (
					<div className="sm:grid-cols-4 gap-3 grid grid-cols-2">
						{(
							[
								{
									label: "ZFM",
									pt: wb.ZFM,
									ok: checks.ZFM,
									lim: `≤ ${data.limits.MZFM} kg`,
								},
								{
									label: "Ramp",
									pt: wb.RAMP,
									ok: checks.RAMP,
									lim: `≤ ${data.limits.MTOM} kg`,
								},
								{
									label: "TOM",
									pt: wb.TOM,
									ok: checks.TOM,
									lim: `≤ ${data.limits.MTOM} kg`,
								},
								{
									label: "LDM",
									pt: wb.LDM,
									ok: checks.LDM,
									lim: `≤ ${data.limits.MLDM} kg`,
								},
							] as const
						).map(({ label, pt, ok, lim }) => (
							<Card
								key={label}
								className={cn("p-4 text-center", !ok && "border-destructive/40 bg-destructive/5")}
							>
								<p className="text-xs mb-1 text-muted-foreground">{label}</p>
								<p
									className={cn(
										"text-lg font-semibold",
										ok ? "text-emerald-600 dark:text-emerald-400" : "text-destructive",
									)}
								>
									{Math.round(pt.mass)} kg
								</p>
								<p className="text-xs mt-1 text-muted-foreground">
									CG {pt.cg.toFixed(3)} m <span className="font-medium">{ok ? "✓" : "⚠ FORA"}</span>
								</p>
								<p className="mt-0.5 text-[10px] text-muted-foreground/60">{lim}</p>
							</Card>
						))}
					</div>
				)}

				{/* ── CG Envelope Chart ─────────────────────────────────── */}
				<Card className="p-5">
					<p className="text-xs font-semibold tracking-wider mb-4 text-muted-foreground uppercase">
						Envelope de CG
					</p>
					{chartData ? (
						<>
							<ChartContainer
								config={{ envelope: { label: "Envelope", color: C.envelope } }}
								className="h-[380px] w-full"
							>
								<ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
									<CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
									<XAxis
										type="number"
										dataKey="x"
										name="CG"
										domain={chartData.xDomain}
										tickCount={8}
										tickFormatter={(v) => v.toFixed(3)}
										unit=" m"
										tick={{ fontSize: 11 }}
										label={{
											value: "CG (m)",
											position: "insideBottom",
											offset: -15,
											fontSize: 12,
										}}
									/>
									<YAxis
										type="number"
										dataKey="y"
										name="Massa"
										domain={chartData.yDomain}
										tick={{ fontSize: 11 }}
										tickFormatter={(v) => `${v}`}
										label={{
											value: "Massa (kg)",
											angle: -90,
											position: "insideLeft",
											offset: 10,
											fontSize: 12,
										}}
									/>
									<ChartTooltip
										cursor={{ strokeDasharray: "3 3" }}
										content={({ active, payload }) => {
											if (!active || !payload?.length) return null;
											const d = payload[0].payload as { x: number; y: number };
											const name = payload[0]?.name as string;
											if (!name || name === "Envelope" || name === "Trajetória") return null;
											return (
												<div className="px-3 py-2 text-xs shadow-md rounded-lg border bg-background">
													<p className="font-semibold mb-1">{name}</p>
													<p>{Math.round(d.y)} kg</p>
													<p>CG {d.x.toFixed(3)} m</p>
												</div>
											);
										}}
									/>

									{/* Envelope outline */}
									<Scatter
										name="Envelope"
										data={chartData.envelope}
										fill={C.envelope}
										line={{ stroke: C.envelope, strokeWidth: 1.5 }}
										shape={<NoShape />}
										isAnimationActive={false}
									/>

									{/* Trajectory dashed line */}
									<Scatter
										name="Trajetória"
										data={chartData.trajectory}
										fill="transparent"
										line={{
											stroke: "hsl(var(--muted-foreground))",
											strokeWidth: 1,
											strokeDasharray: "4 4",
										}}
										shape={<NoShape />}
										isAnimationActive={false}
									/>

									{/* Phase points */}
									<Scatter
										name="ZFM"
										data={chartData.ZFM}
										fill={checks?.ZFM ? C.ZFM : C.error}
										shape="circle"
										isAnimationActive={false}
									/>
									<Scatter
										name="RAMP"
										data={chartData.RAMP}
										fill={checks?.RAMP ? C.RAMP : C.error}
										shape="circle"
										isAnimationActive={false}
									/>
									<Scatter
										name="TOM"
										data={chartData.TOM}
										fill={checks?.TOM ? C.TOM : C.error}
										shape="circle"
										isAnimationActive={false}
									/>
									<Scatter
										name="LDM"
										data={chartData.LDM}
										fill={checks?.LDM ? C.LDM : C.error}
										shape="circle"
										isAnimationActive={false}
									/>
								</ScatterChart>
							</ChartContainer>

							{/* Legend */}
							<div className="gap-4 mt-3 text-xs flex flex-wrap text-muted-foreground">
								{[
									{ color: C.envelope, label: "Envelope" },
									{ color: checks?.ZFM ? C.ZFM : C.error, label: "ZFM" },
									{ color: checks?.RAMP ? C.RAMP : C.error, label: "RAMP" },
									{ color: checks?.TOM ? C.TOM : C.error, label: "TOM" },
									{ color: checks?.LDM ? C.LDM : C.error, label: "LDM" },
								].map(({ color, label }) => (
									<span key={label} className="gap-1.5 flex items-center">
										<span
											className="w-2.5 h-2.5 inline-block rounded-sm"
											style={{ backgroundColor: color }}
										/>
										{label}
									</span>
								))}
							</div>
						</>
					) : (
						<div className="flex h-[380px] items-center justify-center rounded-lg border-2 border-dashed">
							<p className="text-sm px-8 text-center text-muted-foreground">
								Configure o envelope de CG no perfil da aeronave para exibir o gráfico.
							</p>
						</div>
					)}
				</Card>
			</div>

			{/* ── Signature Modal ───────────────────────────────────────── */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="sm:max-w-[500px]">
					<DialogHeader>
						<DialogTitle>Gerar Relatório de Peso e Balanceamento</DialogTitle>
					</DialogHeader>
					<div className="gap-4 py-4 flex flex-col">
						<p className="text-sm text-muted-foreground">
							Por favor, insira o nome do capitão e assine abaixo para confirmar os dados do cálculo
							de balanceamento.
						</p>
						<div className="gap-1.5 flex flex-col">
							<Label htmlFor="captain-name" className="text-sm font-semibold">
								Nome do Capitão
							</Label>
							<Input
								id="captain-name"
								type="text"
								placeholder="Digite o nome completo do capitão"
								value={captainName}
								onChange={(e) => setCaptainName(e.target.value)}
							/>
						</div>
						<div className="gap-1.5 flex flex-col">
							<Label className="text-sm font-semibold">Assinatura do Capitão</Label>
							<div className="bg-white shadow-inner overflow-hidden rounded-md border">
								<SignatureCanvas
									ref={sigCanvasRef}
									penColor="black"
									canvasProps={{ className: "w-full h-40" }}
								/>
							</div>
						</div>
						<div className="flex justify-end">
							<Button
								variant="ghost"
								size="sm"
								onClick={() => sigCanvasRef.current?.clear()}
								className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
							>
								Limpar Assinatura
							</Button>
						</div>
					</div>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setIsModalOpen(false)}
							className="text-foreground"
						>
							Cancelar
						</Button>
						<Button onClick={handleGenerateReport} disabled={isGenerating}>
							{isGenerating && <Loader2Icon className="mr-2 size-4 animate-spin" />}
							Confirmar e Enviar
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
