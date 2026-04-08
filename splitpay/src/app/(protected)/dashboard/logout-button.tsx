'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function LogoutButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const handleLogout = async () => {
    setLoading(true)

    try {
      const res = await fetch('/auth/logout', {
        method: 'POST',
      })

      if (res.ok) {
        // Принудительно обновляем всё приложение
        window.location.href = '/'
      } else {
        console.error('Logout failed')
        alert('Не удалось выйти. Попробуйте ещё раз.')
      }
    } catch (error) {
      console.error('Logout error:', error)
      alert('Ошибка соединения')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleLogout}
      disabled={loading}
      className="px-4 py-2 text-red-400 hover:text-red-500 transition-colors disabled:opacity-50"
    >
      {loading ? 'Выходим...' : 'Выйти'}
    </button>
  )
}