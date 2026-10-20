import { useEffect, useRef } from "react"
import type { PublicBusiness } from "@/lib/lokali.functions"

type Point = Pick<PublicBusiness, "businessName" | "commune" | "activity" | "lat" | "lng">

const PIN = `<svg class="lokali-pin-svg" viewBox="0 0 28 36" width="28" height="36" aria-hidden="true"><path d="M14 35c.7 0 11-12.4 11-20a11 11 0 1 0-22 0c0 7.6 10.3 20 11 20z" fill="#146b43"/><circle cx="14" cy="14.2" r="4.2" fill="#c8102e"/></svg>`

export function VendorMap({
  points,
  origin,
  radiusKm,
}: {
  points: Point[]
  origin: { lat: number; lng: number } | null
  radiusKm: number
}) {
  const node = useRef<HTMLDivElement>(null)
  const located = points.filter((point) => point.lat !== null && point.lng !== null)
  const signature = [
    origin ? `${origin.lat.toFixed(4)},${origin.lng.toFixed(4)},${radiusKm}` : "none",
    located.map((point) => `${point.lat},${point.lng},${point.businessName}`).join("|"),
  ].join("::")

  useEffect(() => {
    const host = node.current
    if (!host) return
    let map: { remove: () => void } | undefined
    let cancelled = false
    const pins = located
    const here = origin
    ;(async () => {
      const leaflet = await import("leaflet")
      await import("leaflet/dist/leaflet.css")
      if (cancelled || !host) return
      const L = leaflet.default
      const view = L.map(host, { zoomControl: false, attributionControl: true }).setView(
        here ? [here.lat, here.lng] : [16.25, -61.55],
        here ? 12 : 10,
      )
      L.control.zoom({ position: "bottomright" }).addTo(view)
      L.tileLayer("https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png", {
        subdomains: "abcd",
        attribution: "&copy; OSM &copy; CARTO",
        maxZoom: 19,
      }).addTo(view)
      const icon = L.divIcon({
        className: "lokali-pin-wrap",
        html: PIN,
        iconSize: [28, 36],
        iconAnchor: [14, 34],
        popupAnchor: [0, -30],
      })
      for (const point of pins) {
        L.marker([point.lat as number, point.lng as number], { icon })
          .addTo(view)
          .bindPopup(
            `<strong>${escapeHtml(point.businessName)}</strong><br><span>${escapeHtml([point.activity, point.commune].filter(Boolean).join(" · "))}</span>`,
          )
      }
      if (here) {
        L.circle([here.lat, here.lng], {
          radius: radiusKm * 1000,
          color: "#c8102e",
          weight: 2,
          dashArray: "4 7",
          fillColor: "#146b43",
          fillOpacity: 0.16,
        }).addTo(view)
        L.marker([here.lat, here.lng], {
          icon: L.divIcon({
            className: "lokali-me-wrap",
            html: '<span class="lokali-me"></span>',
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
          zIndexOffset: 800,
          interactive: false,
        }).addTo(view)
        view.fitBounds(L.circle([here.lat, here.lng], { radius: radiusKm * 1000 }).getBounds(), {
          padding: [28, 28],
          maxZoom: 14,
        })
      }
      requestAnimationFrame(() => view.invalidateSize())
      map = view
    })()
    return () => {
      cancelled = true
      map?.remove()
    }
  }, [signature])

  return <div ref={node} className="lokali-map w-full" />
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
