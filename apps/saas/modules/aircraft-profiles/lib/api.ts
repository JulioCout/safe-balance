"use client";

import { orpcClient } from "@shared/lib/orpc-client";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

// ── Query keys ──────────────────────────────────────────────────────
export const aircraftProfilesQueryKey = ["aircraft-profiles"] as const;

// ── List profiles ───────────────────────────────────────────────────
export const useAircraftProfilesQuery = (search?: string) => {
	return useQuery({
		queryKey: [...aircraftProfilesQueryKey, search ?? ""],
		queryFn: async () => {
			return orpcClient.aircraftProfiles.list({ search });
		},
	});
};

// ── Create profile ──────────────────────────────────────────────────
export const useCreateAircraftProfileMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["create-aircraft-profile"],
		mutationFn: async (input: {
			name: string;
			model: string;
			data: Record<string, unknown>;
		}) => {
			return orpcClient.aircraftProfiles.create(input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: aircraftProfilesQueryKey,
			});
		},
	});
};

// ── Update profile ──────────────────────────────────────────────────
export const useUpdateAircraftProfileMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["update-aircraft-profile"],
		mutationFn: async (input: {
			id: string;
			name: string;
			model: string;
			data: Record<string, unknown>;
		}) => {
			return orpcClient.aircraftProfiles.update(input);
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: aircraftProfilesQueryKey,
			});
		},
	});
};

// ── Delete profile ──────────────────────────────────────────────────
export const useDeleteAircraftProfileMutation = () => {
	const queryClient = useQueryClient();

	return useMutation({
		mutationKey: ["delete-aircraft-profile"],
		mutationFn: async (id: string) => {
			return orpcClient.aircraftProfiles.delete({ id });
		},
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: aircraftProfilesQueryKey,
			});
		},
	});
};
