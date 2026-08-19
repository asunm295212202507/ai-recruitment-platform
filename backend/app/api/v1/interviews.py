import os
import smtplib
import secrets
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from typing import Optional

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr

router = APIRouter()

# ── Gmail SMTP Config from Environment Variables ────────────────────────────
SMTP_EMAIL = os.getenv("SMTP_EMAIL", "")
SMTP_APP_PASSWORD = os.getenv("SMTP_APP_PASSWORD", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "https://ai-recruitment-platform-witv.onrender.com")

# ── Request Schema ───────────────────────────────────────────────────────────
class InterviewInviteRequest(BaseModel):
    candidate_name: str
    candidate_email: EmailStr
    candidate_id: str
    job_title: Optional[str] = "Open Role"
    company_name: Optional[str] = "TalentAI Enterprise"
    recruiter_name: Optional[str] = "Hiring Team"


def build_invite_email_html(candidate_name: str, job_title: str, company_name: str,
                             recruiter_name: str, interview_link: str) -> str:
    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Interview Invitation – {company_name}</title>
</head>
<body style="margin:0; padding:0; background-color:#0f0f13; font-family:'Segoe UI', Arial, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#0f0f13; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background:linear-gradient(145deg,#1a1a2e,#16213e); border-radius:16px; border:1px solid rgba(99,102,241,0.3); overflow:hidden; max-width:600px; width:100%;">
                    <!-- Header -->
                    <tr>
                        <td style="background:linear-gradient(135deg,#6366f1,#a855f7); padding:32px 40px; text-align:center;">
                            <div style="font-size:1.8rem; font-weight:800; color:#fff; letter-spacing:-0.5px;">
                                Talent<span style="color:#fbbf24;">AI</span> Enterprise
                            </div>
                            <div style="font-size:0.85rem; color:rgba(255,255,255,0.8); margin-top:4px;">AI-Powered Recruitment Platform</div>
                        </td>
                    </tr>
                    <!-- Body -->
                    <tr>
                        <td style="padding:40px 40px 32px;">
                            <h2 style="color:#e2e8f0; font-size:1.4rem; font-weight:700; margin:0 0 16px;">
                                You're Invited to an AI Interview 🎉
                            </h2>
                            <p style="color:#94a3b8; font-size:0.95rem; line-height:1.7; margin:0 0 20px;">
                                Hi <strong style="color:#e2e8f0;">{candidate_name}</strong>,
                            </p>
                            <p style="color:#94a3b8; font-size:0.95rem; line-height:1.7; margin:0 0 20px;">
                                Congratulations! After reviewing your profile, <strong style="color:#e2e8f0;">{company_name}</strong> would like to invite you to complete an AI-powered screening interview for the following role:
                            </p>
                            <!-- Role badge -->
                            <div style="background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.3); border-radius:12px; padding:16px 24px; margin:0 0 28px; text-align:center;">
                                <div style="font-size:0.78rem; color:#a5b4fc; font-weight:600; text-transform:uppercase; letter-spacing:1px; margin-bottom:6px;">Position Applied For</div>
                                <div style="font-size:1.2rem; font-weight:700; color:#e2e8f0;">{job_title}</div>
                            </div>
                            <p style="color:#94a3b8; font-size:0.9rem; line-height:1.7; margin:0 0 28px;">
                                The interview is conducted by <strong style="color:#e2e8f0;">TalentAI Recruitment Host</strong>, an AI interviewer. It consists of 4–6 questions and takes approximately <strong style="color:#e2e8f0;">10–15 minutes</strong> to complete. You can take it from any device at any time.
                            </p>
                            <!-- CTA Button -->
                            <div style="text-align:center; margin:32px 0;">
                                <a href="{interview_link}" style="display:inline-block; background:linear-gradient(135deg,#6366f1,#a855f7); color:#fff; text-decoration:none; font-weight:700; font-size:1rem; padding:16px 40px; border-radius:12px; letter-spacing:0.3px;">
                                    Start My Interview →
                                </a>
                            </div>
                            <p style="color:#64748b; font-size:0.82rem; line-height:1.6; margin:0 0 8px;">
                                If the button doesn't work, copy and paste this link into your browser:
                            </p>
                            <p style="color:#6366f1; font-size:0.82rem; word-break:break-all; margin:0 0 32px;">
                                {interview_link}
                            </p>
                            <hr style="border:none; border-top:1px solid rgba(99,102,241,0.2); margin:0 0 24px;">
                            <p style="color:#64748b; font-size:0.82rem; line-height:1.6; margin:0;">
                                Best of luck! If you have any questions, please reach out to <strong style="color:#94a3b8;">{recruiter_name}</strong> at <strong style="color:#94a3b8;">{SMTP_EMAIL}</strong>.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td style="background:rgba(0,0,0,0.3); padding:20px 40px; text-align:center;">
                            <p style="color:#475569; font-size:0.78rem; margin:0;">
                                © 2026 {company_name} · Powered by TalentAI Enterprise · NYC Local Law 144 Compliant
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
"""


@router.post("/send-invite")
async def send_interview_invite(payload: InterviewInviteRequest):
    """
    Generates a unique, secure interview token and sends an HTML invitation
    email to the candidate via Gmail SMTP.
    """
    if not SMTP_EMAIL or not SMTP_APP_PASSWORD:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Email service not configured. Please set SMTP_EMAIL and SMTP_APP_PASSWORD environment variables on your deployment."
        )

    # Generate a unique secure token for this interview session
    interview_token = secrets.token_urlsafe(32)

    # Build the direct deep-link to the interview page
    interview_link = (
        f"{FRONTEND_URL}/#interview"
        f"?token={interview_token}"
        f"&candidate={payload.candidate_id}"
        f"&name={payload.candidate_name.replace(' ', '+')}"
        f"&role={payload.job_title.replace(' ', '+')}"
    )

    # Compose the email
    msg = MIMEMultipart("alternative")
    msg["Subject"] = f"Interview Invitation: {payload.job_title} at {payload.company_name}"
    msg["From"] = f"{payload.company_name} Hiring Team <{SMTP_EMAIL}>"
    msg["To"] = payload.candidate_email

    html_body = build_invite_email_html(
        candidate_name=payload.candidate_name,
        job_title=payload.job_title,
        company_name=payload.company_name,
        recruiter_name=payload.recruiter_name,
        interview_link=interview_link
    )
    msg.attach(MIMEText(html_body, "html"))

    # Send via Gmail SMTP
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(SMTP_EMAIL, SMTP_APP_PASSWORD)
            server.sendmail(SMTP_EMAIL, payload.candidate_email, msg.as_string())
    except smtplib.SMTPAuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Gmail authentication failed. Please verify your SMTP_EMAIL and SMTP_APP_PASSWORD are correct."
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send interview invitation email: {str(e)}"
        )

    return {
        "status": "sent",
        "message": f"Interview invitation successfully sent to {payload.candidate_email}.",
        "candidate_id": payload.candidate_id,
        "interview_token": interview_token,
        "interview_link": interview_link
    }
