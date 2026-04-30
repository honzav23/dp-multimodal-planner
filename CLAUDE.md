# CarPub — kontext pro Claude

Webová aplikace pro multimodální plánování cest s autem a veřejnou dopravou. Backend (Deno/TypeScript, port 8000), Frontend (Vite/React). Bez databáze.

Pro obecné informace o architektuře serveru a deploy workflow viz kořenový [`CLAUDE.md`](../../CLAUDE.md).

---

## CarPub specifika

| Věc | Hodnota |
|-----|---------|
| URL prefix | `/carpub` |
| Proxy kontejner | `carpub-proxy` |
| Interní síť | `carpubNetwork` |
| Lokální testovací port | `9095` |

---

## Struktura projektu

Zdrojový kód je v podadresáři `multimodal-planner/`:

- `multimodal-planner/BE/` — Deno/TypeScript backend, port 8000, startuje přes `scripts/initServer.py`
- `multimodal-planner/FE/` — Vite/React frontend
- `multimodal-planner/types/` — sdílené TypeScript typy mezi BE a FE

### Důležité soubory

- `multimodal-planner/FE/vite.config.subdir.ts` — produkční Vite config s `base: '/carpub'`
- `multimodal-planner/FE/nginx.subdir.conf` — nginx uvnitř frontend image
- `multimodal-planner/BE/api.ts` — vstupní bod backendu, čte `API_BASE_URL` a `CORS_ORIGIN`

---

## Závislosti

- **OTP2** — externí routing engine (URL v `.env` jako `OTP_URL`)
- **LISSY API** — data o zpožděních (`LISSY_API_KEY` + `LISSY_API_URL`)
- **Waze** — dopravní data (`WAZE_URL`)

Všechny závislosti jsou volitelné — backend degraduje gracefully, pokud URL není nastaveno.

---

## Potřebné env proměnné (`.env`)

```env
OTP_URL=
LISSY_API_KEY=
LISSY_API_URL=
CORS_ORIGIN=https://dexter.fit.vutbr.cz
WAZE_URL=
```

Šablona je v souboru `env.prod`. Proměnná `API_BASE_URL=/carpub` je nastavena přímo v `docker-compose.prod.yml` (není potřeba v `.env`).

---

## Build

Dockerfile pro produkci: `multimodal-planner/FE/Dockerfile.subdir.prod`

- Builduje frontend přes `npm run buildToSubdir` (= `vite build -c vite.config.subdir.ts`)
- Kopíruje výstup do `/usr/share/nginx/html/carpub` uvnitř image
- Frontend volá API na URL z `import.meta.env.VITE_BACKEND_URL` — musí být nastaveno v `.env.prod` v adresáři FE (není commitováno, šablona je `multimodal-planner/FE/env.prod`)
