const path = require('path');
const express = require('express');
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from root directory
app.use(express.static(path.join(__dirname)));

// Root redirect to main site index
app.get('/', (req, res, next) => {
  res.redirect('/exact-ethyra-site-code/index.html');
});

// Helper to configure Gmail SMTP Transporter
function getTransporter() {
  dotenv.config({ override: true }); // Refresh from .env so updating the file does not require a server restart
  const user = (process.env.GMAIL_USER || process.env.SMTP_USER || '').trim();
  const pass = (process.env.GMAIL_APP_PASS || process.env.SMTP_PASS || '').replace(/\s+/g, '');

  const isPlaceholder = !user || !pass || user.includes('your-email@') || pass.includes('your-16-char');

  if (isPlaceholder) {
    return {
      transporter: null,
      configured: false,
      user,
      reason: 'Please configure your actual Gmail address and 16-character Google App Password in the .env file.'
    };
  }

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user,
      pass
    }
  });

  return {
    transporter,
    configured: true,
    user
  };
}

// API Health / Status check
app.get('/api/smtp-status', (req, res) => {
  const { configured, user } = getTransporter();
  res.json({
    status: 'ok',
    smtpConfigured: configured,
    configuredUser: user ? user.replace(/(.{2})(.*)(@.*)/, '$1***$3') : null
  });
});

// Helper to escape HTML characters
function escapeHtml(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// API: Register for Webinar Announcements
app.post('/api/register-webinar', async (req, res) => {
  try {
    const { name, email, phone, context, webinarTitle: customTitle, webinarDate: customDate, webinarTime: customTime } = req.body;

    if (!email || !email.includes('@')) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid corporate or professional email address.'
      });
    }

    const { transporter, configured, user, reason } = getTransporter();

    if (!configured) {
      console.warn('⚠️ SMTP credentials not configured in .env');
      return res.status(500).json({
        success: false,
        error: reason || 'Google App Password credentials are not configured in .env. Please set GMAIL_USER and GMAIL_APP_PASS.'
      });
    }

    // Template Variable Resolution
    const participantName = (name && name.trim()) ? name.trim() : 'Participant';
    const webinarTitle = (customTitle && customTitle.trim())
      || (context && context.trim() && context !== 'Upcoming Webinars' && context !== 'Webinar Registration' ? context.trim() : null)
      || 'Beyond the Static Report: Designing Dynamic M&E Frameworks for Scalable Social Impact';
    const webinarDate = (customDate && customDate.trim()) || 'Thursday, November 12, 2026';
    const webinarTime = (customTime && customTime.trim()) || '4:00 PM – 5:00 PM IST';
    const websiteUrl = (process.env.WEBSITE_URL || 'https://ethyra.com').trim();
    const contactEmail = (process.env.CONTACT_EMAIL || 'contact@ethyra.com').trim();

    // Plain text email matching the exact requested format
    const textEmail = `
Dear ${participantName},

Greetings from Ethyra Consulting Services!

Thank you for registering for our upcoming webinar. We are pleased to confirm that your registration has been successfully received.

Webinar Details

- Webinar Title: ${webinarTitle}
- Date: ${webinarDate}
- Time: ${webinarTime}
- Mode: Online

The webinar joining link and any relevant session instructions will be shared with your registered email address one day prior to the scheduled session.

We encourage you to keep an eye on your inbox for further updates.

Thank you for your interest in our knowledge-sharing initiatives. We look forward to your participation.

Best regards,
Team Ethyra
Ethyra Consulting Services
${websiteUrl}
${contactEmail}
`.trim();

    // Executive, responsive HTML template matching the exact content
    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ethyra Consulting - Webinar Registration</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 40px 15px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" max-width="600" cellspacing="0" cellpadding="0" border="0" style="max-width: 600px; background-color: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Header Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #06090e 0%, #0a2540 100%); padding: 32px 36px; border-bottom: 3px solid #009ae0;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td>
                    <div style="font-size: 11px; font-weight: 700; letter-spacing: 2.5px; text-transform: uppercase; color: #38bdf8; margin-bottom: 6px;">
                      ETHYRA CONSULTING SERVICES
                    </div>
                    <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.4px; line-height: 1.3;">
                      Webinar Registration Confirmed
                    </h1>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body Content -->
          <tr>
            <td style="padding: 36px 36px 28px;">
              <p style="margin: 0 0 16px; font-size: 15.5px; line-height: 1.6; color: #0f172a;">
                Dear ${escapeHtml(participantName)},
              </p>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                Greetings from Ethyra Consulting Services!
              </p>

              <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #334155;">
                Thank you for registering for our upcoming webinar. We are pleased to confirm that your registration has been successfully received.
              </p>

              <!-- Webinar Details Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-left: 4px solid #002c8b; border-radius: 8px; margin: 24px 0; font-size: 14.5px;">
                <tr>
                  <td style="padding: 20px 24px;">
                    <div style="font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 12px; letter-spacing: 0.3px;">
                      Webinar Details
                    </div>
                    <ul style="margin: 0; padding-left: 18px; color: #334155; line-height: 1.8;">
                      <li style="margin-bottom: 6px;"><strong>Webinar Title:</strong> ${escapeHtml(webinarTitle)}</li>
                      <li style="margin-bottom: 6px;"><strong>Date:</strong> ${escapeHtml(webinarDate)}</li>
                      <li style="margin-bottom: 6px;"><strong>Time:</strong> ${escapeHtml(webinarTime)}</li>
                      <li><strong>Mode:</strong> Online</li>
                    </ul>
                  </td>
                </tr>
              </table>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                The webinar joining link and any relevant session instructions will be shared with your registered email address one day prior to the scheduled session.
              </p>

              <p style="margin: 0 0 16px; font-size: 15px; line-height: 1.6; color: #334155;">
                We encourage you to keep an eye on your inbox for further updates.
              </p>

              <p style="margin: 0 0 28px; font-size: 15px; line-height: 1.6; color: #334155;">
                Thank you for your interest in our knowledge-sharing initiatives. We look forward to your participation.
              </p>

              <p style="margin: 0 0 4px; font-size: 15px; line-height: 1.6; color: #334155;">
                Best regards,
              </p>
              <p style="margin: 0; font-size: 15px; line-height: 1.5; color: #0f172a;">
                <strong>Team Ethyra</strong><br>
                Ethyra Consulting Services<br>
                <a href="${escapeHtml(websiteUrl)}" style="color: #009ae0; text-decoration: none;">${escapeHtml(websiteUrl)}</a><br>
                <a href="mailto:${escapeHtml(contactEmail)}" style="color: #009ae0; text-decoration: none;">${escapeHtml(contactEmail)}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #06090e; padding: 20px 36px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5; border-top: 1px solid #1e293b;">
              &copy; 2026 Ethyra Consulting Services. All rights reserved.
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`.trim();

    // Send Mail
    const info = await transporter.sendMail({
      from: `"Ethyra Consulting Services" <${user}>`,
      to: email,
      subject: `Webinar Registration Confirmed: ${webinarTitle} – Ethyra Consulting Services`,
      text: textEmail,
      html: htmlEmail
    });

    console.log(`✓ Webinar registration confirmation sent to ${email}. Message ID: ${info.messageId}`);

    return res.json({
      success: true,
      message: `A detailed confirmation email has been sent to ${email}.`,
      messageId: info.messageId
    });

  } catch (err) {
    console.error('Error sending registration email:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Failed to send registration email. Please check SMTP configuration.'
    });
  }
});

// Rate Limiter for Inbound Submissions
const rateLimitMap = new Map();
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_REQUESTS_PER_WINDOW = 5;

function isRateLimited(ip) {
  const now = Date.now();
  const records = rateLimitMap.get(ip) || [];
  const recent = records.filter(ts => now - ts < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return false;
}

// API: Suggest a Topic for Ethyra Webinars
app.post('/api/suggest-topic', async (req, res) => {
  try {
    const clientIp = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';

    // 1. Rate Limiting Check
    if (isRateLimited(clientIp)) {
      return res.status(429).json({
        success: false,
        error: 'Too many submissions received from this network. Please wait a few minutes before trying again.'
      });
    }

    const { name, email, idea, _hp_topic } = req.body;

    // 2. Honeypot Spam Protection
    if (_hp_topic && _hp_topic.trim().length > 0) {
      console.warn(`Spam bot caught via honeypot from IP: ${clientIp}`);
      return res.json({
        success: true,
        message: 'Thank you for your suggestion!'
      });
    }

    // 3. Server-side Validation
    const cleanName = (typeof name === 'string') ? name.trim() : '';
    const cleanEmail = (typeof email === 'string') ? email.trim() : '';
    const cleanIdea = (typeof idea === 'string') ? idea.trim() : '';

    if (!cleanName || cleanName.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid name (up to 100 characters).'
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!cleanEmail || !emailRegex.test(cleanEmail) || cleanEmail.length > 150) {
      return res.status(400).json({
        success: false,
        error: 'Please provide a valid email address.'
      });
    }

    if (!cleanIdea || cleanIdea.length < 10 || cleanIdea.length > 3000) {
      return res.status(400).json({
        success: false,
        error: 'Please share a topic idea between 10 and 3,000 characters.'
      });
    }

    // 4. Verify Transporter Configuration
    const { transporter, configured, user, reason } = getTransporter();

    if (!configured) {
      console.warn('⚠️ SMTP credentials not configured in .env');
      return res.status(500).json({
        success: false,
        error: reason || 'Google App Password credentials are not configured in .env.'
      });
    }

    // 5. Configurable Recipient (single config value)
    const recipient = (process.env.SUGGESTION_RECIPIENT_EMAIL || process.env.GMAIL_USER || 'stevejesa24@gmail.com').trim();

    // 6. Topic Summary for Subject Line
    const topicSnippet = cleanIdea.replace(/[\r\n\t]+/g, ' ').slice(0, 50).trim();
    const subject = `New Topic Suggestion – ${topicSnippet}${cleanIdea.length > 50 ? '...' : ''}`;

    const submittedAt = new Date().toLocaleString('en-US', {
      dateStyle: 'full',
      timeStyle: 'medium',
      timeZone: 'Asia/Kolkata'
    }) + ' (IST)';

    // 7. Executive HTML Template
    const safeName = cleanName.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const safeEmail = cleanEmail.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const formattedIdea = cleanIdea
      .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
      .replace(/\r?\n\r?\n/g, '</p><p style="margin: 0 0 12px; line-height: 1.6;">')
      .replace(/\r?\n/g, '<br>');

    const htmlEmail = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>New Webinar Topic Suggestion</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f1f5f9; padding: 36px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" max-width="640" cellspacing="0" cellpadding="0" border="0" style="max-width: 640px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          
          <!-- Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #06090e 0%, #0a2540 100%); padding: 32px 36px; border-bottom: 3px solid #009ae0;">
              <div style="font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #38bdf8; margin-bottom: 6px;">
                ETHYRA CONSULTING SERVICES
              </div>
              <h1 style="margin: 0; font-size: 22px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                New Webinar Topic Suggestion
              </h1>
              <p style="margin: 6px 0 0; font-size: 13.5px; color: #94a3b8;">
                Inbound proposal submitted from the Webinar Portal
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 36px;">
              <!-- Metadata Table -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Submitter Name</span><br>
                    <strong style="font-size: 15px; color: #0f172a;">${safeName}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #e2e8f0;">
                    <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Email Address (Reply-To)</span><br>
                    <a href="mailto:${safeEmail}" style="font-size: 15px; color: #009ae0; text-decoration: none; font-weight: 600;">${safeEmail}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px;">
                    <span style="font-size: 11.5px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #64748b;">Submitted At</span><br>
                    <span style="font-size: 13.5px; color: #334155;">${submittedAt}</span>
                  </td>
                </tr>
              </table>

              <!-- Suggested Topic Idea Block -->
              <div style="margin-bottom: 24px;">
                <h3 style="margin: 0 0 12px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #0f172a;">
                  Proposed Topic / Collaboration Idea:
                </h3>
                <div style="background-color: #ffffff; border-left: 4px solid #002c8b; border: 1px solid #e2e8f0; border-left-width: 4px; border-radius: 8px; padding: 18px 20px; font-size: 14.5px; line-height: 1.6; color: #1e293b;">
                  <p style="margin: 0 0 12px; line-height: 1.6;">${formattedIdea}</p>
                </div>
              </div>

              <!-- Reply Action Hint -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #f0fdf4; border-radius: 8px; border: 1px solid #bbf7d0;">
                <tr>
                  <td style="padding: 14px 18px; font-size: 13px; color: #166534; line-height: 1.5;">
                    💡 <strong>Direct Reply Enabled:</strong> You can click <em>Reply</em> in your email client to respond directly to <strong>${safeName}</strong> at <strong>${safeEmail}</strong>.
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #06090e; padding: 20px 36px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.5;">
              Ethyra Consulting Services Notification Dispatcher<br>
              <span style="color: #64748b;">Recipient: ${recipient}</span>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    // 8. Plain Text Fallback
    const textEmail = `
New Webinar Topic Suggestion — Ethyra Consulting Services
==========================================================

Submitter Name: ${cleanName}
Submitter Email: ${cleanEmail}
Submitted At:    ${submittedAt}

PROPOSED TOPIC / COLLABORATION IDEA:
-------------------------------------
${cleanIdea}

-------------------------------------
Reply-To: ${cleanEmail}
Recipient: ${recipient}
    `.trim();

    // 9. Send Email via Google SMTP
    const info = await transporter.sendMail({
      from: `"Ethyra Topic Portal" <${user}>`,
      to: recipient,
      replyTo: `"${cleanName.replace(/"/g, '')}" <${cleanEmail}>`,
      subject: subject,
      text: textEmail,
      html: htmlEmail
    });

    console.log(`✓ Topic suggestion from ${cleanEmail} emailed to ${recipient}. Message ID: ${info.messageId}`);

    return res.json({
      success: true,
      message: 'Your topic suggestion has been received by Ethyra Consulting.',
      messageId: info.messageId
    });

  } catch (err) {
    console.error('Error sending topic suggestion email:', err);
    return res.status(500).json({
      success: false,
      error: 'Failed to submit topic suggestion. Please check server logs or SMTP configuration.'
    });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  Ethyra Consulting Web Server Running on port ${PORT}`);
  console.log(`  Local URL:   http://localhost:${PORT}`);
  console.log(`  Webinar Hub: http://localhost:${PORT}/exact-ethyra-site-code/webinar.html`);
  const { configured, user } = getTransporter();
  if (configured) {
    console.log(`  Gmail SMTP:  Configured (${user})`);
  } else {
    console.log(`  Gmail SMTP:  Not configured (set GMAIL_USER and GMAIL_APP_PASS in .env)`);
  }
  console.log(`==================================================\n`);
});
