

import fs from 'fs';
import {HtmlThrough} from './htmlthrough';
import {IndexerStream} from './indexerstream'
import {EventEmitter} from 'events';

const htmltokenize=require('html-tokenize');
export class HtmlIndexer extends EventEmitter {
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