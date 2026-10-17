import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { POC_DATA_MARKER } from './vendorPoc';
import {
  canonicalFromNotionFields,
  canonicalFromNotionPage,
  canonicalFromZohoAccount,
  notionPropertiesFromCanonical,
  pickSyncDirection,
  planVendorSync,
  vendorRecordsMatch,
  vendorSnapshot,
  withNotionSyncMetadata,
  zohoAccountFromCanonical,
  type CanonicalVendor,
  type NotionVendorInput,
  type ZohoVendorInput,
} from './vendorNotionSync';

const poc = { id: 'poc-1', name: 'Ada Lovelace', phone: '(555) 010-1000', note: 'Tuesdays' };
const secondPoc = { id: 'poc-2', name: 'Grace Hopper', phone: '(555) 010-2000', note: 'Mornings' };

function vendor(overrides: Partial<CanonicalVendor> = {}): CanonicalVendor {
  return {
    name: 'Ada Electric',
    status: 'Preferred',
    trade: 'Electrical',
    phone: '703-555-0100',
    email: 'ada@example.com',
    website: 'https://ada.example',
    street: '1 Main St',
    city: 'Vienna',
    state: 'VA',
    zip: '22180',
    country: 'USA',
    notes: 'Prefers email',
    pocs: [poc],
    ...overrides,
  };
}

function notionInput(overrides: Partial<NotionVendorInput> = {}): NotionVendorInput {
  const record = overrides.record === undefined ? vendor() : overrides.record;
  return {
    pageId: 'page-1',
    zohoId: 'zoho-1',
    name: record?.name || 'Ada Electric',
    lastEditedTime: '2026-10-05T11:00:00.000Z',
    record,
    error: null,
    ...overrides,
  };
}

function zohoInput(overrides: Partial<ZohoVendorInput> = {}): ZohoVendorInput {
  const record = overrides.record === undefined ? vendor() : overrides.record;
  return {
    id: 'zoho-1',
    name: record?.name || 'Ada Electric',
    modifiedTime: '2026-10-05T12:00:00.000Z',
    record,
    error: null,
    ...overrides,
  };
}

describe('vendor field and POC mapping', () => {
  it('round-trips notes and one real point of contact through Zoho Description', () => {
    const notion = canonicalFromNotionFields({
      name: 'Ada Electric',
      status: 'Preferred',
      trade: 'Electrical',
      phone: '703-555-0100',
      email: 'ada@example.com',
      website: 'https://ada.example',
      street: '1 Main St',
      city: 'Vienna',
      state: 'VA',
      zip: '22180',
      country: 'USA',
      notes: 'Prefers email',
      pocName: 'Ada Lovelace',
      pocPhone: '(555) 010-1000',
      pocNote: 'Tuesdays',
    });
    assert.equal(notion.ok, true);
    if (!notion.ok) return;

    const write = zohoAccountFromCanonical(notion.record, { createId: () => 'poc-1' });
    assert.equal('id' in write, false);
    assert.equal(write.Account_Name, 'Ada Electric');
    assert.equal(write.Rating, 'Preferred');
    assert.equal(write.Industry, 'Electrical');
    assert.equal(write.Account_Site, 'ada@example.com');
    assert.equal(write.Billing_Code, '22180');
    assert.equal(write.Ticker_Symbol, 'Ada Lovelace');
    assert.equal(write.Fax, '(555) 010-1000');
    assert.equal(
      write.Description,
      `Prefers email\n${POC_DATA_MARKER}\n${JSON.stringify([poc])}`
    );

    const back = canonicalFromZohoAccount({ ...write, id: 'zoho-1', Modified_Time: '2026-10-05T12:00:00.000Z' });
    assert.equal(back.ok, true);
    if (!back.ok) return;
    assert.deepEqual(vendorSnapshot(back.record), vendorSnapshot(notion.record));
    assert.equal(back.record.pocs[0].id, 'poc-1');
  });

  it('does not serialize a blank point of contact or invent a Rating', () => {
    const notion = canonicalFromNotionFields({
      name: 'Ada Electric',
      status: 'Uncategorized',
      notes: 'Site notes',
      pocName: '  ',
      pocPhone: '',
      pocNote: ' \n',
    });
    assert.equal(notion.ok, true);
    if (!notion.ok) return;
    assert.equal(notion.record.status, '');
    assert.deepEqual(notion.record.pocs, []);

    const write = zohoAccountFromCanonical(notion.record, { createId: () => 'unused' });
    assert.equal(write.Description, 'Site notes');
    assert.equal(write.Description?.includes(POC_DATA_MARKER), false);
    assert.equal(write.Ticker_Symbol, '');
    assert.equal(write.Fax, '');
    assert.equal(write.Rating, null);
    assert.equal('id' in write, false);
  });

  it('maps an empty Zoho Rating to Notion Uncategorized and back to null', () => {
    for (const rating of [null, '', '   ']) {
      const mapped = canonicalFromZohoAccount({ Account_Name: 'Ada Electric', Rating: rating });
      assert.equal(mapped.ok, true);
      if (!mapped.ok) return;
      assert.equal(mapped.record.status, '');
      assert.deepEqual(notionPropertiesFromCanonical(mapped.record).Status, {
        select: { name: 'Uncategorized' },
      });
    }

    const fromNotion = canonicalFromNotionFields({ name: 'Ada Electric', status: 'Uncategorized' });
    assert.equal(fromNotion.ok, true);
    if (!fromNotion.ok) return;
    assert.equal(zohoAccountFromCanonical(fromNotion.record).Rating, null);
  });

  it('does not invent a Notion status for an unknown Zoho Rating', () => {
    const mapped = canonicalFromZohoAccount({ Account_Name: 'Ada Electric', Rating: 'Hot' });
    assert.deepEqual(mapped, { ok: false, reason: 'unknown-rating' });

    const plan = planVendorSync([], [
      zohoInput({
        record: null,
        error: 'unknown-rating',
        name: 'Ada Electric',
      }),
    ]);
    assert.deepEqual(plan.summary.createsOnNotion, []);
    assert.equal(plan.summary.skipped[0].reason, 'zoho-unknown-rating');
  });

  it('reads a legacy ticker and fax contact the way the edit form does', () => {
    const mapped = canonicalFromZohoAccount({
      Account_Name: 'Ada Electric',
      Description: 'Called Tuesday',
      Ticker_Symbol: 'Ada Lovelace',
      Fax: '(555) 010-1000',
    });
    assert.equal(mapped.ok, true);
    if (!mapped.ok) return;
    assert.equal(mapped.record.notes, 'Called Tuesday');
    assert.deepEqual(mapped.record.pocs, [
      { id: '', name: 'Ada Lovelace', phone: '(555) 010-1000', note: '' },
    ]);

    const write = zohoAccountFromCanonical(mapped.record, { createId: () => 'poc-1' });
    assert.equal(write.Ticker_Symbol, 'Ada Lovelace');
    assert.equal(write.Fax, '(555) 010-1000');
    assert.equal(write.Description?.includes(POC_DATA_MARKER), true);
  });

  it('keeps later Zoho contacts when the first contact is unchanged', () => {
    const existing = vendor({ pocs: [poc, secondPoc], notes: 'Old notes' });
    const edited = vendor({ pocs: [{ ...poc, id: '' }], notes: 'New notes' });
    const write = zohoAccountFromCanonical(edited, { existing, createId: () => 'new-id' });
    assert.equal(
      write.Description,
      `New notes\n${POC_DATA_MARKER}\n${JSON.stringify([poc, secondPoc])}`
    );
    assert.equal(write.Ticker_Symbol, poc.name);
    assert.equal(write.Fax, poc.phone);
  });

  it('replaces the Zoho contact list when the Notion contact changes', () => {
    const existing = vendor({ pocs: [poc, secondPoc] });
    const edited = vendor({ pocs: [{ id: '', name: 'New Person', phone: '111', note: '' }] });
    const write = zohoAccountFromCanonical(edited, { existing, createId: () => 'poc-new' });
    assert.equal(write.Ticker_Symbol, 'New Person');
    assert.equal(write.Fax, '111');
    assert.equal(write.Description?.includes('Grace Hopper'), false);
    assert.equal(write.Description?.includes('poc-new'), true);
  });

  it('round-trips Notion page properties, including a long note', () => {
    const notes = `${'A'.repeat(2001)}\nSecond line`;
    const record = vendor({ notes, status: '', pocs: [poc] });
    const page = canonicalFromNotionPage({
      id: 'page-1',
      last_edited_time: '2026-10-05T13:00:00.000Z',
      properties: notionPropertiesFromCanonical(record, { zohoId: 'zoho-1' }),
    });
    assert.equal(page.pageId, 'page-1');
    assert.equal(page.zohoId, 'zoho-1');
    assert.equal(page.lastEditedTime, '2026-10-05T13:00:00.000Z');
    assert.equal(page.error, null);
    assert.ok(page.record);
    assert.deepEqual(vendorSnapshot(page.record), vendorSnapshot(record));
    assert.equal(page.record.status, '');
  });

  it('treats Windows newlines as the same notes', () => {
    const zoho = canonicalFromZohoAccount({ Account_Name: 'Ada Electric', Description: 'Line\r\nTwo' });
    const notion = canonicalFromNotionFields({ name: 'Ada Electric', notes: 'Line\nTwo' });
    assert.equal(zoho.ok && notion.ok && vendorRecordsMatch(zoho.record, notion.record), true);
  });

  it('refuses to store a Zoho Modified or Last Synced value that is not a real timestamp', () => {
    assert.deepEqual(withNotionSyncMetadata({ Name: { title: [] } }, { zohoModified: 'not-a-date', lastSynced: '' }), {
      Name: { title: [] },
    });
    assert.deepEqual(withNotionSyncMetadata({}, { zohoModified: '2026-10-03T18:06:00-04:00' })['Zoho Modified'], {
      date: { start: '2026-10-03T22:06:00.000Z' },
    });
  });

  it('leaves an unreadable POC payload untouched by refusing the record', () => {
    const mapped = canonicalFromZohoAccount({
      Account_Name: 'Ada Electric',
      Description: `Notes\n${POC_DATA_MARKER}\nnot-json`,
      Ticker_Symbol: 'Should Not Fallback',
    });
    assert.deepEqual(mapped, { ok: false, reason: 'unreadable-poc' });
  });
});

describe('pickSyncDirection', () => {
  const zohoModifiedTime = '2026-10-05T12:00:00.000Z';

  it('skips identical records even when Notion was edited much later', () => {
    assert.deepEqual(
      pickSyncDirection({
        recordsMatch: true,
        zohoModifiedTime,
        notionEditedTime: '2026-10-05T18:00:00.000Z',
      }),
      { action: 'skip', reason: 'in-sync' }
    );
  });

  it('skips when either timestamp is missing instead of inventing one', () => {
    assert.deepEqual(
      pickSyncDirection({ recordsMatch: false, zohoModifiedTime: null, notionEditedTime: zohoModifiedTime }),
      { action: 'skip', reason: 'missing-timestamp' }
    );
    assert.deepEqual(
      pickSyncDirection({ recordsMatch: false, zohoModifiedTime: 'not-a-time', notionEditedTime: zohoModifiedTime }),
      { action: 'skip', reason: 'missing-timestamp' }
    );
  });

  it('skips edits within 2 seconds, including equal instants in different offsets', () => {
    assert.equal(
      pickSyncDirection({
        recordsMatch: false,
        zohoModifiedTime,
        notionEditedTime: '2026-10-05T12:00:02.000Z',
      }).action,
      'skip'
    );
    assert.deepEqual(
      pickSyncDirection({
        recordsMatch: false,
        zohoModifiedTime: '2026-10-05T08:00:00-04:00',
        notionEditedTime: '2026-10-05T12:00:01.500Z',
      }),
      { action: 'skip', reason: 'within-2-seconds' }
    );
  });

  it('gives the newer side the write when the gap is just over 2 seconds', () => {
    assert.equal(
      pickSyncDirection({
        recordsMatch: false,
        zohoModifiedTime,
        notionEditedTime: '2026-10-05T12:00:02.001Z',
      }).action,
      'notion-to-zoho'
    );
    assert.equal(
      pickSyncDirection({
        recordsMatch: false,
        zohoModifiedTime: '2026-10-05T12:00:02.001Z',
        notionEditedTime: zohoModifiedTime,
      }).action,
      'zoho-to-notion'
    );
  });
});

describe('planVendorSync', () => {
  it('updates the older side and records who won', () => {
    const zohoWins = planVendorSync(
      [notionInput({ lastEditedTime: '2026-10-05T11:00:00.000Z', record: vendor({ phone: '111' }) })],
      [zohoInput({ modifiedTime: '2026-10-05T12:00:00.000Z', record: vendor({ phone: '222' }) })]
    );
    assert.deepEqual(zohoWins.summary.zohoToNotion, [{ zohoId: 'zoho-1', notionPageId: 'page-1', name: 'Ada Electric' }]);
    assert.deepEqual(zohoWins.summary.notionToZoho, []);
    assert.equal(zohoWins.summary.conflictsResolved[0].winner, 'zoho');
    assert.deepEqual(zohoWins.zohoToNotion[0].notionProperties.Phone, { phone_number: '222' });
    assert.equal('Zoho ID' in zohoWins.zohoToNotion[0].notionProperties, false);

    const notionWins = planVendorSync(
      [notionInput({ lastEditedTime: '2026-10-05T13:00:00.000Z', record: vendor({ notes: 'From Notion' }) })],
      [zohoInput({ modifiedTime: '2026-10-05T12:00:00.000Z', record: vendor({ notes: 'From Zoho', pocs: [poc, secondPoc] }) })],
      { createId: () => 'should-not-be-used' }
    );
    assert.equal(notionWins.summary.conflictsResolved[0].winner, 'notion');
    assert.equal(notionWins.notionToZoho[0].zohoFields.Description?.includes(secondPoc.name), true);
    assert.equal('id' in notionWins.notionToZoho[0].zohoFields, false);
  });

  it('does not call a tie or an in-sync pair a resolved conflict', () => {
    const tied = planVendorSync(
      [notionInput({ lastEditedTime: '2026-10-05T12:00:01.000Z', record: vendor({ city: 'Alexandria' }) })],
      [zohoInput({ modifiedTime: '2026-10-05T12:00:00.000Z', record: vendor({ city: 'Vienna' }) })]
    );
    assert.deepEqual(tied.summary.conflictsResolved, []);
    assert.equal(tied.summary.skipped[0].reason, 'within-2-seconds');

    const synced = planVendorSync(
      [notionInput({ lastEditedTime: '2026-10-06T00:00:00.000Z' })],
      [zohoInput({ modifiedTime: '2026-10-01T00:00:00.000Z' })]
    );
    assert.deepEqual(synced.summary.conflictsResolved, []);
    assert.deepEqual(synced.summary.notionToZoho, []);
    assert.deepEqual(synced.summary.zohoToNotion, []);
    assert.equal(synced.summary.skipped[0].reason, 'in-sync');
  });

  it('creates missing rows and does not recreate or delete a Zoho id that is already gone', () => {
    const plan = planVendorSync(
      [
        notionInput({ pageId: 'page-new', zohoId: '', name: 'New Vendor', record: vendor({ name: 'New Vendor' }) }),
        notionInput({ pageId: 'page-gone', zohoId: 'deleted-1', name: 'Gone Vendor', record: vendor({ name: 'Gone Vendor' }) }),
        notionInput({ pageId: 'page-blank', zohoId: '', name: '', record: vendor({ name: '' }) }),
      ],
      [zohoInput({ id: 'zoho-only', name: 'Zoho Only', record: vendor({ name: 'Zoho Only' }) })]
    );
    assert.deepEqual(plan.summary.createsOnZoho, [{ notionPageId: 'page-new', name: 'New Vendor' }]);
    assert.equal(plan.createsOnZoho[0].zohoFields.Account_Type, 'Vendor');
    assert.equal('id' in plan.createsOnZoho[0].zohoFields, false);
    assert.deepEqual(plan.summary.createsOnNotion, [{ zohoId: 'zoho-only', name: 'Zoho Only' }]);
    assert.deepEqual(plan.createsOnNotion[0].notionProperties['Zoho ID'], {
      rich_text: [{ type: 'text', text: { content: 'zoho-only' } }],
    });
    assert.deepEqual(
      plan.summary.skipped.filter((item) => item.notionPageId === 'page-gone'),
      [{ zohoId: 'deleted-1', notionPageId: 'page-gone', name: 'Gone Vendor', reason: 'missing-on-zoho' }]
    );
    assert.equal(plan.summary.skipped.some((item) => item.reason === 'missing-name'), true);
  });

  it('does not create or update when one Zoho id is on two Notion pages', () => {
    const plan = planVendorSync(
      [
        notionInput({ pageId: 'page-a', zohoId: 'zoho-1', record: vendor({ phone: '1' }) }),
        notionInput({ pageId: 'page-b', zohoId: 'zoho-1', record: vendor({ phone: '2' }) }),
      ],
      [zohoInput({ record: vendor({ phone: '3' }) })]
    );
    assert.deepEqual(plan.summary.notionToZoho, []);
    assert.deepEqual(plan.summary.zohoToNotion, []);
    assert.deepEqual(plan.summary.createsOnNotion, []);
    assert.equal(plan.summary.skipped.filter((item) => item.reason === 'duplicate-notion-zoho-id').length, 3);
  });
});
