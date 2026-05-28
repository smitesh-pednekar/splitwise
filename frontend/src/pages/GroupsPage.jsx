import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getGroups } from '@/services/groupService'
import { getDashboardBalances } from '@/services/groupService'
import { formatCurrency, getInitials } from '@/lib/utils'
import { Plus, Users, ChevronRight } from 'lucide-react'

export default function GroupsPage() {
  const navigate = useNavigate()
  const [groups, setGroups] = useState([])
  const [balances, setBalances] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getGroups(), getDashboardBalances()])
      .then(([g, b]) => {
        setGroups(g.data.groups || [])
        setBalances(b.data)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  return (
    <PageWrapper>
      {/* Page header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Groups</h1>
          <p className="text-sm text-muted-foreground">
            {loading ? '—' : `${groups.length} group${groups.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <Button size="sm" onClick={() => navigate('/groups/new')} id="create-group-btn">
          <Plus className="w-4 h-4" /> New Group
        </Button>
      </div>

      {/* Groups list */}
      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card">
              <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Skeleton className="h-3.5 w-40 rounded" />
                <Skeleton className="h-3 w-24 rounded" />
              </div>
              <Skeleton className="h-4 w-14 rounded" />
            </div>
          ))}
        </div>
      ) : groups.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card p-12 text-center">
          <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">No groups yet</p>
          <p className="text-xs text-muted-foreground mb-5">
            Create a group to start splitting expenses with friends.
          </p>
          <Button size="sm" onClick={() => navigate('/groups/new')}>
            <Plus className="w-3.5 h-3.5" /> Create group
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {groups.map((g) => {
            const gb = balances?.by_group?.find((b) => b.group_id === g.id)
            const gnet = gb?.net ?? 0
            return (
              <button
                key={g.id}
                onClick={() => navigate(`/groups/${g.id}`)}
                className="group w-full flex items-center gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] active:scale-[0.99] transition-all duration-150 text-left"
              >
                {/* Group avatar */}
                <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-[12px] font-bold text-white flex-shrink-0">
                  {getInitials(g.name)}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-foreground truncate">{g.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.members?.length ?? 0} member{(g.members?.length ?? 0) !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Balance */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  {gnet === 0 ? (
                    <span className="text-xs text-muted-foreground">Settled</span>
                  ) : gnet > 0 ? (
                    <span className="text-xs font-semibold text-success">+{formatCurrency(gnet)}</span>
                  ) : (
                    <span className="text-xs font-semibold text-danger">-{formatCurrency(Math.abs(gnet))}</span>
                  )}
                  <ChevronRight className="w-4 h-4 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
                </div>
              </button>
            )
          })}
        </div>
      )}
    </PageWrapper>
  )
}
