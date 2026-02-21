export enum InviteStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  EXPIRED = 'EXPIRED',
  REVOKED = 'REVOKED',
}

export interface InvitePreview {
  maskedEmail: string
  status: InviteStatus
  isValid: boolean
  isExpired: boolean
  expiresAt: string
  invitedByName: string
  property: {
    legalName: string
    addressLine1: string
    addressLine2?: string
    city: string
    stateProvinceRegion: string
    postalCode: string
  }
  unit: {
    unitNumber: string
    unitType?: string
  }
  lease: {
    startDate: string
    endDate: string
    rentAmount: number
  }
}

export interface InviteAcceptResponse {
  id: string
  targetId: string
  status: InviteStatus
}
