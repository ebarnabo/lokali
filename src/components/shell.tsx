import { Link } from "@tanstack/react-router"
import { motion, useReducedMotion } from "motion/react"
import { useEffect, useState, type ReactNode } from "react"
import { SignedOut, UserButton } from "@/lib/auth/gates"
import { useCurrentUserState } from "@/lib/auth/use-current-user"
import { getMe, type Me } from "@/lib/lokali.functions"

const links = [
  { to: "/", label: "Offres" },
  { to: "/carte", label: "Carte" },
  { to: "/entraide", label: "Entraide" },
  { to: "/compte", label: "Compte" },
] as const

export function Shell({ children }: { children: ReactNode }) {
  const { user } = useCurrentUserState()
  const [me, setMe] = useState<Me | null>(null)

  useEffect(() => {
    if (!user) {
      setMe(null)
      return
    }
    let active = true
    getMe()
      .then((profile) => {
        if (active) setMe(profile)
      })
      .catch(() => {
        if (active) setMe(null)
      })
    return () => {
      active = false
    }
  }, [user])

  return (
    <div className="min-h-screen text-ink">
      <header className="sticky top-0 z-20 border-b border-line/80 bg-paper/80 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-3">
              <Mark />
              <span className="leading-none">
                <span className="block font-display text-xl font-semibold tracking-tight">Lokali</span>
                <span className="mt-1 block text-xs text-muted">Guadeloupe</span>
              </span>
            </Link>
            <nav className="hidden min-w-0 flex-1 items-center justify-end gap-1 md:flex">
              <NavLinks me={me} />
            </nav>
            <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-3">
              <SignedOut>
                <Link to="/login" className="rounded-full bg-green px-4 py-2.5 text-sm font-medium text-paper">
                  Connexion
                </Link>
              </SignedOut>
              <UserButton />
            </div>
          </div>
          <nav className="mt-3 flex items-center gap-1 overflow-x-auto md:hidden">
            <NavLinks me={me} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-12">{children}</main>
      <footer className="px-4 py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 border-t border-line pt-6">
          <span className="font-display text-lg text-ink">Lokali</span>
          <Link to="/p/$slug" params={{ slug: "mentions-legales" }} className="hover:text-ink">
            Mentions légales
          </Link>
          <Link to="/p/$slug" params={{ slug: "confidentialite" }} className="hover:text-ink">
            Confidentialité
          </Link>
          <Link to="/p/$slug" params={{ slug: "cgu" }} className="hover:text-ink">
            Conditions
          </Link>
        </div>
      </footer>
    </div>
  )
}

function Mark() {
  const reduce = useReducedMotion()
  return (
    <svg viewBox="0 0 40 40" className="h-10 w-10" aria-hidden>
      <rect width="40" height="40" rx="13" className="fill-green" />
      <circle cx="20" cy="16" r="5.5" className="fill-paper" />
      <motion.path
        d="M20 20.4c3 3.1 4.8 5.4 4.8 7.5a4.8 4.8 0 0 1-9.6 0c0-2.1 1.8-4.4 4.8-7.5z"
        className="fill-red"
        style={{ transformOrigin: "20px 26px" }}
        initial={reduce ? false : { scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 460, damping: 16, delay: 0.05 }}
      />
    </svg>
  )
}

function NavLinks({ me }: { me: Me | null }) {
  return (
    <>
      {links.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="shrink-0 rounded-full px-3 py-2 text-sm text-muted hover:bg-cream hover:text-ink"
          activeProps={{ className: "shrink-0 rounded-full bg-ink px-3 py-2 text-sm text-paper" }}
        >
          {item.label}
        </Link>
      ))}
      {me?.isAdmin ? (
        <Link
          to="/stats"
          className="shrink-0 rounded-full px-3 py-2 text-sm text-muted hover:bg-cream hover:text-ink"
          activeProps={{ className: "shrink-0 rounded-full bg-ink px-3 py-2 text-sm text-paper" }}
        >
          Stats
        </Link>
      ) : null}
      {me?.isAdmin ? (
        <Link
          to="/admin"
          className="shrink-0 rounded-full px-3 py-2 text-sm text-muted hover:bg-cream hover:text-ink"
          activeProps={{ className: "shrink-0 rounded-full bg-red px-3 py-2 text-sm text-paper" }}
        >
          Admin
        </Link>
      ) : null}
    </>
  )
}

export function Field({
  label,
  hint,
  children,
}: {
  label: string
  hint?: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {hint ? <span className="block text-xs leading-relaxed text-muted">{hint}</span> : null}
    </label>
  )
}

export const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-cream/40 px-4 text-ink outline-none transition-colors focus:border-green focus:bg-paper"

export const buttonClass =
  "inline-flex h-12 items-center justify-center rounded-full bg-green px-5 text-sm font-medium text-paper transition-transform duration-150 ease-out active:scale-[0.96] disabled:opacity-60"

export const ghostClass =
  "inline-flex h-12 items-center justify-center rounded-full border border-line bg-paper px-5 text-sm font-medium"

export function formatSiret(value: string) {
  const digits = value.replace(/\D/g, "")
  if (digits.length !== 14) return value
  return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)} ${digits.slice(9)}`
}
