import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import PageWrapper from '@/components/layout/PageWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { getDashboardBalances, getGroups } from '@/services/groupService'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, getInitials } from '@/lib/utils'
import { Plus, Users, ChevronRight, ArrowUpRight, ArrowDownLeft, HandCoins } from 'lucide-react'

export default function DashboardPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [balances, setBalances] = useState(null)
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getDashboardBalances(), getGroups()])
      .then(([b, g]) => { setBalances(b.data); setGroups(g.data.groups || []) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const net = balances?.overall_net ?? 0
  const isOwed = net > 0, isOwe = net < 0, isEven = net === 0

  return (
    <PageWrapper>
      {/* Full-width page header — spans both columns */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-lg font-semibold tracking-tight text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Hi {user?.name?.split(' ')[0]} 👋</p>
        </div>
        <Button size="sm" onClick={() => navigate('/groups/new')} id="create-group-btn">
          <Plus className="w-4 h-4" /> New Group
        </Button>
      </div>

      {/* Two-column layout: content | summary panel */}
      <div className="flex flex-col md:flex-row gap-6 md:items-start">

        {/* ── Left column — main content ── */}
        <div className="flex-1 min-w-0 space-y-4">

          {/* Groups list */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-0.5">
              Your Groups
            </p>

            {loading ? (
              <div className="space-y-1.5">
                {[1,2,3].map(i => (
                  <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                    <Skeleton className="w-9 h-9 rounded-lg" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-36 rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                    <Skeleton className="h-4 w-16 rounded" />
                  </div>
                ))}
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
                <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                  <Users className="w-5 h-5 text-muted-foreground" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">No groups yet</p>
                <p className="text-xs text-muted-foreground mb-4">Create a group to start splitting expenses with friends.</p>
                <Button size="sm" onClick={() => navigate('/groups/new')}>
                  <Plus className="w-3.5 h-3.5" /> Create group
                </Button>
              </div>
            ) : (
              <div className="space-y-1.5">
                {groups.map((g) => {
                  const gb = balances?.by_group?.find(b => b.group_id === g.id)
                  const gnet = gb?.net ?? 0
                  return (
                    <button
                      key={g.id}
                      onClick={() => navigate(`/groups/${g.id}`)}
                      className="group w-full flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/30 hover:bg-primary/[0.02] transition-all duration-150 text-left"
                    >
                      <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0">
                        {getInitials(g.name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium text-foreground truncate">{g.name}</p>
                        <p className="text-xs text-muted-foreground">{g.members?.length ?? 0} members</p>
                      </div>
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
          </div>
        </div>

        {/* ── Right column — sticky summary panel ── */}
        <div className="hidden md:flex flex-col gap-3 w-64 lg:w-72 flex-shrink-0 sticky top-6">

          {/* Overall balance card */}
          {loading ? (
            <div className="rounded-xl border border-border bg-card p-5 space-y-3">
              <Skeleton className="h-4 w-28 rounded" />
              <Skeleton className="h-8 w-36 rounded" />
              <Skeleton className="h-3 w-full rounded" />
              <Skeleton className="h-3 w-3/4 rounded" />
            </div>
          ) : (
            <div className={`rounded-xl border p-5 ${
              isOwed ? 'bg-success/5 border-success/20' :
              isOwe  ? 'bg-danger/5 border-danger/20' :
                       'bg-card border-border'
            }`}>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Overall Balance
              </p>
              <p className={`text-3xl font-bold tracking-tight mb-1 ${
                isOwed ? 'text-success' : isOwe ? 'text-danger' : 'text-foreground'
              }`}>
                {isEven ? formatCurrency(0) : (isOwe ? '-' : '+') + formatCurrency(Math.abs(net))}
              </p>
              <p className="text-xs text-muted-foreground mb-4">
                {isOwed ? 'You are owed across all groups' : isOwe ? 'You owe across all groups' : 'All settled up!'}
              </p>

              {!isEven && (
                <div className="space-y-2 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-success/10 flex items-center justify-center">
                        <ArrowDownLeft className="w-3 h-3 text-success" />
                      </div>
                      Owed to you
                    </div>
                    <span className="text-xs font-semibold text-success">{formatCurrency(balances.you_are_owed)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <div className="w-5 h-5 rounded-full bg-danger/10 flex items-center justify-center">
                        <ArrowUpRight className="w-3 h-3 text-danger" />
                      </div>
                      You owe
                    </div>
                    <span className="text-xs font-semibold text-danger">{formatCurrency(balances.you_owe)}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick actions */}
          <div className="rounded-xl border border-border bg-card p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Quick Actions
            </p>
            <div className="space-y-1.5">
              <button onClick={() => navigate('/groups/new')}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition-colors text-left">
                <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                </div>
                Create a group
              </button>
              {groups.length > 0 && (
                <button onClick={() => navigate(`/groups/${groups[0].id}/expenses/new`)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-foreground hover:bg-muted transition-colors text-left">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <HandCoins className="w-3.5 h-3.5 text-blue-600" />
                  </div>
                  Add an expense
                </button>
              )}
            </div>
          </div>

          {/* Group count stat */}
          {!loading && groups.length > 0 && (
            <div className="rounded-xl border border-border bg-card px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center">
                  <Users className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <span className="text-[13px] text-muted-foreground">Active groups</span>
              </div>
              <span className="text-[13px] font-semibold text-foreground">{groups.length}</span>
            </div>
          )}
        </div>

      </div>
    </PageWrapper>
  )
}

