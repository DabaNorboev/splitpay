'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function TestPage() {
  const [info, setInfo] = useState('loading...')
  const supabase = createClient()

  useEffect(() => {
    async function check() {
      const { data: { session } } = await supabase.auth.getSession()
      setInfo(session ? `USER: ${session.user.email}` : 'NO SESSION')
    }
    check()
  }, [])

  return <div style={{ color: 'white', background: 'black', padding: 40, fontSize: 24 }}>{info}</div>
}