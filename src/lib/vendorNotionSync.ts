/**
 * Pure mapping and conflict rules for the Zoho Accounts ↔ Notion JOB Vendors sync.
 * Network I/O lives in scripts/sync-vendors-notion.ts.
 *
 * Notion stores one point of contact (POC Name / Phone / Note). Zoho stores every
 * real contact in Description after ---POC_DATA---, and mirrors the first contact
 * in Ticker_Symbol and Fax the same way the vendor edit form does.
 * Extra Zoho contacts are left in place when the first contact still matches.
 */
import {
  buildVendorContactWrite,
  contactFieldText,
  parseStoredVendorPocs,
  planVendorDescriptionCleanup,
  type VendorPoc,
} from './vendorPoc';

export const DEFAULT_NOTION_VENDORS_DATA_SOURCE_ID = '5db5c410-62c2-49cc-bd07-cd4ab5db6032';

/** How close two edits must be before neither side wins. */
export const SYNC_TIE_WINDOW_MS = 2000;

export const VENDOR_RATINGS = ['Preferred', 'Backup', 'Used', 'Do Not Use'] as const;
export type VendorRating = (typeof VENDOR_RATINGS)[number];

const RATING_SET = new Set<string>(VENDOR_RATINGS);

export type VendorPocFields = {
  id: string;
  name: string;
  phone: string;
  note: string;
};

/** Fields both systems can agree on. `status` '' means Notion Uncategorized and an empty Zoho Rating. */
export type CanonicalVendor = {
  name: string;
  status: VendorRating | '';
  trade: string;
  phone: string;
  email: string;
  website: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  notes: string;
  pocs: VendorPocFields[];
};

export type ZohoAccountWrite = {
  Account_Name: string;
  Rating: string | null;
  Industry: string;
  Phone: string;
  Account_Site: string;
  Website: string;
  Billing_Street: string;
  Billing_City: string;
  Billing_State: string;
  Billing_Code: string;
  Billing_Country: string;
  Description: string | null;
  Ticker_Symbol: string;
  Fax: string;
};

export type ZohoAccountLike = {
  id?: unknown;
  Account_Name?: unknown;
  Account_Type?: unknown;
  Rating?: unknown;
  Industry?: unknown;
  Phone?: unknown;
  Account_Site?: unknown;
  Website?: unknown;
  Billing_Street?: unknown;
  Billing_City?: unknown;
  Billing_State?: unknown;
  Billing_Code?: unknown;
  Billing_Country?: unknown;
  Description?: unknown;
  Ticker_Symbol?: unknown;
  Fax?: unknown;
  Modified_Time?: unknown;
};

export type MapFailure = 'unknown-rating' | 'unknown-status' | 'unreadable-poc';

export type CanonicalResult =
  | { ok: true; record: CanonicalVendor }
  | { ok: false; reason: MapFailure };

export type NotionVendorFields = {
  name?: unknown;
  status?: unknown;
  trade?: unknown;
  phone?: unknown;
  email?: unknown;
  website?: unknown;
  street?: unknown;
  city?: unknown;
  state?: unknown;
  zip?: unknown;
  country?: unknown;
  notes?: unknown;
  pocName?: unknown;
  pocPhone?: unknown;
  pocNote?: unknown;
  pocId?: unknown;
};

export type NotionVendorInput = {
  pageId: string;
  zohoId: string;
  name: string;
  lastEditedTime: string | null;
  record: CanonicalVendor | null;
  error: MapFailure | null;
};

export type ZohoVendorInput = {
  id: string;
  name: string;
  modifiedTime: string | null;
  record: CanonicalVendor | null;
  error: MapFailure | null;
};

export type SyncDirection =
  | { action: 'skip'; reason: 'in-sync' | 'within-2-seconds' | 'missing-timestamp' }
  | { action: 'zoho-to-notion'; zohoModifiedTime: string; notionEditedTime: string }
  | { action: 'notion-to-zoho'; zohoModifiedTime: string; notionEditedTime: string };

export type VendorSyncSummary = {
  notionToZoho: { zohoId: string; notionPageId: string; name: string }[];
  zohoToNotion: { zohoId: string; notionPageId: string; name: string }[];
  createsOnNotion: { zohoId: string; name: string }[];
  createsOnZoho: { notionPageId: string; name: string }[];
  skipped: { zohoId: string | null; notionPageId: string | null; name: string; reason: string }[];
  conflictsResolved: {
    zohoId: string;
    notionPageId: string;
    name: string;
    winner: 'zoho' | 'notion';
    zohoModifiedTime: string;
    notionEditedTime: string;
  }[];
};

export type NotionToZohoAction = {
  zohoId: string;
  notionPageId: string;
  name: string;
  zohoFields: ZohoAccountWrite;
  zohoModifiedTime: string;
  notionEditedTime: string;
};

export type ZohoToNotionAction = {
  zohoId: string;
  notionPageId: string;
  name: string;
  notionProperties: Record<string, unknown>;
  zohoModifiedTime: string;
  notionEditedTime: string;
};

export type CreateOnNotionAction = {
  zohoId: string;
  name: string;
  notionProperties: Record<string, unknown>;
  zohoModifiedTime: string | null;
};

export type CreateOnZohoAction = {
  notionPageId: string;
  name: string;
  zohoFields: ZohoAccountWrite & { Account_Type: 'Vendor' };
};

export type VendorSyncPlan = {
  summary: VendorSyncSummary;
  notionToZoho: NotionToZohoAction[];
  zohoToNotion: ZohoToNotionAction[];
  createsOnNotion: CreateOnNotionAction[];
  createsOnZoho: CreateOnZohoAction[];
};

function text(value: unknown): string {
  if (value && typeof value === 'object' && !Array.isArray(value) && 'name' in value) {
    const named = (value as { name?: unknown }).name;
    if (typeof named === 'string') return named.trim();
  }
  return contactFieldText(value).trim();
}

function notesText(value: unknown): string {
  return contactFieldText(value).replace(/\r\n/g, '\n');
}

function isRating(value: string): value is VendorRating {
  return RATING_SET.has(value);
}

export function statusFromRating(rating: unknown): { ok: true; status: VendorRating | '' } | { ok: false; reason: 'unknown-rating' } {
  const value = text(rating);
  if (!value) return { ok: true, status: '' };
  if (isRating(value)) return { ok: true, status: value };
  return { ok: false, reason: 'unknown-rating' };
}

export function statusFromNotion(status: unknown): { ok: true; status: VendorRating | '' } | { ok: false; reason: 'unknown-status' } {
  const value = text(status);
  if (!value || value === 'Uncategorized') return { ok: true, status: '' };
  if (isRating(value)) return { ok: true, status: value };
  return { ok: false, reason: 'unknown-status' };
}

function pocFields(poc: { id?: unknown; name?: unknown; phone?: unknown; note?: unknown }): VendorPocFields | null {
  const name = text(poc.name);
  const phone = text(poc.phone);
  const note = text(poc.note);
  if (!name && !phone && !note) return null;
  return { id: text(poc.id), name, phone, note };
}

function readZohoContacts(
  description: unknown,
  legacy: { name?: unknown; phone?: unknown }
): { ok: true; notes: string; pocs: VendorPocFields[] } | { ok: false; reason: 'unreadable-poc' } {
  if (description != null && typeof description !== 'string') {
    return { ok: false, reason: 'unreadable-poc' };
  }
  const descriptionText = typeof description === 'string' ? description : null;
  if (descriptionText != null && planVendorDescriptionCleanup(descriptionText).action === 'skip') {
    return { ok: false, reason: 'unreadable-poc' };
  }

  const parsed = parseStoredVendorPocs(descriptionText);
  const stored = parsed.pocs
    .map((poc) => pocFields(poc))
    .filter((poc): poc is VendorPocFields => poc != null);
  if (stored.length > 0) return { ok: true, notes: notesText(parsed.notes), pocs: stored };

  // Same fallback as the vendor edit form when Description has no real contact.
  const legacyPoc = pocFields({ name: legacy.name, phone: legacy.phone, note: '' });
  return { ok: true, notes: notesText(parsed.notes), pocs: legacyPoc ? [legacyPoc] : [] };
}

export function canonicalFromZohoAccount(account: ZohoAccountLike): CanonicalResult {
  const rating = statusFromRating(account.Rating);
  if (!rating.ok) return rating;

  const contacts = readZohoContacts(account.Description, {
    name: account.Ticker_Symbol,
    phone: account.Fax,
  });
  if (!contacts.ok) return { ok: false, reason: 'unreadable-poc' };
  const parsed = contacts;

  return {
    ok: true,
    record: {
      name: text(account.Account_Name),
      status: rating.status,
      trade: text(account.Industry),
      phone: text(account.Phone),
      email: text(account.Account_Site),
      website: text(account.Website),
      street: text(account.Billing_Street),
      city: text(account.Billing_City),
      state: text(account.Billing_State),
      zip: text(account.Billing_Code),
      country: text(account.Billing_Country),
      notes: parsed.notes,
      pocs: parsed.pocs,
    },
  };
}

export function canonicalFromNotionFields(fields: NotionVendorFields): CanonicalResult {
  const status = statusFromNotion(fields.status);
  if (!status.ok) return status;
  const poc = pocFields({
    id: fields.pocId,
    name: fields.pocName,
    phone: fields.pocPhone,
    note: fields.pocNote,
  });
  return {
    ok: true,
    record: {
      name: text(fields.name),
      status: status.status,
      trade: text(fields.trade),
      phone: text(fields.phone),
      email: text(fields.email),
      website: text(fields.website),
      street: text(fields.street),
      city: text(fields.city),
      state: text(fields.state),
      zip: text(fields.zip),
      country: text(fields.country),
      notes: notesText(fields.notes),
      pocs: poc ? [poc] : [],
    },
  };
}

function richTextContent(value: unknown): string {
  if (!value || typeof value !== 'object') return '';
  const property = value as { rich_text?: unknown; title?: unknown };
  const parts = property.rich_text ?? property.title;
  if (!Array.isArray(parts)) return '';
  return parts
    .map((part) => {
      if (!part || typeof part !== 'object') return '';
      const block = part as { plain_text?: unknown; text?: { content?: unknown } };
      if (typeof block.plain_text === 'string') return block.plain_text;
      if (typeof block.text?.content === 'string') return block.text.content;
      return '';
    })
    .join('');
}

function propertyText(properties: Record<string, unknown>, name: string): string {
  return richTextContent(properties[name]);
}

export function canonicalFromNotionPage(page: {
  id?: unknown;
  last_edited_time?: unknown;
  properties?: unknown;
}): NotionVendorInput {
  const properties =
    page.properties && typeof page.properties === 'object'
      ? (page.properties as Record<string, unknown>)
      : {};
  const statusProperty = properties.Status as { select?: { name?: unknown } | null } | undefined;
  const emailProperty = properties.Email as { email?: unknown } | undefined;
  const phoneProperty = properties.Phone as { phone_number?: unknown } | undefined;
  const pocPhoneProperty = properties['POC Phone'] as { phone_number?: unknown } | undefined;
  const websiteProperty = properties.Website as { url?: unknown } | undefined;
  const mapped = canonicalFromNotionFields({
    name: propertyText(properties, 'Name'),
    status: statusProperty?.select?.name ?? '',
    trade: propertyText(properties, 'Trade'),
    phone: phoneProperty?.phone_number ?? '',
    email: emailProperty?.email ?? '',
    website: websiteProperty?.url ?? '',
    street: propertyText(properties, 'Street'),
    city: propertyText(properties, 'City'),
    state: propertyText(properties, 'State'),
    zip: propertyText(properties, 'Zip'),
    country: propertyText(properties, 'Country'),
    notes: propertyText(properties, 'Notes'),
    pocName: propertyText(properties, 'POC Name'),
    pocPhone: pocPhoneProperty?.phone_number ?? propertyText(properties, 'POC Phone'),
    pocNote: propertyText(properties, 'POC Note'),
  });

  const record = mapped.ok ? mapped.record : null;
  return {
    pageId: text(page.id),
    zohoId: text(propertyText(properties, 'Zoho ID')),
    name: record?.name || text(propertyText(properties, 'Name')),
    lastEditedTime: typeof page.last_edited_time === 'string' ? page.last_edited_time : null,
    record,
    error: mapped.ok ? null : mapped.reason,
  };
}

export function zohoVendorInputFromAccount(account: ZohoAccountLike): ZohoVendorInput {
  const mapped = canonicalFromZohoAccount(account);
  const modified = account.Modified_Time;
  return {
    id: text(account.id),
    name: mapped.ok ? mapped.record.name : text(account.Account_Name),
    modifiedTime: typeof modified === 'string' && modified.trim() ? modified : null,
    record: mapped.ok ? mapped.record : null,
    error: mapped.ok ? null : mapped.reason,
  };
}

/** Comparison view. Point-of-contact ids and Zoho contacts after the first one are ignored. */
export function vendorSnapshot(record: CanonicalVendor) {
  const poc = record.pocs[0] ?? null;
  return {
    name: record.name,
    status: record.status,
    trade: record.trade,
    phone: record.phone,
    email: record.email,
    website: record.website,
    street: record.street,
    city: record.city,
    state: record.state,
    zip: record.zip,
    country: record.country,
    notes: record.notes,
    poc: poc ? { name: poc.name, phone: poc.phone, note: poc.note } : null,
  };
}

export function vendorRecordsMatch(left: CanonicalVendor, right: CanonicalVendor): boolean {
  return JSON.stringify(vendorSnapshot(left)) === JSON.stringify(vendorSnapshot(right));
}

function samePoc(left: VendorPocFields | undefined, right: VendorPocFields | undefined): boolean {
  if (!left && !right) return true;
  if (!left || !right) return false;
  return left.name === right.name && left.phone === right.phone && left.note === right.note;
}

/**
 * Serialize Notion's contact into the Description array.
 * When that contact is unchanged, keep Zoho's existing list so contacts Notion
 * cannot show are not dropped just because notes or another field changed.
 */
export function pocsForZohoWrite(
  source: CanonicalVendor,
  existing: CanonicalVendor | null,
  createId: () => string
): VendorPoc[] {
  const sourcePocs = source.pocs;
  const existingPocs = existing?.pocs ?? [];
  const keepExisting = existing != null && samePoc(sourcePocs[0], existingPocs[0]);
  const chosen = keepExisting ? existingPocs : sourcePocs;
  return chosen.map((poc) => ({
    id: poc.id || createId(),
    name: poc.name,
    phone: poc.phone,
    note: poc.note,
  }));
}

export function zohoAccountFromCanonical(
  record: CanonicalVendor,
  options?: { existing?: CanonicalVendor | null; createId?: () => string }
): ZohoAccountWrite {
  const createId = options?.createId ?? (() => Math.random().toString());
  const contact = buildVendorContactWrite(
    record.notes,
    pocsForZohoWrite(record, options?.existing ?? null, createId)
  );
  return {
    Account_Name: record.name,
    Rating: record.status ? record.status : null,
    Industry: record.trade,
    Phone: record.phone,
    Account_Site: record.email,
    Website: record.website,
    Billing_Street: record.street,
    Billing_City: record.city,
    Billing_State: record.state,
    Billing_Code: record.zip,
    Billing_Country: record.country,
    Description: contact.Description,
    Ticker_Symbol: contact.Ticker_Symbol,
    Fax: contact.Fax,
  };
}

function richText(content: string): { type: 'text'; text: { content: string } }[] {
  if (!content) return [];
  const chunks: { type: 'text'; text: { content: string } }[] = [];
  for (let index = 0; index < content.length; index += 2000) {
    chunks.push({ type: 'text', text: { content: content.slice(index, index + 2000) } });
  }
  return chunks;
}

export function notionDateProperty(value: string | null | undefined): { date: { start: string } | null } {
  if (typeof value !== 'string' || !value.trim()) return { date: null };
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) return { date: null };
  return { date: { start: new Date(ms).toISOString() } };
}

export function notionPropertiesFromCanonical(
  record: CanonicalVendor,
  options?: { zohoId?: string | null }
): Record<string, unknown> {
  const poc = record.pocs[0] ?? null;
  const properties: Record<string, unknown> = {
    Name: { title: richText(record.name) },
    Status: { select: { name: record.status || 'Uncategorized' } },
    Trade: { rich_text: richText(record.trade) },
    Phone: { phone_number: record.phone || null },
    Email: { email: record.email || null },
    Website: { url: record.website || null },
    Street: { rich_text: richText(record.street) },
    City: { rich_text: richText(record.city) },
    State: { rich_text: richText(record.state) },
    Zip: { rich_text: richText(record.zip) },
    Country: { rich_text: richText(record.country) },
    Notes: { rich_text: richText(record.notes) },
    'POC Name': { rich_text: richText(poc?.name ?? '') },
    'POC Phone': { phone_number: poc?.phone || null },
    'POC Note': { rich_text: richText(poc?.note ?? '') },
  };
  if (options?.zohoId) properties['Zoho ID'] = { rich_text: richText(options.zohoId) };
  return properties;
}

export function withNotionSyncMetadata(
  properties: Record<string, unknown>,
  metadata: { lastSynced?: string | null; zohoModified?: string | null; zohoId?: string | null }
): Record<string, unknown> {
  const next = { ...properties };
  if (metadata.zohoId) next['Zoho ID'] = { rich_text: richText(metadata.zohoId) };
  if (metadata.lastSynced && notionDateProperty(metadata.lastSynced).date) {
    next['Last Synced'] = notionDateProperty(metadata.lastSynced);
  }
  if (metadata.zohoModified && notionDateProperty(metadata.zohoModified).date) {
    next['Zoho Modified'] = notionDateProperty(metadata.zohoModified);
  }
  return next;
}

function parseTime(value: string | null | undefined): number | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? null : ms;
}

export function pickSyncDirection(input: {
  recordsMatch: boolean;
  zohoModifiedTime: string | null | undefined;
  notionEditedTime: string | null | undefined;
}): SyncDirection {
  // Identical field snapshots are not a conflict. Writing them back would move
  // both timestamps and the next run would chase the other side.
  if (input.recordsMatch) return { action: 'skip', reason: 'in-sync' };

  const zohoMs = parseTime(input.zohoModifiedTime);
  const notionMs = parseTime(input.notionEditedTime);
  if (zohoMs == null || notionMs == null) return { action: 'skip', reason: 'missing-timestamp' };
  if (Math.abs(zohoMs - notionMs) <= SYNC_TIE_WINDOW_MS) {
    return { action: 'skip', reason: 'within-2-seconds' };
  }
  if (zohoMs > notionMs) {
    return {
      action: 'zoho-to-notion',
      zohoModifiedTime: input.zohoModifiedTime as string,
      notionEditedTime: input.notionEditedTime as string,
    };
  }
  return {
    action: 'notion-to-zoho',
    zohoModifiedTime: input.zohoModifiedTime as string,
    notionEditedTime: input.notionEditedTime as string,
  };
}

function byName<T extends { name: string; zohoId?: string | null; notionPageId?: string | null }>(items: T[]): T[] {
  return [...items].sort(
    (left, right) =>
      left.name.localeCompare(right.name) ||
      String(left.zohoId ?? '').localeCompare(String(right.zohoId ?? '')) ||
      String(left.notionPageId ?? '').localeCompare(String(right.notionPageId ?? ''))
  );
}

function skip(
  skips: VendorSyncSummary['skipped'],
  item: VendorSyncSummary['skipped'][number]
) {
  skips.push(item);
}

export function planVendorSync(
  notionPages: NotionVendorInput[],
  zohoAccounts: ZohoVendorInput[],
  options?: { createId?: () => string }
): VendorSyncPlan {
  const createId = options?.createId ?? (() => Math.random().toString());
  const notionToZoho: NotionToZohoAction[] = [];
  const zohoToNotion: ZohoToNotionAction[] = [];
  const createsOnNotion: CreateOnNotionAction[] = [];
  const createsOnZoho: CreateOnZohoAction[] = [];
  const skipped: VendorSyncSummary['skipped'] = [];
  const conflictsResolved: VendorSyncSummary['conflictsResolved'] = [];

  const notionByZohoId = new Map<string, NotionVendorInput[]>();
  for (const page of notionPages) {
    if (!page.zohoId) continue;
    const group = notionByZohoId.get(page.zohoId) ?? [];
    group.push(page);
    notionByZohoId.set(page.zohoId, group);
  }
  const duplicateIds = new Set(
    Array.from(notionByZohoId.entries())
      .filter(([, pages]) => pages.length > 1)
      .map(([id]) => id)
  );

  const zohoById = new Map<string, ZohoVendorInput>();
  for (const account of zohoAccounts) {
    if (!account.id || zohoById.has(account.id)) continue;
    zohoById.set(account.id, account);
  }

  for (const page of notionPages) {
    if (!page.zohoId) {
      if (page.error || !page.record) {
        skip(skipped, {
          zohoId: null,
          notionPageId: page.pageId,
          name: page.name,
          reason: page.error || 'unreadable-notion',
        });
        continue;
      }
      if (!page.record.name) {
        skip(skipped, { zohoId: null, notionPageId: page.pageId, name: page.name, reason: 'missing-name' });
        continue;
      }
      createsOnZoho.push({
        notionPageId: page.pageId,
        name: page.record.name,
        zohoFields: { ...zohoAccountFromCanonical(page.record, { createId }), Account_Type: 'Vendor' },
      });
      continue;
    }

    if (duplicateIds.has(page.zohoId)) {
      skip(skipped, {
        zohoId: page.zohoId,
        notionPageId: page.pageId,
        name: page.name,
        reason: 'duplicate-notion-zoho-id',
      });
      continue;
    }

    const account = zohoById.get(page.zohoId);
    if (!account) {
      skip(skipped, {
        zohoId: page.zohoId,
        notionPageId: page.pageId,
        name: page.name,
        reason: 'missing-on-zoho',
      });
      continue;
    }

    if (page.error || account.error || !page.record || !account.record) {
      skip(skipped, {
        zohoId: account.id,
        notionPageId: page.pageId,
        name: page.name || account.name,
        reason: [account.error && `zoho-${account.error}`, page.error && `notion-${page.error}`]
          .filter(Boolean)
          .join('+') || 'unreadable',
      });
      continue;
    }

    const direction = pickSyncDirection({
      recordsMatch: vendorRecordsMatch(page.record, account.record),
      zohoModifiedTime: account.modifiedTime,
      notionEditedTime: page.lastEditedTime,
    });
    if (direction.action === 'skip') {
      skip(skipped, {
        zohoId: account.id,
        notionPageId: page.pageId,
        name: page.name || account.name,
        reason: direction.reason,
      });
      continue;
    }

    const winnerName = direction.action === 'zoho-to-notion' ? account.record.name : page.record.name;
    if (!winnerName) {
      skip(skipped, {
        zohoId: account.id,
        notionPageId: page.pageId,
        name: page.name || account.name,
        reason: 'missing-name',
      });
      continue;
    }

    conflictsResolved.push({
      zohoId: account.id,
      notionPageId: page.pageId,
      name: winnerName,
      winner: direction.action === 'zoho-to-notion' ? 'zoho' : 'notion',
      zohoModifiedTime: direction.zohoModifiedTime,
      notionEditedTime: direction.notionEditedTime,
    });

    if (direction.action === 'zoho-to-notion') {
      zohoToNotion.push({
        zohoId: account.id,
        notionPageId: page.pageId,
        name: account.record.name,
        notionProperties: notionPropertiesFromCanonical(account.record),
        zohoModifiedTime: direction.zohoModifiedTime,
        notionEditedTime: direction.notionEditedTime,
      });
    } else {
      notionToZoho.push({
        zohoId: account.id,
        notionPageId: page.pageId,
        name: page.record.name,
        zohoFields: zohoAccountFromCanonical(page.record, { existing: account.record, createId }),
        zohoModifiedTime: direction.zohoModifiedTime,
        notionEditedTime: direction.notionEditedTime,
      });
    }
  }

  const seenZohoIds = new Set<string>();
  for (const account of zohoAccounts) {
    if (!account.id) {
      skip(skipped, { zohoId: null, notionPageId: null, name: account.name, reason: 'missing-zoho-id' });
      continue;
    }
    if (seenZohoIds.has(account.id)) {
      skip(skipped, { zohoId: account.id, notionPageId: null, name: account.name, reason: 'duplicate-zoho-id' });
      continue;
    }
    seenZohoIds.add(account.id);

    if (duplicateIds.has(account.id) || notionByZohoId.has(account.id)) {
      if (duplicateIds.has(account.id)) {
        skip(skipped, {
          zohoId: account.id,
          notionPageId: null,
          name: account.name,
          reason: 'duplicate-notion-zoho-id',
        });
      }
      continue;
    }
    if (account.error || !account.record) {
      skip(skipped, {
        zohoId: account.id,
        notionPageId: null,
        name: account.name,
        reason: account.error ? `zoho-${account.error}` : 'unreadable',
      });
      continue;
    }
    if (!account.record.name) {
      skip(skipped, { zohoId: account.id, notionPageId: null, name: account.name, reason: 'missing-name' });
      continue;
    }
    createsOnNotion.push({
      zohoId: account.id,
      name: account.record.name,
      notionProperties: notionPropertiesFromCanonical(account.record, { zohoId: account.id }),
      zohoModifiedTime: account.modifiedTime,
    });
  }

  const summary: VendorSyncSummary = {
    notionToZoho: byName(notionToZoho.map(({ zohoId, notionPageId, name }) => ({ zohoId, notionPageId, name }))),
    zohoToNotion: byName(zohoToNotion.map(({ zohoId, notionPageId, name }) => ({ zohoId, notionPageId, name }))),
    createsOnNotion: byName(createsOnNotion.map(({ zohoId, name }) => ({ zohoId, name }))),
    createsOnZoho: byName(createsOnZoho.map(({ notionPageId, name }) => ({ notionPageId, name }))),
    skipped: byName(skipped),
    conflictsResolved: byName(conflictsResolved),
  };

  return { summary, notionToZoho, zohoToNotion, createsOnNotion, createsOnZoho };
}
