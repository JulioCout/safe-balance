import { sendEmail } from "@repo/mail";
import { uploadFile } from "@repo/storage";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";

import { protectedProcedure } from "../../../orpc/procedures";

export const sendReportProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/aircraft-profiles/send-report",
		tags: ["AircraftProfiles"],
		summary: "Send calculation report",
		description: "Generate a PDF report, save it to the bucket and send it to the user's email",
	})
	.input(
		z.object({
			profileName: z.string(),
			pdfBase64: z.string().min(1),
		}),
	)
	.handler(async ({ input: { profileName, pdfBase64 }, context: { user } }) => {
		// Convert base64 to buffer
		// The base64 string usually comes with a prefix like "data:application/pdf;base64,..."
		const base64Data = pdfBase64.split("base64,")[1] || pdfBase64;
		const buffer = Buffer.from(base64Data, "base64");

		// Upload to storage
		const fileName = `${user.id}/${uuidv4()}.pdf`;
		await uploadFile(fileName, buffer, {
			bucket: "relatorios",
			contentType: "application/pdf",
		});

		// Send Email
		const subject = `Relatório de W&B - ${profileName}`;
		
		const html = `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Relatório de Peso e Balanceamento</h2>
				<p>Olá ${user.name ?? "Piloto"},</p>
				<p>Segue em anexo o relatório de Peso e Balanceamento gerado para a aeronave <strong>${profileName}</strong>.</p>
				<br />
				<p>Safe Balance</p>
			</div>
		`;

		const text = `Relatório de Peso e Balanceamento\n\nOlá ${user.name ?? "Piloto"},\n\nSegue em anexo o relatório de Peso e Balanceamento gerado para a aeronave ${profileName}.\n\nSafe Balance`;

		await sendEmail({
			to: user.email,
			subject,
			text,
			html,
			attachments: [
				{
					filename: `Relatorio_WeB_${profileName.replace(/\s+/g, "_")}.pdf`,
					content: buffer,
				},
			],
		});

		return { success: true };
	});
