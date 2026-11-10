/**
 * The admin switches (settings.ts) in the `settings` collection: one document per switch, `_id` its id. The Ablage links
 * (storageFolders.ts) are one more document there, `_id` 'storageFolders'.
 */
import { database } from './members'
import { SETTING_DEFAULTS, SETTING_IDS, type SettingId, type Settings } from './settings'
import { storedFolders, type StorageFolders } from './storageFolders'

interface SettingDoc {
  _id: SettingId
  enabled: boolean
  updatedAt: Date
  updatedBy: string
}

async function settings() {
  return (await database()).collection<SettingDoc>('settings')
}

/** A switch nobody has flipped reads as its default. */
export async function settingEnabled(id: SettingId): Promise<boolean> {
  const setting = await (await settings()).findOne({ _id: id })
  return setting?.enabled ?? SETTING_DEFAULTS[id]
}

export async function allSettings(): Promise<Settings> {
  const docs = await (await settings()).find({ _id: { $in: SETTING_IDS } }).toArray()
  const stored = new Map(docs.map((doc) => [doc._id, doc.enabled]))
  return Object.fromEntries(SETTING_IDS.map((id) => [id, stored.get(id) ?? SETTING_DEFAULTS[id]])) as Settings
}

export async function saveSettings(change: Partial<Settings>, actor: string): Promise<void> {
  const collection = await settings()
  const updatedAt = new Date()
  await Promise.all(
    Object.entries(change).map(([id, enabled]) =>
      collection.updateOne(
        { _id: id as SettingId },
        { $set: { enabled, updatedAt, updatedBy: actor } },
        { upsert: true },
      ),
    ),
  )
}

interface StorageDoc {
  _id: 'storageFolders'
  folders: StorageFolders
  updatedAt: Date
  updatedBy: string
}

const storageDocs = async () => (await database()).collection<StorageDoc>('settings')

export async function storageFolders(): Promise<StorageFolders> {
  const doc = await (await storageDocs()).findOne({ _id: 'storageFolders' })
  return storedFolders(doc?.folders)
}

/** Replaces the whole set: the admin form always sends all of it. */
export async function saveStorageFolders(folders: StorageFolders, actor: string): Promise<void> {
  await (await storageDocs()).updateOne(
    { _id: 'storageFolders' },
    { $set: { folders, updatedAt: new Date(), updatedBy: actor } },
    { upsert: true },
  )
}
