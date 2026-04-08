-- Participant lookups inside a group and active user syncing
CREATE INDEX "Participant_groupId_appUserId_idx"
ON "Participant"("groupId", "appUserId");

-- User group listing ordered by favorites, archive state and recent access
CREATE INDEX "UserGroupMembership_userId_isStarred_isArchived_lastAccessedAt_idx"
ON "UserGroupMembership"("userId", "isStarred", "isArchived", "lastAccessedAt" DESC);

-- Expense list, balances and stats queries scoped by group
CREATE INDEX "Expense_groupId_expenseDate_createdAt_idx"
ON "Expense"("groupId", "expenseDate" DESC, "createdAt" DESC);

CREATE INDEX "Expense_groupId_isReimbursement_idx"
ON "Expense"("groupId", "isReimbursement");

CREATE INDEX "Expense_groupId_paidById_idx"
ON "Expense"("groupId", "paidById");

-- Expense relations frequently traversed from detail and stats queries
CREATE INDEX "ExpenseDocument_expenseId_idx"
ON "ExpenseDocument"("expenseId");

CREATE INDEX "ExpensePaidFor_participantId_expenseId_idx"
ON "ExpensePaidFor"("participantId", "expenseId");

-- Activity feed ordered by recency within a group
CREATE INDEX "Activity_groupId_time_idx"
ON "Activity"("groupId", "time" DESC);
