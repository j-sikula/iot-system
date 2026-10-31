# API - PostgREST

## Instalation
### PostgREST
https://docs.postgrest.org/en/v16/tutorials/tut0.html

1. Set Up PostgreSQL API Roles

PostgREST uses a strict security model. It connects to the database using an authenticator role, but immediately switches to a web_anon role to serve unauthenticated read-only HTTP requests.

Open your PostgreSQL prompt:
```Bash
sudo -u postgres psql -d iot_ieq
```

Execute these commands to create the API roles and grant them read-only access to your telemetry:
```SQL
-- Create the anonymous role for web requests
CREATE ROLE web_anon NOLOGIN;
GRANT USAGE ON SCHEMA public TO web_anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO web_anon;

-- Create the authenticator role that PostgREST uses to log in
CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'secure_api_password';
GRANT web_anon TO authenticator;

\q
```

2. Download and Install the Binary

Download the latest static Linux release, extract it, and move it to your system binaries directory.
```Bash
cd /tmp
wget https://github.com/PostgREST/postgrest/releases/download/v16.5/postgrest-v16.5-linux-static-x86-64.tar.xz
tar -xf postgrest-v16.5-linux-static-x86-64.tar.xz
sudo mv postgrest /usr/local/bin/
```
3. Create the Configuration File

Create a central configuration file for PostgREST.

```Bash
sudo nano /etc/postgrest.conf
```

Paste this configuration, ensuring the password matches what you set in Step 1:

```
db-uri = "postgres://authenticator:secure_api_password@localhost:5432/iot_ieq"
db-schema = "public"
db-anon-role = "web_anon"
server-port = 3000
```

4. Create the Systemd Service

To ensure PostgREST starts automatically on boot and restarts if it crashes, create a systemd unit file.

```Bash
sudo nano /etc/systemd/system/postgrest.service
```

Paste the following structure:

```ini
[Unit]
Description=REST API for PostgreSQL
After=postgresql.service

[Service]
ExecStart=/usr/local/bin/postgrest /etc/postgrest.conf
ExecReload=/bin/kill -SIGUSR1 $MAINPID
Restart=always

[Install]
WantedBy=multi-user.target
```

5. Start and Verify

Reload the systemd daemon to recognize your new service, then enable and start it.

```Bash
sudo systemctl daemon-reload
sudo systemctl enable --now postgrest
```
Verification: Test the API locally from your Debian server. PostgREST should instantly return your raw JSON telemetry data.
```Bash

curl http://localhost:3000/ieq_readings?limit=2
```

### Nginx

Install Nginx
Install the Nginx web server, which will act as the security layer in front of PostgREST.
```Bash

sudo apt update && sudo apt install -y nginx
```
Create the Proxy Configuration
Create a new Nginx server block configuration file for your API.
```Bash

sudo nano /etc/nginx/sites-available/postgrest
```
Paste the following configuration, and updating the Let's Encrypt certificate paths to match the ones you generated earlier for Mosquitto:
```Nginx

server {
    listen 80;
    listen [::]:80;
    server_name api.iot-system.dynv6.net;
    # Force redirect from HTTP to HTTPS
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name api.iot-system.dynv6.net;

    # Let's Encrypt SSL Certificates
    ssl_certificate /etc/nginx/certs/fullchain.pem;
    ssl_certificate_key /etc/nginx/certs/privkey.pem;
    
    # Recommended SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        # Forward all HTTPS traffic to the local PostgREST port
        proxy_pass http://localhost:3000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```
Enable the Proxy and Restart
Link your new configuration to the enabled sites folder, verify there are no typos, and restart the Nginx service.
```Bash

# Enable the configuration
sudo ln -s /etc/nginx/sites-available/postgrest /etc/nginx/sites-enabled/

# Test the Nginx syntax to ensure it is valid
sudo nginx -t

# Apply the changes
sudo systemctl restart nginx
```
You can now securely query your raw database tables over the internet by accessing [https://api.iot-system.dynv6.net/ieq_readings](https://api.iot-system.dynv6.net/ieq_readings).

Official Documentation Reference
For more advanced Nginx configurations with PostgREST (including rate limiting and caching setups), refer to the official PostgREST reverse proxy documentation:https://docs.postgrest.org/en/stable/explanations/nginx.html