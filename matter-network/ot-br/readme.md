# OpenThread Border Router

## Installation
[Tutorial](https://openthread.io/guides/border-router/prepare) 
### OTBR
```bash
git clone --recursive --depth=1 https://github.com/openthread/ot-br-posix

cd ot-br-posix
./script/bootstrap
INFRA_IF_NAME=eth0 ./script/setup
./script/server
```


Check status 
```bash
sudo service otbr-agent status
```
List of errors:
```bash
sudo journalctl -u otbr-agent -n 20 --no-pager
```
To restart
```bash
sudo systemctl restart otbr-agent
```

### Radio co-processor

Compile firmware at PC (for example MacOS):

according to https://github.com/openthread/ot-nrf528xx/blob/main/src/nrf52840/README.md

* Skip `./script/bootstrap` (it is mainly for Linux) and install the ARM toolchain via **Homebrew** instead.
* Skip `nrfjprog` (that is for the nRF52840 DK with a J-Link debugger). Your PCA10059 dongle flashes directly over USB using its built-in DFU bootloader.

### 1. Install Build Tools on macOS

Install `cmake`, `ninja`, and the ARM Cortex-M GCC toolchain via Homebrew:

```bash
brew install cmake ninja
brew install --cask gcc-arm-embedded

```

Verify the compiler is in your `PATH`:

```bash
arm-none-eabi-gcc --version

```

### 2. Clone `ot-nrf528xx` and Initialize Submodules

```bash
git clone --recursive https://github.com/openthread/ot-nrf528xx.git
cd ot-nrf528xx
git submodule update --init --recursive

```

### 3. Build the RCP Firmware for the PCA10059 Dongle

Use the exact PCA10059 flags from the README (`USB_trans` for native USB CDC ACM, and `-DOT_BOOTLOADER=USB` so the firmware starts at the right flash offset and doesn't overwrite the USB bootloader):

```bash
./script/build nrf52840 USB_trans -DOT_BOOTLOADER=USB
```

### 4. Convert `ot-rcp` to `.hex`

Make sure you convert **`ot-rcp`** (not `ot-cli-ftd` from the README example):

```bash
arm-none-eabi-objcopy -O ihex build/bin/ot-rcp ot-rcp.hex
```


Package `ot-rcp.hex` as a DFU `.zip` and flash it

nRF Connect Programmer accepts DFU `.zip` packages directly (just drag-and-drop the `.zip` instead of the `.hex`), or you can flash it straight from your Mac terminal with `nrfutil`:

1. Install Nordic's official `nrfutil` on your Mac (via Homebrew or direct download) and install the `nrf5sdk-tools` plugin:
```bash
brew install --cask nrfutil
nrfutil install nrf5sdk-tools
```
*Verification:* Run `nrfutil nrf5sdk-tools --help` and confirm `pkg` and `dfu` are listed.

2. Generate the DFU `.zip` package with `--sd-req 0x00` (if your dongle has no SoftDevice) or `--sd-req 0xAE,0xCA,0x00` (covers both blank and SoftDevice-equipped factory dongles):
```bash
nrfutil pkg generate --hw-version 52 --sd-req 0x00,0xAE,0xCA \
  --application ~/Desktop/ot-rcp.hex --application-version 1 ~/Desktop/ot-rcp.zip
```


*Verification:* Confirm `~/Desktop/ot-rcp.zip` is created.

3. **Either** drag `ot-rcp.zip` into **nRF Connect Programmer** and click **Write**, **or** flash it directly from your Mac terminal while the red LED is pulsing:
```bash
ls /dev/cu.usbmodem*
nrfutil dfu usb-serial -pkg ~/Desktop/ot-rcp.zip -p /dev/cu.usbmodem<YOUR_ID>
```
*Verification:* The tool prints `Device programmed.`, the pulsing red LED stops, and the dongle reboots into RCP mode.


### Config Thread network

```bash
sudo ot-ctl
```
