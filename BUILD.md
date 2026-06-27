# Build Instruction

### MacOS

1. uninstall gmp by running `brew uninstall gmp --ignore-dependencies`
2. run `npm run package-mac` (see [README](./README.md) for cross-arch build)
3. reinstall gmp by running `brew install gmp`
4. notarize the DMG by running `xcrun altool --notarize-app --primary-bundle-id "{bundle-id}" --username "{username}" --password "{password}" --asc-provider "{asc-provider-id}" --file ./release/hns-wallet*.dmg`
5. you can check notarization status by running `xcrun altool --notarization-info "{notarization-id}" --username "{username}" --password "{password}"`

### Windows

1. Simply build with
   ```sh
   npm run package-win
   ```
2. The `.msi` file will be placed in `./release/`.

### Linux

1. Simply build with
   ```sh
   npm run package-linux
   ```
2. The `.AppImage` file will be placed in `./release/`.

### Common

1. Create a checksum file for all binaries with
   ```sh
   # say only latest versions of Handshake Wallet binaries are in current directory
   sha256sum hns-wallet* > SHA256SUMS-2.1.4.txt
   ```
2. Verify it with
   ```sh
   sha256sum -c SHA256SUMS-2.1.4.txt
   ```
