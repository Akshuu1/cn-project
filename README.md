# CN Project – Private Network Service Platform (Team X)

Client → DNS (Mac 1) → HTTPS (Mac 2, nginx) → Backend A (Mac 3) / Backend B (Mac 4).
Domain: `app.teamX.test`, `api.teamX.test` (`.test`, not `.local`).

**Status:** Phase 1 done.

## Machines

| Mac | Role | IP | Service |
|-----|------|----|---------|
| 1 | Private DNS + test client | 10.7.2.57 | dnsmasq :53 |
| 2 | Edge / reverse proxy / LB | 10.7.9.158 | nginx :80 → :443 (TLS, HTTP/2) |
| 3 | Backend A | 10.7.16.163 | `backend/server.js` :3001 |
| 4 | Backend B + test client | 10.7.17.238 | `backend/server.js` :3002 |

## Repo layout

```
architecture/   machine roles, network topology, request-flow diagrams
backend/        server.js – one file, both backends (env BACKEND_ID, PORT)
dns/            dnsmasq.conf.example – zone + records for Mac 1
ngnix/          nginx config (Phase 1): upstreams, 80→443, TLS, X-Edge header  (dir name typo kept)
evidence/
  caching/      Cache-Control / ETag / 304 demo
  dns/          Wireshark DNS query + response
  failures/     the 5 required failure demos (see below)
  pcap/         phase1-app-flow.pcapng (DNS + TCP + TLS + HTTP)
  pings-mac1.md, ping-mac3.md, pings-mac4.md   LAN reachability
```

## How to run

**Backends** (Mac 3 / Mac 4) – listen on 0.0.0.0:
```
BACKEND_ID=A PORT=3001 node backend/server.js   # Mac 3
BACKEND_ID=B PORT=3002 node backend/server.js   # Mac 4
```
Endpoints: `/`, `/api/status` (JSON, `no-store`), `/api/cached` (`max-age=60` + ETag, 304 on `If-None-Match`). Every response has `X-Backend: A|B`.

**DNS** (Mac 1): copy `dns/dnsmasq.conf.example` to `/opt/homebrew/etc/dnsmasq.conf`, replace `teamX` with real team name, `sudo brew services start dnsmasq`. Point Mac 2/3/4 DNS at 10.7.2.57.

**Edge** (Mac 2): put `ngnix/teamX-phase1.conf` in nginx `servers/` dir, `sudo nginx -t && sudo nginx -s reload`. Needs cert + key at `/opt/homebrew/etc/nginx/certs/app.teamX.test.{crt,key}`.

**TLS notes:** TODO – write down how cert was made (mkcert or OpenSSL local CA) and how CA was trusted on clients (`sudo security add-trusted-cert ...`). Demo must work without `curl -k`.

## Phase 1 checklist (doc §6)

| Task | State | Evidence |
|------|-------|----------|
| A LAN + ping | done | `evidence/ping*.md` |
| B DNS | done | `evidence/dns/`, `dns/` |
| C Backends | done | `backend/server.js` |
| D nginx LB | done (round-robin, `max_fails` passive failover) | `ngnix/` |
| E TLS | done – cert notes missing | `ngnix/` |
| F Caching | done | `evidence/caching/` |
| G Protocol flow | done | `evidence/pcap/`, `evidence/dns/` |
| Failure demos | all 5 present | `evidence/failures/` |

Failure demos: wrong DNS server (NXDOMAIN), wrong DNS record, one backend stopped, both stopped (502), wrong port.

## Known issues to check

- `dns/dnsmasq.conf.example`: `server=10.7.16.163` is also Backend A's IP (Mac 3). That line should be the router/upstream resolver. Only affects non-`.test` names, but confirm it.
- Config files still say `teamX`; rename to real team name before demo.
