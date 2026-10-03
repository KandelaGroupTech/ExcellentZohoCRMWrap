/**
 * Vendor points of contact are stored in the Zoho Account Description field,
 * after a `---POC_DATA---` marker line, as a JSON array. The edit form always
 * shows a placeholder row, but a contact is only real when it has a name, phone,
 * or note.
 */

export const POC_DATA_MARKER = '---POC_DATA---';

export type VendorPoc = {
  id: string;
  name: string;
  phone: string;
  note: string;
};

export type VendorDescriptionCleanup =
  | { action: 'unchanged'; reason: 'no-marker' | 'no-blank-entries' }
  | { action: 'skip'; reason: 'invalid-json' | 'not-array' | 'unexpected-entry' | 'unsupported-description' }
  | {
      action: 'update';
      /** Value to send to Zoho. `null` clears the field when no notes remain. */
      description: string | null;
      removedBlankCount: number;
      keptCount: number;
      markerRemoved: boolean;
      notesCharacterCount: number;
    };

type MarkerSplit = {
  notes: string;
  payloads: string[];
};

function markerExpression(): RegExp {
  return new RegExp(`(?:^|\\r?\\n)${POC_DATA_MARKER}(?:\\r?\\n|$)`, 'g');
}

export function contactFieldText(value: unknown): string {
  if (typeof value === 'string') return value;
  if (value == null) return '';
  return String(value);
}

function isPocRecord(poc: unknown): poc is Record<string, unknown> {
  return !!poc && typeof poc === 'object' && !Array.isArray(poc);
}

/** A contact with no name, phone, or note (whitespace does not count). */
export function isBlankVendorPoc(poc: unknown): boolean {
  if (!isPocRecord(poc)) return false;
  return ['name', 'phone', 'note'].every((key) => contactFieldText(poc[key]).trim() === '');
}

export function isMeaningfulVendorPoc(poc: unknown): poc is VendorPoc {
  return isPocRecord(poc) && !isBlankVendorPoc(poc);
}

export function splitVendorDescription(description: string | null | undefined): MarkerSplit | null {
  const text = description ?? '';
  const expression = markerExpression();
  const matches: RegExpExecArray[] = [];
  let match: RegExpExecArray | null;
  while ((match = expression.exec(text)) !== null) {
    matches.push(match);
    if (match[0].length === 0) break;
  }
  if (matches.length === 0) return null;

  const notes = text.slice(0, matches[0].index ?? 0);
  const payloads = matches.map((match, index) => {
    const start = (match.index ?? 0) + match[0].length;
    const end = index + 1 < matches.length ? (matches[index + 1].index ?? text.length) : text.length;
    return text.slice(start, end);
  });
  return { notes, payloads };
}

/** Notes shown in the vendor list: everything before the first POC marker. */
export function vendorNotesText(description: string | null | undefined): string {
  if (typeof description !== 'string') return '';
  const split = splitVendorDescription(description);
  return split ? split.notes : description;
}

type ParsedPayload =
  | { ok: true; entries: Record<string, unknown>[] }
  | { ok: false; reason: 'invalid-json' | 'not-array' | 'unexpected-entry' };

function parsePayload(payload: string): ParsedPayload {
  const trimmed = payload.trim();
  if (!trimmed) return { ok: true, entries: [] };
  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return { ok: false, reason: 'invalid-json' };
  }
  if (!Array.isArray(parsed)) return { ok: false, reason: 'not-array' };
  if (parsed.some((entry) => !isPocRecord(entry))) {
    return { ok: false, reason: 'unexpected-entry' };
  }
  return { ok: true, entries: parsed };
}

/**
 * Read the description the way the edit form does.
 * Real contacts from every well-formed marker block are returned unchanged.
 * Blank rows are omitted. Unparseable blocks leave the original text intact
 * and return no contacts, matching the previous "could not parse" path.
 */
export function parseStoredVendorPocs(description: string | null | undefined): {
  notes: string;
  pocs: VendorPoc[];
} {
  if (typeof description !== 'string') return { notes: '', pocs: [] };
  const split = splitVendorDescription(description);
  if (!split) return { notes: description, pocs: [] };

  const pocs: VendorPoc[] = [];
  for (const payload of split.payloads) {
    const parsed = parsePayload(payload);
    // A later unreadable block must not hide contacts already parsed.
    // The cleanup refuses the whole record in that case; saving still
    // round-trips the contacts the form was able to read.
    if (!parsed.ok) break;
    pocs.push(...parsed.entries.filter(isMeaningfulVendorPoc));
  }
  return { notes: split.notes, pocs };
}

export function initialVendorPocs(
  description: string | null | undefined,
  legacy: { name?: unknown; phone?: unknown },
  createId: () => string = () => Math.random().toString()
): { notes: string; pocs: VendorPoc[] } {
  const parsed = parseStoredVendorPocs(description);
  if (parsed.pocs.length > 0) return parsed;

  const legacyName = contactFieldText(legacy.name);
  const legacyPhone = contactFieldText(legacy.phone);
  if (legacyName.trim() || legacyPhone.trim()) {
    return {
      notes: parsed.notes,
      pocs: [{ id: createId(), name: legacyName, phone: legacyPhone, note: '' }],
    };
  }

  return {
    notes: parsed.notes,
    pocs: [{ id: createId(), name: '', phone: '', note: '' }],
  };
}

/** Zoho clears a textarea/text field when the value is null, not "". */
function emptyAsNull(value: string): string | null {
  return value === '' ? null : value;
}

export function buildVendorContactWrite(notes: string, pocs: readonly unknown[]): {
  Description: string | null;
  Ticker_Symbol: string;
  Fax: string;
} {
  const meaningful = pocs.filter(isMeaningfulVendorPoc);
  const primary = meaningful[0];
  const description = meaningful.length > 0
    ? `${notes}\n${POC_DATA_MARKER}\n${JSON.stringify(meaningful)}`
    : notes;

  return {
    Description: emptyAsNull(description),
    // Empty strings match the previous save payload. Zoho already accepts them
    // on these text fields; null is reserved for clearing Description.
    Ticker_Symbol: primary ? contactFieldText(primary.name) : '',
    Fax: primary ? contactFieldText(primary.phone) : '',
  };
}

/**
 * Decide how to rewrite one vendor Description.
 * Records with only real contacts are left untouched, including their JSON formatting.
 * Blank entries are dropped. When nothing meaningful remains, the marker and JSON
 * are removed and the plain notes (or null, when the notes are empty) are kept.
 */
export function planVendorDescriptionCleanup(description: unknown): VendorDescriptionCleanup {
  if (description != null && typeof description !== 'string') {
    return { action: 'skip', reason: 'unsupported-description' };
  }

  const text = typeof description === 'string' ? description : '';
  const split = splitVendorDescription(text);
  if (!split) return { action: 'unchanged', reason: 'no-marker' };

  const meaningful: VendorPoc[] = [];
  let removedBlankCount = 0;
  let sawEmptyOrBlankPayload = false;

  for (const payload of split.payloads) {
    const parsed = parsePayload(payload);
    if (!parsed.ok) return { action: 'skip', reason: parsed.reason };
    const kept = parsed.entries.filter(isMeaningfulVendorPoc);
    removedBlankCount += parsed.entries.length - kept.length;
    if (kept.length === 0) sawEmptyOrBlankPayload = true;
    meaningful.push(...kept);
  }

  if (removedBlankCount === 0 && !sawEmptyOrBlankPayload) {
    return { action: 'unchanged', reason: 'no-blank-entries' };
  }

  const markerRemoved = meaningful.length === 0;
  const descriptionOut = markerRemoved
    ? split.notes
    : `${split.notes}\n${POC_DATA_MARKER}\n${JSON.stringify(meaningful)}`;

  return {
    action: 'update',
    description: emptyAsNull(descriptionOut),
    removedBlankCount,
    keptCount: meaningful.length,
    markerRemoved,
    notesCharacterCount: split.notes.length,
  };
}
