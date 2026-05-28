import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/context/AuthContext'
import { register as registerApi } from '@/services/authService'
import { getApiError } from '@/lib/utils'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'

export default function RegisterPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [showPw, setShowPw] = useState(false)

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = 'Full name is required.'
    if (!form.email.trim()) e.email = 'Email is required.'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters.'
    setErrors(e)
    return !Object.keys(e).length
  }

  const handleSubmit = async (ev) => {
    ev.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await registerApi({ name: form.name.trim(), email: form.email.trim().toLowerCase(), password: form.password })
      login(res.data.token, res.data.user)
      navigate('/dashboard')
    } catch (err) {
      toast.error(getApiError(err))
    } finally {
      setLoading(false)
    }
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className="min-h-screen bg-muted/40 flex items-center justify-center p-4">
      <div className="w-full max-w-sm sm:max-w-md lg:max-w-sm space-y-6">
        <div className="text-center space-y-3">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" fill="none" className="w-11 h-11 block mx-auto">
            <rect width="32" height="32" rx="8" fill="#00C48C"/>
            <path d="M9 10h14M9 16h14M9 22h8" stroke="white" strokeWidth="2.5" strokeLinecap="round"/>
            <circle cx="23" cy="22" r="3" fill="white"/>
          </svg>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Create your account</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Start splitting expenses with friends</p>
          </div>
        </div>

        <Card className="shadow-sm">
          <CardContent className="pt-5">
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="reg-name">Full name</Label>
                <Input id="reg-name" type="text" autoComplete="name" placeholder="Jane Doe"
                  value={form.name} onChange={set('name')} aria-invalid={!!errors.name} />
                {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-email">Email address</Label>
                <Input id="reg-email" type="email" autoComplete="email" placeholder="you@example.com"
                  value={form.email} onChange={set('email')} aria-invalid={!!errors.email} />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reg-password">Password</Label>
                <div className="relative">
                  <Input id="reg-password" type={showPw ? 'text' : 'password'}
                    autoComplete="new-password" placeholder="Min. 6 characters"
                    value={form.password} onChange={set('password')}
                    className="pr-9" aria-invalid={!!errors.password} />
                  <button type="button" onClick={() => setShowPw((p) => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors" tabIndex={-1}>
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <Button id="register-submit" type="submit" disabled={loading} className="w-full" size="lg">
                {loading ? <><Loader2 className="w-4 h-4 animate-spin" />Creating account…</> : 'Create account'}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
