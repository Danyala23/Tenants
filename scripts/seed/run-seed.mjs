import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

function parseArgs () {
  const args = process.argv.slice(2)
  let databaseUrl = process.env.DATABASE_URL
  let jsonPath = join(__dirname, 'tenants-data.json')
  let skipFunctionInstall = false

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]
    if (arg === '--database-url' || arg === '-DatabaseUrl') {
      databaseUrl = args[++i]
    } else if (arg === '--json' || arg === '-JsonPath') {
      jsonPath = args[++i]
    } else if (arg === '--skip-function-install' || arg === '-SkipFunctionInstall') {
      skipFunctionInstall = true
    }
  }

  return { databaseUrl, jsonPath, skipFunctionInstall }
}

const { databaseUrl, jsonPath, skipFunctionInstall } = parseArgs()

if (!databaseUrl) {
  console.error('Set DATABASE_URL or pass --database-url (Supabase Postgres connection string).')
  process.exit(1)
}

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: /supabase\.(co|com)|pooler\.supabase\.com/i.test(databaseUrl)
    ? { rejectUnauthorized: false }
    : undefined
})

try {
  await client.connect()

  if (!skipFunctionInstall) {
    console.log('Installing seed_tenants_from_json...')
    const sql = readFileSync(join(__dirname, 'seed-from-json.sql'), 'utf8')
    await client.query(sql)
  }

  console.log(`Loading ${jsonPath}...`)
  const json = readFileSync(jsonPath, 'utf8')
  const data = JSON.parse(json)

  console.log('Seeding database...')
  const result = await client.query(
    'SELECT * FROM seed_tenants_from_json($1::jsonb)',
    [JSON.stringify(data)]
  )

  console.table(result.rows)
  console.log('Done. Verify row counts in Supabase dashboard.')
} catch (err) {
  console.error(err.message ?? err)
  process.exit(1)
} finally {
  await client.end()
}
