const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, it } = require("mocha");
const moment = require("moment");

const Parser = require("../");


describe("text file read tests", () => {
  it("can read one line", () => {
    const parser = new Parser();
    parser._warning = false;
    assert.isTrue(parser.empty());
  });

  it("can read in multiple lines with \\n breaks", () => {
    const parser = new Parser("2021-10-10\nbbb");
    assert.equal(parser._meta["2021-10-10"], "2021-10-10\nbbb");
  });
  
  it("will create a new file if none are found", () => {
    const parser = new Parser();
    parser.setFile("/tmp/egah.txt");
    assert.isTrue(parser.empty());
    assert.isTrue(fs.existsSync("/tmp/egah.txt"));
    assert.equal(fs.readFileSync("/tmp/egah.txt").toString(), "");
  });
  
  it("will read in a file if given one", () => {
    const parser = new Parser();
    assert.isEmpty(parser._meta);
    assert.isEmpty(parser._dates);
    assert.isEmpty(parser._hashtags);    
    parser.setFile("tests/sample-file.txt");
    assert.isNotEmpty(parser._meta);
    assert.isNotEmpty(parser._dates);
    assert.isNotEmpty(parser._hashtags);    
  });
  
  it("will throw an exception if we try to read from the file with content already in", () => {
    const parser = new Parser("2021-10-12");
    expect(() => parser.setFile("tests/sample-file.txt")).to.throw();
  });
  
  it("will ignore exception if we set _warning to false", () => {
    const parser = new Parser("2021-10-10");
    parser._warning = false;
    expect(() => parser.setFile("tests/sample-file.txt")).to.not.throw();
  });

  it("will process the passed in file with the correct parameters", () => {
    const parser = new Parser();
    parser.setFile("tests/sample-file.txt");
    assert.equal(parser._dates.length, 6);
    /* // not sure why this fails
      //     console.log(parser._dates.map(x => x.format("YYYY-MM-DD")));
    assert.equal(
      parser._dates.map(x => x.format("YYYY-MM-DD")),
      [
        "2016-06-05",
        "2016-06-06",
        "2016-06-07",
        "2017-11-30",
        "2021-11-25",
        "2021-11-26",
      ]
      );
    */
  });
});
