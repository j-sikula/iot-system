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

