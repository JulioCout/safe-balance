import { getSession } from "@auth/lib/server";
import { getSignedUrl, listFiles } from "@repo/storage";
import { Button, Card } from "@repo/ui";
import { PageHeader } from "@shared/components/PageHeader";
import pdfIcon from "@shared/pdf.png";
import { ArrowRightIcon, ExternalLinkIcon, FileTextIcon, PlaneIcon, PlusIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ReportsPage() {
	const session = await getSession();
	const userId = session?.user.id;

	if (!userId) {
		redirect("/login");
	}

	let reports: Array<{
		key: string;
		lastModified?: Date;
		size?: number;
		url: string;
	}> = [];

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
			}),
		);
	} catch (error) {
		console.error("Error loading reports from storage:", error);
	}

	return (
		<div className="space-y-6 max-w-4xl mx-auto">
			<div className="sm:flex-row sm:items-center sm:justify-between gap-4 flex flex-col">
				<PageHeader
					title="Meus Relatórios"
					subtitle="Visualize, exporte e gerencie todos os relatórios de peso e balanceamento gerados para os seus voos."
					className="mb-0"
				/>
				{reports.length > 0 && (
					<Button
						className="gap-2 from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium shadow-md shadow-sky-500/10 shrink-0 bg-gradient-to-r transition-all duration-300"
						render={(props) => (
							<Link {...props} href="/aircraft-profiles">
								<PlusIcon className="size-4" />
								Novo Cálculo
							</Link>
						)}
					/>
				)}
			</div>

			{reports.length === 0 ? (
				<Card className="p-8 md:p-16 shadow-lg backdrop-blur-sm flex flex-col items-center justify-center rounded-2xl border border-border/50 bg-card/50 text-center">
					<div className="mb-6 size-20 from-sky-500/20 to-blue-600/20 border-sky-500/30 text-sky-500 shadow-inner relative flex items-center justify-center rounded-2xl border bg-gradient-to-tr">
						<FileTextIcon className="size-10" />
						<div className="-bottom-1 -right-1 size-6 bg-emerald-500/20 border-emerald-500/30 text-emerald-500 absolute flex items-center justify-center rounded-full border">
							<PlaneIcon className="size-3.5 rotate-45" />
						</div>
					</div>

					<h3 className="font-semibold text-xl tracking-tight">Nenhum relatório encontrado</h3>
					<p className="max-w-md text-sm mt-2 mb-8 leading-relaxed text-muted-foreground">
						Você ainda não gerou nenhum relatório de peso e balanceamento. Selecione uma aeronave
						para preencher os dados de voo e gerar o relatório em PDF.
					</p>

					<div className="sm:flex-row gap-3 sm:w-auto flex w-full flex-col">
						<Button
							className="gap-2 from-sky-500 to-blue-600 hover:from-sky-600 hover:to-blue-700 text-white font-medium shadow-md shadow-sky-500/10 bg-gradient-to-r transition-all duration-300"
							render={(props) => (
								<Link {...props} href="/aircraft-profiles">
									Acessar Minhas Aeronaves
									<ArrowRightIcon className="size-4" />
								</Link>
							)}
						/>
					</div>
				</Card>
			) : (
				<div className="gap-4 flex flex-col">
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
								className="group p-4 backdrop-blur-sm shadow-sm hover:shadow-md hover:border-sky-500/40 flex cursor-pointer items-center justify-between rounded-xl border border-border/50 bg-card/60 transition-all duration-300 hover:bg-card/90"
							>
								<div className="gap-4 flex items-center">
									<div className="size-14 p-2 flex items-center justify-center rounded-xl bg-muted/50 transition-transform duration-300 group-hover:scale-105">
										<Image
											src={pdfIcon}
											alt="PDF Icon"
											width={40}
											height={40}
											className="object-contain"
										/>
									</div>
									<div>
										<h4 className="font-semibold text-sm group-hover:text-sky-500 text-foreground transition-colors duration-200">
											Relatório de Peso e Balanceamento
										</h4>
										<p className="text-xs mt-0.5 text-muted-foreground">
											Gerado em {formattedDate}
										</p>
										<span className="mt-1 font-medium px-2 py-0.5 rounded inline-block bg-muted text-[10px] text-muted-foreground">
											{sizeFormatted}
										</span>
									</div>
								</div>
								<div className="size-8 group-hover:bg-sky-500/10 group-hover:text-sky-500 mr-1 flex items-center justify-center rounded-full bg-muted/40 text-muted-foreground/60 transition-all duration-300">
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
