import { createFileRoute } from "@tanstack/react-router"
import { MapPin, Search, Tag } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import { Shell, buttonClass } from "@/components/shell"
import { matchCommunes } from "@/lib/communes"
import { getCopy, listBusinesses, suggestSearch, type PublicBusiness } from "@/lib/lokali.functions"

export const Route = createFileRoute("/")({ component: Home })

const spring = { type: "spring", stiffness: 380, damping: 32 } as const
const quickCommunes = ["Les Abymes", "Baie-Mahault", "Le Gosier", "Pointe-à-Pitre", "Sainte-Anne", "Petit-Bourg"]

function Home() {
  const reduce = useReducedMotion()
  const [title, setTitle] = useState("Lokali")
  const [draft, setDraft] = useState("")
  const [query, setQuery] = useState("")
  const [open, setOpen] = useState(false)
  const [remote, setRemote] = useState<{ communes: string[]; topics: string[] }>({ communes: [], topics: [] })
  const [all, setAll] = useState<PublicBusiness[] | null>(null)
  const [rows, setRows] = useState<PublicBusiness[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    getCopy().then((copy) => setTitle(copy.hero_title || "Lokali")).catch(() => undefined)
    listBusinesses({ data: "" })
      .then(setAll)
      .catch(() => setError("Impossible de charger les offres."))
  }, [])

  useEffect(() => {
    const needle = draft.trim()
    if (needle.length < 1) {
      setRemote({ communes: [], topics: [] })
      return
    }
    const handle = setTimeout(() => {
      suggestSearch({ data: needle })
        .then(setRemote)
        .catch(() => setRemote({ communes: [], topics: [] }))
    }, 100)
    return () => clearTimeout(handle)
  }, [draft])

  const hints = useMemo(() => {
    const needle = draft.trim()
    const places = unique([
      ...(needle ? matchCommunes(needle).map((item) => item.name) : quickCommunes),
      ...remote.communes,
    ]).slice(0, 5)
    const known = new Set(places.map((item) => item.toLocaleLowerCase("fr")))
    const fromCatalog = topicsFrom(all ?? [], needle)
    const topics = unique([...fromCatalog, ...remote.topics])
      .filter((item) => !known.has(item.toLocaleLowerCase("fr")))
      .slice(0, 5)
    return { communes: places, topics }
  }, [all, draft, remote])

  function run(value: string) {
    const next = value.trim()
    setDraft(value)
    setQuery(next)
    setOpen(false)
    if (!next) {
      setRows(null)
      return
    }
    listBusinesses({ data: next })
      .then((list) => {
        setRows(list)
        setError("")
      })
      .catch(() => setError("Impossible de charger les offres."))
  }

  const categories = useMemo(() => {
    const counts = new Map<string, number>()
    for (const business of all ?? []) {
      if (!business.activity) continue
      counts.set(business.activity, (counts.get(business.activity) ?? 0) + 1)
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "fr"))
  }, [all])

  const fresh = useMemo(
    () => [...(all ?? [])].sort((a, b) => b.createdOn.localeCompare(a.createdOn)).slice(0, 6),
    [all],
  )

  const showHints = open && hints.communes.length + hints.topics.length > 0

  return (
    <Shell>
      <section className="relative mb-10">
        <motion.p
          className="kicker"
          initial={reduce ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={spring}
        >
          Circuit court
        </motion.p>
        <motion.h1
          className="mt-3 max-w-3xl text-5xl leading-[0.95] font-semibold tracking-tight md:text-7xl"
          initial={reduce ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.04 }}
        >
          {title}
        </motion.h1>

        <motion.form
          className="relative mt-8 max-w-2xl"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.08 }}
          onSubmit={(event) => {
            event.preventDefault()
            run(draft)
          }}
        >
          <label className="card flex items-center gap-2 p-2 pl-4">
            <Search className="h-5 w-5 shrink-0 text-green" aria-hidden />
            <input
              value={draft}
              onChange={(event) => {
                setDraft(event.target.value)
                setOpen(true)
              }}
              onFocus={() => setOpen(true)}
              onBlur={() => setOpen(false)}
              placeholder="Commune, produit, commerce"
              className="h-12 w-full bg-transparent text-base outline-none"
              aria-autocomplete="list"
              aria-expanded={showHints}
              role="combobox"
            />
            <button className={`${buttonClass} shrink-0 px-5`} type="submit">
              Chercher
            </button>
          </label>
          <AnimatePresence>
            {showHints ? (
              <motion.div
                className="card absolute z-30 mt-2 w-full overflow-hidden p-2"
                initial={reduce ? false : { opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4 }}
                transition={{ duration: 0.18 }}
              >
                <HintGroup icon="pin" title="Communes" items={hints.communes} onPick={run} />
                <HintGroup icon="tag" title="Sujets" items={hints.topics} onPick={run} />
              </motion.div>
            ) : null}
          </AnimatePresence>
        </motion.form>
      </section>

      {error ? <p className="mb-4 text-sm text-red">{error}</p> : null}

      {query ? (
        <section>
          <div className="flex items-end justify-between gap-3">
            <h2 className="text-3xl font-semibold">Résultats</h2>
            <button type="button" className="text-sm text-muted hover:text-ink" onClick={() => run("")}>
              Effacer
            </button>
          </div>
          {rows === null ? <p className="mt-4 text-muted">Chargement…</p> : null}
          {rows && rows.length === 0 ? <p className="card mt-4 p-6 text-muted">Rien pour « {query} ».</p> : null}
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            {rows?.map((business, index) => (
              <ShopCard key={`${business.siret}-${business.businessName}`} business={business} index={index} />
            ))}
          </div>
        </section>
      ) : (
        <>
          {categories.length > 0 ? (
            <section className="mb-12">
              <h2 className="text-3xl font-semibold">Catégories</h2>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {categories.map(([name, count], index) => (
                  <motion.button
                    key={name}
                    type="button"
                    className="card relative overflow-hidden p-4 text-left"
                    initial={reduce ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ ...spring, delay: Math.min(index, 8) * 0.04 }}
                    whileHover={reduce ? undefined : { y: -3 }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    onClick={() => run(name)}
                  >
                    <span className={`absolute top-0 right-0 h-8 w-8 ${index % 3 === 1 ? "bg-red" : "bg-green"}`} />
                    <span className="block pr-8 font-display text-xl leading-tight font-semibold">{name}</span>
                    <span className="mt-3 block text-sm text-muted tabular-nums">{count}</span>
                  </motion.button>
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="text-3xl font-semibold">Nouveaux</h2>
            {all === null ? <p className="mt-4 text-muted">Chargement…</p> : null}
            {all && fresh.length === 0 ? <p className="card mt-4 p-6 text-muted">Aucun commerce publié.</p> : null}
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {fresh.map((business, index) => (
                <ShopCard key={`${business.siret}-${business.businessName}`} business={business} index={index} fresh />
              ))}
            </div>
          </section>
        </>
      )}
    </Shell>
  )
}

function HintGroup({
  icon,
  title,
  items,
  onPick,
}: {
  icon: "pin" | "tag"
  title: string
  items: string[]
  onPick: (value: string) => void
}) {
  if (items.length === 0) return null
  const Icon = icon === "pin" ? MapPin : Tag
  return (
    <div className="px-1 py-1">
      <p className="px-2 py-1 text-xs font-medium tracking-wide text-muted uppercase">{title}</p>
      {items.map((item) => (
        <button
          key={`${title}-${item}`}
          type="button"
          className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm hover:bg-cream"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onPick(item)}
        >
          <Icon className="h-4 w-4 shrink-0 text-green" aria-hidden />
          {item}
        </button>
      ))}
    </div>
  )
}

function ShopCard({ business, index, fresh }: { business: PublicBusiness; index: number; fresh?: boolean }) {
  const reduce = useReducedMotion()
  const offer = business.products[0]
  return (
    <motion.article
      className="card relative overflow-hidden p-5 pl-6"
      initial={reduce ? false : { opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...spring, delay: Math.min(index, 6) * 0.05 }}
      whileHover={reduce ? undefined : { y: -3 }}
    >
      <span className="absolute inset-y-0 left-0 w-1.5 bg-green" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-2xl leading-none font-semibold">{business.businessName}</h3>
          <p className="mt-2 text-sm text-muted">{[business.activity, business.commune].filter(Boolean).join(" · ")}</p>
        </div>
        {fresh ? <span className="rounded-full bg-red px-2.5 py-1 text-xs font-medium text-paper">Nouveau</span> : null}
      </div>
      {offer ? (
        <p className="mt-4 text-sm">
          <span className="font-medium">{offer.name}</span>
          {offer.priceLabel ? <span className="text-muted"> · {offer.priceLabel}</span> : null}
        </p>
      ) : null}
    </motion.article>
  )
}

function topicsFrom(businesses: PublicBusiness[], needle: string) {
  const labels = new Set<string>()
  for (const business of businesses) {
    if (business.activity) labels.add(business.activity)
    for (const product of business.products) {
      if (product.name) labels.add(product.name)
    }
  }
  const query = needle.trim().toLocaleLowerCase("fr")
  return [...labels]
    .filter((label) => !query || label.toLocaleLowerCase("fr").includes(query))
    .sort((a, b) => a.localeCompare(b, "fr"))
}

function unique(values: string[]) {
  const seen = new Set<string>()
  const list: string[] = []
  for (const value of values) {
    const key = value.toLocaleLowerCase("fr")
    if (!value || seen.has(key)) continue
    seen.add(key)
    list.push(value)
  }
  return list
}
