import json
import paho.mqtt.publish as publish
import time
import secret  # Import the secret module for the password

# Broker configuration
# CRITICAL: You must use your dynv6 domain name, not the 10.0.0.2 IP.
# TLS certificates validate the hostname. If you connect via IP, it will be rejected.
BROKER_ADDRESS = "iot-system.dynv6.net" 
BROKER_PORT = 8883
TOPIC = "devices/metadata"

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
    "device_id": "15816816529649171878-1",
    "fabric_id": "1",
    "node_id": "15816816529649171878",
    "building_name": "Home",
    "room_name": "My Room 1",
    "location_detail": "PC Desk",
    "gps_lat": 49.2268,
    "gps_lon": 16.5756,
    "last_updated": int(time.time())  # Current timestamp in seconds
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
    print(f"Successfully published data {json_payload} to '{TOPIC}'")
    
except Exception as e:
    print(f"Failed to publish message: {e}")