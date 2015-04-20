# chrome-api-definitions

Definition generator for Chrome Platform APIs.

Uses the Chromium extension definitions (both [common](https://code.google.com/p/chromium/codesearch#chromium/src/extensions/common/api/) and [chrome](https://code.google.com/p/chromium/codesearch#chromium/src/chrome/common/extensions/api/) definitions) for the [Chrome Platform APIs](https://developer.chrome.com/extensions/api_index) and constructs a manifest of all available platform APIs for extensions.

While the [original manifests](https://code.google.com/p/chromium/codesearch#chromium/src/chrome/common/extensions/api/_api_features.json) defines permissions, allowable contexts, and other metadata describing the namespace (sometimes a specific method inside a namespace also has this meta), the full definition of the available methods, types and objects exposed in the API is defined by either JSON or (Blink's version of) WebIDL. This constructs a structure listing all available APIs with their appropriate meta from the manifest, as well as the available entities inside of that namespace.

Parsing the Blink WebIDL here is a horrible hack to get it similar to the APIs with JSON definitions, but gets us close enough.

## License

For chrome-api-defintions: *MIT License, Copyright (c) 2015 Jordan Santell*

For API manifests from Chromium source: *Modified BSD License, Copyright 2014 The Chromium Authors. All rights reserved.*
