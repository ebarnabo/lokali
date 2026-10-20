import { useEffect, useRef } from "react"
import type { PublicBusiness } from "@/lib/lokali.functions"

type Point = Pick<PublicBusiness, "businessName" | "commune" | "address" | "lat" | "lng">

export function VendorMap({ points }: { points: Point[] }) {
  const node = useRef<HTMLDivElement>(null)
  const located = points.filter((point) => point.lat !== null && point.lng !== null)

  const signature = located.map((point) => `${point.lat},${point.lng},${point.businessName}`).join("|")

  useEffect(() => {
    const host = node.current
    if (!host || located.length === 0) return
    let map: { remove: () => void } | undefined
    let cancelled = false
    const pins = located
    ;(async () => {
      const leaflet = await import("leaflet")
      await import("leaflet/dist/leaflet.css")
      if (cancelled || !host) return
      const L = leaflet.default
      const view = L.map(host).setView([16.25, -61.53], 10)
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(view)
      const icon = L.divIcon({ className: "lokali-pin", iconSize: [14, 14], iconAnchor: [7, 7] })
      for (const point of pins) {
        L.marker([point.lat as number, point.lng as number], { icon })
          .addTo(view)
          .bindPopup(`<strong>${escapeHtml(point.businessName)}</strong><br>${escapeHtml(point.address)}`)
      }
      map = view
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [signature])

  if (located.length === 0) {
    return (
      <p className="rounded-3xl border border-line bg-paper p-8 text-muted">
        Aucun commerce n'a encore indiqué de coordonnées.
      </p>
    )
  }

  return <div ref={node} className="h-[28rem] overflow-hidden rounded-3xl border border-line" />
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => {
    if (char === "&") return "\u0026amp;"
    if (char === "<") return "\u0026lt;"
    if (char === ">") return "\u0026gt;"
    if (char === '"') return "\u0026quot;"
    return "\u0026#39;"
  })
}
