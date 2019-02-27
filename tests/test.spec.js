
//Use of chai for assertion
const should = require('chai').should();

const HtmlIndexer = new require('../dist/output.cjs.js').HtmlIndexer;


const indexer=new HtmlIndexer();

describe("happy case", () => {
    //this is an edge case
    it("should return tokens of passed documents in json format", (done) => {

        indexer.IndexDocument("tests/test.html");
        indexer.on("indexFinished", () => {
            indexer.tokens.size.should.equal(1);
             console.log(indexer.tokens);

            for (var key of indexer.tokens.keys()) {
                
                key.should.equal("test");
                done();
            }

        });
    });
});