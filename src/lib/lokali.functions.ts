import { createServerFn } from "@tanstack/react-start"
import { z } from "zod"
import { getSql } from "@/lib/db"
import { authMiddleware } from "@/lib/auth/middleware"

const COPY_KEYS = ["hero_title", "hero_text", "entraide_intro"] as const
const LEGAL_SLUGS = ["mentions-legales", "confidentialite", "cgu"] as const
const POST_KINDS = ["besoin", "surplus", "covoiturage", "autre"] as const

type CopyKey = (typeof COPY_KEYS)[number]
type LegalSlug = (typeof LEGAL_SLUGS)[number]
type PostKind = (typeof POST_KINDS)[number]
type AccountKind = "particulier" | "pro"
type PostStatus = "pending" | "approved" | "rejected"

export type PublicProduct = {
  id: number
  name: string
  detail: string
  priceLabel: string
  unit: string
}

export type PublicBusiness = {
  businessName: string
  siret: string
  legalForm: string
  activity: string
  description: string
  address: string
  commune: string
  lat: number | null
  lng: number | null
  phone: string
  email: string
  products: PublicProduct[]
  createdOn: string
}

export type PublicPost = {
  id: number
  kind: PostKind
  title: string
  body: string
  createdLabel: string
  authorLabel: string
}

export type MinePost = PublicPost & {
  status: PostStatus
  moderationNote: string
}

export type MyProduct = PublicProduct & {
  available: boolean
  hiddenByAdmin: boolean
}

export type Me = {
  displayName: string
  loginEmail: string
  accountKind: AccountKind
  isAdmin: boolean
  businessName: string
  siret: string
  legalForm: string
  activity: string
  managerName: string
  description: string
  address: string
  commune: string
  lat: number | null
  lng: number | null
  publicPhone: string
  publicEmail: string
  showPhone: boolean
  showEmail: boolean
  products: MyProduct[]
}

export type AdminPost = PublicPost & {
  status: PostStatus
  moderationNote: string
  authorKind: AccountKind
}

function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const result = schema.safeParse(data)
  if (!result.success) {
    const message = result.error.issues[0]?.message
    throw new Error(message && !message.startsWith("Invalid") ? message : "Données invalides")
  }
  return result.data
}

function text(max: number, required = false) {
  return z
    .string()
    .transform((value) => value.replace(/[\u0000-\u001F]/g, " ").replace(/[<>]/g, "").trim())
    .refine((value) => value.length <= max, "Texte trop long")
    .refine((value) => !required || value.length > 0, "Champ requis")
}

function luhn(digits: string) {
  let sum = 0
  for (let i = 0; i < digits.length; i += 1) {
    let n = Number(digits[digits.length - 1 - i])
    if (i % 2 === 1) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
  }
  return sum % 10 === 0
}

const siretSchema = z
  .string()
  .transform((value) => value.replace(/[^\d]/g, ""))
  .refine(
    (value) => value === "" || (value.length === 14 && luhn(value) && !/^(\d)\1{13}$/.test(value)),
    "SIRET invalide : 14 chiffres",
  )

const latSchema = z
  .number()
  .nullable()
  .refine((value) => value === null || (value >= 15.8 && value <= 16.55), "Latitude hors Guadeloupe")
const lngSchema = z
  .number()
  .nullable()
  .refine((value) => value === null || (value >= -61.85 && value <= -60.95), "Longitude hors Guadeloupe")

function pairCoords(lat: number | null, lng: number | null) {
  if ((lat === null) !== (lng === null)) throw new Error("Latitude et longitude vont ensemble")
}

async function geocodeGuadeloupe(address: string, commune: string) {
  const q = [address, commune, "Guadeloupe"].filter(Boolean).join(", ")
  const url = new URL("https://nominatim.openstreetmap.org/search")
  url.searchParams.set("format", "jsonv2")
  url.searchParams.set("limit", "1")
  url.searchParams.set("q", q)
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 4000)
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { Accept: "application/json", "User-Agent": "Lokali/1.0 (commerces, Guadeloupe)" },
    })
    if (!response.ok) return null
    const rows = (await response.json()) as { lat?: string; lon?: string }[]
    const lat = Number(rows[0]?.lat)
    const lng = Number(rows[0]?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    if (lat < 15.8 || lat > 16.55 || lng < -61.85 || lng > -60.95) return null
    return { lat, lng }
  } catch {
    return null
  } finally {
    clearTimeout(timer)
  }
}

function asProducts(value: unknown): PublicProduct[] {
  const raw = typeof value === "string" ? safeJson(value) : value
  if (!Array.isArray(raw)) return []
  return raw.flatMap((item) => {
    if (!item || typeof item !== "object") return []
    const row = item as Record<string, unknown>
    const id = Number(row.id)
    if (!Number.isFinite(id)) return []
    return [
      {
        id,
        name: String(row.name ?? ""),
        detail: String(row.detail ?? ""),
        priceLabel: String(row.priceLabel ?? ""),
        unit: String(row.unit ?? ""),
      },
    ]
  })
}

function safeJson(value: string): unknown {
  try {
    return JSON.parse(value)
  } catch {
    return []
  }
}

function numOrNull(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null
  const n = typeof value === "number" ? value : Number(value)
  return Number.isFinite(n) ? n : null
}

async function ensureProfile(userId: string) {
  const sql = await getSql()
  const users = await sql<{ name: string }>`select name from "user" where id = ${userId} limit 1`
  const name = (users[0]?.name ?? "").slice(0, 80)
  await sql`
    insert into profiles (user_id, display_name, account_kind, is_admin)
    values (${userId}, ${name}, 'particulier', false)
    on conflict (user_id) do nothing
  `
  const mine = await sql<{ is_admin: boolean }>`
    select is_admin from profiles where user_id = ${userId} limit 1
  `
  if (mine[0]?.is_admin === true) return
  if (userId === "lokali-local-pro") return
  const others = await sql<{ n: number }>`
    select count(*)::int as n from profiles where is_admin
  `
  if ((others[0]?.n ?? 0) > 0) return
  try {
    await sql`update profiles set is_admin = true where user_id = ${userId}`
  } catch (error) {
    const message = error instanceof Error ? error.message : ""
    if (!/unique|duplicate/i.test(message)) throw error
  }
}

async function loadMe(userId: string): Promise<Me> {
  await ensureProfile(userId)
  const sql = await getSql()
  const rows = await sql<{
    display_name: string
    login_email: string
    account_kind: AccountKind
    is_admin: boolean
    business_name: string
    siret: string
    legal_form: string
    activity: string
    manager_name: string
    description: string
    address: string
    commune: string
    lat: number | null
    lng: number | null
    public_phone: string
    public_email: string
    show_phone: boolean
    show_email: boolean
  }>`
    select p.display_name, u.email as login_email, p.account_kind, p.is_admin,
           p.business_name, p.siret, p.legal_form, p.activity, p.manager_name,
           p.description, p.address, p.commune, p.lat, p.lng,
           p.public_phone, p.public_email, p.show_phone, p.show_email
    from profiles p
    join "user" u on u.id = p.user_id
    where p.user_id = ${userId}
    limit 1
  `
  const row = rows[0]
  if (!row) throw new Error("Profil introuvable")
  const products = await sql<{
    id: number
    name: string
    detail: string
    price_label: string
    unit: string
    available: boolean
    hidden_by_admin: boolean
  }>`
    select id, name, detail, price_label, unit, available, hidden_by_admin
    from products where user_id = ${userId} order by name
  `
  return {
    displayName: row.display_name,
    loginEmail: row.login_email,
    accountKind: row.account_kind,
    isAdmin: row.is_admin,
    businessName: row.business_name,
    siret: row.siret,
    legalForm: row.legal_form,
    activity: row.activity,
    managerName: row.manager_name,
    description: row.description,
    address: row.address,
    commune: row.commune,
    lat: numOrNull(row.lat),
    lng: numOrNull(row.lng),
    publicPhone: row.public_phone,
    publicEmail: row.public_email,
    showPhone: row.show_phone,
    showEmail: row.show_email,
    products: products.map((item) => ({
      id: item.id,
      name: item.name,
      detail: item.detail,
      priceLabel: item.price_label,
      unit: item.unit,
      available: item.available,
      hiddenByAdmin: item.hidden_by_admin,
    })),
  }
}

async function requireAdmin(userId: string) {
  const me = await loadMe(userId)
  if (!me.isAdmin) throw new Error("Réservé à l'administration")
  return me
}

const profileInput = z.object({
  displayName: text(80, true),
  accountKind: z.enum(["particulier", "pro"]),
  businessName: text(120),
  siret: siretSchema,
  legalForm: text(40),
  activity: text(80),
  managerName: text(80),
  description: text(600),
  address: text(240),
  commune: text(80),
  lat: latSchema,
  lng: lngSchema,
  publicPhone: text(24).refine((value) => value === "" || /^[0-9+().\s-]{6,24}$/.test(value), "Téléphone invalide"),
  publicEmail: text(120).refine(
    (value) => value === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value),
    "Email public invalide",
  ),
  showPhone: z.boolean(),
  showEmail: z.boolean(),
})

export const getCopy = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql()
  const rows = await sql<{ key: string; value: string }>`select key, value from site_copy`
  const copy: Record<CopyKey, string> = {
    hero_title: "Le local, près de chez vous.",
    hero_text: "Les commerces pro publient eux-mêmes ce qu'ils proposent. Rien n'est inventé.",
    entraide_intro: "Annonces écrites par les habitants. Elles apparaissent après validation.",
  }
  for (const row of rows) {
    if ((COPY_KEYS as readonly string[]).includes(row.key)) copy[row.key as CopyKey] = row.value
  }
  return copy
})

export const listBusinesses = createServerFn({ method: "GET" })
  .validator((query: string) => parse(text(80), query ?? ""))
  .handler(async ({ data: query }) => {
    const sql = await getSql()
    const like = `%${query.replace(/[\\%_]/g, "\\$&")}%`
    const rows = await sql<{
      business_name: string
      siret: string
      legal_form: string
      activity: string
      description: string
      address: string
      commune: string
      lat: number | null
      lng: number | null
      phone: string
      email: string
      products: unknown
      created_on: string
    }>`
      select p.business_name, p.siret, p.legal_form, p.activity, p.description, p.address, p.commune, p.lat, p.lng,
             to_char(p.created_at, 'YYYY-MM-DD') as created_on,
             case when p.show_phone then p.public_phone else '' end as phone,
             case when p.show_email then p.public_email else '' end as email,
             coalesce((
               select json_agg(json_build_object(
                 'id', pr.id, 'name', pr.name, 'detail', pr.detail,
                 'priceLabel', pr.price_label, 'unit', pr.unit
               ) order by pr.name)
               from products pr
               where pr.user_id = p.user_id and pr.available and not pr.hidden_by_admin
             ), '[]'::json) as products
      from profiles p
      where p.account_kind = 'pro'
        and p.business_name <> ''
        and p.siret <> ''
        and (
          ${query} = ''
          or p.business_name ilike ${like} escape '\\'
          or p.commune ilike ${like} escape '\\'
          or p.activity ilike ${like} escape '\\'
          or p.siret ilike ${like} escape '\\'
          or exists (
            select 1 from products pr
            where pr.user_id = p.user_id and pr.available and not pr.hidden_by_admin
              and (pr.name ilike ${like} escape '\\' or pr.detail ilike ${like} escape '\\')
          )
        )
      order by p.business_name
      limit 80
    `
    const businesses: PublicBusiness[] = rows.map((row) => ({
      businessName: row.business_name,
      siret: row.siret,
      legalForm: row.legal_form,
      activity: row.activity,
      description: row.description,
      address: row.address,
      commune: row.commune,
      lat: numOrNull(row.lat),
      lng: numOrNull(row.lng),
      phone: row.phone,
      email: row.email,
      products: asProducts(row.products),
      createdOn: row.created_on,
    }))
    return businesses
  })

export const suggestSearch = createServerFn({ method: "GET" })
  .validator((query: string) => parse(text(40), query ?? ""))
  .handler(async ({ data: query }) => {
    const sql = await getSql()
    const like = `%${query.replace(/[\\%_]/g, "\\$&")}%`
    if (!query) return { communes: [] as string[], topics: [] as string[] }
    const communes = await sql<{ label: string }>`
      select distinct commune as label from profiles
      where account_kind = 'pro' and siret <> '' and commune <> ''
        and commune ilike ${like} escape '\\'
      order by commune
      limit 6
    `
    const topics = await sql<{ label: string }>`
      select label from (
        select distinct activity as label from profiles
        where account_kind = 'pro' and siret <> '' and activity <> ''
          and activity ilike ${like} escape '\\'
        union
        select distinct pr.name as label from products pr
        join profiles p on p.user_id = pr.user_id
        where p.account_kind = 'pro' and p.siret <> '' and pr.available and not pr.hidden_by_admin
          and pr.name ilike ${like} escape '\\'
      ) hints
      order by label
      limit 6
    `
    return {
      communes: communes.map((row) => row.label),
      topics: topics.map((row) => row.label),
    }
  })

export const listApprovedPosts = createServerFn({ method: "GET" }).handler(async () => {
  const sql = await getSql()
  const rows = await sql<{
    id: number
    kind: PostKind
    title: string
    body: string
    created_label: string
    author_label: string
  }>`
    select p.id, p.kind, p.title, p.body,
           to_char(p.created_at, 'DD/MM/YYYY HH24:MI') as created_label,
           case when pr.account_kind = 'pro' and pr.business_name <> '' then pr.business_name else pr.display_name end as author_label
    from posts p
    join profiles pr on pr.user_id = p.user_id
    where p.status = 'approved'
    order by p.created_at desc
    limit 80
  `
  return rows.map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title,
    body: row.body,
    createdLabel: row.created_label,
    authorLabel: row.author_label || "Habitant",
  })) satisfies PublicPost[]
})

export const getLegal = createServerFn({ method: "GET" })
  .validator((slug: string) => {
    if (!(LEGAL_SLUGS as readonly string[]).includes(slug)) throw new Error("Page inconnue")
    return slug as LegalSlug
  })
  .handler(async ({ data: slug }) => {
    const sql = await getSql()
    const rows = await sql<{ title: string; body: string }>`
      select title, body from legal_pages where slug = ${slug} limit 1
    `
    const row = rows[0]
    if (!row) throw new Error("Page inconnue")
    return { slug, title: row.title, body: row.body }
  })

export const getMe = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => loadMe(context.userId))

export const saveProfile = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(profileInput, input))
  .handler(async ({ context, data }) => {
    pairCoords(data.lat, data.lng)
    if (data.accountKind === "pro" && (!data.businessName || !data.siret || !data.legalForm || !data.activity || !data.address)) {
      throw new Error("Un compte pro indique l'enseigne, le SIRET, la forme, l'activité et l'adresse")
    }
    let lat = data.lat
    let lng = data.lng
    if (data.accountKind === "pro" && lat === null && lng === null && data.address) {
      const found = await geocodeGuadeloupe(data.address, data.commune)
      if (found) {
        lat = found.lat
        lng = found.lng
      }
    }
    await ensureProfile(context.userId)
    const sql = await getSql()
    await sql`
      update profiles set
        display_name = ${data.displayName},
        account_kind = ${data.accountKind},
        business_name = ${data.businessName},
        siret = ${data.siret},
        legal_form = ${data.legalForm},
        activity = ${data.activity},
        manager_name = ${data.managerName},
        description = ${data.description},
        address = ${data.address},
        commune = ${data.commune},
        lat = ${lat},
        lng = ${lng},
        public_phone = ${data.publicPhone},
        public_email = ${data.publicEmail},
        show_phone = ${data.showPhone},
        show_email = ${data.showEmail},
        updated_at = now()
      where user_id = ${context.userId}
    `
    return loadMe(context.userId)
  })

const productInput = z.object({
  name: text(80, true),
  detail: text(280),
  priceLabel: text(40),
  unit: text(24),
})

export const addProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(productInput, input))
  .handler(async ({ context, data }) => {
    const me = await loadMe(context.userId)
    if (me.accountKind !== "pro") throw new Error("Réservé aux comptes pro")
    if (!me.businessName || !me.siret) throw new Error("Renseignez d'abord le commerce et son SIRET")
    if (me.products.length >= 40) throw new Error("Limite de 40 produits")
    const sql = await getSql()
    await sql`
      insert into products (user_id, name, detail, price_label, unit)
      values (${context.userId}, ${data.name}, ${data.detail}, ${data.priceLabel}, ${data.unit})
    `
    return loadMe(context.userId)
  })

export const setProductAvailable = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; available: boolean }) =>
    parse(z.object({ id: z.number().int().positive(), available: z.boolean() }), input),
  )
  .handler(async ({ context, data }) => {
    const sql = await getSql()
    await sql`
      update products set available = ${data.available}
      where id = ${data.id} and user_id = ${context.userId}
    `
    return loadMe(context.userId)
  })

export const deleteProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => parse(z.number().int().positive(), id))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql()
    await sql`delete from products where id = ${id} and user_id = ${context.userId}`
    return loadMe(context.userId)
  })

const postInput = z.object({
  kind: z.enum(POST_KINDS),
  title: text(120, true),
  body: text(2000, true),
})

export const createPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: unknown) => parse(postInput, input))
  .handler(async ({ context, data }) => {
    await ensureProfile(context.userId)
    const sql = await getSql()
    const recent = await sql<{ n: number }>`
      select count(*)::int as n from posts
      where user_id = ${context.userId} and created_at > now() - interval '1 hour'
    `
    if ((recent[0]?.n ?? 0) >= 5) throw new Error("Cinq annonces maximum par heure")
    await sql`
      insert into posts (user_id, kind, title, body, status)
      values (${context.userId}, ${data.kind}, ${data.title}, ${data.body}, 'pending')
    `
    return { ok: true as const }
  })

export const listMyPosts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await ensureProfile(context.userId)
    const sql = await getSql()
    const rows = await sql<{
      id: number
      kind: PostKind
      title: string
      body: string
      status: PostStatus
      moderation_note: string
      created_label: string
    }>`
      select id, kind, title, body, status, moderation_note,
             to_char(created_at, 'DD/MM/YYYY HH24:MI') as created_label
      from posts where user_id = ${context.userId}
      order by created_at desc limit 40
    `
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      status: row.status,
      moderationNote: row.moderation_note,
      createdLabel: row.created_label,
      authorLabel: "Vous",
    })) satisfies MinePost[]
  })

export const deleteMyPost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((id: number) => parse(z.number().int().positive(), id))
  .handler(async ({ context, data: id }) => {
    const sql = await getSql()
    await sql`delete from posts where id = ${id} and user_id = ${context.userId}`
    return { ok: true as const }
  })

export const adminListPosts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    const rows = await sql<{
      id: number
      kind: PostKind
      title: string
      body: string
      status: PostStatus
      moderation_note: string
      created_label: string
      author_label: string
      author_kind: AccountKind
    }>`
      select p.id, p.kind, p.title, p.body, p.status, p.moderation_note,
             to_char(p.created_at, 'DD/MM/YYYY HH24:MI') as created_label,
             case when pr.account_kind = 'pro' and pr.business_name <> '' then pr.business_name else pr.display_name end as author_label,
             pr.account_kind as author_kind
      from posts p
      join profiles pr on pr.user_id = p.user_id
      order by case when p.status = 'pending' then 0 else 1 end, p.created_at desc
      limit 100
    `
    return rows.map((row) => ({
      id: row.id,
      kind: row.kind,
      title: row.title,
      body: row.body,
      status: row.status,
      moderationNote: row.moderation_note,
      createdLabel: row.created_label,
      authorLabel: row.author_label || "Habitant",
      authorKind: row.author_kind,
    })) satisfies AdminPost[]
  })

export const moderatePost = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; status: PostStatus; note: string }) =>
    parse(
      z.object({
        id: z.number().int().positive(),
        status: z.enum(["approved", "rejected"]),
        note: text(300),
      }),
      input,
    ),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    await sql`
      update posts set status = ${data.status}, moderation_note = ${data.note}, updated_at = now()
      where id = ${data.id}
    `
    return { ok: true as const }
  })

export type AdminProduct = {
  id: number
  name: string
  businessName: string
  hiddenByAdmin: boolean
}

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    const rows = await sql<{
      id: number
      name: string
      business_name: string
      hidden_by_admin: boolean
    }>`
      select pr.id, pr.name, p.business_name, pr.hidden_by_admin
      from products pr
      join profiles p on p.user_id = pr.user_id
      order by pr.created_at desc
      limit 80
    `
    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      businessName: row.business_name,
      hiddenByAdmin: row.hidden_by_admin,
    })) satisfies AdminProduct[]
  })

export const adminHideProduct = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { id: number; hidden: boolean }) =>
    parse(z.object({ id: z.number().int().positive(), hidden: z.boolean() }), input),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    await sql`update products set hidden_by_admin = ${data.hidden} where id = ${data.id}`
    return { ok: true as const }
  })

export const saveCopy = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: Record<CopyKey, string>) =>
    parse(
      z.object({
        hero_title: text(120, true),
        hero_text: text(400, true),
        entraide_intro: text(400, true),
      }),
      input,
    ),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    for (const key of COPY_KEYS) {
      await sql`
        insert into site_copy (key, value) values (${key}, ${data[key]})
        on conflict (key) do update set value = excluded.value
      `
    }
    return data
  })

export const saveLegal = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((input: { slug: LegalSlug; title: string; body: string }) =>
    parse(
      z.object({
        slug: z.enum(LEGAL_SLUGS),
        title: text(120, true),
        body: text(20000, true),
      }),
      input,
    ),
  )
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    await sql`
      insert into legal_pages (slug, title, body) values (${data.slug}, ${data.title}, ${data.body})
      on conflict (slug) do update set title = excluded.title, body = excluded.body, updated_at = now()
    `
    return { ok: true as const }
  })

export const adminListLegal = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    return sql<{ slug: LegalSlug; title: string; body: string }>`
      select slug, title, body from legal_pages order by slug
    `
  })

const TEST_USER = "lokali-local-pro"

export type DayStat = { day: string; accounts: number; products: number; posts: number }

export type Stats = {
  from: string
  to: string
  newParticuliers: number
  newPros: number
  newProducts: number
  postsCreated: number
  postsApproved: number
  postsRejected: number
  postsPending: number
  prosWithProduct: number
  visibleBusinesses: number
  liveProducts: number
  communes: number
  withContact: number
  livePosts: number
  series: DayStat[]
}

const daySchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide")

export const getStats = createServerFn({ method: "GET" })
  .middleware([authMiddleware])
  .validator((input: { from: string; to: string }) => {
    const data = parse(z.object({ from: daySchema, to: daySchema }), input)
    const from = Date.parse(`${data.from}T00:00:00Z`)
    const to = Date.parse(`${data.to}T00:00:00Z`)
    if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) throw new Error("Période invalide")
    if ((to - from) / 86_400_000 > 366) throw new Error("Un an maximum")
    return data
  })
  .handler(async ({ context, data }) => {
    await requireAdmin(context.userId)
    const sql = await getSql()
    const from = data.from
    const to = data.to
    const rows = await sql<{
      new_particuliers: number
      new_pros: number
      new_products: number
      posts_created: number
      posts_approved: number
      posts_rejected: number
      posts_pending: number
      pros_with_product: number
      visible_businesses: number
      live_products: number
      communes: number
      with_contact: number
      live_posts: number
    }>`
      select
        (select count(*)::int from profiles
          where user_id <> ${TEST_USER} and account_kind = 'particulier'
            and created_at >= ${from}::date and created_at < ${to}::date + interval '1 day') as new_particuliers,
        (select count(*)::int from profiles
          where user_id <> ${TEST_USER} and account_kind = 'pro'
            and created_at >= ${from}::date and created_at < ${to}::date + interval '1 day') as new_pros,
        (select count(*)::int from products pr
          where pr.user_id <> ${TEST_USER}
            and pr.created_at >= ${from}::date and pr.created_at < ${to}::date + interval '1 day') as new_products,
        (select count(*)::int from posts
          where user_id <> ${TEST_USER}
            and created_at >= ${from}::date and created_at < ${to}::date + interval '1 day') as posts_created,
        (select count(*)::int from posts
          where user_id <> ${TEST_USER} and status = 'approved'
            and created_at >= ${from}::date and created_at < ${to}::date + interval '1 day') as posts_approved,
        (select count(*)::int from posts
          where user_id <> ${TEST_USER} and status = 'rejected'
            and created_at >= ${from}::date and created_at < ${to}::date + interval '1 day') as posts_rejected,
        (select count(*)::int from posts
          where user_id <> ${TEST_USER} and status = 'pending'
            and created_at >= ${from}::date and created_at < ${to}::date + interval '1 day') as posts_pending,
        (select count(*)::int from profiles p
          where p.user_id <> ${TEST_USER} and p.account_kind = 'pro'
            and p.created_at >= ${from}::date and p.created_at < ${to}::date + interval '1 day'
            and exists (select 1 from products pr where pr.user_id = p.user_id)) as pros_with_product,
        (select count(*)::int from profiles
          where user_id <> ${TEST_USER} and account_kind = 'pro' and business_name <> '' and siret <> '') as visible_businesses,
        (select count(*)::int from products pr
          join profiles p on p.user_id = pr.user_id
          where p.user_id <> ${TEST_USER} and p.account_kind = 'pro' and p.siret <> ''
            and pr.available and not pr.hidden_by_admin) as live_products,
        (select count(distinct commune)::int from profiles
          where user_id <> ${TEST_USER} and account_kind = 'pro' and siret <> '' and commune <> '') as communes,
        (select count(*)::int from profiles
          where user_id <> ${TEST_USER} and account_kind = 'pro' and siret <> ''
            and ((show_phone and public_phone <> '') or (show_email and public_email <> ''))) as with_contact,
        (select count(*)::int from posts
          where user_id <> ${TEST_USER} and status = 'approved') as live_posts
    `
    const series = await sql<{ day: string; accounts: number; products: number; posts: number }>`
      select to_char(day::date, 'YYYY-MM-DD') as day,
        (select count(*)::int from profiles
          where user_id <> ${TEST_USER} and created_at >= day and created_at < day + interval '1 day') as accounts,
        (select count(*)::int from products
          where user_id <> ${TEST_USER} and created_at >= day and created_at < day + interval '1 day') as products,
        (select count(*)::int from posts
          where user_id <> ${TEST_USER} and created_at >= day and created_at < day + interval '1 day') as posts
      from generate_series(${from}::date, ${to}::date, interval '1 day') as day
    `
    const row = rows[0]
    return {
      from,
      to,
      newParticuliers: row?.new_particuliers ?? 0,
      newPros: row?.new_pros ?? 0,
      newProducts: row?.new_products ?? 0,
      postsCreated: row?.posts_created ?? 0,
      postsApproved: row?.posts_approved ?? 0,
      postsRejected: row?.posts_rejected ?? 0,
      postsPending: row?.posts_pending ?? 0,
      prosWithProduct: row?.pros_with_product ?? 0,
      visibleBusinesses: row?.visible_businesses ?? 0,
      liveProducts: row?.live_products ?? 0,
      communes: row?.communes ?? 0,
      withContact: row?.with_contact ?? 0,
      livePosts: row?.live_posts ?? 0,
      series: series.map((item) => ({
        day: item.day,
        accounts: item.accounts,
        products: item.products,
        posts: item.posts,
      })),
    } satisfies Stats
  })

export const getLocalTestHint = createServerFn({ method: "GET" }).handler(async () => {
  if (!import.meta.env.DEV) return null
  return { email: "pro.test@lokali.local", password: "Lokali-Test-971" }
})

