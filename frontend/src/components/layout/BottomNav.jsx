import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Plus, Users } from 'lucide-react'

export default function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border">
      <div className="flex items-center justify-around px-4 pt-2 pb-5">

        {/* Dashboard */}
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        {/* FAB — Create group */}
        <button
          onClick={() => navigate('/groups/new')}
          aria-label="Create new group"
          className="flex flex-col items-center -mt-6"
        >
          <div className="w-[52px] h-[52px] rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">New</span>
        </button>

        {/* Groups */}
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-5 py-1 rounded-xl transition-colors ${
              'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          <Users className="w-5 h-5" />
          <span className="text-[10px] font-medium">Groups</span>
        </NavLink>

      </div>
    </nav>
  )
}
