// In-memory storage for OTPs with expiration
const otpStore = new Map();

/**
 * Generate a 6-digit OTP
 * @returns {string} - 6-digit OTP
 */
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Store OTP with expiration time (10 minutes)
 * @param {string} email - User's email
 * @param {string} otp - Generated OTP
 */
function storeOTP(email, otp) {
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes from now
  otpStore.set(email, { otp, expiresAt });
}

/**
 * Verify OTP for a given email
 * @param {string} email - User's email
 * @param {string} otp - OTP to verify
 * @returns {boolean} - True if OTP is valid and not expired
 */
function verifyOTP(email, otp) {
  const record = otpStore.get(email);
  
  if (!record) {
    return false; // No OTP found for this email
  }
  
  const { otp: storedOTP, expiresAt } = record;
  
  // Check if OTP matches and hasn't expired
  if (storedOTP === otp && Date.now() < expiresAt) {
    // Remove the OTP after successful verification
    otpStore.delete(email);
    return true;
  }
  
  // Remove expired OTP
  if (Date.now() >= expiresAt) {
    otpStore.delete(email);
  }
  
  return false;
}

/**
 * Remove OTP for a given email (cleanup)
 * @param {string} email - User's email
 */
function removeOTP(email) {
  otpStore.delete(email);
}

module.exports = { generateOTP, storeOTP, verifyOTP, removeOTP };