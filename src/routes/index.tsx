import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Shell } from "@/components/shell"
import { getCopy, listBusinesses, type PublicBusiness } from "@/lib/lokali.functions"

export const Route = createFileRoute("/")({ component: Home })

function Home() {
  const [copy, setCopy] = useState({ hero_title: "", hero_text: "", entraide_intro: "" })
  const [query, setQuery] = useState("")
  const [rows, setRows] = useState<PublicBusiness[] | null>(null)
  const [error, setError] = useState("")

  useEffect(() => {
    getCopy().then(setCopy).catch(() => setError("Les textes du site sont indisponibles."))
  }, [])

  useEffect(() => {
    const handle = setTimeout(() => {
      listBusinesses({ data: query })
        .then((list) => {
          setRows(list)
          setError("")
        })
        .catch(() => setError("Impossible de charger les offres."))
    }, 200)
    return () => clearTimeout(handle)
  }, [query])

  return (
    <Shell>
      <section className="mb-8 max-w-2xl">
        <h1 className="text-4xl font-semibold tracking-tight">{copy.hero_title || "Lokali"}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{copy.hero_text}</p>
      </section>
      <input
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Commerce, commune, produit"
        className="mb-8 h-12 w-full rounded-2xl border border-line bg-paper px-4 outline-none focus:border-green"
      />
      {error ? <p className="mb-4 text-sm text-red">{error}</p> : null}
      {rows === null ? <p className="text-muted">Chargement…</p> : null}
      {rows && rows.length === 0 ? (
        <p className="rounded-3xl border border-line bg-paper p-8 text-muted">
          Aucune offre publiée. Un compte pro renseigne son commerce et ce qu'il vend.
        </p>
      ) : null}
      <div className="grid gap-4 md:grid-cols-2">
        {rows?.map((business) => (
          <article key={`${business.businessName}-${business.address}`} className="lift rounded-3xl border border-line bg-paper p-6">
            <h2 className="text-xl font-semibold">{business.businessName}</h2>
            <p className="mt-1 text-sm text-muted">
              {[business.commune, business.address].filter(Boolean).join(" · ")}
            </p>
            {business.description ? <p className="mt-3 leading-relaxed">{business.description}</p> : null}
            <ul className="mt-4 space-y-2">
              {business.products.length === 0 ? <li className="text-sm text-muted">Aucun produit en ligne.</li> : null}
              {business.products.map((product) => (
                <li key={product.id} className="flex items-baseline justify-between gap-4 text-sm">
                  <span>
                    <span className="font-medium">{product.name}</span>
                    {product.detail ? <span className="text-muted"> — {product.detail}</span> : null}
                  </span>
                  <span className="shrink-0">{[product.priceLabel, product.unit].filter(Boolean).join(" / ")}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm">
              {business.phone ? (
                <a className="mr-4 underline" href={`tel:${business.phone.replace(/[^\d+]/g, "")}`}>
                  {business.phone}
                </a>
              ) : null}
              {business.email ? (
                <a className="underline" href={`mailto:${encodeURIComponent(business.email)}`}>
                  {business.email}
                </a>
              ) : null}
              {!business.phone && !business.email ? <span className="text-muted">Contact non publié</span> : null}
            </p>
          </article>
        ))}
      </div>
    </Shell>
  )
}
