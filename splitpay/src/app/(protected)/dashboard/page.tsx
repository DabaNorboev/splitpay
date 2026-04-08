// src/app/(protected)/dashboard/page.tsx
import { redirect } from 'next/navigation'
import Link from 'next/link'
import LogoutButton from './logout-button'
import { createClient } from '@/lib/supabase-server'

export default async function DashboardPage() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  // Получаем профиль
  const { data: profile } = await supabase
    .from('users')
    .select('name')
    .eq('id', user.id)
    .single()

  // ✅ ИСПРАВЛЕНО: используем created_by вместо owner_id
  // И получаем ВСЕ группы одним запросом (RLS сам отфильтрует)
  const { data: groups, error } = await supabase
    .from('groups')
    .select(`
      id, 
      name, 
      description, 
      created_at,
      created_by
    `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error loading groups:', error)
  }

  console.log('Groups loaded:', groups?.length, 'groups')
  console.log('User ID:', user.id)

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">
            {profile?.name ?? user.email?.split('@')[0]}
          </span>
          <LogoutButton />
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 py-10">

        <div className="mb-10">
          <h1 className="text-3xl font-black">
            Привет, {profile?.name?.split(' ')[0] ?? 'друг'} 👋
          </h1>
          <p className="text-white/50 mt-1">Твои группы расходов</p>
        </div>

        <Link
          href="/create-group"
          className="mb-10 flex items-center justify-center gap-2 w-full py-4 bg-[#4ade80] hover:bg-[#22c55e] text-black font-bold rounded-2xl transition-colors text-lg"
        >
          + Создать новую группу
        </Link>

        <section>
          <h2 className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
            Активные группы · {groups?.length || 0}
          </h2>

          {groups && groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group: any) => (
                <Link
                  key={group.id}
                  href={`/group/${group.id}`}
                  className="block p-6 bg-[#111118] border border-white/10 hover:border-[#4ade80]/40 rounded-3xl transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-xl">{group.name}</div>
                    {group.created_by === user.id && (
                      <span className="text-xs px-2 py-1 bg-[#4ade80]/20 text-[#4ade80] rounded-full">
                        Админ
                      </span>
                    )}
                  </div>
                  
                  {group.description && (
                    <p className="text-white/60 text-sm line-clamp-2 mb-4">
                      {group.description}
                    </p>
                  )}

                  <div className="text-xs text-white/40">
                    Создано: {new Date(group.created_at).toLocaleDateString('ru-RU', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 bg-[#111118] border border-dashed border-white/10 rounded-3xl text-center">
              <div className="text-6xl mb-6 opacity-40">👥</div>
              <p className="text-white/50 text-lg mb-2">У тебя пока нет групп</p>
              <p className="text-white/40 text-sm mb-8">
                Создайте первую группу или попросите друзей пригласить вас
              </p>
              <Link
                href="/create-group"
                className="inline-block px-8 py-3.5 bg-[#4ade80] text-black font-bold rounded-2xl hover:bg-[#22c55e] transition-colors"
              >
                Создать первую группу
              </Link>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}