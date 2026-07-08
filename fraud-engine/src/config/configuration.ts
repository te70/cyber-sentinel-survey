export default () => ({
  port: parseInt(process.env.PORT ?? '3001', 10),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  database: {
    url: process.env.DATABASE_URL ?? 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me-in-production',
  },
  otp: {
    sessionTtlHours: parseInt(process.env.OTP_SESSION_TTL_HOURS ?? '4', 10),
  },
  at: {
    username: process.env.AT_USERNAME ?? '',
    apiKey: process.env.AT_API_KEY ?? '',
    environment: process.env.AT_ENVIRONMENT ?? 'sandbox',
    paymentProduct: process.env.AT_PAYMENT_PRODUCT ?? 'TetrasecSurveys',
  },
  fraud: {
    baseScore: parseInt(process.env.FRAUD_BASE_SCORE ?? '60', 10),
    autoPassThreshold: parseInt(process.env.FRAUD_AUTO_PASS_THRESHOLD ?? '70', 10),
    reviewThreshold: parseInt(process.env.FRAUD_REVIEW_THRESHOLD ?? '40', 10),
    holdHours: parseInt(process.env.FRAUD_HOLD_HOURS ?? '48', 10),
  },
});
