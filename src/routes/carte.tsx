import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Shell } from "@/components/shell"
import { VendorMap } from "@/components/vendor-map"
import { listBusinesses, type PublicBusiness } from "@/lib/lokali.functions"

export const Route = createFileRoute("/carte")({ component: MapPage })

function MapPage() {
  const [rows, setRows] = useState<PublicBusiness[] | null>(null)
  useEffect(() => {
    listBusinesses({ data: "" }).then(setRows).catch(() => setRows([]))
  }, [])
  return (
    <Shell>
      <h1 className="mb-2 text-3xl font-semibold tracking-tight">Carte</h1>
      <p className="mb-6 max-w-2xl text-muted">
        Un commerce apparaît ici seulement s'il a enregistré ses coordonnées.
      </p>
      {rows === null ? <p className="text-muted">Chargement…</p> : <VendorMap points={rows} />}
    </Shell>
  )
}
