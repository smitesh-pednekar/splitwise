import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import PageWrapper from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { getGroup, getGroupBalances } from '@/services/groupService'
import { createSettlement } from '@/services/settlementService'
import { getApiError, formatCurrency, getInitials } from '@/lib/utils'
import { ArrowLeft, ArrowRight, Loader2, CheckCircle2, Info, Banknote } from 'lucide-react'

const today = () => new Date().toISOString().split('T')[0]

export default function SettleUpPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [balances, setBalances] = useState([])
  const [form, setForm] = useState({ payer_id: '', payee_id: '', amount: '', date: today() })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    Promise.all([getGroup(id), getGroupBalances(id)])
      .then(([gRes, bRes]) => {
        const members = gRes.data.group.members
        setGroup(gRes.data.group)
        setBalances(bRes.data.balances || [])
        if (members.length >= 2)
          setForm(f => ({ ...f, payer_id: members[0].id, payee_id: members[1].id }))
      })
      .catch(() => navigate(`/groups/${id}`))
  }, [id, navigate])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.payer_id || !form.payee_id) e.payer_id = 'Select both parties.'
    else if (form.payer_id === form.payee_id) e.payee_id = 'Payer and payee must differ.'
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a valid amount.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await createSettlement(id, {
        payer_id: form.payer_id,
        payee_id: form.payee_id,
        amount: +form.amount,
        date: new Date(form.date).toISOString(),
      })
      toast.success('Payment recorded!')
      navigate(`/groups/${id}?tab=balances`)
    } catch (err) { toast.error(getApiError(err)) }
    finally { setSubmitting(false) }
  }

  const prefill = (b) => setForm(f => ({
    ...f,
    payer_id: b.from_user.id,
    payee_id: b.to_user.id,
    amount: String(b.amount),
  }))

  const members = group?.members || []
  const payerM = members.find(m => m.id === form.payer_id)
  const payeeM = members.find(m => m.id === form.payee_id)
  const existingBal = balances.find(b => b.from_user.id === form.payer_id && b.to_user.id === form.payee_id)

  const selectCls = "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors"

  return (
    <PageWrapper>
      {/* Full-width page header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/groups/${id}`)}
          className="-ml-1 text-muted-foreground gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> {group?.name || 'Back'}
        </Button>
        <div>
          <h1 className="text-lg font-semibold tracking-tight">Settle up</h1>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-8 md:items-start">

        {/* ── Left column: form ── */}
        <div className="flex-1 min-w-0 space-y-3">

          {/* Outstanding balances — quick-fill */}
          {balances.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                Outstanding
              </p>
              <div className="space-y-1">
                {balances.map((b, i) => (
                  <button key={i} type="button" onClick={() => prefill(b)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-muted hover:bg-primary/5 hover:border-primary/20 border border-transparent transition-all text-left">
                    <div className="flex items-center gap-1.5 text-[13px]">
                      <span className="font-medium">{b.from_user.name}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="font-medium">{b.to_user.name}</span>
                    </div>
                    <span className="text-[13px] font-semibold text-danger">{formatCurrency(b.amount)}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click a row to pre-fill the form.</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit}>
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">

              {/* Visual payer → payee flow */}
              {payerM && payeeM && (
                <div className="flex items-center justify-center gap-4 py-3 bg-muted/50 rounded-xl">
                  <div className="text-center">
                    <Avatar className="h-10 w-10 mx-auto mb-1">
                      <AvatarFallback className="text-xs">
                        {getInitials(payerM.name)}
                      </AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium">{payerM.name}</p>
                    <p className="text-[11px] text-muted-foreground">pays</p>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <div className="w-8 h-px bg-border" />
                    <ArrowRight className="w-4 h-4" />
                    <div className="w-8 h-px bg-border" />
                  </div>
                  <div className="text-center">
                    <Avatar className="h-10 w-10 mx-auto mb-1">
                      <AvatarFallback className="text-xs">{getInitials(payeeM.name)}</AvatarFallback>
                    </Avatar>
                    <p className="text-xs font-medium">{payeeM.name}</p>
                    <p className="text-[11px] text-muted-foreground">receives</p>
                  </div>
                </div>
              )}

              {/* From */}
              <div className="space-y-1.5">
                <Label htmlFor="settle-payer">From (paying)</Label>
                <select id="settle-payer" value={form.payer_id} onChange={set('payer_id')} className={selectCls}>
                  {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
                {errors.payer_id && <p className="text-xs text-destructive">{errors.payer_id}</p>}
              </div>

              {/* To */}
              <div className="space-y-1.5">
                <Label htmlFor="settle-payee">To (receiving)</Label>
                <select id="settle-payee" value={form.payee_id} onChange={set('payee_id')} className={selectCls}>
                  {members.filter(m => m.id !== form.payer_id).map(m =>
                    <option key={m.id} value={m.id}>{m.name}</option>
                  )}
                </select>
                {errors.payee_id && <p className="text-xs text-destructive">{errors.payee_id}</p>}
              </div>

              {/* Amount */}
              <div className="space-y-1.5">
                <Label htmlFor="settle-amount">Amount ($)</Label>
                <Input id="settle-amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                  value={form.amount} onChange={set('amount')} aria-invalid={!!errors.amount} />
                {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                {existingBal && (
                  <p className="text-xs text-muted-foreground">
                    Owes <span className="font-medium text-danger">{formatCurrency(existingBal.amount)}</span>
                    {' · '}
                    <button type="button"
                      onClick={() => setForm(f => ({ ...f, amount: String(existingBal.amount) }))}
                      className="text-primary hover:underline underline-offset-4">
                      Settle full amount
                    </button>
                  </p>
                )}
              </div>

              {/* Date */}
              <div className="space-y-1.5">
                <Label htmlFor="settle-date">Date</Label>
                <Input id="settle-date" type="date" value={form.date} onChange={set('date')} />
              </div>
            </div>

            <Button id="settle-submit" type="submit" disabled={submitting} className="w-full mt-3" size="lg">
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Recording…</>
                : 'Record payment'
              }
            </Button>
          </form>
        </div>

        {/* ── Right column: contextual panel ── */}
        <div className="hidden md:flex flex-col gap-4 w-64 lg:w-72 flex-shrink-0 sticky top-6">

          {/* All balances at a glance */}
          {balances.length > 0 && (
            <div className="bg-card rounded-xl border border-border p-4">
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
                Group debts
              </p>
              <div className="space-y-3">
                {balances.map((b, i) => (
                  <div key={i} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-foreground font-medium">{b.from_user.name}</span>
                      <span className="text-[13px] font-semibold text-danger">{formatCurrency(b.amount)}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div className="h-full rounded-full bg-danger/40" style={{ width: '100%' }} />
                      </div>
                    </div>
                    <p className="text-[11px] text-muted-foreground">owes {b.to_user.name}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* How settlements work */}
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              How it works
            </p>
            <div className="space-y-3">
              {[
                { icon: Banknote,      title: 'Partial payments OK', desc: 'You can pay any amount — the balance reduces automatically.' },
                { icon: CheckCircle2,  title: 'Balances update live', desc: 'Once recorded, the Balances tab reflects the payment instantly.' },
                { icon: Info,          title: 'No actual money moves', desc: 'This just records the payment. Use cash, UPI, or bank transfer separately.' },
              ].map(({ icon: Icon, title, desc }) => (
                <div key={title} className="flex gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground leading-tight">{title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Group stat */}
          {group && (
            <div className="bg-card rounded-xl border border-border px-4 py-3 flex items-center justify-between">
              <span className="text-[13px] text-muted-foreground">Members in group</span>
              <span className="text-[13px] font-semibold text-foreground">{members.length}</span>
            </div>
          )}

        </div>
      </div>
    </PageWrapper>
  )
}
