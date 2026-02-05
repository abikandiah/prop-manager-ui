import Dexie from 'dexie'
import type { DehydratedState } from '@tanstack/react-query'
import type { PersistedClient } from '@tanstack/react-query-persist-client'
import { config } from '@/config'
import { stableMutationId } from '@/lib/offline-types'

export type DehydratedMutation = DehydratedState['mutations'][number]
export type MutationOutboxStatus = 'pending' | 'failed' | 'synced'

const CACHE_KEY = 'react-query-cache'

export interface MutationRow {
	id: string
	value: DehydratedMutation
	status: MutationOutboxStatus
	timestamp: number
	retryCount: number
}

export class AppDatabase extends Dexie {
	queries!: Dexie.Table<{ id: string; value: any; updatedAt: number }, string>
	mutations!: Dexie.Table<MutationRow, string>

	constructor() {
		super('prop-manager-db')
		this.version(1).stores({
			queries: 'id, updatedAt',
			mutations: 'id, status, timestamp, [status+timestamp]',
		})
	}

	async saveCacheBlob(client: PersistedClient) {
		return this.queries.put({
			id: CACHE_KEY,
			value: client,
			updatedAt: Date.now(),
		})
	}

	async loadCacheBlob() {
		const record = await this.queries.get(CACHE_KEY)
		return record?.value
	}

	async deleteCacheBlob() {
		await this.queries.delete(CACHE_KEY)
	}

	async addMutation(mutationKey: any, variables: any) {
		const mutation = {
			mutationKey,
			state: {
				variables,
				submittedAt: Date.now(),
			},
		} as DehydratedMutation

		return this.mutations.put({
			id: stableMutationId(mutation),
			value: mutation,
			status: 'pending',
			timestamp: Date.now(),
			retryCount: 0,
		})
	}

	async getNextPending() {
		return this.mutations
			.where('[status+timestamp]')
			.between(['pending', Dexie.minKey], ['pending', Dexie.maxKey])
			.first()
	}

	async autoPrune() {
		const count = await this.mutations.where('status').equals('synced').count()
		if (count > 1000) {
			await this.pruneSyncedMutations(config.mutationOutboxMaxAgeDays)
		}
	}

	async pruneSyncedMutations(daysToKeep: number) {
		const threshold = Date.now() - daysToKeep * 24 * 60 * 60 * 1000
		console.log('Pruning synced mutations older than', threshold)

		return this.mutations
			.where('[status+timestamp]')
			.between(['synced', Dexie.minKey], ['synced', threshold])
			.delete()
	}
}

export const db = new AppDatabase()
