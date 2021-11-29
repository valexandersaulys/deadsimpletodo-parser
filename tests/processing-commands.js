const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, after, it, beforeEach, afterEach } = require("mocha");
const moment = require("moment");
const sinon = require("sinon");

const Parser = require("../");


describe("Processing Commands", () => {
  beforeEach(() => {
    const _date = new Date(2021, 10, 28);
    this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    this.parser.setFile("tests/sample-file.txt");
    this.parser.setDate("2021-11-28");
  });
  afterEach(() => {});

  it("can process an `insert` command", () => {
    const lineInserted = this.parser.process("insert", "#abracadabra");
    assert.equal(
      JSON.stringify("2021-11-28\n#abracadabra"),
      JSON.stringify(this.parser._meta["2021-11-28"])
    );
    assert.equal(
      "#abracadabra",
      lineInserted
    );
  });
  it("can process a `/find` command", () => {
    const response = this.parser.process("search", "read Sketchy draft");
    assert.equal(
      JSON.stringify("2017-11-30\nread Sketchy draft"),
      JSON.stringify(response)
    );
  });
  it("can process a `/hashtags` command", () => {
    let response = this.parser.process("hashtags");
    assert.equal(
      JSON.stringify(["#notes","#phdadvisee","#firsthashtag"]),
      JSON.stringify(response)
    );

    response = this.parser.process("hashtags", "2017-10-30");
    assert.equal(
      JSON.stringify(['#firsthashtag', '#phdadvisee'].slice().sort()),
      JSON.stringify(response.slice().sort())
    );

    response = this.parser.process("hashtags", "2016-05-07 2017-10-30");
    assert.equal(
      JSON.stringify(["#notes","#phdadvisee"]),
      JSON.stringify(response)
    );        
  });
  it("can process a `/hashtag-count` command", () => {
    assert.equal(this.parser.process("hashtag-count"), 3);
    assert.equal(this.parser.process("hashtag-count", "2017-11-30"), 2);
  });  
  it("can process a `/display` command", () => {
    // (date)
    assert.equal(
      this.parser.process("display", "2021-11-25"),
      `11am timing info
- some notes for timing info
- more notes
a todo
look another todo`
    );   
  });
  it("can process `/change-date` command", () => {
    this.parser.process("change-date", "2016-06-05");
    assert.equal(this.parser._dayOf, "2016-06-05");
    assert.equal(
      this.parser.process("display"),
      `3:15pm join call with Umbrella Corp and industry partnership staff
3:45pm advising meet with Oprah
4pm Rihanna talk (368 CIT)
5pm 1:1 with Beyonce #phdadvisee
6pm faculty interview dinner with Madonna
some notes without anything attached
look, more notes!
#notes this has a hashtag
#notes this has a hashtag2
#notes this has a hashtag3`
    );
  });

  it("can process a first and last date command", () => {
    assert.equal(
      this.parser.process("first-date"),
      "2016-06-05"
    );
    assert.equal(
      this.parser.process("last-date"),
      "2021-11-26"
    );
  });

  it("throws error if unknown command is passed", () => {
    expect(() => this.parser.process("asdfasdfa")).to.throw();
  });
});


describe("can process /edit commands", () => {
  beforeEach(() => {
    const _date = new Date(2021, 10, 28);
    this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    this.parser.setFile("tests/sample-file.txt");
    this.parser.setDate("2021-11-28");
  });
  afterEach(() => {});

  it("_", () => {
    // ...
    const someLines = this.parser.process("display", "2021-11-25");
    assert.equal(
      someLines,
      `11am timing info
- some notes for timing info
- more notes
a todo
look another todo`
    );
    
    const newLines = `11am timing info
- some notes for timing info
- more notes
a todo
look another todo`;

    /*
      Cache the reply and, if edit is called, look at the line changes. 
      Then run edit(...) on those changed lines

      However, it gets more complex if I changed the dates on something. 
      
      Best way to approach it?
     */
    
    // will automatically use the cached item
    /*
    const newLine = this.parser.process("edit", newLines);
    assert.equal(newLine, "egah");
    assert.equal(
      JSON.stringify("2021-11-28\negah"),
      JSON.stringify(this.parser._meta["2021-11-28"])
    );
    */
  });
});
