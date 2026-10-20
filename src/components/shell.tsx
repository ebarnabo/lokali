import { Link } from "@tanstack/react-router"
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
    <div className="min-h-screen bg-cream text-ink">
      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-3 md:px-6">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex shrink-0 items-center gap-2 font-semibold tracking-tight">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-green text-sm text-paper">L</span>
              Lokali
            </Link>
            <nav className="hidden min-w-0 flex-1 items-center gap-1 overflow-x-auto md:flex">
              <NavLinks me={me} />
            </nav>
            <div className="ml-auto flex shrink-0 items-center gap-2">
              <SignedOut>
                <Link to="/login" className="rounded-2xl bg-green px-3 py-2 text-sm font-medium text-paper sm:px-4">
                  Connexion
                </Link>
              </SignedOut>
              <UserButton />
            </div>
          </div>
          <nav className="mt-2 flex items-center gap-1 overflow-x-auto md:hidden">
            <NavLinks me={me} />
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6">{children}</main>
      <footer className="border-t border-line px-4 py-8 text-sm text-muted">
        <div className="mx-auto flex max-w-6xl flex-wrap gap-x-6 gap-y-2">
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

function NavLinks({ me }: { me: Me | null }) {
  return (
    <>
      {links.map((item) => (
        <Link
          key={item.to}
          to={item.to}
          className="shrink-0 rounded-2xl px-3 py-2 text-sm text-muted hover:bg-cream hover:text-ink"
          activeProps={{ className: "shrink-0 rounded-2xl bg-green px-3 py-2 text-sm text-paper" }}
        >
          {item.label}
        </Link>
      ))}
      {me?.isAdmin ? (
        <Link
          to="/admin"
          className="shrink-0 rounded-2xl px-3 py-2 text-sm text-muted hover:bg-cream hover:text-ink"
          activeProps={{ className: "shrink-0 rounded-2xl bg-ink px-3 py-2 text-sm text-paper" }}
        >
          Admin
        </Link>
      ) : null}
    </>
  )
}

export function Field({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <label className="block space-y-2 text-sm">
      <span className="font-medium">{label}</span>
      {children}
    </label>
  )
}

export const inputClass =
  "h-12 w-full rounded-2xl border border-line bg-paper px-4 text-ink outline-none focus:border-green"

export const buttonClass =
  "inline-flex h-12 items-center justify-center rounded-2xl bg-green px-5 text-sm font-medium text-paper disabled:opacity-60"

export const ghostClass =
  "inline-flex h-12 items-center justify-center rounded-2xl border border-line bg-paper px-5 text-sm font-medium"
