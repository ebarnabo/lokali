import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Shell, buttonClass, inputClass } from "@/components/shell"
import { SignedIn, SignedOut } from "@/lib/auth/gates"
import { useCurrentUserState } from "@/lib/auth/use-current-user"
import { Link } from "@tanstack/react-router"
import {
  createPost,
  deleteMyPost,
  getCopy,
  listApprovedPosts,
  listMyPosts,
  type MinePost,
  type PublicPost,
} from "@/lib/lokali.functions"

export const Route = createFileRoute("/entraide")({ component: Entraide })

const kinds = [
  ["besoin", "Besoin"],
  ["surplus", "Surplus"],
  ["covoiturage", "Covoiturage"],
  ["autre", "Autre"],
] as const

function Entraide() {
  const { user } = useCurrentUserState()
  const [intro, setIntro] = useState("")
  const [posts, setPosts] = useState<PublicPost[] | null>(null)
  const [mine, setMine] = useState<MinePost[]>([])
  const [kind, setKind] = useState<(typeof kinds)[number][0]>("besoin")
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const [message, setMessage] = useState("")

  function reload() {
    listApprovedPosts().then(setPosts).catch(() => setPosts([]))
    if (user) listMyPosts().then(setMine).catch(() => setMine([]))
  }

  useEffect(() => {
    getCopy().then((copy) => setIntro(copy.entraide_intro)).catch(() => setIntro(""))
    listApprovedPosts().then(setPosts).catch(() => setPosts([]))
    if (!user) {
      setMine([])
      return
    }
    listMyPosts().then(setMine).catch(() => setMine([]))
  }, [user])

  return (
    <Shell>
      <p className="kicker">Entre habitants</p>
      <h1 className="mt-2 text-4xl font-semibold tracking-tight">Entraide</h1>
      <p className="mt-2 max-w-2xl text-muted">{intro}</p>
      <SignedOut>
        <p className="mt-6">
          <Link to="/login" className="font-medium text-green">
            Connectez-vous
          </Link>{" "}
          pour écrire une annonce. Pro et particuliers sont acceptés.
        </p>
      </SignedOut>
      <SignedIn>
        <form
          className="card mt-6 space-y-3 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            setMessage("")
            createPost({ data: { kind, title, body } })
              .then(() => {
                setTitle("")
                setBody("")
                setMessage("Annonce envoyée. Elle sera visible après validation.")
                reload()
              })
              .catch((error: Error) => setMessage(error.message || "Envoi impossible"))
          }}
        >
          <div className="flex flex-wrap gap-2">
            {kinds.map(([value, label]) => (
              <button
                key={value}
                type="button"
                onClick={() => setKind(value)}
                className={value === kind ? "rounded-2xl bg-green px-4 py-2 text-sm text-paper" : "rounded-2xl border border-line px-4 py-2 text-sm"}
              >
                {label}
              </button>
            ))}
          </div>
          <input className={inputClass} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Titre" required />
          <textarea className={`${inputClass} h-32 py-3`} value={body} onChange={(event) => setBody(event.target.value)} placeholder="Décrivez le besoin, le surplus ou le trajet. N'écrivez un contact que si vous acceptez qu'il soit public après validation." required />
          <button className={buttonClass} type="submit">Publier</button>
          {message ? <p className="text-sm">{message}</p> : null}
        </form>
        {mine.length > 0 ? (
          <section className="mt-8">
            <h2 className="mb-3 font-semibold">Vos annonces</h2>
            <div className="space-y-3">
              {mine.map((post) => (
                <article key={post.id} className="card p-5">
                  <p className="text-sm text-muted">{labelKind(post.kind)} · {statusLabel(post.status)} · {post.createdLabel}</p>
                  <h3 className="mt-1 font-semibold">{post.title}</h3>
                  <p className="mt-2 whitespace-pre-wrap leading-relaxed">{post.body}</p>
                  {post.moderationNote ? <p className="mt-2 text-sm text-red">{post.moderationNote}</p> : null}
                  <button
                    type="button"
                    className="mt-3 text-sm text-red"
                    onClick={() => deleteMyPost({ data: post.id }).then(reload)}
                  >
                    Supprimer
                  </button>
                </article>
              ))}
            </div>
          </section>
        ) : null}
      </SignedIn>
      <section className="mt-10 space-y-3">
        {posts === null ? <p className="text-muted">Chargement…</p> : null}
        {posts && posts.length === 0 ? <p className="text-muted">Aucune annonce validée.</p> : null}
        {posts?.map((post) => (
          <article key={post.id} className="card p-6">
            <p className="text-sm text-muted">{labelKind(post.kind)} · {post.authorLabel} · {post.createdLabel}</p>
            <h2 className="mt-1 text-xl font-semibold">{post.title}</h2>
            <p className="mt-2 whitespace-pre-wrap leading-relaxed">{post.body}</p>
          </article>
        ))}
      </section>
    </Shell>
  )
}

function labelKind(kind: string) {
  return kinds.find((item) => item[0] === kind)?.[1] ?? kind
}

function statusLabel(status: string) {
  if (status === "approved") return "Validée"
  if (status === "rejected") return "Refusée"
  return "En attente"
}
