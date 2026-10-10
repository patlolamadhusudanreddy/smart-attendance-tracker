const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');

const QR_SECRET = process.env.QR_SECRET || 'qr_session_secret_attendance_system_secure_token';

/**
 * Generate a cryptographically signed QR session payload
 * Contains: subjectId, teacherId, date, random nonce, and 3-minute expiration
 */
const generateQrPayload = async (subjectId, teacherId, date = new Date()) => {
  const payload = {
    subjectId,
    teacherId,
    date: new Date(date).toISOString().split('T')[0],
    nonce: Math.random().toString(36).substring(2, 10),
  };

  // Short-lived token (10 minutes session window)
  const qrToken = jwt.sign(payload, QR_SECRET, { expiresIn: '10m' });

  // Generate Data URL for frontend display
  const qrDataUrl = await QRCode.toDataURL(qrToken, {
    errorCorrectionLevel: 'H',
    type: 'image/png',
    margin: 2,
    color: {
      dark: '#1e1b4b',
      light: '#ffffff',
    },
    width: 320,
  });

  return {
    qrToken,
    qrDataUrl,
    expiresInSeconds: 600,
  };
};

/**
 * Verify scanned QR token
 */
const verifyQrPayload = (qrToken) => {
  try {
    return jwt.verify(qrToken, QR_SECRET);
  } catch (error) {
    throw new Error('QR Code session has expired or is invalid. Please scan an active session.');
  }
};

module.exports = {
  generateQrPayload,
  verifyQrPayload,
};
