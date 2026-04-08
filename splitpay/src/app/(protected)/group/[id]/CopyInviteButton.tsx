'use client'

import { useState } from 'react'

export default function CopyInviteButton({ inviteLink }: { inviteLink: string }) {
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button
      onClick={copyLink}
      className="px-6 py-3 border border-white/30 hover:border-white/60 rounded-2xl flex items-center gap-2 transition-all active:scale-95"
    >
      👥 {copied ? 'Ссылка скопирована!' : 'Пригласить участников'}
    </button>
  )
}