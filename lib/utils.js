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
    return shush(path);
  }
  return webidlConvert(name, path);
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
