const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, after, it, beforeEach, afterEach } = require("mocha");
const moment = require("moment");
const sinon = require("sinon");

const Parser = require("../");


describe("Process SideEffects for Hashtags", () => {
  before(() => {
    const _date = new Date(2021, 10, 1);
    // this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    this.parser.setFile("tests/sample-file.txt");
  });

  it("will trigger a side effect when a hashtag is added", () => {
    const stub = sinon.stub().returns(1); // or return anything
    this.parser.addSideEffect(stub, "#hashtag");
    this.parser.insert("#hashtag piece");
    assert.isTrue(stub.called);
  });

  // trigger in order? is that important?
});
