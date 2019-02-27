
import { Readable } from 'stream'

export class IndexerStream extends Readable {
  constructor (tokens, chunkSize) {
    super({ objectMode: true })
    this.chunkSize = chunkSize
    this.tokens = tokens
    this.counter = 0
    this.size = this.tokens.size
  }

  _read () {
    if (this.counter > this.size) {
      this.push(null)
      return
    }

    let endIndex = this.counter + this.chunkSize

    let termsToPush = []
    while (this.counter < endIndex) {
      let term = this.tokens.keys().next().value
      let freq = this.tokens.get(term)

      if (term && freq) {
        termsToPush.push({ term, freq, isFirstChunk: this.counter === 0, isLastChunk: this.counter + 1 >= this.size })
        this.tokens.delete(term)
      }
      this.counter++
    }

    this.push(termsToPush)
  }
}
