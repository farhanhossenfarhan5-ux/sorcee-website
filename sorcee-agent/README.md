# SORCEE AI Agent — MVP

This agent runs separately from the SORCEE static website. It does not edit website pages.

## Safe defaults
- `DRY_RUN=true`: no real posts or emails are sent.
- Facebook and Instagram publishing require Meta API credentials and approved permissions.
- Email is limited to explicitly approved leads (maximum 3 per run by default). Never add purchased, scraped, or unconsented lists. Honour opt-outs.
- LinkedIn output is a draft only. It does not scrape LinkedIn or automate connection requests.
- Optional Gemini API support generates a daily caption. If GEMINI_API_KEY is absent or the request fails, reviewed templates are used. The primary model is configurable with GEMINI_MODEL (default: gemini-3.8-flash). If it fails, the agent tries GEMINI_BACKUP_MODEL (default: gemini-3.5-flash-lite) before using a reviewed fallback caption.

## GitHub Actions
The workflow runs daily at 03:00 UTC (09:00 Bangladesh time) and can also be started manually.
It writes reports and draft content to this folder.

## Optional GitHub Actions secrets
- GEMINI_API_KEY — Google AI Studio API key for Gemini content generation. Keep it in GitHub Secrets; never commit it or share it in chat. Free-tier availability and quotas depend on the selected model and Google account/project. Google states that free-tier content may be used to improve its products, so do not send confidential customer or supplier information.
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
