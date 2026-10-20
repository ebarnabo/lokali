import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Shell } from "@/components/shell"
import { getLegal } from "@/lib/lokali.functions"

export const Route = createFileRoute("/p/$slug")({ component: Legal })

function Legal() {
  const { slug } = Route.useParams()
  const [page, setPage] = useState<{ title: string; body: string } | null>(null)
  const [error, setError] = useState("")
  useEffect(() => {
    getLegal({ data: slug })
      .then(setPage)
      .catch(() => setError("Cette page n'existe pas."))
  }, [slug])
  return (
    <Shell>
      {error ? <p className="text-red">{error}</p> : null}
      {!page && !error ? <p className="text-muted">Chargement…</p> : null}
      {page ? (
        <article className="card max-w-3xl p-6 md:p-10">
          <h1 className="text-4xl font-semibold tracking-tight">{page.title}</h1>
          <div className="mt-8 space-y-4 text-base leading-relaxed">
            {page.body
              .trim()
              .split(/\n{2,}/)
              .map((paragraph) => (
                <p key={paragraph.slice(0, 48)} className="whitespace-pre-wrap">
                  {paragraph}
                </p>
              ))}
          </div>
        </article>
      ) : null}
    </Shell>
  )
}
