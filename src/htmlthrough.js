import { stopWords } from './stopwords'; 
import {Transform} from 'stream';
export class HtmlThrough extends Transform {
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