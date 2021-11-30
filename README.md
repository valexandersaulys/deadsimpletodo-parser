# DeadSimpleTodo Parser

Inspired by [Jeff Huang's blog post](https://jeffhuang.com/productivity_text_file/)

To install:

```shell
npm install <path-to-directory>
# use $(pwd) to get the current directory -- need to be in separate folder
```

For future use in my web app **DeadSimpleTodo**!


## Known Limitations

Cannot do sub-subnotes

```
3:45pm advising meet with Oprah
- #notes this is a subnote with a hashtag
  - other sub-subnotes
```


## Brain Dump

Record of done

From “todo list” to “done” list

What kinds of todos do people keep?
  * ones tied to time and date 
  * ones as “stragglers” 
  * notes with themes and dates

Homepage as an “auto run” command

Command driven from the interface — use “/“ for commands like “/find” or “/ntasks” or “/show <date>”

Webrooks and APIs for paying users — some nominal $9/yr fee a la Pinboard and Miniflux 

No database (except for users?) — simply reads from a text document and parses it

What about edits? “/edit” will return the whole chunk of things for editing? How would I track which lines are to be changed?

2021-11-02
2 #notes this is a note

2021-10-10
1 #notes this is another note

These would change the line numbers in question -- any numbers followed by a space would be ignored in my setup I suppose

The parser -- written in NodeJS? -- would be open sourced



## Example File

Partially taken from the blog post

```
2017-11-31
11am meet with Head TAs
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
6pm faculty interview dinner with Madonna

2021-11-25
a todo
look another todo
11am timing info
- some notes for timing info
  - some subnotes
    - some sub-subnotes
- more notes
```


## Specs

### Commands

| example command                       | description                                 |
| ----                                  | ----                                        |
| `some random notes with no additions` | straight up notes (as to-dos?)              |
| `#tag`                                | puts in a tag                               |
| `YYYY-mm-dd`                          | date                                        |
| `HH:MM`                               | time -- date is assumed from the header     |
| `- some notes for a time`             | notes for a time, keep be subnested by tabs |
|                                       |                                             |


### Class Functions

| class function                          | description                                                             |
| ----                                    | ----                                                                    |
| `readFile()`                            | (replaced by mixin)                                                     |
| `setFile(_filePath_, null)`             | specific to text mixin that is used by default, reads the file in       |
| `setFile(_filePath_, true)`             | reads the file in, reruns statistics                                    |
| `save()`                                | save the file to the current path                                       |
| `find(_hashtag_)`                       | will search for a particular hashtag, subnotes match to the parent time |
| `display(_date_, null, null)`           | get the particular date as raw text string                              |
| `display(_date_, true, null)`           | get the particular date but formatted (see below)                       |
| `display(_date_, null, true)`           | get raw text string with line numbers (for editing)                     |
| `getAllHashtags(null, null)`            | get all hashtags                                                        |
| `getAllHashtags(_dateOne_, _dateTwo_)`  | get all hashtags for a given date range                                 |
| `getAllHashtags(null, _dateTwo_)`       | get all hashtags before a date                                          |
| `getAllHashtags(_dateOne_, null)`       | get all hashtags after a particular date                                |
| `getHashTagCount(_dateOne_, _dateTwo_)` | get count of hashtags for a particular range                            |
| `getDateRange()`                        | get complete date range                                                 |
| `setDate(_date_)`                       | set the day for inserting text, otherwise will use current day          |
| `insert(_text_, null)`                  | insert text for the day                                                 |
| `insert(_text_, Date())`                | insert text for a different day                                         |
| `add(...)`                              | alias for `insert`                                                      |
| `edit(_oldText_, _newText_)`            | edit a particular line number in the text file                          |

Preferable formatting will be to keep all time-sensitive todos up top,
"straggler" todos followed up, and all "hashtag" notes at the
bottom. This is what the second arg of `display()` will do. 

Caching will be used for holding certain values for quick access
(e.g. `getAllHashtags`).

Writes & reads happen in memory once loaded, explicit call to `save()`
required to save


### Things to Keep in Mind

[Mixins will be used to replace the read/write text file stream](https://javascript.info/mixins)

```
let sayHiMixin = {
  sayHi() {
    return `Hello ${this.name}`;
  },
  sayBye() {
    return `Bye ${this.name}`;
  }
};

// usage:
class User {
    // variables can be declared outside but cannot be named
    thing = 32;

  constructor(name) {
    this.name = name;
  }
}

// copy the methods
Object.assign(User.prototype, sayHiMixin);

// now User can say hi
new User("Dude").sayHi(); // Hello Dude!
```


# License

MIT
