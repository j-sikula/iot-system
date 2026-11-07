import "@matter/node";

import { Environment } from "@matter/main";
import { ServerNode, ControllerBehavior } from "@matter/node";

import { setupGlobalBridge } from "./bridge.js";
import { startWebServer } from "./api.js";



async function main() {
    // Read the environment variable
    const MQTT_PASSWORD = process.env.MQTT_PASSWORD;

    if (!MQTT_PASSWORD) {
    throw new Error("Missing required environment variable: MQTT_PASSWORD");
    
    }


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
    console.log("Matter Controller Node started successfully.");

    // Initialize the MQTT bridge
    await setupGlobalBridge(serverNode, MQTT_PASSWORD);

    // Auto-subscribe to all previously paired peers on boot
    for (const peer of serverNode.peers.commissioned) {
        await peer.set({ network: { autoSubscribe: true } });
    }

    // Initialize the Express Web Server
    startWebServer(serverNode, 3000);
}

main().catch(error => {
    console.error("Fatal Application Error:", error);
    process.exit(1);
});