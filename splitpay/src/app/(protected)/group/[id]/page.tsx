// src/app/(protected)/group/[id]/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import CopyInviteButton from './CopyInviteButton'

type Props = {
  params: Promise<{ id: string }>
}

type Balance = {
  userId: string
  userName: string
  spent: number
  owed: number
  balance: number
}

type Debt = {
  from: string
  fromName: string
  to: string
  toName: string
  amount: number
}

export default async function GroupPage({ params }: Props) {
  const { id: groupId } = await params
  const supabase = await createClient()

  // Получаем данные группы
  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) redirect('/dashboard')

  // Получаем участников группы
  const { data: members } = await supabase
    .from('group_members')
    .select('user_id, role')
    .eq('group_id', groupId)

  // Получаем всех пользователей
  const userIds = members?.map(m => m.user_id) || []
  const { data: users } = await supabase
    .from('users')
    .select('id, phone, name, avatar_url')
    .in('id', userIds)

  // Создаем мапу пользователей
  const usersMap = new Map()
  users?.forEach(user => {
    usersMap.set(user.id, user)
  })

  // Получаем расходы группы
  const { data: expenses } = await supabase
    .from('expenses')
    .select('*')
    .eq('group_id', groupId)
    .order('created_at', { ascending: false })

  // ====== ИСПРАВЛЕННЫЙ РАСЧЁТ БАЛАНСОВ ======
  const calculateBalances = () => {
    if (!expenses || !members) return { balances: [], totalSpent: 0, simplifiedDebts: [] }

    // Инициализируем балансы для всех участников
    const balanceMap = new Map<string, Balance>()
    
    members.forEach(member => {
      const user = usersMap.get(member.user_id)
      balanceMap.set(member.user_id, {
        userId: member.user_id,
        userName: user?.name || user?.phone || 'Участник',
        spent: 0,
        owed: 0,
        balance: 0
      })
    })

    let totalSpent = 0

    // Считаем кто сколько потратил и кто сколько должен
    expenses.forEach(expense => {
      const paidBy = expense.paid_by || expense.created_by
      const amount = Number(expense.amount) // Убеждаемся что это число
      totalSpent += amount

      console.log(`Расход: ${expense.description}, сумма: ${amount}, оплатил: ${paidBy}`)

      // Увеличиваем потраченную сумму для того кто заплатил
      const payer = balanceMap.get(paidBy)
      if (payer) {
        payer.spent += amount
        payer.balance += amount // Тот кто заплатил - в плюсе
        console.log(`  ${payer.userName} потратил +${amount}, баланс: ${payer.balance}`)
      } else {
        console.log(`  ⚠️ Плательщик ${paidBy} не найден в участниках!`)
      }

      // Распределяем долги - делим поровну на ВСЕХ участников
      const sharePerPerson = amount / members.length
      console.log(`  Делим на ${members.length} человек, по ${sharePerPerson}`)

      members.forEach(member => {
        const debtor = balanceMap.get(member.user_id)
        if (debtor) {
          debtor.owed += sharePerPerson
          debtor.balance -= sharePerPerson // Каждый должен свою долю
          console.log(`    ${debtor.userName} должен ${sharePerPerson}, баланс: ${debtor.balance}`)
        }
      })
    })

    const balances = Array.from(balanceMap.values())
    console.log('Итоговые балансы:', balances)
    
    // Алгоритм упрощения долгов
    const simplifiedDebts = simplifyDebts(balances)

    return { balances, totalSpent, simplifiedDebts }
  }

  // ====== АЛГОРИТМ УПРОЩЕНИЯ ДОЛГОВ ======
  const simplifyDebts = (balances: Balance[]): Debt[] => {
    // Копируем и округляем балансы (избавляемся от погрешностей)
    const roundedBalances = balances.map(b => ({
      ...b,
      balance: Math.round(b.balance * 100) / 100
    }))

    console.log('Округленные балансы:', roundedBalances)

    // Должники (те у кого отрицательный баланс)
    const debtors = roundedBalances
      .filter(b => b.balance < -0.01)
      .map(b => ({ 
        userId: b.userId,
        userName: b.userName,
        amount: -b.balance // Делаем положительным для удобства
      }))
      .sort((a, b) => b.amount - a.amount)

    // Кредиторы (те кому должны)
    const creditors = roundedBalances
      .filter(b => b.balance > 0.01)
      .map(b => ({ 
        userId: b.userId,
        userName: b.userName,
        amount: b.balance
      }))
      .sort((a, b) => b.amount - a.amount)

    console.log('Должники:', debtors)
    console.log('Кредиторы:', creditors)

    const debts: Debt[] = []
    
    let i = 0, j = 0
    while (i < debtors.length && j < creditors.length) {
      const debtor = debtors[i]
      const creditor = creditors[j]
      
      const amount = Math.min(debtor.amount, creditor.amount)
      
      if (amount > 0.01) {
        debts.push({
          from: debtor.userId,
          fromName: debtor.userName,
          to: creditor.userId,
          toName: creditor.userName,
          amount: Math.round(amount * 100) / 100
        })
      }
      
      debtor.amount -= amount
      creditor.amount -= amount
      
      if (debtor.amount < 0.01) i++
      if (creditor.amount < 0.01) j++
    }
    
    console.log('Упрощенные долги:', debts)
    return debts
  }

  const { balances, totalSpent, simplifiedDebts } = calculateBalances()

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/group/${groupId}/join`

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const getUserName = (userId: string) => {
    const user = usersMap.get(userId)
    return user?.name || user?.phone || 'Участник'
  }

  const getAvatarLetter = (userId: string) => {
    const name = getUserName(userId)
    return name[0]?.toUpperCase() || '👤'
  }

  const formatMoney = (amount: number) => {
    return Math.abs(amount).toLocaleString('ru-RU', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/dashboard" className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </Link>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-10">
          <div>
            <h1 className="text-4xl font-black mb-2">{group.name}</h1>
            {group.description && (
              <p className="text-white/60 text-lg">{group.description}</p>
            )}
          </div>
          <CopyInviteButton inviteLink={inviteLink} />
        </div>

        {/* СТАТИСТИКА */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <p className="text-white/40 text-sm mb-1">Всего потрачено</p>
            <p className="text-3xl font-bold text-[#4ade80]">
              {formatMoney(totalSpent)} ₽
            </p>
          </div>
          <div className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <p className="text-white/40 text-sm mb-1">Участников</p>
            <p className="text-3xl font-bold">{members?.length || 0}</p>
          </div>
          <div className="bg-[#111118] rounded-2xl p-6 border border-white/5">
            <p className="text-white/40 text-sm mb-1">Расходов</p>
            <p className="text-3xl font-bold">{expenses?.length || 0}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-4 space-y-6">
            {/* Участники */}
            <div className="bg-[#111118] rounded-3xl p-6">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                👥 Участники
              </h2>

              <div className="space-y-3">
                {members?.map((m: any) => {
                  const user = usersMap.get(m.user_id)
                  const displayName = getUserName(m.user_id)
                  const avatarLetter = getAvatarLetter(m.user_id)
                  const userBalance = balances.find(b => b.userId === m.user_id)
                  
                  return (
                    <div key={m.user_id} className="flex items-center gap-3 bg-[#1a1a22] p-4 rounded-2xl">
                      {user?.avatar_url ? (
                        <img 
                          src={user.avatar_url} 
                          alt={displayName}
                          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gradient-to-br from-[#4ade80]/20 to-[#22c55e]/20 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                          {avatarLetter}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{displayName}</p>
                        <p className="text-xs text-white/40">
                          {m.role === 'admin' ? 'Администратор' : 'Участник'}
                        </p>
                      </div>
                      {userBalance && (
                        <div className={`text-sm font-semibold ${
                          userBalance.balance > 0.01 ? 'text-[#4ade80]' : 
                          userBalance.balance < -0.01 ? 'text-red-400' : 'text-white/40'
                        }`}>
                          {userBalance.balance > 0.01 ? '+' : ''}
                          {formatMoney(userBalance.balance)} ₽
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* КТО КОМУ ДОЛЖЕН */}
            {simplifiedDebts.length > 0 && (
              <div className="bg-[#111118] rounded-3xl p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  💰 Кто кому должен
                </h2>

                <div className="space-y-2">
                  {simplifiedDebts.map((debt, index) => (
                    <div key={index} className="bg-[#1a1a22] p-4 rounded-xl">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <span className="font-medium truncate">{debt.fromName}</span>
                          <span className="text-white/40">→</span>
                          <span className="font-medium truncate">{debt.toName}</span>
                        </div>
                        <span className="font-bold text-[#4ade80] whitespace-nowrap">
                          {formatMoney(debt.amount)} ₽
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-3 bg-[#4ade80]/10 rounded-xl border border-[#4ade80]/20">
                  <p className="text-xs text-white/60">
                    💡 Всего {simplifiedDebts.length} {simplifiedDebts.length === 1 ? 'перевод' : 
                       simplifiedDebts.length < 5 ? 'перевода' : 'переводов'} вместо сложных расчётов
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* ПРАВАЯ КОЛОНКА - РАСХОДЫ */}
          <div className="lg:col-span-8">
            <div className="bg-[#111118] rounded-3xl p-8 min-h-[600px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold">Расходы группы</h2>
                <Link
                  href={`/add-expense?group_id=${groupId}`}
                  className="px-6 py-2.5 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e] transition-colors"
                >
                  + Новый расход
                </Link>
              </div>

              {expenses && expenses.length > 0 ? (
                <div className="space-y-3">
                  {expenses.map((expense: any) => (
                    <div 
                      key={expense.id} 
                      className="bg-[#1a1a22] p-5 rounded-2xl border border-white/5 hover:border-white/10 transition-all"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-lg">
                              {expense.description || 'Без описания'}
                            </h3>
                            <span className="px-2 py-1 bg-white/5 rounded-lg text-xs text-white/50">
                              {expense.category}
                            </span>
                          </div>
                          <p className="text-sm text-white/40">
                            {formatDate(expense.created_at)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-[#4ade80]">
                            {Number(expense.amount).toLocaleString('ru-RU')} ₽
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm text-white/50 pt-3 border-t border-white/5">
                        <span>💳 Оплатил:</span>
                        <span className="text-white/80">
                          {getUserName(expense.paid_by || expense.created_by)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-24 text-white/40 border border-dashed border-white/10 rounded-2xl">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-lg">Пока нет расходов</p>
                  <p className="text-sm mt-2">Добавьте первый расход, чтобы начать</p>
                  <Link
                    href={`/add-expense?group_id=${groupId}`}
                    className="inline-block mt-6 px-6 py-3 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e] transition-colors"
                  >
                    Добавить расход
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}