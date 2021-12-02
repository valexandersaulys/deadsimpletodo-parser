const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, it } = require("mocha");
const moment = require("moment");

const Parser = require("../");


describe("text file read tests", () => {
  it("can read one line", () => {
    const parser = new Parser();
    parser._warning = false;
    fs.copyFileSync("tests/sample-file.txt", "/tmp/temp-file-read.txt");
    assert.isTrue(parser.empty());
  });

  // NOTE: cannot pass in text anymore to change a file
  
  it("will create a new file if none are found", () => {
    const parser = new Parser();
    parser.setFile("/tmp/egah.txt");
    console.log("---", parser._read());
    assert.isTrue(parser.empty());
    assert.isTrue(fs.existsSync("/tmp/egah.txt"));
    assert.equal(fs.readFileSync("/tmp/egah.txt").toString().trim(), "");
  });
  
  it("will read in a file if given one", () => {
    const parser = new Parser();
    assert.equal(parser._read(), "");
    parser.setFile("/tmp/temp-file-read.txt");
    assert.notEqual(parser._read(), "");
  });
  
  it("will throw an exception if we try to read from the file with content already in", () => {
    const parser = new Parser("/tmp/egah.txt");
    expect(() => parser.setFile("/tmp/temp-file-read.txt")).to.throw();
  });
  
  it("will ignore exception if we set _warning to false", () => {
    const parser = new Parser("/tmp/egah.txt");
    parser._warning = false;
    expect(() => parser.setFile("/tmp/temp-file-read.txt")).to.not.throw();
  });

  it("will process the passed in file with the correct parameters", () => {
    const parser = new Parser();
    parser.setFile("/tmp/temp-file-read.txt");
    assert.equal(parser._getAllDates().length, 6);
  });
});
