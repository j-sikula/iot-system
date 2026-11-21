Using `matter.js` library - creates Matter controller (accept new devices) and Matter bridge to MQTT

## Get started

Install dependencies
```bash
npm install
```

Add secrets into `.env`

```
MQTT_PASSWORD = "password"
```

Run Matter controller script
```bash
npx tsx --env-file=.env src/index.ts
```

Run emulator of CO2 sensor
```bash
npx tsx src/sensor_emulator.ts
```

### Running using `systemd`


Check the service status and live logs:

```bash
sudo systemctl status matter-controller.service
```

To view the actual console output (or troubleshoot if it fails to start):

```bash
journalctl -u matter-controller.service -f
```

Restart script
```bash
sudo systemctl restart matter-controller.service
```

#### Initialization

```bash
sudo nano /etc/systemd/system/matter-controller.service
```


Paste the `matter-controller.service`
Save and exit (`Ctrl+O`, `Enter`, then `Ctrl+X` in nano).

*Verification:* Run `cat /etc/systemd/system/matter-controller.service` to confirm the file was saved with no remaining `<...>` placeholders.


Tell `systemd` to read the new file, enable it to start on boot, and launch it immediately:

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now matter-controller.service
```

*Verification:* You should see a message stating `Created symlink /etc/systemd/system/multi-user.target.wants/matter-controller.service...` with no errors.


## Installation 
Google Gemini Pro "How to start with building matter.js? i should clone repo and then somehow run it? Can you show me that based on documentation? "

Cloning the repository is only necessary if you want to contribute to the `matter.js` source code or run their pre-built testing examples. To build your own custom bridge, the official and clean approach is to initialize a completely new Node.js project and install the `matter.js` libraries via NPM.

Because `matter.js` relies heavily on strict data typing for its clusters (like knowing exactly what data type a Temperature measurement should be), the project must be built using TypeScript.

Here is how to set up the foundation of your Matter Controller from scratch on your Raspberry Pi.

1. **Install Node.js:** Node v20 LTS.
Raspberry Pi OS Lite does not come with Node.js pre-installed. Install the official NodeSource repository to get the current LTS version of Node.js.

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

```

for macOS
```bash
brew install fnm

echo 'eval "$(fnm env --use-on-cd)"' >> ~/.zshrc
source ~/.zshrc
```
For fnm to work every time you open a new terminal window, you need to add it to your Mac's .zshrc configuration file and reload it.
```bash
fnm install 20
fnm use 20
```

*Verification:* Run `node -v` and `npm -v`. Both should return version numbers (e.g., `v20.x.x`).


2. **Initialize the Project and Install Dependencies:** 2 min.
Create a dedicated folder for your bridge, initialize an empty NPM project, and install the core `matter.js` packages alongside TypeScript. We also install `tsx`, a lightweight engine for executing TypeScript files directly.

```bash
#mkdir ~/matter-bridge && cd ~/matter-bridge
npm init -y
npm install @matter/main @matter/node mqtt
npm install -D typescript @types/node tsx
npm install express
npm install -D @types/express
npm install @matter/nodejs-ble
```

*Verification:* Run `ls -l`. You should see a `node_modules` folder, `package.json`, and `package-lock.json`.

For emulator of device encapsulation of network required
```bash
npm install @matter/nodejs
```


3. **Configure TypeScript:** tsconfig.json.
Generate the TypeScript configuration file and set it to use modern ES modules, which `matter.js` requires.

```bash
npx tsc --init
nano tsconfig.json

```

Replace the contents with this strict configuration:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"]
}

```

*Verification:* The file saves successfully. Ensure your `package.json` also has `"type": "module"` added to it. You can run `npm pkg set type="module"` to do this instantly.




5. **Execute the Controller:** 1 min.
Run the TypeScript file directly using the `tsx` engine we installed earlier.

```bash
npx tsx src/index.ts

```

### Thread network

Install packages for BLE
```bash
sudo apt update
sudo apt install -y bluetooth bluez libbluetooth-dev libudev-dev build-essential
```

Unblock BLE and enable
```bash
sudo rfkill unblock bluetooth
sudo hciconfig hci0 up
```
Check (should be up running)
```bash
hciconfig
```

grant permissions
```bash
sudo setcap cap_net_raw+eip $(eval readlink -f $(which node))
```

get thread credentials:
```bash
sudo ot-ctl networkname
```

```bash
sudo ot-ctl dataset active -x
```


