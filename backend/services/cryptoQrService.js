const crypto = require('crypto');
const QRCode = require('qrcode');

const QR_SECRET = process.env.QR_SECRET || 'qr_session_secret_attendance_system_secure_token';

// Derive 32-byte AES-256 key from QR_SECRET
const getDerivedKey = () => {
  return crypto.createHash('sha256').update(QR_SECRET).digest();
};

/**
 * Encrypt a JSON object using AES-256-CBC with random 16-byte IV
 */
const encryptPayload = (data) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', getDerivedKey(), iv);
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
  encrypted += cipher.final('hex');
  // Combine IV and Ciphertext with colon separator
  return `${iv.toString('hex')}:${encrypted}`;
};

/**
 * Decrypt AES-256-CBC ciphertext and return original JSON object
 */
const decryptPayload = (encryptedString) => {
  if (!encryptedString || typeof encryptedString !== 'string') {
    throw new Error('Invalid or missing encrypted QR payload');
  }

  const parts = encryptedString.split(':');
  if (parts.length !== 2) {
    throw new Error('Corrupted or modified QR code token format');
  }

  const [ivHex, cipherText] = parts;
  if (!ivHex || !cipherText || ivHex.length !== 32) {
    throw new Error('Invalid cryptographic initialization vector in QR token');
  }

  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', getDerivedKey(), iv);
  let decrypted = decipher.update(cipherText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return JSON.parse(decrypted);
};

/**
 * Generate a dynamic QR code for a classroom session that expires in 20 seconds
 */
const generateDynamicQr = async ({
  sessionId,
  subjectId,
  teacherId,
  validitySeconds = 20,
}) => {
  const now = Date.now();
  const tokenId = crypto.randomUUID
    ? crypto.randomUUID()
    : crypto.randomBytes(16).toString('hex');
  const expiresAt = now + validitySeconds * 1000;

  const payload = {
    tokenId,
    sessionId: String(sessionId),
    subjectId: String(subjectId),
    teacherId: String(teacherId),
    timestamp: now,
    expiresAt,
  };

  const encryptedPayload = encryptPayload(payload);

  // Generate crisp QR DataURL with high error resilience
  const qrDataUrl = await QRCode.toDataURL(encryptedPayload, {
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
    tokenId,
    encryptedPayload,
    qrDataUrl,
    expiresAt: new Date(expiresAt),
    validitySeconds,
  };
};

/**
 * Decrypts and validates the 20-second dynamic QR token
 */
const verifyDynamicQrToken = (encryptedPayload) => {
  let decoded;
  try {
    decoded = decryptPayload(encryptedPayload);
  } catch (err) {
    const error = new Error('Invalid QR Token: Decryption failed or token was tampered with.');
    error.code = 'INVALID_TOKEN';
    throw error;
  }

  const now = Date.now();
  if (now > decoded.expiresAt) {
    const error = new Error('Expired QR: 20-second validity window has expired. Scan the newest QR on screen.');
    error.code = 'EXPIRED_QR';
    error.payload = decoded;
    throw error;
  }

  return decoded;
};

module.exports = {
  encryptPayload,
  decryptPayload,
  generateDynamicQr,
  verifyDynamicQrToken,
};
