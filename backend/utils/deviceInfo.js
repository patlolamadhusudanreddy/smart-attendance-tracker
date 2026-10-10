/**
 * Extracts and parses client device telemetry from HTTP request headers
 */
function extractDeviceInfo(req) {
  const userAgent = req.headers['user-agent'] || 'Unknown';
  const ipAddress =
    req.headers['x-forwarded-for']?.split(',')[0].trim() ||
    req.socket?.remoteAddress ||
    req.ip ||
    '127.0.0.1';

  // Determine Operating System
  let os = 'Unknown OS';
  if (/windows/i.test(userAgent)) os = 'Windows';
  else if (/android/i.test(userAgent)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(userAgent)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(userAgent)) os = 'macOS';
  else if (/linux/i.test(userAgent)) os = 'Linux';

  // Determine Browser
  let browser = 'Unknown Browser';
  if (/edg/i.test(userAgent)) browser = 'Microsoft Edge';
  else if (/chrome|crios/i.test(userAgent)) browser = 'Chrome';
  else if (/firefox|fxios/i.test(userAgent)) browser = 'Firefox';
  else if (/safari/i.test(userAgent) && !/chrome/i.test(userAgent)) browser = 'Safari';
  else if (/opera|opr/i.test(userAgent)) browser = 'Opera';

  // Device identifier passed from client or generated
  const deviceId =
    req.body?.deviceId ||
    req.headers['x-device-id'] ||
    `DEV-${Buffer.from(ipAddress + os + browser).toString('base64').substring(0, 16)}`;

  return {
    userAgent,
    ipAddress,
    os,
    browser,
    deviceId,
  };
}

module.exports = {
  extractDeviceInfo,
};
