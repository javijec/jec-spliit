import { Prisma } from '@prisma/client'

function buildCandidateName(baseName: string, suffix: number) {
  return suffix === 1 ? baseName : `${baseName} (${suffix})`
}

export async function getUniqueParticipantName(
  tx: Prisma.TransactionClient,
  groupId: string,
  participantId: string,
  desiredName: string,
) {
  const existingParticipants = await tx.participant.findMany({
    where: {
      groupId,
      id: { not: participantId },
    },
    select: { name: true },
  })

  const usedNames = new Set(existingParticipants.map((participant) => participant.name))
  let suffix = 1
  let candidate = buildCandidateName(desiredName, suffix)

  while (usedNames.has(candidate)) {
    suffix += 1
    candidate = buildCandidateName(desiredName, suffix)
  }

  return candidate
}
