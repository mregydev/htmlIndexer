import fs from 'fs';
import { Readable, Transform } from 'stream';
import { EventEmitter } from 'events';

const stopWords =
[
    "a",
    "able",
    "about",
    "across",
    "after",
    "all",
    "almost",
    "also",
    "am",
    "among",
    "an",
    "and",
    "any",
    "are",
    "as",
    "at",
    "be",
    "because",
    "been",
    "but",
    "by",
    "can",
    "cannot",
    "could",
    "dear",
    "did",
    "do",
    "does",
    "either",
    "else",
    "ever",
    "every",
    "for",
    "from",
    "get",
    "got",
    "had",
    "has",
    "have",
    "he",
    "her",
    "hers",
    "him",
    "his",
    "how",
    "however",
    "i",
    "if",
    "in",
    "into",
    "is",
    "it",
    "its",
    "just",
    "least",
    "let",
    "like",
    "likely",
    "may",
    "me",
    "might",
    "most",
    "must",
    "my",
    "neither",
    "no",
    "nor",
    "not",
    "of",
    "off",
    "often",
    "on",
    "only",
    "or",
    "other",
    "our",
    "own",
    "rather",
    "said",
    "say",
    "says",
    "she",
    "should",
    "since",
    "so",
    "some",
    "than",
    "that",
    "the",
    "their",
    "them",
    "then",
    "there",
    "these",
    "they",
    "this",
    "tis",
    "to",
    "too",
    "twas",
    "us",
    "wants",
    "was",
    "we",
    "were",
    "what",
    "when",
    "where",
    "which",
    "while",
    "who",
    "whom",
    "why",
    "will",
    "with",
    "would",
    "yet",
    "you",
    "your"
  ];

class HtmlThrough extends Transform {
    constructor() {
        super({ writableObjectMode: true });
        this.tokens = new Map();
    }

    _transform(chunk, encoding, next) {
        if (!chunk || !chunk.length) {
            next(new Error("chunk is in valid"));
        }
        else if (chunk.length == 2 && chunk[0] == 'text') {
            //apply stemmer
            let tokens = chunk[1].toString().split(/\s+/);

            //Increment frequency
            tokens.forEach((token) => token && token.trim() && stopWords.indexOf(token) == -1 ? this.tokens.set(token, this.tokens.get(token) + 1 || 1) : false);
        }
        next();
    }
}

class IndexerStream extends Readable {
    constructor(tokens, chunkSize) {
        super({ objectMode: true });
        this.chunkSize = chunkSize;
        this.tokens = tokens;
        this.counter = 0;
        this.size = this.tokens.size;
    }

    _read() {

        if (this.counter > this.size) {
            this.push(null);
            return;
        }

        let endIndex = this.counter + this.chunkSize;

        let termsToPush = [];
        while (this.counter < endIndex) {
            let term = this.tokens.keys().next().value;
            let freq = this.tokens.get(term);

            if (term && freq) {
                termsToPush.push({ term, freq, isFirstChunk: this.counter == 0, isLastChunk: this.counter + 1 >= this.size });
                this.tokens.delete(term);
            }
            this.counter++;
        }

        this.push(termsToPush);
    }
}

const htmltokenize=require('html-tokenize');
class HtmlIndexer extends EventEmitter {
    constructor() {
        super();
        this._transform = new HtmlThrough();
        this._transform.once("finish", () => this.emit("indexFinished", this._transform.tokens));
        this._transform.once("error", (err) => this.emit("error", err.message));
    }

    get tokens() {
        return this._transform.tokens;
    }

    getOutPutStream(chunkSize) {
        if (!chunkSize || !this._transform || !this._transform.tokens) {
            this.emit("error", "Invalid arguments");
            return false;
        }
        return new IndexerStream(this._transform.tokens, chunkSize);
    }

    IndexDocument(args) {
        let fsStream = null;

        if (typeof args == "string") {
            fsStream = fs.createReadStream(args);
        }
        else {
            fsStream = args;
        }

        fsStream.on("error", (err) => this.emit("error", err.message));
        fsStream.pipe(htmltokenize()).pipe(this._transform);
    }
}

export { HtmlIndexer };
