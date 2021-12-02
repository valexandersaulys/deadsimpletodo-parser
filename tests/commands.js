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
    fs.copyFileSync("tests/sample-file.txt", "/tmp/temp-file-commands.txt");
    this.parser.setFile("/tmp/temp-file-commands.txt");
    this.parser.setDate("2021-11-28");
  });
  afterEach(() => {});

  it("can process an `insert` command", () => {
    const lineInserted = this.parser.process("insert", "#abracadabra");
    assert.deepEqual(
      lineInserted,
      [
        { line: '2021-11-28', categorized: 'datetime' },
        { line: '#abracadabra', categorized: 'hashtag' }
      ]
    );
    assert.include(
      this.parser._read(),
      `2021-11-28\n#abracadabra`,
    );
  });
  it("can process a `/find` command", () => {
    const lineInserted = this.parser.process("search", "read Sketchy draft");
    assert.deepEqual(
      lineInserted,
      [
        { line: '2017-11-30', categorized: 'datetime' },
        { line: 'read Sketchy draft', categorized: 'todo' }
      ]
    );
  });
  it("can process a `/hashtags` command", () => {
    let response = this.parser.process("hashtags");
    assert.deepEqual(
      response.sort(),
      ["#firsthashtag","#notes","#phdadvisee"]
    );
    response = this.parser.process("hashtags", "2017-10-30");
    assert.deepEqual(
      response.sort(),
      ['#firsthashtag', '#phdadvisee']
    );
    response = this.parser.process("hashtags", "2016-05-07 2017-10-30");
    assert.deepEqual(
      response,
      ["#notes","#phdadvisee"]
    );        
  });
  it("can process a `/hashtag-count` command", () => {
    assert.equal(this.parser.process("hashtag-count"), 3);
    assert.equal(this.parser.process("hashtag-count", "2017-11-30"), 2);
  });  
  it("can process a `/display` command", () => {
    assert.deepEqual(
      this.parser.process("display", "2021-11-25"),
      [
        { line: '2021-11-25', categorized: 'datetime' },
        {
          line: '11am timing info\n- some notes for timing info\n- more notes',
          categorized: 'datetime'
        },
        { line: 'a todo', categorized: 'todo' },
        { line: 'look another todo', categorized: 'todo' }
      ]
    );   
  });
  it("can process `/change-date` command", () => {
    this.parser.process("change-date", "2016-06-05");
    assert.equal(this.parser._dayOf, "2016-06-05");
    assert.deepEqual(
      this.parser.process("display"),
      [
        { line: '2016-06-05', categorized: 'datetime' },
        {
          line: '3:15pm join call with Umbrella Corp and industry partnership staff',
          categorized: 'datetime'
        },
        { line: '3:45pm advising meet with Oprah', categorized: 'datetime' },
        { line: '4pm Rihanna talk (368 CIT)', categorized: 'datetime' },
        { line: '5pm 1:1 with Beyonce #phdadvisee', categorized: 'datetime' },
        {
          line: '6pm faculty interview dinner with Madonna',
          categorized: 'datetime'
        },
        { line: 'some notes without anything attached', categorized: 'todo' },
        { line: 'look, more notes!', categorized: 'todo' },
        { line: '#notes this has a hashtag', categorized: 'hashtag' },
        { line: '#notes this has a hashtag2', categorized: 'todo' },
        { line: '#notes this has a hashtag3', categorized: 'hashtag' }
      ]
    );
  });

  it("can process a first and last date command", () => {
    assert.deepEqual(
      this.parser.process("first-date"),
      [ { line: "2016-06-05", categorized: "datetime" } ]
    );
    assert.deepEqual(
      this.parser.process("last-date"),
      [ { line: "2021-11-26", categorized: "datetime" } ]
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
    fs.copyFileSync("tests/sample-file.txt", "/tmp/temp-file-commands.txt");
    this.parser.setFile("/tmp/temp-file-commands.txt");
    this.parser.setDate("2021-11-28");
  });
  afterEach(() => {});

  it("_", async () => {
    // display should return dates 
    const oldLines = this.parser.process("display", "2021-11-25");
    const oldContent = this.parser._findSpecificDate("2021-11-25");
    assert.deepEqual(
      oldLines,
      [
        { line: '2021-11-25', categorized: 'datetime' },
        {
          line: '11am timing info\n- some notes for timing info\n- more notes',
          categorized: 'datetime'
        },
        { line: 'a todo', categorized: 'todo' },
        { line: 'look another todo', categorized: 'todo' }
      ]
    );
    
    const newLines = `2021-11-25
11:30am changed timing info
- some notes for timing info
- more notes
meet up with raytheon
#war blow up the middle east`;

    // **NOTE** this works backwards from _processEdit
    const worked = await this.parser.process("edit", newLines, oldLines);
    // will submit the oldLines either through a cookie or hidden form element

    const newContent = this.parser._findSpecificDate("2021-11-25");
    assert.notEqual(oldContent, newContent, "Meta did not change did not change");
    assert.include(newContent, "11:30am changed timing info");
    assert.notInclude(newContent, "11am timing info");
    assert.include(newContent, "meet up with raytheon");
    assert.notInclude(newContent, "a todo");
    assert.include(newContent, "#war blow up the middle east");
    assert.notInclude(newContent, "#lookkk another todo");

    // check hashtags
    let hashtags = this.parser.process("hashtags");
    assert.include(hashtags, "#war");    
  });
});
