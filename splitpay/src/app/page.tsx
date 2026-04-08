import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase-server'

const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()

if (user) {
  redirect('/dashboard')
}

const features = [
  {
    icon: '⚡',
    title: 'Трата за 5 секунд',
    desc: 'Открыл → сумма → сохранил. Быстрее любого аналога.',
  },
  {
    icon: '🧮',
    title: '2–4 перевода вместо 15',
    desc: 'Алгоритм Simplify сворачивает хаос долгов в минимум действий.',
  },
  {
    icon: '🇷🇺',
    title: 'Сделано для СНГ',
    desc: 'Рубли по умолчанию. Всё на русском. Локальные привычки.',
  },
  {
    icon: '📶',
    title: 'Работает офлайн',
    desc: 'Добавляй траты на даче и в роуминге — синхронизация при сети.',
  },
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">

      {/* NAV */}
      <nav className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <span className="text-xl font-bold">
          Split<span className="text-[#4ade80]">Pay</span>
        </span>
        <div className="flex gap-3">
          <Link
            href="/login"
            className="px-4 py-2 text-sm text-white/70 hover:text-white transition-colors"
          >
            Войти
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 text-sm bg-[#4ade80] text-black font-semibold rounded-lg hover:bg-[#22c55e] transition-colors"
          >
            Регистрация
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="max-w-2xl mx-auto px-6 pt-24 pb-16 text-center">
        <h1 className="text-5xl sm:text-6xl font-black leading-tight mb-6">
          Дели расходы<br />
          <span className="text-[#4ade80]">без ссор</span>
        </h1>
        <p className="text-lg text-white/50 mb-4 leading-relaxed">
          Приложение для совместного учёта расходов в группах.
          Добавляй траты, смотри кто кому должен, упрощай переводы одним касанием.
        </p>
        <p className="text-sm text-white/30 mb-10">
          Для использования необходимо зарегистрироваться или войти в аккаунт.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/register"
            className="px-8 py-4 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e] transition-colors text-lg"
          >
            Зарегистрироваться
          </Link>
          <Link
            href="/login"
            className="px-8 py-4 bg-white/5 border border-white/10 text-white font-semibold rounded-xl hover:bg-white/10 transition-colors text-lg"
          >
            Войти
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-black text-center mb-10">
          Почему <span className="text-[#4ade80]">SplitPay</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((f, i) => (
            <div
              key={i}
              className="p-6 bg-[#111118] border border-white/8 rounded-2xl"
            >
              <div className="text-3xl mb-3">{f.icon}</div>
              <div className="font-bold text-white mb-1">{f.title}</div>
              <div className="text-sm text-white/50 leading-relaxed">{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="max-w-2xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-black text-center mb-10">Как это работает</h2>
        <div className="space-y-3">
          {[
            'Зарегистрируйся по номеру телефона',
            'Создай группу и пригласи друзей по ссылке',
            'Добавляйте траты — кто платил и за кого',
            'Смотри кто кому должен — зелёный / красный',
            'Нажми «Упростить» — получи 2–3 перевода',
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-[#111118] border border-white/8 rounded-xl">
              <span className="text-xl font-black text-[#4ade80]/40 w-6 shrink-0">
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="text-white/80 text-sm">{step}</span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-md mx-auto px-6 pb-24 text-center">
        <div className="p-8 bg-[#111118] border border-white/8 rounded-2xl">
          <h2 className="text-2xl font-black mb-3">Готов начать?</h2>
          <p className="text-white/40 text-sm mb-6">
            Регистрация занимает 30 секунд — только номер телефона
          </p>
          <Link
            href="/register"
            className="block w-full py-3.5 bg-[#4ade80] text-black font-bold rounded-xl hover:bg-[#22c55e] transition-colors"
          >
            Создать аккаунт →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 py-6 border-t border-white/5 text-center text-white/20 text-xs">
        © 2026 SplitPay — Делите расходы, сохраняйте отношения
      </footer>
    </div>
  )
}