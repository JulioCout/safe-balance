"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Textarea,
} from "@repo/ui";
import { toastError, toastSuccess } from "@repo/ui/components/toast";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2Icon, SendIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";

interface SuggestionDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function SuggestionDialog({ open, onOpenChange }: SuggestionDialogProps) {
	const t = useTranslations();
	const [subject, setSubject] = useState("");
	const [message, setMessage] = useState("");
	const [sent, setSent] = useState(false);

	const mutation = useMutation({
		mutationFn: async (data: { subject: string; message: string }) => {
			return orpcClient.suggestions.send(data);
		},
		onSuccess: () => {
			setSent(true);
		},
		onError: () => {
			toastError(t("suggestions.notifications.error"));
		},
	});

	function handleClose(value: boolean) {
		if (!value) {
			// reset on close
			setTimeout(() => {
				setSubject("");
				setMessage("");
				setSent(false);
			}, 300);
		}
		onOpenChange(value);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		if (!subject.trim() || !message.trim()) return;
		await mutation.mutateAsync({ subject: subject.trim(), message: message.trim() });
	}

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>{t("suggestions.title")}</DialogTitle>
					<DialogDescription>{t("suggestions.description")}</DialogDescription>
				</DialogHeader>

				{sent ? (
					/* ── Success state ── */
					<div className="gap-4 py-6 flex flex-col items-center text-center">
						<div className="flex size-16 items-center justify-center rounded-full bg-emerald-500/10">
							<CheckCircle2Icon className="size-8 text-emerald-500" />
						</div>
						<div>
							<p className="font-semibold text-base">{t("suggestions.successTitle")}</p>
							<p className="mt-1 text-muted-foreground text-sm">
								{t("suggestions.successMessage")}
							</p>
						</div>
						<Button onClick={() => handleClose(false)} className="mt-2">
							{t("suggestions.close")}
						</Button>
					</div>
				) : (
					/* ── Form ── */
					<form onSubmit={handleSubmit} className="gap-4 flex flex-col">
						<div className="gap-1.5 flex flex-col">
							<Label htmlFor="suggestion-subject">{t("suggestions.subject")}</Label>
							<Input
								id="suggestion-subject"
								value={subject}
								onChange={(e) => setSubject(e.target.value)}
								placeholder={t("suggestions.subjectPlaceholder")}
								maxLength={200}
								required
							/>
						</div>

						<div className="gap-1.5 flex flex-col">
							<Label htmlFor="suggestion-message">{t("suggestions.message")}</Label>
							<Textarea
								id="suggestion-message"
								value={message}
								onChange={(e) => setMessage(e.target.value)}
								placeholder={t("suggestions.messagePlaceholder")}
								rows={5}
								maxLength={5000}
								required
								className="resize-none"
							/>
						</div>

						<div className="gap-2 flex justify-end">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleClose(false)}
								className="text-foreground"
							>
								{t("common.confirmation.cancel")}
							</Button>
							<Button
								type="submit"
								disabled={mutation.isPending || !subject.trim() || !message.trim()}
								className="gap-2"
							>
								<SendIcon className="size-4" />
								{mutation.isPending ? t("suggestions.sending") : t("suggestions.send")}
							</Button>
						</div>
					</form>
				)}
			</DialogContent>
		</Dialog>
	);
}
