import express from "express";
import { ServerNode } from "@matter/node";
import { ManualPairingCodeCodec } from "@matter/main/types";
import { GeneralCommissioning } from "@matter/main/clusters";
import { FabricAuthority } from "@matter/protocol";
import { BasicInformationClient } from "@matter/node/behaviors";
import { unixTimestamp, publishToTopic } from "./mqttClient.js"; // adjust extension if needed

const THREAD_NETWORK_NAME = "OpenThread-049a"; // From `ot-ctl networkname`
const THREAD_DATASET_HEX = "0e080000000000010000000300001535060004001fffe002080a2824cc1be4eb7a0708fdc7f24f1fbf8ed505105b9a15554689dfcbdb820643dc41e7a9030f4f70656e5468726561642d303439610102049a041017f1751808313ae1bc9d5480ad5e97180c0402a0f7f8";      // From `ot-ctl dataset active -x`

// Extracted commissioning function
async function commissionSensor(serverNode: ServerNode, passcode: number, shortDiscriminator?: number) {
    if (shortDiscriminator === undefined) {
        throw new Error("Invalid pairing code: missing short discriminator.");
    }

    const peer = await serverNode.peers.commission({
        passcode: passcode,
        shortDiscriminator: shortDiscriminator,
        discoveryCapabilities: { ble: true, onIpNetwork: true },
        threadNetwork: {
            networkName: THREAD_NETWORK_NAME,
            operationalDataset: THREAD_DATASET_HEX
        },
        regulatoryLocation: GeneralCommissioning.RegulatoryLocationType.IndoorOutdoor,
        regulatoryCountryCode: "XX",
        autoSubscribe: true
    });

    const fabricAuthority = await serverNode.env.load(FabricAuthority);
    const fabric = await fabricAuthority.defaultFabric({ adminFabricLabel: "IEQ Pi Bridge" });

    // 1. Compressed Fabric ID (8-byte Uint8Array -> 16-char hex string)
    const globalFabricId = fabric.config.globalId;

    // 2. Read BasicInformation.uniqueId (populated automatically with autoSubscribe: true)
    const basicInfo = peer.maybeStateOf(BasicInformationClient);
    const uniqueId = basicInfo?.uniqueId;

    // 3. Fallback to nodeId if the device is Matter 1.0-1.3 and doesn't expose uniqueId
    const nodeId = peer.state.commissioning.peerAddress?.nodeId;
    const deviceUuid = `${globalFabricId}-${uniqueId ?? nodeId?.toString(16)}`;

    return { deviceUuid, nodeId: nodeId, fabricId: globalFabricId };
}

export function startWebServer(serverNode: ServerNode, port: number = 3000) {
    const app = express();
    app.use(express.json());

    // GET Endpoint: Serves the HTML frontend with the form and submit button
    app.get("/", (req, res) => {
        res.send(`
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>IEQ Matter Bridge</title>
                <style>
                    body { font-family: system-ui, sans-serif; max-width: 600px; margin: 2rem auto; padding: 0 1rem; }
                    input { display: block; width: 100%; margin-bottom: 1rem; padding: 0.5rem; }
                    button { padding: 0.75rem 1.5rem; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    button:disabled { background: #ccc; }
                    #status { margin-top: 1rem; padding: 1rem; border-radius: 4px; display: none; }
                    .success { background: #d4edda; color: #155724; }
                    .error { background: #f8d7da; color: #721c24; }
                </style>
            </head>
            <body>
                <h2>Commission New Matter Sensor</h2>
                <form id="commissionForm">
                    <label>Matter Pairing Code (11 or 21 digits)</label>
                    <input type="text" id="pairingCode" required placeholder="e.g. 34970112332">
                    
                    <label>Building Name</label>
                    <input type="text" id="building" required>
                    
                    <label>Room Name</label>
                    <input type="text" id="room" required>
                    
                    <label>Location Detail</label>
                    <input type="text" id="detail" placeholder="e.g. Ceiling, Wall-mounted">
                    
                    <label>GPS Latitude</label>
                    <input type="number" step="any" id="lat">
                    
                    <label>GPS Longitude</label>
                    <input type="number" step="any" id="lon">
                    
                    <button type="submit" id="submitBtn">Pair Sensor</button>
                </form>
                <div id="status"></div>

                <script>
                    document.getElementById('commissionForm').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const btn = document.getElementById('submitBtn');
                        const status = document.getElementById('status');
                        btn.disabled = true;
                        btn.innerText = 'Pairing (Observe device for success)...';
                        status.style.display = 'none';

                        const payload = {
                            pairingCode: document.getElementById('pairingCode').value,
                            building: document.getElementById('building').value,
                            room: document.getElementById('room').value,
                            detail: document.getElementById('detail').value,
                            lat: parseFloat(document.getElementById('lat').value) || null,
                            lon: parseFloat(document.getElementById('lon').value) || null
                        };

                        try {
                            const response = await fetch('/api/commission', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(payload)
                            });
                            
                            const data = await response.json();
                            status.style.display = 'block';
                            
                            if (response.ok) {
                                status.className = 'success';
                                status.innerText = \`Success! Matter Node ID: \${data.nodeId}\`;
                                document.getElementById('commissionForm').reset();
                            } else {
                                status.className = 'error';
                                status.innerText = \`Error: \${data.error} (\${data.details})\`;
                            }
                        } catch (err) {
                            status.style.display = 'block';
                            status.className = 'error';
                            status.innerText = 'Network error contacting the bridge.';
                        } finally {
                            btn.disabled = false;
                            btn.innerText = 'Pair Sensor';
                        }
                    });
                </script>
            </body>
            </html>
        `);
    });

    // POST Endpoint: Accepts JSON payload to trigger commissioning
    app.post("/api/commission", async (req, res) => {
        const { pairingCode, building, room, detail, lat, lon } = req.body;

        if (!pairingCode) {
            return res.status(400).json({ error: "pairingCode is required." });
        }

        try {
            console.log(`Starting commissioning for ${room} (${building})...`);

            const pairingData = ManualPairingCodeCodec.decode(pairingCode);

            const { deviceUuid, nodeId, fabricId } = await commissionSensor(
                serverNode,
                pairingData.passcode,
                pairingData.shortDiscriminator
            );

            console.log(`Paired Device UUID: ${deviceUuid}`);

            // TODO: Execute PostgreSQL insertion function here
            const payload: Record<string, any> = {
                device_id: deviceUuid,
                fabric_id: fabricId?.toString(),
                node_id: nodeId?.toString(),
                building_name: building,
                room_name: room,
                location_detail: detail,
                gps_lat: lat,
                gps_lon: lon,
                last_updated: unixTimestamp(new Date())
            };
            console.log("Metadata to insert:", payload);

            await publishToTopic("devices/metadata", payload).catch(err => {
                console.error("Failed to publish metadata to MQTT:", err);
            });

            res.json({ success: true, nodeId: nodeId?.toString(), fabricId: fabricId?.toString() });

        } catch (error: any) {
            console.error("Commissioning failed:", error);
            res.status(500).json({ error: "Commissioning failed", details: error.message });
        }
    });

    app.listen(port, "0.0.0.0", () => {
        console.log(`HTTP API and Frontend listening on http://0.0.0.0:${port}`);
    });
}