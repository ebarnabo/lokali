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
      {error ? <p>{error}</p> : null}
      {page ? (
        <article className="max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight">{page.title}</h1>
          <p className="mt-6 whitespace-pre-wrap leading-relaxed">{page.body}</p>
        </article>
      ) : null}
    </Shell>
  )
}
