import { copyFileSync, existsSync } from "node:fs"
import { join } from "node:path"

const targetDir = ".netlify/functions-internal/server/_libs"
const sourceDir = "node_modules/@electric-sql/pglite/dist"
if (!existsSync(targetDir)) process.exit(0)

for (const name of ["pglite.data", "pglite.wasm", "initdb.wasm"]) {
  copyFileSync(join(sourceDir, name), join(targetDir, name))
}
