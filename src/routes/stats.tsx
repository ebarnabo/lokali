import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Shell, buttonClass, ghostClass, inputClass } from "@/components/shell"
import { RedirectToSignIn } from "@/lib/auth/gates"
import { useCurrentUserState } from "@/lib/auth/use-current-user"
import { getMe, getStats, type Stats } from "@/lib/lokali.functions"

export const Route = createFileRoute("/stats")({ component: StatsPage })

const presets = [
  { id: "7", label: "7 jours", days: 7 },
  { id: "30", label: "30 jours", days: 30 },
  { id: "90", label: "90 jours", days: 90 },
] as const

function iso(date: Date) {
  return date.toISOString().slice(0, 10)
}

function range(days: number) {
  const to = new Date()
  const from = new Date(to)
  from.setUTCDate(from.getUTCDate() - (days - 1))
  return { from: iso(from), to: iso(to) }
}

function StatsPage() {
  const { user, isPending } = useCurrentUserState()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [preset, setPreset] = useState("30")
  const initial = range(30)
  const [from, setFrom] = useState(initial.from)
  const [to, setTo] = useState(initial.to)
  const [stats, setStats] = useState<Stats | null>(null)
  const [message, setMessage] = useState("")

  function load(nextFrom = from, nextTo = to) {
    setMessage("")
    getStats({ data: { from: nextFrom, to: nextTo } })
      .then(setStats)
      .catch((error: Error) => {
        setStats(null)
        setMessage(error.message || "Statistiques indisponibles")
      })
  }

  useEffect(() => {
    if (!user) return
    getMe()
      .then((me) => {
        setAllowed(me.isAdmin)
        if (me.isAdmin) load(initial.from, initial.to)
      })
      .catch(() => setAllowed(false))
  }, [user])

  if (isPending || (user && allowed === null)) return <Shell><p className="text-muted">Chargement…</p></Shell>
  if (!user) return <RedirectToSignIn />
  if (!allowed) return <Shell><p>Cette partie est réservée à l'administration.</p></Shell>

  const text = stats ? summary(stats) : ""

  return (
    <Shell>
      <p className="kicker">Efficacité</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Statistiques</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Totaux agrégés, sans nom ni email. Le compte de démonstration local n'est pas compté.
      </p>
      <div className="mt-6 flex flex-wrap items-end gap-2">
        {presets.map((item) => (
          <button
            key={item.id}
            type="button"
            className={preset === item.id ? buttonClass : ghostClass}
            onClick={() => {
              const next = range(item.days)
              setPreset(item.id)
              setFrom(next.from)
              setTo(next.to)
              load(next.from, next.to)
            }}
          >
            {item.label}
          </button>
        ))}
        <label className="text-sm">
          <span className="mb-1 block text-muted">Du</span>
          <input
            type="date"
            className={inputClass}
            value={from}
            onChange={(event) => {
              setPreset("custom")
              setFrom(event.target.value)
            }}
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-muted">Au</span>
          <input
            type="date"
            className={inputClass}
            value={to}
            onChange={(event) => {
              setPreset("custom")
              setTo(event.target.value)
            }}
          />
        </label>
        <button type="button" className={buttonClass} onClick={() => load()}>Voir</button>
      </div>
      {message ? <p className="mt-4 text-sm text-red">{message}</p> : null}
      {!stats && !message ? <p className="mt-6 text-muted">Chargement…</p> : null}
      {stats ? (
        <>
          <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Metric label="Nouveaux comptes" value={stats.newParticuliers + stats.newPros} detail={`${stats.newParticuliers} particuliers · ${stats.newPros} pros`} />
            <Metric label="Pros avec un produit" value={stats.prosWithProduct} detail={stats.newPros ? `${Math.round((stats.prosWithProduct / stats.newPros) * 100)} % des nouveaux pros` : "Aucun nouveau pro"} />
            <Metric label="Produits ajoutés" value={stats.newProducts} detail="sur la période" />
            <Metric
              label="Annonces déposées"
              value={stats.postsCreated}
              detail={decided(stats) ? `${Math.round((stats.postsApproved / decided(stats)) * 100)} % validées parmi les traitées` : "Rien de traité"}
            />
          </section>
          <section className="card mt-4 grid gap-4 p-5 sm:grid-cols-3">
            <p><span className="block text-sm text-muted">Validées</span><span className="font-display text-2xl tabular-nums">{stats.postsApproved}</span></p>
            <p><span className="block text-sm text-muted">Refusées</span><span className="font-display text-2xl tabular-nums">{stats.postsRejected}</span></p>
            <p><span className="block text-sm text-muted">Encore en attente</span><span className="font-display text-2xl tabular-nums">{stats.postsPending}</span></p>
          </section>
          <Series series={stats.series} />
          <section className="mt-8">
            <h2 className="text-2xl font-semibold">État du catalogue</h2>
            <p className="mt-1 text-sm text-muted">Photo d'aujourd'hui, pas limitée à la période.</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
              <Metric label="Commerces visibles" value={stats.visibleBusinesses} />
              <Metric label="Produits en ligne" value={stats.liveProducts} />
              <Metric label="Communes" value={stats.communes} />
              <Metric label="Avec un contact public" value={stats.withContact} />
              <Metric label="Annonces publiques" value={stats.livePosts} />
            </div>
          </section>
          <div className="mt-8 flex flex-wrap gap-2">
            <button
              type="button"
              className={buttonClass}
              onClick={() => {
                const share = navigator.share?.bind(navigator)
                const copy = () => navigator.clipboard.writeText(text).then(() => setMessage("Résumé copié.")).catch(() => setMessage("Copie impossible."))
                if (!share) {
                  copy()
                  return
                }
                share({ title: "Lokali — statistiques", text }).catch((error: Error) => {
                  if (error.name === "AbortError") return
                  copy()
                })
              }}
            >
              Partager
            </button>
            <button
              type="button"
              className={ghostClass}
              onClick={() => navigator.clipboard.writeText(text).then(() => setMessage("Résumé copié.")).catch(() => setMessage("Copie impossible."))}
            >
              Copier
            </button>
            <button
              type="button"
              className={ghostClass}
              onClick={() => {
                const blob = new Blob([text], { type: "text/plain;charset=utf-8" })
                const url = URL.createObjectURL(blob)
                const link = document.createElement("a")
                link.href = url
                link.download = `lokali-stats-${stats.from}-${stats.to}.txt`
                link.click()
                URL.revokeObjectURL(url)
              }}
            >
              Télécharger
            </button>
          </div>
        </>
      ) : null}
    </Shell>
  )
}

function decided(stats: Stats) {
  return stats.postsApproved + stats.postsRejected
}

function Metric({ label, value, detail }: { label: string; value: number; detail?: string }) {
  return (
    <article className="card p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 font-display text-3xl tabular-nums">{value}</p>
      {detail ? <p className="mt-1 text-xs text-muted">{detail}</p> : null}
    </article>
  )
}

function Series({ series }: { series: Stats["series"] }) {
  const max = Math.max(1, ...series.map((item) => item.accounts + item.products + item.posts))
  const active = series.some((item) => item.accounts + item.products + item.posts > 0)
  return (
    <section className="card mt-4 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-semibold">Jour par jour</h2>
        <p className="flex gap-3 text-xs text-muted">
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-green" /> Comptes</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-ink" /> Produits</span>
          <span><i className="mr-1 inline-block h-2 w-2 rounded-full bg-red" /> Annonces</span>
        </p>
      </div>
      {!active ? <p className="mt-4 text-sm text-muted">Aucune activité sur cette période.</p> : null}
      {active ? (
        <div className="mt-4 flex h-28 items-stretch gap-1 overflow-x-auto">
          {series.map((item) => (
            <div key={item.day} className="flex h-full w-3 shrink-0 flex-col justify-end" title={`${item.day} · ${item.accounts} comptes, ${item.products} produits, ${item.posts} annonces`}>
              <div className="bg-red" style={{ height: `${(item.posts / max) * 100}%` }} />
              <div className="bg-ink" style={{ height: `${(item.products / max) * 100}%` }} />
              <div className="bg-green" style={{ height: `${(item.accounts / max) * 100}%` }} />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  )
}

function summary(stats: Stats) {
  const accounts = stats.newParticuliers + stats.newPros
  const rate = decided(stats) ? `${Math.round((stats.postsApproved / decided(stats)) * 100)} %` : "—"
  const onboard = stats.newPros ? `${stats.prosWithProduct}/${stats.newPros}` : "0"
  return [
    "Lokali — statistiques",
    `Période : ${stats.from} → ${stats.to}`,
    "",
    `Nouveaux comptes : ${accounts} (${stats.newParticuliers} particuliers, ${stats.newPros} pros)`,
    `Nouveaux pros ayant ajouté un produit : ${onboard}`,
    `Produits ajoutés : ${stats.newProducts}`,
    `Annonces déposées : ${stats.postsCreated} (validées ${stats.postsApproved}, refusées ${stats.postsRejected}, en attente ${stats.postsPending})`,
    `Taux de validation des annonces traitées : ${rate}`,
    "",
    "Catalogue aujourd'hui",
    `Commerces visibles : ${stats.visibleBusinesses}`,
    `Produits en ligne : ${stats.liveProducts}`,
    `Communes : ${stats.communes}`,
    `Commerces avec contact public : ${stats.withContact}`,
    `Annonces publiques : ${stats.livePosts}`,
  ].join("\n")
}
