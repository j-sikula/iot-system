import "@matter/node";
import "@matter/nodejs-ble";

import { Environment } from "@matter/main";
import { Ble } from "@matter/protocol";
import { TransportSet } from "@matter/general";
import { ServerNode, ControllerBehavior } from "@matter/node";

import { setupGlobalBridge } from "./bridge.js";
import { startWebServer } from "./api.js";

async function main() {
    const MQTT_PASSWORD = process.env.MQTT_PASSWORD;
    if (!MQTT_PASSWORD) {
        throw new Error("Missing required environment variable: MQTT_PASSWORD");
    }

    Environment.default.vars.set("ble.enable", true);

    console.log("Initializing Matter Controller...");

    const serverNode = await ServerNode.create(
        ServerNode.RootEndpointWithoutGroupcast.with(ControllerBehavior),
        {
            environment: Environment.default,
            id: "ieq-controller",
            commissioning: { enabled: false },
            controller: { adminFabricLabel: "IEQ Pi Bridge" }
        }
    );

    await serverNode.start();

    // Remove the server's BLE peripheral interface so outbound commissioning uses centralInterface
    const netTransports = serverNode.env.get(TransportSet);
    const ble = serverNode.env.get(Ble);
    netTransports.delete(ble.peripheralInterface);

    console.log("Matter Controller Node started successfully.");

    await setupGlobalBridge(serverNode, MQTT_PASSWORD);

    for (const peer of serverNode.peers.commissioned) {
        await peer.set({ network: { autoSubscribe: true } });
    }

    startWebServer(serverNode, 3000);

}

main().catch(error => {
    console.error("Fatal Application Error:", error);
    process.exit(1);
});