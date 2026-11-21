import { ChangeNotificationService, ClientNode, ClusterBehavior, ServerNode } from "@matter/node";
import { FabricAuthority } from "@matter/protocol";
import {
    TemperatureMeasurement,
    PressureMeasurement,
    RelativeHumidityMeasurement,
    CarbonMonoxideConcentrationMeasurement,
    CarbonDioxideConcentrationMeasurement,
    NitrogenDioxideConcentrationMeasurement,
    OzoneConcentrationMeasurement,
    Pm25ConcentrationMeasurement,
    FormaldehydeConcentrationMeasurement,
    Pm1ConcentrationMeasurement,
    Pm10ConcentrationMeasurement,
    TotalVolatileOrganicCompoundsConcentrationMeasurement,
    RadonConcentrationMeasurement,
    PowerSource
} from "@matter/main/clusters";
import { initMqttClient, publishToTopic, unixTimestamp } from "./mqttClient.js"; // adjust extension if needed
import { BasicInformationClient } from "@matter/main/behaviors/basic-information";


const TOPIC = "telemetry/ieq";

/**
 * Set up a global bridge to the MQTT broker for telemetry data
 * 
 * Translates Matter cluster property changes into JSON payloads and publishes them to the MQTT broker
 * @param serverNode - The Matter server node
 * @param mqttPassword - The password for the MQTT broker
 * @returns A promise that resolves when the bridge is set up
 */

export async function setupGlobalBridge(serverNode: ServerNode, mqttPassword: string) {

    initMqttClient(mqttPassword);



    // Obtain the fabric context once for ID generation[cite: 2]
    const fabricAuthority = await serverNode.env.load(FabricAuthority);
    const fabric = await fabricAuthority.defaultFabric({ adminFabricLabel: "IEQ Pi Bridge" });
    const fabricId = fabric.globalId.toString();

    const changes = serverNode.env.get(ChangeNotificationService);

    changes.change.on(change => {
        const peer = change.endpoint.ownerOfType(ClientNode.RootEndpoint);
        if (!(peer instanceof ClientNode)) return;

        if (change.kind === "update") {
            if (!ClusterBehavior.is(change.behavior)) return;

            const clusterId = change.behavior.cluster.id;
            const state = change.endpoint.stateOf(change.behavior.id);
            const changedProperties = change.properties?.reduce<Record<string, unknown>>(
                (o, n) => ((o[n] = state[n]), o), {}
            ) ?? state;

            const deviceUUID = peer.maybeStateOf(BasicInformationClient)?.uniqueId;
            // 3. Fallback to nodeId if the device is Matter 1.0-1.3 and doesn't expose uniqueId
            const nodeId = peer.state.commissioning.peerAddress?.nodeId;
            if (!deviceUUID && !nodeId) {
                return;
            }
               

            const payload: Record<string, any> = {
                device_id: `${fabricId}-${deviceUUID ?? nodeId?.toString(16)}`,
                timestamp_unix: unixTimestamp(new Date()), // Unix timestamp in seconds
            };

            let hasTelemetry = false;

            if ("measuredValue" in changedProperties) {
                const value = changedProperties["measuredValue"] as number;
                hasTelemetry = true;

                switch (clusterId) {
                    case TemperatureMeasurement.id:
                        payload.temperature = value / 100; // Matter scales temp by 100
                        break;
                    case RelativeHumidityMeasurement.id:
                        payload.relative_humidity = value / 100; // Matter scales RH by 100
                        break;
                    case PressureMeasurement.id:
                        payload.pressure = value;
                        break;
                    case CarbonMonoxideConcentrationMeasurement.id:
                        payload.co = value;
                        break;
                    case CarbonDioxideConcentrationMeasurement.id:
                        payload.co2 = value;
                        break;
                    case NitrogenDioxideConcentrationMeasurement.id:
                        payload.no2 = value;
                        break;
                    case OzoneConcentrationMeasurement.id:
                        payload.o3 = value;
                        break;
                    case Pm25ConcentrationMeasurement.id:
                        payload.pm25 = value;
                        break;
                    case FormaldehydeConcentrationMeasurement.id:
                        payload.hcho = value;
                        break;
                    case Pm1ConcentrationMeasurement.id:
                        payload.pm1 = value;
                        break;
                    case Pm10ConcentrationMeasurement.id:
                        payload.pm10 = value;
                        break;
                    case TotalVolatileOrganicCompoundsConcentrationMeasurement.id:
                        payload.tvoc = value;
                        break;
                    case RadonConcentrationMeasurement.id:
                        payload.radon = value;
                        break;
                    default:
                        hasTelemetry = false;
                }
            }

            if (clusterId === PowerSource.id && "batPercentRemaining" in changedProperties) {
                const batValue = changedProperties["batPercentRemaining"] as number;
                payload.battery_percent = batValue / 2; // Matter scales 0-100% to 0-200
                hasTelemetry = true;
            }

            if (hasTelemetry) {
                publishToTopic(TOPIC, payload).catch((err) => {
                    console.error("Telemetry publish error:", err);
                });
            }
        }
    });
}