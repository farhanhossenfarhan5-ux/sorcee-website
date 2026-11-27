# SORCEE Control Dashboard — MVP

This is a separate dashboard folder, independent from the main SORCEE website pages.

## Preview URL
After GitHub Pages publishes the repository, visit:
https://farhanhossenfarhan5-ux.github.io/sorcee-website/sorcee-control/

## Important security status
This first version is a static UI prototype. It does NOT have server-side authentication, database persistence, or real publish/send integrations. Do not treat it as private. Do not put API keys, passwords, tokens, or buyer personal data in it. GitHub Pages is public unless protected by an external access-control layer.

Approval buttons only change the visible demo state in the browser. They do not publish posts or send email. Live operations remain disabled. The actual agent should keep DRY_RUN=true.

## Next production steps
1. Deploy the dashboard behind server-side authentication (for example, a small backend with secure sessions).
2. Store approval records server-side and require an authenticated approver.
3. Connect Meta publishing and SMTP only through server-side secrets.
4. Have GitHub Actions read only server-approved actions; preserve audit logs and a kill switch.
5. Test in dry-run before enabling any live action.

The main SORCEE website files are not modified by this dashboard addition.