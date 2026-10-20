import { createFileRoute } from "@tanstack/react-router"
import { useEffect, useState } from "react"
import { Field, Shell, buttonClass, inputClass } from "@/components/shell"
import { RedirectToSignIn } from "@/lib/auth/gates"
import { useCurrentUserState } from "@/lib/auth/use-current-user"
import {
  adminHideProduct,
  adminListLegal,
  adminListPosts,
  adminListProducts,
  getCopy,
  getMe,
  moderatePost,
  saveCopy,
  saveLegal,
  type AdminPost,
  type AdminProduct,
} from "@/lib/lokali.functions"

export const Route = createFileRoute("/admin")({ component: Admin })

function Admin() {
  const { user, isPending } = useCurrentUserState()
  const [allowed, setAllowed] = useState<boolean | null>(null)
  const [posts, setPosts] = useState<AdminPost[]>([])
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [copy, setCopy] = useState({ hero_title: "", hero_text: "", entraide_intro: "" })
  const [pages, setPages] = useState<{ slug: "mentions-legales" | "confidentialite" | "cgu"; title: string; body: string }[]>([])
  const [message, setMessage] = useState("")

  function load() {
    adminListPosts().then(setPosts).catch((error: Error) => setMessage(error.message))
    adminListProducts().then(setProducts).catch(() => setProducts([]))
    adminListLegal().then(setPages).catch(() => setPages([]))
    getCopy().then(setCopy).catch(() => undefined)
  }

  useEffect(() => {
    if (!user) return
    getMe()
      .then((me) => {
        setAllowed(me.isAdmin)
        if (me.isAdmin) load()
      })
      .catch(() => setAllowed(false))
  }, [user])

  if (isPending || allowed === null) return <Shell><p className="text-muted">Chargement…</p></Shell>
  if (!user) return <RedirectToSignIn />
  if (!allowed) return <Shell><p>Cette partie est réservée à l'administration.</p></Shell>

  return (
    <Shell>
      <h1 className="text-4xl font-semibold tracking-tight">Administration</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Modération manuelle des annonces et des produits. Un agent pourra proposer un avis plus tard, sans jamais publier seul.
      </p>
      {message ? <p className="mt-3 text-sm text-red">{message}</p> : null}

      <section className="mt-8 space-y-3">
        <h2 className="text-xl font-semibold">Annonces</h2>
        {posts.length === 0 ? <p className="text-muted">Aucune annonce.</p> : null}
        {posts.map((post) => (
          <PostCard key={post.id} post={post} onDone={load} />
        ))}
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-xl font-semibold">Produits</h2>
        {products.length === 0 ? <p className="text-muted">Aucun produit.</p> : null}
        {products.map((product) => (
          <article key={product.id} className="card flex flex-wrap items-center justify-between gap-3 px-5 py-4">
            <div>
              <p className="font-medium">{product.name}</p>
              <p className="text-sm text-muted">{product.businessName}{product.hiddenByAdmin ? " · masqué" : ""}</p>
            </div>
            <button
              type="button"
              className={product.hiddenByAdmin ? buttonClass : "rounded-2xl bg-red px-5 text-sm text-paper"}
              onClick={() => adminHideProduct({ data: { id: product.id, hidden: !product.hiddenByAdmin } }).then(load)}
            >
              {product.hiddenByAdmin ? "Réafficher" : "Masquer"}
            </button>
          </article>
        ))}
      </section>

      <section className="mt-10">
        <h2 className="text-xl font-semibold">Textes des pages</h2>
        <form
          className="card mt-4 space-y-3 p-6"
          onSubmit={(event) => {
            event.preventDefault()
            saveCopy({ data: copy }).then(() => setMessage("Textes enregistrés.")).catch((error: Error) => setMessage(error.message))
          }}
        >
          <Field label="Titre d'accueil"><input className={inputClass} value={copy.hero_title} onChange={(event) => setCopy({ ...copy, hero_title: event.target.value })} /></Field>
          <Field label="Texte d'accueil"><textarea className={`${inputClass} h-24 py-3`} value={copy.hero_text} onChange={(event) => setCopy({ ...copy, hero_text: event.target.value })} /></Field>
          <Field label="Intro entraide"><textarea className={`${inputClass} h-24 py-3`} value={copy.entraide_intro} onChange={(event) => setCopy({ ...copy, entraide_intro: event.target.value })} /></Field>
          <button className={buttonClass} type="submit">Enregistrer les textes</button>
        </form>
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold">Pages légales</h2>
        {pages.map((page, index) => (
          <form
            key={page.slug}
            className="card space-y-3 p-6"
            onSubmit={(event) => {
              event.preventDefault()
              saveLegal({ data: page }).then(() => setMessage("Page légale enregistrée.")).catch((error: Error) => setMessage(error.message))
            }}
          >
            <Field label="Titre"><input className={inputClass} value={page.title} onChange={(event) => setPages(pages.map((item, i) => i === index ? { ...item, title: event.target.value } : item))} /></Field>
            <Field label={page.slug}><textarea className={`${inputClass} h-64 py-3`} value={page.body} onChange={(event) => setPages(pages.map((item, i) => i === index ? { ...item, body: event.target.value } : item))} /></Field>
            <button className={buttonClass} type="submit">Enregistrer</button>
          </form>
        ))}
      </section>
    </Shell>
  )
}

function PostCard({ post, onDone }: { post: AdminPost; onDone: () => void }) {
  const [note, setNote] = useState("")
  return (
    <article className="card p-5">
      <p className="text-sm text-muted">
        {statusLabel(post.status)} · {post.authorKind === "pro" ? "Pro" : "Particulier"} · {post.authorLabel} · {post.createdLabel}
      </p>
      <h3 className="mt-1 font-semibold">{post.title}</h3>
      <p className="mt-2 whitespace-pre-wrap">{post.body}</p>
      <input
        className={`${inputClass} mt-3`}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder="Motif, visible par l'auteur en cas de refus"
        maxLength={300}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button type="button" className={buttonClass} onClick={() => moderatePost({ data: { id: post.id, status: "approved", note: "" } }).then(onDone)}>Valider</button>
        <button
          type="button"
          className="rounded-2xl bg-red px-5 text-sm text-paper"
          onClick={() => moderatePost({ data: { id: post.id, status: "rejected", note: note.trim() || "Non conforme" } }).then(onDone)}
        >
          Refuser
        </button>
      </div>
    </article>
  )
}

function statusLabel(status: string) {
  if (status === "approved") return "Validée"
  if (status === "rejected") return "Refusée"
  return "En attente"
}
