# This script publishes a single telemetry test message to the MQTT broker.




import json
import paho.mqtt.publish as publish
import time

# Broker configuration
BROKER_ADDRESS = "10.0.0.2"
BROKER_PORT = 1883
TOPIC = "telemetry/ieq"

# Telemetry data
data = {
    "device_id": "87463920193847-45",
    "timestamp_unix": int(time.time()),
    "battery_percent": 80.1,
    "temperature": 22.6,
    "co2": 1890.0,
    "pm25": 100.4
}

# Convert the Python dictionary to a JSON string
json_payload = json.dumps(data)

try:
    print(f"Connecting to broker {BROKER_ADDRESS}:{BROKER_PORT}...")
    # Publish the message
    publish.single(
        topic=TOPIC,
        payload=json_payload,
        hostname=BROKER_ADDRESS,
        port=BROKER_PORT
    )
    print(f"Successfully published data to '{TOPIC}':\n{json_payload}")
    
except Exception as e:
    print(f"Failed to publish message: {e}")