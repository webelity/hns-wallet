<p align="center"><img src="./resources/icons/logowithtext.png"></p>

# Handshake Wallet: The Ultimate Desktop Client for the Handshake Protocol

**Handshake Wallet** is the premier, non-custodial desktop wallet and full-node manager for the [Handshake](https://handshake.org) network. Engineered for domain investors (DLDers), developers, and crypto pioneers, Handshake Wallet combines bank-grade security with an elegant user interface to make securing, managing, and bidding on decentralized digital identities effortless.

**Status**: This is beta software. As with all wallet GUIs, please use with care and at your own risk.

---

## Key Features

- **Decentralized Domain Auctions**: Participate in Handshake TLD auctions directly from the UI. Open auctions, place bids, reveal them, and claim your decentralized digital real estate seamlessly.
- **High-Performance Bulk Renewals**: Save time and optimize network fees with multi-select bulk domain renewals (supporting up to 600 names per block) and bulk transfers.
- **Smart Fee Estimation & Speed Selector**: Predict and optimize your transaction costs using the built-in fee estimator and speed selector (Slow, Medium, Fast) tailored for non-urgent renewals.
- **Pre-Filtered Renewal Queue**: Bypasses non-renewable states (e.g. Shakedex `TRANSFER` lockups) automatically, ensuring valid renewals in a batch succeed without whole-batch failures.
- **Advanced Domain Manager**: Easily search, sort, and paginate through thousands of domains. Features a custom right-click context menu, persistent sorting settings, and CSV exports.
- **DNS Record Management**: Configure `NS`, `DS`, `TXT`, and `GLUE` records locally, maintaining absolute sovereign control over your domains.
- **Integrated Full Node**: Runs an integrated `hsd` full node or connects to custom RPC providers for maximum privacy, speed, and decentralization.
- **Hardware Wallet Integration**: Connect your Ledger device for secure cold storage.
- **Developer Airdrop Claims**: Claim your developer airdrops directly and securely.

---

## How to Install Handshake Wallet

Most users should download the prebuilt binaries from the [releases](https://github.com/webelity/hns-wallet/releases) page.

Always look for the [latest](https://github.com/webelity/hns-wallet/releases/latest) version.

* **macOS:** `.dmg` (x86 = Intel; arm64 = Apple Silicon)
* **Windows:** `.msi`
* **Linux:** `.AppImage`

For macOS users, Handshake Wallet is also available through the [Homebrew](https://github.com/homebrew/brew) package manager:

```bash
brew install webelity/hns-wallet
```

### Verify Downloaded Binaries

1. Download the `SHA256SUMS.asc` file included in the release.
2. Paste the file's content into https://keybase.io/verify and click **Verify**.
3. Ensure the file's signer is a trusted signer mentioned in [SECURITY.md](SECURITY.md#trusted-pgp-keys).
4. Compare the checksum of your downloaded Handshake Wallet app file:

```bash
# Linux
sha256sum hns-wallet-2.1.6.AppImage

# Windows
certUtil -hashfile hns-wallet-2.1.6.msi SHA256

# macOS
shasum -a 256 hns-wallet-2.1.6-x86.dmg
shasum -a 256 hns-wallet-2.1.6-arm64.dmg
```

For more details and advanced PGP signature verification, see [PR #612](https://github.com/webelity/hns-wallet/pull/612).

---

## Uninstall

Handshake Wallet can be uninstalled from your OS apps list. This **does not** delete any blockchain and wallet data.

To completely remove all stored data, delete the `hns-wallet` directory which can be found in *Settings -> General*. If Handshake Wallet was installed with brew, then `brew uninstall --zap webelity/hns-wallet` will do this for you.

> [!CAUTION]
> Since this deletes wallet data, be sure to **backup your seed phrases** first.

---

## Contributing & Developer Guide

Contributions are most welcome! Whether you are an individual developer looking to add features, fix bugs, or improve documentation, feel free to reach out.

Inquiries to integrate with hardware wallets, ecosystem DNS/website infrastructure, and offers to collaborate with other Handshake-aligned projects are also highly welcome.

### Building From Source

For detailed instructions on setting up your local development environment, installing platform-specific dependencies (such as Ledger USB support), and packaging binaries for macOS, Windows, or Linux, please refer to the [Build Guide](BUILD.md).

---

## Reporting Issues

We have no officially sanctioned or administered support/development channels, so this list will be periodically updated as the community develops.

### Non-Security Issues

Please report issues using GitHub issues on this repository. Please file bugs with the provided template.

### Security Issues

See [SECURITY.md](SECURITY.md#reporting-a-vulnerability).

---

## License

This project is licensed under the [GNU General Public License v3.0](LICENSE).
For 2026+ contributions, a Commercial and Proprietary License Exception applies while preserving the original GPLv3 license for existing code (see [ATTRIBUTION.md](ATTRIBUTION.md) for details).
