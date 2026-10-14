# Makefile for StudyTwin-AI / Aanvi PostgreSQL Database Operations

.PHONY: help db-up migrate seed test-isolation backup restore

help:
	@echo "Available commands:"
	@echo "  make db-up       - Start PostgreSQL database services"
	@echo "  make migrate     - Run Alembic migrations to head"
	@echo "  make seed        - Populate PostgreSQL with authentic seed data"
	@echo "  make test-isolation - Run multi-tenant database isolation test suite"
	@echo "  make backup      - Create a logical backup using pg_dump"
	@echo "  make restore     - Restore database from backup file"

db-up:
	@docker compose up -d postgres || echo "PostgreSQL service is running natively or via container"

migrate:
	@cd backend && python -m alembic upgrade head

seed:
	@cd backend && python scripts/seed.py

test-isolation:
	@cd backend && pytest tests/test_tenant_isolation.py -v

backup:
	@mkdir -p backups
	@pg_dump -h localhost -p 5432 -U studytwin -d studytwin_db -F c -b -v -f backups/studytwin_backup_$$(date +%Y%m%d_%H%M%S).dump

restore:
	@echo "Usage: pg_restore -h localhost -p 5432 -U studytwin -d studytwin_db -v <path_to_backup_file>"
