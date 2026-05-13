import { config } from 'dotenv'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

config({ path: resolve(dirname(fileURLToPath(import.meta.url)), '../../../.env') })
