var path = require("path");
var expect = require("chai").expect;
var _ = require("underscore");
var convert = require("../lib/blink-webidl-to-json");

var LARGER_PATH = path.join(__dirname, "fixtures", "larger.idl");

/**
 * Blink WebIDL does not require its enums to be quoted. This tests that we can still parse it.
 */

describe("blink-webidl-to-json", function () {
  it("returns an array of an element with correct properties", function () {
    var json = convert("larger", LARGER_PATH);
    var def = json[0];
    expect(json.length).to.be.equal(1);
    expect(def.namespace).to.be.equal("larger");
    expect(def.description).to.be.equal(void 0);
    expect(def.types.length).to.be.ok;
    expect(def.functions.length).to.be.ok;
    expect(def.events.length).to.be.ok;
  });

  describe("types", function () {
    it("converts webidl types to JS types (array)", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var types = _.findWhere(json.types, { id: "TypeTest" });
      expect(types.properties.r.type).to.be.equal("array");
      expect(types.properties.r.items.$ref).to.be.equal("Point");
      expect(types.properties.s.type).to.be.equal("array");
      expect(types.properties.s.items.type).to.be.equal("boolean");
    });

    it("converts webidl types to JS types", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var types = _.findWhere(json.types, { id: "TypeTest" });
      expect(types.properties.a.type).to.be.equal("integer");
      expect(types.properties.b.type).to.be.equal("integer");
      expect(types.properties.c.type).to.be.equal("integer");
      expect(types.properties.d.type).to.be.equal("integer");
      expect(types.properties.e.type).to.be.equal("integer");
      expect(types.properties.f.type).to.be.equal("integer");
      expect(types.properties.g.type).to.be.equal("integer");
      expect(types.properties.h.type).to.be.equal("integer");
      expect(types.properties.i.type).to.be.equal("number");
      expect(types.properties.j.type).to.be.equal("number");
      expect(types.properties.k.type).to.be.equal("number");
      expect(types.properties.l.type).to.be.equal("number");
      expect(types.properties.m.type).to.be.equal("string");
      expect(types.properties.n.type).to.be.equal("boolean");
      expect(types.properties.o.type).to.be.equal("object");
      expect(types.properties.p.type).to.be.equal("any");
      expect(types.properties.q.$ref).to.be.equal("Point");
    });

    it("defines enums", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var myenum = _.findWhere(json.types, { id: "MyEnum" });
      expect(myenum.id).to.be.equal("MyEnum");
      expect(myenum.type).to.be.equal("string");
      expect(myenum.enum.length).to.be.equal(3);
      expect(myenum.enum).to.contain("rock");
      expect(myenum.enum).to.contain("scissors");
      expect(myenum.enum).to.contain("paper");
    });

    it("custom DataStructures", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var Point = _.findWhere(json.types, { id: "Point" });

      expect(Point.id).to.be.equal("Point");
      expect(Point.type).to.be.equal("object");
      // No descriptions defined yet so shouldn't be here at all
      expect("description" in Point).to.be.equal(false);

      var x = Point.properties.x;
      var y = Point.properties.y;
      var id = Point.properties.id;

      expect(x.type).to.be.equal("any");
      // Can't have nullable any?
      expect(x.nullable).to.be.equal(void 0);
      expect(y.type).to.be.equal("integer");
      expect(y.nullable).to.be.equal(true);
      expect(id.type).to.be.equal(void 0);
      expect(id.$ref).to.be.equal("IdObject");
      expect(id.nullable).to.be.equal(void 0);
    });
  });

  describe("functions", function () {
    it("converts functions", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var fn = _.findWhere(json.functions, { name: "asyncDistance" });
      expect(fn.name).to.be.equal("asyncDistance");
      expect(fn.type).to.be.equal("function");
      // No descriptions defined yet so shouldn't be here at all
      expect("description" in fn).to.be.equal(false);
    });

    it("function arguments can have custom types", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var fn = _.findWhere(json.functions, { name: "asyncDistance" });
      var arg1 = fn.parameters[0];
      expect(arg1.$ref).to.be.equal("Point");
      expect(arg1.name).to.be.equal("point");
    });

    it("function arguments can have custom types (array)", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var fn = _.findWhere(json.functions, { name: "getAllPoints" });
      var arg1 = fn.parameters[0];
      expect(arg1.type).to.be.equal("array");
      expect(arg1.items.$ref).to.be.equal("IdObject");
      expect(arg1.name).to.be.equal("ids");
    });

    it("function arguments can be enums", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var fn = _.findWhere(json.functions, { name: "RPS" });
      var arg1 = fn.parameters[0];
      expect(arg1.name).to.be.equal("move");
      expect(arg1.$ref).to.be.equal("MyEnum");
    });

    it("function arguments can have custom callbacks with their own types expanded", function () {
      var json = convert("larger", LARGER_PATH)[0];
      var fn = _.findWhere(json.functions, { name: "asyncDistance" });
      var callback = fn.parameters[1];
      var param1 = callback.parameters[0];
      expect(callback.name).to.be.equal("callback");
      expect(callback.type).to.be.equal("function");
      expect(callback.optional).to.be.equal(true);
      expect(callback.parameters.length).to.be.equal(1);
      expect(param1.name).to.be.equal("status");
      expect(param1.type).to.be.equal("integer");

      // Should expand callback definition so $ref isn't used anymore
      expect("$ref" in param1).to.be.equal(false);
    });
  });
});
