import mqtt, { MqttClient, type IClientPublishOptions } from "mqtt";

const BROKER_ADDRESS = "iot-system.dynv6.net";
const BROKER_PORT = 8883;
const BROKER_USERNAME = "matter-bridge";

let client: MqttClient | null = null;

/**
 * Initializes the shared MQTT client connection over TLS.
 * Call this once at application startup.
 */
export function initMqttClient(mqttPassword: string): MqttClient {
    if (client) {
        return client;
    }

    console.log(`Connecting securely to ${BROKER_ADDRESS}:${BROKER_PORT}...`);

    client = mqtt.connect(`mqtts://${BROKER_ADDRESS}:${BROKER_PORT}`, {
        username: BROKER_USERNAME,
        password: mqttPassword,
        rejectUnauthorized: true
    });

    client.on("connect", () => {
        console.log("Successfully connected to MQTT Broker over TLS.");
    });

    client.on("error", (err) => {
        console.error("MQTT connection error:", err.message);
    });

    return client;
}

/**
 * Publishes a JSON object (or pre-stringified JSON) to the specified MQTT topic.
 */
export function publishToTopic(
    topic: string,
    payload: Record<string, unknown> | string,
    options: IClientPublishOptions = { qos: 0 }
): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!client) {
            return reject(new Error("MQTT client is not initialized. Call initMqttClient() first."));
        }

        const message = typeof payload === "string" ? payload : JSON.stringify(payload);

        client.publish(topic, message, options, (err) => {
            if (err) {
                console.error(`Failed to publish to ${topic}:`, err.message);
                return reject(err);
            }
            console.log(`Published to [${topic}]: ${message}`);
            resolve();
        });
    });
}

export function unixTimestamp(date: Date): number {
    return Math.floor(date.getTime() / 1000);
}