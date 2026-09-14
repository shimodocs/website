# 下载量数据

由 [`.github/workflows/download-stats.yml`](../.github/workflows/download-stats.yml) 每天北京时间
09:00 自动生成并提交，请勿手工编辑。

数据源是 [shimodocs/shimodocs](https://github.com/shimodocs/shimodocs/releases) release asset 的
`download_count`。GitHub 只提供**累计值**，没有按天、按国家、按来源的拆分，所以"当日增量"是相邻两天
快照之差 —— 这也是为什么必须每天跑一次，漏一天就永久缺一天。

| 文件 | 用途 |
| --- | --- |
| `downloads-history.json` | 全量历史，唯一的事实来源 |
| `downloads-latest.json` | 最新一天的快照 + 当日异常，体量小到可以随站点发布 |
| `downloads-daily.csv` | 每天一行，丢进表格软件就能画趋势图 |
| `../reports/downloads/YYYY-MM.md` | 人读的月度日报 |

## 口径

- 按 **asset id** 追踪，不按文件名：同名安装包重新上传时 GitHub 把计数器归零，按文件名做差会报出
  一个巨大的负数并掩盖新包的真实下载。
- `mdp-installer-<arch>-<version>-global.zip` 按 `amd64` / `arm64` 归并成两列。
- GitHub 的计数包含站内检索、镜像站、爬虫和 CDN 预热，**不等于官网真实获客数**；官网来源要看
  Cloudflare / nginx 日志。
- 触发条件：单日增量超过 `SPIKE_THRESHOLD`（默认 200）、出现负增量、连续 3 天零增长，都会写进
  `downloads-latest.json` 的 `notes` 并让飞书卡片变成橙色。

## 本地使用

```bash
npm run stats:dry                                  # 只打印，不写文件
node scripts/download-stats.mjs                    # 生成今天的快照
node scripts/download-stats.mjs --dry-run --print-payload   # 看飞书卡片 JSON
LARK_WEBHOOK=... node scripts/download-stats.mjs --dry-run --notify   # 只发一张测试卡片
```

`data/downloads-daily.csv` 的第一天没有增量（基线），这是正常的。
