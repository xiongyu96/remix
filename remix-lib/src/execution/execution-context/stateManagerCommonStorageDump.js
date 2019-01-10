import StateManager from 'ethereumjs-vm/dist/stateManager'
import ethUtil from 'ethereumjs-util'
var rlp = ethUtil.rlp

/*
  extend vm state manager and instanciate VM
*/
export default class StateManagerCommonStorageDump extends StateManager {
  constructor (arg) {
    super(arg)
    this.keyHashes = {}
  }

  putContractStorage (address, key, value, cb) {
    this.keyHashes[ethUtil.sha3(key).toString('hex')] = ethUtil.bufferToHex(key)
    super.putContractStorage(address, key, value, cb)
  }

  dumpStorage (address, cb) {
    var self = this
    this._getStorageTrie(address, function (err, trie) {
      if (err) {
        return cb(err)
      }
      var storage = {}
      var stream = trie.createReadStream()
      stream.on('data', function (val) {
        var value = rlp.decode(val.value)
        storage['0x' + val.key.toString('hex')] = {
          key: self.keyHashes[val.key.toString('hex')],
          value: '0x' + value.toString('hex')
        }
      })
      stream.on('end', function () {
        cb(storage)
      })
    })
  }
}