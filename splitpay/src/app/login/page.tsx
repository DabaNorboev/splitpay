'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClient()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Редирект если уже залогинен
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.push('/dashboard')
    })
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Неверный email или пароль')
      setLoading(false)
    } else {
      router.push('/dashboard')
      router.refresh()
    }
  }
  
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white flex flex-col">

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/" className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </Link>
      </nav>

      {/* FORM */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="w-full max-w-sm">

          <h1 className="text-3xl font-black mb-2">Вход</h1>
          <p className="text-white/40 text-sm mb-8">
            Введи email и пароль чтобы войти
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-3.5 bg-[#111118] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/50 transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3.5 bg-[#111118] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/50 transition-colors"
                required
              />
            </div>

            {error && (
              <p className="text-sm text-[#f87171]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e] transition-colors disabled:opacity-50"
            >
              {loading ? 'Входим...' : 'Войти'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Нет аккаунта?{' '}
            <Link href="/register" className="text-[#4ade80] hover:underline">
              Зарегистрироваться
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}