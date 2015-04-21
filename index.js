var join = require("path").join;
var fs = require("fs");
var PRESETS = require("./api-names.json");
var utils = require("./lib/utils");
var API_ROOT = join(__dirname, "api");
var JSON_PRETTY_INDENT = 2;

/**
 * Generates definitions scoped by `filter`, the preset name related to
 * APIs listed in `api-names.json`. Can also provide an array of a unique
 * list of API namespaces.
 *
 * @param {string|Array<string>} filter
 * @param {string?} apiRoot
 * @return {object}
 */
function getDefinitions (options) {
  options = options || {};

  var filter = Array.isArray(options.filter) ? options.filter : (PRESETS[options.filter] || PRESETS.stable);
  var apiRoot = options.apiRoot || API_ROOT;

  return filter.map(function (api) {
    var def = utils.getDefinition(api, apiRoot);
    utils.attachMeta(def, api, apiRoot);
    return def;
  });
}
exports.getDefinitions = getDefinitions;

/**
 * Generates definitions scoped by `filter`, the preset name related to
 * APIs listed in `api-names.json` and saves it to `dest`.
 *
 * @param {string|Array<string>} filter
 * @param {string?} apiRoot
 * @param {string} dest
 */
function saveDefinitions (options) {
  options = options || {};

  var dest = options.dest;

  var defs = getDefinitions(options);
  fs.writeFileSync(dest, JSON.stringify(defs, null, JSON_PRETTY_INDENT));
}
exports.saveDefinitions = saveDefinitions;
