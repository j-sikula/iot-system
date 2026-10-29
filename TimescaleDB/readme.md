# IEQ TimescaleDB Setup

## Quick Start
1. Create database:
   ```bash
   sudo -u postgres psql -c "CREATE DATABASE iot_ieq;"
   ```
2. Apply schema:
   ```bash
   sudo -u postgres psql -d iot_ieq -f schema.sql
   ```


Database console:
```
sudo -u postgres psql
```

Connect to database (in database mode, e. g.`postgres=#`):
```
\c iot_ieq
```

## User for Telegraf
```
-- 1. Create the user with a strong password
CREATE USER telegraf WITH PASSWORD 'my_password';

-- 2. Grant the user access to connect to the database
GRANT ALL PRIVILEGES ON DATABASE iot_ieq TO telegraf;

-- 3. Connect to the specific database to grant schema permissions
\c iot_ieq

-- 4. Grant permission to create and modify tables (required for Postgres 15+)
GRANT ALL ON SCHEMA public TO telegraf;

-- 1. Grant access to all existing tables (including the hypertable chunks)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO telegraf;

-- 2. Ensure Telegraf automatically gets access to future tables/chunks
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO telegraf;

-- Exit the Postgres prompt
\q
```

