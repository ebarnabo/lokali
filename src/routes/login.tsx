import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Shell, buttonClass, ghostClass, inputClass } from "@/components/shell"
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client"
import { getLocalTestHint, saveProfile } from "@/lib/lokali.functions"

export const Route = createFileRoute("/login")({ component: Login })

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"in" | "up">("up")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [kind, setKind] = useState<"particulier" | "pro">("particulier")
  const [businessName, setBusinessName] = useState("")
  const [siret, setSiret] = useState("")
  const [legalForm, setLegalForm] = useState("")
  const [activity, setActivity] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")
  const [testHint, setTestHint] = useState<{ email: string; password: string } | null>(null)

  useEffect(() => {
    getLocalTestHint()
      .then(setTestHint)
      .catch(() => setTestHint(null))
  }, [])

  return (
    <Shell>
      <div className="card mx-auto max-w-lg p-6 md:p-8">
        <p className="kicker">Compte</p>
        <h1 className="mt-2 text-3xl font-semibold">{mode === "up" ? "Créer un compte" : "Connexion"}</h1>
        <div className="mt-4 flex gap-2">
          <button type="button" className={mode === "up" ? buttonClass : ghostClass} onClick={() => setMode("up")}>Inscription</button>
          <button type="button" className={mode === "in" ? buttonClass : ghostClass} onClick={() => setMode("in")}>Connexion</button>
        </div>
        <form
          className="mt-6 space-y-3"
          onSubmit={async (event) => {
            event.preventDefault()
            setError("")
            if (password.length < 8) {
              setError("8 caractères minimum.")
              return
            }
            if (mode === "up") {
              const created = await authClient.signUp.email({ email, password, name: name || email })
              if (created.error) {
                setError(created.error.message || "Inscription impossible")
                return
              }
              try {
                await saveProfile({
                  data: {
                    displayName: name || email,
                    accountKind: kind,
                    businessName: kind === "pro" ? businessName : "",
                    siret: kind === "pro" ? siret : "",
                    legalForm: kind === "pro" ? legalForm : "",
                    activity: kind === "pro" ? activity : "",
                    managerName: "",
                    description: "",
                    address: kind === "pro" ? address : "",
                    commune: "",
                    lat: null,
                    lng: null,
                    publicPhone: "",
                    publicEmail: "",
                    showPhone: false,
                    showEmail: false,
                  },
                })
              } catch (err) {
                setError(err instanceof Error ? err.message : "Profil incomplet")
                return
              }
            } else {
              const signed = await authClient.signIn.email({ email, password })
              if (signed.error) {
                setError("Email ou mot de passe incorrect.")
                return
              }
            }
            await navigate({ to: kind === "pro" && mode === "up" ? "/compte" : "/" })
          }}
        >
          {mode === "up" ? <input className={inputClass} placeholder="Nom" value={name} onChange={(event) => setName(event.target.value)} required /> : null}
          <input className={inputClass} type="email" placeholder="Email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" />
          <input className={inputClass} type="password" placeholder="Mot de passe" value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete={mode === "up" ? "new-password" : "current-password"} />
          {mode === "up" ? (
            <>
              <div className="flex gap-2">
                <button type="button" className={`${kind === "particulier" ? buttonClass : ghostClass} flex-1`} onClick={() => setKind("particulier")}>Particulier</button>
                <button type="button" className={`${kind === "pro" ? buttonClass : ghostClass} flex-1`} onClick={() => setKind("pro")}>Pro</button>
              </div>
              {kind === "pro" ? (
                <>
                  <input className={inputClass} placeholder="Enseigne" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
                  <input
                    className={`${inputClass} font-mono`}
                    inputMode="numeric"
                    placeholder="SIRET (14 chiffres)"
                    value={siret}
                    onChange={(event) => setSiret(event.target.value.replace(/[^\d]/g, "").slice(0, 14))}
                    required
                  />
                  <select className={inputClass} value={legalForm} onChange={(event) => setLegalForm(event.target.value)} required>
                    <option value="">Forme juridique</option>
                    {["Entreprise individuelle", "Micro-entrepreneur", "SARL", "EURL", "SAS", "SASU", "SA", "Association", "Autre"].map((form) => (
                      <option key={form} value={form}>{form}</option>
                    ))}
                  </select>
                  <input className={inputClass} placeholder="Activité" value={activity} onChange={(event) => setActivity(event.target.value)} required />
                  <input className={inputClass} placeholder="Adresse du commerce" value={address} onChange={(event) => setAddress(event.target.value)} required />
                  <p className="text-xs leading-relaxed text-muted">
                    Le SIRET sera public. Le reste de la fiche, dont le responsable, se complète dans le compte.
                  </p>
                </>
              ) : null}
            </>
          ) : null}
          <button className={buttonClass} type="submit">{mode === "up" ? "Créer le compte" : "Entrer"}</button>
          {error ? <p className="text-sm text-red">{error}</p> : null}
        </form>
        {testHint ? (
          <div className="mt-6 rounded-2xl bg-cream p-4 text-sm">
            <p className="font-medium">Compte pro de test, seulement ici</p>
            <p className="mt-1 text-muted">Ce commerce n'existe pas et n'est pas créé sur le site public.</p>
            <p className="mt-2 font-mono text-xs">{testHint.email}</p>
            <p className="font-mono text-xs">{testHint.password}</p>
            <button
              type="button"
              className={`${ghostClass} mt-3`}
              onClick={() => {
                setMode("in")
                setEmail(testHint.email)
                setPassword(testHint.password)
              }}
            >
              Remplir la connexion
            </button>
          </div>
        ) : null}
        <div className="mt-6 space-y-2">
          {GROK_PROVIDERS.map((provider) => (
            <button key={provider.providerId} type="button" className={`${ghostClass} w-full`} onClick={() => signIn(provider.providerId, { callbackURL: "/" })}>
              Continuer avec {provider.label}
            </button>
          ))}
        </div>
      </div>
    </Shell>
  )
}
