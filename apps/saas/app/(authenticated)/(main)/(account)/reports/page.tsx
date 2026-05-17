import { getSession } from "@auth/lib/server";
import { Button, Card } from "@repo/ui";
import { listFiles, getSignedUrl } from "@repo/storage";
import { PageHeader } from "@shared/components/PageHeader";
import { FileTextIcon, ArrowRightIcon, PlaneIcon, PlusIcon, ExternalLinkIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import pdfIcon from "@shared/pdf.png";

export default async function ReportsPage() {
	const session = await getSession();
	const userId = session?.user.id;

	if (!userId) {
		redirect("/login");
	}

	let reports: Array<{ key: string; lastModified?: Date; size?: number; url: string }> = [];

	try {
		const files = await listFiles(`${userId}/`, { bucket: "relatorios" });
		const sortedFiles = [...files].sort((a, b) => {
			const aTime = a.lastModified ? new Date(a.lastModified).getTime() : 0;
			const bTime = b.lastModified ? new Date(b.lastModified).getTime() : 0;
			return bTime - aTime;
		});

		reports = await Promise.all(
			sortedFiles.map(async (file) => {
				const signedUrl = await getSignedUrl(file.key, {
					bucket: "relatorios",
					expiresIn: 3600,
				});
				return {
					...file,
					url: signedUrl,
				};
			})
		);
	} catch (error) {
		console.error("Error loading reports from storage:", error);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
				<PageHeader
					title="Meus Relatórios"
					subtitle="Visualize, exporte e gerencie todos os relatórios de peso e balanceamento gerados para os seus voos."
					className="mb-0"
				/>
				{reports.length > 0 && (
					<Button asChild className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium shadow-md shadow-sky-500/10 transition-all duration-300 shrink-0">
						<Link href="/aircraft-profiles">
							<PlusIcon className="size-4" />
							Novo Cálculo
						</Link>
					</Button>
				)}
			</div>

			{reports.length === 0 ? (
				<Card className="flex flex-col items-center justify-center text-center p-8 md:p-16 border border-border/50 shadow-lg bg-card/50 backdrop-blur-sm rounded-2xl">
					<div className="relative mb-6 flex size-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500/20 to-blue-600/20 border border-sky-500/30 text-sky-500 shadow-inner">
						<FileTextIcon className="size-10" />
						<div className="absolute -bottom-1 -right-1 flex size-6 items-center justify-center rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-500">
							<PlaneIcon className="size-3.5 rotate-45" />
						</div>
					</div>

					<h3 className="font-semibold text-xl tracking-tight">Nenhum relatório encontrado</h3>
					<p className="max-w-md text-muted-foreground text-sm mt-2 mb-8 leading-relaxed">
						Você ainda não gerou nenhum relatório de peso e balanceamento. Selecione uma aeronave para preencher os dados de voo e gerar o relatório em PDF.
					</p>

					<div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
						<Button asChild className="gap-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium shadow-md shadow-sky-500/10 transition-all duration-300">
							<Link href="/aircraft-profiles">
								Acessar Minhas Aeronaves
								<ArrowRightIcon className="size-4" />
							</Link>
						</Button>
					</div>
				</Card>
			) : (
				<div className="flex flex-col gap-4">
					{reports.map((report) => {
						const formattedDate = report.lastModified
							? new Date(report.lastModified).toLocaleDateString("pt-BR", {
									timeZone: "America/Sao_Paulo",
									day: "2-digit",
									month: "2-digit",
									year: "numeric",
									hour: "2-digit",
									minute: "2-digit",
								})
							: "Data indisponível";
						
						const sizeFormatted = report.size
							? `${(report.size / 1024).toFixed(0)} KB`
							: "Tamanho desconhecido";

						return (
							<a
								key={report.key}
								href={report.url}
								target="_blank"
								rel="noopener noreferrer"
								className="group flex items-center justify-between p-4 rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-sky-500/40 hover:bg-card/90 transition-all duration-300 cursor-pointer"
							>
								<div className="flex items-center gap-4">
									<div className="flex size-14 items-center justify-center rounded-xl bg-muted/50 p-2 group-hover:scale-105 transition-transform duration-300">
										<Image src={pdfIcon} alt="PDF Icon" width={40} height={40} className="object-contain" />
									</div>
									<div>
										<h4 className="font-semibold text-sm text-foreground group-hover:text-sky-500 transition-colors duration-200">
											Relatório de Peso e Balanceamento
										</h4>
										<p className="text-xs text-muted-foreground mt-0.5">
											Gerado em {formattedDate}
										</p>
										<span className="inline-block mt-1 text-[10px] font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
											{sizeFormatted}
										</span>
									</div>
								</div>
								<div className="flex size-8 items-center justify-center rounded-full bg-muted/40 group-hover:bg-sky-500/10 group-hover:text-sky-500 transition-all duration-300 text-muted-foreground/60 mr-1">
									<ExternalLinkIcon className="size-4" />
								</div>
							</a>
						);
					})}
				</div>
			)}
		</div>
	);
}
