import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import PageWrapper from '@/components/layout/PageWrapper'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge, CATEGORY_BADGE_VARIANT } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { getGroup, deleteGroup, removeMember, getGroupBalances } from '@/services/groupService'
import { getExpenses, deleteExpense } from '@/services/expenseService'
import { useAuth } from '@/context/AuthContext'
import { formatCurrency, formatDate, getInitials, getApiError } from '@/lib/utils'
import {
  ArrowLeft, Plus, Receipt, HandCoins, Trash2, Crown,
  UserMinus, CheckCircle2, ArrowRight, Loader2
} from 'lucide-react'

export default function GroupDetailPage() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [group, setGroup] = useState(null)
  const [expenses, setExpenses] = useState([])
  const [balances, setBalances] = useState([])
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'expenses')
  const [loading, setLoading] = useState(true)
  const [balancesLoading, setBalancesLoading] = useState(false)

  const fetchGroup = useCallback(async () => {
    try {
      const [gRes, eRes] = await Promise.all([getGroup(id), getExpenses(id)])
      setGroup(gRes.data.group)
      setExpenses(eRes.data.expenses || [])
    } catch { toast.error('Failed to load group.'); navigate('/dashboard') }
    finally { setLoading(false) }
  }, [id, navigate])

  const fetchBalances = useCallback(async () => {
    setBalancesLoading(true)
    try { const r = await getGroupBalances(id); setBalances(r.data.balances || []) }
    catch { toast.error('Failed to load balances.') }
    finally { setBalancesLoading(false) }
  }, [id])

  useEffect(() => { fetchGroup() }, [fetchGroup])
  useEffect(() => { if (activeTab === 'balances') fetchBalances() }, [activeTab, fetchBalances])

  const isAdmin = group?.admin_id === user?.id
  const canEdit = (e) => e.created_by_id === user?.id || isAdmin

  const handleDeleteGroup = async () => {
    if (!window.confirm(`Delete "${group.name}"? All expenses will be removed.`)) return
    try { await deleteGroup(id); toast.success('Group deleted.'); navigate('/dashboard') }
    catch (err) { toast.error(getApiError(err)) }
  }

  const handleRemoveMember = async (mId, mName) => {
    const isSelf = mId === user?.id
    if (!window.confirm(isSelf ? 'Leave this group?' : `Remove ${mName}?`)) return
    try {
      await removeMember(id, mId)
      if (isSelf) { toast.success('You left the group.'); navigate('/dashboard') }
      else { toast.success(`${mName} removed.`); fetchGroup() }
    } catch (err) { toast.error(getApiError(err)) }
  }

  const handleDeleteExpense = async (expId, desc) => {
    if (!window.confirm(`Delete "${desc}"?`)) return
    try {
      await deleteExpense(id, expId)
      toast.success('Expense deleted.')
      setExpenses(prev => prev.filter(e => e.id !== expId))
    } catch (err) { toast.error(getApiError(err)) }
  }

  if (loading) return (
    <PageWrapper>
      <div className="space-y-3">
        <Skeleton className="h-8 w-48 rounded-lg" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </PageWrapper>
  )
  if (!group) return null

  return (
    <PageWrapper>
      {/* Back */}
      <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}
        className="-ml-1 mb-4 text-muted-foreground gap-1.5">
        <ArrowLeft className="w-3.5 h-3.5" /> Dashboard
      </Button>

      {/* Group header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-[13px] font-bold text-white flex-shrink-0">
            {getInitials(group.name)}
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight leading-tight">{group.name}</h1>
            <p className="text-xs text-muted-foreground">{group.members.length} members</p>
          </div>
        </div>
        {isAdmin && (
          <Button variant="ghost" size="sm" onClick={handleDeleteGroup}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 gap-1.5 flex-shrink-0">
            <Trash2 className="w-3.5 h-3.5" /> Delete
          </Button>
        )}
      </div>

      {/* Members row */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {group.members.map(m => (
          <div key={m.id}
            className="inline-flex items-center gap-1.5 bg-card border border-border rounded-full pl-1 pr-2.5 py-0.5">
            <Avatar className="h-5 w-5">
              <AvatarFallback className="text-[9px]">{getInitials(m.name)}</AvatarFallback>
            </Avatar>
            <span className="text-[12px] font-medium">{m.id === user?.id ? 'You' : m.name}</span>
            {m.id === group.admin_id && <Crown className="w-3 h-3 text-amber-500 flex-shrink-0" />}
            {(isAdmin || m.id === user?.id) && m.id !== group.admin_id && (
              <button onClick={() => handleRemoveMember(m.id, m.name)}
                className="text-muted-foreground/40 hover:text-destructive transition-colors ml-0.5">
                <UserMinus className="w-3 h-3" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="expenses" id="tab-expenses">Expenses</TabsTrigger>
          <TabsTrigger value="balances" id="tab-balances">Balances</TabsTrigger>
        </TabsList>

        {/* Expenses Tab */}
        <TabsContent value="expenses">
          <div className="flex justify-end mb-3">
            <Button size="sm" id="add-expense-btn" onClick={() => navigate(`/groups/${id}/expenses/new`)}>
              <Plus className="w-4 h-4" /> Add expense
            </Button>
          </div>

          {expenses.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-3">
                <Receipt className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-sm font-medium mb-1">No expenses yet</p>
              <p className="text-xs text-muted-foreground mb-4">Add the first expense to start tracking.</p>
              <Button size="sm" onClick={() => navigate(`/groups/${id}/expenses/new`)}>
                <Plus className="w-3.5 h-3.5" /> Add expense
              </Button>
            </div>
          ) : (
            <div className="space-y-1.5">
              {expenses.map(e => (
                <div key={e.id}
                  className="group flex items-center gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                    <Receipt className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium truncate">{e.description}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-muted-foreground">
                        {e.payer.id === user?.id ? 'You paid' : `${e.payer.name} paid`}
                      </span>
                      <span className="text-muted-foreground/40 text-xs">·</span>
                      <span className="text-xs text-muted-foreground">{formatDate(e.date)}</span>
                      <Badge variant={CATEGORY_BADGE_VARIANT[e.category] || 'others'} className="ml-0.5">
                        {e.category}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0 mr-1">
                    <p className="text-[13px] font-semibold">{formatCurrency(e.amount)}</p>
                    <p className="text-[11px] text-muted-foreground">÷{e.participants.length}</p>
                  </div>
                  {canEdit(e) && (
                    <Button variant="ghost" size="icon-sm"
                      onClick={() => handleDeleteExpense(e.id, e.description)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive hover:bg-destructive/10 flex-shrink-0">
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Balances Tab */}
        <TabsContent value="balances">
          <div className="flex justify-end mb-3">
            <Button size="sm" id="settle-up-btn" onClick={() => navigate(`/groups/${id}/settle`)}>
              <HandCoins className="w-4 h-4" /> Settle up
            </Button>
          </div>

          {balancesLoading ? (
            <div className="space-y-2">
              {[1,2].map(i => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                  <Skeleton className="h-4 w-40 rounded" />
                  <Skeleton className="h-4 w-16 rounded" />
                </div>
              ))}
            </div>
          ) : balances.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-card p-8 text-center">
              <CheckCircle2 className="w-8 h-8 text-success mx-auto mb-3" />
              <p className="text-sm font-medium">All settled up! 🎉</p>
              <p className="text-xs text-muted-foreground mt-1">No outstanding balances.</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {balances.map((b, i) => {
                const fromMe = b.from_user.id === user?.id
                const toMe = b.to_user.id === user?.id
                return (
                  <div key={i}
                    className="flex items-center justify-between p-3 rounded-xl border border-border bg-card">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Avatar className="h-7 w-7 flex-shrink-0">
                        <AvatarFallback className="text-[10px]">{getInitials(b.from_user.name)}</AvatarFallback>
                      </Avatar>
                      <span className="text-[13px] text-foreground min-w-0">
                        <span className="font-medium">{fromMe ? 'You' : b.from_user.name}</span>
                        <span className="text-muted-foreground mx-1">→</span>
                        <span className="font-medium">{toMe ? 'you' : b.to_user.name}</span>
                      </span>
                    </div>
                    <span className={`text-[13px] font-semibold flex-shrink-0 ml-3 ${fromMe ? 'text-danger' : toMe ? 'text-success' : 'text-foreground'}`}>
                      {formatCurrency(b.amount)}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </PageWrapper>
  )
}
