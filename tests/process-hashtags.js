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
    this.parser.setFile("tests/sample-file.txt");
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
    assert.equal(Object.keys(this.parser._hashtags).length, 6);
    assert.equal(
      JSON.stringify(Object.keys(this.parser._hashtags)),
      JSON.stringify([
        '2017-11-30',
        '2021-11-25',
        '2021-11-26',
        '2016-06-05',
        '2016-06-06',
        '2016-06-07'
      ])
    );
    
    assert.equal(
      JSON.stringify(this.parser.getAllHashtags().slice().sort()),
      JSON.stringify(['#notes', '#phdadvisee', '#firsthashtag'].slice().sort()),
    );
    assert.equal(
      JSON.stringify(this.parser.getAllHashtags(null, null).slice().sort()),
      JSON.stringify(['#phdadvisee', '#firsthashtag', '#notes'].slice().sort()),
    );

    assert.equal(
      JSON.stringify(this.parser.getAllHashtags(null, new Date(2017, 10, 30)).slice().sort()),
      JSON.stringify(['#phdadvisee', "#notes"].slice().sort()),
    );
    assert.equal(
      JSON.stringify(this.parser.getAllHashtags(new Date(2017, 10, 30), null).slice().sort()),
      JSON.stringify(['#firsthashtag', '#phdadvisee'].slice().sort()),
    );
    assert.equal(
      JSON.stringify(this.parser.getAllHashtags(new Date(2016,5,7), new Date(2017, 10, 30)).slice().sort()),
      JSON.stringify(['#phdadvisee', "#notes"].slice().sort()),
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
