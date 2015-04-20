var path = require("path");
var fs = require("fs");
var expect = require("chai").expect;
var _ = require("underscore");
var webidlParser = require("../lib/blink-webidl-parser");

var ENUM_PATH = path.join(__dirname, "fixtures", "enum.idl");
var LARGER_PATH = path.join(__dirname, "fixtures", "larger.idl");

function parse (p) {
  return webidlParser.parse(fs.readFileSync(p, "utf8"));
}

/**
 * Blink WebIDL does not require its enums to be quoted. This tests that we can still parse it.
 */

describe("blink-webidl-parser", function () {
  describe("enum", function () {
    it("handles multiple enums per line", function () {
      var entry = _.findWhere(parse(ENUM_PATH), { name: "AllOnNextLine" });
      expect(entry.type).to.be.equal("enum");
      expect(entry.values).to.contain("one");
      expect(entry.values).to.contain("two");
      expect(entry.values).to.contain("three");
    });
    it("handles one enum defined per line", function () {
      var entry = _.findWhere(parse(ENUM_PATH), { name: "OnePerLine" });
      expect(entry.type).to.be.equal("enum");
      expect(entry.values).to.contain("rock");
      expect(entry.values).to.contain("paper");
      expect(entry.values).to.contain("scissors");
    });
    it("handles entire enum definition on one line", function () {
      var entry = _.findWhere(parse(ENUM_PATH), { name: "EverythingOnSameLine" });
      expect(entry.values).to.contain("six");
      expect(entry.values).to.contain("five");
      expect(entry.values).to.contain("four");
    });
  });

  describe("any nullables", function () {
    it("does not break on `any?` nullables.", function () {
      var entry = _.findWhere(parse(LARGER_PATH), { name: "Point" });
      expect(entry.type).to.be.equal("dictionary");
      expect(entry.members.length).to.be.equal(3);
    });
  });
});
