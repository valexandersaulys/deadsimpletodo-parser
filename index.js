const fs = require("fs");
const moment = require("moment");

const HASHTAG_REGEXP = /(^|\B)#(?![0-9_]+\b)([a-zA-Z0-9_]{1,30})(\b|\r)/g;

Array.prototype.timeContains = function(value) {
  // f***ing momentJS compares incorrectly
  return this.filter(x => x.isSame(value)).length > 0;
};

class Parser {
  filePath = null;
  _warning = true;
  _dayOf = null;   // string for the date
  _dateFormat = "YYYY-MM-DD";  // https://momentjs.com/
  _hashtags = {};  // maps date to Set of hashtags
  _dates = [];     // this will be sorted, has dates of type Moment<>
  _meta = {};      // holds all the text blocks
  _sideEffects = {};  // hashtag to a function
  
  constructor(startingText) {
    this.parse(startingText || "");
    this._dayOf = moment(Date.now()).format(this._dateFormat);
  }
  setFile(filePath, reloadStats) {
    if (Object.keys(this._meta).length > 0 && this._warning)
      throw new Error("there is already text here that will be overwritten -- if you want to replace, set this._warning=False");
    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, "");
    }
    this.parse(fs.readFileSync(filePath).toString());
    this.filePath = filePath;
  }
  saveFile() {
    fs.writeFileSync(
      this.filePath,
      this._getText()
    );
  }
  
  _displayByDateObj(dayOf, formattedReturn) {
    const dateToSearch = dayOf ? moment(dayOf).format(this._dateFormat) : this._dayOf;
    let toRet = (
      this._meta[dateToSearch]
      ?.split("\n")
      ?.reduce((accumulator, currentLine, i) => {
        if (i == 0) // first line is the date
          return accumulator;
        accumulator += currentLine + "\n"; // won't be appending newlines
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
    return text.split(/\n(?!-)/).sort((a,b) => getVal(b) - getVal(a)).join("\n");
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
    );
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
  edit(oldTextLine, newTextLine, _date) {
    const dateToSearch = _date ? _date : this._dayOf;
    if (!this._meta[dateToSearch]?.includes(oldTextLine)) 
      return false;
    this._meta[dateToSearch] = this._meta[dateToSearch].replace(oldTextLine, "");
    this.insert(newTextLine, dateToSearch);
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
    console.log("-", dayOne, dayTwo);
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
    const dateToSearch = escape(_date ? _date : this._dayOf);
    if(!this._meta[dateToSearch]) 
      this._meta[dateToSearch] = dateToSearch;
    if(!this._dates.timeContains(moment(dateToSearch, this._dateFormat)))
      this._dates.push(moment(dateToSearch, this._dateFormat));
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
  }  
  isValid(text) {
    if(Object.keys(this._meta).length > 0 && !this._warning)
      return true;
    return moment(text.split("\n")[0], this._dateFormat).isValid();
  }
  parse(text) {
    if (text === "" || !text)
      return "";
    if (this.isValid(text)) {
      // walk through each date block, appending all hashtags and dates
      this._dates = (
        text
          .split("\n\n")
          .reduce((accumulator, currentBlock) => {
            const blockDate = moment(currentBlock, this._dateFormat);
            accumulator.push(blockDate);
            this._meta[escape(blockDate.format(this._dateFormat))] = currentBlock;
            this._hashtags[blockDate.format(this._dateFormat)] = new Set(currentBlock.match(HASHTAG_REGEXP));
            return accumulator;
          }, [])
          .sort((a,b) => a - b) // sort ascending
      );
      // what if we hash everything to slots on another object?
      // that would make iterating much faster... any memory increase?
      // can I ditch this.text altogether?
      return this._meta;
    } else
      throw new Error("Invalid text parsed");
  }  
  process(command, text) {
    let args;
    switch(command) {
    case "insert":
      return this.insert(text);
    case "search":
      return this.search(text);
    case "find":
      return this.find(text);
    case "hashtags":
      console.log("=", text);
      if(!text)
        args = [null, null];
      else
        args = text.split(" ").map(x => moment(x, this._dateFormat));
      return this.getAllHashtags(...args);
    case "hashtag-count":
      if(!text)
        args = [null, null];
      else
        args = text.split(" ").map(x => moment(x, this._dateFormat));
      return this.getHashtagCount(...args);
    case "display":
      return this.display(text, true);
    case "change-date":
      args = text ? text.split(" ") : null;
      return this.setDate(text);
    case "first-date":
      return this.getDateRange()[0].format(this._dateFormat);
    case "last-date":
      return this.getDateRange()[1].format(this._dateFormat);
    case "edit":
      if (!args)
        throw new Error("Need text for command `edit`");
      /*
        How would this order flow?
        Load in the current line with '/edit' and then process?
        Should be able to get the current line if there's one
        */
      args = text.split(" "); // won't work, too many spaces...
      return this.edit(...args);
    default:
      throw new Error("Invalid command thrown?", command, text);
    };
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
