'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

type Member = {
  user_id: string
  role: string
  user?: {
    id: string
    name: string | null
    phone: string | null
  }
}

export default function AddExpensePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const groupId = searchParams.get('group_id')
  const supabase = createClient()

  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(categories[0])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [paidBy, setPaidBy] = useState<string>('') // ID того кто заплатил
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMembers, setLoadingMembers] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Загружаем участников группы и текущего пользователя
  useEffect(() => {
    const loadData = async () => {
      try {
        // Получаем текущего пользователя
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          setCurrentUserId(user.id)
          // По умолчанию плательщик - текущий пользователь
          setPaidBy(user.id)
        }

        // Если есть groupId - загружаем участников
        if (groupId) {
          const { data: membersData } = await supabase
            .from('group_members')
            .select('user_id, role')
            .eq('group_id', groupId)

          if (membersData) {
            // Получаем данные пользователей
            const userIds = membersData.map(m => m.user_id)
            const { data: users } = await supabase
              .from('users')
              .select('id, name, phone')
              .in('id', userIds)

            // Объединяем данные
            const membersWithUsers = membersData.map(member => ({
              ...member,
              user: users?.find(u => u.id === member.user_id)
            }))

            setMembers(membersWithUsers)
          }
        }
      } catch (err) {
        console.error('Error loading data:', err)
      } finally {
        setLoadingMembers(false)
      }
    }

    loadData()
  }, [groupId, supabase])

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

    // Используем выбранного плательщика или текущего пользователя
    const finalPaidBy = paidBy || user.id

    // Преобразуем выбранную дату в ISO строку для created_at
    const selectedDateTime = new Date(date)
    selectedDateTime.setHours(new Date().getHours())
    selectedDateTime.setMinutes(new Date().getMinutes())
    selectedDateTime.setSeconds(new Date().getSeconds())

    // Базовое значение для split_shares (вся сумма на создателя)
    const splitShares = {
      [user.id]: parseFloat(amount)
    }

    const expenseData: any = {
      paid_by: finalPaidBy,
      created_by: user.id,
      amount: parseFloat(amount),
      description: description.trim() || null,
      category,
      split_shares: splitShares,
      created_at: selectedDateTime.toISOString(),
    }

    // Добавляем group_id если он есть
    if (groupId) {
      expenseData.group_id = groupId
    }

    const { error: dbError } = await supabase
      .from('expenses')
      .insert(expenseData)

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
        if (groupId) {
          router.push(`/group/${groupId}`)
        } else {
          router.push('/dashboard')
        }
        router.refresh()
      }, 1500)
    }

    setLoading(false)
  }

  // Получение имени пользователя
  const getUserName = (userId: string) => {
    const member = members.find(m => m.user_id === userId)
    if (member?.user) {
      return member.user.name || member.user.phone || 'Участник'
    }
    return 'Участник'
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Навбар */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href={groupId ? `/group/${groupId}` : "/dashboard"} className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </Link>
        <Link 
          href={groupId ? `/group/${groupId}` : "/dashboard"}
          className="text-white/60 hover:text-white transition-colors"
        >
          {groupId ? 'Назад к группе' : 'Назад в дашборд'}
        </Link>
      </nav>

      <div className="max-w-lg mx-auto pt-12 px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-black mb-2">Новый расход</h1>
          <p className="text-white/50">
            {groupId 
              ? 'Добавьте расход в группу' 
              : 'Добавь трату, чтобы вести учёт расходов'}
          </p>
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

          {/* Кто оплатил */}
          {groupId && members.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                Кто оплатил
              </label>
              <select
                value={paidBy}
                onChange={(e) => setPaidBy(e.target.value)}
                className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl focus:outline-none focus:border-[#4ade80]/50 transition-all text-white"
              >
                {members.map((member) => (
                  <option key={member.user_id} value={member.user_id}>
                    {getUserName(member.user_id)}
                    {member.user_id === currentUserId && ' (Вы)'}
                  </option>
                ))}
              </select>
              <p className="text-xs text-white/30 mt-2">
                По умолчанию выбраны вы. Можно указать другого участника, если платил он.
              </p>
            </div>
          )}

          {/* Если нет группы - показываем что оплатил текущий пользователь */}
          {!groupId && (
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-2">
                Кто оплатил
              </label>
              <div className="w-full px-5 py-4 bg-[#111118] border border-white/10 rounded-2xl text-white/60">
                Вы (личный расход)
              </div>
            </div>
          )}

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
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="p-4 bg-[#4ade80]/10 border border-[#4ade80]/20 rounded-xl">
              <p className="text-[#4ade80] text-sm">Расход успешно добавлен! Перенаправляем...</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || loadingMembers}
            className="w-full py-4 bg-[#4ade80] hover:bg-[#22c55e] disabled:bg-[#4ade80]/50 disabled:cursor-not-allowed text-black font-bold text-lg rounded-2xl transition-all mt-4"
          >
            {loading ? 'Добавляем расход...' : 
             loadingMembers ? 'Загрузка...' : 
             'Добавить расход'}
          </button>
        </form>
      </div>
    </div>
  )
}