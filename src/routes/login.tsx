import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState } from "react"
import { Shell, buttonClass, ghostClass, inputClass } from "@/components/shell"
import { authClient, GROK_PROVIDERS, signIn } from "@/lib/auth/client"
import { saveProfile } from "@/lib/lokali.functions"

export const Route = createFileRoute("/login")({ component: Login })

function Login() {
  const navigate = useNavigate()
  const [mode, setMode] = useState<"in" | "up">("up")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [kind, setKind] = useState<"particulier" | "pro">("particulier")
  const [businessName, setBusinessName] = useState("")
  const [address, setAddress] = useState("")
  const [error, setError] = useState("")

  return (
    <Shell>
      <div className="mx-auto max-w-md rounded-3xl border border-line bg-paper p-6">
        <h1 className="text-2xl font-semibold">{mode === "up" ? "Créer un compte" : "Connexion"}</h1>
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
                <button type="button" className={kind === "particulier" ? buttonClass : ghostClass} onClick={() => setKind("particulier")}>Particulier</button>
                <button type="button" className={kind === "pro" ? buttonClass : ghostClass} onClick={() => setKind("pro")}>Pro</button>
              </div>
              {kind === "pro" ? (
                <>
                  <input className={inputClass} placeholder="Nom du commerce" value={businessName} onChange={(event) => setBusinessName(event.target.value)} required />
                  <input className={inputClass} placeholder="Adresse" value={address} onChange={(event) => setAddress(event.target.value)} required />
                </>
              ) : null}
            </>
          ) : null}
          <button className={buttonClass} type="submit">{mode === "up" ? "Créer le compte" : "Entrer"}</button>
          {error ? <p className="text-sm text-red">{error}</p> : null}
        </form>
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
