const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, after, it, beforeEach, afterEach } = require("mocha");
const moment = require("moment");
const sinon = require("sinon");

const Parser = require("../");


describe("Process hashtags", () => {
  beforeEach(() => {
    const _date = new Date(2021, 10, 1);
    // this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    fs.copyFileSync("tests/sample-file.txt", "/tmp/temp-file-hashtags.txt");
    this.parser.setFile("/tmp/temp-file-hashtags.txt");
  });
  afterEach(() => {
    // this.clock.restore();
  });

  it("can find hashtags in a file", () => {
    assert.equal(
      this.parser.find("#firsthashtag"),
      `2021-11-26\n#firsthashtag look its a hashtag`
    );
  });

  it("can find many hashtags in a file", () => {
    assert.equal(
      this.parser.find("#notes"),
      `2016-06-05
#notes this has a hashtag
#notes this has a hashtag2
#notes this has a hashtag3

2016-06-06
#notes this has a hashtag
3:45pm advising meet with Oprah
- #notes this is a subnote with a hashtag
#notes this has a hashtag2
#notes this has a hashtag3

2016-06-07
#notes this has a hashtag
3:45pm advising meet with Oprah
- #notes this is a subnote with a hashtag
#notes this has a hashtag2
#notes this has a hashtag3`
    );

    assert.equal(
      this.parser.find("#notes", true),
      `2016-06-05
#notes this has a hashtag
#notes this has a hashtag2
#notes this has a hashtag3

2016-06-06
#notes this has a hashtag
3:45pm advising meet with Oprah
- #notes this is a subnote with a hashtag
#notes this has a hashtag2
#notes this has a hashtag3

2016-06-07
#notes this has a hashtag
3:45pm advising meet with Oprah
- #notes this is a subnote with a hashtag
#notes this has a hashtag2
#notes this has a hashtag3`
    );    
  });

  // getAllHashtags(...)
  it("can get all available hashtags", () => {
    assert.deepEqual(
      this.parser.getAllHashtags().sort(),
      ['#notes', '#phdadvisee', '#firsthashtag'].sort(),
    );
    assert.deepEqual(
      this.parser.getAllHashtags(null, null).sort(),
      ['#notes', '#phdadvisee', '#firsthashtag'].sort(),
    );
    assert.deepEqual(
      this.parser.getAllHashtags(null, new Date(2017, 10, 30)).sort(),
      ["#notes", '#phdadvisee'],
    );
    assert.deepEqual(
      this.parser.getAllHashtags(new Date(2017, 10, 30), null).sort(),
      ['#firsthashtag', '#phdadvisee'],
    );
    assert.deepEqual(
      this.parser.getAllHashtags(new Date(2016,5,7), new Date(2017, 10, 30)),
      ['#phdadvisee', "#notes"],
    );    
  });
  
  // getHashtagCount(...)
  it("can count hashtags", () => {
    assert.equal(this.parser.getHashtagCount(), 3);
    assert.equal(this.parser.getHashtagCount(null, null), 3);
    assert.equal(this.parser.getHashtagCount(new Date(2017,10,30), null), 2);
    assert.equal(this.parser.getHashtagCount(null, new Date(2017,10,30)), 2);
  });
});
