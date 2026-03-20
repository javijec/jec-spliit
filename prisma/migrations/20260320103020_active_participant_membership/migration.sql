-- AlterTable
ALTER TABLE "UserGroupMembership" ADD COLUMN     "activeParticipantId" TEXT;

-- AddForeignKey
ALTER TABLE "UserGroupMembership" ADD CONSTRAINT "UserGroupMembership_activeParticipantId_fkey" FOREIGN KEY ("activeParticipantId") REFERENCES "Participant"("id") ON DELETE SET NULL ON UPDATE CASCADE;
