# Bridge from Matter to TimescaleDB

# MQTT Broker - mosquitto
Install
```bash
sudo apt install mosquitto
```

Create password for user telegraf and grant permissions:
```bash
sudo mosquitto_passwd -c /etc/mosquitto/passwd telegraf

sudo chown root:mosquitto /etc/mosquitto/passwd
sudo chmod 640 /etc/mosquitto/passwd
```

For adding other user:
```bash
sudo mosquitto_passwd /etc/mosquitto/passwd <new_username>
```

Configuration of network - MQTT broker
```bash
sudo nano /etc/mosquitto/conf.d/network.conf
sudo systemctl restart mosquitto
```

## Debug
```bash
sudo journalctl -u mosquitto.service -n 20 --no-pager
```

# Telegraf

Subcribes to topics defined in `telegraf.conf` and writes data to TimescaleDB

## Instalation

```bash
# 1. Ensure the keyrings directory exists
sudo mkdir -p -m 755 /etc/apt/keyrings

# 2. Download and verify the key, then add the repository
curl --silent --location -O https://repos.influxdata.com/influxdata-archive.key

gpg --show-keys --with-fingerprint --with-colons ./influxdata-archive.key 2>&1 | grep -q '^fpr::*24C975CBA61A024EE1B631787C3D57159FC2F927:$' && \
cat influxdata-archive.key | gpg --dearmor | sudo tee /etc/apt/keyrings/influxdata-archive.gpg > /dev/null && \
echo 'deb [signed-by=/etc/apt/keyrings/influxdata-archive.gpg] https://repos.influxdata.com/debian stable main' | sudo tee /etc/apt/sources.list.d/influxdata.list

# 3. Clean up the temporary file
rm ./influxdata-archive.key

# 4. Update and install Telegraf
sudo apt update && sudo apt install -y telegraf
```

## Management

Configuration file `telegraf.conf` can be modified using:

```bash
sudo nano /etc/telegraf/telegraf.conf
```

Apply changes:
```bash
sudo systemctl restart telegraf
```

## Debug

```bash
sudo journalctl -u telegraf -n 50 --no-pager
```