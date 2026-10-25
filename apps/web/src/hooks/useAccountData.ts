'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CustomerPreferences,
  CustomerPreferencesInput,
  CompanionPassenger,
  CompanionPassengerInput,
} from '@atm/shared';

const PREFERENCES_STORAGE_KEY = 'atm_user_preferences';
const SAVED_TRIPS_STORAGE_KEY = 'atm_saved_trip_ids';

const defaultPreferences: CustomerPreferences = {
  smsAlerts: true,
  whatsappAlerts: true,
  emailReceipts: true,
  preferredSeatPosition: 'any',
  autoFillEmergencyContact: true,
  localDataConsent: true,
};

export function useCustomerPreferences(customerId: string = 'cust-dev-01') {
  const queryClient = useQueryClient();
  const queryKey = ['account', 'preferences', customerId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<CustomerPreferences> => {
      try {
        const res = await fetch(`/api/account/preferences?customerId=${encodeURIComponent(customerId)}`);
        if (!res.ok) throw new Error('Failed to load preferences');
        const data = await res.json();
        const prefs = data.preferences || defaultPreferences;
        if (typeof window !== 'undefined') {
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(prefs));
        }
        return prefs;
      } catch (err) {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
          if (stored) {
            try {
              return JSON.parse(stored);
            } catch {}
          }
        }
        return defaultPreferences;
      }
    },
    initialData: () => {
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem(PREFERENCES_STORAGE_KEY);
        if (stored) {
          try {
            return JSON.parse(stored);
          } catch {}
        }
      }
      return defaultPreferences;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newPreferences: Partial<CustomerPreferencesInput>) => {
      const res = await fetch('/api/account/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          preferences: newPreferences,
        }),
      });
      if (!res.ok) throw new Error('Failed to update preferences');
      const data = await res.json();
      return data.preferences as CustomerPreferences;
    },
    onMutate: async (newPreferences) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CustomerPreferences>(queryKey) || defaultPreferences;
      const optimistic = { ...previous, ...newPreferences };
      queryClient.setQueryData(queryKey, optimistic);

      if (typeof window !== 'undefined') {
        localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(optimistic));
      }

      return { previous };
    },
    onError: (err, newPreferences, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
        if (typeof window !== 'undefined') {
          localStorage.setItem(PREFERENCES_STORAGE_KEY, JSON.stringify(context.previous));
        }
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    preferences: query.data || defaultPreferences,
    isLoading: query.isLoading,
    isUpdating: mutation.isPending,
    updatePreferences: mutation.mutate,
  };
}

export function useCompanionPassengers(customerId: string = 'cust-dev-01') {
  const queryClient = useQueryClient();
  const queryKey = ['account', 'companions', customerId];

  const query = useQuery({
    queryKey,
    queryFn: async (): Promise<CompanionPassenger[]> => {
      const res = await fetch(`/api/account/companions?customerId=${encodeURIComponent(customerId)}`);
      if (!res.ok) throw new Error('Failed to load companions');
      const data = await res.json();
      return data.companions || [];
    },
  });

  const addMutation = useMutation({
    mutationFn: async (input: CompanionPassengerInput) => {
      const res = await fetch('/api/account/companions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId,
          ...input,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add companion');
      }
      const data = await res.json();
      return data.companion as CompanionPassenger;
    },
    onMutate: async (input) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CompanionPassenger[]>(queryKey) || [];

      const optimisticCompanion: CompanionPassenger = {
        id: `temp-${Date.now()}`,
        customerId,
        fullName: input.fullName,
        gender: input.gender,
        phone: input.phone,
        isDefaultNextOfKin: !!input.isDefaultNextOfKin,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData(queryKey, [...previous, optimisticCompanion]);
      return { previous };
    },
    onError: (err, input, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (companionId: string) => {
      const res = await fetch(
        `/api/account/companions/${encodeURIComponent(companionId)}?customerId=${encodeURIComponent(customerId)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) throw new Error('Failed to delete companion');
      return companionId;
    },
    onMutate: async (companionId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<CompanionPassenger[]>(queryKey) || [];
      const filtered = previous.filter((c) => c.id !== companionId);
      queryClient.setQueryData(queryKey, filtered);
      return { previous };
    },
    onError: (err, companionId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    companions: query.data || [],
    isLoading: query.isLoading,
    isAdding: addMutation.isPending,
    isDeleting: deleteMutation.isPending,
    addCompanion: addMutation.mutateAsync,
    deleteCompanion: deleteMutation.mutateAsync,
  };
}

export function useSavedTrips() {
  const queryClient = useQueryClient();
  const queryKey = ['account', 'saved-trips'];

  const query = useQuery({
    queryKey,
    queryFn: (): string[] => {
      if (typeof window === 'undefined') return [];
      const stored = localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
      if (!stored) return [];
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    },
    initialData: () => {
      if (typeof window === 'undefined') return [];
      const stored = localStorage.getItem(SAVED_TRIPS_STORAGE_KEY);
      if (!stored) return [];
      try {
        return JSON.parse(stored);
      } catch {
        return [];
      }
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async (tripId: string) => {
      const current = query.data || [];
      const exists = current.includes(tripId);
      const next = exists ? current.filter((id: string) => id !== tripId) : [...current, tripId];
      if (typeof window !== 'undefined') {
        localStorage.setItem(SAVED_TRIPS_STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    },
    onMutate: async (tripId: string) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<string[]>(queryKey) || [];
      const exists = previous.includes(tripId);
      const optimistic = exists ? previous.filter((id: string) => id !== tripId) : [...previous, tripId];
      queryClient.setQueryData(queryKey, optimistic);
      return { previous };
    },
    onError: (err, tripId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    savedTripIds: query.data || [],
    toggleSavedTrip: toggleMutation.mutate,
    isSaved: (tripId: string) => (query.data || []).includes(tripId),
  };
}
