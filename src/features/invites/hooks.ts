import { useMutation, useQuery } from '@tanstack/react-query'
import { invitesApi } from './api'

export function useInvitePreview(token: string) {
  return useQuery({
    queryKey: ['invitePreview', token],
    queryFn: () => invitesApi.getPreview(token),
    staleTime: 30_000,
    retry: false,
  })
}

export function useAcceptInvite() {
  return useMutation({
    mutationKey: ['acceptInvite'],
    networkMode: 'online',
    mutationFn: (token: string) => invitesApi.accept(token),
  })
}
