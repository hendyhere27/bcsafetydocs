# bcsafetydocs-free-docs

Cloudflare Worker behind the free-document download forms on bcsafetydocs.com.
Route: `bcsafetydocs.com/api/*` (path-based, coexists with the Pages-served
static site).

Each free-document page POSTs `{ email, product }` to `/api/free-download`.
The worker:

1. validates the email and the product slug (`PRODUCTS` in `worker.js`),
2. emails the download link via Resend (from `info@bcsafetydocs.com`),
3. records the signup in D1 (`bcsafetydocs-leads`, table `signups`).

Step 3 is best-effort — a database failure is logged but never fails the
user's download.

## Why leads live in D1 and not directly in Resend

`RESEND_API_KEY` is a **Sending-access** key (it can only send email), and
Resend rejects every Contacts API call from such a key with
`401 restricted_api_key`. Resend would not issue this account a key with
contacts permission, so the worker can't file contacts itself. D1 is the
system of record; leads are filed into Resend's **General** segment by the
sync step below. (The original version of this worker called the Contacts
API directly; the 401 was swallowed by its best-effort error handling, so no
signup was filed from 2026-09-06 until this was found on 2026-10-05. If a
contacts-capable key ever becomes available, the direct call can come back —
the working request shape is `POST /contacts` with
`segments: [{ "id": "<segment id>" }]` and `properties`.)

## Table: `signups`

One row per **download** (so repeat downloads keep their history; unique
leads = `DISTINCT email`). Emails are stored lowercased. `synced` is `0`
until the email has been filed into Resend's General segment.

See `schema.sql`. Apply with:

```
wrangler d1 execute bcsafetydocs-leads --remote --file=schema.sql
```

## Viewing leads

```
wrangler d1 execute bcsafetydocs-leads --remote --command "SELECT email, product, created_at, synced FROM signups ORDER BY id DESC LIMIT 50"
```

Downloads per product:

```
wrangler d1 execute bcsafetydocs-leads --remote --command "SELECT product, COUNT(*) AS downloads, COUNT(DISTINCT email) AS people FROM signups GROUP BY product ORDER BY downloads DESC"
```

## Sync: file new leads into Resend's General segment

Run whenever you want the list current (e.g. before sending to it). Resend
side: segment **General**, id `f0329a1b-f3c8-4497-af7c-8db460dbbabe`;
contact properties `lead_source` (always `free_download`) and
`last_free_product` (string) — both already defined in Resend.

1. Roll up unsynced people, and note the highest row id:

   ```
   SELECT s.email,
          (SELECT product FROM signups x WHERE x.email = s.email ORDER BY x.id DESC LIMIT 1) AS last_product,
          COUNT(*) AS downloads,
          MAX(s.id) AS max_id
   FROM signups s WHERE s.synced = 0 GROUP BY s.email ORDER BY s.email;
   ```

2. For each row, create the contact in Resend with segment General and
   properties `{ lead_source: "free_download", last_free_product: <last_product> }`.
   Resend's create-contact **upserts** (verified: repeating an email updates
   the properties rather than duplicating), so re-running is safe. This can
   be done with the Resend MCP (`create-contact` with `segmentIds`), or by
   importing a CSV in the Resend dashboard.

3. Mark them synced, using the **highest `max_id` from step 1** so signups
   that arrived during the sync aren't wrongly marked:

   ```
   UPDATE signups SET synced = 1 WHERE id <= <max_id> AND synced = 0;
   ```

Consent: the form tells people "We'll email the download link right away.
We'll also occasionally send WorkSafeBC compliance updates relevant to your
templates — unsubscribe anytime." That is what permits filing them to a
marketing segment; don't file anyone who didn't submit that form.

## Adding a new free document

Add an entry to `PRODUCTS` in `worker.js` (slug → title + filename on
bcsafetydocs.com), drop the `.docx` in the site repo root, build the page
(see an existing one like `loto.html`), then `wrangler deploy`.

## Secrets

| Secret | Purpose |
|---|---|
| `RESEND_API_KEY` | Sending-access Resend key — sends the download email |
| `RESEND_CONTACTS_API_KEY` | **Unused.** Left over from the attempt to call the Contacts API directly; can be removed with `wrangler secret delete RESEND_CONTACTS_API_KEY` |

## Deploy

```
wrangler deploy
```

(Bindings: `DB` → D1 `bcsafetydocs-leads`, configured in `wrangler.jsonc`.)
