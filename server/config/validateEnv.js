const validateEnv = () => {
  const required = ['JWT_SECRET', 'MONGODB_URI'];
  const missing = required.filter(k => !process.env[k]);
  if (missing.length) {
    console.error(`Missing required env vars: ${missing.join(', ')}`);
    process.exit(1);
  }
  if (process.env.JWT_SECRET.length < 32) {
    console.error('JWT_SECRET must be at least 32 characters');
    process.exit(1);
  }
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      console.error('Cloudinary config is required in production');
      process.exit(1);
    }
    if (process.env.EMAIL_MODE === 'console') {
      console.error('EMAIL_MODE=console is not allowed in production');
      process.exit(1);
    }
    if (process.env.EMAIL_MODE === 'smtp' && (!process.env.SMTP_HOST || !process.env.SMTP_USER)) {
      console.error('SMTP config incomplete in production');
      process.exit(1);
    }
  }
};

module.exports = { validateEnv };
