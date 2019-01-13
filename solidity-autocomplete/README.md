## Solidity autocomplete

```javascript
const suggestions = AutoC(filename, sources).suggest(`//ast query`);
```

### ASTQ query examples

* search all nodes under root node for nodes with key `nodeType == 'ContractDefinition'`
```
/ * [ @nodeType == 'ContractDefinition' ]
```

### References
While there is not much I know about how to build an autocompleter bellow are my research & references

[What is the best autocomplete/suggest algorithm,datastructure [C++/C]](https://stackoverflow.com/questions/1783652/what-is-the-best-autocomplete-suggest-algorithm-datastructure-c-c?answertab=votes#tab-top)
This stackoverflow question has a brief introduction on what is a suggest algorithm.
https://github.com/rse/astq#by-grammar
* Understand how compilers work - [https://github.com/jamiebuilds/the-super-tiny-compiler/blob/master/the-super-tiny-compiler.js](https://github.com/jamiebuilds/the-super-tiny-compiler/blob/master/the-super-tiny-compiler.js)
* Example autocompleter [https://github.com/mdempsky/gocode](https://github.com/mdempsky/gocode)
* Analysis of syntax, AST [https://itnext.io/ast-for-javascript-developers-3e79aeb08343](https://itnext.io/ast-for-javascript-developers-3e79aeb08343)
* GraphQL AST example [https://www.contentful.com/blog/2018/07/04/graphql-abstract-syntax-tree-new-schema/](https://www.contentful.com/blog/2018/07/04/graphql-abstract-syntax-tree-new-schema/)
* Query configuration [https://github.com/rse/astq#query-language](https://github.com/rse/astq#query-language)
