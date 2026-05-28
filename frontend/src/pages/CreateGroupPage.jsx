import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import PageWrapper from '@/components/layout/PageWrapper'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { createGroup, addMember } from '@/services/groupService'
import { searchUser } from '@/services/authService'
import { getApiError, getInitials } from '@/lib/utils'
import {
  ArrowLeft, UserPlus, X, Loader2, Users,
  Plane, Home, UtensilsCrossed, PartyPopper, ShoppingCart, Briefcase
} from 'lucide-react'

const GROUP_TEMPLATES = [
  { icon: Plane,           label: 'Trip',       example: 'Europe Trip, Bali 2025' },
  { icon: Home,            label: 'Home',        example: 'Apartment, Roommates' },
  { icon: UtensilsCrossed, label: 'Food',        example: 'Team Lunch, Dinner Club' },
  { icon: ShoppingCart,    label: 'Shopping',    example: 'Groceries, Costco Run' },
  { icon: PartyPopper,     label: 'Event',       example: 'Wedding, Birthday Party' },
  { icon: Briefcase,       label: 'Work',        example: 'Team Offsite, Clients' },
]

export default function CreateGroupPage() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [nameError, setNameError] = useState('')
  const [emailInput, setEmailInput] = useState('')
  const [searchLoading, setSearchLoading] = useState(false)
  const [members, setMembers] = useState([])
  const [submitting, setSubmitting] = useState(false)

  const handleAddMember = async () => {
    const email = emailInput.trim().toLowerCase()
    if (!email) return
    if (members.find(m => m.email === email)) { toast.error('Already added.'); return }
    setSearchLoading(true)
    try {
      const res = await searchUser(email)
      setMembers(prev => [...prev, res.data.user])
      setEmailInput('')
    } catch (err) { toast.error(getApiError(err)) }
    finally { setSearchLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) { setNameError('Group name is required.'); return }
    setNameError('')
    setSubmitting(true)
    try {
      const res = await createGroup({ name: name.trim() })
      const gid = res.data.group.id
      for (const m of members) { try { await addMember(gid, m.email) } catch {} }
      toast.success(`"${name.trim()}" created!`)
      navigate(`/groups/${gid}`)
    } catch (err) { toast.error(getApiError(err)) }
    finally { setSubmitting(false) }
  }

  return (
    <PageWrapper>
      {/* Full-width page header */}
      <div className="flex items-center gap-3 mb-5">
        <Button variant="ghost" size="sm" onClick={() => navigate(-1)}
          className="-ml-1 text-muted-foreground gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </Button>
        <h1 className="text-lg font-semibold tracking-tight">Create a group</h1>
      </div>

      {/* Two-column layout */}
      <div className="flex flex-col md:flex-row gap-8 md:items-start">

        {/* ── Left: Form ── */}
        <div className="flex-1 min-w-0">

          <form onSubmit={handleSubmit} className="space-y-3">
            {/* Group name */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-1.5">
              <Label htmlFor="group-name">Group name</Label>
              <Input
                id="group-name"
                type="text"
                value={name}
                onChange={e => { setName(e.target.value); setNameError('') }}
                placeholder="Europe Trip, Apartment, Team Lunch…"
                aria-invalid={!!nameError}
              />
              {nameError && <p className="text-xs text-destructive">{nameError}</p>}
            </div>

            {/* Add members */}
            <div className="bg-card rounded-xl border border-border p-4 space-y-3">
              <div>
                <Label className="mb-1.5 block">Add members</Label>
                <div className="flex gap-2">
                  <Input
                    id="member-email-input"
                    type="email"
                    value={emailInput}
                    onChange={e => setEmailInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddMember())}
                    placeholder="friend@example.com"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    id="add-member-btn"
                    onClick={handleAddMember}
                    disabled={searchLoading}
                    variant="outline"
                  >
                    {searchLoading
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <><UserPlus className="w-4 h-4" /> Add</>
                    }
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">
                  Person must have an account. You're added automatically.
                </p>
              </div>

              {/* Members list */}
              {members.length > 0 ? (
                <div className="space-y-1.5 pt-2 border-t border-border">
                  {members.map(m => (
                    <div key={m.id} className="flex items-center gap-2.5 py-1">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className="text-[10px]">{getInitials(m.name)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-medium truncate">{m.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{m.email}</p>
                      </div>
                      <Button
                        type="button" variant="ghost" size="icon-sm"
                        onClick={() => setMembers(prev => prev.filter(x => x.id !== m.id))}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-xs text-muted-foreground pt-2 border-t border-border">
                  <Users className="w-3.5 h-3.5" /> Only you so far — add members above
                </div>
              )}
            </div>

            <Button
              id="create-group-submit"
              type="submit"
              disabled={submitting}
              className="w-full"
              size="lg"
            >
              {submitting
                ? <><Loader2 className="w-4 h-4 animate-spin" />Creating…</>
                : 'Create group'
              }
            </Button>
          </form>
        </div>

        {/* ── Right: Contextual help panel ── */}
        <div className="hidden md:flex flex-col gap-4 w-64 lg:w-72 flex-shrink-0 sticky top-6">

          {/* Quick-fill templates */}
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Popular group types
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {GROUP_TEMPLATES.map(({ icon: Icon, label, example }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setName(prev => prev || example.split(',')[0].trim())}
                  className="flex items-center gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-muted transition-colors group"
                >
                  <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground">{label}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{example.split(',')[0]}</p>
                  </div>
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted-foreground mt-2.5">Click a type to prefill the name.</p>
          </div>

          {/* How it works */}
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              How groups work
            </p>
            <ol className="space-y-3">
              {[
                { n: '1', title: 'Create the group', desc: 'Give it a name and invite members by email.' },
                { n: '2', title: 'Add expenses',     desc: 'Log who paid and the amount — splits are equal.' },
                { n: '3', title: 'Track balances',   desc: 'See exactly who owes whom in real time.' },
                { n: '4', title: 'Settle up',        desc: 'Record payments to clear outstanding debts.' },
              ].map(({ n, title, desc }) => (
                <li key={n} className="flex gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary flex-shrink-0 mt-0.5">
                    {n}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-foreground leading-tight">{title}</p>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mt-0.5">{desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>

        </div>
      </div>
    </PageWrapper>
  )
}
