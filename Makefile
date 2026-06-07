.PHONY: dev build start test migrate migrate-local seed lint format type-check supabase-start supabase-stop

# ── Local development ─────────────────────────────────────────────────────────

dev:
	npm run dev

build:
	npm run build

start:
	npm run start

# ── Quality ───────────────────────────────────────────────────────────────────

lint:
	npm run lint

format:
	npm run format

type-check:
	npm run type-check

test:
	npm test

test-watch:
	npm run test:watch

# ── Database ──────────────────────────────────────────────────────────────────

# Push migrations to remote Supabase project
migrate:
	supabase db push

# Reset local DB, replay migrations, then apply seed data
migrate-local:
	supabase db reset

# Seed only (without full reset) — requires local Supabase running
seed:
	supabase db seed

# ── Supabase local stack ──────────────────────────────────────────────────────

supabase-start:
	supabase start

supabase-stop:
	supabase stop

# ── Setup ─────────────────────────────────────────────────────────────────────

install:
	npm ci

setup: install supabase-start migrate-local
	@echo "✓ Local stack ready. Copy .env.example to .env.local and set your values."
	@echo "  Then run: make dev"
