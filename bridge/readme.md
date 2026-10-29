# Bridge from Matter to TimescaleDB

# MQTT Broker - mosquitto

# Telegraf

## Instalation

```
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

