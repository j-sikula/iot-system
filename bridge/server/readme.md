## DNS 
For DNS used free dynv6.net prefix, updating IP adresses using "small script" [`dynv6.sh`](https://gist.github.com/corny/7a07f5ac901844bd20c9)

Implementing the dynv6 Script

1. Save the [`dynv6.sh`](https://gist.githubusercontent.com/corny/7a07f5ac901844bd20c9/raw/3aec27630e25e47d50066d65687bd0c6dd266e83/dynv6.sh) on your Debian machine: `sudo nano /usr/local/bin/dynv6.sh`

2. Make the script executable: `sudo chmod +x /usr/local/bin/dynv6.sh`

3. Open your user's crontab: `crontab -e`

4. Add the cron job, passing your token as an environment variable and your hostname as the first argument:
`*/5 * * * * token=YOUR_API_TOKEN /usr/local/bin/dynv6.sh your-pc.dynv6.net > /dev/null 2>&1`

## TLS - acme.sh

https://github.com/acmesh-official/acme.sh

Install acme.sh as super user:
```
sudo su -
curl https://get.acme.sh | sh -s email=your-email@example.com
source ~/.bashrc
```

Create certificate using dynv6.net
https://github.com/acmesh-official/acme.sh/wiki/dnsapi2#dns_dynv6
```
export DYNV6_TOKEN="your_api_token"
acme.sh --issue --dns dns_dynv6 -d your-pc.dynv6.net
```

Create a dedicated directory for your certificates that Mosquitto can read.

```
sudo mkdir -p /etc/mosquitto/certs
sudo chown mosquitto:mosquitto /etc/mosquitto/certs
```

Install the Certificates:Terminal.Use acme.sh to install the certificates into your new directory. This command also configures acme.sh to automatically restart Mosquitto and grant permissions for Mosquitto whenever the certificate renews in the future.
```
acme.sh --install-cert -d your-pc.dynv6.net \
  --cert-file /etc/mosquitto/certs/cert.pem \
  --key-file /etc/mosquitto/certs/privkey.pem \
  --fullchain-file /etc/mosquitto/certs/fullchain.pem \
  --reloadcmd "chown -R mosquitto:mosquitto /etc/mosquitto/certs && chmod 700 /etc/mosquitto/certs && chmod 600 /etc/mosquitto/certs/* && systemctl restart mosquitto"
```

For HTTPS just simplier:

```bash
sudo mkdir -p /etc/nginx/certs
sudo su -

acme.sh --issue --dns dns_dynv6 -d api.iot-system.dynv6.net --server letsencrypt

acme.sh --install-cert -d api.iot-system.dynv6.net \
  --cert-file /etc/nginx/certs/cert.pem \
  --key-file /etc/nginx/certs/privkey.pem \
  --fullchain-file /etc/nginx/certs/fullchain.pem \
  --reloadcmd "systemctl reload nginx"
exit
```


