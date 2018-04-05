# Barcode Scanner

![Version 0.1.0](https://img.shields.io/badge/Version-0.1.0-blue.svg)

> Detect data scanned by barcode readers

## Example

```
let Scanner = require('barcode-scanner')
let scanner = new Scanner()

scanner.on('scanned', (str, type)=>{
  console.log(`Scanned ${type}: ${str}`)
})
```

## Methods

### `.startListening()`

Begins and continues listening for scans. This is activated upon initialization

### `.stopListening()`

Stops listening for scans.
