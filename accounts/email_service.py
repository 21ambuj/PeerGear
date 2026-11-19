"""
PeerGear Email Service Module
Dispatches high-security OTP emails for campus identity verification.
Compatible with Gmail SMTP, university SMTP relays, or standard mail services.
"""

import os
import json
import logging
import threading
import time
import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives

logger = logging.getLogger(__name__)

# Debounce cache to prevent duplicate email dispatches within short intervals
_RECENT_DISPATCHES = {}
_DISPATCH_LOCK = threading.Lock()

def _send_worker(subject, text_content, html_content, from_email, recipient_email, reply_to_email):
    """
    Sends email using Resend HTTPS REST API (Port 443) if configured,
    with automatic fallback to Django SMTP backend.
    """
    # 1. Primary Cloud Delivery: Resend HTTPS API (Port 443 - never blocked by cloud firewalls)
    resend_key = getattr(settings, 'RESEND_API_KEY', '') or os.getenv('RESEND_API_KEY', '').strip()
    if resend_key:
        resend_from = getattr(settings, 'RESEND_FROM_EMAIL', '') or os.getenv('RESEND_FROM_EMAIL', 'PeerGear Campus <noreply@chatme.in>').strip()
        try:
            payload = {
                "from": resend_from,
                "to": [recipient_email],
                "subject": subject,
                "html": html_content,
                "text": text_content,
                "reply_to": reply_to_email
            }
            resp = requests.post(
                "https://api.resend.com/emails",
                headers={
                    "Authorization": f"Bearer {resend_key}",
                    "Content-Type": "application/json"
                },
                json=payload,
                timeout=12
            )
            if resp.status_code in (200, 201):
                resp_data = resp.json() if resp.text else {}
                email_id = resp_data.get('id', 'dispatched')
                logger.info(f"[RESEND SUCCESS] Dispatched OTP to {recipient_email} (ID: {email_id})")
                print(f"[RESEND SUCCESS] Delivered email to {recipient_email} via Resend HTTPS API (ID: {email_id})")
                return True
            else:
                logger.warning(f"[RESEND HTTP {resp.status_code}] {resp.text}")
                print(f"[RESEND NOTICE] Status {resp.status_code}: {resp.text}")
        except Exception as e:
            logger.error(f"[RESEND EXCEPTION] Failed to send via Resend HTTPS API: {e}")
            print(f"[RESEND ERROR] {e}")

    # 2. Fallback: Standard Django SMTP (for local development or unblocked SMTP environments)
    try:
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=from_email,
            to=[recipient_email],
            headers={
                "Reply-To": reply_to_email,
                "X-Priority": "1",
                "X-Mailer": "PeerGear Campus Mailer"
            }
        )
        msg.attach_alternative(html_content, "text/html")
        msg.send(fail_silently=False)
        logger.info(f"Successfully dispatched OTP verification email to {recipient_email}")
        print(f"[SMTP SUCCESS] Dispatched email to {recipient_email} via SMTP")
        return True
    except Exception as e:
        logger.warning(f"SMTP dispatch note for {recipient_email}: {e}")
        print(f"[SMTP NOTE] {e}")
        return False

def send_verification_email(recipient_email: str, otp: str, student_name: str = "Student", async_send: bool = True) -> bool:
    """
    Sends a styled verification email containing the 6-digit OTP code to the student's email.
    Debounces duplicate sends for the exact same email within 10 seconds.
    Runs asynchronously by default so the HTTP response is not delayed by SMTP handshakes.
    """
    now = time.time()
    with _DISPATCH_LOCK:
        # Prune old cache entries
        stale = [k for k, v in _RECENT_DISPATCHES.items() if now - v.get("timestamp", 0) > 60]
        for k in stale:
            _RECENT_DISPATCHES.pop(k, None)

        recent = _RECENT_DISPATCHES.get(recipient_email)
        if recent and (now - recent.get("timestamp", 0) < 10):
            # Same recipient within 10 seconds: debounce duplicate send
            logger.info(f"Debounced duplicate email dispatch to {recipient_email}")
            return True

        _RECENT_DISPATCHES[recipient_email] = {"timestamp": now, "otp": otp}

    subject = f"PeerGear Campus Verification Code: {otp}"
    from_email = settings.DEFAULT_FROM_EMAIL

    # Always log OTP in terminal so local testing / offline runs are verifiable
    print(f"\n==================================================================")
    print(f" [EMAIL DISPATCH] To: {recipient_email}")
    print(f" [SECURITY OTP]   Code: {otp} (Valid for 10 minutes)")
    print(f"==================================================================\n")

    # Plain text version
    text_content = f"""
Hello {student_name},

Welcome to PeerGear - Campus Resource Exchange & Renting Platform!

Your 6-digit campus identity verification code is: {otp}

(Requested for: {recipient_email})
This code is valid for 10 minutes. Please enter it on the website to verify your email ownership.
After verifying, you will be prompted to upload your student ID card (photo or PDF) to complete verification.

Notice: If this email landed in your Spam or Promotions folder, please mark it as 'Not Spam' or move it to your Primary Inbox so you receive critical equipment return notices.

If you did not request this code, please ignore this email.

Best regards,
PeerGear Campus Security Team
    """.strip()

    # Rich HTML Email Template
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {{ font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; }}
    .container {{ max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }}
    .header {{ background: linear-gradient(135deg, #4338ca 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }}
    .header h1 {{ margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }}
    .header p {{ margin: 8px 0 0; font-size: 13px; opacity: 0.9; }}
    .content {{ padding: 32px 28px; color: #1e293b; line-height: 1.6; }}
    .greeting {{ font-size: 16px; font-weight: 600; margin-bottom: 12px; }}
    .otp-box {{ background: #f1f5f9; border: 2px dashed #6366f1; border-radius: 16px; padding: 20px; text-align: center; margin: 24px 0; }}
    .otp-label {{ font-size: 11px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 6px; }}
    .otp-code {{ font-size: 38px; font-weight: 900; letter-spacing: 6px; color: #4338ca; font-family: 'Courier New', Courier, monospace; margin: 4px 0; user-select: all; -webkit-user-select: all; }}
    .otp-expiry {{ font-size: 12px; color: #e11d48; font-weight: 600; margin-top: 6px; }}
    .step-box {{ background: #f8fafc; border-left: 4px solid #6366f1; padding: 12px 16px; border-radius: 0 10px 10px 0; margin-top: 20px; font-size: 12px; color: #475569; }}
    .spam-notice {{ background: #fffbeb; border: 1px solid #fde68a; border-radius: 12px; padding: 12px; margin-top: 20px; font-size: 11px; color: #92400e; }}
    .footer {{ background: #f8fafc; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; }}
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>PeerGear Campus</h1>
      <p>College Peer-to-Peer Resource Exchange &amp; Renting</p>
    </div>
    <div class="content">
      <div class="greeting">Hello {student_name},</div>
      <p style="margin: 0 0 16px; font-size: 14px; color: #475569;">
        Please use the 6-digit verification code below to verify your email address (<strong>{recipient_email}</strong>):
      </p>

      <div class="otp-box">
        <div class="otp-label">Your 6-Digit Verification Code</div>
        <div class="otp-code">{otp}</div>
        <div class="otp-expiry">&#9201; Valid for 10 minutes only</div>
      </div>

      <div class="step-box">
        <strong>Next Step:</strong> Once you enter this code on the website, you will be prompted to upload your <strong>College ID Card (Photo or PDF)</strong> for campus identity verification.
      </div>

      <div class="spam-notice">
        <strong>Tip:</strong> If this email appeared in your Spam or Promotions folder, please mark it as <strong>'Not Spam'</strong> to receive equipment return alerts on time.
      </div>
    </div>
    <div class="footer">
      PeerGear Campus Security &bull; This is an automated email sent to {recipient_email}.
    </div>
  </div>
</body>
</html>
    """.strip()

    reply_to_email = getattr(settings, "EMAIL_HOST_USER", "chatiq.app@gmail.com")

    if async_send:
        t = threading.Thread(
            target=_send_worker,
            args=(subject, text_content, html_content, from_email, recipient_email, reply_to_email),
            daemon=True
        )
        t.start()
        return True
    else:
        _send_worker(subject, text_content, html_content, from_email, recipient_email, reply_to_email)
        return True
