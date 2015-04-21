# chrome-api-definitions

[![Build Status](http://img.shields.io/travis/jsantell/chrome-api-definitions.svg?style=flat-square)](https://travis-ci.org/jsantell/chrome-api-definitions)
[![Build Status](http://img.shields.io/npm/v/chrome-api-definitions.svg?style=flat-square)](https://www.npmjs.org/package/chrome-api-definitions)

Definition generator for Chrome Platform APIs.

Uses the Chromium extension definitions (both [common](https://code.google.com/p/chromium/codesearch#chromium/src/extensions/common/api/) and [chrome](https://code.google.com/p/chromium/codesearch#chromium/src/chrome/common/extensions/api/) definitions) for the [Chrome Platform APIs](https://developer.chrome.com/extensions/api_index) and constructs a manifest of all available platform APIs for extensions.

While the [original manifests](https://code.google.com/p/chromium/codesearch#chromium/src/chrome/common/extensions/api/_api_features.json) defines permissions, allowable contexts, and other metadata describing the namespace (sometimes a specific method inside a namespace also has this meta), the full definition of the available methods, types and objects exposed in the API is defined by either JSON or (Blink's version of) WebIDL. This constructs a structure listing all available APIs with their appropriate meta from the manifest, as well as the available entities inside of that namespace.

Parsing the Blink WebIDL here is a horrible hack to get it similar to the APIs with JSON definitions, but gets us close enough.

## Output

Pretty much an array of all specified APIs (by `filter` config), using the [JSON definitions](https://github.com/jsantell/chrome-api-definitions/blob/master/api/chrome/tabs.json) from Chromium if they exist, or otherwise using the WebIDL version for something that attempts to get pretty close.

Root APIs (like `alarms` or `devtools.inspectedWindow`) also now have properties of `permissions` and `content_script`, if these were defined in the Chromium manifest, for example:

```
{
  "namespace": "storage",
  "dependencies": ["permission:storage"],
  "content_script": true
}
```

When defined in the manifest, an API's methods can also have this additional information (only `runtime` and `extensions` API have individual methods in the manifest, AFAIK).

```
{
  "namespace": "runtime",
  ...
  "functions": [{
    "name": "sendMessage",
    "content_script": true
  }, {
  ...
  }]
}

```

View [built output of stable APIs](https://github.com/jsantell/chrome-api-definitions/blob/master/output/stable.json) for the most illumination.

## API

#### getDefinitions(options)

Returns the definition for the specified APIs as an object. Options:

* `filter` - provide an array of namespaces to filter by, or use a string to specify a preset in `api-names.json`. Defaults to the preset `"stable"`.
* `apiRoot` - path to the directory containing both `common` and `chrome` APIs. Uses the directory in `./api` by default. Not tested.

#### saveDefinitions(options)

Same as `getDefinitions()` except it just saves to disk. Takes the same options as `getDefinitions()`, plus:

* `dest` - path of where the definition should be saved.


## License

For chrome-api-defintions: *MIT License, Copyright (c) 2015 Jordan Santell*

For API manifests from Chromium source: *Modified BSD License, Copyright 2014 The Chromium Authors. All rights reserved.*
