# Building Handshake Wallet from Source

This guide provides step-by-step instructions for setting up a development environment, installing platform-specific dependencies, and packaging Handshake Wallet for production.

## Prerequisites

- **Node.js**: Recommended v16.
- **npm**: Installed with Node.js.

---

## Setting Up for Development

1. Clone the repository and install dependencies:
   ```bash
   git clone https://github.com/webelity/hns-wallet.git
   cd hns-wallet
   npm install
   ```

2. Start the application in development mode:
   ```bash
   npm run dev
   ```
   *Tip: You can tail the log output or configure a "personal mainnet" node for testing. See the [developer guide](https://gist.github.com/pinheadmz/314aed5123d29cb89bfc6a7db9f4d02e) by [@pinheadmz](https://github.com/pinheadmz) for advanced setup tips.*

---

## Platform-Specific Build Instructions

### macOS

Due to Ledger USB integration, additional dependencies are required. If you are on an Apple Silicon (M1/M2) Mac, Node.js v16+ is highly recommended.

1. Install system dependencies:
   ```bash
   brew install libusb
   ```
2. (Optional) For macOS packaging, install `dmg-license`:
   ```bash
   npm install dmg-license
   ```
3. Temporarily uninstall `gmp` to prevent linking issues during packaging:
   ```bash
   brew uninstall gmp --ignore-dependencies
   ```
4. Build the application package for your native architecture:
   ```bash
   npm run package-mac
   ```
   *Note: If you are on Apple Silicon but need to build for Intel Macs, downgrade to Node.js v14 or re-install Node.js v16 for x86. You must also have `libunbound` available as an x86 package. Then run:*
   ```bash
   npm run package-mac-intel
   ```
5. Reinstall `gmp`:
   ```bash
   brew install gmp
   ```
6. Notarize the DMG:
   ```bash
   xcrun altool --notarize-app --primary-bundle-id "com.webelity.hns-wallet" --username "{username}" --password "{password}" --asc-provider "{asc-provider-id}" --file ./release/hns-wallet*.dmg
   ```
7. Check notarization status:
   ```bash
   xcrun altool --notarization-info "{notarization-id}" --username "{username}" --password "{password}"
   ```

The output application will be located in the `/release/mac` or `/release/mac-arm64` directory.

### Windows

To package the application on Windows:

1. Build the MSI installer:
   ```powershell
   npm run package-win
   ```
2. The `.msi` installer will be generated in the `./release/` directory.

### Linux

Linux builds require additional libraries for Ledger USB integration.

1. Install system dependencies:
   ```bash
   sudo apt-get install libusb-1.0-0-dev libudev-dev
   ```
2. Build the AppImage package:
   ```bash
   npm run package-linux
   ```
3. The `.AppImage` executable will be placed in the `./release/` directory.

#### Ledger USB Permissions on Linux
To allow the application to access your Ledger device, you must configure udev rules. Run the following command:
```bash
wget -q -O - https://raw.githubusercontent.com/LedgerHQ/udev-rules/master/add_udev_rules.sh | sudo bash
```

---

## Verifying Release Binaries

To generate and verify checksums for release builds:

1. Create a checksum file of the built binaries (run this from the release output directory):
   ```bash
   sha256sum hns-wallet* > SHA256SUMS-2.1.6.txt
   ```
2. Verify the checksums:
   ```bash
   sha256sum -c SHA256SUMS-2.1.6.txt
   ```
