import express from "express";
import "@matter/node";
import { Environment } from "@matter/main";
import { CommissioningController } from "@project-chip/matter.js";
import { ManualPairingCodeCodec } from "@matter/main/types";
import { GeneralCommissioning } from "@matter/main/clusters";

const app = express();
app.use(express.json());

async function main() {
    console.log("Initializing Matter Controller...");

    // 1. Initialize the Controller Engine
    const commissioningController = new CommissioningController({
        environment: {
            environment: Environment.default,
            id: "my-ieq-bridge"
        },
        adminFabricLabel: "Raspberry Pi IEQ Controller",
        autoConnect: true,
    });

    await commissioningController.start();
    console.log("Matter Controller started successfully.");

    // 2. Reconnect to any previously paired sensors after a reboot
    const savedNodes = commissioningController.getCommissionedNodes();
    console.log(`Found ${savedNodes.length} previously saved sensors.`);
    
    for (const nodeId of savedNodes) {
        const node = await commissioningController.getNode(nodeId);
        if (!node.isConnected) {
            await node.connect();
        }
        // We will add the MQTT subscription listener here in the next phase
    }

    // 3. HTTP API: Endpoint to accept new pairing codes
    app.post("/api/commission", async (req, res) => {
        const { pairingCode, location } = req.body;

        if (!pairingCode) {
            return res.status(400).json({ error: "pairingCode is required in the JSON body." });
        }

        try {
            console.log(`\n--- Starting Commissioning for: ${location || 'Unknown Room'} ---`);
            
            // Decode the standard Matter text code to get the passcode and discriminator
            const pairingData = ManualPairingCodeCodec.decode(pairingCode);
            
            const options = {
                commissioning: {
                    regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
                    regulatoryCountryCode: "XX",
                },
                discovery: {
                    discoveryCapabilities: { ble: true },
                    identifierData: { shortDiscriminator: pairingData.shortDiscriminator },
                },
                passcode: pairingData.passcode,
            };

            // Execute the secure BLE/Thread handshake
            const nodeId = await commissioningController.commissionNode(options);
            
            console.log(`Success! Sensor paired and assigned Node ID: ${nodeId}`);
            
            // TODO: In the next phase, we will insert nodeId and location into TimescaleDB here
            
            res.json({ 
                success: true, 
                nodeId: nodeId.toString(), 
                location: location 
            });

        } catch (error: any) {
            console.error("Commissioning failed:", error);
            res.status(500).json({ error: "Commissioning failed", details: error.message });
        }
    });

    // 4. Start the Web Server
    const PORT = 3000;
    app.listen(PORT, () => {
        console.log(`HTTP API is actively listening on port ${PORT}`);
    });
}

main().catch(error => {
    console.error("Fatal Application Error:", error);
    process.exit(1);
});