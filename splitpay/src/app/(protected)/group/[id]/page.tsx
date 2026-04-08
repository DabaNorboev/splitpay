// src/app/(protected)/group/[id]/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-server'
import CopyInviteButton from './CopyInviteButton'

type Props = {
  params: Promise<{ id: string }>
}

export default async function GroupPage({ params }: Props) {
  const { id: groupId } = await params
  const supabase = await createClient()

  const { data: group } = await supabase
    .from('groups')
    .select('*')
    .eq('id', groupId)
    .single()

  if (!group) redirect('/dashboard')

  // Получаем участников
  const { data: members } = await supabase
    .from('group_members')
    .select('role, user_id')
    .eq('group_id', groupId)

  // Получаем данные пользователей
  const userIds = members?.map(m => m.user_id) || []
  let usersData: any[] = []

  if (userIds.length > 0) {
    const { data } = await supabase
      .from('users')
      .select('id, email, name')
      .in('id', userIds)
    usersData = data || []
  }

  const combinedMembers = members?.map(member => {
    const userInfo = usersData.find(u => u.id === member.user_id)
    return {
      role: member.role,
      users: userInfo || { 
        id: member.user_id, 
        email: 'Пользователь', 
        name: null 
      }
    }
  }) || []

  const inviteLink = `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/group/${groupId}/join`

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <Link href="/dashboard" className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </Link>

        <Link
          href={`/add-expense?group_id=${groupId}`}
          className="flex items-center gap-2 px-6 py-3 bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold rounded-2xl transition-colors"
        >
          💸 Добавить расход
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Участники */}
          <div className="lg:col-span-4">
            <div className="bg-[#111118] rounded-3xl p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-5 flex items-center gap-2">
                👥 Участники ({combinedMembers.length})
              </h2>
              
              <div className="space-y-3">
                {combinedMembers.map((m: any) => (
                  <div key={m.users.id} className="flex items-center gap-3 bg-[#1a1a22] p-4 rounded-2xl">
                    <div className="w-9 h-9 bg-white/10 rounded-full flex items-center justify-center text-lg flex-shrink-0">
                      👤
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">
                        {m.users.name || m.users.email || 'Пользователь'}
                      </p>
                      <p className="text-xs text-white/40">
                        {m.role === 'admin' ? 'Администратор' : 'Участник'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Расходы */}
          <div className="lg:col-span-8">
            <div className="bg-[#111118] rounded-3xl p-8 min-h-[600px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-semibold">Расходы группы</h2>
                <Link
                  href={`/add-expense?group_id=${groupId}`}
                  className="px-6 py-2.5 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e]"
                >
                  + Новый расход
                </Link>
              </div>

              <div className="text-center py-24 text-white/40 border border-dashed border-white/10 rounded-2xl">
                <div className="text-5xl mb-4">📭</div>
                <p className="text-lg">Пока нет расходов</p>
                <p className="text-sm mt-2">Добавьте первый расход, чтобы начать</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}