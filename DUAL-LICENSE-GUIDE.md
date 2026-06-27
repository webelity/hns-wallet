# Dual Licensing Guide

## Overview

This project implements a dual-licensing model to balance open-source heritage with proprietary development:

- **GPL-3.0:** Original Bob Wallet code and pre-2026 derivatives
- **Proprietary:** New code and features (2026 onwards)

## Quick Reference

| Code Component | License | Rights |
|---|---|---|
| Original Bob Wallet | GPL-3.0 | Free to use, study, modify, distribute |
| Pre-2026 Modifications | GPL-3.0 | Free to use, study, modify, distribute |
| New Code (2026+) | Proprietary | Restricted, contact for commercial use |

## File-Level Licensing

### Identifying the License

Each source file should include a header indicating which license applies:

**GPL-3.0 File Header:**
```javascript
/*
 * SPDX-License-Identifier: GPL-3.0-or-later
 * 
 * This file is part of HNS Wallet, derived from Bob Wallet.
 * Original: https://github.com/kyokan/bob-wallet
 * 
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 */
```

**Proprietary File Header:**
```javascript
/*
 * SPDX-License-Identifier: Proprietary
 * Copyright (c) 2026 webelity project. All rights reserved.
 * 
 * This software is proprietary and confidential.
 * See LICENSE-PROPRIETARY for terms.
 */
```

## Rights & Restrictions

### Under GPL-3.0 (Original & Pre-2026 Code)

✅ **You have the right to:**
- Use the software for any purpose
- Modify and create derivative works
- Distribute copies of the software
- Distribute your modifications
- Access the complete source code

⚠️ **You must:**
- Include a copy of the GPL-3.0 license
- Provide access to source code
- Disclose any modifications
- Apply GPL-3.0 to derivative works

### Under Proprietary License (New Code 2026+)

❌ **You cannot:**
- Copy, modify, or create derivative works
- Distribute or sell the software
- Reverse engineer or decompile
- Use for commercial purposes without permission

✅ **Available through:**
- Contact with webelity project
- Custom commercial license agreement
- Specific use agreements

## Contributing

### Contributing to GPL-3.0 Code
When modifying existing GPL-3.0 code:
1. Changes remain under GPL-3.0
2. Include GPL-3.0 header in modified files
3. Document changes clearly
4. Credit original Bob Wallet project

### Contributing New Features
For entirely new code (2026+):
1. Propose feature with license designation
2. Get approval from maintainers
3. Include appropriate license header
4. Follow code style guidelines

**Important:** Mixing GPL-3.0 and proprietary code requires careful architecture to avoid GPL copyleft requirements.

## Licensing Scenarios

### Scenario 1: Using HNS Wallet as a Reference
✅ **Allowed if:**
- You only reference GPL-3.0 code sections
- You comply with GPL-3.0 terms
- You properly attribute Bob Wallet project
- You don't use proprietary code

❌ **Not allowed if:**
- You use proprietary code without license
- You fail to provide source code access
- You don't include GPL-3.0 license text

### Scenario 2: Commercial Deployment
You want to use HNS Wallet for commercial purposes:

**Option A: Use GPL-3.0 Code Only**
- Must comply with GPL-3.0
- Must provide source code to users
- Can provide paid support/services

**Option B: Negotiate Commercial License**
- Contact webelity project
- Negotiate custom license terms
- Pay applicable fees (if required)
- Use proprietary features commercially

### Scenario 3: Building Extensions
You want to build on top of HNS Wallet:

**If extending GPL-3.0 code:**
- Your extensions must be GPL-3.0
- Must distribute source code
- Must credit Bob Wallet

**If extending proprietary code:**
- Requires commercial license agreement
- Terms negotiated separately
- Cannot distribute as GPL-3.0

## License Text Locations

- **Full GPL-3.0 License:** `LICENSE`
- **Proprietary License:** `LICENSE-PROPRIETARY`
- **Attribution Details:** `ATTRIBUTION.md`
- **This Guide:** `DUAL-LICENSE-GUIDE.md`

## FAQ

**Q: Can I use HNS Wallet for commercial purposes?**
A: Yes, if you use only GPL-3.0 code and comply with GPL-3.0 terms (including source disclosure). For proprietary code, contact webelity project for a commercial license.

**Q: Do I need to share my modifications?**
A: Only if your modifications are GPL-3.0 code and you distribute them. Proprietary code modifications are not required to be shared.

**Q: What if I find a bug in GPL-3.0 code?**
A: Feel free to fix it and submit a pull request. Your fix remains GPL-3.0. You can also fix proprietary code bugs for your own use but cannot distribute those fixes.

**Q: Can I fork this repository?**
A: Yes, you can fork and use GPL-3.0 code under GPL-3.0 terms. Proprietary code usage in your fork requires explicit permission.

**Q: What about the original Bob Wallet project?**
A: We maintain full respect for Bob Wallet's GPL-3.0 license. All credit and attribution remain with the original project.

## For More Information

- **GPL-3.0 Details:** https://www.gnu.org/licenses/gpl-3.0.html
- **Original Bob Wallet:** https://github.com/kyokan/bob-wallet
- **Commercial Licensing:** Contact webelity project
- **Questions:** See ATTRIBUTION.md

---

*Last Updated: 2026*
