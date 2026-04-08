'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  redirect('/dashboard')
}

export default function RegisterPage() {
  const router = useRouter()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault()
  setError('')
  setLoading(true)

  const supabase = createClient()

  try {
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name: name.trim() },
      },
    })

    console.log('signUp response:', { data, error: signUpError }) // ← для отладки

    if (signUpError) {
      console.error('Supabase SignUp Error:', signUpError)
      
      // Более умная обработка ошибок
      if (signUpError.message.includes('already registered') || 
          signUpError.message.includes('already exists')) {
        setError('Этот email уже зарегистрирован. Попробуй войти или использовать другой.')
      } else if (signUpError.message.includes('Password')) {
        setError('Пароль слишком слабый. Минимум 6 символов.')
      } else if (signUpError.status === 429) {
        setError('Слишком много попыток. Подожди немного и попробуй снова.')
      } else {
        setError(signUpError.message || 'Ошибка регистрации. Проверь данные.')
      }
      return
    }

    // Если дошли сюда — регистрация прошла (или требует подтверждения email)
    if (data.user) {
      console.log('User created:', data.user.id)

      // Сохраняем в таблицу users
      const { error: dbError } = await supabase
        .from('users')
        .upsert({
          id: data.user.id,
          name: name.trim(),
          phone: '',
          is_verified: false,
        })

      if (dbError) {
        console.error('DB users error:', dbError)
        // Не блокируем регистрацию, если только таблица users упала
      }
    }

    // Успех
    alert('Регистрация прошла успешно! Теперь войди в аккаунт.')
    router.push('/login')   // лучше на логин, особенно если email confirmation включён
    router.refresh()

  } catch (err: any) {
    console.error('Unexpected error during signup:', err)
    setError('Неожиданная ошибка. Попробуй ещё раз.')
  } finally {
    setLoading(false)
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
          <h1 className="text-3xl font-black mb-2">Регистрация</h1>
          <p className="text-white/40 text-sm mb-8">
            Создай аккаунт — это займёт 30 секунд
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                Имя
              </label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Алексей"
                maxLength={50}
                className="w-full px-4 py-3.5 bg-[#111118] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/50 transition-colors"
                required
              />
            </div>

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
                minLength={6}
                className="w-full px-4 py-3.5 bg-[#111118] border border-white/10 rounded-xl text-white placeholder:text-white/20 focus:outline-none focus:border-[#4ade80]/50 transition-colors"
                required
              />
              <p className="mt-1.5 text-xs text-white/20">Минимум 6 символов</p>
            </div>

            {error && (
              <p className="text-sm text-[#f87171]">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || name.trim().length < 2}
              className="w-full py-3.5 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e] transition-colors disabled:opacity-50"
            >
              {loading ? 'Создаём аккаунт...' : 'Зарегистрироваться'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-white/30">
            Уже есть аккаунт?{' '}
            <Link href="/login" className="text-[#4ade80] hover:underline">
              Войти
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}