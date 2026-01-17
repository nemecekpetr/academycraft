import Link from 'next/link'
import { Pickaxe, Gem, Trophy, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4">
      {/* Logo/Title */}
      <div className="text-center mb-8">
        <h1 className="text-5xl md:text-7xl font-bold mb-2 text-[var(--color-emerald)]" style={{ textShadow: '4px 4px 0 #000' }}>
          AcademyCraft
        </h1>
        <p className="text-xl md:text-2xl text-[var(--foreground-muted)]">
          Staň se mistrem přijímaček!
        </p>
      </div>

      {/* Animated icons */}
      <div className="flex gap-6 mb-12">
        <div className="animate-float" style={{ animationDelay: '0s' }}>
          <Pickaxe className="w-12 h-12 text-[var(--color-stone)]" />
        </div>
        <div className="animate-float" style={{ animationDelay: '0.3s' }}>
          <Gem className="w-12 h-12 text-[var(--color-emerald)]" />
        </div>
        <div className="animate-float" style={{ animationDelay: '0.6s' }}>
          <Trophy className="w-12 h-12 text-[var(--color-gold)]" />
        </div>
        <div className="animate-float" style={{ animationDelay: '0.9s' }}>
          <Shield className="w-12 h-12 text-[var(--color-diamond)]" />
        </div>
      </div>

      {/* Feature cards - Growth Mindset / Motivation 3.0 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl w-full mb-12">
        <div className="mc-panel-dark mc-panel">
          <div className="flex items-center gap-3 mb-2">
            <Pickaxe className="w-6 h-6 text-[var(--color-stone)]" />
            <h3 className="text-xl">Uč se po svém</h3>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Vyber si, co a kdy chceš procvičovat. Ty jsi tu šéf!
          </p>
        </div>

        <div className="mc-panel-dark mc-panel">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-[var(--color-gold)]" />
            <h3 className="text-xl">Sleduj svůj růst</h3>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Každý den se zlepšuješ. Vidíš, jak daleko jsi došel/došla!
          </p>
        </div>

        <div className="mc-panel-dark mc-panel">
          <div className="flex items-center gap-3 mb-2">
            <div className="emerald-icon scale-150" />
            <h3 className="text-xl">Objevuj a zkoušej</h3>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Testy, doučování, opravy chyb - každá zkušenost tě posouvá
          </p>
        </div>

        <div className="mc-panel-dark mc-panel">
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-[var(--color-diamond)]" />
            <h3 className="text-xl">Bez stresu</h3>
          </div>
          <p className="text-sm text-[var(--foreground-muted)]">
            Týdenní cíle místo denního tlaku. Uč se vlastním tempem.
          </p>
        </div>
      </div>

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Link href="/login" className="flex-1">
          <button className="mc-button mc-button-primary w-full text-xl py-3">
            Přihlásit se
          </button>
        </Link>
        <Link href="/register" className="flex-1">
          <button className="mc-button w-full text-xl py-3">
            Nový účet
          </button>
        </Link>
      </div>

      {/* Footer */}
      <p className="mt-12 text-sm text-[var(--foreground-muted)]">
        Tvoje cesta k úspěchu začíná tady
      </p>
    </main>
  )
}
