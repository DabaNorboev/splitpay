'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'

export default function DashboardPage() {
  const router = useRouter()
  const supabase = createClient()

  const [user, setUser] = useState<any>(null)
  const [groups, setGroups] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        router.push('/login')
        return
      }

      setUser(session.user)

      const { data: profileData } = await supabase
        .from('users')
        .select('name')
        .eq('id', session.user.id)
        .single()

      setProfile(profileData)

      const { data: groupsData } = await supabase
        .from('groups')
        .select('id, name, description, created_at, created_by, owner_id')
        .order('created_at', { ascending: false })

      setGroups(groupsData || [])
      setLoading(false)
    }

    load()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center">
        <div className="text-white/40">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </span>
        <div className="flex items-center gap-4">
          <span className="text-sm text-white/60">
            {profile?.name ?? user?.email?.split('@')[0]}
          </span>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              router.push('/login')
            }}
            className="text-sm text-white/40 hover:text-white transition-colors"
          >
            Выйти
          </button>
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
            Активные группы · {groups.length}
          </h2>

          {groups.length > 0 ? (
            <div className="space-y-3">
              {groups.map((group) => (
                <Link
                  key={group.id}
                  href={`/group/${group.id}`}
                  className="block p-6 bg-[#111118] border border-white/10 hover:border-[#4ade80]/40 rounded-3xl transition-all"
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold text-xl">{group.name}</div>
                    {group.owner_id === user?.id && (
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