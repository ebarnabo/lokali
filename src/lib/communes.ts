export type Commune = { name: string; lat: number; lng: number }

export const COMMUNES: Commune[] = [
  { name: "Les Abymes", lat: 16.271, lng: -61.504 },
  { name: "Anse-Bertrand", lat: 16.472, lng: -61.508 },
  { name: "Baie-Mahault", lat: 16.267, lng: -61.585 },
  { name: "Baillif", lat: 16.02, lng: -61.746 },
  { name: "Basse-Terre", lat: 15.999, lng: -61.729 },
  { name: "Bouillante", lat: 16.131, lng: -61.769 },
  { name: "Capesterre-Belle-Eau", lat: 16.043, lng: -61.565 },
  { name: "Deshaies", lat: 16.305, lng: -61.795 },
  { name: "Le Gosier", lat: 16.207, lng: -61.491 },
  { name: "Gourbeyre", lat: 15.994, lng: -61.691 },
  { name: "Goyave", lat: 16.135, lng: -61.572 },
  { name: "Grand-Bourg", lat: 15.883, lng: -61.315 },
  { name: "Lamentin", lat: 16.271, lng: -61.631 },
  { name: "Morne-à-l'Eau", lat: 16.331, lng: -61.457 },
  { name: "Le Moule", lat: 16.333, lng: -61.347 },
  { name: "Petit-Bourg", lat: 16.191, lng: -61.591 },
  { name: "Petit-Canal", lat: 16.378, lng: -61.488 },
  { name: "Pointe-à-Pitre", lat: 16.241, lng: -61.533 },
  { name: "Pointe-Noire", lat: 16.231, lng: -61.787 },
  { name: "Port-Louis", lat: 16.417, lng: -61.532 },
  { name: "Saint-Claude", lat: 16.025, lng: -61.7 },
  { name: "Saint-François", lat: 16.253, lng: -61.274 },
  { name: "Saint-Louis", lat: 15.953, lng: -61.317 },
  { name: "Sainte-Anne", lat: 16.226, lng: -61.379 },
  { name: "Sainte-Rose", lat: 16.332, lng: -61.698 },
  { name: "La Désirade", lat: 16.317, lng: -61.05 },
  { name: "Terre-de-Haut", lat: 15.867, lng: -61.582 },
  { name: "Trois-Rivières", lat: 15.975, lng: -61.645 },
  { name: "Vieux-Habitants", lat: 16.059, lng: -61.766 },
]

export function matchCommunes(query: string) {
  const needle = query.trim().toLocaleLowerCase("fr")
  if (needle.length < 1) return []
  return COMMUNES.filter((item) => item.name.toLocaleLowerCase("fr").includes(needle)).slice(0, 6)
}

export function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}
