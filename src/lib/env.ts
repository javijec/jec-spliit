import { ZodIssueCode, z } from 'zod'

const interpretEnvVarAsBool = (val: unknown): boolean => {
  if (typeof val !== 'string') return false
  return ['true', 'yes', '1', 'on'].includes(val.toLowerCase())
}

const defaultDevDatabaseUrl = 'postgresql://postgres:postgres@localhost:5432/spliit'

const normalizedEnv = {
  ...process.env,
  POSTGRES_PRISMA_URL:
    process.env.POSTGRES_PRISMA_URL ??
    process.env.DATABASE_URL ??
    defaultDevDatabaseUrl,
  POSTGRES_URL_NON_POOLING:
    process.env.POSTGRES_URL_NON_POOLING ??
    process.env.DIRECT_URL ??
    process.env.DATABASE_URL ??
    defaultDevDatabaseUrl,
}

const envSchema = z
  .object({
    POSTGRES_URL_NON_POOLING: z.string().url(),
    POSTGRES_PRISMA_URL: z.string().url(),
    NEXT_PUBLIC_BASE_URL: z
      .string()
      .optional()
      .default(
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000',
      ),
    NEXT_PUBLIC_ENABLE_EXPENSE_DOCUMENTS: z.preprocess(
      interpretEnvVarAsBool,
      z.boolean().default(false),
    ),
    NEXT_PUBLIC_SPEED_INSIGHTS_SAMPLE_RATE: z.coerce
      .number()
      .min(0)
      .max(1)
      .default(1),
    NEXT_PUBLIC_DEFAULT_CURRENCY_CODE: z.string().optional(),
    S3_UPLOAD_KEY: z.string().optional(),
    S3_UPLOAD_SECRET: z.string().optional(),
    S3_UPLOAD_BUCKET: z.string().optional(),
    S3_UPLOAD_REGION: z.string().optional(),
    S3_UPLOAD_ENDPOINT: z.string().optional(),
    GROUP_ACCESS_SECRET: z
      .string()
      .optional()
      .default('dev-group-access-secret'),
    BETTER_AUTH_SECRET: z.string().optional().default('dev-better-auth-secret'),
    GOOGLE_CLIENT_ID: z.string().optional(),
    GOOGLE_CLIENT_SECRET: z.string().optional(),
    GOOGLE_ANDROID_CLIENT_ID: z.string().optional(),
    FIREBASE_PROJECT_ID: z.string().optional(),
    FIREBASE_CLIENT_EMAIL: z.string().optional(),
    FIREBASE_PRIVATE_KEY: z.string().optional(),
    APP_BASE_URL: z
      .string()
      .optional()
      .default(
        process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000',
      ),
  })
  .superRefine((env, ctx) => {
    if (
      env.NEXT_PUBLIC_ENABLE_EXPENSE_DOCUMENTS &&
      // S3_UPLOAD_ENDPOINT is fully optional as it will only be used for providers other than AWS
      (!env.S3_UPLOAD_BUCKET ||
        !env.S3_UPLOAD_KEY ||
        !env.S3_UPLOAD_REGION ||
        !env.S3_UPLOAD_SECRET)
    ) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message:
          'If NEXT_PUBLIC_ENABLE_EXPENSE_DOCUMENTS is specified, then S3_* must be specified too',
      })
    }

    const googleKeys = [
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
    ]
    const hasAnyGoogleKey = googleKeys.some(Boolean)
    const hasAllGoogleKeys = googleKeys.every(Boolean)

    if (hasAnyGoogleKey && !hasAllGoogleKeys) {
      ctx.addIssue({
        code: ZodIssueCode.custom,
        message:
          'If any Google auth variable is specified, then GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must both be specified',
      })
    }
  })

export const env = envSchema.parse(normalizedEnv)
export const auth0Enabled = !!env.GOOGLE_CLIENT_ID && !!env.GOOGLE_CLIENT_SECRET
export const betterAuthEnabled = auth0Enabled
