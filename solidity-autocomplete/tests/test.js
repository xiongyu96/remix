const assert = require('assert')
const AutoC = require('../src/autoc.js')

describe('AutocompleteTests', function() {
    describe('#runFileTest', function() {
        const filename = 'tests/sol/greeter.sol';
        let tests = [], results = [];

        before(function(done) {
            results = new AutoC(filename).suggest('Mor')
            done()
        })
        it('should have 1 suggestion', function() {
            assert.equal(results.length, 3)
        })
    })
  return true
})
