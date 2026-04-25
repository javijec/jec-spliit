import { saveRecentGroup } from '@/app/groups/recent-groups-helpers'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { useMediaQuery } from '@/lib/hooks'
import { trpc } from '@/trpc/client'
import { Loader2, Plus } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'

type Props = {
  reload: () => void
}

export function AddGroupByUrlButton({ reload }: Props) {
  const t = useTranslations('Groups.AddByURL')
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const [url, setUrl] = useState('')
  const [error, setError] = useState(false)
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState(false)
  const utils = trpc.useUtils()
  const { data: viewerData } = trpc.viewer.getCurrent.useQuery(undefined, {
    staleTime: 10 * 60 * 1000,
  })
  const recordVisit = trpc.groups.recordVisit.useMutation({
    onSuccess: async () => {
      await utils.groups.mine.invalidate()
    },
  })

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const [, groupId] =
      url.match(
        new RegExp(`${window.location.origin}/groups/([^/]+)`),
      ) ?? []
    setPending(true)
    const { group } = await utils.groups.get.fetch({
      groupId: groupId,
    })
    if (group) {
      if (viewerData?.user) {
        await recordVisit.mutateAsync({ groupId: group.id })
      } else {
        saveRecentGroup({ id: group.id, name: group.name })
      }
      reload()
      setUrl('')
      setOpen(false)
      setPending(false)
    } else {
      setError(true)
      setPending(false)
    }
  }

  const formContent = (
    <>
      <form className="flex flex-col gap-2 sm:flex-row" onSubmit={handleSubmit}>
        <Input
          type="url"
          required
          placeholder="https://spliit.app/..."
          className="flex-1 text-base"
          value={url}
          disabled={pending || recordVisit.isPending}
          onChange={(event) => {
            setUrl(event.target.value)
            setError(false)
          }}
        />
        <Button
          size="default"
          type="submit"
          disabled={pending || recordVisit.isPending}
          className="w-full sm:w-auto"
        >
          {pending || recordVisit.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Plus className="mr-2 h-4 w-4 sm:mr-0" />
              <span className="sm:hidden">{t('button')}</span>
            </>
          )}
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{t('error')}</p>}
    </>
  )

  if (!isDesktop) {
    return (
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerTrigger asChild>
          <Button variant="secondary">{t('button')}</Button>
        </DrawerTrigger>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{t('title')}</DrawerTitle>
            <DrawerDescription>{t('description')}</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 p-4 pt-0">{formContent}</div>
        </DrawerContent>
      </Drawer>
    )
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="secondary">{t('button')}</Button>
      </PopoverTrigger>
      <PopoverContent
        align={isDesktop ? 'end' : 'start'}
        className="flex flex-col gap-3 [&_p]:text-sm"
      >
        <h3 className="text-sm font-semibold">{t('title')}</h3>
        <p>{t('description')}</p>
        {formContent}
      </PopoverContent>
    </Popover>
  )
}
