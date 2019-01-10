'use strict'
var Web3 = require('web3')
var EventManager = require('../../eventManager')

import contextHandlers from './context-handlers'

var blankWeb3 = new Web3()

var mainNetGenesisHash = '0xd4e56740f876aef8c010b86a40d5f56745a118d0906a34e69aec8c0db1cb8fa3'

/*
  trigger contextChanged, web3EndpointChanged
*/
function ExecutionContext () {
  var self = this
  this.event = new EventManager()

  this.currentHandler = null

  this.blockGasLimitDefault = 4300000
  this.blockGasLimit = this.blockGasLimitDefault

  this.init = function (config) {
    if (config.get('settings/always-use-vm')) {
      this.currentHandler = contextHandlers['vm-byzantium']
    } else {
      this.currentHandler = contextHandlers['injected'].provider ? contextHandlers['injected'] : contextHandlers['vm-byzantium']
    }
  }

  this.getProvider = function () {
    return this.currentHandler.id
  }

  this.isVM = function () {
    return this.currentHandler.id === 'vm-constantinople' || this.currentHandler.id === 'vm-byzantium'
  }

  this.web3 = function () {
    return this.currentHandler.obj.web3
  }

  this.detectNetwork = function (callback) {
    if (this.isVM()) {
      callback(null, { id: '-', name: 'VM' })
    } else {
      this.web3().version.getNetwork((err, id) => {
        var name = null
        if (err) name = 'Unknown'
        // https://github.com/ethereum/EIPs/blob/master/EIPS/eip-155.md
        else if (id === '1') name = 'Main'
        else if (id === '2') name = 'Morden (deprecated)'
        else if (id === '3') name = 'Ropsten'
        else if (id === '4') name = 'Rinkeby'
        else if (id === '42') name = 'Kovan'
        else name = 'Custom'

        if (id === '1') {
          this.web3().eth.getBlock(0, (error, block) => {
            if (error) console.log('cant query first block')
            if (block && block.hash !== mainNetGenesisHash) name = 'Custom'
            callback(err, { id, name })
          })
        } else {
          callback(err, { id, name })
        }
      })
    }
  }

  this.removeProvider = function (name) {
    if (name && contextHandlers[name]) {
      delete contextHandlers[name]
      self.event.trigger('removeProvider', [name])
    }
  }

  this.addProvider = function (network) {
    if (!network || !network.name || !network.url) return self.event.trigger('addProvider', { error: 'name and url has to be specified' })
    if (contextHandlers[network.name]) return self.event.trigger('addProvider', { error: 'provider already registered' })
    contextHandlers[network.name] = {
      name: network.name,
      id: network.name,
      desc: `custom provider: connect to an external node using : ${network.url}`,
      obj: new Web3(new Web3.providers.HttpProvider(network.url)),
      handler: (infoCb, cb) => {
        cb(null, contextHandlers[network.name])
      }
    }
    self.event.trigger('addProvider', [network])
  }

  this.internalWeb3 = function () {
    return this.currentHandler.obj.web3
  }

  this.blankWeb3 = function () {
    return blankWeb3
  }

  this.stateManager = function () {
    return this.currentHandler.obj.stateManager
  }

  this.vm = function () {
    return this.currentHandler.obj.vm
  }

  this.setContext = function (context, confirmCb, infoCb) {
    this.currentHandler = contextHandlers['context']
    this.executionContextChange(context, confirmCb, infoCb)
  }

  this.executionContextChange = function (context, infoCb, cb) {
    if (!cb) cb = () => {}
    if (contextHandlers[context]) {
      contextHandlers[context].handler(infoCb, (error, handler) => {
        if (error) return cb(error)
        this.currentHandler = handler
        this.event.trigger('contextChanged', [handler.id])
        this._updateBlockGasLimit()
        cb(error, handler)
      })
    }
  }

  this.currentblockGasLimit = function () {
    return this.blockGasLimit
  }

  this.stopListenOnLastBlock = function () {
    if (this.listenOnLastBlockId) clearInterval(this.listenOnLastBlockId)
    this.listenOnLastBlockId = null
  }

  this._updateBlockGasLimit = function () {
    if (!this.isVM()) {
      this.currentHandler.obj.web3.eth.getBlock('latest', (err, block) => {
        if (!err) {
          // we can't use the blockGasLimit cause the next blocks could have a lower limit : https://github.com/ethereum/remix/issues/506
          this.blockGasLimit = (block && block.gasLimit) ? Math.floor(block.gasLimit - (5 * block.gasLimit) / 1024) : this.blockGasLimitDefault
        } else {
          this.blockGasLimit = this.blockGasLimitDefault
        }
      })
    }
  }

  this.listenOnLastBlock = function () {
    this.listenOnLastBlockId = setInterval(() => {
      this._updateBlockGasLimit()
    }, 15000)
  }

  // TODO: not used here anymore and needs to be moved
  function setProviderFromEndpoint (endpoint, context, cb) {
    const handler = contextHandlers[context]
    if (!handler) return cb('no handler found for ' + context)

    var oldProvider = handler.obj.web3.currentProvider
    let web3 = handler.obj.web3

    if (endpoint === 'ipc') {
      web3.setProvider(new web3.providers.IpcProvider())
    } else {
      web3.setProvider(new web3.providers.HttpProvider(endpoint))
    }
    if (web3.isConnected()) {
      if (this.currentHandler.id === context) {
        self._updateBlockGasLimit()
        self.event.trigger('web3EndpointChanged')
      }
      cb()
    } else {
      web3.setProvider(oldProvider)
      var alertMsg = 'Not possible to connect to the Web3 provider. '
      alertMsg += 'Make sure the provider is running and a connection is open (via IPC or RPC).'
      cb(alertMsg)
    }
  }
  this.setProviderFromEndpoint = setProviderFromEndpoint

  this.txDetailsLink = function (network, hash) {
    if (transactionDetailsLinks[network]) {
      return transactionDetailsLinks[network] + hash
    }
  }
}

var transactionDetailsLinks = {
  'Main': 'https://www.etherscan.io/tx/',
  'Rinkeby': 'https://rinkeby.etherscan.io/tx/',
  'Ropsten': 'https://ropsten.etherscan.io/tx/',
  'Kovan': 'https://kovan.etherscan.io/tx/'
}

module.exports = new ExecutionContext()
