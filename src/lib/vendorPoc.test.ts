import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildVendorContactWrite,
  initialVendorPocs,
  planVendorDescriptionCleanup,
  vendorNotesText,
} from './vendorPoc';

const blank = { id: '0.048018951871149795', name: '', phone: '', note: '' };
const real = { id: '0.5', name: 'Ada Lovelace', phone: '(555) 010-1000', note: 'Tuesdays' };

describe('planVendorDescriptionCleanup', () => {
  it('clears a description that is only the blank contact from the bug report', () => {
    const description = `---POC_DATA---\n${JSON.stringify([blank])}`;
    assert.deepEqual(planVendorDescriptionCleanup(description), {
      action: 'update',
      description: null,
      removedBlankCount: 1,
      keptCount: 0,
      markerRemoved: true,
      notesCharacterCount: 0,
    });
  });

  it('clears the same blob when the leading newline from the save path is still present', () => {
    const description = `\n---POC_DATA---\n${JSON.stringify([blank])}`;
    const plan = planVendorDescriptionCleanup(description);
    assert.equal(plan.action, 'update');
    if (plan.action === 'update') assert.equal(plan.description, null);
  });

  it('keeps plain notes and drops the marker when every contact is blank', () => {
    const description = `Called Tuesday\n---POC_DATA---\n${JSON.stringify([blank, { id: '2', name: '  ', phone: '', note: ' \n' }])}`;
    assert.deepEqual(planVendorDescriptionCleanup(description), {
      action: 'update',
      description: 'Called Tuesday',
      removedBlankCount: 2,
      keptCount: 0,
      markerRemoved: true,
      notesCharacterCount: 'Called Tuesday'.length,
    });
  });

  it('drops blank entries and rewrites the remaining contacts without changing them', () => {
    const withExtra = { ...real, extra: 'keep-me' };
    const description = `Prefers email\n---POC_DATA---\n${JSON.stringify([blank, withExtra])}`;
    assert.deepEqual(planVendorDescriptionCleanup(description), {
      action: 'update',
      description: `Prefers email\n---POC_DATA---\n${JSON.stringify([withExtra])}`,
      removedBlankCount: 1,
      keptCount: 1,
      markerRemoved: false,
      notesCharacterCount: 'Prefers email'.length,
    });
  });

  it('does not rewrite records whose contacts are all real, even if the JSON is pretty-printed', () => {
    const pretty = `Notes\n---POC_DATA---\n[\n  ${JSON.stringify(real)}\n]`;
    assert.deepEqual(planVendorDescriptionCleanup(pretty), {
      action: 'unchanged',
      reason: 'no-blank-entries',
    });
  });

  it('leaves descriptions with no marker alone', () => {
    assert.deepEqual(planVendorDescriptionCleanup('Just notes'), {
      action: 'unchanged',
      reason: 'no-marker',
    });
    assert.deepEqual(planVendorDescriptionCleanup(null), {
      action: 'unchanged',
      reason: 'no-marker',
    });
  });

  it('skips unparseable marker payloads instead of destroying them', () => {
    assert.deepEqual(planVendorDescriptionCleanup('Notes\n---POC_DATA---\nnot-json'), {
      action: 'skip',
      reason: 'invalid-json',
    });
    assert.deepEqual(planVendorDescriptionCleanup('Notes\n---POC_DATA---\n{"name":"Ada"}'), {
      action: 'skip',
      reason: 'not-array',
    });
    assert.deepEqual(planVendorDescriptionCleanup('Notes\n---POC_DATA---\n[null]'), {
      action: 'skip',
      reason: 'unexpected-entry',
    });
  });

  it('keeps a real contact that was stored in a later marker block and drops the blank block', () => {
    const description = `---POC_DATA---\n${JSON.stringify([blank])}\n---POC_DATA---\n${JSON.stringify([real])}`;
    const plan = planVendorDescriptionCleanup(description);
    assert.equal(plan.action, 'update');
    if (plan.action !== 'update') return;
    assert.equal(plan.markerRemoved, false);
    assert.equal(plan.keptCount, 1);
    assert.equal(plan.description, `\n---POC_DATA---\n${JSON.stringify([real])}`);
  });

  it('removes a marker whose JSON array is empty', () => {
    const plan = planVendorDescriptionCleanup('Hello\n---POC_DATA---\n[]');
    assert.equal(plan.action, 'update');
    if (plan.action === 'update') {
      assert.equal(plan.description, 'Hello');
      assert.equal(plan.removedBlankCount, 0);
    }
  });

  it('treats a contact that only has a note as real', () => {
    const noteOnly = { id: '9', name: '', phone: '', note: 'After 5pm' };
    const description = `---POC_DATA---\n${JSON.stringify([noteOnly])}`;
    assert.deepEqual(planVendorDescriptionCleanup(description), {
      action: 'unchanged',
      reason: 'no-blank-entries',
    });
  });
});

describe('buildVendorContactWrite', () => {
  it('does not persist a placeholder blank contact or the marker', () => {
    assert.deepEqual(
      buildVendorContactWrite('Site notes', [{ id: '1', name: '', phone: '', note: '' }]),
      { Description: 'Site notes', Ticker_Symbol: '', Fax: '' }
    );
  });

  it('clears description when notes and contacts are empty', () => {
    assert.deepEqual(
      buildVendorContactWrite('', [{ id: '1', name: ' ', phone: '', note: '' }]),
      { Description: null, Ticker_Symbol: '', Fax: '' }
    );
  });

  it('round-trips real contacts exactly and ignores a trailing blank row', () => {
    const write = buildVendorContactWrite('Prefers email', [real, blank]);
    assert.equal(write.Description, `Prefers email\n---POC_DATA---\n${JSON.stringify([real])}`);
    assert.equal(write.Ticker_Symbol, real.name);
    assert.equal(write.Fax, real.phone);
  });

  it('uses the first real contact for ticker and fax when the first row is blank', () => {
    const write = buildVendorContactWrite('', [blank, real]);
    assert.equal(write.Ticker_Symbol, real.name);
    assert.equal(write.Fax, real.phone);
    assert.equal(write.Description, `\n---POC_DATA---\n${JSON.stringify([real])}`);
  });
});

describe('initialVendorPocs', () => {
  it('hides stored blank contacts and keeps an empty row for editing', () => {
    const description = `Called\n---POC_DATA---\n${JSON.stringify([blank])}`;
    const form = initialVendorPocs(description, {}, () => 'new');
    assert.equal(form.notes, 'Called');
    assert.deepEqual(form.pocs, [{ id: 'new', name: '', phone: '', note: '' }]);
  });

  it('falls back to ticker and fax when stored contacts are blank', () => {
    const description = `---POC_DATA---\n${JSON.stringify([blank])}`;
    const form = initialVendorPocs(description, { name: 'Jane', phone: '555' }, () => 'new');
    assert.equal(form.notes, '');
    assert.deepEqual(form.pocs, [{ id: 'new', name: 'Jane', phone: '555', note: '' }]);
  });

  it('returns stored real contacts unchanged, without a placeholder row', () => {
    const description = `Hi\n---POC_DATA---\n${JSON.stringify([real, blank])}`;
    const form = initialVendorPocs(description, { name: 'Ignored', phone: '000' }, () => 'new');
    assert.equal(form.notes, 'Hi');
    assert.deepEqual(form.pocs, [real]);
  });
});

describe('vendorNotesText', () => {
  it('hides the marker blob when it is the whole description', () => {
    assert.equal(vendorNotesText(`---POC_DATA---\n${JSON.stringify([blank])}`), '');
  });

  it('shows only the notes before the marker', () => {
    assert.equal(vendorNotesText(`Called\n---POC_DATA---\n${JSON.stringify([real])}`), 'Called');
  });
});
