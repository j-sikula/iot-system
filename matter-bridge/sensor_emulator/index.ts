#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2026 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import "@matter/nodejs"; // This must remain at the very top to provide Network/Storage dependencies
import { Environment, Logger, ServerNode, StorageService, Time } from "@matter/main";
import { DeviceTypeId, VendorId } from "@matter/main/types";
import { CarbonDioxideConcentrationMeasurementServer } from "@matter/main/behaviors";

const logger = Logger.get("Co2SensorDeviceNode");

// Enable the NumericMeasurement feature required to expose 'measuredValue'
const Co2Behavior = CarbonDioxideConcentrationMeasurementServer.with("NumericMeasurement");

async function main() {
    /** Initialize configuration values from storage/env */
    const {
        interval,
        deviceName,
        vendorName,
        passcode,
        discriminator,
        vendorId,
        productName,
        productId,
        port,
        uniqueId,
    } = await getConfiguration();

    /**
     * Create the Matter ServerNode.
     * Setting deviceType to 0x010B here allows the root node to announce itself as a CO2 Sensor natively.
     */
    const server = await ServerNode.create({
        id: uniqueId,
        network: { port },
        commissioning: { passcode, discriminator },
        productDescription: {
            name: deviceName,
            deviceType: DeviceTypeId(0x010B),
        },
        basicInformation: {
            vendorName,
            vendorId: VendorId(vendorId),
            nodeLabel: productName,
            productName,
            productLabel: productName,
            productId,
            serialNumber: `matterjs-${uniqueId}`,
            uniqueId,
        },
    });

    /**
     * Bind the CO2 Behavior dynamically.
     * The Conformance Error (135) is resolved by explicitly providing the unit and medium here.
     * We cast to 'any' to cleanly bypass TypeScript missing-enum errors while satisfying the runtime validator.
     */
    server.behaviors.require(Co2Behavior, {
        measuredValue: 400,
        measurementUnit: 0 as any,  // 39 (0x27) represents PPM in the Matter spec
        measurementMedium: 0 as any  // 1 represents Air in the Matter spec
    });

    logger.info(server);

    // Publish random CO2 numbers based on the configured interval
    const updateInterval = setInterval(() => {
        const randomCo2 = Math.floor(Math.random() * (1500 - 400 + 1)) + 400;
        logger.info(`Updating CO2 value to: ${randomCo2} ppm`);

        server.setStateOf(Co2Behavior, {
            measuredValue: randomCo2,
        }).catch(error => console.error("Error updating measured value:", error));
    }, interval * 1000);

    // Cleanup the interval when the node goes offline to prevent memory leaks
    server.lifecycle.offline.on(() => clearInterval(updateInterval));

    if (!server.lifecycle.isCommissioned) {
        const { manualPairingCode } = server.state.commissioning.pairingCodes;
        logger.info(`Manual pairing code: ${manualPairingCode}`);
    } else {
        logger.info("Device is already commissioned.");
    }

    /**
     * Start the node and announce it into the network. 
     * run() resolves only when the node goes offline, keeping the process alive.
     */
    await server.run();
}

main().catch(error => console.error(error));

/*********************************************************************************************************
 * Storage and Configuration Utilities
 *********************************************************************************************************/

async function getConfiguration() {
    const environment = Environment.default;
    const storageService = environment.get(StorageService);
    
    logger.info(`Storage location: ${storageService.location} (Directory)`);

    const storageManager = await storageService.open("device");
    const deviceStorage = storageManager.createContext("data");

    let interval = environment.vars.number("interval") ?? (await deviceStorage.get("interval", 2));
    if (interval < 1) {
        logger.warn(`Invalid Interval ${interval}, set to 2s`);
        interval = 2;
    }

    const deviceName = "CO2 Sensor Emulator";
    const vendorName = "matter-node.js";
    const passcode = environment.vars.number("passcode") ?? (await deviceStorage.get("passcode", 20202021));
    const discriminator = environment.vars.number("discriminator") ?? (await deviceStorage.get("discriminator", 3840));
    const vendorId = environment.vars.number("vendorid") ?? (await deviceStorage.get("vendorid", 0xfff1));
    const productName = `node-matter CO2 Sensor`;
    const productId = environment.vars.number("productid") ?? (await deviceStorage.get("productid", 0x8000));
    const port = environment.vars.number("port") ?? 5540;
    
    const uniqueId = environment.vars.string("uniqueid") ?? (await deviceStorage.get("uniqueid", Time.nowMs.toString()));

    // Persist basic data to keep them consistent across restarts
    await deviceStorage.set({
        passcode,
        discriminator,
        vendorid: vendorId,
        productid: productId,
        interval,
        uniqueid: uniqueId,
    });

    await storageManager.close();

    return {
        interval,
        deviceName,
        vendorName,
        passcode,
        discriminator,
        vendorId,
        productName,
        productId,
        port,
        uniqueId,
    };
}