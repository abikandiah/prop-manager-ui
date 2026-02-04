import Dexie from 'dexie'
import type { DehydratedMutation } from './offline-types'

const DB_NAME = 'prop-manager-db'

/** Outbox status for mutations: pending (waiting), failed (retry later), synced (done, can be pruned). */
export type MutationOutboxStatus = 'pending' | 'failed' | 'synced'

/**
 * Row in the mutations table (System Outbox).
 * - id: stable id derived from mutation content so we upsert, never wipe.
 * - value: TanStack DehydratedMutation (mutationKey, state with status/isPaused/variables, meta).
 * - status: our outbox status for querying (e.g. index on status to find pending).
 * - timestamp: for TTL/cleanup and ordering.
 */
export interface MutationRow {
	id: string
	value: DehydratedMutation
	status: MutationOutboxStatus
	timestamp: number
}

/**
 * Granular Dexie database for TanStack Query persistence.
 * Mutations table is a System Outbox: merge-only (no clear), with status and timestamp.
 */
export class AppDatabase extends Dexie {
	queries: Dexie.Table<{ queryKey: string; value: unknown }, string>
	mutations: Dexie.Table<MutationRow, string>
	metadata: Dexie.Table<{ key: string; value: unknown }, string>

	constructor() {
		super(DB_NAME)
		this.version(1).stores({
			queries: 'queryKey',
			mutations: 'id',
			metadata: 'key',
		})
		this.version(2)
			.stores({
				queries: 'queryKey',
				// Index status and timestamp for "pending" vs "failed" and TTL cleanup
				mutations: 'id, status, timestamp',
				metadata: 'key',
			})
			.upgrade((tx) => {
				// Backfill status and timestamp for rows created in v1
				return tx
					.table('mutations')
					.toCollection()
					.modify((row: Partial<MutationRow> & Pick<MutationRow, 'id' | 'value'>) => {
						if (row.status === undefined) (row as MutationRow).status = 'pending'
						if (row.timestamp === undefined) (row as MutationRow).timestamp = 0
					})
			})
		this.queries = this.table('queries')
		this.mutations = this.table('mutations')
		this.metadata = this.table('metadata')
	}
}

export const db = new AppDatabase()
