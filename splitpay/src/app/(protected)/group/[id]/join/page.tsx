// src/app/(protected)/group/[id]/join/page.tsx
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

type Props = {
  params: Promise<{ id: string }>
}

export default async function JoinGroupPage({ params }: Props) {
  const { id: groupId } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    // Если не залогинен — отправляем на логин с сохранением ссылки
    redirect(`/login?redirectTo=/group/${groupId}/join`)
    return
  }

  // Проверяем, не состоит ли уже пользователь в группе
  const { data: existingMember } = await supabase
    .from('group_members')
    .select('id')
    .eq('group_id', groupId)
    .eq('user_id', user.id)
    .single()

  if (existingMember) {
    // Уже в группе — сразу переходим в группу
    redirect(`/group/${groupId}`)
    return
  }

  // Добавляем пользователя в группу
  const { error } = await supabase
    .from('group_members')
    .insert({
      group_id: groupId,
      user_id: user.id,
      role: 'member'
    })

  if (error) {
    console.error('Join group error:', error)
    redirect('/dashboard')
  }

  // Обновление CRM: +1 участник
  try {
    // 1. Получить текущее количество участников
    const { count } = await supabase
      .from('group_members')
      .select('*', { count: 'exact', head: true })
      .eq('group_id', groupId)
    
    // 2. Получить crm_item_id
    const { data: groupData } = await supabase
      .from('groups')
      .select('crm_item_id')
      .eq('id', groupId)
      .single()
    
    // 3. Отправить обновление в CRM
    if (groupData?.crm_item_id) {
      // Полный URL для серверного fetch (исправлено!)
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      
      fetch(`${appUrl}/api/crm`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          crmItemId: groupData.crm_item_id,
          memberCount: count || 1,
          lastActivity: new Date().toISOString()
        })
      }).catch(err => console.error('CRM update failed:', err))
    }
  } catch (err) {
    console.error('CRM sync error:', err)
  }

  // Успешно добавили — переходим в группу
  redirect(`/group/${groupId}`)
}