// Autocomplete library for solidity

const fs = require('fs')
const Solc = require('solc')
const ASTQ = require('astq')

class AutoC {
  constructor (fn) {
    this.filename = fn
    this.fileContent = fs.readFileSync(this.filename, 'utf8', (err, data) => {
      if (err) throw err
      return data
    })
  }
  suggest (queryStr) {
    // Prepare to get AST
    const outputSelection = {
      // Enable the metadata and bytecode outputs of every single contract.
      '*': {
        '': ['ast'],
        '*': []
      }
    }
    const settings = {
      optimizer: { enabled: true, runs: 500 },
      evmVersion: 'byzantium',
      outputSelection
    }
    let sources = {}
    let output = {}
    let resultNodes = []
    sources[this.filename] = { 'content': this.fileContent }
    const input = { language: 'Solidity', sources, settings }
    try {
      output = JSON.parse(Solc.compile(JSON.stringify(input)))
    } catch (e) {
      throw e
    } finally {
      const ast = output.sources[this.filename].ast
      const astq = new ASTQ()
      astq.adapter({
        taste: function (node) {
          return (typeof node === 'object' && typeof node.nodeType === 'string' && node !== null && node.nodeType === 'SourceUnit')
        },
        getParentNode: function (node, type) {
          return node.parent()
        },
        getChildNodes: function (node) {
          return node.nodes ? node.nodes : []
        },
        getNodeType: function (node) { return node.nodeType },
        getNodeAttrNames: function (node) {
          return node.attrs()
        },
        getNodeAttrValue: function (node, attr) {
          return node[attr]
        }
      })
      astq.query(ast, queryStr).forEach(function (node) {
        resultNodes.push(node)
      })
    }
    return resultNodes
  }
}

module.exports = AutoC
