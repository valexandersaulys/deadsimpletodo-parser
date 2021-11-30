const fs = require("fs");
const moment = require("moment");

const HASHTAG_REGEXP = /(^|\B)#(?![0-9_]+\b)([a-zA-Z0-9_]{1,30})(\b|\r)/g;

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
  _dateFormat = "YYYY-MM-DD";  // https://momentjs.com/
  _meta = {};      // holds all the text blocks
  _dates = [];     // this will be sorted, has dates of type Moment<>
  _hashtags = {};  // maps date to Set of hashtags  
  _sideEffects = {};  // hashtag to a function
  
  constructor(startingText) {
    [this._meta, this._dates, this._hashtags] = this._parse(startingText || "");
    this._dayOf = moment(Date.now()).format(this._dateFormat);
  }
  setFile(filePath, reloadStats) {
    if (Object.keys(this._meta).length > 0 && this._warning)
      throw new Error("there is already text here that will be overwritten -- if you want to replace, set this._warning=False");
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
    }
    [this._meta, this._dates, this._hashtags] = this._parse(fs.readFileSync(filePath).toString());
    this.filePath = filePath;
  }
  saveFile() {
    fs.writeFileSync(
      this.filePath,
      this._getText()
    );
  }

  async _diffArrays(oldArray, newArray) {
    const func = (A, B) => A.filter(x => !B.includes(x)); // get elements in A not in B
    return Promise.all([
      func(oldArray, newArray),
      func(newArray, oldArray),
      (() => oldArray.filter(x => newArray.includes(x)))()
    ]);
  }
  _displayByDateObj(dayOf, formattedReturn) {
    const dateToSearch = dayOf ? moment(dayOf).format(this._dateFormat) : this._dayOf;
    let toRet = (
      this._meta[dateToSearch]
      ?.split("\n")
      ?.reduce((accumulator, currentLine, i) => {
        accumulator += currentLine + "\n"; 
        return accumulator;
      }, "")
    );
    toRet = toRet || "";
    if (formattedReturn)
      toRet = this._formatText(toRet);   
    return toRet.trim();
  }
  _displayByStrings(year, month, day, formattedReturn) {
    return this._displayByDateObj(new Date(year, month, day), formattedReturn);
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
  _formatText(text) {
    /*
      Re-orders such that:
      - dates at the top
      - "straggler" to-dos
      - "#hashtagged" notes
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
    return text.split(/\n(?!-)/).sortAfter((a,b) => getVal(b) - getVal(a), 1).join("\n");
  }
  _getRangeOfBlocks(dayOne, dayTwo) {
    return (
      this._dates
        .filter(x => {
          let clauseOne, clauseTwo;
          if (dayOne)
            clauseOne = x >= dayOne;
          else
            clauseOne = true;
          if (dayTwo)
            clauseTwo = x <= dayTwo;
          else
            clauseTwo = true;
          return clauseOne && clauseTwo;
        })
        .map(x => x.format(this._dateFormat))
    );
  }  
  _getText() {
    return (
      this._dates
        .sort((a,b) => a-b)
        .map(x => this._meta[x.format(this._dateFormat)])
        .join("\n\n")
        .trim()
    );
  }
  _parse(text) {
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
            _hashtags[blockDate.format(this._dateFormat)] = new Set(currentBlock.match(HASHTAG_REGEXP));
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
      return this._displayByStrings(...args);
    else
      return this._displayByDateObj(...args);
  }
  delete(textLine, _date) {
    const deletedLine = this.edit(textLine, "", _date);
    // remove from hashtags?
    // remove from dates?
    return deletedLine;
  }
  edit(oldTextLine, newTextLine, _date) {
    const dateToSearch = _date ? _date : this._dayOf;
    if (!this._meta[dateToSearch]?.includes(oldTextLine)) 
      return false;
    if(newTextLine === "") {
      // the last line won't be included if we append a "\n"
      this._meta[dateToSearch] = (this._meta[dateToSearch] + "\n").replace(oldTextLine + "\n", "").trim();
    } else {
      this._meta[dateToSearch] = (this._meta[dateToSearch] + "\n").replace(oldTextLine + "\n", "").trim();
      this.insert(newTextLine, dateToSearch); 
    }
    return true;
  }
  empty() {
    return Object.keys(this._meta).length === 0;
  }
  find(hashtag) {
    // should also return a list of line numbers?
    return (
      Object.entries(this._meta)
        .reduce((accumulator, x) => {
          let toAppend = (
            x[1].split(/\n(?!-)/)
              .filter(
                currentLine => currentLine.match(HASHTAG_REGEXP)?.includes(hashtag))
              .join("\n")
          );
          if (toAppend)
            accumulator += x[0] + "\n" + toAppend.trim() + "\n\n";
          return accumulator;
        }, "")
        .trim()
    );
  }
  getDateRange() {
    // if I can grab one specific date, do I want to walk through and look at every date in the file?
    if (this._dates.length < 2)
      return [
        this._dates[0],
        this._dates[0]
      ];
    return [
      this._dates[0],
      this._dates[this._dates.length - 1]
    ];
  }  
  getAllHashtags(dayOne, dayTwo) {
    return [
      ...this._getRangeOfBlocks(dayOne, dayTwo)
        .map(x => this._hashtags[x])
        .map(x => [...x])
        .flat()
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
    // does this asssume we have just one line? will it work with multiple lines?
    const dateToSearch = _date ? _date : this._dayOf;

    // if we don't have this, create it
    if(!this._meta[dateToSearch]) 
      this._meta[dateToSearch] = dateToSearch;  
    if(!this._dates.timeContains(moment(dateToSearch, this._dateFormat)))
      this._dates.push(moment(dateToSearch, this._dateFormat));

    // append a new line character
    if(textLine)
      this._meta[dateToSearch] += "\n" + textLine;

    // match any hashtags and add
    const hashtagsPresent = textLine.match(HASHTAG_REGEXP);
    if (this._hashtags[dateToSearch])
      hashtagsPresent?.map(x => this._hashtags[dateToSearch].add(x));
    else
      this._hashtags[dateToSearch] = new Set(hashtagsPresent);

    // trigger any side effects
    hashtagsPresent?.map(hashtag => this._sideEffects[hashtag]?.map(func => func()));
    
    return this._meta[dateToSearch];
  }  
  isValid(text) {
    if(Object.keys(this._meta).length > 0 && !this._warning)
      return true;
    return moment(text.split("\n")[0], this._dateFormat).isValid();
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
      returnLines = String(this.getHashtagCount(...args));
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
      returnLines = this._processEdit(_toEdit, text);
      break;
    default:
      throw new Error(`Invalid command thrown?\t${command}`);
    };
    return returnLines;
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
  }
  search(searchTerm, filterDate) {
    if(!searchTerm) return false;
    // filterDate == true, a string, date object, or null
    return (
      Object.entries(this._meta)
        .reduce((acc, _x) => {
          const [dateKey, textBlock] = _x;
          if(!textBlock.includes(searchTerm))
            return acc;
          acc.push(
            dateKey + "\n" +
              textBlock
              .split(/\n(?!-)/)
              .filter(x => x.includes(searchTerm))
              .join("\n")
          );
          return acc;
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
