import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { getGroups } from '@/services/groupService'
import { getInitials } from '@/lib/utils'
import { useState, useEffect } from 'react'
import { LayoutDashboard, Users, Plus, LogOut, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'

export default function Sidebar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])

  useEffect(() => {
    getGroups().then((r) => setGroups(r.data.groups || [])).catch(() => {})
  }, [])

  const handleLogout = () => { logout(); navigate('/login') }

  return (
    <aside className="hidden md:flex flex-col min-h-screen bg-sidebar border-r border-sidebar-border fixed top-0 left-0 z-30 w-16 lg:w-60 transition-all duration-200">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 lg:px-5 h-14 border-b border-sidebar-border flex-shrink-0 justify-center lg:justify-start">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-7 h-7 flex-shrink-0">
          <rect width="32" height="32" rx="8" fill="#00C48C"/>
          <path d="M9 10h14M9 16h14M9 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
          <circle cx="23" cy="22" r="3" fill="white"/>
        </svg>
        <span className="hidden lg:block font-semibold text-foreground tracking-tight text-[15px]">Splitwise</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">
        <NavLink
          to="/dashboard"
          title="Dashboard"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 justify-center lg:justify-start ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
            }`
          }
        >
          <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:block">Dashboard</span>
        </NavLink>

        {/* Groups top-level link */}
        <NavLink
          to="/groups"
          end
          title="Groups"
          className={({ isActive }) =>
            `flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-100 justify-center lg:justify-start ${
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
            }`
          }
        >
          <Users className="w-4 h-4 flex-shrink-0" />
          <span className="hidden lg:block">Groups</span>
        </NavLink>

        {/* Groups section */}
        <div className="mt-4">
          {/* lg: label + add button row */}
          <div className="hidden lg:flex items-center justify-between px-3 mb-1">
            <span className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">My Groups</span>
            <Button variant="ghost" size="icon-sm" onClick={() => navigate('/groups/new')}
              className="text-muted-foreground hover:text-foreground" title="New group">
              <Plus className="w-3.5 h-3.5" />
            </Button>
          </div>

          {/* Tablet: centered + icon only */}
          <div className="flex lg:hidden justify-center mt-2 mb-2">
            <Button variant="ghost" size="icon-sm" onClick={() => navigate('/groups/new')}
              className="text-muted-foreground hover:text-foreground" title="New group">
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Full group list — lg only */}
          <div className="hidden lg:block">
            {groups.length === 0 ? (
              <p className="px-3 py-1.5 text-xs text-muted-foreground">No groups yet</p>
            ) : (
              <div className="space-y-0.5">
                {groups.map((g) => (
                  <NavLink key={g.id} to={`/groups/${g.id}`}
                    className={({ isActive }) =>
                      `group flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors duration-100 ${
                        isActive ? 'bg-primary/10 text-primary font-medium' : 'text-sidebar-foreground hover:bg-accent hover:text-foreground'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className={`w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${
                          isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                        }`}>
                          {getInitials(g.name)}
                        </div>
                        <span className="flex-1 truncate">{g.name}</span>
                        <ChevronRight className="w-3 h-3 opacity-0 group-hover:opacity-40 transition-opacity flex-shrink-0" />
                      </>
                    )}
                  </NavLink>
                ))}
              </div>
            )}
          </div>

          {/* Tablet: group initials as icon links */}
          <div className="lg:hidden space-y-1 px-1">
            {groups.slice(0, 6).map((g) => (
              <NavLink key={g.id} to={`/groups/${g.id}`} title={g.name}
                className={({ isActive }) =>
                  `flex items-center justify-center w-full py-1.5 rounded-lg transition-colors ${
                    isActive ? 'bg-primary/10' : 'hover:bg-accent'
                  }`
                }
              >
                {({ isActive }) => (
                  <div className={`w-7 h-7 rounded-md flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'
                  }`}>
                    {getInitials(g.name)}
                  </div>
                )}
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* User footer */}
      <div className="border-t border-sidebar-border p-3 flex-shrink-0">
        <div className="hidden lg:flex items-center gap-2.5 px-1 mb-2">
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="text-[10px]">{getInitials(user?.name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground truncate leading-tight">{user?.name}</p>
            <p className="text-[11px] text-muted-foreground truncate leading-tight">{user?.email}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={handleLogout} title="Sign out"
          className="w-full justify-center lg:justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-2">
          <LogOut className="w-3.5 h-3.5" />
          <span className="hidden lg:block">Sign out</span>
        </Button>
      </div>
    </aside>
  )
}
