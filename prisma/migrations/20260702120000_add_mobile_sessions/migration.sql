CREATE TABLE "MobileSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "refreshTokenHash" TEXT NOT NULL,
    "refreshTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "accessTokenExpiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MobileSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MobileSession_refreshTokenHash_key" ON "MobileSession"("refreshTokenHash");
CREATE INDEX "MobileSession_userId_refreshTokenExpiresAt_idx" ON "MobileSession"("userId", "refreshTokenExpiresAt");
CREATE INDEX "MobileSession_userId_revokedAt_idx" ON "MobileSession"("userId", "revokedAt");

ALTER TABLE "MobileSession"
ADD CONSTRAINT "MobileSession_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "AppUser"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
