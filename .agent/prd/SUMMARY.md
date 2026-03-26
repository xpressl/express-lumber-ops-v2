# Express Lumber Ops - Summary

Express Lumber Ops is the operational control layer for a wholesale building materials distributor. It replaces paper, spreadsheets, texts, and disconnected workflows with a unified platform.

## Tech Stack
- **Frontend**: Next.js 14+ App Router, React 18, TypeScript (strict), Tailwind CSS v4 + shadcn/ui
- **Backend**: Next.js API routes (REST), PostgreSQL 16 + Prisma ORM, Redis 7
- **Auth**: NextAuth.js v4 (JWT + RBAC)
- **Real-time**: Socket.io
- **Maps**: Leaflet + react-leaflet
- **Charts**: Recharts
- **AI**: Anthropic Claude (Vision + PDF extraction)
- **File Storage**: S3/MinIO
- **PWA**: Service worker for offline driver app

## Modules (12 major + 11 cross-cutting)
1. Orders — state machine driven order lifecycle
2. Dispatch — real-time truck/route assignment
3. Pickup — queue management for will-call
4. Yard — mobile-first task queue for yard workers
5. Receiving — PO receiving with discrepancy handling
6. Delivery — driver PWA with POD/COD/GPS/offline
7. Collections — AR aging, promises, disputes, credit holds
8. CRM — leads, estimates, dormant recovery, cross-sell
9. Pricing — vendor price imports, cost change detection, margin analysis
10. Purchasing — RFQ, PO, three-way match, vendor scorecards
11. Bridge/Import — CSV/XLSX/PDF import with AI extraction
12. Command Center — management dashboard, reports, daily close

## Key Rules (from CLAUDE-RULES.md)
- All 12 documentation files must exist before feature coding
- Business logic stays out of UI components
- Every write action creates an audit event
- AI features require review queues and human approval
- Build one module at a time in phase order

## Source Code
- Source directory: `src/`
- See `PLAN.md` for full phase breakdown and task details
- See `CLAUDE-RULES.md` for build rules
