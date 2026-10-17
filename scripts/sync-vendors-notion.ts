/**
 * Two-way sync between Zoho CRM vendor Accounts and the Notion "JOB Vendors" database.
 *
 * Dry run (default, no writes):
 *   npm run sync:vendors-notion
 *
 * Apply after reviewing the dry-run JSON:
 *   npm run sync:vendors-notion -- --apply
 *
 * Credentials are read from the environment, or from .env.local when a variable
 * is not already set:
 *   ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, ZOHO_REFRESH_TOKEN
 *   NOTION_TOKEN (or NOTION_API_KEY)
 *   NOTION_VENDORS_DATA_SOURCE_ID (optional; defaults to the JOB Vendors data source)
 *
 * See README.md for creating the Notion integration and sharing the database.
 * v1 creates and updates only. It does not delete on either side.
 */
import fs from 'fs';
import path from 'path';
import { fetchVendors, mutateAccounts } from '../src/lib/zoho';
import {
  DEFAULT_NOTION_VENDORS_DATA_SOURCE_ID,
  canonicalFromNotionPage,
  planVendorSync,
  withNotionSyncMetadata,
  zohoVendorInputFromAccount,
  type VendorSyncPlan,
  type VendorSyncSummary,
  type ZohoAccountLike,
} from '../src/lib/vendorNotionSync';

const NOTION_VERSION = '2025-09-03';
const NOTION_PAUSE_MS = 350;

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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type Failure = {
  zohoId: string | null;
  notionPageId: string | null;
  name: string;
  action: string;
  message: string;
};

type NotionClient = {
  queryAll: (dataSourceId: string) => Promise<unknown[]>;
  createPage: (dataSourceId: string, properties: Record<string, unknown>) => Promise<void>;
  updatePage: (pageId: string, properties: Record<string, unknown>) => Promise<void>;
};

function notionClient(token: string): NotionClient {
  let nextAt = 0;

  async function request(pathName: string, init: { method: string; body?: unknown }): Promise<unknown> {
    const wait = nextAt - Date.now();
    if (wait > 0) await sleep(wait);
    nextAt = Date.now() + NOTION_PAUSE_MS;

    let response: Response | null = null;
    let body = '';
    for (let attempt = 0; attempt < 4; attempt++) {
      response = await fetch(`https://api.notion.com/v1${pathName}`, {
        method: init.method,
        headers: {
          Authorization: `Bearer ${token}`,
          'Notion-Version': NOTION_VERSION,
          'Content-Type': 'application/json',
        },
        body: init.body === undefined ? undefined : JSON.stringify(init.body),
      });
      body = await response.text();
      if (response.status !== 429 && response.status < 500) break;
      const retryAfter = Number(response.headers.get('retry-after'));
      await sleep(Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * (attempt + 1));
    }

    if (!response || !response.ok) {
      let message = body.slice(0, 500);
      try {
        const parsed = JSON.parse(body) as { message?: string; code?: string };
        message = parsed.message || parsed.code || message;
      } catch {
        // Keep the raw response excerpt.
      }
      throw new Error(`Notion ${init.method} ${pathName} failed (${response?.status ?? 'no response'}): ${message}`);
    }
    if (!body) return {};
    return JSON.parse(body) as unknown;
  }

  return {
    async queryAll(dataSourceId: string) {
      const pages: unknown[] = [];
      let cursor: string | undefined;
      for (let page = 0; page < 100; page++) {
        const payload: { page_size: number; start_cursor?: string } = { page_size: 100 };
        if (cursor) payload.start_cursor = cursor;
        const data = (await request(`/data_sources/${dataSourceId}/query`, {
          method: 'POST',
          body: payload,
        })) as { results?: unknown[]; has_more?: boolean; next_cursor?: string | null };
        const results = Array.isArray(data.results) ? data.results : [];
        pages.push(...results);
        if (!data.has_more || !data.next_cursor) break;
        cursor = data.next_cursor;
      }
      return pages;
    },
    async createPage(dataSourceId: string, properties: Record<string, unknown>) {
      await request('/pages', {
        method: 'POST',
        body: {
          parent: { type: 'data_source_id', data_source_id: dataSourceId },
          properties,
        },
      });
    },
    async updatePage(pageId: string, properties: Record<string, unknown>) {
      await request(`/pages/${pageId}`, { method: 'PATCH', body: { properties } });
    },
  };
}

function counts(summary: VendorSyncSummary) {
  return {
    notionToZoho: summary.notionToZoho.length,
    zohoToNotion: summary.zohoToNotion.length,
    createsOnNotion: summary.createsOnNotion.length,
    createsOnZoho: summary.createsOnZoho.length,
    skipped: summary.skipped.length,
    conflictsResolved: summary.conflictsResolved.length,
  };
}

async function applyPlan(plan: VendorSyncPlan, notion: NotionClient, dataSourceId: string, syncedAt: string) {
  const failed: Failure[] = [];
  const applied = {
    notionToZoho: [] as VendorSyncSummary['notionToZoho'],
    zohoToNotion: [] as VendorSyncSummary['zohoToNotion'],
    createsOnNotion: [] as VendorSyncSummary['createsOnNotion'],
    createsOnZoho: [] as { notionPageId: string; name: string; zohoId: string }[],
  };

  const zohoUpdates = await mutateAccounts(
    'PUT',
    plan.notionToZoho.map((action) => ({ id: action.zohoId, fields: action.zohoFields }))
  );
  for (let index = 0; index < plan.notionToZoho.length; index++) {
    const action = plan.notionToZoho[index];
    const result = zohoUpdates[index];
    if (!result || result.status !== 'success') {
      failed.push({
        zohoId: action.zohoId,
        notionPageId: action.notionPageId,
        name: action.name,
        action: 'notion-to-zoho',
        message: result?.message || 'Zoho update failed',
      });
      continue;
    }
    try {
      await notion.updatePage(
        action.notionPageId,
        withNotionSyncMetadata(
          {},
          { lastSynced: syncedAt, zohoModified: result.modifiedTime }
        )
      );
      applied.notionToZoho.push({
        zohoId: action.zohoId,
        notionPageId: action.notionPageId,
        name: action.name,
      });
    } catch (error) {
      failed.push({
        zohoId: action.zohoId,
        notionPageId: action.notionPageId,
        name: action.name,
        action: 'notion-to-zoho-metadata',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  for (const action of plan.zohoToNotion) {
    try {
      await notion.updatePage(
        action.notionPageId,
        withNotionSyncMetadata(action.notionProperties, {
          lastSynced: syncedAt,
          zohoModified: action.zohoModifiedTime,
        })
      );
      applied.zohoToNotion.push({
        zohoId: action.zohoId,
        notionPageId: action.notionPageId,
        name: action.name,
      });
    } catch (error) {
      failed.push({
        zohoId: action.zohoId,
        notionPageId: action.notionPageId,
        name: action.name,
        action: 'zoho-to-notion',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  const created = await mutateAccounts(
    'POST',
    plan.createsOnZoho.map((action) => ({ fields: action.zohoFields }))
  );
  for (let index = 0; index < plan.createsOnZoho.length; index++) {
    const action = plan.createsOnZoho[index];
    const result = created[index];
    if (!result || result.status !== 'success' || !result.id) {
      failed.push({
        zohoId: result?.id || null,
        notionPageId: action.notionPageId,
        name: action.name,
        action: 'create-on-zoho',
        message: result?.message || 'Zoho create failed',
      });
      continue;
    }
    try {
      await notion.updatePage(
        action.notionPageId,
        withNotionSyncMetadata(
          {},
          { zohoId: result.id, lastSynced: syncedAt, zohoModified: result.modifiedTime }
        )
      );
      applied.createsOnZoho.push({
        notionPageId: action.notionPageId,
        name: action.name,
        zohoId: result.id,
      });
    } catch (error) {
      failed.push({
        zohoId: result.id,
        notionPageId: action.notionPageId,
        name: action.name,
        action: 'create-on-zoho-link',
        message: `Zoho account ${result.id} was created, but the Notion Zoho ID was not saved. Set Zoho ID on that Notion row before running again. ${error instanceof Error ? error.message : String(error)}`,
      });
    }
  }

  for (const action of plan.createsOnNotion) {
    try {
      await notion.createPage(
        dataSourceId,
        withNotionSyncMetadata(action.notionProperties, {
          zohoId: action.zohoId,
          lastSynced: syncedAt,
          zohoModified: action.zohoModifiedTime,
        })
      );
      applied.createsOnNotion.push({ zohoId: action.zohoId, name: action.name });
    } catch (error) {
      failed.push({
        zohoId: action.zohoId,
        notionPageId: null,
        name: action.name,
        action: 'create-on-notion',
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return { applied, failed };
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (process.argv.includes('--help')) {
    console.log('Usage: npm run sync:vendors-notion -- [--apply]');
    console.log('Default is a dry run. --apply creates and updates vendor rows on Zoho and Notion.');
    console.log('This command never deletes records.');
    return;
  }

  loadEnvFile(path.join(process.cwd(), '.env.local'));

  const notionToken = process.env.NOTION_TOKEN || process.env.NOTION_API_KEY;
  const dataSourceId = process.env.NOTION_VENDORS_DATA_SOURCE_ID || DEFAULT_NOTION_VENDORS_DATA_SOURCE_ID;
  if (!process.env.ZOHO_CLIENT_ID || !process.env.ZOHO_CLIENT_SECRET || !process.env.ZOHO_REFRESH_TOKEN) {
    console.error('Missing ZOHO_CLIENT_ID, ZOHO_CLIENT_SECRET, or ZOHO_REFRESH_TOKEN.');
    process.exitCode = 1;
    return;
  }
  if (!notionToken) {
    console.error('Missing NOTION_TOKEN or NOTION_API_KEY.');
    process.exitCode = 1;
    return;
  }

  console.error(apply ? 'Applying vendor sync...' : 'Dry run: no Zoho or Notion records will be written.');

  const notion = notionClient(notionToken);
  const [zohoAccounts, notionPages] = await Promise.all([
    fetchVendors(),
    notion.queryAll(dataSourceId),
  ]);

  const zohoInputs = zohoAccounts
    .filter((account: ZohoAccountLike) => !account.Account_Type || account.Account_Type === 'Vendor')
    .map((account: ZohoAccountLike) => zohoVendorInputFromAccount(account));
  const notionInputs = notionPages
    .filter((page): page is { object?: string; id?: unknown; last_edited_time?: unknown; properties?: unknown } => {
      return !!page && typeof page === 'object' && (page as { object?: string }).object === 'page';
    })
    .map((page) => canonicalFromNotionPage(page));

  const plan = planVendorSync(notionInputs, zohoInputs);
  const report: Record<string, unknown> = {
    mode: apply ? 'apply' : 'dry-run',
    notionPages: notionInputs.length,
    zohoVendors: zohoInputs.length,
    ...plan.summary,
    counts: counts(plan.summary),
  };

  const summaryCounts = counts(plan.summary);
  console.error(
    `notionToZoho=${summaryCounts.notionToZoho} zohoToNotion=${summaryCounts.zohoToNotion} createsOnNotion=${summaryCounts.createsOnNotion} createsOnZoho=${summaryCounts.createsOnZoho} skipped=${summaryCounts.skipped} conflictsResolved=${summaryCounts.conflictsResolved}`
  );

  if (!apply) {
    console.log(JSON.stringify(report, null, 2));
    console.error('Dry run only. Re-run with --apply to write these creates and updates. Nothing is deleted.');
    return;
  }

  const { applied, failed } = await applyPlan(plan, notion, dataSourceId, new Date().toISOString());
  report.applied = applied;
  report.failed = failed;
  console.log(JSON.stringify(report, null, 2));
  if (failed.length > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
