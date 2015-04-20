var fs = require("fs");
var parseWebIDL = require("./blink-webidl-parser").parse;

var TYPES = [
  { json: "integer", webidl: ["byte","octet","short","unsigned short","long","unsigned long","long long","unsigned long long"]},
  { json: "number", webidl: ["float", "unrestricted float", "double", "unrestricted double"] },
  { json: "string", webidl: ["DOMString"] },
  // Special case, no converting
  { json: "$SELF$", webidl: ["any", "boolean", "object"] },
];

/**
 * Takes a path to a webidl file, parses it (with ./blink-webidl)
 * and attempts to turn it as closely as possible to the JSON-forms
 * of the structure provided in Chromium.
 *
 * @param {string} path
 * @return {string}
 */
function convert (namespace, path) {
  var webidl = parseWebIDL(fs.readFileSync(path, "utf8"));
  // Store callbacks separately, as they're not defined in the final
  // JSON, but we can expand them when they're used as arguments
  // or parameters elsewhere.
  var callbacks = [];

  var json = webidl.reduce(function (json, item) {
    if (item.type === "interface" && item.name === "Functions") {
      json.functions = convertFunctions(item);
    }
    else if (item.type === "interface" && item.name === "Events") {
      json.events = convertEvents(item);
    } else if (item.type === "dictionary") {
      (json.types = json.types || []).push(convertDictionarys(item));
    } else if (item.type === "enum") {
      (json.types = json.types || []).push(convertEnum(item));
    } else if (item.type === "callback") {
      callbacks.push(item);
    }
    return json;
  }, {});

  expandCallbacks(json, callbacks);

  json.namespace = namespace;
  return [json];
}
module.exports = convert;

function convertEnum (item) {
  return clean({
    id: item.name,
    type: "string",
    enum: item.values
  });
}

function convertDictionarys (item) {
  return clean({
    id: item.name,
    type: "object",
    properties: convertProperties(item.members),
  });
}

function convertEvents (item) {
  return item.members.map(function (member) {
    return clean({
      name: member.name,
      type: "function",
      parameters: convertProperties(member.arguments, true)
    });
  });
}

function convertFunctions (item) {
  return item.members.map(function (member) {
    return clean({
      name: member.name,
      type: "function",
      parameters: convertProperties(member.arguments, true),
      static: member.static
    });
  });
}

/**
 * Takes the almost-final output in the JSON form and replace
 * instances of callback identifiers in function parameters
 * with the type defined.
 *
 * { name: "getItem", $ref: "MyCallback" }
 * into
 * { name: "getItem", type: "function", parameters: [ ... ] }
 *
 * Not sure what happens when recursion kicks in and how deep it should go, or if
 * a callback also has a callback in it so don't handle for now. Haven't seen it 
 * in any idls so far.
 */
function expandCallbacks (data, callbacks) {

  // Fix the webidl parsing of the callbacks into a consistent form like the others
  callbacks = callbacks.map(function (cb) {
    return { parameters: convertProperties(cb.arguments, true), name: cb.name };
  });

  var fns = [].concat(data.events || [], data.functions || []);

  fns.forEach(function (fn) {
    if (!fn.parameters || !fn.parameters.length) {
      return;
    }
    fn.parameters.forEach(function (param) {
      var callback = getCallback(param.$ref);
      if (!callback) {
        return;
      }

      // Keep the name, but add a type, since it was a $ref before,
      // and remove the $ref to callback
      param.type = "function";
      delete param.$ref;
      // Copy the callback definition parameters into the original function arguments
      param.parameters = JSON.parse(JSON.stringify(callback.parameters));
    });
  });

  function getCallback (name) {
    if (!name) { return; }
    for (var i = 0; i < callbacks.length; i++) {
      if (callbacks[i].name === name) {
        return callbacks[i];
      }
    }
  }
}

/**
 * Takes an array of properties from the webidl parser and returns
 * a hash describing them, adjusting the type information.
 *
 * If `artStyle` is set, returns an array instead of a hash of all the same objects,
 * except the original key of the hash is now set to each element's `name` property,
 * used in function argument definitions.
 *
 * @param {Array<Object>} props
 * @param {boolean?} argStyle
 * @return {Array<Object>|Object}
 */
function convertProperties (props, argStyle) {
  var result = props.reduce(function (hash, prop) {
    var propObj = hash[prop.name] = {};
    applyType(propObj, prop);
    propObj.optional = prop.optional;
    propObj.nullable = prop.idlType.nullable || void 0;
    hash[prop.name] = clean(propObj);
    return hash;
  }, {});

  if (argStyle) {
    result = props.map(function (origProp) {
      var prop = result[origProp.name];
      prop.name = origProp.name;
      return prop;
    });
  }

  return result;
}

/**
 * Cast from a WebIDL type ("double", "DOMString", etc.) to the
 * JavaScript equivilent. If cannot find a match (like for custom data types)
 * returns null.
 *
 * @param {string} type
 * @return {string|null}
 */
function castToJSType (type) {
  var def;
  for (var i = 0; i < TYPES.length; i++) {
    def = TYPES[i];
    if (~def.webidl.indexOf(type)) {
      return def.json === "$SELF$" ? type : def.json;
    }
  }
  return null;
}

/**
 * Removes any properties from an object if the value is "empty" (undefined, empty array).
 */
function clean (obj) {
  return Object.keys(obj).reduce(function (newObj, prop) {
    var value = obj[prop];
    if (value !== void 0 && (!Array.isArray(value) || value.length !== 0)) {
      newObj[prop] = value;
    }
    return newObj;
  }, {});
}

/**
 * Takes a destination `obj` and a `definition` from webidl,
 * and applies the appropriate type for the JSON conversation
 * on either the `type` or `$ref` property.
 *
 * @param {object} obj
 * @param {object} definition
 * @return {object}
 */
function applyType (obj, definition) {
  var type = castToJSType(definition.idlType.idlType);

  // If an array type
  if (definition.idlType.array) {
    obj.type = "array";
    obj.items = {};
  }

  // If a primitive of webidl
  if (type !== null) {
    // Where to actually store the underlying type information,
    // which changes dependening on if its an array
    (obj.items || obj).type = type;
  }
  // If a reference to another type defined within this namespace
  else {
    (obj.items || obj).$ref = definition.idlType.idlType;
  }

  return obj;
}
