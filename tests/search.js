const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, after, it, beforeEach, afterEach } = require("mocha");
const moment = require("moment");
const sinon = require("sinon");

const Parser = require("../");


describe("Adding Things", () => {
  before(() => {
    const _date = new Date(2021, 10, 30);
    this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    fs.copyFileSync("tests/sample-file.txt", "/tmp/temp-file.txt");
    this.parser.setFile("/tmp/temp-file.txt");
    this.parser.setDate(new Date(2017, 10, 30));
  });

  it("can search", () => {
    assert.equal(
      this.parser.search("read Sketchy draft"),
      `2017-11-30
read Sketchy draft`
    );
    
    assert.equal(
      this.parser.search("11am meet with Head TAs"),
      `2017-11-30
11am meet with Head TAs
- where are things at with inviting portfolio reviewers?`
    );

    assert.equal(
      this.parser.search("11am"),
      `2017-11-30
11am meet with Head TAs
- where are things at with inviting portfolio reviewers?

2021-11-25
11am timing info
- some notes for timing info
- more notes

2021-11-26
11am timing info
- some notes for timing info
- more notes`
    );    
  });
});
