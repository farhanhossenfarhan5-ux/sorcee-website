#!/usr/bin/env python3
"""SORCEE daily marketing assistant. Safe by default: DRY_RUN=true."""
import csv, datetime as dt, hashlib, json, os, smtplib, ssl, time, urllib.parse, urllib.request
from email.message import EmailMessage
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "output"
OUT.mkdir(exist_ok=True)
TODAY = dt.datetime.now(dt.timezone.utc).date().isoformat()
DRY_RUN = os.getenv("DRY_RUN", "true").lower() != "false"
MAX_EMAILS = min(int(os.getenv("MAX_EMAILS_PER_RUN", "3")), 10)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.8-flash").strip()

POSTS = [
"""SORCEE connects global apparel brands with trusted manufacturing partners in Bangladesh.

Looking for a reliable sourcing partner for your next apparel order? We coordinate production to your requirements, with a minimum order quantity of 50 pieces.

Tell us what you need: https://farhanhossenfarhan5-ux.github.io/sorcee-website/

#SORCEE #ApparelSourcing #MadeInBangladesh #B2B""",
"""Your apparel idea deserves a dependable production partner.

SORCEE helps international buyers coordinate apparel production with local factories in Bangladesh. Share your product, specifications and quantity (MOQ: 50 pieces).

Start here: https://farhanhossenfarhan5-ux.github.io/sorcee-website/request-a-quote.html

#SORCEE #GarmentSourcing #Bangladesh"""
]

def request(url, data=None, headers=None):
    body = urllib.parse.urlencode(data).encode() if data is not None else None
    req = urllib.request.Request(url, data=body, headers=headers or {})
    with urllib.request.urlopen(req, timeout=30) as res:
        return json.loads(res.read().decode())

def facebook_publish(text):
    token, page = os.getenv("META_PAGE_ACCESS_TOKEN"), os.getenv("META_PAGE_ID")
    if not token or not page:
        return "skipped: Facebook credentials not configured"
    if DRY_RUN:
        return "dry-run: Facebook post prepared"
    request(f"https://graph.facebook.com/{os.getenv('META_GRAPH_VERSION','v23.0')}/{page}/feed",
            {"message": text, "access_token": token})
    return "published"

def instagram_publish(text):
    token, account, image = (os.getenv("META_PAGE_ACCESS_TOKEN"),
                             os.getenv("INSTAGRAM_BUSINESS_ACCOUNT_ID"),
                             os.getenv("INSTAGRAM_IMAGE_URL"))
    if not token or not account or not image:
        return "skipped: Instagram account token or public image URL missing"
    if DRY_RUN:
        return "dry-run: Instagram post prepared (image URL configured)"
    version = os.getenv("META_GRAPH_VERSION", "v23.0")
    container = request(f"https://graph.facebook.com/{version}/{account}/media",
                        {"image_url": image, "caption": text, "access_token": token})
    request(f"https://graph.facebook.com/{version}/{account}/media_publish",
            {"creation_id": container["id"], "access_token": token})
    return "published"

def load_leads():
    raw = os.getenv("LEADS_CSV")
    if raw:
        import base64
        raw = base64.b64decode(raw).decode("utf-8-sig")
        rows = list(csv.DictReader(raw.splitlines()))
    else:
        path = ROOT / "leads.csv"
        rows = list(csv.DictReader(path.open(encoding="utf-8-sig"))) if path.exists() else []
    return rows

def send_approved_emails():
    rows = load_leads()
    approved = [r for r in rows if r.get("approved","").strip().lower()=="yes"
                and r.get("opted_out","").strip().lower() not in ("yes","true","1")
                and r.get("email","").strip()]
    approved = approved[:MAX_EMAILS]
    host, user, password = os.getenv("SMTP_HOST"), os.getenv("SMTP_USER"), os.getenv("SMTP_PASSWORD")
    sender = os.getenv("SMTP_FROM", user or "")
    sent, status = 0, []
    for row in approved:
        email = row["email"].strip()
        key = hashlib.sha256(email.lower().encode()).hexdigest()
        log = OUT / "sent_hashes.json"
        old = json.loads(log.read_text()) if log.exists() else []
        if key in old:
            status.append("skipped duplicate approved lead")
            continue
        subject = "Apparel sourcing support from SORCEE"
        body = (f"Hello {row.get('name','there') or 'there'},\n\n"
                "I’m reaching out from SORCEE. We coordinate apparel production with "
                "manufacturing partners in Bangladesh for international buyers. Our MOQ is 50 pieces.\n\n"
                "If this is relevant to your business, you can learn more at https://farhanhossenfarhan5-ux.github.io/sorcee-website/ "
                "or reply to this email. If you prefer not to receive further messages, reply "
                "with 'unsubscribe'.\n\nSORCEE Team")
        if DRY_RUN:
            status.append("dry-run: approved email prepared")
            continue
        if not all((host,user,password,sender)):
            status.append("skipped: SMTP secrets missing")
            break
        msg=EmailMessage(); msg["From"]=sender; msg["To"]=email; msg["Subject"]=subject; msg.set_content(body)
        with smtplib.SMTP(host, int(os.getenv("SMTP_PORT","587")), timeout=30) as smtp:
            smtp.starttls(context=ssl.create_default_context()); smtp.login(user,password); smtp.send_message(msg)
        old.append(key); log.write_text(json.dumps(old))
        sent += 1; status.append("sent one approved email")
    return sent, status

def generate_ai_post():
    if not GEMINI_API_KEY:
        return None, 'fallback: GEMINI_API_KEY not configured'
    prompt = (
        'Write one polished English social-media caption for SORCEE, a Bangladesh-based '
        'B2B apparel sourcing coordinator connecting global brands with local factories. '
        'MOQ is 50 pieces. SORCEE coordinates sourcing and production; do not claim it owns '
        'factories. Do not invent certifications, prices, delivery times, client names, '
        'factory capabilities, guarantees, or shipping terms. Keep it under 110 words, '
        'include a clear invitation to request a quote, the exact URL '
        'https://farhanhossenfarhan5-ux.github.io/sorcee-website/request-a-quote.html '
        'and 3-5 relevant hashtags. Return only the caption.'
    )
    url = ('https://generativelanguage.googleapis.com/v1beta/models/' +
           urllib.parse.quote(GEMINI_MODEL, safe='') + ':generateContent?key=' +
           urllib.parse.quote(GEMINI_API_KEY))
    payload = json.dumps({'contents': [{'parts': [{'text': prompt}]}],
        'generationConfig': {'temperature': 0.7, 'maxOutputTokens': 220}}).encode('utf-8')
    req = urllib.request.Request(url, data=payload,
        headers={'Content-Type': 'application/json'}, method='POST')
    last_error = None
    # Retry transient network/time-out failures before falling back to a reviewed caption.
    for attempt in range(1, 4):
        try:
            with urllib.request.urlopen(req, timeout=90) as response:
                data = json.loads(response.read().decode('utf-8'))
            generated = data['candidates'][0]['content']['parts'][0]['text'].strip()
            if not generated:
                raise ValueError('Gemini returned an empty caption')
            return generated, 'Gemini generated content using ' + GEMINI_MODEL
        except Exception as exc:
            last_error = exc
            print('Gemini attempt ' + str(attempt) + ' failed: ' + type(exc).__name__)
            # Do not retry permanent API/authentication errors.
            if isinstance(exc, urllib.error.HTTPError) and exc.code not in (408, 429, 500, 502, 503, 504):
                break
            if attempt < 3:
                time.sleep(5 * attempt)
    print('Gemini generation failed; using reviewed fallback templates: ' + str(last_error))
    return None, 'fallback: Gemini request failed (' + type(last_error).__name__ + ')'

def main():
    post, ai_status = generate_ai_post()
    if post is None:
        post = POSTS[dt.date.today().toordinal() % len(POSTS)]
    (OUT/"social-post.txt").write_text(post+"\n", encoding="utf-8")
    fb, ig = facebook_publish(post), instagram_publish(post)
    email_count, email_status = send_approved_emails()
    (OUT/"linkedin-draft.txt").write_text(
        "LinkedIn post draft (review and publish manually):\n\n"+post+"\n\n"
        "Connection requests are not automated. Use LinkedIn's approved interface and respect its limits.\n",
        encoding="utf-8")
    report = [
        f"# SORCEE Daily Agent Report — {TODAY}", "",
        f"- Mode: {'DRY RUN (no messages sent)' if DRY_RUN else 'LIVE'}",
        "- Website files changed: no",
        f"- AI: {ai_status}",
        f"- Facebook: {fb}", f"- Instagram: {ig}",
        f"- Approved emails sent: {email_count}",
        f"- Email processing: {'; '.join(email_status) if email_status else 'no approved leads'}",
        "- LinkedIn: draft created; no automated connection requests",
        "- Next step: review output/social-post.txt and output/linkedin-draft.txt",
    ]
    (OUT/f"report-{TODAY}.md").write_text("\n".join(report)+"\n", encoding="utf-8")
    print("\n".join(report))

if __name__ == "__main__":
    main()
