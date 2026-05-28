import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import PageWrapper from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getGroup } from '@/services/groupService'
import { createExpense } from '@/services/expenseService'
import { getApiError, formatCurrency } from '@/lib/utils'
import { ArrowLeft, Loader2 } from 'lucide-react'

const CATEGORIES = ['Food', 'Travel', 'Rent', 'Utilities', 'Others']
const today = () => new Date().toISOString().split('T')[0]

export default function AddExpensePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [group, setGroup] = useState(null)
  const [form, setForm] = useState({ description: '', amount: '', payer_id: '', category: 'Others', date: today() })
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    getGroup(id)
      .then(r => { setGroup(r.data.group); setForm(f => ({ ...f, payer_id: r.data.group.members[0]?.id || '' })) })
      .catch(() => navigate(`/groups/${id}`))
  }, [id, navigate])

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }))

  const validate = () => {
    const e = {}
    if (!form.description.trim()) e.description = 'Description is required.'
    if (!form.amount || isNaN(+form.amount) || +form.amount <= 0) e.amount = 'Enter a valid amount.'
    if (!form.payer_id) e.payer_id = 'Select who paid.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    try {
      await createExpense(id, {
        description: form.description.trim(),
        amount: +form.amount,
        payer_id: form.payer_id,
        category: form.category,
        date: new Date(form.date).toISOString(),
      })
      toast.success('Expense added!')
      navigate(`/groups/${id}`)
    } catch (err) { toast.error(getApiError(err)) }
    finally { setSubmitting(false) }
  }

  const n = group?.members.length ?? 1
  const share = form.amount && +form.amount > 0 ? formatCurrency(+form.amount / n) : null

  return (
    <PageWrapper>
      {/* Full-width header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(`/groups/${id}`)}
          className="-ml-1 text-muted-foreground gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> {group?.name || 'Back'}
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">Add expense</h1>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        {/* ── Left: Form ── */}
        <div className="flex-1 min-w-0">
          <form onSubmit={handleSubmit} className="space-y-3">
            <Card>
              <CardContent className="pt-4 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="expense-desc">Description</Label>
                  <Input id="expense-desc" type="text" placeholder="Dinner, Uber, Groceries…"
                    value={form.description} onChange={set('description')} aria-invalid={!!errors.description} />
                  {errors.description && <p className="text-xs text-destructive">{errors.description}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expense-amount">Amount ($)</Label>
                  <Input id="expense-amount" type="number" min="0.01" step="0.01" placeholder="0.00"
                    value={form.amount} onChange={set('amount')} aria-invalid={!!errors.amount} />
                  {errors.amount && <p className="text-xs text-destructive">{errors.amount}</p>}
                  {share && (
                    <p className="text-xs text-muted-foreground">
                      Equal split: <span className="font-medium text-foreground">{share}</span> × {n} members
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expense-payer">Paid by</Label>
                  <select id="expense-payer" value={form.payer_id} onChange={set('payer_id')}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 transition-colors">
                    {group?.members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                  {errors.payer_id && <p className="text-xs text-destructive">{errors.payer_id}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map(cat => (
                      <button key={cat} type="button" onClick={() => setForm(f => ({ ...f, category: cat }))}
                        className={`px-3 py-1 text-xs font-medium rounded-full border transition-all duration-100 ${
                          form.category === cat
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
                        }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="expense-date">Date</Label>
                  <Input id="expense-date" type="date" value={form.date} onChange={set('date')} />
                </div>
              </CardContent>
            </Card>

            <Button id="add-expense-submit" type="submit" disabled={submitting} className="w-full" size="lg">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Adding…</> : 'Add expense'}
            </Button>
          </form>
        </div>

        {/* ── Right: Live split preview ── */}
        <div className="hidden lg:flex flex-col gap-4 w-72 flex-shrink-0 sticky top-6">

          {/* Live split preview */}
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Split preview
            </p>
            {form.amount && +form.amount > 0 && group ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                  <span>Total</span>
                  <span className="font-semibold text-foreground text-sm">{formatCurrency(+form.amount)}</span>
                </div>
                <div className="h-px bg-border" />
                {group.members.map(m => (
                  <div key={m.id} className="flex items-center justify-between">
                    <span className="text-[13px] text-foreground truncate flex-1">{m.name}</span>
                    <span className={`text-[13px] font-medium flex-shrink-0 ml-2 ${
                      m.id === form.payer_id ? 'text-success' : 'text-foreground'
                    }`}>
                      {m.id === form.payer_id
                        ? `+${formatCurrency(+form.amount - (+form.amount / n))}`
                        : `-${formatCurrency(+form.amount / n)}`
                      }
                    </span>
                  </div>
                ))}
                <div className="h-px bg-border" />
                <p className="text-[11px] text-muted-foreground">
                  {formatCurrency(+form.amount / n)} per person
                </p>
              </div>
            ) : (
              <p className="text-[13px] text-muted-foreground">
                Enter an amount to see the equal split across {group?.members.length ?? '—'} members.
              </p>
            )}
          </div>

          {/* Tips */}
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Tips
            </p>
            <ul className="space-y-2.5">
              {[
                'Expenses are split equally across all group members.',
                'The payer is shown as +net in the split — they get reimbursed.',
                'You can delete expenses anytime from the group page.',
              ].map((tip, i) => (
                <li key={i} className="flex gap-2 text-[12px] text-muted-foreground leading-relaxed">
                  <span className="w-4 h-4 rounded-full bg-primary/10 text-primary text-[10px] font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                    {i + 1}
                  </span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}
