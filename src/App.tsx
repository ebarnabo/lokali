import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix Leaflet default icon
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
})

type Vendor = {
  id: string
  name: string
  type: string
  lat: number
  lng: number
  distance: string
  verified: boolean
  products: { name: string; price: string; stock: string }[]
  promo?: string
}

const vendors: Vendor[] = [
  {
    id: '1',
    name: 'Marché Petit-Bourg',
    type: 'Marché',
    lat: 16.191,
    lng: -61.591,
    distance: '1.2 km',
    verified: true,
    promo: 'Promo grève — validé',
    products: [
      { name: 'Banane', price: '1,80 €/kg', stock: 'Abondant' },
      { name: 'Igname', price: '2,90 €/kg', stock: 'Disponible' },
      { name: 'Ananas', price: '3,20 €', stock: 'Limité' },
    ],
  },
  {
    id: '2',
    name: 'Ti’Kay Bon',
    type: 'Épicerie bio',
    lat: 16.25,
    lng: -61.38,
    distance: '1.2 km',
    verified: true,
    products: [
      { name: 'Avocat', price: '2,50 €', stock: 'Disponible' },
      { name: 'Miel', price: '8 €', stock: 'Abondant' },
    ],
  },
  {
    id: '3',
    name: 'Ferme Natirèl',
    type: 'Ferme',
    lat: 16.27,
    lng: -61.5,
    distance: '3.1 km',
    verified: true,
    products: [
      { name: 'Légumes', price: 'variable', stock: 'Du jour' },
      { name: 'Œufs', price: '3,50 €', stock: 'Disponible' },
    ],
  },
]

const categories = ['Fruits', 'Légumes', 'Racines', 'Poisson', 'Épices', 'Tous']

export default function App() {
  const [view, setView] = useState<'home' | 'map' | 'help' | 'merchant'>('home')
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Tous')
  const [reserved, setReserved] = useState(false)

  const filteredVendors = vendors.filter(v =>
    (filter === 'Tous' || v.products.some(p => p.name.toLowerCase().includes(filter.toLowerCase()))) &&
    (search === '' || v.name.toLowerCase().includes(search.toLowerCase()) || v.products.some(p => p.name.toLowerCase().includes(search.toLowerCase())))
  )

  return (
    <div className="min-h-screen bg-cream">
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-black/5">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <button onClick={() => { setView('home'); setSelectedVendor(null) }} className="flex items-center gap-2 font-semibold text-xl">
            <span className="w-8 h-8 rounded-full bg-green flex items-center justify-center text-white text-sm">L</span>
            Lokali
          </button>
          <nav className="flex gap-1">
            {[
              { id: 'home', label: 'Accueil' },
              { id: 'map', label: 'Carte' },
              { id: 'help', label: 'Entraide' },
              { id: 'merchant', label: 'Commerçants' },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => { setView(item.id as any); setSelectedVendor(null) }}
                className={`px-4 py-2 rounded-2xl text-sm font-medium transition ${view === item.id ? 'bg-green text-white' : 'text-ink/70 hover:bg-black/5'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {view === 'home' && !selectedVendor && (
            <motion.div key="home" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.25 }}>
              <div className="mb-10">
                <h1 className="text-4xl font-bold tracking-tight">Le local, près de chez vous.</h1>
                <p className="mt-2 text-lg text-ink/70">Producteurs et commerçants guadeloupéens. Circuit court, stocks du jour.</p>
              </div>

              <div className="relative mb-8">
                <input
                  type="text"
                  placeholder="Banane, igname, poisson, marché..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full h-14 pl-5 pr-12 rounded-3xl border border-black/10 bg-white focus:outline-none focus:ring-2 focus:ring-green/30"
                />
              </div>

              <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
                {categories.map(c => (
                  <button
                    key={c}
                    onClick={() => setFilter(c)}
                    className={`px-4 py-2 rounded-2xl text-sm whitespace-nowrap transition ${filter === c ? 'bg-green text-white' : 'bg-white border border-black/10 hover:border-green/30'}`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredVendors.map(v => (
                  <motion.button
                    key={v.id}
                    whileHover={{ y: -2 }}
                    onClick={() => setSelectedVendor(v)}
                    className="card text-left p-0"
                  >
                    <div className="h-40 bg-gradient-to-br from-green/10 to-yellow/20 flex items-end p-5">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{v.name}</h3>
                          {v.verified && <span className="text-xs bg-green text-white px-2 py-0.5 rounded-full">100% Lokal</span>}
                        </div>
                        <p className="text-sm text-ink/60 mt-1">{v.type} · {v.distance}</p>
                        {v.promo && <p className="text-xs text-red mt-1 font-medium">{v.promo}</p>}
                      </div>
                    </div>
                    <div className="p-5">
                      <div className="flex flex-wrap gap-2">
                        {v.products.slice(0, 3).map(p => (
                          <span key={p.name} className="text-xs bg-cream px-2 py-1 rounded-full">{p.name}</span>
                        ))}
                      </div>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {selectedVendor && (
            <motion.div key="detail" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
              <button onClick={() => setSelectedVendor(null)} className="mb-6 text-sm text-ink/60 hover:text-ink">← Retour</button>
              <div className="card p-8">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <h2 className="text-3xl font-bold">{selectedVendor.name}</h2>
                    <p className="text-ink/70 mt-1">{selectedVendor.type} · {selectedVendor.distance}</p>
                    {selectedVendor.verified && <span className="inline-block mt-2 text-xs bg-green text-white px-3 py-1 rounded-full">100% Lokal · Vérifié</span>}
                    {selectedVendor.promo && <p className="mt-2 text-sm text-red font-medium">{selectedVendor.promo}</p>}
                  </div>
                </div>

                <h3 className="font-semibold mb-4">Produits disponibles</h3>
                <div className="space-y-3 mb-8">
                  {selectedVendor.products.map(p => (
                    <div key={p.name} className="flex items-center justify-between py-3 border-b border-black/5 last:border-0">
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-sm text-ink/60">{p.stock}</p>
                      </div>
                      <p className="font-medium">{p.price}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setReserved(true)}
                  className="btn-primary w-full"
                >
                  Réserver pour retrait
                </button>
                {reserved && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 text-center text-sm text-green">
                    Réservation enregistrée. Présentez-vous au point de vente.
                  </motion.p>
                )}
              </div>
            </motion.div>
          )}

          {view === 'map' && (
            <motion.div key="map" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[70vh] rounded-3xl overflow-hidden border border-black/5">
              <MapContainer center={[16.25, -61.53]} zoom={10} style={{ height: '100%', width: '100%' }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                {vendors.map(v => (
                  <Marker key={v.id} position={[v.lat, v.lng]}>
                    <Popup>
                      <div className="font-sans">
                        <strong>{v.name}</strong><br />
                        {v.type} · {v.distance}<br />
                        <button onClick={() => { setSelectedVendor(v); setView('home') }} className="mt-2 text-green text-sm underline">Voir</button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            </motion.div>
          )}

          {view === 'help' && (
            <motion.div key="help" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-2">Entraide</h2>
              <p className="text-ink/70 mb-8">Surplus, besoins, covoiturage vers les marchés.</p>
              <div className="space-y-4">
                <div className="card p-6">
                  <p className="font-medium">Surplus de bananes — Sainte-Anne</p>
                  <p className="text-sm text-ink/60 mt-1">Disponible aujourd’hui, contact direct</p>
                </div>
                <div className="card p-6">
                  <p className="font-medium">Besoin de légumes — Les Abymes</p>
                  <p className="text-sm text-ink/60 mt-1">Recherche producteur proche</p>
                </div>
                <div className="card p-6">
                  <p className="font-medium">Covoiturage marché Petit-Bourg</p>
                  <p className="text-sm text-ink/60 mt-1">Départ 7h, 2 places</p>
                </div>
              </div>
              <button className="btn-accent mt-8">Publier une annonce</button>
            </motion.div>
          )}

          {view === 'merchant' && (
            <motion.div key="merchant" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl">
              <h2 className="text-3xl font-bold mb-2">Espace commerçants</h2>
              <p className="text-ink/70 mb-6">Inscrivez votre commerce local. Abonnement mensuel géré par l’équipe.</p>
              <div className="card p-8">
                <div className="mb-6 p-4 bg-red/10 rounded-2xl border border-red/20">
                  <p className="font-medium text-red">Promo grève actuelle</p>
                  <p className="text-sm mt-1">Abonnement offert pour les commerces guadeloupéens validés. Contactez-nous pour vérification.</p>
                </div>
                <form className="space-y-4" onSubmit={e => { e.preventDefault(); alert('Demande envoyée. Validation manuelle en cours.') }}>
                  <input placeholder="Nom du commerce" className="w-full h-12 px-4 rounded-2xl border border-black/10" required />
                  <input placeholder="Type (marché, ferme, épicerie...)" className="w-full h-12 px-4 rounded-2xl border border-black/10" required />
                  <input placeholder="Contact (téléphone ou email)" className="w-full h-12 px-4 rounded-2xl border border-black/10" required />
                  <textarea placeholder="Produits principaux" className="w-full p-4 rounded-2xl border border-black/10 h-24" />
                  <button type="submit" className="btn-primary w-full">Demander l’inscription</button>
                </form>
                <p className="text-xs text-ink/50 mt-4">Prix et promos gérés manuellement. Validation des commerces locaux guadeloupéens requise.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="border-t border-black/5 mt-16 py-8 text-center text-sm text-ink/50">
        Lokali · Circuit court Guadeloupe · 2026
      </footer>
    </div>
  )
}