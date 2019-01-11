// Autocomplete library for solidity

import * as fs from 'fs'
import * as Solc from 'solc'
import * as ASTQ from 'astq'

export class AutoC {
  private filename: string
  private fileContent: string
  constructor(fn: string) {
    this.filename = fn
    this.fileContent = fs.readFileSync(this.filename, 'utf8')
  }

  suggest(queryStr: string) {
    // Prepare to get AST
    const outputSelection: object = {
      // Enable the metadata and bytecode outputs of every single contract.
      '*': {
        '': ['ast'],
        '*': []
      }
    }
    const settings: object = {
      optimizer: { enabled: true, runs: 500 },
      evmVersion: 'byzantium',
      outputSelection
    }
    let sources = {}
    let output: any = {}
    let resultNodes: Array<any> = []
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
        taste: (node: any) => {
          return (typeof node === 'object' && typeof node.nodeType === 'string' && node !== null && node.nodeType === 'SourceUnit')
        },
        getParentNode: (node: any, type: string) => {
          return node.parent()
        },
        getChildNodes: (node: any) => {
          return node.nodes ? node.nodes : []
        },
        getNodeType: (node: any) => { return node.nodeType },
        getNodeAttrNames: (node: any) => {
          return node.attrs()
        },
        getNodeAttrValue: (node: any, attr: any) => {
          return node[attr]
        }
      })
      astq.query(ast, queryStr).forEach((node: any) => {
        resultNodes.push(node)
      })
    }
    return resultNodes
  }
}
