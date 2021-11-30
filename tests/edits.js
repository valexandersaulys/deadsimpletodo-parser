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
    fs.copyFileSync("tests/sample-file.txt", "/tmp/temp-file-edits.txt");
    this.parser.setFile("/tmp/temp-file-edits.txt");
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
    assert.isNotEmpty(resp);
    assert.include(this.parser._read(), "look I changed a line");
    assert.notInclude(this.parser._read(), "review and release A/B Testing assignment grading");
  });

  it("can edit a new hashtag in", () => {
    let resp = this.parser.edit(
      "review and release A/B Testing assignment grading",
      "#wacky hashtag"
    );
    assert.isNotEmpty(resp);
    const content = this.parser._read();
    assert.include(content, "#wacky hashtag");
    assert.notInclude(content, "review and release A/B Testing assignment grading");
    assert.include(this.parser.getAllHashtags(), "#wacky");
  });
  
  it("can edit a new date in", () => {
    let resp = this.parser.edit(
      "11am meet with Head TAs",
      "11:30am new time for meeting",
      "2017-11-30"
    );
    assert.isNotEmpty(resp);
    assert.include(this.parser._read(), "11:30am new time for meeting");
    assert.notInclude(this.parser._read(), "11am meet with Head TAs");
  });

  it("can edit lines in a longer text file via search", () => {
    const [date, line] = this.parser.find("#phdadvisee").split("\n");
    const oldHashtags = this.parser.getAllHashtags();
    let resp = this.parser.edit(
      line,
      "#newhashtag in a new line",
      date
    );
    assert.isNotEmpty(resp);
    const newHashtags = this.parser.getAllHashtags();
    assert.notEqual(oldHashtags, newHashtags);
    assert.include(newHashtags, "#newhashtag");
  });

  it("can process _diffTextBlocks correctly", async () => {
    // async _diffTextBlocks(oldStr, newStr, _date)
    let [linesToDelete, linesToInsert, _date] = await this.parser. _diffTextBlocks(
      `11am timing info
- some notes for tmmmmiming info
- more notes
a todo
look another todo`,
      `11am timing info
- some notes for timing info
- more notes
a todo
look another todo`,
      "2021-10-17"
    );
    assert.equal(linesToDelete.length, 1);
    assert.equal(linesToInsert.length, 1);
    assert.equal(linesToInsert[0], "- some notes for timing info");
    assert.equal(linesToDelete[0], "- some notes for tmmmmiming info");
    assert.equal(_date, "2021-10-17");
    [linesToDelete, linesToInsert, _date] = await this.parser._diffTextBlocks(
      `11am timing info
- some notes for tmiming info
- more notess
a todoo
look another todo`,
      `11am timing info
- some notes for timing info
- more notes
a todo
look another todo`,
      "2010-11-12"
    );
    assert.equal(linesToDelete.length, 3);
    assert.equal(linesToInsert.length, 3);
    assert.equal(linesToDelete[0], "- some notes for tmiming info");
    assert.equal(linesToDelete[1], "- more notess");
    assert.equal(linesToDelete[2], "a todoo");        
    assert.equal(linesToInsert[0], "- some notes for timing info");
    assert.equal(linesToInsert[1], "- more notes");
    assert.equal(linesToInsert[2], "a todo");    
    assert.equal(_date, "2010-11-12");    
  });

  it("can proces _diffArrays correctly", async () => {
    // async _diffArrays(oldArray, newArray)
    let [uniqueDatesOld, uniqueDatesNew, datesInCommon] = await this.parser._diffArrays(
      ["2021-10-17", "2021-10-18", "2021-06-02"],
      ["2021-10-17", "2021-10-18", "2021-06-02"]
    );
    assert.isEmpty(uniqueDatesOld);
    assert.isEmpty(uniqueDatesNew);
    assert.equal(datesInCommon.length, 3);

    [uniqueDatesOld, uniqueDatesNew, datesInCommon] = await this.parser._diffArrays(
      ["2021-11-17", "2021-10-18", "2021-06-02"],
      ["2021-10-17", "2021-10-18", "2021-06-02"]
    );
    assert.isNotEmpty(uniqueDatesOld);
    assert.isNotEmpty(uniqueDatesNew);
    assert.equal(datesInCommon.length, 2);
    assert.equal(uniqueDatesOld.length, 1);
    assert.equal(uniqueDatesOld, "2021-11-17");    
    assert.equal(uniqueDatesNew, "2021-10-17");
  });

  it("can delete things correctly", async () => {
    let zeLine = "update biosketch for Co-PI"; // include the slash?
    assert.include(this.parser._read(), zeLine); 
    this.parser.delete(zeLine, "2017-11-30");
    assert.notInclude(this.parser._read(), zeLine);
    // also can't search?
  });

  it("can process edit 1", async () => {
    let content = this.parser._read();
    assert.notInclude(content, "a todoooo\n");
    assert.include(content, "a todo\n");
    assert.notInclude(this.parser._read(), "a todoooo\n");
    assert.include(this.parser._read(), "a todo");
    
    const worked = await this.parser._processEdit(
      `2021-11-25
a todo
look another todo
11am timing info
- some notes for timing info
- more notes`,
      `2021-11-25
a todoooo
look another todo
11am timing info
- some notes for timing info
- more notes`
    );
    // console.log(await worked);
    // assert.isTrue(worked);
    assert.notInclude(this.parser._findSpecificDate("2021-11-25"), "a todo\n");
    assert.include(this.parser._findSpecificDate("2021-11-25"), "a todoooo");
  });

  it("can process the complete edit correctly ", async () => {
    // async _processEdit(oldText, newText) ==>  where the edit goes off
    let content = this.parser._read();
    assert.notInclude(content, "a todoooo");
    assert.notInclude(content, "look another todoooo");
    assert.notInclude(content, "- more notessss");
    assert.include(content, "a todo");
    assert.include(content, "look another todo");
    assert.include(content, "- more notes");
    
    const worked = await this.parser._processEdit(
      `2021-11-25
a todo
look another todo
11am timing info
- some notes for timing info
- more notes`,
      `2021-11-25
a todoooo
look another todoooo
11am timing info
- some notes for timing info
- morem notessss`
    );
    content = this.parser._findSpecificDate("2021-11-25");
    assert.include(content, "a todoooo");
    assert.include(content, "look another todoooo");
    assert.include(content, "- morem notessss");
    assert.notInclude(content, "a todo\n");
    assert.notInclude(content, "look another todo\n");
    assert.notInclude(content, "- more notes");
  });
});
