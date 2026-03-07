'use client'

import ExportButton from '@/app/groups/[groupId]/export-button'
import { ShareButton } from '@/app/groups/[groupId]/share-button'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  GroupSectionCard,
  GroupSectionContent,
  GroupSectionDescription,
  GroupSectionHeader,
  GroupSectionTitle,
} from '@/components/ui/group-section-card'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/components/ui/use-toast'
import { trpc } from '@/trpc/client'
import {
  ArrowRight,
  FileOutput,
  Info,
  Lock,
  LockOpen,
  Pencil,
  ShieldCheck,
  Trash2,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useCurrentGroup } from '../current-group-context'

function SettingsActionCard({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string
  icon: typeof Pencil
  title: string
  description: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl border bg-card/60 px-4 py-3 transition-colors hover:bg-card"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium leading-none">{title}</p>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </div>
      <ArrowRight className="h-4 w-4 text-muted-foreground" />
    </Link>
  )
}

export function SettingsPageClient() {
  const { groupId } = useCurrentGroup()
  const [password, setPassword] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false)
  const [deleteConfirmName, setDeleteConfirmName] = useState('')
  const { toast } = useToast()
  const router = useRouter()
  const { data, isLoading } = trpc.groups.getDetails.useQuery({ groupId })
  const { mutateAsync: setAccessPasswordAsync, isPending: isSettingPassword } =
    trpc.groups.setAccessPassword.useMutation()
  const {
    mutateAsync: clearAccessPasswordAsync,
    isPending: isClearingPassword,
  } = trpc.groups.clearAccessPassword.useMutation()
  const { mutateAsync: deleteGroupAsync, isPending: isDeletingGroup } =
    trpc.groups.delete.useMutation()
  const utils = trpc.useUtils()

  const getActiveParticipantId = () => {
    const rawActiveUser = localStorage.getItem(`${groupId}-activeUser`)
    if (!rawActiveUser || !data?.group) return undefined

    const participant = data.group.participants.find(
      (item) => item.id === rawActiveUser || item.name === rawActiveUser,
    )

    return participant?.id
  }

  if (isLoading || !data?.group) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <Skeleton className="h-56 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    )
  }

  const canDeleteGroup =
    deleteConfirmChecked && deleteConfirmName.trim() === data.group.name

  return (
    <div className="space-y-4">
      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            Ajustes
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            Administra participantes, moneda, acceso y exportaciones.
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent className="space-y-3">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="secondary">
              {data.group.participants.length} participantes
            </Badge>
            {data.group.currencyCode && (
              <Badge variant="secondary">{data.group.currencyCode}</Badge>
            )}
            <Badge variant={data.hasAccessPassword ? 'default' : 'outline'}>
              {data.hasAccessPassword ? 'Protegido' : 'Abierto'}
            </Badge>
          </div>

          <div className="grid gap-3">
            <SettingsActionCard
              href={`/groups/${groupId}/edit`}
              icon={Pencil}
              title="Editar grupo"
              description="Nombre, participantes, moneda e información general."
            />
            <SettingsActionCard
              href={`/groups/${groupId}/balances`}
              icon={Users}
              title="Ver balances"
              description="Revisa liquidaciones y pagos pendientes del grupo."
            />
          </div>
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            Compartir y exportar
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            Comparte el acceso al grupo o descarga sus movimientos.
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <ShareButton
              group={{ id: data.group.id, name: data.group.name }}
              showLabel
              size="default"
              variant="outline"
              className="w-full justify-center sm:w-auto"
            />
            <ExportButton
              groupId={groupId}
              showLabel
              size="default"
              variant="outline"
            />
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <Info className="h-4 w-4" />
              Información del grupo
            </div>
            <p className="mt-2 whitespace-pre-wrap text-muted-foreground">
              {data.group.information?.trim() || 'No hay información cargada todavía.'}
            </p>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 text-sm">
            <div className="flex items-center gap-2 font-medium">
              <FileOutput className="h-4 w-4" />
              Exportación
            </div>
            <p className="mt-2 text-muted-foreground">
              JSON y CSV exportan los gastos del grupo con su información actual.
            </p>
          </div>
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard>
        <GroupSectionHeader>
          <GroupSectionTitle className="flex items-center gap-2 text-xl leading-none">
            <ShieldCheck className="h-5 w-5" />
            Seguridad
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            Protege el acceso al grupo cuando se comparte por enlace.
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent className="space-y-3">
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder={
              data.hasAccessPassword
                ? 'Cambiar contraseña (mínimo 4 caracteres)'
                : 'Definir contraseña (mínimo 4 caracteres)'
            }
            minLength={4}
          />
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button
              type="button"
              onClick={async () => {
                if (password.trim().length < 4) return
                await setAccessPasswordAsync({
                  groupId,
                  password,
                  participantId: getActiveParticipantId(),
                })
                setPassword('')
                await utils.groups.getDetails.invalidate({ groupId })
                toast({
                  title: data.hasAccessPassword
                    ? 'Contraseña actualizada'
                    : 'Contraseña activada',
                })
              }}
              disabled={isSettingPassword || password.trim().length < 4}
              className="h-11 w-full"
            >
              <Lock className="mr-2 h-4 w-4" />
              {data.hasAccessPassword ? 'Actualizar' : 'Activar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={async () => {
                await clearAccessPasswordAsync({
                  groupId,
                  participantId: getActiveParticipantId(),
                })
                setPassword('')
                await utils.groups.getDetails.invalidate({ groupId })
                toast({
                  title: 'Contraseña eliminada',
                })
              }}
              disabled={!data.hasAccessPassword || isClearingPassword}
              className="h-11 w-full"
            >
              <LockOpen className="mr-2 h-4 w-4" />
              Quitar
            </Button>
          </div>

          <div className="rounded-xl border bg-muted/30 p-3 text-sm text-muted-foreground">
            Con contraseña activa, compartir la URL ya no alcanza para entrar al
            grupo. Si la cambias, quienes ya entraron deberán validarse otra vez.
          </div>
        </GroupSectionContent>
      </GroupSectionCard>

      <GroupSectionCard className="border-destructive/30">
        <GroupSectionHeader>
          <GroupSectionTitle className="text-xl leading-none">
            Zona peligrosa
          </GroupSectionTitle>
          <GroupSectionDescription className="mt-2">
            Eliminar el grupo borra gastos, balances y actividad.
          </GroupSectionDescription>
        </GroupSectionHeader>
        <GroupSectionContent>
          <Dialog
            open={deleteDialogOpen}
            onOpenChange={(open) => {
              setDeleteDialogOpen(open)
              if (!open) {
                setDeleteConfirmChecked(false)
                setDeleteConfirmName('')
              }
            }}
          >
            <DialogTrigger asChild>
              <Button variant="destructive" className="h-11 w-full">
                <Trash2 className="mr-2 h-4 w-4" />
                Eliminar grupo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogTitle>¿Eliminar grupo?</DialogTitle>
              <DialogDescription>
                Se eliminarán participantes, gastos, deudas y actividad. Esta
                acción no se puede deshacer.
              </DialogDescription>
              <div className="space-y-3 py-2">
                <div className="flex items-start gap-2 rounded-md border bg-muted/30 p-3">
                  <Checkbox
                    id="confirm-delete-group"
                    checked={deleteConfirmChecked}
                    onCheckedChange={(checked) =>
                      setDeleteConfirmChecked(Boolean(checked))
                    }
                  />
                  <label
                    htmlFor="confirm-delete-group"
                    className="cursor-pointer text-sm leading-snug"
                  >
                    Entiendo que esta eliminación es definitiva.
                  </label>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Escribe el nombre del grupo para confirmar:
                  </p>
                  <Input
                    value={deleteConfirmName}
                    onChange={(event) => setDeleteConfirmName(event.target.value)}
                    placeholder={data.group.name}
                    autoComplete="off"
                  />
                </div>
              </div>
              <DialogFooter className="flex flex-col gap-2">
                <Button
                  type="button"
                  variant="destructive"
                  disabled={isDeletingGroup || !canDeleteGroup}
                  onClick={async () => {
                    await deleteGroupAsync({
                      groupId,
                      participantId: getActiveParticipantId(),
                    })
                    await utils.groups.invalidate()
                    toast({
                      title: 'Grupo eliminado',
                    })
                    router.push('/groups')
                  }}
                  className="w-full"
                >
                  Eliminar para siempre
                </Button>
                <DialogClose asChild>
                  <Button variant="secondary" className="w-full">
                    Cancelar
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </GroupSectionContent>
      </GroupSectionCard>
    </div>
  )
}
