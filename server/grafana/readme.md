
# Grafana

## Install

```bash
sudo systemctl daemon-reload
sudo systemctl start grafana-server

```

To verify that the service is running, run the following command:

```Bash
sudo systemctl status grafana-server
```
Configure the Grafana server to start at boot using systemd


```Bash
sudo systemctl enable grafana-server.service
```

Edit port with 
```bash
sudo nano /etc/grafana/grafana.ini
```

```toml
[server]
# Protocol (http, https, h2, socket, socket_h2)
protocol = http


# Allow only loopback at server, Nginxwill open grafana to world over TLS
http_addr =127.0.0.1

# The http port to use
http_port = 3030

```

Restart the Grafana server using systemd


```Bash
sudo systemctl restart grafana-server
```

### Connection with PostgreSQL

```bash
sudo -u postgres psql -d iot_ieq
```
Create the Grafana login role
```bash

CREATE ROLE grafana_viewer WITH LOGIN PASSWORD 'secure_grafana_password';
```

Grant read-only access to existing data
```bash
GRANT CONNECT ON DATABASE iot_ieq TO grafana_viewer;
GRANT USAGE ON SCHEMA public TO grafana_viewer;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO grafana_viewer;

-- Grant read-only access to future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO grafana_viewer;

\q
```