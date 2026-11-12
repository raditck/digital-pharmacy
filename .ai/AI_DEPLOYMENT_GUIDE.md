# AI Deployment Guide — Tantua Deploy Bridge

Copy this file into any project's `.ai/` folder. It tells an AI how to deploy
this project, manage files, and run MySQL (incl. DDL) on the target hosting —
no SSH, no git on the server, plain HTTPS only.

---

## 1. Fill this in first (per project)

```
BRIDGE_URL   = https://deployment.tantua.com   # bridge host (don't change unless told)
SECRET       =                                 # bridge sync secret (ask owner; same for all projects)
PROJECT_ID   =                                 # short label, e.g. myproject (namespaces releases/backups)
DEPLOY_ROOT  =                                 # absolute path on hosting, e.g. /home/user/site.example.com
HEALTH_URL   =                                 # optional, checked after each deploy
DB_HOST      = localhost                       # DB_* optional — leave empty to skip DB features
DB_NAME      =
DB_USER      =
DB_PASS      =
SHARED       = vendor/,storage/,.htaccess      # comma-separated; survive every deploy swap
```

Never commit the SECRET. Prefer env var / local untracked file.

## 2. Discover capabilities (always start here)

```
curl $BRIDGE_URL/              # banner → points at /openapi.json + /API.md
curl $BRIDGE_URL/openapi.json  # full machine contract (OpenAPI 3.1, public, no token)
```

Feed `openapi.json` to your tooling or read it as the source of truth for
endpoints, payloads, and responses. `GET /API.md` is the same contract as a
human/AI-readable guide with curl examples and gotchas.

## 3. Auth — hourly rotating token

```
token = sha256("tantua_deploy_" + <UTC yyMMdd_HH> + "_" + SECRET)
```

- `yyMMdd_HH` = UTC 2-digit year, e.g. `260910_14`
- server accepts current + previous hour (rollover grace)
- send header: `X-Deploy-Token: <token>` (also: `Authorization: Bearer` or `?token=`)
- on 401 → recompute and retry once

bash:

```bash
TOKEN=$(printf 'tantua_deploy_%s_%s' "$(date -u +%y%m%d_%H)" "$SECRET" | sha256sum | cut -d' ' -f1)
```

PowerShell:

```powershell
$seed = 'tantua_deploy_' + [DateTime]::UtcNow.ToString('yyMMdd_HH') + '_' + $SECRET
$TOKEN = -join ([Security.Cryptography.SHA256]::Create().ComputeHash(
  [Text.Encoding]::UTF8.GetBytes($seed)) | ForEach-Object { $_.ToString('x2') })
```

## 4. Context — every request is stateless

The bridge stores nothing. Every call carries: `project_id`, `deployment_root`,
`db_host/db_name/db_user/db_pass`, `health_url`, `shared_paths[]` (repeatable),
`log_paths[]` (repeatable). GET/DELETE → query string; POST/PUT → JSON body or
multipart form fields.

All file paths are **relative to `deployment_root`** (no leading `/`, no `..`).

## 5. Response envelope (every JSON endpoint)

```json
{ "ok": true, "data": { ... }, "error": null, "request_id": "..." }
```

On failure: `ok:false`, `error: {code, message}` — codes like `UNAUTHORIZED`,
`BAD_PATH`, `BAD_QUERY`, `DB_ERROR`, `ROLLBACK_FAILED`... Always check `ok`.
Full table: `/API.md` on the bridge.

## 6. Common tasks (curl, $B = $BRIDGE_URL/api/v1, -H "X-Deploy-Token: $TOKEN")

### Status & health

```bash
curl "$B/status?deployment_root=$DEPLOY_ROOT&project_id=$PROJECT_ID"
curl "$B/server-info?deployment_root=$DEPLOY_ROOT"     # php/disk/limits
```

### Deploy a release (full-site zip, multipart)

The zip must contain the **complete site** — deploy swaps the entire root
(minus `shared_paths[]`). Old files are backed up automatically; last 5
releases kept.

```bash
zip -r deploy.zip . -x "*.git*" "node_modules*" ".env*"
curl "$B/deployments" -F "artifact=@deploy.zip" \
  -F "deployment_root=$DEPLOY_ROOT" -F "project_id=$PROJECT_ID" \
  -F "health_url=$HEALTH_URL" \
  -F "shared_paths[]=vendor/" -F "shared_paths[]=storage/"
# 201 → data.deployment.status == "completed", release id, backup_id, health
```

Check if a deploy is needed first (diff, no upload):

```bash
curl "$B/files/manifest?deployment_root=$DEPLOY_ROOT"          # server manifest
curl -X POST "$B/files/manifest-diff" -H "Content-Type: application/json" \
  -d '{"local_manifest": {...size/sha1 map...}, "deployment_root": "..."}'
```

### Rollback

```bash
curl -X POST "$B/rollback" -H "Content-Type: application/json" \
  -d '{"deployment_root":"...","project_id":"..."}'            # undo last deploy
# or {"release":"20260909-165200"} for a specific one
# history: curl "$B/deployments?project_id=$PROJECT_ID"
```

### Files on the server

```bash
curl "$B/files?deployment_root=$DEPLOY_ROOT&path=&recursive=1"  # list
curl "$B/files/content?deployment_root=$DEPLOY_ROOT&path=.env"  # read (base64)
curl -X PUT "$B/files" -H "Content-Type: application/json" \
  -d '{"path":"config/app.php","content_base64":"...","deployment_root":"..."}'
curl -X POST "$B/files/mkdir"  -d '{"path":"storage/logs","deployment_root":"..."}' -H "Content-Type: application/json"
curl -X POST "$B/files/rename" -d '{"from":"a.php","to":"b.php","deployment_root":"..."}' -H "Content-Type: application/json"
curl -X DELETE "$B/files?deployment_root=$DEPLOY_ROOT&path=tmp/cache.txt"
```

Write cap: 10 MB/file.

### MySQL — query / DDL / import / export / migrations

```bash
CTX="db_host=$DB_HOST&db_name=$DB_NAME&db_user=$DB_USER&db_pass=$DB_PASS&project_id=$PROJECT_ID"

curl "$B/database/schema?$CTX"                          # tables + row counts

# readonly (default): SELECT/SHOW/DESCRIBE/EXPLAIN only, single statement,
# auto LIMIT 200 if none, no information_schema / into outfile / load_file
curl -X POST "$B/database/query" -H "Content-Type: application/json" \
  -d '{"sql":"SELECT * FROM users","mode":"readonly","db_name":"...","db_user":"...","db_pass":"..."}'

# write mode: exactly ONE statement — any DDL/DML (CREATE/ALTER/DROP/INSERT/...)
curl -X POST "$B/database/query" -H "Content-Type: application/json" \
  -d '{"sql":"CREATE TABLE jobs (id INT PRIMARY KEY, payload TEXT)","mode":"write","db_name":"...","db_user":"...","db_pass":"..."}'

# import .sql (multi-statement OK; DDL/DML only — no SELECTs in dumps)
curl "$B/database/import" -F "file=@dump.sql" -F "db_name=$DB_NAME" -F "db_user=$DB_USER" -F "db_pass=$DB_PASS"

# export (raw .sql body, not JSON envelope)
curl "$B/database/export?$CTX" -o dump.sql

# migrations: apply once, sha256-tracked; results applied|already_applied|name_conflict
curl -X POST "$B/database/migrations" -H "Content-Type: application/json" \
  -d '{"name":"001_create_jobs","sql":"CREATE TABLE jobs(...)","db_name":"...","db_user":"...","db_pass":"..."}'
curl "$B/database/migrations?$CTX"                        # ledger status
```

### Backups & logs

```bash
curl "$B/backups?project_id=$PROJECT_ID"
curl -X POST "$B/backups" -H "Content-Type: application/json" \
  -d '{"type":"full","deployment_root":"...","project_id":"...","db_name":"...","db_user":"...","db_pass":"..."}'
# restore: POST "$B/backups/<backupId>/restore" {"with_db":true, ...ctx}
curl "$B/logs?log_paths[]=/home/user/site.example/storage/logs/app.log&index=0&action=tail&lines=100"
```

## 7. Gotchas

1. 401 after an hour → recompute token (rotation).
2. `BAD_REQUEST "deployment_root is required"` → context missing; it's per-request.
3. `BAD_PATH` → file path must be relative to root, no leading `/`.
4. Deploy = FULL zip swap; a partial zip deletes the rest of the site.
5. `database/query` = single statement both modes; use `import` for scripts.
6. Import fails on result-returning statements (SELECT) — DDL/DML only.
7. Retention: last 5 releases + 5 backups per project.
8. DB creds travel on every request — HTTPS only, never log bodies.

## 8. Definition of done for an AI deploy

1. `status` → root_exists, db_connected
2. build full zip (respect SHARED exclusions locally)
3. `deployments` (multipart) → status == "completed", health ok
4. `GET health_url` or bridge health → 2xx/3xx
5. on failure: `rollback` (undo last), fix, redeploy

Full contract: `$BRIDGE_URL/openapi.json` · guide: `$BRIDGE_URL/API.md`.
