**All notable changes to this project are documented in [releases](https://github.com/webelity/hns-wallet/releases). This file is kept for legacy purposes.**

#  Changelog

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [2.1.7] - 2026-06-29
### Added
- Implemented a **Cache-Aside with Background Sync** model for the wallet's transaction history to achieve instant history loading on startup or wallet switch.
- Added transaction caching in the local LevelDB database (`dbClient`) under the key `txs_${net}_${wid}`, rendering cached transactions in the UI immediately.
- Added a background sync process that fetches the latest transaction history from the Handshake node via `walletClient.getTransactionHistory()` and silently updates the local cache and UI.
- Added a global **Theme Management System** supporting both **Light** and **Dark** themes, with the user's preference saved in `localStorage`.
- Added a modern theme toggle button (Sun/Moon vector icons) in the Topbar for quick one-click theme switching.
- Added custom scrollbars optimized for the dark theme.
- Added a modern, cross-OS friendly local font set saved in `app/assets/fonts/` to give the application a clean, updated typography feel.

### Changed
- Optimized the transaction parsing loop to only process new or status-changed transactions, reusing cached transaction data if the pending status matches, which avoids redundant and expensive covenant parsing calls.
- Removed the artificial 1-second delay from the application initialization splash screen, allowing users to log in as soon as the node is ready.
- Modernized the overall UI (cards, inputs, tables, dropdowns, and modals) with smooth transitions, clean borders, and dark-theme optimized.
- Replaced Google Fonts / system font fallbacks with the locally bundled font family.
- Optimized the pagination index generator to use a fixed-width window of 7 elements when total pages >= 7, preventing horizontal layout shifting of navigation arrows when clicking next/prev.
- Updated the supported block explorers list ([explorers.js](app/constants/explorers.js)) to include **HNS Fans** and **Shake Shift**, removing inactive or outdated explorers (HNS Network, Niami, HNScan, Shake Scan, and Block Explorer).
- Updated all app logo, icon, and input references to use the new high-resolution neon logo ([hns-logo-clean.png](app/assets/images/hns-logo-clean.png)).
- Modernized the dropdown menu styling to support both light and dark themes, ensuring high-contrast readability of options.
- Enhanced text contrast across the dark theme, specifically for inactive sidebar links, category headers, transaction lists, search bars, and footer status text.
- Updated status action cards (red, yellow, and green cards) with high-contrast text colors tailored for both themes.
- Themed the Receive section for full dark-theme compatibility, including adding a solid white background to the QR code container for scanability, updating warning icons/titles, and styling the address display border.
- Improved the "Add to Watchlist" button on the domain details page by making the entire container (including the text label and icon) clickable and adding a white heart outline for better visibility in the dark theme.
- Themed the Send Funds section, adding proper outlines, borders, backgrounds, and high-contrast text for all inputs, labels, select boxes, and confirmation screens in the dark theme.
- Corrected the Renewal Queue empty state layout by wrapping the "No domains found" text in a proper table cell with spacing, preventing alignment issues.
- Fixed active filter tab text color in the Your Bids page to be white in the dark theme so it is readable.
- Aligned the DNS Update Speed default fees state key from 'medium' to 'standard' to match what is programmatically in the app, while keeping the estimated DNS update transaction size at 0.5 KB and displaying 'Normal' (0.010000 HNS/KB, approx. 0.00500 HNS per update) as requested, and updated the locale files to replace 'medium' with 'standard'.
- Updated the Topbar to feature the new high-resolution Neon HNS Logo across all views and updated the global default theme to Dark.


### Removed
- Removed "Claim Airdrop or Name" Section from the sidebar menu.

### Fixed
- Fixed Babel build warnings (`useBuiltIns` option not set) and cleaned up verbose build output by configuring `"useBuiltIns": false` and disabling `"debug"` in `babel.config.json`.
- Fixed local font loading Content Security Policy (CSP) violations by updating the policy in `app.html` to permit `'self'` and `file:`, and completely removed external Google Fonts imports.
- Fixed a bug where the Domain Manager details page would fail to load for domains with older or unindexed bids/reveals by wrapping transaction lookups in try-catch blocks.
- Fixed Domain Manager navigation by persisting the current page index in the local database, allowing the back button to restore the user's last viewed pagination page.
- Fixed a regression in Domain Manager row click navigation where users were redirected to the login screen instead of the domain details page.

## [2.1.6] - 2026-06-28
### Added
- Added an additional pagination control at the top of the Domain Manager (below the action buttons and above the search input) by rendering `this.renderControls(namesList)` to improve navigation for users with many domains.
- Added a transaction fee estimation summary block in the Renewal Queue showing the estimated HNS fee, calculated dynamically using the selected speed's fee rate and a corrected size formula (`250` bytes base + `250` bytes per renewal to account for 1 input and 1 output per domain). It also includes an educational note explaining Handshake's no-annual-registry-fee model.
- Added a fee speed selector (Slow, Normal/Standard, Fast) in the Renewal Queue, defaulting to Slow to optimize fee costs for non-urgent renewals, and mapping the selections to the Redux `fees` state.
- Implemented pre-filtering of domain renewal queue items in the wallet service (`renewMany`) to exclude domains in non-renewable states (whose covenant type is not `REGISTER`, `UPDATE`, `RENEW`, or `FINALIZE`—such as those locked in a Shakedex `TRANSFER` state). Non-renewable names are returned as failures with a specific error message (`Name is in a non-renewable state (TRANSFER).`), allowing all other valid renewals in the batch to proceed and succeed instead of causing whole-batch failures.
- Added a "DNS Update Speed" setting to the **Settings -> General** page, allowing users to choose the default transaction speed/fee rate (Slow, Normal, Fast) for updating DNS records.
- Added a dynamic fee estimation display under the DNS Update Speed setting, displaying both the HNS/KB fee rate and the estimated cost in HNS for a typical DNS update transaction (0.5 KB).
- Added Spanish, French, Chinese, Catalan, and placeholder translations for the new DNS Update Speed setting.

### Changed
- Increased the domain renewal queue batch size limit from 100 to `consensus.MAX_BLOCK_RENEWALS` (600) to allow batching up to 600 names at a time, aligning with the Handshake consensus limit, with an automatic fallback to individual renewals (`createrenewal`) if a batch fails.
- Corrected the renewal transaction fee estimation formula to account for one input and one output per domain (approx. 250 bytes per name) plus a base transaction size of 250 bytes.
- Updated `sendUpdate` in the background wallet service and names Redux duck to accept the user-configured `feeRate` and set it via `settxfee` before executing the `createupdate` RPC, enabling custom transaction fee rates to be applied to DNS record updates.
- Aligned the Renewal Queue's `medium` fee option with the Redux store's `standard` fee rate, utilizing the existing `normal` translation key for UI display.
- Changed the background node service's `MIN_FEE` constant from `0.01` to `0.001` HNS/KB to align with the core Handshake (`hsd`) standard minimum relay fee rate (`MIN_RELAY` = `1000` covans/KB).
- Adjusted the online fee estimation caps to scale with the new `MIN_FEE` (`slow` capped at `0.001`, `standard` capped at `0.01` via `MIN_FEE * 10`, and `fast` capped at `0.05` via `MIN_FEE * 50` HNS/KB).
- Updated the offline fallback fee rates for DNS updates, Settings UI, and the Renewal Queue to match the new online minimums: Slow fallback is now `0.001` HNS/KB, Standard is `0.01` HNS/KB, and Fast is `0.05` HNS/KB.

### Fixed
- Fixed a parameter forwarding bug in the Renewal Queue's Redux mapping where the custom `feeRate` was ignored during dispatch, resulting in the wallet falling back to default high fee rates. The `renewMany` action now correctly forwards `feeRate` to the background wallet service, which converts it to base units and passes it as the `rate` option in the `createbatch` RPC call.
- Fixed a discrepancy where the online minimum fee rates were capped at `0.01` HNS/KB while the offline fallbacks were lower (e.g. `0.005` in Renewal Queue), which could cause transaction submission inconsistencies. Setting `MIN_FEE` to `0.001` and adjusting the multipliers resolves this while keeping the network relay requirement met.


## [2.1.5] - 2026-06-27
### Added
- Added support for bulk renewing more than 100 domains at a time in the Renewal Queue.
- Implemented queue processing in batches of 100 names with automatic fallback to individual renewals if a batch fails (e.g. due to the 2-year renewal limit).
- Added a "100" option to the page size selectors in the Domain Manager, Your Bids, and Watching lists.

### Changed
- Improved Domain Manager performance by memoizing the sorting and filtering of names to avoid redundant sorting on every render (such as when checking boxes or paginating).
- Optimized Domain Manager memory and CPU usage by replacing the expensive `.join('')` comparison in `shouldComponentUpdate` with an instantaneous object reference check, and removing `namesList` from the Redux mapping.
- Added persistence for the Domain Manager's sort order (column and direction) so that sorting settings are retained across page refreshes.
- Changed the domain renewal queue to be specific to the logged-in user's wallet (scoped by wallet ID) instead of shared globally across all wallets.
- Added automatic migration of legacy global renewal queue data to the wallet-specific queue on first load.
- Updated the sidebar to automatically reload the renewal queue when switching between wallets.

### Fixed
- Fixed a bug on the Watching and Your Bids pages where the fuzzy search index became stale and failed to reflect newly added/removed watched domains or newly placed bids.
- Fixed a bug on the Watching and Your Bids pages where the pagination controls did not update based on active search results.
- Optimized fuzzy search performance on the Watching and Your Bids pages by memoizing search results to avoid redundant search queries on every render.


## [2.1.4] - 2026-06-27
### Added
- Implemented a custom Right-Click Context Menu with inspection and editing tools.
- Added UI sorting to the Domain Manager (sort by Domain, Expires On, and HNS Paid).
- Complete branding update using new neon Handshake Wallet logo assets.
- Added multi-select capability for domain names in the Domain Manager.
- Added a Renewal Queue modal that executes renewals sequentially after entering the wallet password once.
- Added localization support for multi-select renewals across English, Spanish, French, Catalan, and Chinese.
- Created ATTRIBUTION.md to properly credit original authors and protocol developers.
- Added a Commercial and Proprietary License Exception for all 2026+ contributions while preserving the original GPLv3 license for existing code.
- Updated README.md and BUILD.md for Handshake Wallet rebranding.

## [UNRELEASED]
2020-09-04
 Added the ability to perform paid name swaps. Protocol courtesy of Matthew Zipkin

## [0.5.0] - 2020-09-04
### Fixed
- Fixed long startup times by not waiting for the node to open connections or start sync before
  registering the node as started.
- Fixed native JS backend on Windows
- Fixed inability to enter bid amounts as zero

### Added

- Added the ability to use custom RPC providers

## [0.4.0] - 2020-07-05
### Added
- Added the ability to initiate transfers from the Bob UI

## [0.3.0] - 2020-06-08
### Fixed
- Fixed total amount received by a transaction with multiple outputs to the wallet
- Fixed sluggish UI from mass of redundant rpc calls on "Your Bids" view
- Fixed a bug where lots of names would not appear

### Added
- Added warning for missing bid values and functionality to repair missing bids
- Added wallet action in Settings page to delete unconfirmed transactions
- Added "Rescan Auction" button to import name into wallet and discover existing bids
- Automatically rescan auction if a user bids on a name that is not already in the wallet
- Introduce "Wallet Sync" modal that blocks UI and displays wallet rescan progress

### Changed
- Switch bcrypto backend to native for remarkable performance improvements
- Total Balance is now the "unconfirmed" balance from hsd. Unlocked balance is replaced
with "spendable" balance which is total unconfirmed minus total locked coins
- Covenants in portfolio view now display their value as it affects spendable balance
- Improvements to maxSend based on spendable balance and cleaner fee estimation
- Bob will ask user for passphrase whenever private key is needed (e.g. send TX)
- Bob will no longer "logout" when underlying hsd wallet is locked, however
Bob will still lock the hsd wallet on logout or idle timeout

## [0.2.8] - 2020-03-17
### Fixed
- Fixed a crash when names transitioned from the bidding to revealing state

## [0.2.7] - 2020-03-16
### Added
- Added an additional warning to the reset screen to highlight how bids need to be re-imported after deleting a wallet
- Added an HNScan link to the transaction confirmation dialog

### Fixed
- Fixed date calculations on auction screens
- Fixed auction pages to show "Coming Soon" when auctions aren't available yet
- Fixed copy on the "Get Coins" screen to accurately reflect when the [hs-airdrop](https://github.com/handshake-org/hs-airdrop) snapshot was taken

### Changed
- Leading and trailing whitespace is now removed before verifying seed phrases
- Updated copy on the auctions screen to say "Your Bids," rather than "Bid History," which more accurately reflects the data being displayed

### Removed
- Removed broken "add to calendar" functionality

## [0.2.6] - 2020-02-14
### Added
- Added a feature to specify custom fee rates
- Added links to HNScan on the transactions page

## [0.2.5] - 2020-02-14
### Fixed
- Fixed an error in which balances did not automatically update on the account screen

### Changed
- Changed fee estimation screen to properly account for how the fee is a rate, not a flat fee per transaction 

## [0.2.4] - 2020-02-14
### Fixed
- Upgraded HSD to a version without mempool issues 

## [0.2.3] - 2020-02-11
### Changed
- Disable airdrop functionality until block 2016
- Made transaction activation alerts dynamic
- Made node start/stop functionality node robust

### Fixed
- Fixed a crash while updating domain name records
- Fixed various minor copy issues

## [0.2.2] - 2020-02-10
### Fixed
- Fixed an issue where chainstate was wiped when mainnet wallets are reset. This means that Bob no longer needs to perform a sync from zero after resetting mainnet wallets
- Fixed an issue where Windows machines might time out restarting Bob
- Fixed an issue where the error displayed when `hsd`'s ports are in use displayed as `undefined` on the splash screen 

## [0.2.1] - 2020-02-03
### Fixed
- Fixed an issue where mainnet wallets could not be regenerated

## [0.2.0] - 2020-02-03
### Added
- Enabled mainnet/testnet networks
- Added support for Windows
- Added a message alerting users that transactions are disabled for the first two weeks following mainnet

### Changed
- `hsd` updated to latest pre-mainnet version
- Record management updated to reflect latest `hsd` changes
    - All record types except `NS`, `DS`, `GLUE4/6`, `SYNTH4/6`, and `TXT` have been removed
- Removed some unused internal methods
- Added release information to Sentry
- Log application crashes on startup to Sentry

### Fixed
- Fix the GitHub link on the Add Funds screen
- Fixed transaction ordering
- Increase FS lock detection timeout

## [0.1.1] - 2020-01-22
### Fixed
- Fixed broken `isDev` flag in analytics service.

### Changed
- Bump `webpack-bundle-analyzer` in response to automatic security vuln [PR #78](https://github.com/kyokan/bob-wallet/pull/78)
    - NOTE: This vulnerability does not affect production Bob clients, since `webpack-bundle-analyzer` is only used for internal build tooling.  

## [0.1.0] - 2020-01-21
### Added

- Initial public beta release
