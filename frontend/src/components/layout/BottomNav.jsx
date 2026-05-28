import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Users, Plus } from 'lucide-react'

export default function BottomNav() {
  const navigate = useNavigate()

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-background/95 backdrop-blur-sm border-t border-border safe-area-pb">
      <div className="flex items-center justify-around px-2 pt-1.5 pb-5">

        {/* Home / Dashboard */}
        <NavLink
          to="/dashboard"
          end
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <LayoutDashboard className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : ''}`}>
                Home
              </span>
            </>
          )}
        </NavLink>

        {/* FAB — New Group (center) */}
        <button
          onClick={() => navigate('/groups/new')}
          aria-label="Create new group"
          className="flex flex-col items-center -mt-5 gap-0.5"
        >
          <div className="w-[52px] h-[52px] rounded-full bg-primary shadow-lg shadow-primary/30 flex items-center justify-center text-white active:scale-95 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground">New</span>
        </button>

        {/* Groups */}
        <NavLink
          to="/groups"
          className={({ isActive }) =>
            `flex flex-col items-center gap-0.5 px-6 py-1.5 rounded-xl transition-colors ${
              isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <Users className={`w-5 h-5 transition-transform duration-150 ${isActive ? 'scale-110' : ''}`} />
              <span className={`text-[10px] font-medium transition-colors ${isActive ? 'text-primary' : ''}`}>
                Groups
              </span>
            </>
          )}
        </NavLink>

      </div>
    </nav>
  )
}
