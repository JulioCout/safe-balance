import { sendEmail } from "@repo/mail";
import { z } from "zod";

import { protectedProcedure } from "../../../orpc/procedures";

const SUGGESTION_EMAIL = "contato@juliocoutinho.com";

export const sendSuggestionProcedure = protectedProcedure
	.route({
		method: "POST",
		path: "/suggestions/send",
		tags: ["Suggestions"],
		summary: "Send a suggestion",
		description: "Sends a user suggestion by email",
	})
	.input(
		z.object({
			subject: z.string().min(1).max(200),
			message: z.string().min(1).max(5000),
		}),
	)
	.handler(async ({ input: { subject, message }, context: { user } }) => {
		const html = `
			<div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
				<h2 style="color: #333;">Nova Sugestão Recebida</h2>
				<p><strong>De:</strong> ${user.name ?? "Usuário"} &lt;${user.email}&gt;</p>
				<p><strong>Assunto:</strong> ${subject}</p>
				<hr style="border: 1px solid #eee;" />
				<p><strong>Sugestão:</strong></p>
				<p style="white-space: pre-wrap; background: #f9f9f9; padding: 12px; border-radius: 6px;">${message}</p>
			</div>
		`;

		const text = `Nova Sugestão\n\nDe: ${user.name ?? "Usuário"} <${user.email}>\nAssunto: ${subject}\n\nSugestão:\n${message}`;

		await sendEmail({
			to: SUGGESTION_EMAIL,
			subject: `[Safe Balance] Sugestão: ${subject}`,
			text,
			html,
		});

		return { success: true };
	});
