GSIBV.UI.Input.Color = class extends GSIBV.UI.Input.Base {

  constructor(input, options) {
    super(input, options);
    this._mode= "";
    this._input.style.paddingLeft = "20px";
    this._hintText = "<div>rgba(0-255,0-255,0-255,0-1)<br>rgb(0-255,0-255,0-255)<br>#fff<br>#ffffff</div>";
    
    if ( options && options.type) {
      this._mode = options.type;
    }
    
    this._createColorView();
  }
  _initializeInput() {
    var parentNode = this._input.parentNode
    parentNode.removeChild( this._input );

    this._container = MA.DOM.create("div");
    MA.DOM.addClass(this._container, "-gsibv-ui-colorinput");
    this._container.style.position = 'relative';

    this._clearButton = MA.DOM.create("a");
    MA.DOM.addClass( this._clearButton, "button" );
    MA.DOM.addClass(this._clearButton, "clear-button");
    
    MA.DOM.on( this._clearButton, "click", MA.bind( this._onClearButtonClick,this));


    this._container.appendChild( this._input );
    this._container.appendChild( this._clearButton );
    parentNode.appendChild( this._container );
  }

  _onClearButtonClick(e) {
    e.preventDefault();
    this._input.value="";
    this._value = "";
    this._rgbValue = undefined;

    this._updateSample();
    this.fire("change");
  }

  destroy() {
    super.destroy();
    if( this._colorPicker ) this._colorPicker.destroy();
  }
  
  _fireChange() {
    this.fire("change");
    
    if ( this._colorPicker ) {
      var value = this._rgbValue;
      var color = undefined;
      if ( value == undefined  ) {
        color = undefined;
      } else {
        color = MA.Color.rgb2hsv( value );
        color = new MA.Color( color );
      }
      this._colorPicker.color =  color ;
    }
  }
  _onColorPickerChange(e) {
    var color = e.params.color;
    if ( color == undefined ) {
      this._rgbValue = undefined;
      this._value = "";
      this._input.value = "";
    } else {
      var rgb = MA.Color.fix( color.getRGB() );

      this._rgbValue = rgb;
      this._value = "rgba(" + rgb.r + "," + rgb.g + "," + rgb.b + "," + rgb.a +")"; 
      this._input.value = this._value ;

    }
    this._colorViewElement.style.backgroundColor = this._value;
  }
  _onFocus() {
    if ( ! this._colorPicker ) {
      this._colorPicker = new GSIBV.UI.ColorPicker ();
      this._colorPicker .on("change", MA.bind( this._onColorPickerChange,this));
    }

    var value = this._rgbValue;
    var color = undefined;
    if ( value == undefined  ) {
      color = undefined;
    } else {
      color = MA.Color.rgb2hsv( value );
      color = new MA.Color( color );
    }
    var baseLine = this._colorPicker.show(this.input, color );
    this._hintBaseLine = baseLine;
    super._onFocus();
  }

  _onBlur() {
    super._onBlur();
  }

  _createColorView() {
    var parentNode = this._input.parentNode;
    parentNode.removeChild(this._input);

    this._frame = MA.DOM.create('div');
    this._frame.style.position = 'relative';
    this._colorViewBgElement = MA.DOM.create('div');
    this._colorViewBgElement.style.position = 'absolute';
    this._colorViewBgElement.style.width = '12px';
    this._colorViewBgElement.style.height = '12px';
    this._colorViewBgElement.style.top = '50%';
    this._colorViewBgElement.style.left = '3px';
    this._colorViewBgElement.style.marginTop = '-6px';
    this._colorViewBgElement.style.borderRadius = '3px';
    this._colorViewBgElement.style.backgroundColor = "rgba(0,0,0,0.5)";
    this._colorViewBgElement.style.backgroundImage = 'url(\'data:image/svg+xml,<svg height="4" fill="rgba(255,255,255,0.5)" viewBox="0 0 4 4" width="4" xmlns="http://www.w3.org/2000/svg"><rect x="0" y="0" width="2" height="2" /><rect x="2" y="2" width="2" height="2" /></svg>\')';
    this._colorViewBgElement.style.zIndex = 0;

    this._colorViewElement = MA.DOM.create('div');
    this._colorViewElement.style.position = 'absolute';
    this._colorViewElement.style.width = '12px';
    this._colorViewElement.style.height = '12px';
    this._colorViewElement.style.top = '50%';
    this._colorViewElement.style.left = '3px';
    this._colorViewElement.style.marginTop = '-6px';
    this._colorViewElement.style.borderRadius = '3px';
    this._colorViewElement.style.boxShadow = "0 0 1px 1px rgba(0,0,0,0.2)";

    this._colorViewElement.style.backgroundColor = "rgba(0,0,0,0.5)";
    this._colorViewElement.style.zIndex = 1;
    this._frame.appendChild(this._input);
    this._frame.appendChild(this._colorViewBgElement);
    this._frame.appendChild(this._colorViewElement);
    parentNode.appendChild(this._frame);
  }

  _updateSample() {
    var color = this._value;
    if ( color == undefined || color == "") color = "transparent";
    this._colorViewElement.style.backgroundColor  = color;
  }

  _check() {
    var value = this._input.value.trim();
    value = value.replace(/[．。、，]/g, ".");
    value = value.replace(/[Ａ-Ｚａ-ｚ０-９]/g, function (s) {
      return String.fromCharCode(s.charCodeAt(0) - 65248);
    });
    value = value.toLowerCase();
    var m = null;
    var result = null;

    m = value.match(/^rgba\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d+(\.\d+)?)\)/i);
    if (m) {
      result = {
        r: parseInt(m[1]),
        g: parseInt(m[2]),
        b: parseInt(m[3]),
        a: (m[5] == undefined ? 1 : parseFloat(m[5]))
      };

      if (result.a < 0) result.a = 0;
      if (result.a > 1) result.a = 1;
    } else {

      m = value.match(/^rgb\s*\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)/i);
      if (m) {
        result = {
          r: parseInt(m[1]),
          g: parseInt(m[2]),
          b: parseInt(m[3]),
          a: 1
        };
      }
      m = value.match(/^#([a-fA-F0-9]{6})$/);
      if (m) {
        result = {
          r: parseInt(m[1].substring(0, 2), 16),
          g: parseInt(m[1].substring(2, 4), 16),
          b: parseInt(m[1].substring(4, 6), 16),
          a: 1
        };
      } else {
        m = value.match(/^#([a-fA-F0-9]{3})$/);
        if (m) {
          result = {
            r: parseInt(m[1].substring(0, 1) + m[1].substring(0, 1), 16),
            g: parseInt(m[1].substring(1, 2) + m[1].substring(1, 2), 16),
            b: parseInt(m[1].substring(2, 3) + m[1].substring(2, 3), 16),
            a: 1
          };
        }
      }
    }

    if (result) {
      if (result.r >= 0 && result.r <= 255 &&
        result.g >= 0 && result.g <= 255 &&
        result.b >= 0 && result.b <= 255 &&
        result.a >= 0 && result.a <= 1) {
        this._rgbValue = result;
        //this._value = value;
      } else {
        this._rgbValue = undefined;
        this._updateSample();
        return null;
      }
    } else {
      if ( value == "" ) {
        this._value = "";
      }
      this._rgbValue = undefined;
      this._updateSample();
      return null;
    }


    if (this._value != value) {
      this._rgbValue = result;
      this._value = value;
      this._fireChange();
    }

    this._updateSample();
    /*
    this._input.style.backgroundColor = this._getForeColor(result);
    this._input.style.color = this._value;
    */
    return value;

  }
  _getForeColor(bgRGB) {
    var getBrightness = function (rgb) {
      return ((rgb.r * 299) + (rgb.g * 587) + (rgb.b * 114)) / 1000;
    };
    if (GSIBV.UI.ColorInput._LIGHTCOLOR_BRIGHTNESS == undefined)
      GSIBV.UI.ColorInput._LIGHTCOLOR_BRIGHTNESS = getBrightness({ r: 255, g: 255, b: 255 });
    if (GSIBV.UI.ColorInput._DARKCOLOR_BRIGHTNESS == undefined)
      GSIBV.UI.ColorInput._DARKCOLOR_BRIGHTNESS = getBrightness({ r: 0, g: 0, b: 0 });

    var b = getBrightness(bgRGB);
    var deltaL = Math.abs(b - GSIBV.UI.ColorInput._LIGHTCOLOR_BRIGHTNESS);
    var deltaD = Math.abs(b - GSIBV.UI.ColorInput._DARKCOLOR_BRIGHTNESS);
    return (deltaL > deltaD) ? '#fff' : '#5a5a5a';
  }


};



