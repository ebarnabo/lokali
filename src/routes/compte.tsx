import { createFileRoute, Link } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Field, Shell, buttonClass, ghostClass, inputClass } from "@/components/shell"
import { RedirectToSignIn } from "@/lib/auth/gates"
import { useCurrentUserState } from "@/lib/auth/use-current-user"
import {
  addProduct,
  deleteProduct,
  getMe,
  saveProfile,
  setProductAvailable,
  type Me,
} from "@/lib/lokali.functions"

export const Route = createFileRoute("/compte")({ component: Compte })

function Compte() {
  const { user, isPending } = useCurrentUserState()
  const [me, setMe] = useState<Me | null>(null)
  const [message, setMessage] = useState("")
  const [product, setProduct] = useState({ name: "", detail: "", priceLabel: "", unit: "" })

  useEffect(() => {
    if (!user) return
    getMe().then(setMe).catch((error: Error) => setMessage(error.message))
  }, [user])

  if (isPending) return <Shell><p className="text-muted">Chargement…</p></Shell>
  if (!user) return <RedirectToSignIn />
  if (!me) return <Shell><p className="text-muted">{message || "Chargement du profil…"}</p></Shell>

  return (
    <Shell>
      <h1 className="text-3xl font-semibold tracking-tight">Compte</h1>
      <p className="mt-2 text-sm text-muted">
        {me.loginEmail} · {me.accountKind === "pro" ? "Pro" : "Particulier"}
        {me.isAdmin ? " · Admin" : ""}
      </p>
      <form
        className="mt-6 grid gap-4 rounded-3xl border border-line bg-paper p-6 md:grid-cols-2"
        onSubmit={(event) => {
          event.preventDefault()
          setMessage("")
          saveProfile({
            data: {
              displayName: me.displayName,
              accountKind: me.accountKind,
              businessName: me.businessName,
              description: me.description,
              address: me.address,
              commune: me.commune,
              lat: me.lat,
              lng: me.lng,
              publicPhone: me.publicPhone,
              publicEmail: me.publicEmail,
              showPhone: me.showPhone,
              showEmail: me.showEmail,
            },
          })
            .then((next) => {
              setMe(next)
              setMessage("Profil enregistré.")
            })
            .catch((error: Error) => setMessage(error.message || "Enregistrement impossible"))
        }}
      >
        <Field label="Nom affiché">
          <input className={inputClass} value={me.displayName} onChange={(event) => setMe({ ...me, displayName: event.target.value })} required />
        </Field>
        <Field label="Type de compte">
          <select
            className={inputClass}
            value={me.accountKind}
            onChange={(event) => setMe({ ...me, accountKind: event.target.value as Me["accountKind"] })}
          >
            <option value="particulier">Particulier</option>
            <option value="pro">Pro — je vends</option>
          </select>
        </Field>
        {me.accountKind === "pro" ? (
          <>
            <Field label="Nom du commerce">
              <input className={inputClass} value={me.businessName} onChange={(event) => setMe({ ...me, businessName: event.target.value })} required />
            </Field>
            <Field label="Commune">
              <input className={inputClass} value={me.commune} onChange={(event) => setMe({ ...me, commune: event.target.value })} />
            </Field>
            <div className="md:col-span-2">
              <Field label="Adresse">
                <input className={inputClass} value={me.address} onChange={(event) => setMe({ ...me, address: event.target.value })} required />
              </Field>
            </div>
            <div className="md:col-span-2">
              <Field label="Présentation">
                <textarea className={`${inputClass} h-28 py-3`} value={me.description} onChange={(event) => setMe({ ...me, description: event.target.value })} />
              </Field>
            </div>
            <Field label="Latitude (optionnelle)">
              <input className={inputClass} inputMode="decimal" value={me.lat ?? ""} onChange={(event) => setMe({ ...me, lat: event.target.value === "" ? null : Number(event.target.value) })} placeholder="16.24" />
            </Field>
            <Field label="Longitude (optionnelle)">
              <input className={inputClass} inputMode="decimal" value={me.lng ?? ""} onChange={(event) => setMe({ ...me, lng: event.target.value === "" ? null : Number(event.target.value) })} placeholder="-61.53" />
            </Field>
            <p className="md:col-span-2 text-sm text-muted">
              Sans latitude ni longitude, l'adresse est cherchée automatiquement en Guadeloupe. Le téléphone et l'email de connexion restent privés : seuls les contacts cochés sont publics.
            </p>
            <Field label="Téléphone public">
              <input className={inputClass} value={me.publicPhone} onChange={(event) => setMe({ ...me, publicPhone: event.target.value })} />
            </Field>
            <Field label="Email public">
              <input className={inputClass} value={me.publicEmail} onChange={(event) => setMe({ ...me, publicEmail: event.target.value })} />
            </Field>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={me.showPhone} onChange={(event) => setMe({ ...me, showPhone: event.target.checked })} />
              Afficher le téléphone
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input type="checkbox" checked={me.showEmail} onChange={(event) => setMe({ ...me, showEmail: event.target.checked })} />
              Afficher l'email public
            </label>
          </>
        ) : (
          <p className="md:col-span-2 text-sm text-muted">
            Le compte particulier peut écrire dans l'entraide. Passez en pro pour publier des produits.
          </p>
        )}
        <div className="md:col-span-2 flex items-center gap-4">
          <button className={buttonClass} type="submit">Enregistrer</button>
          {message ? <p className="text-sm">{message}</p> : null}
        </div>
      </form>

      {me.accountKind === "pro" ? (
        <section className="mt-8">
          <h2 className="text-xl font-semibold">Ce que vous vendez</h2>
          <form
            className="mt-4 grid gap-3 rounded-3xl border border-line bg-paper p-6 md:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault()
              addProduct({ data: product })
                .then((next) => {
                  setMe(next)
                  setProduct({ name: "", detail: "", priceLabel: "", unit: "" })
                })
                .catch((error: Error) => setMessage(error.message))
            }}
          >
            <input className={inputClass} placeholder="Produit" value={product.name} onChange={(event) => setProduct({ ...product, name: event.target.value })} required />
            <input className={inputClass} placeholder="Détail" value={product.detail} onChange={(event) => setProduct({ ...product, detail: event.target.value })} />
            <input className={inputClass} placeholder="Prix" value={product.priceLabel} onChange={(event) => setProduct({ ...product, priceLabel: event.target.value })} />
            <input className={inputClass} placeholder="Unité" value={product.unit} onChange={(event) => setProduct({ ...product, unit: event.target.value })} />
            <button className={buttonClass} type="submit">Ajouter</button>
          </form>
          <ul className="mt-4 space-y-3">
            {me.products.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-line bg-paper px-5 py-4">
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted">
                    {[item.detail, item.priceLabel, item.unit].filter(Boolean).join(" · ")}
                    {item.hiddenByAdmin ? " · Masqué par la modération" : ""}
                    {!item.available ? " · Indisponible" : ""}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={ghostClass} onClick={() => setProductAvailable({ data: { id: item.id, available: !item.available } }).then(setMe)}>
                    {item.available ? "Rendre indisponible" : "Remettre en vente"}
                  </button>
                  <button type="button" className="text-sm text-red" onClick={() => deleteProduct({ data: item.id }).then(setMe)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-8 text-sm">
        <Link to="/entraide" className="text-green">Écrire une annonce d'entraide</Link>
      </p>
    </Shell>
  )
}
