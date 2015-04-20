var join = require("path").join;
var expect = require("chai").expect;
var utils = require("../lib/utils");
var API_ROOT = join(__dirname, "..", "api");

describe("utils", function () {
  describe(".getManifestEntry", function () {
    it("finds single namespace manifest in common", function () {
      var manifest = utils.getManifestEntry("runtime", API_ROOT);
      expect(manifest.channel).to.be.equal("stable");
      expect(manifest.extension_types).to.contain("extension");
      expect(manifest.contexts).to.contain("blessed_extension");
    });
    it("finds single namespace manifest in chrome", function () {
      var manifest = utils.getManifestEntry("browser", API_ROOT);
      expect(manifest.contexts).to.contain("blessed_extension");
      expect(manifest.dependencies).to.contain("permission:browser");
    });
    it("finds multiple namespace manifest in chrome", function () {
      var manifest = utils.getManifestEntry("devtools.inspectedWindow", API_ROOT);
      expect(manifest.contexts).to.contain("blessed_extension");
      expect(manifest.dependencies).to.contain("manifest:devtools_page");
    });
  });

  describe(".getDefinition", function () {
    it("finds single namespace manifest in common (json)", function () {
      var def = utils.getDefinition("runtime", API_ROOT);
      expect(def[0].namespace).to.be.equal("runtime");
    });
    it("finds single namespace manifest in chrome (idl)", function () {
      var def = utils.getDefinition("browser", API_ROOT);
      expect(def[0].namespace).to.be.equal("browser");
      expect(def[0].functions.length).to.be.equal(1);
      expect(def[0].types.length).to.be.equal(1);
    });
    it("maps camel-cased name to underscored definition (browserAction -> browser_action)", function () {
      var def = utils.getDefinition("browserAction", API_ROOT);
      expect(def[0].namespace).to.be.equal("browserAction");
      expect(def[0].functions.length).to.be.equal(12);
      expect(def[0].types.length).to.be.equal(2);
    });
    it("maps camel-cased deep namespace (devtools.inspectedWindow -> devtools/inspected_window)", function () {
      var def = utils.getDefinition("devtools.inspectedWindow", API_ROOT);
      expect(def[0].namespace).to.be.equal("devtools.inspectedWindow");
      expect(def[0].functions.length).to.be.equal(3);
      expect(def[0].types.length).to.be.equal(1);
    });
  });
});
