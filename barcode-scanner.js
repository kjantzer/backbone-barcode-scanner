 /*
    Barcode Scanner

    The Wasp 3900 barcode scanner (an many others) enters barcode values like a person would while typing on a keyboard.
    The script listens for a set of characters to be entered very quickly. It is assumed
    that a human cannot enter the characters this fast and thus must be a barcode scanner.
    
    `textInput` events are also supported but require a barcode button key to be set in: `textInputKeys`

    @author Kevin Jantzer, Blackstone Publishing
    @since 2017-01-30
*/
module.exports = Backbone.View.extend({

    textInputKeys: ['F9'], // they keycodes that should trigger listening for a textInput event
	scanCharSpeed: 50, // how fast must characters be entered to be "saved"
	scanCharMin: 5, // how many saved characters needed to = scanned barcode
	scanFinishedDelay: 100, // how long to wait for another charcter to be entered before testing for scan

    initialize: function(opts){
        _.bindAll(this)
        
        if( this.textInputKeys ){
            // Some scanners trigger an F9 key followed by a textInput event. However, textInput events
            // only happen on on editable elements (https://developer.mozilla.org/en-US/docs/Web/Events/input)
            // this element will be selected (makes it active and in focus) when the F9 key is hit,
            // thus accepting the textInput/input events
            this.$textInputEl = $('<div contenteditable></div>').appendTo(document.body)
        }
        
        this.startListening();
    },
    
    onBarcodeScanned: function(str, type){
        this.trigger('scanned', str, type)
    },

    startListening: function(){
        if( this.textInputKeys ){
            // document.addEventListener('input', this.onInput)
            document.addEventListener('textInput', this.onTextInput)
        }
        document.addEventListener('keydown', this.onKeyDown)
        document.addEventListener('keypress', this.onKeyPress)
        document.addEventListener('keyup', this.onKeyUp)
        this.trigger('listening', true);
    },

    stopListening: function(){
        if( this.textInputKeys ){
            // document.removeEventListener('input', this.onInput)
            document.removeEventListener('textInput', this.onTextInput)
        }
        document.removeEventListener('keydown', this.onKeyDown)
        document.removeEventListener('keypress', this.onKeyPress)
        document.removeEventListener('keyup', this.onKeyOp)
        this.trigger('listening', false);
    },

    barcodeScanned: function(){

		if( this._chars.length >= this.scanCharMin ){

            var str = this._chars.join(''), type;
            
            [str, type] = this.parseCode(str, type);

            this.onBarcodeScanned(str, type)
		}

        this._lastTimeScanned = (new Date()).getTime()
		this._lastTime = null;
		this._chars = [];
    },
    
    parseCode: function(str, type="unknown"){
        
        var trackingNum = null
        var match;
        
        str = str.replace(/[\n\r]/g, '');

        if( str.match(/^978[\d]{10}$/) ) type = 'isbn'
        else if( match = str.match(/^BX(\d{9})/) ){
            type = 'box_id'
            str = parseInt(match[1])
        }
        else if( str.match(/^\d{2}-[a-iA-I]([\d][a-iA-I]?)?$/)) type = 'shelf_location'
        else if( match = str.match(/^rma-item-([0-9]+)/) ){
            type = 'rma_item'
            str = match[1]
        }
        else if( match = str.match(/^pick:(.+)/) ){
            type = 'pick_list'
            str = match[1].split(',')
        }
        else if( match = str.match(/^reshelf:(.+)/) ){
            type = 'reshelf_list'
            str = match[1].split(',')
        }
        else if( str.length == 6 && str.match(/^[1-6][0-2]|^[zphb][a-z]/i) ) type = 'product_id'
        else if( str.match(/^[\d]{6,9}$|^ae\d+|^C[\d]{8}/) ) type = 'order_id'
        else if( match = str.match(/^RPLC([0-9]+)/) ){
            type = 'replacement'
            str = match[1]
        }
        else if( trackingNum = this.parseTrackingNum(str) ){
            str = trackingNum
            type = 'tracking_num'
        }
        else if( str.length < 20 ) type = 'invoice_id'
        
        return [str, type]
    },
    
    timeSinceScan: function(){
        return this._lastTimeScanned ? ((new Date()).getTime() - this._lastTimeScanned) / 1000 : false
    },
    
    // Yeah, I know, its duplicate code
    getType: function(str){
        return this.parseCode(str)[1]
    },

    parseTrackingNum: function(str){

        // USPS
        if( str.length == 30 ) return str.substr(-22)
        // FedEx
        if( str.length == 34 ) return str.substr(-12)

        // USPS to Canada
        if( str.match(/^[A-Z]{2}\d+US$/) ) return str

        // attempt to ignore other barcodes containing non-tracking numbers
        if( str.length > 15 && str.length < 34 ) return str;

        return null;
    },

	_scanFinished: function(){
		clearTimeout(this._scanFinishedTimeout);
		this._scanFinishedTimeout = setTimeout(this.barcodeScanned.bind(this), this.scanFinishedDelay);
	},

    /*
        Had to add this logic to keep invisible special characters from stopping
        the scan from fully capturing. Noticed on an label printed by stamps.com for AE
    */
    onKeyDown: function(e){
        
        if( this.textInputKeys && (this.textInputKeys == e.key || this.textInputKeys.includes(e.key)) ){
            this.waitingForTextInput = true
            // we put the cursor (window.selection) in the editable div instead of calling `.focus` so that mobile keyboards do not open
			_.selectText(this.$textInputEl[0])
            e.preventDefault();
            return;
	    }
        
        var now = (new Date()).getTime();
        if( now - this._lastTime < this.scanCharSpeed ){
            
            var keycode = e.keyCode;

            // https://stackoverflow.com/a/12467610/484780
            var valid = 
                (keycode > 47 && keycode < 58)   || // number keys
                keycode == 32 /*|| keycode == 13*/   || // spacebar & return key(s) (if you want to allow carriage returns)
                (keycode > 64 && keycode < 91)   || // letter keys
                (keycode > 95 && keycode < 112)  || // numpad keys
                (keycode > 185 && keycode < 193) || // ;=,-./` (in order)
                (keycode > 218 && keycode < 223);   // [\]' (in order)

            
            // ignore keystroke for invalid characters
            if( !valid ){
                e.preventDefault();
            }
		}
    },

    onKeyPress: function(e){

		var now = (new Date()).getTime();

		// dont track keypress when using an input/textarea
		if( document.activeElement.tagName == 'INPUT' || document.activeElement.tagName == 'TEXTAREA' )
			return;

		if( !this._lastTime ){
			this._lastTime = now;
			this._chars = [];
		}

        var charStr = String.fromCharCode(e.which);

		if( now - this._lastTime < this.scanCharSpeed ){

			this._chars.push(charStr);

			this._scanFinished();
		}

		this._lastTime = now;
    },
    
    stopWaitingForTextInput: function(){
        if( this.waitingForTextInput ){
            this.waitingForTextInput = false
            window.getSelection().empty()
        }    
    },
    
    onKeyUp: function(){
        this.stopWaitingForTextInput()
    },
    
    onInput: function(e){
        e.preventDefault()
        e.stopPropagation()    
    },
    
    onTextInput: function(e){
        
        if( !this.waitingForTextInput ) return;
        
        e.preventDefault()
        e.stopPropagation()
        
        var str, type
        [str, type] = this.parseCode(e.data);
        
        this.stopWaitingForTextInput()
        this.onBarcodeScanned(str, type)
        return false;
    }

})
