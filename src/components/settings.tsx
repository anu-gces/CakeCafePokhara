import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { pb } from '@/lib/pocketbase'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CameraIcon, LoaderIcon, LockIcon, UserIcon } from 'lucide-react'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { useNavigate, useRouteContext } from '@tanstack/react-router'
import { handlePbError } from '@/lib/utils'

export function Settings() {
  const { auth } = useRouteContext({ from: '/home' })
  const user = auth.user!
  const navigate = useNavigate()

  const [usernameDrawerOpen, setUsernameDrawerOpen] = useState(false)
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(false)
  const [profileDrawerOpen, setProfileDrawerOpen] = useState(false)

  const [newUsername, setNewUsername] = useState('')
  const [usernameLoading, setUsernameLoading] = useState(false)

  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  // Profile fields
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profileLoading, setProfileLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const initials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
    : '??'

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileDrawerOpen = () => {
    setFirstName(user?.firstName ?? '')
    setLastName(user?.lastName ?? '')
    setPhoneNumber(String(user?.phoneNumber ?? ''))
    setAvatarFile(null)
    setAvatarPreview(null)
    setProfileDrawerOpen(true)
  }

  const handleProfileSave = async () => {
    setProfileLoading(true)
    try {
      const formData = new FormData()
      if (firstName.trim()) formData.append('firstName', firstName.trim())
      if (lastName.trim()) formData.append('lastName', lastName.trim())
      if (phoneNumber.trim()) formData.append('phoneNumber', phoneNumber.trim())
      if (avatarFile) formData.append('avatar', avatarFile)

      await pb.collection('users').update(user.id, formData)
      toast.success('Profile updated!')
      setProfileDrawerOpen(false)
    } catch (err: unknown) {
      handlePbError(err)
    } finally {
      setProfileLoading(false)
    }
  }

  const handleUsernameChange = async () => {
    if (!newUsername.trim()) return
    setUsernameLoading(true)
    try {
      await pb.collection('users').update(user.id, { username: newUsername })
      toast.success('Username updated!')
      setUsernameDrawerOpen(false)
      setNewUsername('')
    } catch (err: unknown) {
      handlePbError(err)
    } finally {
      setUsernameLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match.')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters.')
      return
    }
    setPasswordLoading(true)
    try {
      await pb.collection('users').update(user.id, {
        oldPassword,
        password: newPassword,
        passwordConfirm: confirmPassword,
      })
      pb.authStore.clear()
      toast.success('Password updated!')
      setPasswordDrawerOpen(false)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      navigate({ to: '/' })
    } catch (err: unknown) {
      handlePbError(err)
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto px-4 py-6 pb-20 max-w-xl">
        <h1 className="mb-4 font-bold text-primary text-2xl">Settings</h1>

        {/* Profile card */}
        <div className="bg-card mb-4 border border-border rounded-xl overflow-hidden">
          <div className="flex items-center gap-3 px-4 py-4">
            <Avatar className="w-14 h-14 shrink-0">
              <AvatarImage
                src={user ? pb.files.getURL(user, user.avatar) : undefined}
                alt={user ? `${user.firstName} ${user.lastName}` : ''}
              />
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-foreground text-base leading-tight">
                {user?.firstName} {user?.lastName}
              </div>
              <div className="mt-0.5 text-muted-foreground text-xs">
                @{user?.username}
              </div>
              <div className="mt-0.5 text-muted-foreground text-xs capitalize">
                {user?.role}
                {user?.department ? ` · ${user.department}` : ''}
              </div>
            </div>
          </div>

          {/* Detail rows */}
          <div className="border-border border-t divide-y divide-border">
            <DetailRow label="Email" value={user?.email ?? '—'} />
            <DetailRow label="Phone" value={String(user?.phoneNumber) ?? '—'} />
            <DetailRow
              label="Username"
              value={user?.username ? `@${user.username}` : '—'}
            />
            <DetailRow
              label="Employed since"
              value={
                user?.created
                  ? new Date(user.created).toLocaleDateString('en-US', {
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
          <button
            className="flex items-center gap-3 active:bg-muted px-4 py-3.5 border-border border-b w-full text-left transition-colors"
            onClick={handleProfileDrawerOpen}
          >
            <div className="flex justify-center items-center rounded-lg w-8 h-8 shrink-0">
              <CameraIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground text-sm">
                Edit profile
              </div>
              <div className="text-muted-foreground text-xs">
                Update your photo, name, email and phone
              </div>
            </div>
            <span className="text-muted-foreground text-xs">›</span>
          </button>

          <button
            className="flex items-center gap-3 active:bg-muted px-4 py-3.5 border-border border-b w-full text-left transition-colors"
            onClick={() => setUsernameDrawerOpen(true)}
          >
            <div className="flex justify-center items-center rounded-lg w-8 h-8 shrink-0">
              <UserIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground text-sm">
                Change username
              </div>
              <div className="text-muted-foreground text-xs">
                Update your display username
              </div>
            </div>
            <span className="text-muted-foreground text-xs">›</span>
          </button>

          <button
            className="flex items-center gap-3 active:bg-muted px-4 py-3.5 w-full text-left transition-colors"
            onClick={() => setPasswordDrawerOpen(true)}
          >
            <div className="flex justify-center items-center rounded-lg w-8 h-8 shrink-0">
              <LockIcon className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <div className="font-medium text-foreground text-sm">
                Change password
              </div>
              <div className="text-muted-foreground text-xs">
                Update your account password
              </div>
            </div>
            <span className="text-muted-foreground text-xs">›</span>
          </button>
        </div>
      </div>

      {/* Edit Profile Drawer */}
      <Drawer open={profileDrawerOpen} onOpenChange={setProfileDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit profile</DrawerTitle>
            <DrawerDescription>
              Update your photo, name, email and phone number.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-4 px-4 py-2">
            {/* Avatar picker */}
            <div className="flex flex-col items-center gap-2">
              <div
                className="group relative cursor-pointer"
                onClick={() => fileInputRef.current?.click()}
              >
                <Avatar className="w-20 h-20">
                  <AvatarImage
                    src={
                      avatarPreview ??
                      (user ? pb.files.getURL(user, user.avatar) : undefined)
                    }
                    alt="Avatar preview"
                  />
                  <AvatarFallback className="bg-violet-100 dark:bg-violet-900/40 font-semibold text-violet-700 dark:text-violet-300 text-lg">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 flex justify-center items-center bg-black/40 opacity-0 group-hover:opacity-100 rounded-full transition-opacity">
                  <CameraIcon className="w-5 h-5 text-white" />
                </div>
              </div>
              <button
                className="text-primary text-xs underline underline-offset-2"
                onClick={() => fileInputRef.current?.click()}
              >
                Change photo
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="gap-3 grid grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phoneNumber">Phone number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 234 567 8900"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button onClick={handleProfileSave} disabled={profileLoading}>
              {profileLoading ? (
                <>
                  <LoaderIcon
                    className="mr-2 w-4 h-4 animate-spin"
                    color="white"
                  />
                  Saving...
                </>
              ) : (
                'Save profile'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Username Drawer */}
      <Drawer open={usernameDrawerOpen} onOpenChange={setUsernameDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Change username</DrawerTitle>
          </DrawerHeader>
          <div className="space-y-3 px-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="newUsername">New username</Label>
              <Input
                id="newUsername"
                placeholder={`Current: ${user?.username}`}
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handleUsernameChange}
              disabled={!newUsername.trim() || usernameLoading}
            >
              {usernameLoading ? (
                <>
                  <LoaderIcon
                    className="mr-2 w-4 h-4 animate-spin"
                    color="white"
                  />
                  Saving...
                </>
              ) : (
                'Save username'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>

      {/* Password Drawer */}
      <Drawer open={passwordDrawerOpen} onOpenChange={setPasswordDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Change password</DrawerTitle>
            <DrawerDescription className="text-red-500">
              Warning: Changing your password will log you out of all other
              sessions.
            </DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 px-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="oldPassword">Current password</Label>
              <Input
                id="oldPassword"
                type="password"
                placeholder="Enter current password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New password</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm new password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          <DrawerFooter>
            <Button
              onClick={handlePasswordChange}
              disabled={
                !oldPassword ||
                !newPassword ||
                !confirmPassword ||
                passwordLoading
              }
            >
              {passwordLoading ? (
                <>
                  <LoaderIcon
                    className="mr-2 w-4 h-4 animate-spin"
                    color="white"
                  />
                  Saving...
                </>
              ) : (
                'Save password'
              )}
            </Button>
            <DrawerClose asChild>
              <Button variant="outline">Cancel</Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
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
