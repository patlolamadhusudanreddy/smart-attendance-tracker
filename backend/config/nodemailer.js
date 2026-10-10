// Forwarding wrapper for backwards compatibility
const emailService = require('../services/emailService');

module.exports = {
  getTransporter: async () => emailService.transporter,
  transporter: emailService.transporter,
};
