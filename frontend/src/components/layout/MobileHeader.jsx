import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getInitials } from '@/lib/utils'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { LogOut, X } from 'lucide-react'

export default function MobileHeader() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  const handleLogout = () => {
    setOpen(false)
    logout()
    navigate('/login')
  }

  return (
    <>
      {/* Sticky top bar — mobile only */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-30 h-13 h-[52px] bg-background/95 backdrop-blur-sm border-b border-border flex items-center justify-between px-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-6 h-6 flex-shrink-0">
            <rect width="32" height="32" rx="8" fill="#00C48C"/>
            <path d="M9 10h14M9 16h14M9 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="23" cy="22" r="3" fill="white"/>
          </svg>
          <span className="font-semibold text-foreground tracking-tight text-[15px]">Splitwise</span>
        </div>

        {/* User avatar — tap to open profile sheet */}
        <button
          onClick={() => setOpen(true)}
          aria-label="Open profile menu"
          className="rounded-full active:opacity-70 transition-all"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-[11px] font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
        </button>
      </header>

      {/* Backdrop */}
      {open && (
        <div
          className="md:hidden fixed inset-0 z-40 bg-black/30 backdrop-blur-[2px]"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Bottom sheet — slides up */}
      <div className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl border-t border-border shadow-2xl transition-transform duration-300 ease-out ${
        open ? 'translate-y-0' : 'translate-y-full'
      }`}>
        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-muted-foreground/25" />
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <p className="text-[13px] font-semibold text-foreground">Account</p>
          <button onClick={() => setOpen(false)} className="text-muted-foreground">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User info */}
        <div className="px-5 py-4 flex items-center gap-3">
          <Avatar className="h-11 w-11">
            <AvatarFallback className="text-sm font-semibold">
              {getInitials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground truncate">{user?.name}</p>
            <p className="text-[12px] text-muted-foreground truncate">{user?.email}</p>
          </div>
        </div>

        {/* Sign out */}
        <div className="px-4 pb-8">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-destructive hover:bg-destructive/8 active:bg-destructive/15 transition-colors text-[14px] font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </>
  )
}
