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

## Supported Devices

Tested on the following

- Chrome Desktop (other modern browsers should work)
- [Archer@ Enterprise Handheld Mobile Terminal](https://www.amazon.com/dp/B078NRJGNW)
- [IOT Handheld Terminal](https://www.amazon.com/dp/B0774XWRGV)
- Android Devices with Bluetooth Scanner (keyboard wedge entry)

## License

MIT © [Kevin Jantzer](https://twitter.com/kjantzer) – Blackstone Publishing
