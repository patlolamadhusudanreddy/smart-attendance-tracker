const nodemailer = require('nodemailer');

/**
 * Clean & normalize Gmail App Password (removes inadvertent spaces)
 */
const getNormalizedEmailCredentials = () => {
  const user = process.env.EMAIL_USER ? process.env.EMAIL_USER.trim() : '';
  const rawPass = process.env.EMAIL_PASS ? process.env.EMAIL_PASS.trim() : '';
  // Gmail App passwords are 16 characters often displayed as "xxxx xxxx xxxx xxxx"
  const pass = rawPass.replace(/\s+/g, '');

  return { user, pass };
};

/**
 * Configure Nodemailer Transporter with Gmail SMTP
 */
const createTransporter = () => {
  const { user, pass } = getNormalizedEmailCredentials();

  if (!user || !pass) {
    console.warn('\n⚠️ [Nodemailer Warning] EMAIL_USER or EMAIL_PASS is not set in backend/.env.');
    console.warn('👉 In development mode, OTP codes will be displayed in the terminal and API responses.');
    console.warn('👉 To deliver real emails to your Gmail inbox, add your Gmail address and 16-character App Password to backend/.env.\n');
    return null;
  }

  // Gmail SMTP Transporter Configuration
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: false, // TLS on port 587
    auth: {
      user: user,
      pass: pass,
    },
    tls: {
      rejectUnauthorized: false,
    },
  });

  return transporter;
};

// Singleton transporter instance
let transporter = createTransporter();

// Verify SMTP connection configuration on startup if credentials exist
const { user, pass } = getNormalizedEmailCredentials();
if (user && pass && transporter) {
  transporter.verify((error, success) => {
    if (error) {
      console.error('\n❌ [Nodemailer Error] Gmail SMTP verification failed:');
      console.error(`   Message: ${error.message}`);
      console.error(`   Code: ${error.code || 'UNKNOWN'}`);
      if (error.code === 'EAUTH' || error.message.includes('530')) {
        console.error('   👉 Diagnosis: Authentication required or invalid password.');
        console.error('   👉 Solution: Ensure 2-Step Verification is ON in your Google account and you are using a 16-character App Password from https://myaccount.google.com/apppasswords');
      }
      console.error('=================================================================\n');
    } else {
      console.log('✅ [Nodemailer] Gmail SMTP connected successfully! Ready to deliver OTP emails.\n');
    }
  });
}

/**
 * Professional HTML Email Layout Template
 */
const getHtmlLayout = (content, headerBadge = 'Verification Required') => {
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Smart Student Attendance System</title>
    <style>
      body { margin: 0; padding: 0; font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; color: #1e293b; }
      .container { max-width: 560px; margin: 30px auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08); border: 1px solid #e2e8f0; }
      .header { background: linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%); padding: 36px 24px; text-align: center; color: #ffffff; }
      .header h1 { margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.5px; }
      .header p { margin: 8px 0 0; font-size: 13px; color: #e0e7ff; }
      .content { padding: 36px 32px; font-size: 15px; line-height: 1.6; color: #334155; }
      .badge { display: inline-block; padding: 5px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background: #e0e7ff; color: #4338ca; margin-bottom: 16px; }
      .otp-card { background: #f8fafc; border: 2px dashed #6366f1; border-radius: 14px; padding: 22px; text-align: center; margin: 28px 0; }
      .otp-title { font-size: 12px; font-weight: 700; text-transform: uppercase; color: #64748b; letter-spacing: 1px; margin-bottom: 8px; }
      .otp-code { font-size: 38px; font-weight: 900; letter-spacing: 10px; color: #4338ca; margin: 0; font-family: 'Courier New', Courier, monospace; }
      .otp-timer { font-size: 12px; color: #dc2626; font-weight: 600; margin-top: 10px; }
      .security-box { background: #fffbeb; border-left: 4px solid #f59e0b; padding: 12px 16px; border-radius: 0 8px 8px 0; font-size: 13px; color: #92400e; margin: 20px 0; }
      .footer { background: #f8fafc; padding: 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; }
      .btn { display: inline-block; background: #4f46e5; color: #ffffff !important; padding: 12px 28px; border-radius: 8px; text-decoration: none; font-weight: 700; font-size: 14px; margin-top: 15px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>🎓 Smart Student Attendance System</h1>
        <p>Institutional Digital Campus & Attendance Portal</p>
      </div>
      <div class="content">
        <span class="badge">${headerBadge}</span>
        ${content}
      </div>
      <div class="footer">
        <p style="margin: 0 0 6px 0;">© ${new Date().getFullYear()} Smart Student Attendance System. Confidential.</p>
        <p style="margin: 0;">This is an automated institutional message. Please do not reply directly to this email.</p>
      </div>
    </div>
  </body>
  </html>
  `;
};

/**
 * Send Registration Verification OTP Email
 * @param {string} email - Destination email address
 * @param {string} name - User's full name
 * @param {string} otp - 6-digit numeric OTP code
 */
const sendRegistrationOtpEmail = async (email, name, otp) => {
  const { user, pass } = getNormalizedEmailCredentials();

  // If credentials are not set, run in dev simulation mode
  if (!user || !pass || !transporter) {
    console.log(`\n======================================================`);
    console.log(`📨 [DEV MODE - SIMULATED REGISTRATION EMAIL]`);
    console.log(`👤 Recipient: ${name} <${email}>`);
    console.log(`🔑 6-Digit OTP Code: ${otp} (Expires in 5 minutes)`);
    console.log(`👉 Enter this code on the screen to verify immediately.`);
    console.log(`======================================================\n`);
    return {
      simulated: true,
      otp,
      messageId: 'simulated-dev-otp',
    };
  }

  const fromAddress = process.env.EMAIL_FROM || `"Smart Attendance System" <${user}>`;

  const html = getHtmlLayout(
    `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Welcome to Smart Attendance, ${name || 'Student'}!</h2>
    <p>Thank you for registering your institutional profile. To verify your email address and activate your account, please enter the One-Time Password (OTP) below:</p>
    
    <div class="otp-card">
      <div class="otp-title">Your 6-Digit Verification Code</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-timer">⏳ Code expires in <strong>5 minutes</strong></div>
    </div>

    <div class="security-box">
      <strong>Security Notice:</strong> Never share this OTP with anyone. Our administrators will never ask for your verification code.
    </div>

    <p style="font-size: 13px; color: #64748b;">If you did not initiate this registration, please disregard this email. Your email will not be activated without verification.</p>
    `,
    'Account Verification'
  );

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `🔐 Verify Your Account - OTP Code: ${otp}`,
    html,
  };

  console.log(`\n[Nodemailer] 📨 Dispatching Registration OTP to: ${email}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Nodemailer Success] Email delivered to ${email} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ [Nodemailer Error] Failed sending OTP email to ${email}:`, error.message);

    // If in dev environment, fallback so user can still test and verify
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n======================================================`);
      console.log(`👉 [DEV FALLBACK OTP FOR ${email}]: ${otp}`);
      console.log(`(Email failed due to: ${error.message})`);
      console.log(`======================================================\n`);
      return {
        simulated: true,
        otp,
        error: error.message,
      };
    }

    throw error;
  }
};

/**
 * Send Forgot Password Recovery OTP Email
 * @param {string} email - Destination email address
 * @param {string} name - User's full name
 * @param {string} otp - 6-digit numeric OTP code
 */
const sendForgotPasswordOtpEmail = async (email, name, otp) => {
  const { user, pass } = getNormalizedEmailCredentials();

  if (!user || !pass || !transporter) {
    console.log(`\n======================================================`);
    console.log(`📨 [DEV MODE - SIMULATED PASSWORD RESET EMAIL]`);
    console.log(`👤 Recipient: ${name} <${email}>`);
    console.log(`🔑 Reset OTP Code: ${otp} (Expires in 5 minutes)`);
    console.log(`======================================================\n`);
    return {
      simulated: true,
      otp,
      messageId: 'simulated-dev-otp',
    };
  }

  const fromAddress = process.env.EMAIL_FROM || `"Smart Attendance System" <${user}>`;

  const html = getHtmlLayout(
    `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Password Reset Request</h2>
    <p>Hello ${name || 'User'},</p>
    <p>We received a request to reset the password for your Smart Student Attendance System account. Enter the verification code below to set a new password:</p>
    
    <div class="otp-card">
      <div class="otp-title">Password Reset OTP</div>
      <div class="otp-code">${otp}</div>
      <div class="otp-timer">⏳ Code expires in <strong>5 minutes</strong></div>
    </div>

    <div class="security-box">
      <strong>Important:</strong> If you did not request a password reset, please ignore this email. Your account credentials remain secure.
    </div>
    `,
    'Password Reset'
  );

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `🔑 Password Reset OTP: ${otp} - Smart Attendance System`,
    html,
  };

  console.log(`\n[Nodemailer] 📨 Dispatching Password Reset OTP to: ${email}`);

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Nodemailer Success] Password reset email delivered to ${email} (Message ID: ${info.messageId})`);
    return info;
  } catch (error) {
    console.error(`❌ [Nodemailer Error] Failed sending password reset OTP to ${email}:`, error.message);

    if (process.env.NODE_ENV !== 'production') {
      console.log(`👉 [DEV FALLBACK RESET OTP FOR ${email}]: ${otp}\n`);
      return {
        simulated: true,
        otp,
        error: error.message,
      };
    }

    throw error;
  }
};

/**
 * Send Welcome Email after successful verification
 */
const sendWelcomeEmail = async (email, name, role) => {
  const { user, pass } = getNormalizedEmailCredentials();
  if (!user || !pass || !transporter) return null;

  const fromAddress = process.env.EMAIL_FROM || `"Smart Attendance System" <${user}>`;
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';

  const html = getHtmlLayout(
    `
    <h2 style="margin-top: 0; color: #0f172a; font-size: 20px;">Welcome Aboard, ${name}! 🎉</h2>
    <p>Your institutional email address has been successfully verified. Your account role has been activated as <strong>${role.toUpperCase()}</strong>.</p>
    
    <p>You can now access your dashboard to view course timetables, record or track lecture attendance, and generate reports.</p>
    
    <div style="text-align: center; margin: 30px 0;">
      <a href="${clientUrl}/login" class="btn">Proceed to Login</a>
    </div>
    `,
    'Account Activated'
  );

  const mailOptions = {
    from: fromAddress,
    to: email,
    subject: `🎉 Account Activated - Welcome to Smart Student Attendance System`,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ [Nodemailer] Welcome email sent to ${email}`);
    return info;
  } catch (error) {
    console.warn(`⚠️ [Nodemailer Warning] Could not send welcome email to ${email}:`, error.message);
    return null;
  }
};

module.exports = {
  transporter,
  sendRegistrationOtpEmail,
  sendForgotPasswordOtpEmail,
  sendWelcomeEmail,
};
