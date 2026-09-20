export const FEISHU_PROFILE = process.env.SHIMODOCS_FEISHU_PROFILE || 'officesdk-shimodocs'
export const FEISHU_AUTH_COMMAND = `lark-cli --profile ${FEISHU_PROFILE} auth login --no-wait --json --domain base,docs`
export const BASE_TOKEN = process.env.SHIMODOCS_BASE_TOKEN || 'Qe12bYurnap9GcsI14KcCbPrnth'
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
