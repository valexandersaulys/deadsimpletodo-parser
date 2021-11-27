const { assert, expect } = require("chai");
const fs = require('fs');
const { describe, before, after, it, beforeEach, afterEach } = require("mocha");
const moment = require("moment");
const sinon = require("sinon");

const Parser = require("../");


describe("Processing Dates", () => {
  beforeEach(() => {
    const _date = new Date(2017, 10, 30);
    this.clock = sinon.useFakeTimers(_date.getTime());    
    this.parser = new Parser();
    this.parser.setFile("tests/sample-file.txt");
  });
  afterEach(() => {
    this.clock.restore();
  });

  it("smoke", () => {
    assert.isNotNaN(this.parser);
    const mockedFunc = sinon.fake.returns(42);
    assert.equal(mockedFunc(), 42);
    assert.isTrue(mockedFunc.calledOnce);
    mockedFunc();
    assert.isFalse(mockedFunc.calledOnce);    
  });

  it("defaults to today's date", () => {
    // stub out the moment function
    assert.equal(this.parser._dayOf, "2017-11-30");
  });
  
  it("will allow for the date to be changed", () => {
    this.parser.setDate(new Date(2020, 9, 9));
    assert.equal(this.parser._dayOf, "2020-10-09");
  });

  it("will display the proper day's contents from file given date objects", () => {
    assert.equal(
      this.parser.display(new Date(2017, 10, 30)),
        `11am meet with Head TAs
- where are things at with inviting portfolio reviewers?
11:30am meet with student Enya (interested in research)
review and release A/B Testing assignment grading
12pm HCI group meeting
- vote for lab snacks
send reminders for CHI external reviewers
read Sketchy draft
Zelda pick up eye tracker
- have her sign for it
update biosketch for Co-PI
3:15pm join call with Umbrella Corp and industry partnership staff
3:45pm advising meet with Oprah
4pm Rihanna talk (368 CIT)
5pm 1:1 with Beyonce #phdadvisee
6pm faculty interview dinner with Madonna`
    );

    assert.equal(
      this.parser.display(new Date(2021, 10, 25)),
      `a todo
look another todo
11am timing info
- some notes for timing info
  - some subnotes
    - some sub-subnotes
- more notes`
    );

    assert.equal(
      this.parser.display(new Date(2021, 10, 24)),
      ``
    );
  });

  it("will display the proper day's content from file given strings", () => {
    assert.equal(
      this.parser.display(2017, 10, 30),
        `11am meet with Head TAs
- where are things at with inviting portfolio reviewers?
11:30am meet with student Enya (interested in research)
review and release A/B Testing assignment grading
12pm HCI group meeting
- vote for lab snacks
send reminders for CHI external reviewers
read Sketchy draft
Zelda pick up eye tracker
- have her sign for it
update biosketch for Co-PI
3:15pm join call with Umbrella Corp and industry partnership staff
3:45pm advising meet with Oprah
4pm Rihanna talk (368 CIT)
5pm 1:1 with Beyonce #phdadvisee
6pm faculty interview dinner with Madonna`
    );

    assert.equal(
      this.parser.display(2021, 10, 25),
      `a todo
look another todo
11am timing info
- some notes for timing info
  - some subnotes
    - some sub-subnotes
- more notes`
    );

    assert.equal(
      this.parser.display(2021, 9, 4),
      ``
    );
  });

  it("will default to displaying current day if not passed any arguments", () => {
    assert.equal(
      this.parser.display(),
        `11am meet with Head TAs
- where are things at with inviting portfolio reviewers?
11:30am meet with student Enya (interested in research)
review and release A/B Testing assignment grading
12pm HCI group meeting
- vote for lab snacks
send reminders for CHI external reviewers
read Sketchy draft
Zelda pick up eye tracker
- have her sign for it
update biosketch for Co-PI
3:15pm join call with Umbrella Corp and industry partnership staff
3:45pm advising meet with Oprah
4pm Rihanna talk (368 CIT)
5pm 1:1 with Beyonce #phdadvisee
6pm faculty interview dinner with Madonna`
    );    
  });

  it("will return the given entry, correctly formatted", () => {
    const content = this.parser.display(new Date(2016,5,5), true);
    assert.equal(
      content,
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

    const content2 = this.parser.display(new Date(2016,5,6), true);
    assert.equal(
      content2,
      `3:15pm join call with Umbrella Corp and industry partnership staff
3:45pm advising meet with Oprah
- #notes this is a subnote with a hashtag
4pm Rihanna talk (368 CIT)
5pm 1:1 with Beyonce #phdadvisee
6pm faculty interview dinner with Madonna
some notes without anything attached
look, more notes!
#notes this has a hashtag
#notes this has a hashtag2
#notes this has a hashtag3`
    );

    // NOTE: cannot do sub-subnotes... for now
  });

  it("can get the first and last dates correctly", () => {
    const [lBookend, rBookend] = this.parser.getDateRange();
    assert.equal(lBookend.format("YYYY-MM-DD"), "2016-06-05");
     assert.equal(rBookend.format("YYYY-MM-DD"), "2021-11-26");
  });
});
