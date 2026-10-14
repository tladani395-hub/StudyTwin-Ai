# PostgreSQL Backup & Restore Guide

This guide details the procedures for creating backups and restoring the StudyTwin-AI / Aanvi PostgreSQL database (`studytwin_db`).

---

## 1. Connection Parameters

| Parameter | Value |
|---|---|
| **Host** | `localhost` / `127.0.0.1` |
| **Port** | `5432` |
| **User** | `studytwin` |
| **Password** | `studytwin_password` |
| **Database** | `studytwin_db` |
| **Test Database** | `studytwin_test_db` |

---

## 2. Creating a Backup (`pg_dump`)

To create a full logical backup in custom binary compressed format (`-F c`):

### Using Make:
```bash
make backup
```

### Using PowerShell:
```powershell
.\scripts\db.ps1 backup
```

### Direct CLI Command:
```bash
PGPASSWORD=studytwin_password pg_dump -h localhost -p 5432 -U studytwin -d studytwin_db -F c -b -v -f backups/studytwin_backup_$(date +%Y%m%d_%H%M%S).dump
```

- `-F c`: Selects PostgreSQL custom archive format (compressed, supports parallel restore and selective table restoration).
- `-b`: Includes large objects (blobs) if any.
- `-v`: Verbose output.

---

## 3. Restoring from a Backup (`pg_restore`)

To restore a database from an existing archive file:

### Using PowerShell:
```powershell
.\scripts\db.ps1 restore .\backups\studytwin_backup_20261009_120000.dump
```

### Direct CLI Command:
```bash
PGPASSWORD=studytwin_password pg_restore -h localhost -p 5432 -U studytwin -d studytwin_db -v --clean --if-exists backups/studytwin_backup_20261009_120000.dump
```

- `--clean`: Drop existing database objects before recreating them.
- `--if-exists`: Avoid error messages if dropped objects do not exist.
- `-v`: Verbose output during restoration.

---

## 4. Disaster Recovery & Replication

- **Automated Cron Backups**: For production deployments, schedule `make backup` via a daily cron job or Kubernetes CronJob targeting cloud storage (S3/GCS bucket).
- **Point-in-Time Recovery (PITR)**: Enable Write-Ahead Log (WAL) archiving in `postgresql.conf` (`wal_level = replica`, `archive_mode = on`, `archive_command = 'cp %p /mnt/wal_archive/%f'`) for continuous streaming replication and sub-second recovery.
