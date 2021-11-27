const assert = require("assert");
const { describe, before, it } = require("mocha");

const Parser = require("../");

// https://www.chaijs.com/api/assert/


describe("smoke tests", () => {
  it("_", () => {
    assert.equal(1,1);
  });

  it("can instantiate", () => {
    const parser = new Parser();
    assert.notEqual(parser, null);
  });
});

