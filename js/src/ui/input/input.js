GSIBV.UI.Input = {};

GSIBV.UI.Input.Base = class extends MA.Class.Base {

  constructor(input, options) {
    super();
    this._input = input;
    if ( this._initializeInput ) this._initializeInput();
    this._hintBaseLine = "top";
    if (options)
      this._hintText = options.hintText;
    MA.DOM.on(this._input, "focus", MA.bind(this._onFocus, this));
    MA.DOM.on(this._input, "blur", MA.bind(this._onBlur, this));

  }
  get input() {
    return this._input;
  }
  get container() {
    return this._input;
  }

  destroy() {
    this._clearCheck();
  }

  set value(value) {
    this._input.value = ( value == undefined ? "" : value );
    this._check();
  }
  get value() {
    this._check();
    return this._value;
  }

  _clearCheck() {
    if (this._timerId) clearInterval(this._timerId);
  }
  _onFocus() {
    this._showHint();
    this._clearCheck();
    this._value = this._input.value;

    setTimeout(MA.bind(function () { this._input.select(); }, this), 0);

    this._timerId = setInterval(MA.bind(this._check, this), 1000);
  }


  _onBlur() {
    this._hideHint();
    this._clearCheck();
    var result = this._check();
    if (result != undefined) {
      this._input.value = result;
    } else {
      this._input.value = this._value;
    }
  }

  _showHint() {
    //this._hideHint();

    if (!this._hintText || this._hintText == "") return;

    if (GSIBV.UI.Input.Base._hintContainer)
      GSIBV.UI.Input.Base._hintContainer.style.display = 'none';
    if (!GSIBV.UI.Input.Base._hintContainer) {
      GSIBV.UI.Input.Base._hintContainer = MA.DOM.create("div");
      GSIBV.UI.Input.Base._hintContainer.style.position = "absolute";
      GSIBV.UI.Input.Base._hintContainer.style.zIndex = 999;
      MA.DOM.addClass(GSIBV.UI.Input.Base._hintContainer, "-gsibv-input-hint");
      document.body.appendChild(GSIBV.UI.Input.Base._hintContainer);
    }

    GSIBV.UI.Input.Base._hintContainer.innerHTML = this._hintText;
    var pos = MA.DOM.offset(this._input);
    var size = MA.DOM.size(this._input);

    GSIBV.UI.Input.Base._hintContainer.style.visibility = 'hidden';
    GSIBV.UI.Input.Base._hintContainer.style.display = '';
    var hintSize = MA.DOM.size(GSIBV.UI.Input.Base._hintContainer);
    GSIBV.UI.Input.Base._hintContainer.style.display = 'none';
    GSIBV.UI.Input.Base._hintContainer.style.visibility = 'visible';


    GSIBV.UI.Input.Base._hintContainer.style.left = (pos.left + size.width + 5) + "px";

    if (this._hintBaseLine == "bottom")
      GSIBV.UI.Input.Base._hintContainer.style.top = (pos.top+ size.height - hintSize.height) + "px";
    else
      GSIBV.UI.Input.Base._hintContainer.style.top = (pos.top) + "px";

    MA.DOM.fadeIn(GSIBV.UI.Input.Base._hintContainer, 2000);

  }

  _hideHint() {
    if (GSIBV.UI.Input.Base._hintContainer)
      MA.DOM.fadeOut(GSIBV.UI.Input.Base._hintContainer, 500);
    /*
    if ( this._hintContainer ) document.body.removeChild(this._hintContainer);
    delete this._hintContainer;
    this._hintContainer = undefined;
    */
  }
}





GSIBV.UI.Input.Number = class extends GSIBV.UI.Input.Base {

  constructor(input, options) {
    super(input, options);

    var parentNode = input.parentNode;
    parentNode.removeChild(input);
    this._container = MA.DOM.create("div");
    this._container.style.position = 'relative';
    this._container.style.display = 'inline-block';
    this._upButton = MA.DOM.create("span");
    MA.DOM.addClass( this._upButton, "-gsibv-input-number-upbutton" );
    this._downButton = MA.DOM.create("span");
    MA.DOM.addClass( this._downButton, "-gsibv-input-number-downbutton" );
    
    MA.DOM.on( this._upButton, "click", MA.bind(this._onUpButtonClick,this) );
    MA.DOM.on( this._downButton, "click", MA.bind(this._onDownButtonClick,this) );

    this._container .appendChild( input);
    this._container.appendChild(this._upButton );
    this._container.appendChild(this._downButton );
    parentNode.appendChild( this._container);


    this._value = "";
    this._type = "float";
    if (options) {
      if (options.type != undefined) this._type = options.type;
      this._max = options.max;
      this._min = options.min;
    }

    if (this._hintText == undefined || this._hintText == "") {
      this._hintText = "";
      
      if (this._min != undefined || this._max != undefined) {
        if (this._min != undefined) {
          if (this._min > 0 && this._min < 0.001) {
            this._hintText = "0より大き" +
              (this._max ? "く" + this._max + "以下の" : "い") + "数値";
          } else {
            this._hintText = this._min + "以上" +
              (this._max != undefined ? this._max + "以下" : "") + "の数値";
          }
        } else {
          this._hintText = this._max + "以下の数値";
        }
      }
      if (this._hintText == "")
        this._hintText = "数値"
      this._hintText += (this._type == "int" ? "(整数)" : "(小数可)");
    }
  }

  get value() {
    if ( this._value == undefined|| this._value == "" ) return undefined;
    return parseFloat( this._value );
  }

  set value(value) {
    this._input.value = ( value == undefined ? "" : value );
    this._check();
  }

  _onUpButtonClick() {
    
    var value = this.value;
    if ( value == undefined) value = 0;

    if ( this._type == "float") {
      if ( this._max != undefined && this._max <= 1 ) {
        value += 0.1;
        value = Math.round( value*100 ) / 100;
      } else {
        if ( value - Math.floor(value) >=0.5 ) value = Math.ceil( value );
        else value = Math.floor(value) + 0.5; 
      }
    } else {
      value++;
    }
    if ( this._max != undefined && this._max < value )
      value = this._max;

    this.value = value;
  }

  _onDownButtonClick() {
    var value = this.value;
    if ( value == undefined) value = 0;

    if ( this._type == "float") {
      if ( this._max != undefined && this._max <= 1 ) {
        value -= 0.1;
        value = Math.round( value*100 ) / 100;
      } else {
        if ( value - Math.floor(value) >=0.5 ) value = Math.floor( value );
        else value = Math.ceil(value) - 0.5; 
        value = Math.round( value*10 ) / 10;
      }
    } else {
      value--;
    }
    if ( this._max != undefined && this._max < value )
      value = this._max;

    this.value = value;
  }

  _check() {
    var value = this._input.value.trim();
    value = value.replace(/[．。、，]/g, ".");
    value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });

    if (value == "") {
      if (this._value != value) {
        this._value = value;
        this.fire("change");
      }
      return value;
    }
    if (this._type == "int") {
      if (!value.match(/^[+-]?[0-9]+$/)) {

        return null;
      }
    } else {

      if (!value.match(/^[-+]?[0-9]+(\.[0-9]+)?$/)) {
        return null;
      }
    }

    var num = parseFloat(value);
    if (isNaN(num)) {
      return null;
    }
    if (this._max != undefined) {

      if (num > this._max) {
        return null;
      }
    }
    if (this._min != undefined) {

      if (num < this._min) {
        return null;
      }
    }

    if (this._value != value) {
      this._value = value;
      this.fire("change");
    }

    return value;

  }

};










GSIBV.UI.Input.HexColor = class extends GSIBV.UI.Input.Base {

  constructor(input, options) {
    super(input, options);

    if (this._hintText == undefined || this._hintText == "") {
      this._hintText = "#fff or #ffffff ";
    }
  }

  _check() {
    var value = this._input.value.trim();
    value = value.replace(/[．。、，]/g, ".");
    value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
    if ( value == "") return null;
    var m = null;
    m = value.match(/^#([a-fA-F0-9]{6})$/);
    if (m) {
    } else {
      m = value.match(/^#([a-fA-F0-9]{3})$/);
      if (!m) {
        return null;
      }
    }

    if (this._value != value) {
      this._value = value;
      this.fire("change");
    }

    return value;

  }

};





GSIBV.UI.Input.Array = class extends GSIBV.UI.Input.Base {

  constructor(input, options) {
    super(input, options);
  }
  
  set value(value) {
    if  (value != undefined) {
      var val = '';
      for( var i=0; i<value.length; i++ ) {
        val += (val=='' ? '' : ',') + value[i];
      }
      this._input.value = val;
    } else {
      this._input.value = "";
    }
    var result= this._check();
    
    if ( result != undefined) this._input.value  = result;
  }

  
  _onFocus() {
    this._showHint();
    this._clearCheck();
    //this._value = this._input.value;
    setTimeout(MA.bind(function () { this._input.select(); }, this), 0);
    this._timerId = setInterval(MA.bind(this._check, this), 1000);
  }
  
  get value() {
    return this._value;
  }

  _check() {
    var value = this._input.value;
    value = value.replace(/[．]/g, ".");
    value = value.replace(/[、，]/g, ",");
    value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
    if (value == "") {
      if (JSON.stringify(this._value) != value) {
        this._value = undefined;
        this.fire("change");
      }
      return value;
    }

    var parts = value.split(',');
    var array = []
    for (var i = 0; i < parts.length; i++) {
      var val = parts[i].replace(/[\s\　]/g, '');
      if (!val.match(/^[-+]?[0-9]+(\.[0-9]+)?$/)) {
        return null;
      } else if (parseFloat(val) < 0) {
        return null;
      } else {
        array.push( parseFloat(val));
      }
    }

    if (JSON.stringify(this._value) != JSON.stringify(array)) {
      this._value = array;
      this.fire("change");
    }

    return value;

  }

};