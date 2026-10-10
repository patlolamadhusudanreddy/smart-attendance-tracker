const User = require('../models/User');
const Student = require('../models/Student');
const Teacher = require('../models/Teacher');
const Otp = require('../models/Otp');
const ActivityLog = require('../models/ActivityLog');
const generateToken = require('../utils/generateToken');
const { generateOtp } = require('../utils/otpGenerator');
const { successResponse, errorResponse } = require('../utils/apiResponse');
const {
  sendRegistrationOtpEmail,
  sendForgotPasswordOtpEmail,
  sendWelcomeEmail,
} = require('../services/emailService');

/**
 * @desc    Register a new user & dispatch 6-digit email OTP
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = async (req, res, next) => {
  try {
    const { name, email, password, role = 'student', rollNumber, employeeId, department, semester } = req.body;

    // 1. Validate Input Fields
    if (!name || !email || !password) {
      return errorResponse(res, 400, 'Please provide your full name, email address, and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      if (!existingUser.isVerified) {
        // User registered previously but did not verify email: issue fresh OTP
        const freshOtp = generateOtp();
        await Otp.deleteMany({ email: normalizedEmail, type: 'registration' });
        await Otp.create({
          email: normalizedEmail,
          otp: freshOtp,
          type: 'registration',
          expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 Minutes Expiry
        });

        console.log(`[Auth Controller] User exists but unverified. Re-issuing OTP to: ${normalizedEmail}`);

        let devNotice = '';
        try {
          const mailRes = await sendRegistrationOtpEmail(existingUser.email, existingUser.name, freshOtp);
          if (mailRes?.simulated) {
            devNotice = ` (Dev OTP: ${freshOtp})`;
          }
        } catch (mailError) {
          console.warn('⚠️ [Auth Controller] Email dispatch warning:', mailError.message);
          devNotice = ` (Dev OTP: ${freshOtp})`;
        }

        return successResponse(
          res,
          200,
          `Account is registered but unverified. A 6-digit OTP has been issued.${devNotice}`,
          { email: existingUser.email, needsVerification: true, devOtp: freshOtp }
        );
      }

      return errorResponse(res, 400, 'An account with this email address already exists. Please sign in.');
    }

    // 3. Create User record with isVerified: false
    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      role: role.toLowerCase(),
      isVerified: false,
    });

    // 4. Create Role Profile if Student or Teacher
    if (user.role === 'student') {
      const generatedRoll = rollNumber || `STD-${Math.floor(10000 + Math.random() * 90000)}`;
      await Student.create({
        user: user._id,
        rollNumber: generatedRoll.toUpperCase(),
        department: department || 'Computer Science',
        semester: Number(semester) || 1,
        section: 'A',
      });
    } else if (user.role === 'teacher') {
      const generatedEmpId = employeeId || `TCH-${Math.floor(1000 + Math.random() * 9000)}`;
      await Teacher.create({
        user: user._id,
        employeeId: generatedEmpId.toUpperCase(),
        department: department || 'Computer Science',
      });
    }

    // 5. Generate Secure 6-Digit OTP & Save in MongoDB (Expires in 5 minutes)
    const otpCode = generateOtp();
    await Otp.deleteMany({ email: normalizedEmail, type: 'registration' });
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      type: 'registration',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    console.log(`\n======================================================`);
    console.log(`🔑 [New User Registration] User: ${user.name} (${user.email})`);
    console.log(`🔢 [Generated OTP Code]: ${otpCode} (Valid for 5 minutes)`);
    console.log(`======================================================\n`);

    // 6. Send OTP to User's Email via Nodemailer Gmail SMTP
    let devNotice = '';
    try {
      const mailRes = await sendRegistrationOtpEmail(user.email, user.name, otpCode);
      if (mailRes?.simulated) {
        devNotice = ` (Dev OTP: ${otpCode})`;
      }
    } catch (mailError) {
      console.warn('⚠️ [Auth Controller] Registration email dispatch warning:', mailError.message);
      devNotice = ` (Dev OTP: ${otpCode})`;
    }

    return successResponse(
      res,
      201,
      `Registration successful! A 6-digit verification code has been issued.${devNotice}`,
      {
        userId: user._id,
        email: user.email,
        role: user.role,
        devOtp: otpCode,
      }
    );
  } catch (error) {
    console.error('❌ [Auth Controller] Registration Exception:', error);
    next(error);
  }
};

/**
 * @desc    Verify 6-digit registration OTP & activate user account
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return errorResponse(res, 400, 'Email address and 6-digit OTP code are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const enteredOtp = otp.toString().trim();

    console.log(`[Auth Controller] Verifying registration OTP for: ${normalizedEmail}`);

    // 1. Locate the latest OTP document for this email
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: 'registration',
    }).sort({ createdAt: -1 });

    if (!otpRecord) {
      return errorResponse(res, 400, 'No pending OTP verification found for this email. Please request a new code.');
    }

    // 2. Validate OTP Expiration (5 minutes)
    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return errorResponse(res, 400, 'OTP code has expired (valid for 5 minutes). Please click "Resend OTP".');
    }

    // 3. Validate OTP Code Match
    if (otpRecord.otp !== enteredOtp) {
      return errorResponse(res, 400, 'Invalid OTP code. Please enter the correct 6-digit code received on your email.');
    }

    // 4. Find user and mark verified
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return errorResponse(res, 404, 'User account associated with this email could not be found.');
    }

    user.isVerified = true;
    await user.save();

    // 5. Delete used OTP records
    await Otp.deleteMany({ email: normalizedEmail });

    // 6. Send Welcome Email (Non-blocking)
    try {
      await sendWelcomeEmail(user.email, user.name, user.role);
    } catch (welcomeErr) {
      console.warn('⚠️ [Auth Controller] Welcome email delivery failed:', welcomeErr.message);
    }

    // 7. Generate JWT Token
    const token = generateToken(user._id, user.role);

    // 8. Audit Log
    await ActivityLog.create({
      user: user._id,
      action: 'EMAIL_VERIFIED',
      details: `User verified email successfully: ${user.email}`,
      ipAddress: req.ip || '',
    });

    console.log(`✅ [Auth Controller] User email verified successfully: ${user.email}`);

    return successResponse(res, 200, 'Email verified successfully! Welcome to Smart Attendance.', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
      },
    });
  } catch (error) {
    console.error('❌ [Auth Controller] Verify OTP Exception:', error);
    next(error);
  }
};

/**
 * @desc    Resend 6-digit OTP code (deletes old OTP, generates new OTP, sends email)
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOtp = async (req, res, next) => {
  try {
    const { email, type = 'registration' } = req.body;

    if (!email) {
      return errorResponse(res, 400, 'Email address is required to resend OTP.');
    }

    const normalizedEmail = email.toLowerCase().trim();

    // 1. Verify user existence
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return errorResponse(res, 404, 'No account found with this email address.');
    }

    if (type === 'registration' && user.isVerified) {
      return errorResponse(res, 400, 'Your account email is already verified. You can log in directly.');
    }

    // 2. Generate fresh 6-digit OTP
    const freshOtp = generateOtp();

    // 3. Delete old OTP records for this email and type
    await Otp.deleteMany({ email: normalizedEmail, type });

    // 4. Save new OTP in MongoDB with 5-minute expiry
    await Otp.create({
      email: normalizedEmail,
      otp: freshOtp,
      type,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
    });

    console.log(`\n======================================================`);
    console.log(`🔄 [Resend OTP Request] User: ${user.name} (${normalizedEmail})`);
    console.log(`🔢 [New OTP Code]: ${freshOtp} (Valid for 5 minutes)`);
    console.log(`======================================================\n`);

    // 5. Send Email via Nodemailer Gmail SMTP
    let devNotice = '';
    try {
      let mailRes;
      if (type === 'registration') {
        mailRes = await sendRegistrationOtpEmail(user.email, user.name, freshOtp);
      } else {
        mailRes = await sendForgotPasswordOtpEmail(user.email, user.name, freshOtp);
      }
      if (mailRes?.simulated) {
        devNotice = ` (Dev OTP: ${freshOtp})`;
      }
    } catch (mailError) {
      console.warn('⚠️ [Auth Controller] Resend OTP email warning:', mailError.message);
      devNotice = ` (Dev OTP: ${freshOtp})`;
    }

    return successResponse(res, 200, `A new 6-digit verification code has been issued.${devNotice}`, {
      email: user.email,
      devOtp: freshOtp,
    });
  } catch (error) {
    console.error('❌ [Auth Controller] Resend OTP Exception:', error);
    next(error);
  }
};

/**
 * @desc    Login User & return JWT Token (Blocks login if unverified)
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return errorResponse(res, 400, 'Please enter email and password.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return errorResponse(res, 401, 'Invalid email or password.');
    }

    // Block login if user email is not verified
    if (!user.isVerified) {
      // Auto-dispatch fresh OTP to help user verify
      const freshOtp = generateOtp();
      await Otp.deleteMany({ email: normalizedEmail, type: 'registration' });
      await Otp.create({
        email: normalizedEmail,
        otp: freshOtp,
        type: 'registration',
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      });

      console.log(`[Auth Controller] Blocked unverified login for ${normalizedEmail}. Dispatched fresh OTP: ${freshOtp}`);

      try {
        await sendRegistrationOtpEmail(user.email, user.name, freshOtp);
      } catch (mailErr) {
        console.error('❌ [Auth Controller] Failed auto-dispatching OTP on unverified login:', mailErr.message);
      }

      return res.status(403).json({
        success: false,
        isUnverified: true,
        message: 'Your email address is not verified yet. A fresh 6-digit OTP code has been sent to your email.',
        email: user.email,
      });
    }

    // User is verified -> issue token
    const token = generateToken(user._id, user.role);

    let profileData = null;
    if (user.role === 'student') {
      profileData = await Student.findOne({ user: user._id });
    } else if (user.role === 'teacher') {
      profileData = await Teacher.findOne({ user: user._id }).populate('assignedSubjects');
    }

    await ActivityLog.create({
      user: user._id,
      action: 'LOGIN',
      details: `${user.role.toUpperCase()} logged in`,
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Login successful!', {
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        avatar: user.avatar,
        phone: user.phone,
        profile: profileData,
      },
    });
  } catch (error) {
    console.error('❌ [Auth Controller] Login Exception:', error);
    next(error);
  }
};

/**
 * @desc    Request Forgot Password OTP
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    if (!email) {
      return errorResponse(res, 400, 'Please provide your account email.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return errorResponse(res, 404, 'No account found with this email address.');
    }

    const otpCode = generateOtp();
    await Otp.deleteMany({ email: normalizedEmail, type: 'forgot_password' });
    await Otp.create({
      email: normalizedEmail,
      otp: otpCode,
      type: 'forgot_password',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });

    console.log(`[Auth Controller] Forgot password OTP for ${normalizedEmail}: ${otpCode}`);

    let devNotice = '';
    try {
      const mailRes = await sendForgotPasswordOtpEmail(user.email, user.name, otpCode);
      if (mailRes?.simulated) {
        devNotice = ` (Dev OTP: ${otpCode})`;
      }
    } catch (mailErr) {
      console.warn('⚠️ [Auth Controller] Forgot password email warning:', mailErr.message);
      devNotice = ` (Dev OTP: ${otpCode})`;
    }

    return successResponse(res, 200, `Password reset OTP has been issued.${devNotice}`, {
      email: user.email,
      devOtp: otpCode,
    });
  } catch (error) {
    console.error('❌ [Auth Controller] Forgot Password Exception:', error);
    next(error);
  }
};

/**
 * @desc    Verify Forgot Password OTP
 * @route   POST /api/auth/verify-forgot-otp
 * @access  Public
 */
const verifyForgotOtp = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return errorResponse(res, 400, 'Email and OTP are required.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: 'forgot_password',
    });

    if (!otpRecord) {
      return errorResponse(res, 400, 'No password reset request found for this email.');
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return errorResponse(res, 400, 'Reset OTP has expired. Please request a new one.');
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      return errorResponse(res, 400, 'Invalid reset OTP code.');
    }

    return successResponse(res, 200, 'OTP verified successfully. You may now reset your password.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Reset password using OTP
 * @route   POST /api/auth/reset-password
 * @access  Public
 */
const resetPassword = async (req, res, next) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return errorResponse(res, 400, 'Email, OTP, and new password are required.');
    }

    if (newPassword.length < 6) {
      return errorResponse(res, 400, 'New password must be at least 6 characters.');
    }

    const normalizedEmail = email.toLowerCase().trim();
    const otpRecord = await Otp.findOne({
      email: normalizedEmail,
      type: 'forgot_password',
    });

    if (!otpRecord) {
      return errorResponse(res, 400, 'Invalid or expired reset session.');
    }

    if (new Date() > otpRecord.expiresAt) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return errorResponse(res, 400, 'Reset OTP has expired. Please request a new one.');
    }

    if (otpRecord.otp !== otp.toString().trim()) {
      return errorResponse(res, 400, 'Invalid reset OTP code.');
    }

    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return errorResponse(res, 404, 'User not found.');
    }

    user.password = newPassword;
    await user.save();

    await Otp.deleteMany({ email: normalizedEmail });

    await ActivityLog.create({
      user: user._id,
      action: 'PASSWORD_RESET',
      details: 'User password was reset successfully',
      ipAddress: req.ip || '',
    });

    return successResponse(res, 200, 'Password reset successfully! You can now log in.');
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get Current Logged in User Profile
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id);
    let profile = null;

    if (user.role === 'student') {
      profile = await Student.findOne({ user: user._id });
    } else if (user.role === 'teacher') {
      profile = await Teacher.findOne({ user: user._id }).populate('assignedSubjects');
    }

    return successResponse(res, 200, 'Profile fetched successfully', {
      user,
      profile,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update User Profile
 * @route   PUT /api/auth/profile
 * @access  Private
 */
const updateProfile = async (req, res, next) => {
  try {
    const { name, phone, avatar } = req.body;
    const user = await User.findById(req.user._id);

    if (name) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    return successResponse(res, 200, 'Profile updated successfully', user);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  verifyOtp,
  resendOtp,
  login,
  forgotPassword,
  verifyForgotOtp,
  resetPassword,
  getMe,
  updateProfile,
};
