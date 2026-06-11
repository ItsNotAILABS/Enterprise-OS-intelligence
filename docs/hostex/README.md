# HOSTEX AGI — Hosting Management Intelligence

> **Designation:** RSHIP-2026-HOSTEX-001  
> **Classification:** Infrastructure Management AGI  
> **Full Name:** HOSTing EXecution Intelligence — Sovereign Infrastructure Orchestrator

## Overview

HOSTEX AGI manages all hosting infrastructure — Cloudflare, GoDaddy, AWS Route53, Vercel, Netlify, DigitalOcean — with deep plumbing intelligence. DNS propagation monitoring, SSL lifecycle, CDN cache orchestration, multi-provider failover, and φ-synchronized infrastructure operations.

## GitHub Pages

This project has its own GitHub Pages site. To enable it:

1. Go to **Settings → Pages** in your GitHub repository
2. Set **Source** to `Deploy from a branch`
3. Set **Branch** to `main` and folder to `/docs/hostex`
4. The site will be available at: `https://itsnotailabs.github.io/Enterprise-OS-intelligence/hostex/`

Alternatively, configure a custom subdomain (e.g., `hostex.rship.ai`) by adding a CNAME file.

## Cloudflare Worker Deployment

The HOSTEX edge worker lives at `cloudflare-workers/hostex/` and is deployed via GitHub Actions:

- Workflow: `.github/workflows/deploy-workers.yml`
- Required secrets:
  - `CLOUDFLARE_API_TOKEN` (Workers:Edit)
  - `CLOUDFLARE_ACCOUNT_ID`

Once configured, pushes to `main` that touch `cloudflare-workers/**` will auto-deploy.

## Project Structure

```
sdk/hostex-agi/
├── hostex-agi.js      # Main AGI intelligence module
└── package.json       # Package configuration

cloudflare-workers/hostex/
├── worker.js          # Edge worker (Cloudflare Worker)
└── wrangler.toml      # Deployment configuration

docs/hostex/
├── index.html         # GitHub Pages - main project page
├── 404.html           # Custom 404 page
└── README.md          # This file
```

## Capabilities

| Feature | Description |
|---------|-------------|
| **Cloudflare Management** | DNS, Workers, SSL, CDN, Page Rules, WAF, R2, Stream |
| **GoDaddy Integration** | Domain registration, DNS, WHOIS privacy |
| **AWS Route53** | DNS, health checks, failover, geolocation routing |
| **Vercel** | DNS, SSL, edge functions, deployments |
| **Netlify** | DNS, SSL, edge functions, forms |
| **DigitalOcean** | DNS, droplets, Kubernetes, load balancers |

## Intelligence Models

- **Kuramoto Synchronization** — Multi-provider DNS convergence modeled as coupled oscillators
- **Lyapunov Stability** — Health metrics analyzed for chaotic divergence prediction
- **φ-Weighted Failover** — Golden ratio scoring for provider hierarchy and routing decisions
- **Sovereign Heartbeat** — 873ms pulse interval (φ-derived)

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/api/status` | Worker health + intelligence metrics |
| `GET` | `/api/domains` | List all managed domains |
| `POST` | `/api/dns/sync` | Synchronize DNS across providers |
| `POST` | `/api/ssl/provision` | Provision SSL certificates |
| `POST` | `/api/cdn/purge` | Purge CDN cache |
| `GET` | `/api/propagation/{domain}` | Check DNS propagation status |

## Quick Start

```javascript
import { birthHOSTEX } from '@medina/hostex-agi';

const hostex = birthHOSTEX({
  cloudflareToken: '...',
  godaddyKey: '...',
  route53AccessKey: '...',
});

// Synchronize DNS across all providers
await hostex.syncDNS('example.com');

// Provision SSL (wildcard + apex)
await hostex.provisionSSL('example.com');

// Purge CDN cache
await hostex.purgeCDN('example.com', ['/api/*']);
```

## Provider φ-Weights

| Provider | Weight | Rationale |
|----------|--------|-----------|
| Cloudflare | φ² = 2.618 | Primary provider, most capabilities |
| GoDaddy | φ = 1.618 | Domain registrar, secondary DNS |
| Route53 | φ = 1.618 | Enterprise DNS, health checks |
| Vercel | 1.000 | Edge deployments |
| Netlify | 1.000 | Edge deployments |
| DigitalOcean | φ⁻¹ = 0.618 | Infrastructure, lower DNS priority |

---

© 2026 Alfredo Medina Hernandez · RSHIP AGI Systems · All Rights Reserved
