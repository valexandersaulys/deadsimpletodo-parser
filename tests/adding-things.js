const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, after, it, beforeEach, afterEach } = require("mocha");
const moment = require("moment");
const sinon = require("sinon");

const Parser = require("../");


describe("Adding Things", () => {
  beforeEach(() => {
    const _date = new Date(2021, 10, 26);
    this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    if (fs.existsSync("/tmp/scratch.txt"))
      fs.unlinkSync("/tmp/scratch.txt");
    this.parser.setFile("/tmp/scratch.txt");
  });
  afterEach(() => {});

  it("smoke", () => {
    assert.isTrue(true);
  });

  it("can insert text", () => {
    this.parser.insert("#look some text");
    assert.equal(
      JSON.stringify({"2021-11-26":"2021-11-26\n#look some text"}),
      JSON.stringify(this.parser._meta)
    );
    this.parser.insert("3pm look a date todo");
    assert.equal(
      JSON.stringify({"2021-11-26":"2021-11-26\n#look some text\n3pm look a date todo"}),
      JSON.stringify(this.parser._meta)
    );
    this.parser.insert("4pm look a date todo with notes\n- things");
    assert.equal(
      JSON.stringify({"2021-11-26":"2021-11-26\n#look some text\n3pm look a date todo\n4pm look a date todo with notes\n- things"}),
      JSON.stringify(this.parser._meta)
    );
    assert.equal(
      this.parser.display(null, false),
      `#look some text
3pm look a date todo
4pm look a date todo with notes
- things`
    );
    assert.equal(
      this.parser.display(null, true),
      `3pm look a date todo
4pm look a date todo with notes
- things
#look some text`
    );
    assert.equal(
      JSON.stringify(this.parser.getDateRange().slice().sort()),
      JSON.stringify([
        moment("2021-11-26", "YYYY-MM-DD"),
        moment("2021-11-26", "YYYY-MM-DD")
      ]),
    );
    assert.equal(
      JSON.stringify(this.parser.getAllHashtags().slice().sort()),
      JSON.stringify(["#look"]),
    );
    fs.unlinkSync("/tmp/scratch.txt");
    assert.equal(this.parser.filePath, "/tmp/scratch.txt");
    this.parser.saveFile();
    assert.equal(
      fs.readFileSync("/tmp/scratch.txt").toString(),
      `2021-11-26
#look some text
3pm look a date todo
4pm look a date todo with notes
- things`
    );
  });

  it("can add things", () => {
    this.parser.add("#look some text");
    assert.equal(
      JSON.stringify({"2021-11-26":"2021-11-26\n#look some text"}),
      JSON.stringify(this.parser._meta)
    );
    this.parser.add("3pm look a date todo");
    assert.equal(
      JSON.stringify({"2021-11-26":"2021-11-26\n#look some text\n3pm look a date todo"}),
      JSON.stringify(this.parser._meta)
    );
    this.parser.add("4pm look a date todo with notes\n- things");
    assert.equal(
      JSON.stringify({"2021-11-26":"2021-11-26\n#look some text\n3pm look a date todo\n4pm look a date todo with notes\n- things"}),
      JSON.stringify(this.parser._meta)
    );

    assert.equal(
      this.parser.display(null, false),
      `#look some text
3pm look a date todo
4pm look a date todo with notes
- things`
    );
    assert.equal(
      this.parser.display(null, true),
      `3pm look a date todo
4pm look a date todo with notes
- things
#look some text`
    );

    assert.equal(
      JSON.stringify(this.parser.getDateRange().slice().sort()),
      JSON.stringify([
        moment("2021-11-26", "YYYY-MM-DD"),
        moment("2021-11-26", "YYYY-MM-DD")
      ]),
    );
    assert.equal(
      JSON.stringify(this.parser.getAllHashtags().slice().sort()),
      JSON.stringify(["#look"]),
    );

    
    // console.log("--", this.parser.saveFile(), typeof this.parser.saveFile());
    // console.log(fs.readFileSync("/tmp/scratch.txt").toString());
    fs.unlinkSync("/tmp/scratch.txt");
    assert.equal(this.parser.filePath, "/tmp/scratch.txt");
    this.parser.saveFile();
    assert.equal(
      fs.readFileSync("/tmp/scratch.txt").toString(),
      `2021-11-26
#look some text
3pm look a date todo
4pm look a date todo with notes
- things`
    );
  });  
});


// add things to large existing file
