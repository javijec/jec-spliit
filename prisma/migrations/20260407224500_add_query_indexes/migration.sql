-- Participant lookups inside a group and active user syncing
CREATE INDEX IF NOT EXISTS "Participant_groupId_appUserId_idx"
ON "Participant"("groupId", "appUserId");

-- User group listing ordered by favorites, archive state and recent access
CREATE INDEX IF NOT EXISTS "UserGroupMembership_userId_isStarred_isArchived_lastAccessedAt_idx"
ON "UserGroupMembership"("userId", "isStarred", "isArchived", "lastAccessedAt" DESC);

-- Expense list, balances and stats queries scoped by group
CREATE INDEX IF NOT EXISTS "Expense_groupId_expenseDate_createdAt_idx"
ON "Expense"("groupId", "expenseDate" DESC, "createdAt" DESC);

CREATE INDEX IF NOT EXISTS "Expense_groupId_isReimbursement_idx"
ON "Expense"("groupId", "isReimbursement");

CREATE INDEX IF NOT EXISTS "Expense_groupId_paidById_idx"
ON "Expense"("groupId", "paidById");

-- Expense relations frequently traversed from detail and stats queries
CREATE INDEX IF NOT EXISTS "ExpenseDocument_expenseId_idx"
ON "ExpenseDocument"("expenseId");

CREATE INDEX IF NOT EXISTS "ExpensePaidFor_participantId_expenseId_idx"
ON "ExpensePaidFor"("participantId", "expenseId");

-- Activity feed ordered by recency within a group
CREATE INDEX IF NOT EXISTS "Activity_groupId_time_idx"
ON "Activity"("groupId", "time" DESC);
