import { createFileRoute, Link } from "@tanstack/react-router"
import { LocateFixed, MapPin, Search } from "lucide-react"
import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { useEffect, useMemo, useState } from "react"
import { Shell, buttonClass, ghostClass } from "@/components/shell"
import { VendorMap } from "@/components/vendor-map"
import { useCurrentUserState } from "@/lib/auth/use-current-user"
import { COMMUNES, distanceKm, matchCommunes } from "@/lib/communes"
import { listBusinesses, type PublicBusiness } from "@/lib/lokali.functions"

export const Route = createFileRoute("/carte")({ component: MapPage })

const PLACE_KEY = "lokali-place"
const RADIUS_KEY = "lokali-radius"
const GUEST_RADIUS = 8
const spring = { type: "spring", stiffness: 380, damping: 32 } as const

type Place = { lat: number; lng: number; label: string }

function MapPage() {
  const reduce = useReducedMotion()
  const { user } = useCurrentUserState()
  const [rows, setRows] = useState<PublicBusiness[] | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [radius, setRadius] = useState(GUEST_RADIUS)
  const [draft, setDraft] = useState("")
  const [open, setOpen] = useState(false)
  const [message, setMessage] = useState("")
  const [locating, setLocating] = useState(false)

  useEffect(() => {
    listBusinesses({ data: "" }).then(setRows).catch(() => setRows([]))
    try {
      const saved = localStorage.getItem(PLACE_KEY)
      if (saved) {
        const next = JSON.parse(saved) as Place
        setPlace(next)
        setDraft(next.label === "Ma position" ? "" : next.label)
      }
      const savedRadius = Number(localStorage.getItem(RADIUS_KEY))
      if (savedRadius >= 2 && savedRadius <= 30) setRadius(savedRadius)
    } catch {
      setPlace(null)
    }
  }, [])

  function remember(next: Place) {
    setPlace(next)
    setDraft(next.label === "Ma position" ? "" : next.label)
    setOpen(false)
    setMessage("")
    localStorage.setItem(PLACE_KEY, JSON.stringify(next))
  }

  function locate() {
    if (!navigator.geolocation) {
      setMessage("Localisation indisponible.")
      return
    }
    setLocating(true)
    setMessage("")
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocating(false)
        remember({ lat: position.coords.latitude, lng: position.coords.longitude, label: "Ma position" })
      },
      () => {
        setLocating(false)
        setMessage("Position refusée.")
      },
      { enableHighAccuracy: false, timeout: 8000 },
    )
  }

  function pickCommune(value: string) {
    const found = COMMUNES.find((item) => item.name.toLocaleLowerCase("fr") === value.trim().toLocaleLowerCase("fr"))
      ?? matchCommunes(value)[0]
    if (!found) {
      setMessage("Commune inconnue.")
      return
    }
    remember({ lat: found.lat, lng: found.lng, label: found.name })
  }

  const activeRadius = user ? radius : GUEST_RADIUS
  const suggestions = draft.trim() ? matchCommunes(draft).slice(0, 6) : []
  const nearby = useMemo(() => {
    if (!place || !rows) return []
    return rows
      .flatMap((business) => {
        if (business.lat === null || business.lng === null) return []
        const km = distanceKm(place, { lat: business.lat, lng: business.lng })
        return km <= activeRadius ? [{ business, km }] : []
      })
      .sort((a, b) => a.km - b.km)
  }, [place, rows, activeRadius])

  return (
    <Shell>
      <motion.div initial={reduce ? false : { opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={spring}>
        <p className="kicker">Autour de vous</p>
        <h1 className="mt-2 text-5xl font-semibold tracking-tight">Carte</h1>
      </motion.div>

      <div className="mt-6">
        <div className="card mt-6 overflow-hidden">
          <VendorMap
            points={place ? nearby.map((item) => item.business) : (rows ?? [])}
            origin={place}
            radiusKm={activeRadius}
          />
        </div>

        <form
          className="card relative z-[500] mt-3 p-3"
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.trim()) pickCommune(draft)
          }}
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <button
              type="button"
              className={`${buttonClass} shrink-0 gap-2 px-5`}
              onClick={locate}
              disabled={locating}
            >
              <LocateFixed className="h-4 w-4" aria-hidden />
              {locating ? "…" : "Me localiser"}
            </button>
            <div className="relative min-w-0 flex-1">
              <div className="flex gap-2">
                <div className="relative min-w-0 flex-1">
                  <Search className="pointer-events-none absolute top-3 left-3 h-4 w-4 text-green" aria-hidden />
                  <input
                    value={draft}
                    onChange={(event) => {
                      setDraft(event.target.value)
                      setOpen(true)
                    }}
                    onFocus={() => setOpen(Boolean(draft.trim()))}
                    onBlur={() => setOpen(false)}
                    placeholder="Commune, si besoin"
                    className="h-11 w-full rounded-xl bg-cream/80 pr-3 pl-9 outline-none"
                    aria-autocomplete="list"
                    aria-expanded={open}
                  />
                </div>
                <button type="submit" className={`${ghostClass} h-11 px-4`}>
                  OK
                </button>
              </div>
              <AnimatePresence>
                {open && suggestions.length > 0 ? (
                  <motion.div
                    className="absolute top-full right-0 left-0 z-10 mt-2 max-h-48 overflow-y-auto rounded-xl bg-paper shadow-card"
                    initial={reduce ? false : { opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.16 }}
                  >
                    {suggestions.map((item) => (
                      <button
                        key={item.name}
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-cream"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => pickCommune(item.name)}
                      >
                        <MapPin className="h-4 w-4 text-green" aria-hidden />
                        {item.name}
                      </button>
                    ))}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
            <div className="md:w-48">
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted">Rayon</span>
                <span className="font-display text-2xl leading-none text-green">{activeRadius} km</span>
              </div>
              <input
                className="lokali-range w-full"
                type="range"
                min={2}
                max={30}
                step={1}
                value={activeRadius}
                disabled={!user}
                aria-label="Rayon en kilomètres"
                onChange={(event) => {
                  const next = Number(event.target.value)
                  setRadius(next)
                  localStorage.setItem(RADIUS_KEY, String(next))
                }}
              />
              {!user ? (
                <p className="text-xs text-muted">
                  <Link to="/login" className="font-medium text-green">Connexion</Link> pour le régler.
                </p>
              ) : null}
            </div>
          </div>
          {message ? <p className="mt-2 text-xs text-red">{message}</p> : null}
        </form>
      </div>

      <section className="mt-4">
        {place ? (
          <p className="text-sm text-muted">
            {rows === null
              ? "…"
              : nearby.length === 0
                ? "Rien à proximité."
                : `${nearby.length} · ${place.label}`}
          </p>
        ) : null}
        <div className="mt-3 grid gap-2">
          <AnimatePresence mode="popLayout">
            {nearby.map(({ business, km }, index) => (
              <motion.article
                layout
                key={`${business.siret}-${business.businessName}`}
                className="card flex items-center justify-between gap-3 px-4 py-3"
                initial={reduce ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ ...spring, delay: Math.min(index, 6) * 0.03 }}
              >
                <div>
                  <p className="font-medium">{business.businessName}</p>
                  <p className="text-sm text-muted">{[business.activity, business.commune].filter(Boolean).join(" · ")}</p>
                </div>
                <p className="shrink-0 font-display text-lg text-green tabular-nums">{km < 1 ? "< 1 km" : `${km.toFixed(1)} km`}</p>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      </section>
    </Shell>
  )
}