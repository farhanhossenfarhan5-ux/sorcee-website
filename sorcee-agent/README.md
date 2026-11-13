# SORCEE AI Agent — MVP

This agent runs separately from the SORCEE static website. It does not edit website pages.

## Safe defaults
- `DRY_RUN=true`: no real posts or emails are sent.
- Facebook and Instagram publishing require Meta API credentials and approved permissions.
- Email is limited to explicitly approved leads (maximum 3 per run by default). Never add purchased, scraped, or unconsented lists. Honour opt-outs.
- LinkedIn output is a draft only. It does not scrape LinkedIn or automate connection requests.
- No AI provider key is required for this first MVP; it creates a simple daily post from reviewed templates.

## GitHub Actions
The workflow runs daily at 03:00 UTC (09:00 Bangladesh time) and can also be started manually.
It writes reports and draft content to this folder.

## Optional GitHub Actions secrets
Add these under Repository → Settings → Secrets and variables → Actions:
- `META_PAGE_ID`, `META_PAGE_ACCESS_TOKEN` — Facebook Page publishing.
- `INSTAGRAM_BUSINESS_ACCOUNT_ID`, `INSTAGRAM_IMAGE_URL` — Instagram professional account and a publicly accessible image URL.
- `META_GRAPH_VERSION` — a currently supported Graph API version (for example, confirm the version in Meta's current documentation).
- `SMTP_HOST`, `SMTP_PORT` (usually 587), `SMTP_USER`, `SMTP_PASSWORD`, `SMTP_FROM` — business mailbox SMTP details.
- `LEADS_CSV` — optional Base64-encoded CSV. Use this rather than committing personal contact details to a public repository. Columns: name,email,approved,opted_out. Only rows with approved=yes are eligible.

Set repository variable `SORCEE_DRY_RUN` to `false` only after you have configured credentials, tested everything, and reviewed the applicable platform policies. If absent, the workflow remains in dry-run mode.

## Manual local test
```bash
python agent.py
```

## Important
GitHub Actions minutes and platform API access are subject to account limits and provider approval. This MVP is not a fully autonomous sales system and does not guarantee reach, leads, or sales.
