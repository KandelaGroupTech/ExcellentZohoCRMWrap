/**
 * One-time cleanup for blank vendor points of contact stored in Zoho.
 *
 * The vendor edit form used to save a placeholder contact
 * (`{"name":"","phone":"","note":""}`) into Account Description after
 * `---POC_DATA---`. This script removes those empty entries. When no real
 * contact remains, it also removes the marker and leaves the plain notes.
 * Description is the only field written. An empty result is sent as null,
 * which is how Zoho clears a textarea.
 *
 * Dry run (default, no writes):
 *   npm run cleanup:blank-vendor-pocs
 *
 * Apply after reviewing the dry-run JSON:
 *   npm run cleanup:blank-vendor-pocs -- --apply
 *
 * Credentials are read from the environment, or from .env.local in the
 * project root when a variable is not already set:
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN
 */
import fs from 'fs';
import path from 'path';
import { fetchVendors, updateAccountDescriptions } from '../src/lib/zoho';
import { planVendorDescriptionCleanup, POC_DATA_MARKER, splitVendorDescription } from '../src/lib/vendorPoc';

function loadEnvFile(filePath: string) {
  if (!fs.existsSync(filePath)) return;
  const text = fs.readFileSync(filePath, 'utf8');
  for (const line of text.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

function charCodes(value: string): number[] {
  const codes: number[] = [];
  for (let i = 0; i < value.length; i++) codes.push(value.charCodeAt(i));
  return codes;
}

function markerShape(description: string) {
  const index = description.indexOf(POC_DATA_MARKER);
  const before = description.slice(Math.max(0, index - 2), index);
  const after = description.slice(index + POC_DATA_MARKER.length, index + POC_DATA_MARKER.length + 2);
  return {
    index,
    beforeCodes: charCodes(before),
    afterCodes: charCodes(after),
  };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.includes('--help')) {
    console.log('Usage: npm run cleanup:blank-vendor-pocs -- [--apply]');
    console.log('Default is a dry run. --apply updates Description on vendor accounts only.');
    return;
  }

  loadEnvFile(path.join(process.cwd(), '.env.local'));

  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    console.error('Missing ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN.');
    process.exitCode = 1;
    return;
  }

  console.error(apply ? 'Applying Description cleanup...' : 'Dry run: no Zoho records will be written.');

  const vendors = await fetchVendors();
  const updates: {
    id: string;
    name: string;
    removedBlankCount: number;
    keptCount: number;
    markerRemoved: boolean;
    notesCharacterCount: number;
    description: string | null;
  }[] = [];
  const skippedRecords: { id: string; name: string; reason: string }[] = [];
  const unrecognizedMarkers: { id: string; name: string; shape: ReturnType<typeof markerShape> }[] = [];
  let unchanged = 0;
  let withMarker = 0;

  for (const vendor of vendors) {
    if (vendor.Account_Type && vendor.Account_Type !== 'Vendor') continue;

    const description = vendor.Description;
    const name = vendor.Account_Name || '';
    if (typeof description === 'string' && description.includes(POC_DATA_MARKER)) {
      withMarker += 1;
      if (!splitVendorDescription(description) && unrecognizedMarkers.length < 5) {
        unrecognizedMarkers.push({ id: vendor.id, name, shape: markerShape(description) });
      }
    }

    const plan = planVendorDescriptionCleanup(description);

    if (plan.action === 'unchanged') {
      unchanged += 1;
      continue;
    }

    if (plan.action === 'skip') {
      skippedRecords.push({ id: vendor.id, name, reason: plan.reason });
      continue;
    }

    const again = planVendorDescriptionCleanup(plan.description);
    if (again.action === 'update') {
      skippedRecords.push({ id: vendor.id, name, reason: 'cleanup-did-not-stabilize' });
      continue;
    }

    updates.push({
      id: vendor.id,
      name,
      removedBlankCount: plan.removedBlankCount,
      keptCount: plan.keptCount,
      markerRemoved: plan.markerRemoved,
      notesCharacterCount: plan.notesCharacterCount,
      description: plan.description,
    });
  }

  updates.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
  skippedRecords.sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));

  const report: Record<string, unknown> = {
    mode: apply ? 'apply' : 'dry-run',
    vendorsScanned: vendors.length,
    descriptionsWithMarker: withMarker,
    wouldUpdate: updates.length,
    unchanged,
    skipped: skippedRecords.length,
    markerRemoved: updates.filter((update) => update.markerRemoved).length,
    blanksDroppedContactsKept: updates.filter((update) => !update.markerRemoved).length,
    updates: updates.map((update) => ({
      id: update.id,
      name: update.name,
      removedBlankCount: update.removedBlankCount,
      keptCount: update.keptCount,
      markerRemoved: update.markerRemoved,
      notesCharacterCount: update.notesCharacterCount,
      descriptionCleared: update.description === null,
    })),
    skippedRecords,
    unrecognizedMarkers,
  };

  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    console.error('Dry run only. Re-run with --apply to write Description on the listed vendor accounts.');
    return;
  }

  const results = await updateAccountDescriptions(
    updates.map((update) => ({ id: update.id, Description: update.description }))
  );
  const failed = results.filter((result) => result.status === 'error');
  report.updated = results.filter((result) => result.status === 'success').length;
  report.failed = failed;
  console.log(JSON.stringify(report, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
