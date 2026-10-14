#!/usr/bin/env bash
set -e

service postgresql start

sudo -u postgres psql -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'studytwin') THEN
    CREATE ROLE studytwin WITH SUPERUSER CREATEDB LOGIN PASSWORD 'studytwin_password';
  ELSE
    ALTER ROLE studytwin WITH SUPERUSER CREATEDB LOGIN PASSWORD 'studytwin_password';
  END IF;
END
\$\$;"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'studytwin_db'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE studytwin_db OWNER studytwin;"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'studytwin_test_db'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE studytwin_test_db OWNER studytwin;"

PG_CONF=$(find /etc/postgresql -name postgresql.conf)
PG_HBA=$(find /etc/postgresql -name pg_hba.conf)

sed -i "s/#listen_addresses = 'localhost'/listen_addresses = '*'/g" "$PG_CONF"
grep -q "host all all 0.0.0.0/0 md5" "$PG_HBA" || echo "host all all 0.0.0.0/0 md5" >> "$PG_HBA"
grep -q "host all all 127.0.0.1/32 trust" "$PG_HBA" || echo "host all all 127.0.0.1/32 trust" >> "$PG_HBA"
grep -q "host all all ::1/128 trust" "$PG_HBA" || echo "host all all ::1/128 trust" >> "$PG_HBA"

service postgresql restart
service postgresql status
