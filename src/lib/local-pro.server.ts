import { hashPassword } from "@better-auth/utils/password"
import type { Sql } from "@/lib/db"

const ID = "lokali-local-pro"
const EMAIL = "pro.test@lokali.local"
const PASSWORD = "Lokali-Test-971"

export async function seedLocalPro(sql: Sql) {
  if (!import.meta.env.DEV) return
  const existing = await sql<{ id: string }>`select id from "user" where id = ${ID} limit 1`
  if (existing.length > 0) return
  const password = await hashPassword(PASSWORD)
  const now = new Date().toISOString()
  await sql`
    insert into "user" (id, name, email, "emailVerified", "createdAt", "updatedAt")
    values (${ID}, ${"Commerce test"}, ${EMAIL}, true, ${now}, ${now})
  `
  await sql`
    insert into "account" (id, "accountId", "providerId", "userId", password, "createdAt", "updatedAt")
    values (${ID + "-pw"}, ${ID}, ${"credential"}, ${ID}, ${password}, ${now}, ${now})
  `
  await sql`
    insert into profiles (
      user_id, display_name, account_kind, is_admin, business_name, siret, legal_form,
      activity, manager_name, description, address, commune
    ) values (
      ${ID}, ${"Commerce test"}, ${"pro"}, false, ${"Commerce test Lokali"},
      ${"10000000000008"}, ${"SASU"}, ${"Démonstration"}, ${"Compte local"},
      ${"Fiche de test, visible seulement sur cette prévisualisation. Ce commerce n'existe pas."},
      ${"Adresse fictive, non géolocalisée"}, ${"Test"}
    )
  `
  await sql`
    insert into products (user_id, name, detail, price_label, unit)
    values (${ID}, ${"Produit de démonstration"}, ${"Exemple, pas une vraie offre"}, ${"—"}, ${"test"})
  `
}
