'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

const categories = [
  'Еда и продукты',
  'Транспорт',
  'Жильё и коммуналка',
  'Развлечения',
  'Здоровье',
  'Одежда',
  'Техника',
  'Подписки',
  'Другое'
]

export default function AddExpensePage() {
  const router = useRouter()
  const supabase = createClient()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (!amount || parseFloat(amount) <= 0) {
      setError('Введите корректную сумму')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    const { error: dbError } = await supabase
      .from('expenses')
      .insert({
        user_id: user.id,
        amount: parseFloat(amount),
        description: description.trim(),
        category,
        date: date,
      })

    if (dbError) {
      console.error('Add expense error:', dbError)
      setError(dbError.message || 'Не удалось добавить расход')
    } else {
      setSuccess(true)
      // Сброс формы
      setAmount('')
      setDescription('')
      setCategory(categories[0])
      
      setTimeout(() => {
        router.push('/dashboard')
        router.refresh()
      }, 1500)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Навбар */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/dashboard" className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </Link>
        <Link 
          href="/dashboard" 
          className="text-white/60 hover:text-white transition-colors"
        >
          Назад в дашборд
        </Link>
      </nav>

      <div className="max-w-lg mx-auto pt-12 px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2">Новый расход</h1>
          <p className="text-white/50">Добавь трату, чтобы вести учёт расходов</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Сумма */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
              Сумма
            </label>
            <div className="relative">
              <input
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl text-3xl font-semibold focus:outline-none focus:border-[#4ade80]/50 transition-all"
                required
              />
              <span className="absolute right-6 top-1/2 -translate-y-1/2 text-2xl text-white/40">₽</span>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
              Описание
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Например: Ужин в кафе с друзьями"
              className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:outline-none focus:border-[#4ade80]/50 transition-all"
            />
          </div>

          {/* Категория */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
              Категория
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:outline-none focus:border-[#4ade80]/50 transition-all text-white"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Дата */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
              Дата
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:outline-none focus:border-[#4ade80]/50 transition-all"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

          {success && (
            <p className="text-[#4ade80] text-sm">Расход успешно добавлен! Перенаправляем...</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#4ade80] hover:bg-[#22c55e] disabled:bg-[#4ade80]/50 text-black font-bold text-lg rounded-2xl transition-all mt-4"
          >
            {loading ? 'Добавляем расход...' : 'Добавить расход'}
          </button>
        </form>
      </div>
    </div>
  )
}