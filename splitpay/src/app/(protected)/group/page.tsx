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

    if (!name.trim()) {
      setError('Название группы обязательно')
      setLoading(false)
      return
    }

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/login')
      return
    }

    // Создаём группу
    const { data, error: insertError } = await supabase
      .from('groups')
      .insert({
        name: name.trim(),
        description: description.trim() || null,
        created_by: user.id,
        owner_id: user.id,
      })
      .select()
      .single()

    if (insertError) {
      console.error('Create group error:', insertError)
      setError(insertError.message || 'Не удалось создать группу')
      setLoading(false)
      return
    }

    // Автоматически добавляем создателя в группу как участника
    if (data) {
      await supabase
        .from('group_members')
        .insert({
          group_id: data.id,
          user_id: user.id,
          role: 'admin'
        })
    }

    // Успех
    alert(`Группа "${name}" успешно создана!`)
    router.push('/dashboard')   // или можешь поменять на `/group/${data.id}`
    router.refresh()
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
          Назад
        </Link>
      </nav>

      <div className="max-w-lg mx-auto pt-12 px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2">Создать группу</h1>
          <p className="text-white/50">Создайте группу, чтобы делить расходы с друзьями или семьёй</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Название группы */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
              Название группы
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Например: Поездка в Сочи"
              className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:outline-none focus:border-[#4ade80]/50 transition-all text-lg"
              required
            />
          </div>

          {/* Описание */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
              Описание (необязательно)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Коротко о группе..."
              rows={3}
              className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:outline-none focus:border-[#4ade80]/50 transition-all resize-y min-h-[100px]"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-500/10 p-3 rounded-xl">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full py-4 bg-[#4ade80] hover:bg-[#22c55e] disabled:bg-[#4ade80]/50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-2xl transition-all mt-6"
          >
            {loading ? 'Создаём группу...' : 'Создать группу'}
          </button>
        </form>

        <p className="text-center text-white/40 text-sm mt-8">
          После создания группы вы сможете добавлять расходы и приглашать участников
        </p>
      </div>
    </div>
  )
}