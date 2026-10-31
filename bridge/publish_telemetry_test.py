import json
import paho.mqtt.publish as publish
import time
import secret  # Import the secret module for the password

# Broker configuration
# CRITICAL: You must use your dynv6 domain name, not the 10.0.0.2 IP.
# TLS certificates validate the hostname. If you connect via IP, it will be rejected.
BROKER_ADDRESS = "iot-system.dynv6.net" 
BROKER_PORT = 8883
TOPIC = "telemetry/ieq"

# Authentication credentials
MQTT_AUTH = {
    "username": "telegraf",
    "password": secret.PASSWORD  # Use the password from the secret module
}

# TLS configuration
# An empty dictionary tells Paho to use your operating system's default 
# trusted Root Certificates, which natively trust Let's Encrypt.
MQTT_TLS = {
    "ca_certs": None
}

# Telemetry data
data = {
    "device_id": "87463920193847-45",
    "timestamp_unix": int(time.time()),
    "battery_percent": 70.1,
    "temperature": 202.6,
    "co2": 1000.0,
    "pm25": 10.401e-6,
    "location": "Room 101",
    "o3": 0.0001,
    "voc": 0.0002
}

json_payload = json.dumps(data)

try:
    print(f"Connecting securely to {BROKER_ADDRESS}:{BROKER_PORT}...")
    publish.single(
        topic=TOPIC,
        payload=json_payload,
        hostname=BROKER_ADDRESS,
        port=BROKER_PORT,
        auth=MQTT_AUTH,  # Pass the credentials
        tls=MQTT_TLS     # Enable TLS encryption
    )
    print(f"Successfully published data to '{TOPIC}'")
    
except Exception as e:
    print(f"Failed to publish message: {e}")