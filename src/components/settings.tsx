import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { CameraIcon, LockIcon } from 'lucide-react'

import { useConvexAuth, useQuery } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { SplashScreen } from './splashscreen'
import { ScrollArea } from '@/components/ui/scroll-area'

export function Settings() {
  const auth = useConvexAuth()
  const user = useQuery(api.users.currentUser)

  if (auth.isLoading || !auth.isAuthenticated || !user) {
    return <SplashScreen />
  }

  return (
    <ScrollArea className="h-full overflow-y-auto">
      <div className="mx-auto px-4 py-6 pb-20 max-w-xl">
        <h1 className="mb-4 font-bold text-primary text-2xl">Settings</h1>

        {/* Profile card */}
        <div className="bg-card mb-4 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.image} className="object-cover" />
              <AvatarFallback className="bg-muted font-bold text-xs">
                {user.name?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-base leading-tight">
                {user.name}
              </div>
              <div className="mt-0.5 text-muted-foreground text-xs">
                {user?.email}
              </div>
              <div className="mt-0.5 text-muted-foreground text-xs capitalize">
                {user?.role}
                {user?.department ? ` · ${user.department}` : ''}
              </div>
            </div>
          </div>

          {/* Detail rows */}
          <div className="border-border border-t divide-y divide-border">
            <DetailRow label="Email" value={user.email ?? '—'} />
            <DetailRow label="Phone" value={String(user.phone) ?? '—'} />
            <DetailRow label="Salary" value={`Rs. ${user.salary}`} />
            <DetailRow
              label="Employed since"
              value={
                user?._creationTime
                  ? new Date(user._creationTime).toLocaleDateString('en-US', {
                      month: 'long',
                      year: 'numeric',
                    })
                  : '—'
              }
            />
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {/* Profile Settings */}
          <button
            onClick={() => {
              window.open(
                'https://myaccount.google.com/personal-info',
                '_blank',
              )
            }}
            className="group flex items-center gap-3 hover:bg-accent/50 active:bg-accent px-4 py-3.5 border-border border-b w-full text-left transition-colors"
          >
            <div className="flex justify-center items-center bg-secondary rounded-lg w-8 h-8 shrink-0">
              <CameraIcon className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground text-sm">
                Google Profile
              </div>
              <div className="text-muted-foreground text-xs">
                Update photo, name, and email on Google
              </div>
            </div>
            <span className="text-muted-foreground text-xs transition-transform group-active:translate-x-1">
              ↗
            </span>
          </button>

          {/* Security Settings */}
          <button
            onClick={() => {
              window.open('https://myaccount.google.com/security', '_blank')
            }}
            className="group flex items-center gap-3 hover:bg-accent/50 active:bg-accent px-4 py-3.5 w-full text-left transition-colors"
          >
            <div className="flex justify-center items-center bg-secondary rounded-lg w-8 h-8 shrink-0">
              <LockIcon className="w-4 h-4 text-secondary-foreground" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground text-sm">
                Account Security
              </div>
              <div className="text-muted-foreground text-xs">
                Manage password and 2FA via Google
              </div>
            </div>
            <span className="text-muted-foreground text-xs transition-transform group-active:translate-x-1">
              ↗
            </span>
          </button>
        </div>
      </div>
    </ScrollArea>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center px-4 py-2.5">
      <span className="text-muted-foreground text-xs">{label}</span>
      <span className="font-medium text-foreground text-sm">{value}</span>
    </div>
  )
}
