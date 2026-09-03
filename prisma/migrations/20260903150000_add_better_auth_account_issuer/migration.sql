ALTER TABLE "account" ADD COLUMN "issuer" TEXT;

UPDATE "account"
SET "issuer" = CASE
  WHEN "providerId" = 'credential' THEN 'local:credential'
  WHEN "providerId" = 'google' THEN 'https://accounts.google.com'
  ELSE 'local:oauth:' || "providerId"
END
WHERE "issuer" IS NULL;

ALTER TABLE "account" ALTER COLUMN "issuer" SET NOT NULL;

CREATE UNIQUE INDEX "account_issuer_accountId_key" ON "account"("issuer", "accountId");
