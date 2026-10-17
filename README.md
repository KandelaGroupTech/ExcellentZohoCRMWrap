This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Sync Zoho vendors with Notion

`npm run sync:vendors-notion` copies vendor Accounts between Zoho CRM and Richard's Notion database [JOB Vendors](https://app.notion.com/p/37d82e05f80649df83a05045a3602abc). The default run is a dry run and prints a JSON summary. It does not write. Add `--apply` to create and update rows:

```bash
npm run sync:vendors-notion
npm run sync:vendors-notion -- --apply
```

Rows match on Zoho ID. The Zoho id is never overwritten. Empty Notion status `Uncategorized` matches an empty Zoho Rating. Notes and the single Notion point of contact are stored in the Zoho Description field with the same `---POC_DATA---` format the vendor edit form uses. The first real contact is also written to Ticker Symbol and Fax. If Zoho has more contacts than that one, they stay in the Description until the Notion contact fields themselves change. When both sides have a row and the fields differ, the later edit wins (`Modified_Time` vs the Notion page `last_edited_time`). Identical field values are left alone, and edits within 2 seconds are left alone. This command does not delete records.

### Notion integration

1. Open [Notion integrations](https://www.notion.so/my-integrations) and create an internal integration in the workspace that owns JOB Vendors.
2. Allow the integration to read, insert, and update content. Copy the Internal Integration Secret.
3. Open the JOB Vendors database and choose **Connections** (or the `•••` menu → **Add connections**). Invite the integration. Until this share exists, the API cannot see the database.
4. The data source id is `5db5c410-62c2-49cc-bd07-cd4ab5db6032`. Set it only if you point the script at a different database.

### Environment variables

Put these in `.env.local` for a local run. Existing shell variables win over the file. Zoho uses the same three variables as `npm run cleanup:blank-vendor-pocs`.

```bash
ZOHO_CLIENT_ID=
ZOHO_CLIENT_SECRET=
ZOHO_REFRESH_TOKEN=
NOTION_TOKEN=
# NOTION_API_KEY is accepted as an alias of NOTION_TOKEN
NOTION_VENDORS_DATA_SOURCE_ID=5db5c410-62c2-49cc-bd07-cd4ab5db6032
```

On Vercel, open the project → **Settings** → **Environment Variables** and add the same names for Production, Preview, and Development. The Next.js app does not run this script, but the variables need to live with the project so `vercel env pull .env.local` and any later scheduled run use one set of credentials. You can also add them with the Vercel CLI:

```bash
vercel env add NOTION_TOKEN
vercel env add NOTION_VENDORS_DATA_SOURCE_ID
```

Add the Zoho variables the same way if they are not already on the project.

If `--apply` creates a Zoho account and then fails while writing the new id back to Notion, the JSON `failed` entry includes that Zoho id. Paste it into the Notion row's Zoho ID before running again so the next run does not create a second account.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
