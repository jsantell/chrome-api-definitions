var fs = require("fs");
var expect = require("chai").expect;
var API = require("../");
var tmp = require("tmp");
var _ = require("underscore");

describe("chrome-api-definitions", function () {
  describe(".getDefinitions()", function () {
    it("returns stable definitions by default", function () {
      var defs = API.getDefinitions();
      expect(defs.length).to.be.equal(50);
    });
    it("includes metadata from manifests", function () {
      var defs = API.getDefinitions();
      var runtime = _.findWhere(defs, { namespace: "runtime" });
      var sendMessage = _.findWhere(runtime.functions, { name: "sendMessage" });
      expect(sendMessage.content_script).to.be.ok;
      var alarm = _.findWhere(defs, { namespace: "alarms" });
      expect(alarm.dependencies).to.contain("permission:alarms");
    });
    it("returns definition via preset from api-names.json", function () {
      var defs = API.getDefinitions({ filter: "experimental" });
      expect(defs.length).to.be.equal(2);
      expect(_.findWhere(defs, { namespace: "experimental.devtools.console" })).to.be.ok;
    });
  });

  describe(".saveDefinitions()", function () {
    it("saves the definition", function () {
      var file = tmp.fileSync();
      var defs = API.getDefinitions({ filter: "experimental" });
      API.saveDefinitions({ filter: "experimental", dest: file.name });

      expect(
        fs.readFileSync(file.name, "utf8").replace(/\s/g, "")
      ).to.be.equal(
        JSON.stringify(defs).replace(/\s/g, "")
      );
    });
  });
});
