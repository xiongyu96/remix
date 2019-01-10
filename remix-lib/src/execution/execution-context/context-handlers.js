import Web3 from 'web3'
import EthJSVM from 'ethereumjs-vm'
import Web3VMProvider from '../../web3Provider/web3VmProvider'
import StateManagerCommonStorageDump from './stateManagerCommonStorageDump.js'

var injectedProvider
if (typeof window !== 'undefined' && typeof window.web3 !== 'undefined') {
  injectedProvider = window.web3.currentProvider
}

function createVm (hardfork) {
  var stateManager = new StateManagerCommonStorageDump({})
  stateManager.checkpoint(() => {})
  var vm = new EthJSVM({
    activatePrecompiles: true,
    blockchain: stateManager.blockchain,
    stateManager: stateManager,
    hardfork: hardfork
  })
  var web3vm = new Web3VMProvider()
  web3vm.setVM(vm)
  return { vm, web3: web3vm, stateManager }
}

var vms = {
  byzantium: createVm('byzantium'),
  constantinople: createVm('constantinople')
}

let externalProvider = new Web3.providers.HttpProvider('http://localhost:8545')
let handlers = {
  'vm-constantinople': {
    name: 'vm (constantinople)',
    id: 'vm-constantinople',
    desc: 'Execution environment does not connect to any node, everything is local and in memory only. Emulate a constantinople fork',
    obj: vms.constantinople,
    handler: (infoCb, cb) => {
      vms.constantinople.stateManager.revert(function () {
        vms.constantinople.stateManager.checkpoint(() => {})
      })
      return cb(null, handlers['vm-constantinople'])
    }
  },
  'vm-byzantium': {
    name: 'vm (byzantium)',
    id: 'vm-byzantium',
    desc: 'Execution environment does not connect to any node, everything is local and in memory only. Emulate a byzantium fork',
    obj: vms.byzantium,
    handler: (infoCb, cb) => {
      vms.byzantium.stateManager.revert(function () {
        vms.byzantium.stateManager.checkpoint(() => {})
      })
      return cb(null, handlers['vm-byzantium'])
    }
  },
  'injected': {
    name: 'injected',
    id: 'injected',
    desc: 'Execution environment has been provided by Metamask or similar provider.',
    obj: { web3: new Web3(injectedProvider), provider: injectedProvider },
    handler: (infoCb, cb) => {
      if (injectedProvider === undefined) {
        var alertMsg = 'No injected Web3 provider found. '
        alertMsg += 'Make sure your provider (e.g. MetaMask) is active and running '
        alertMsg += '(when recently activated you may have to reload the page).'
        infoCb(alertMsg)
        return cb(alertMsg)
      } else {
        return cb(null, handlers['injected'])
      }
    }
  },
  'web3': {
    name: 'external node',
    id: 'web3',
    desc: `Execution environment connects to node at localhost (or via IPC if available), transactions will be sent to the network and can cause loss of money or worse!
    If this page is served via https and you access your node via http, it might not work. In this case, try cloning the repository and serving it via http.`,
    obj: { web3: new Web3(externalProvider), provider: externalProvider },
    handler: (infoCb, cb) => {
      cb(null, handlers['web3'])
    }
  }
}

export default handlers
