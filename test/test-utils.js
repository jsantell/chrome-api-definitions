var join = require("path").join;
var expect = require("chai").expect;
var utils = require("../lib/utils");
var _ = require("underscore");
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
      expect(def.namespace).to.be.equal("runtime");
    });
    it("finds single namespace manifest in chrome (idl)", function () {
      var def = utils.getDefinition("browser", API_ROOT);
      expect(def.namespace).to.be.equal("browser");
      expect(def.functions.length).to.be.equal(1);
      expect(def.types.length).to.be.equal(1);
    });
    it("maps camel-cased name to underscored definition (browserAction -> browser_action)", function () {
      var def = utils.getDefinition("browserAction", API_ROOT);
      expect(def.namespace).to.be.equal("browserAction");
      expect(def.functions.length).to.be.equal(12);
      expect(def.types.length).to.be.equal(2);
    });
    it("maps camel-cased deep namespace (devtools.inspectedWindow -> devtools/inspected_window)", function () {
      var def = utils.getDefinition("devtools.inspectedWindow", API_ROOT);
      expect(def.namespace).to.be.equal("devtools.inspectedWindow");
      expect(def.functions.length).to.be.equal(3);
      expect(def.types.length).to.be.equal(1);
    });
  });

  describe(".attachMeta", function () {
    it("does not attach meta when no permission or content_script defined", function () {
      var def = utils.getDefinition("tabs", API_ROOT);
      def = utils.attachMeta(def, "tabs", API_ROOT);
      expect(def.content_script).to.be.equal(void 0);
      expect(def.dependencies).to.be.equal(void 0);
    });
    it("attaches meta on the root when it has permission and content_script", function () {
      var def = utils.getDefinition("storage", API_ROOT);
      def = utils.attachMeta(def, "storage", API_ROOT);
      expect(def.content_script).to.be.equal(true);
      expect(def.dependencies).to.contain("permission:storage");
    });
    it("attaches meta on the root for deep namespaces", function () {
      var def = utils.getDefinition("devtools.inspectedWindow", API_ROOT);
      def = utils.attachMeta(def, "devtools.inspectedWindow", API_ROOT);
      expect(def.content_script).to.be.equal(void 0);
      expect(def.dependencies).to.contain("manifest:devtools_page");
    });
    it("attaches meta to children functions if found in manifest", function () {
      var def = utils.getDefinition("runtime", API_ROOT);
      def = utils.attachMeta(def, "runtime", API_ROOT);
      var fn = _.findWhere(def.functions, { name: "sendMessage" });
      expect(fn.content_script).to.be.equal(true);

      fn = _.findWhere(def.functions, { name: "connectNative" });
      expect(fn.dependencies).to.contain("permission:nativeMessaging");
    });
  });
});
