# TONUtility

This module contains general purpose classes and functions.
The tasks provided by TONUtility can be separated into groups:
- String helper.
- Async helper.
- Data fectching.
- Cache management.
- Logging.
- Multithreading.
 
# Installation

At now this module is included in TONWalletCore package and doesn't require any additional steps to install.

# Usage

This module requires initial `async` setup when integrated into app or test suite:
```javascript
async function setupApp() {
    // ...
    await TONUtility.setup();
    // ...
}
``` 

# String Helpers

String realted tasks incorporated in static TONString class.

# Async Helpers

Async tasks resided in static TONAsync class.


