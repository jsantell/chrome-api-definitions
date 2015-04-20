var fs = require("fs");
var join = require("path").join;
var shush = require("shush");
var webidlConvert = require("./blink-webidl-to-json");
var MANIFEST_FILE_NAME = "_api_features.json";
var SUB_APIS = ["common", "chrome"];
var DEFINITION_EXTS = [".json", ".idl"];

/**
 * Takes an API name ("runtime", "cookies") and a root directory
 * that contains both common and chrome APIs, checking common first,
 * returning the entry if it exists from the appropriate `_api_features.json`.
 *
 * @param {string} name
 * @param {string} root
 * @return {object|null}
 */
function getManifestEntry (name, root) {
  var commonManifest = shush(join(root, "common", MANIFEST_FILE_NAME));
  if (commonManifest[name]) {
    return commonManifest[name];
  }
  var chromeManifest = shush(join(root, "chrome", MANIFEST_FILE_NAME));
  if (chromeManifest[name]) {
    return chromeManifest[name];
  }
  return null;
}
exports.getManifestEntry = getManifestEntry;

/**
 * Fetches the JSON definition for an API. Converts the webidl
 * formats if needed.
 *
 * @param {string} name
 * @param {string} root
 * @return {object?}
 */
function getDefinition (name, root) {
  var path = getDefinitionPath(name, root);
  if (!path) {
    return null;
  }
  if (/\.json$/.test(path)) {
    return shush(path)[0];
  }
  return webidlConvert(name, path)[0];
}
exports.getDefinition = getDefinition;

/**
 * Finds the related definition for an API, looking in both
 * common and chrome, and looking for either idl or json types.
 *
 * @param {string} name
 * @param {string} root
 * @return {string?}
 */
function getDefinitionPath (name, root) {
  var nsPath = name.split(".").map(underscoreify);
  var path;
  for (var i in SUB_APIS) {
    for (var j in DEFINITION_EXTS) {
      path = [root, SUB_APIS[i]].concat(nsPath);
      path = join.apply(null, path) + DEFINITION_EXTS[j];
      if (fs.existsSync(path)) {
        return path;
      }
    }
  }
}
exports.getDefinitionPath = getDefinitionPath;

/**
 * Converts "topSites" into "top_sites".
 * 
 * @param {string} string
 * @return {string}
 */
function underscoreify (string) {
  var out = "";
  for (var i = 0; i < string.length; i++) {
    if (/[A-Z]/.test(string[i])) {
      out += "_";
    }
    out += string[i].toLowerCase();
  }
  return out;
}
exports.underscoreify = underscoreify;

/**
 * Takes a `definition` (like from `getDefinition`) object,
 * and appends several properties if relevent:
 *
 * - `content_script: true`
 *   on the root if `content_script` is an allowed context for the root.
 * - `dependencies: []`
 *   on the root if there are manifest or permission requirements for using this package.
 *
 * Additionally, some functions inside of a namespace
 * are also listed in the manifest for fine grained dependencies
 * and contexts, like for "runtime", which has several methods
 * that are allowed in context scripts, and some that require
 * separate permission (runtime.sendNativeMessage).
 *
 * @param {object} definition
 * @param {string} root
 * @return {object}
 */
function attachMeta (definition, namespace, root) {
  var manifest = getManifestEntry(namespace, root);

  if (manifest) {
    if (manifest.contexts && ~manifest.contexts.indexOf("content_script")) {
      definition.content_script = true;
    }
    if (manifest.dependencies) {
      definition.dependencies = JSON.parse(JSON.stringify(manifest.dependencies));
    }
  }

  // If this is a root definition, and it contains functions within
  // the namespace, also attach meta for those.
  if (definition.functions) {
    definition.functions.forEach(function (fn) {
      attachMeta(fn, namespace + "." + fn.name, root);
    });
  }

  return definition;
}
exports.attachMeta = attachMeta;
