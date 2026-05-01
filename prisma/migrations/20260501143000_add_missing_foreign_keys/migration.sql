-- Keep nullable relationship columns indexed before adding FKs so parent deletes and updates
-- do not fall back to full scans as the dataset grows.
CREATE INDEX IF NOT EXISTS "Activity_participantId_idx"
ON "Activity"("participantId");

CREATE INDEX IF NOT EXISTS "Activity_expenseId_idx"
ON "Activity"("expenseId");

CREATE INDEX IF NOT EXISTS "Expense_recurringExpenseLinkId_idx"
ON "Expense"("recurringExpenseLinkId");

-- Validate existing rows separately so the new constraints are introduced with a short lock.
ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_participantId_fkey"
FOREIGN KEY ("participantId") REFERENCES "Participant"("id")
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE "Activity"
VALIDATE CONSTRAINT "Activity_participantId_fkey";

ALTER TABLE "Activity"
ADD CONSTRAINT "Activity_expenseId_fkey"
FOREIGN KEY ("expenseId") REFERENCES "Expense"("id")
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE "Activity"
VALIDATE CONSTRAINT "Activity_expenseId_fkey";

ALTER TABLE "Expense"
ADD CONSTRAINT "Expense_recurringExpenseLinkId_fkey"
FOREIGN KEY ("recurringExpenseLinkId") REFERENCES "RecurringExpenseLink"("id")
ON DELETE SET NULL
ON UPDATE CASCADE
NOT VALID;

ALTER TABLE "Expense"
VALIDATE CONSTRAINT "Expense_recurringExpenseLinkId_fkey";
