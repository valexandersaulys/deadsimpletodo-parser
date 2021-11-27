const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, after, it, beforeEach, afterEach } = require("mocha");
const moment = require("moment");
const sinon = require("sinon");

const Parser = require("../");


describe("Editing Things", () => {
  beforeEach(() => {
    const _date = new Date(2021, 10, 30);
    this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    this.parser.setFile("tests/sample-file.txt");
    this.parser.setDate(new Date(2017, 10, 30));
  });
  afterEach(() => {
    // this.clock.restore();
  });
  
  it("can edit an inserted line", () => {
    let resp = this.parser.edit(
      "review and release A/B Testing assignment grading",
      "look I changed a line"
    );
    assert.isTrue(resp);    
    assert.include(this.parser._getText(), "look I changed a line");
    assert.notInclude(this.parser._getText(), "review and release A/B Testing assignment grading");
  });

  it("can edit a new hashtag in", () => {
    let resp = this.parser.edit(
      "review and release A/B Testing assignment grading",
      "#wacky hashtag"
    );
    assert.isTrue(resp);
    assert.include(this.parser._getText(), "#wacky hashtag");
    assert.notInclude(
      this.parser._getText(),
      "review and release A/B Testing assignment grading"
    );
    assert.include(this.parser.getAllHashtags(), "#wacky");
  });
  
  it("can edit a new date in", () => {
    let resp = this.parser.edit(
      "11am meet with Head TAs",
      "11:30am new time for meeting",
      "2017-11-30"
    );
    assert.isTrue(resp);
    assert.include(this.parser._getText(), "11:30am new time for meeting");
    assert.notInclude(this.parser._getText(), "11am meet with Head TAs");
  });

  it("can edit lines in a longer text file via search", () => {
    const [date, line] = this.parser.find("#phdadvisee").split("\n");
    const oldHashtags = this.parser.getAllHashtags();
    let resp = this.parser.edit(
      line,
      "#newhashtag in a new line",
      date
    );
    assert.isTrue(resp);
    const newHashtags = this.parser.getAllHashtags();
    assert.notEqual(oldHashtags, newHashtags);
    assert.include(newHashtags, "#newhashtag");
  });
});
