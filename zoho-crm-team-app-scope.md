# Team CRM Dashboard — Technical Scope

A web app that gives a 4–10 person team shared, role-based access to Zoho CRM: view pipeline, contacts, and accounts, and trigger create/log actions, without every person needing their own Zoho seat.

---

## 1. Goals

- Single web app, one URL, accessible from desktop browsers and as an "Add to Home Screen" shortcut on mobile.
- Team members log into the app itself (not into Zoho directly).
- v1 covers: Leads, Deals, Contacts, Accounts, logging Activities/Calls, and a to-do/follow-up list tied to Deals.
- Read views for all four modules, plus write actions: create Lead, create Contact, log a Call/Activity, update a Deal's stage, create/complete a to-do.
- Simple two-role permission model to start (Admin / Member) — see Section 5.
- Hosted initially at `tools.thekandelagroup.com`, with a planned future move to a domain under `excellentjob.com` — see Section 10.

## 2. Architecture

```
┌─────────────────┐      ┌──────────────────────┐      ┌────────────────┐
│  Next.js App     │────▶│  API routes (server)  │────▶│  Zoho CRM API   │
│  (Vercel)        │      │  - Zoho OAuth token   │      │  (v8, COQL)     │
│  - Auth (Clerk)  │      │    refresh & cache    │      └────────────────┘
│  - Dashboard UI  │      │  - Request signing    │
└─────────────────┘      └──────────────────────┘
```

**Why this shape:** a single server-side Zoho connection (not one per user) means only one OAuth client to manage, and the app controls exactly what each team member can see or do regardless of their Zoho seat/profile.

### Stack
| Layer | Choice | Why |
|---|---|---|
| Frontend/backend | Next.js (App Router), TypeScript | One codebase, deploys cleanly to Vercel, API routes double as the backend |
| Hosting | Vercel | Already connected; zero-config deploys from git |
| Auth | Clerk | Fast to set up for 4–10 users, handles invites/roles out of the box |
| CRM connection | Zoho CRM REST API v8 (self-client OAuth) | One service-level connection; see Section 4 |
| Data fetching | Zoho COQL (`executeCOQLQuery`) for list/joined views; standard REST for single-record CRUD | COQL supports cross-module joins and filters in one call — fewer round trips for the pipeline view |
| State/caching | React Query (TanStack Query) | Handles loading states, background refresh, and avoids hammering Zoho's rate limits |

## 3. Data Model (from your live Zoho org)

Pulled directly from your Zoho CRM's field metadata, so the UI maps to fields that actually exist rather than a generic CRM template.

### Deals (pipeline view — primary screen)
Key fields: `Deal_Name`, `Amount`, `Stage`, `Account_Name` (lookup), `Contact_Name` (lookup), `Closing_Date`, `Probability`, `Expected_Revenue` (read-only, calculated), `Next_Step`, `Lead_Source`, `Type`, `Description`, `Reason_For_Loss__s` (on Closed Lost).

Your Stage picklist (with built-in probabilities) is:
1. Qualification — 10%
2. Needs Analysis — 20%
3. Value Proposition — 40%
4. Identify Decision Makers — 60%
5. Proposal/Price Quote — 75%
6. Negotiation/Review — 90%
7. Closed Won — 100%
8. Closed Lost — 0%
9. Closed Lost to Competition — 0%

→ This maps directly to a kanban-style pipeline board with 7 open columns + 2 closed-lost variants, each column totaling Amount and Expected Revenue.

### Leads
Key fields: `First_Name`, `Last_Name`, `Company`, `Email`, `Phone`, `Mobile`, `Lead_Source`, `Lead_Status`, `Industry`, `Rating`, `Annual_Revenue`, `No_of_Employees`, `Description`, conversion fields (`Converted_Account`, `Converted_Contact`, `Converted_Deal`, `Converted__s`).

### Contacts
Key fields: `First_Name`, `Last_Name`, `Account_Name` (lookup), `Email`, `Phone`, `Mobile`, `Title`, `Department`, `Reporting_To` (lookup), full mailing/other address blocks.

### Accounts
Key fields: `Account_Name`, `Phone`, `Website`, `Industry`, `Account_Type`, `Ownership`, `Employees`, `Annual_Revenue`, `Parent_Account` (lookup), billing/shipping address blocks.

### Activities/Calls
Not yet pulled in detail — confirm at build time whether you log these as the `Calls` module (call-specific fields) or `Tasks`/`Events`. Recommend `Calls` if "log a call" is the primary action.

### Tasks (to-do / follow-up list — pulled from your live org)
Key fields: `Subject` (picklist: Email, Call, Meeting, Send Letter, Product Demo, or free text), `Due_Date`, `Status` (Not Started / In Progress / Completed / Deferred / Waiting for input), `Priority` (Highest/High/Normal/Low/Lowest), `What_Id` (lookup — the related Deal/Account/etc.), `Who_Id` (lookup — related Contact), `Description`, `Remind_At`.

This is a standard Zoho module, not a custom build — the app is exposing an existing structure, the same way it exposes Deals and Contacts. `What_Id` is what lets a team member open a Deal in the field and attach a to-do directly to it; toggling a checkbox in the UI is just a `Status` update to `Completed`.

## 4. Zoho Connection Setup (one-time, your side)

1. Go to the [Zoho API Console](https://api-console.zoho.com/) → create a **Self Client**.
2. Generate a grant token with the scopes: `ZohoCRM.modules.ALL`, `ZohoCRM.settings.fields.READ` (add `ZohoCRM.bulk.READ` if you later want exports).
3. Exchange the grant token for a **refresh token** (one-time call, documented in Zoho's self-client guide).
4. Store the refresh token, client ID, and client secret as environment variables in Vercel — never in the codebase.
5. The backend refreshes the short-lived access token automatically on each request cycle (standard OAuth2 refresh flow).

This is the only piece that has to happen outside the coding tool — it's an account-console setup, not code.

## 5. Roles & Permissions (v1)

| Role | View | Create Lead/Contact | Log Call | Edit Deal Stage | Manage users |
|---|---|---|---|---|---|
| **Admin** | All | Yes | Yes | Yes | Yes |
| **Member** | All | Yes | Yes | Own deals only* | No |

\* "Own" = deals where `Owner` matches the team member's mapped Zoho user, or where they're listed as the Contact's owner. Confirm at build time whether Zoho `Owner` should map 1:1 to app users, or whether the app tracks its own ownership separately.

Clerk handles role assignment; the API routes check role + ownership before any write call reaches Zoho.

## 6. Screens (v1)

1. **Login** — Clerk-hosted or embedded sign-in.
2. **Pipeline board** — Deals grouped by Stage, kanban columns, drag-to-update-stage (or a simpler dropdown if drag-and-drop is out of scope for v1), running Amount/Expected Revenue totals per column.
3. **Leads list** — searchable/filterable table, "New Lead" action.
4. **Contacts list** — searchable/filterable table, linked to Account, "New Contact" action.
5. **Accounts list** — searchable table, drill into an account to see its related Deals/Contacts.
6. **Log a Call** — quick-action form (subject, related Deal/Contact, notes, outcome) available from any record view.
7. **Record detail** (Deal/Lead/Contact/Account) — read view with an "Edit" affordance for authorized fields.
8. **To-do / follow-ups** — a checklist embedded on each Deal's detail view (its open Tasks), a quick-add form pre-filled with that Deal, a checkbox to mark complete, and a personal "My Tasks" view across all deals for the on-the-go use case.

## 7. Build Milestones

1. **Scaffold**: Next.js app on Vercel, Clerk auth wired up, empty shell deployed to a real URL.
2. **Read-only pipeline**: server route pulls live Deals via COQL, renders the kanban board with real data.
3. **Read views for Leads/Contacts/Accounts**: tables with search/filter.
4. **Write actions**: create Lead, create Contact, log a Call — each behind a confirmation step.
5. **Deal stage editing**: with role/ownership checks from Section 5.
6. **To-do/follow-ups**: Tasks list on Deal detail view, quick-add form, complete-toggle, and a cross-deal "My Tasks" view.
7. **Roles & polish**: Admin invite flow, mobile responsiveness pass, "Add to Home Screen" manifest/icons.
8. **Domain & rollout**: point `tools.thekandelagroup.com` at the Vercel deployment, invite the 4–10 users, walk through login + core actions.

## 8. Open Questions to Resolve Before/During Build

- Does `Owner` in Zoho already map cleanly to your team members, or does the app need its own ownership model layered on top?
- Should Activities be logged as `Calls`, `Tasks`, or both?
- Any custom fields/modules beyond the standard four that matter for v1, e.g., a `Buildings` module referenced in earlier discussion — not yet confirmed to exist in this Zoho org (see Section 9 note on org verification).
- Kanban drag-and-drop vs. simple stage dropdown for v1 — drag-and-drop is nicer but adds build time.
- Should a completed to-do disappear from view immediately, or stay visible (crossed out) briefly before being filtered out?

## 9. Zoho Org Verification Note

The field structure in Section 3 was pulled from the Zoho CRM org for Journey Office Builders (`rasala@excellentjob.com`, org `org935863482`). A spot-check confirmed real JOB relationships are present (e.g., a BECO Management contact), but at least one expected relationship (a United Bank account) was not found in this org. Before or during the build, confirm this is the complete, correct org — including whether a `Buildings` custom module exists here or in a different Zoho login/org — so the app is wired to the right data source from day one.

## 10. Hosting & Domain

- **Initial hosting**: `tools.thekandelagroup.com`, pointed at the Vercel deployment via a CNAME record added in your DNS provider, plus adding the domain in the Vercel project settings.
- **Planned migration**: eventually move to a domain under `excellentjob.com`. Because the app itself has no hardcoded domain dependencies (auth, API routes, and the Zoho OAuth redirect URI are the only domain-sensitive pieces), migrating later means: (1) adding the new domain in Vercel, (2) updating the OAuth redirect URI registered in the Zoho API Console to match, (3) updating the Clerk allowed-origins list, then (4) repointing DNS and retiring the old subdomain. No rebuild required.
- Build the OAuth redirect URI and Clerk configuration to read from an environment variable rather than a hardcoded string, so this migration is a config change, not a code change.

## 11. Handoff Notes

This scope is written to be portable: it names the real Zoho field/module structure so any tool (Claude Code, Antigravity, a contractor) can start from accurate data rather than a generic CRM template. The one piece that has to happen regardless of builder is the Zoho self-client setup in Section 4, since that's an account-level action only you can perform. Resolve the org-verification note in Section 9 before wiring in live data.
