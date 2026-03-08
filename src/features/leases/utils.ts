import { LeaseStatus } from '@/domain/lease'

/** Maps a LeaseStatus to its Badge variant. */
export function leaseStatusVariant(status: LeaseStatus) {
	switch (status) {
		case LeaseStatus.ACTIVE:
		case LeaseStatus.SIGNED:
			return 'success'
		case LeaseStatus.REVIEW:
			return 'warning'
		case LeaseStatus.TERMINATED:
		case LeaseStatus.EVICTED:
			return 'destructive'
		case LeaseStatus.DRAFT:
		case LeaseStatus.EXPIRED:
		default:
			return 'secondary'
	}
}
