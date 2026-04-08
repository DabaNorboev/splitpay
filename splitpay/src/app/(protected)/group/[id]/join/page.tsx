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
    // Можно показать ошибку, но для простоты редиректим на дашборд
    redirect('/dashboard')
  }

  // Успешно добавили — переходим в группу
  redirect(`/group/${groupId}`)
}