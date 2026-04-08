'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Link from 'next/link'

export default function CreateGroupPage() {
  const router = useRouter()
  const supabase = createClient()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    if (name.trim().length < 3) {
      setError('Название группы должно быть минимум 3 символа')
      setLoading(false)
      return
    }

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/login')
        return
      }

      const { data: group, error: groupError } = await supabase
        .from('groups')
        .insert({
          name: name.trim(),
          description: description.trim() || null,
          owner_id: user.id,
          currency: 'RUB',
          status: 'active',
          total_balance: 0
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Добавляем создателя в группу
      await supabase
        .from('group_members')
        .insert({
          group_id: group.id,
          user_id: user.id,
          role: 'admin'
        })

      // ✅ Редирект сразу на созданную группу (без alert)
      router.push(`/group/${group.id}`)

    } catch (err: any) {
      console.error('Create group error:', err)
      setError(err.message || 'Не удалось создать группу')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/dashboard" className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </Link>
        <Link href="/dashboard" className="text-white/60 hover:text-white">
          Назад в дашборд
        </Link>
      </nav>

      <div className="max-w-lg mx-auto pt-16 px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-3">Создать новую группу</h1>
          <p className="text-white/50">Здесь будут совместно вестись расходы</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Название группы *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Поездка в Сочи"
              className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:border-[#4ade80] focus:outline-none text-lg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/70 mb-2">
              Описание группы
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко опишите группу..."
              rows={4}
              className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:border-[#4ade80] focus:outline-none resize-y"
            />
          </div>

          {error && <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-2xl">{error}</p>}

          <button
            type="submit"
            disabled={loading || name.trim().length < 3}
            className="w-full py-4 bg-[#4ade80] hover:bg-[#22c55e] disabled:bg-[#4ade80]/60 text-black font-bold text-lg rounded-2xl transition-colors"
          >
            {loading ? 'Создаём...' : 'Создать группу'}
          </button>
        </form>
      </div>
    </div>
  )
}