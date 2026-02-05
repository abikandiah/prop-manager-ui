import { v7 as uuidv7 } from 'uuid'

export function nowIso(): string {
	return new Date().toISOString()
}

export function generateOptimisticId(): string {
	return uuidv7()
}
