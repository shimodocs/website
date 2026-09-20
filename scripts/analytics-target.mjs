import { existsSync, readFileSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

export const FEISHU_PROFILE = process.env.SHIMODOCS_FEISHU_PROFILE || 'officesdk-shimodocs'
export const FEISHU_IDENTITY = process.env.SHIMODOCS_FEISHU_IDENTITY || 'user'
if (!['user', 'bot'].includes(FEISHU_IDENTITY)) {
  throw new Error(`Invalid SHIMODOCS_FEISHU_IDENTITY: ${FEISHU_IDENTITY}; expected user or bot`)
}
export const FEISHU_AUTH_COMMAND = `lark-cli --profile ${FEISHU_PROFILE} auth login --no-wait --json --domain base,docs`
const BASE_TOKEN_FILE = process.env.SHIMODOCS_BASE_TOKEN_FILE || join(homedir(), '.config', 'shimodocs', 'base-token')
function readBaseToken() {
  const value = process.env.SHIMODOCS_BASE_TOKEN?.trim()
  if (value) return value
  if (existsSync(BASE_TOKEN_FILE)) {
    if ((statSync(BASE_TOKEN_FILE).mode & 0o077) !== 0) {
      throw new Error(`Refusing Feishu Base token file with broad permissions: ${BASE_TOKEN_FILE}; chmod 600`)
    }
    const fileValue = readFileSync(BASE_TOKEN_FILE, 'utf8').trim()
    if (fileValue) return fileValue
  }
  throw new Error(`Missing Feishu Base token; set SHIMODOCS_BASE_TOKEN or create ${BASE_TOKEN_FILE} with mode 600`)
}
export const BASE_TOKEN = readBaseToken()
export const SSH_PROXY = process.env.SHIMODOCS_SSH_PROXY || '127.0.0.1:7897'
export const LARK_PROXY_ADDRESS = process.env.LARKSUITE_CLI_PROXY_ADDRESS || 'http://127.0.0.1:7897'
export const larkEnv = Object.freeze({
  ...process.env,
  LARKSUITE_CLI_PROXY_ENABLE: 'true',
  LARKSUITE_CLI_PROXY_ADDRESS: LARK_PROXY_ADDRESS,
})

export const TABLES = Object.freeze({
  downloads: 'tbl8Dh5WngjVQXoq',
  indexing: 'tblEM6PK0sdNreGV',
  traffic: 'tbl9Qn2u5YuZUrAS',
  referrals: 'tblDgrAtGSE79YyC',
  crawlers: 'tblwNgkHvSJxn6qs',
  collectionStatus: 'tblEddgjy5u1QbpX',
  humanSources: 'tbl0ADn8jTDZJnvv',
  humanAudience: 'tblYZYGUmPngcszy',
  queryPage: 'tbluM5JhOhNfZ5lc',
})

export const larkArgs = args => ['--profile', FEISHU_PROFILE, ...args]
