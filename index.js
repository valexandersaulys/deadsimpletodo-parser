const fs = require("fs");
const moment = require("moment");

const HASHTAG_REGEXP = /(^|\B)#(?![0-9_]+\b)([a-zA-Z0-9_]{1,30})(\b|\r)/g;
const LINE_BREAK_REGEXP = /\n(?!-)/;
const DEFAULT_DATE_FORMAT = "YYYY-MM-DD";

Array.prototype.timeContains = function(value) {
  // f***ing momentJS compares incorrectly
  return this.filter(x => x.isSame(value)).length > 0;
};

Array.prototype.sortAfter = function (func, start) {
  this.splice(start, 0, ...this.splice(start, this.length - start + 1).sort(func));
  return this;
}

class Parser {
  filePath = null;
  _warning = true;
  _dayOf = null;   // string for the date
  _dateFormat = "";  // https://momentjs.com/
  _sideEffects = {};  // hashtag to a function
  
  constructor(filePath, dateFormat) {
    this._dateFormat = dateFormat || DEFAULT_DATE_FORMAT;
    this._dayOf = moment(Date.now()).format(this._dateFormat);
    this.setFile(filePath);
  }

  // this can be changed in subclasses
  _read() {
    if(this.filePath)
      return fs.readFileSync(this.filePath).toString() || "";
    return "";
  }
  _write(_text) {
    return fs.writeFileSync(this.filePath, _text);
  }
  _changeDateFormat() {
    throw new Error("Not Implemented Yet");
  }
  // * * * * * * 

  // helper functions for processing the text file
  _findSpecificDate(dateToSearch) {
    // dateToSearch should be a string
    return this._read().split("\n\n")
      .reduce((accumulator, currentBlock) => {
        const blockDate = moment(currentBlock, this._dateFormat).format(this._dateFormat);
        if (blockDate == dateToSearch)
          accumulator = currentBlock;
        return accumulator;
      }, "");
  }
  _getAllDates() {
    // returns moment.js objects
    if(!this._allDates)
      this._allDates = (
        this._read()
          .split("\n\n")
          .reduce((accumulator, currentBlock) => {
            if (!currentBlock.trim())
              return accumulator;
            const blockDate = moment(currentBlock, this._dateFormat);
            accumulator.push(blockDate);
            return accumulator;
          }, [])
          .sort((a,b) => a-b) // in order or not?
      );
    return this._allDates;
  }
  _hasDate(_date) {
    // accepts _date as string
    const _dateFormatted = moment(_date, this._dateFormat);
    if (!this._allDates)
      this._allDates = this._getAllDates();
    return this._allDates.timeContains(_dateFormatted);
  }
  // * * * * * * 
  
  setFile(filePath) {
    if(!filePath)
      return false;
    if (this.filePath && this._warning)
      throw new Error("there is already text here that will be overwritten -- if you want to replace, set this._warning=False");
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, " ");
    }
    this.filePath = filePath;
    return this.filePath;
  }

  async _diffArrays(oldArray, newArray) {
    const func = (A, B) => A.filter(x => !B.includes(x)); // get elements in A not in B
    return Promise.all([
      func(oldArray, newArray),
      func(newArray, oldArray),
      (() => oldArray.filter(x => newArray.includes(x)))()
    ]);
  }
  _displayByDateObj(dayOf) {
    const dateToSearch = dayOf ? moment(dayOf).format(this._dateFormat) : this._dayOf;
    let toRet = (
      this._findSpecificDate(dateToSearch)
      ?.split("\n")
      ?.reduce((accumulator, currentLine, i) => {
        accumulator += currentLine + "\n"; 
        return accumulator;
      }, "")
    );
    toRet = toRet || "";
    return this._formatText(toRet.trim());
  }
  _displayByStrings(year, month, day) {
    return this._displayByDateObj(new Date(year, month, day));
  }
  async _diffTextBlocks(oldStr, newStr, _date) {
    const splitKey = "\n"; 
    const func = (A, B) => A.filter(x => !B.includes(x)); 
    return Promise.all([
      func(oldStr.split(splitKey), newStr.split(splitKey)),
      func(newStr.split(splitKey), oldStr.split(splitKey)),      
      (() => _date)()
    ]);
  }
  _formatJson(text) {
    if(typeof text != "string")  return text;
    text = text.trim();
    const getVal = (x) => {
      const asTime = moment(x.split(" ")[0], ['h:m a', 'H:m']);
      const asHashtag = HASHTAG_REGEXP.test(x);
      let toRet;
      if (asTime.isValid()) {
        toRet = "datetime";
      } else if (asHashtag) {
        toRet = "hashtag";
      } else {
        toRet = "todo";
      };
      return toRet;
    };
    // lookahead to not split subnotes
    return text
      .split(LINE_BREAK_REGEXP)
      .map(line => ({line, categorized: getVal(line)}));
  }
  convertJsonBackToText(_json) {
    return _json
      .map(x => x.line)
      .join("\n");
  }
  _formatText(text) {
    /*
      Re-orders such that:
      - dates at the top
      - "straggler" to-dos
      - "#hashtagged" notes

      ignores the date header
    */
    text = text.trim();
    const getVal = (x) => {
      const asTime = moment(x.split(" ")[0], ['h:m a', 'H:m']);
      const asHashtag = HASHTAG_REGEXP.test(x);
      let toRet;
      if (asTime.isValid()) {
        toRet = 1 / asTime.toDate().getTime();
      } else if (asHashtag) {
        toRet = -1;
      } else {
        toRet = 0;
      };
      return toRet;
    };
    // lookahead to not split subnotes
    return text
      .split(LINE_BREAK_REGEXP)
      .sortAfter((a,b) => getVal(b) - getVal(a), 1).join("\n");
  }
  _getRangeOfBlocks(dayOne, dayTwo) {
    if(!this._allDates)
      this._allDates = this._getAllDates(); // returns momentJS objects
    return (
      this._read()
        .split("\n\n")
        .filter(_x => {
          const x = moment(_x, this._dateFormat);
          let clauseOne, clauseTwo;
          if (dayOne)  clauseOne = x >= dayOne;
          else  clauseOne = true;
          if (dayTwo)  clauseTwo = x <= dayTwo;
          else  clauseTwo = true;
          return clauseOne && clauseTwo;
        })
    );
  }  
  _parse(text) {
    // this is still useful for edit
    if (text === "" || !text)
      return [{}, [], {}];
    if (this.isValid(text)) {
      // this could be refactored
      let _dates = [], _meta = {}, _hashtags = {};
      _dates = (
        text
          .split("\n\n")
          .reduce((accumulator, currentBlock) => {
            const blockDate = moment(currentBlock, this._dateFormat);
            accumulator.push(blockDate);
            _meta[escape(blockDate.format(this._dateFormat))] = currentBlock;
            _hashtags[blockDate.format(this._dateFormat)] = (
              new Set(currentBlock.match(HASHTAG_REGEXP))
            );
            return accumulator;
          }, [])
          .sort((a,b) => a - b) // sort ascending
      );
      return [_meta, _dates, _hashtags];
    } else
      throw new Error("Invalid text parsed");
  }
  add(...args) {
    return this.insert(...args);
  }
  addSideEffect(_func, _hashtag) {
    // add a sideffect whenever a hashtag is added
    // anything else to add a side effect for?
    if (!this._sideEffects[_hashtag])
      this._sideEffects[_hashtag] = [];
    this._sideEffects[_hashtag].push(_func);
    return _func;
  }  
  display(...args) {
    if (args.length > 2)
      return this._displayByStrings(...args).trim();
    else
      return this._displayByDateObj(...args).trim();
  }
  delete(textLine, _date) {
    const deletedLine = this.edit(textLine, "", _date);
    // remove from hashtags?
    // remove from dates?
    return deletedLine;
  }
  edit(oldTextLine, newTextLine, _date) {
    // assumes _date, oldTextLine, and newTextLine exists
    this._hashtags = null, this._allDates = null;
    const dateToSearch = _date ? _date : this._dayOf;
    if(!this._hasDate(dateToSearch))
      return "";
    // NOTE: need to append \n to capture end lines
    let blockToInsert = (this._findSpecificDate(dateToSearch) + "\n")
        .replace(
          oldTextLine + "\n",
          newTextLine ? newTextLine + "\n" : newTextLine
        )
        .trim();
    this._write(
      this._read()
        .split("\n\n")
        .map(textBlock => {
          const blockDate = textBlock.split("\n")[0];
          if(blockDate == dateToSearch)
            return blockToInsert;
          return textBlock;
        })
        .join("\n\n")
    );
    return blockToInsert;
  }
  empty() {
    return this._read().trim() == "";
  }
  find(hashtag) {
    return (
      this._read().split("\n\n")
        .reduce((accumulator, currentBlock) => {
          // const blockDate = moment(currentBlock, this._dateFormat);
          const blockDate = currentBlock.split("\n")[0];
          // look for lines that have the hashtag, add to accumulator
          let toAppend = (
            currentBlock
              .split(LINE_BREAK_REGEXP)
              .filter(line => line.match(HASHTAG_REGEXP)?.includes(hashtag))
              .join("\n")
          );
          if (toAppend)
            accumulator += blockDate + "\n" + toAppend.trim() + "\n\n";
          return accumulator;
        }, "")
        .trim()
    );
  }
  getDateRange() {
    // if I can grab one specific date, do I want to walk through and look at every date in the file?
    if (this._getAllDates().length < 2)
      return [
        this._getAllDates()[0],
        this._getAllDates()[0]
      ];
    return [
      this._getAllDates()[0],
      this._getAllDates()[this._getAllDates().length - 1]
    ];
  }  
  getAllHashtags(dayOne, dayTwo) {
    return [
      ...this._getRangeOfBlocks(dayOne, dayTwo)
        .map(x => x.match(HASHTAG_REGEXP))
        .flat()
        .filter(x => x)
        .reduce((_set, x) => {
          _set.add(x);
          return _set;
        }, new Set())
    ];
  }
  getHashtagCount(dayOne, dayTwo) {
    return this.getAllHashtags(dayOne, dayTwo).length;
  }
  insert(textLine, _date) {
    this.hashtags = null, this._allDates = null;
    const dateToSearch = _date ? _date : this._dayOf; 

    let blockToInsert;
    if(this._hasDate(dateToSearch)) {
      // if we have this already, we append to that text block
      blockToInsert = this._findSpecificDate(dateToSearch);
      blockToInsert += "\n" + textLine;
      blockToInsert = this._formatText(blockToInsert);
      this._write(
        this._read()
          .split("\n\n")
          .map(textBlock => {
            const blockDate = textBlock.split("\n")[0];
            if(blockDate == dateToSearch)
              return blockToInsert;
            return textBlock;
          })
          .join("\n\n")
      );
    } else {
      // if we don't, we add a new block to the bottom
      // TO-DO: keep these sorted by date?
      blockToInsert = dateToSearch + "\n" + textLine;
      this._write(this._read() + "\n\n" + blockToInsert);
    }

    // trigger any side effects
    const hashtagsPresent = blockToInsert.match(HASHTAG_REGEXP);
    hashtagsPresent?.map(hashtag => this._sideEffects[hashtag]?.map(func => func()));
    
    return blockToInsert;
  }  
  isValid(text) {
    /*
      This needs to be entirely rewritten
    */
    return true;
  }
  process(command, text, _toEdit) {
    let args, returnLines;
    switch(command) {
    case "insert":
      // returns the full text which needs to be sorted
      returnLines = this._formatText(this.insert(text));
      break;
    case "search":
      returnLines = this.search(text);
      break;
    case "find":
      returnLines = this.find(text);
      break;
    case "hashtags":
      if(!text)
        args = [null, null];
      else
        args = text.split(" ").map(x => moment(x, this._dateFormat));
      returnLines = this.getAllHashtags(...args);
      break;
    case "hashtag-count":
      if(!text)
        args = [null, null];
      else
        args = text.split(" ").map(x => moment(x, this._dateFormat));
      returnLines = this.getHashtagCount(...args);
      break;
    case "display":
      returnLines = this.display(text, true);
      break;
    case "change-date":
      args = text ? text.split(" ") : null;
      returnLines = this.setDate(text);
      break;
    case "first-date":
      returnLines = this.getDateRange()[0].format(this._dateFormat);
      break;
    case "last-date":
      returnLines = this.getDateRange()[1].format(this._dateFormat);
      break;
    case "edit":
      if (!text)
        throw new Error("Need text for command `edit`");
      if (!_toEdit)
        throw new Error("Need to have run previous text to edit");
      returnLines = this._processEdit(this.convertJsonBackToText(_toEdit), text);
      break;
    default:
      throw new Error(`Invalid command thrown?\t${command}`);
    };
    return this._formatJson(returnLines);
  }
  async _processEdit(oldText, newText) {
    const [oldMeta, _, oldHashtags] = this._parse(oldText);
    const oldDates = Object.keys(oldMeta);
    const [newMeta, __, newHashtags] = this._parse(newText);
    const newDates = Object.keys(newMeta);
    const [uniqueDatesOld, uniqueDatesNew, datesInCommon] = await this._diffArrays(
      oldDates, newDates);
    if(!uniqueDatesOld && !uniqueDatesNew) {
      // all text in uniqueDatesOld is deleted, all text in uniqueDatesNew is added
      // otherwise, we continue
      return [false, false];
    }
    if(datesInCommon.length > 0) {
      return Promise.all(
        datesInCommon
          .map(x => {
            return this._diffTextBlocks(oldMeta[x], newMeta[x], x)
              .then(thing => {
                const [linesToDelete, linesToInsert, _date] = thing;
                 linesToDelete.map(line => this.delete(line, _date));
                 linesToInsert.map(line => this.insert(line, _date));
                 return {
                   linesDeleted: linesToDelete,
                   linesInserted: linesToInsert,
                   date: _date
                 };
               });
          })
      );
    }
    return null;
  }
  search(searchTerm, filterDate) {
    if(!searchTerm) return "";
    // filterDate == true, a string, date object, or null
    return (
      this._read().split("\n\n")
        .reduce((accumulator, currentBlock) => {
          // const blockDate = moment(currentBlock, this._dateFormat);
          const blockDate = currentBlock.split("\n")[0];
          if(!currentBlock.includes(searchTerm))
            return accumulator;          
          let toAppend = (
            currentBlock
              .split(LINE_BREAK_REGEXP)
              .filter(line => line.includes(searchTerm))
              .join("\n")
          );
          if (toAppend)
            accumulator.push(blockDate + "\n" + toAppend.trim());
          return accumulator;
        }, [])
        .join("\n\n")
        .trim()
    );
  }  
  setDate(dayOf) {
    // takes a date
    this._dayOf = moment(dayOf).format(this._dateFormat);
  }
}

module.exports = Parser;
