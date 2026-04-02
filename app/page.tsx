export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      <div className="max-w-4xl mx-auto pt-20 px-6">
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold tracking-tight mb-4">
            SplitPay
          </h1>
          <p className="text-2xl text-zinc-400">
            Дели расходы с друзьями легко и честно
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <h3 className="text-xl font-semibold mb-3">Экран 1</h3>
            <p className="text-zinc-400">Главная страница (лендинг)</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <h3 className="text-xl font-semibold mb-3">Экран 2</h3>
            <p className="text-zinc-400">Экран группы</p>
          </div>
          <div className="bg-zinc-900 p-8 rounded-2xl border border-zinc-800">
            <h3 className="text-xl font-semibold mb-3">Экран 3</h3>
            <p className="text-zinc-400">Форма добавления расхода</p>
          </div>
        </div>

        <div className="mt-16 text-center text-zinc-500 text-sm">
          Next.js 16 + Tailwind + Shadcn/ui + Supabase • ПР-04 MVP
        </div>
      </div>
    </div>
  );
}