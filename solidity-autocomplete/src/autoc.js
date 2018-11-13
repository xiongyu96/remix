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
  suggest (w) {
    // Prepare to get AST
    const outputSelection = {
      // Enable the metadata and bytecode outputs of every single contract.
      '*': {
        '': ['ast', 'legacyAST'],
        '*': []
      }
    }
    const settings = {
      optimizer: { enabled: true, runs: 500 },
      evmVersion: 'byzantium',
      outputSelection
    }
    let sources = {}
    sources[this.filename] = { 'content': this.fileContent }
    const input = { language: 'Solidity', sources, settings }
    const output = JSON.parse(Solc.compileStandardWrapper(JSON.stringify(input)))
    const ast = output.sources[this.filename].ast
    const astq = new ASTQ()
    astq.adapter({
      taste: function (node) {
        console.log('Taste')
        console.log(node)
        return (typeof node === 'object' && typeof node.nodeType === 'string' && node !== null && node.nodeType === 'SourceUnit')
      },
      getParentNode: function (node, type) {
        console.log('Need parent')
        console.log(node)
        return node.parent()
      },
      getChildNodes: function (node) {
        console.log('Getting children')
        console.log(node.nodes)
        return node.nodes ? node.nodes : []
      },
      getNodeType: function (node) { return node.nodeType },
      getNodeAttrNames: function (node) {
        console.log('Node attr')
        return node.attrs()
      },
      getNodeAttrValue: function (node, attr) { return node.get(attr) }
    })
    astq.query(ast, `
      // VariableDeclarator [
           /:id   Identifier [ @name  ]
        && /:init Literal    [ @value ]
    ]`).forEach(function (node) {
      console.log('ASTquery result')
      console.log(`${node.id.name}: ${node.init.value}`)
    })
    return []
  }
}

module.exports = AutoC
