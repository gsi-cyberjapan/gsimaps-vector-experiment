GSIBV.UI.ColorPicker = class extends MA.Class.Base {
  constructor() {
    super();
    this._color = undefined;//new MA.Color({r:0,g:0,b:0,a:1});
    this._size = {
      width:300,
      height:200
    };
  }

  set zIndex(zIndex) {
    this._zIndex = zIndex;
  }

  set noAlpha(noAlpha) {
    this._noAlpha = noAlpha;
    this._size.height = 185;
  }

  set useClearButton( useClearButton) {
    this._useClearButton = useClearButton;
  }

  destroy() {

    if ( this._bodyMouseDownHandler ) {
      MA.DOM.off( document.body, "mousedown", this._bodyMouseDownHandler );
      this._bodyMouseDownHandler = null;
    }


    if ( this._container) {
      this._container.parentNode.removeChild( this._container );
      this._container = null;
    }


  }

  get color() {
    return this._color;
  }
  setColor(color) {
    var hsv = {h:0,s:0,v:0,a:1};
    if ( color ) {
      this._color = new MA.Color(color);
      hsv = this._color.getHSV();
    } else
      this._color = undefined;

    this._svSelector.h = hsv.h;
    this._svSelector.setSV(hsv.s, hsv.v, true);
    this._hSelector.setHue( hsv.h, true );
    if ( this._opacitySelector )this._opacitySelector.setOpacity( hsv.a, true );
    this._updateSample();

  }
  set color(color) {
    this.setColor(color);
    this._updateInput();
  }
  show(target, color) {
    this._target = target;
    this._create();


    this._container.style.display = '';
    this._container.style.visibility = 'hidden';

    this.color = color;
    var pos = MA.DOM.offset( this._target );
    var size = MA.DOM.size( this._target );
    var windowSize = MA.DOM.size( MA.DOM.select("#main")[0] );
    
    this._container.style.display = 'none';
    this._container.style.visibility = 'visible';


    var left = undefined;
    var top = undefined;
    var right = undefined;
    var bottom = undefined;
    var baseLine = "top";
    if ( pos.top > 200 ) {
      baseLine = "top";
      bottom = windowSize.height - pos.top+3;
    } else {
      baseLine = "bottom";
      top = pos.top + size.height + 3;
    }
    
    left = pos.left;
    if ( left + this._size.width > windowSize.width - 4) {
      left = windowSize.width - this._size.width - 4;
    }
    
    if ( top != undefined ) {
      this._container .style.bottom = "auto";
      this._container .style.top = top + "px";
    } else {
      this._container .style.top = "auto";
      this._container .style.bottom = bottom + "px";
    }


    if ( left != undefined ) {
      this._container .style.right = "auto";
      this._container .style.left = left + "px";
    } else {
      this._container .style.left = "auto";
      this._container .style.right = right + "px";
    }


    this._container .style.width = this._size.width + "px";
    this._container .style.height = this._size.height + "px";

    if ( !this._bodyMouseDownHandler ) {
      this._bodyMouseDownHandler = MA.bind( this._onBodyMouseDown, this );
      MA.DOM.on( document.body, "mousedown", this._bodyMouseDownHandler );
    }

    MA.DOM.fadeIn( this._container, 300);
    return baseLine;
  }

  _onBodyMouseDown(e) {
    var target = e.target;

    while( target) {
      if ( target == this._container || target == this._target) return;
      target = target.parentNode;
    }
    this.hide();
  }

  hide() {

    if ( this._bodyMouseDownHandler ) {
      MA.DOM.off( document.body, "mousedown", this._bodyMouseDownHandler );
      this._bodyMouseDownHandler = null;
    }

    if ( this._container)
      MA.DOM.fadeOut( this._container, 300);
  }

  _create() {
    if ( this._container ) return;

    this._container = MA.DOM.create("div");
    this._container.style.display = 'none';
    MA.DOM.addClass( this._container, "-gsibv-colorpicker" );
    if ( this._zIndex  ) {
      this._container.style.zIndex = this._zIndex;
    }

    var hsv = {h:0,s:0,v:0,a:1};
    if ( this._color ) {
      this._color = new MA.Color(this._color);
      hsv = this._color.getHSV();
    } else
      this._color = undefined;
      
    this._createColorSVSelect(hsv);
    this._createColorHSelect(hsv);
    if ( !this._noAlpha )
      this._createOpacitySelect(hsv);
    this._createSample();
    this._createInput();

    this._closeButton = MA.DOM.create("a");
    MA.DOM.addClass(this._closeButton,"button");
    MA.DOM.addClass(this._closeButton,"close-button");
    this._closeButton.setAttribute("href","javascript:void(0);");
    this._container .appendChild( this._closeButton);

    MA.DOM.select("#main")[0].appendChild( this._container);

    MA.DOM.on( this._closeButton, "click", MA.bind( this.hide, this ) );

    if ( this._useClearButton ) {
      this._clearButton = MA.DOM.create("a");
      this._clearButton.innerHTML = "透明";
      this._clearButton.setAttribute("href","javascript:void(0);");

      MA.DOM.on( this._clearButton, "click", MA.bind( this._onClearClick, this ) );
      MA.DOM.addClass(this._clearButton,"button");
      MA.DOM.addClass(this._clearButton,"clear-button");
      this._container .appendChild( this._clearButton);
    }

  }

  _createColorSVSelect(hsv) {
    if (this._svContainer) return;

    this._svContainer = MA.DOM.create("div");
    MA.DOM.addClass( this._svContainer, "sv-container" );
    this._svContainer.style.position = "absolute";
    this._svContainer.style.width = 220 + "px";
    this._svContainer.style.height = 160 + "px";
    this._svContainer.style.left = 5 + "px";
    this._svContainer.style.top = 5 + "px";
    this._svContainer.style.border = "1px solid rgba(0,0,0,0.1)";
    this._container.appendChild(this._svContainer);

    this._svSelector = new GSIBV.UI.ColorPicker.SVSelector( this._svContainer,hsv.h,hsv.s,hsv.v  );

    this._svSelector.on("change", MA.bind(this._onSVChange, this));
  }


  _createColorHSelect(hsv) {
    
    this._hContainer = MA.DOM.create("div");
    MA.DOM.addClass( this._hContainer, "sv-container" );
    this._hContainer.style.position = "absolute";
    this._hContainer.style.width = 220 + "px";
    this._hContainer.style.height = 12 + "px";
    this._hContainer.style.left = 5 + "px";
    this._hContainer.style.top = 167 + "px";
    this._container.appendChild(this._hContainer);

    this._hSelector = new GSIBV.UI.ColorPicker.HueSelector( this._hContainer,12,hsv.h );
    this._hSelector.on("change", MA.bind(this._onHueChange, this));
  }

  _createOpacitySelect(hsv) {
    
    this._opacityContainer = MA.DOM.create("div");
    MA.DOM.addClass( this._opacityContainer, "sv-container" );
    this._opacityContainer.style.position = "absolute";
    this._opacityContainer.style.width = 220 + "px";
    this._opacityContainer.style.height = 12 + "px";
    this._opacityContainer.style.left = 5 + "px";
    this._opacityContainer.style.top = 182 + "px";
    this._container.appendChild(this._opacityContainer);

    this._opacitySelector = new GSIBV.UI.ColorPicker.OpacitySelector( this._opacityContainer,12,hsv.a );
    this._opacitySelector.on("change", MA.bind(this._onOpacityChange, this));
  }

  _createSample() {
    this._sampleContainer = MA.DOM.create("div");
    MA.DOM.addClass(this._sampleContainer, "sample" );
    this._sampleContainer.style.left = '232px';
    this._sampleContainer.style.right = '6px';
    this._sampleContainer.style.top = '6px';
    this._sampleContainer.style.height = '28px';

    this._sampleElement = MA.DOM.create("div");
    this._sampleElement.style.position = 'absolute';
    this._sampleElement.style.left = '0px';
    this._sampleElement.style.right = '0px';
    this._sampleElement.style.top = '0px';
    this._sampleElement.style.bottom = '0px';

    this._sampleContainer.appendChild(this._sampleElement);

    this._container.appendChild(this._sampleContainer);

  }

  _createInput() {
    var frame = MA.DOM.create("div");
    
    MA.DOM.addClass( frame, "input-frame" );
    var table = MA.DOM.create("table");

    function createRow(table,title,numberType,min,max) {
      var tr = MA.DOM.create("tr");
      var th = MA.DOM.create("th");
      var td = MA.DOM.create("td");
      var input = MA.DOM.create("input");
      input.setAttribute("type","text")
      th.innerHTML = title;
      td.appendChild( input );
      tr.appendChild( th );
      tr.appendChild( td );

      table.appendChild( tr);



      return new GSIBV.UI.Input.Number( input,{"type":numberType,"min":min,"max":max} );
    }

    frame.style.position = 'absolute';
    frame.style.left = '230px';
    frame.style.right = '6px';
    frame.style.top = '40px';
    this._rInput = createRow( table, "r:","int",0,255);
    this._gInput = createRow( table, "g:","int",0,255);
    this._bInput = createRow( table, "b:","int",0,255);
    
    if ( !this._noAlpha )
      this._aInput = createRow( table, "a:","float",0,1);

    var tr=MA.DOM.create("tr");
    var td=MA.DOM.create("td");
    td.setAttribute("colspan",2);
    td.style.paddingTop = '3px';
    var input = MA.DOM.create("input");
    input.setAttribute("type","text");

    this._rgbChangeHandler = MA.bind(this._onRGBInputChange,this);
    this._rInput.on("change", this._rgbChangeHandler );
    this._gInput.on("change", this._rgbChangeHandler );
    this._bInput.on("change", this._rgbChangeHandler );
    if ( this._aInput ) this._aInput.on("change", this._rgbChangeHandler );

    this._hexChangeHandler = MA.bind(this._onHexInputChange,this);
    this._hexInput = new GSIBV.UI.Input.HexColor( input);
    this._hexInput.on("change", this._hexChangeHandler);
    td.appendChild(input);

    tr.appendChild(td);
    table.appendChild(tr);

    frame.appendChild(table);
    this._container.appendChild(frame);
  }

  _onClearClick() {
    this.setColor(undefined);
    this._updateInput();
    //this._refreshRGBInputValue();
    //this._refreshSample();
    this._updateSample();
    this.fire("change", { color: this._color ? this._color.clone(): undefined });

  }

  _onSVChange(e) {
    this._fireChange();

  }

  _onHueChange(e) {
    this._svSelector.h = e.params.h;
    this._fireChange();
  }

  _onOpacityChange(e) {
    this._fireChange();
  }

  _onRGBInputChange(e) {

    this._hexInput.off("change", this._hexChangeHandler);
    var r = this._rInput.value;
    var g = this._gInput.value;
    var b = this._bInput.value;
    var a = ( this._aInput ? this._aInput.value : 1 );
    if ( a == undefined) {
      a = 1;
    }
    if ( r == undefined || g == undefined || b == undefined || a == undefined ){
      this.setColor(undefined);
    } else {
      this.setColor(new MA.Color(MA.Color.rgb2hsv({r:r,g:g,b:b,a:a})) );
    }
    if ( this._color == undefined) {
      this._hexInput.value = "";
    } else {
      var rgb  = MA.Color.fix( this._color.getRGB() );
      this._hexInput.value = MA.Color.toHTMLHex(rgb);
    }
    this._fireChange(true);
    this._hexInput.on("change", this._hexChangeHandler);

  }
  _onHexInputChange(e) {
    this._rInput.off("change", this._rgbChangeHandler);
    this._gInput.off("change", this._rgbChangeHandler);
    this._bInput.off("change", this._rgbChangeHandler);
    if ( this._aInput ) this._aInput.off("change", this._rgbChangeHandler);
    var hex = this._hexInput.value;
    if ( hex == undefined || hex == "" ){
      this.setColor(undefined);
    } else {
      var rgb = {};
      var m = hex.match(/^#([a-fA-F0-9]{6})$/);
      if (m) {
        rgb = {
          r: parseInt(m[1].substring(0, 2), 16),
          g: parseInt(m[1].substring(2, 4), 16),
          b: parseInt(m[1].substring(4, 6), 16),
          a: 1
        };
      } else {
        m = hex.match(/^#([a-fA-F0-9]{3})$/);
        if (m) {
          rgb = {
            r: parseInt(m[1].substring(0, 1) + m[1].substring(0, 1), 16),
            g: parseInt(m[1].substring(1, 2) + m[1].substring(1, 2), 16),
            b: parseInt(m[1].substring(2, 3) + m[1].substring(2, 3), 16),
            a: 1
          };
        }
      }
      this.setColor(new MA.Color(MA.Color.rgb2hsv(rgb)) );
    }
    if ( this._color == undefined) {
      this._rInput.value = "";
      this._gInput.value = "";
      this._bInput.value = "";
      if ( this._aInput) this._aInput.value = "";
    } else {
      var rgb  = MA.Color.fix( this._color.getRGB() );
      this._rInput.value = rgb.r;
      this._gInput.value = rgb.g;
      this._bInput.value = rgb.b;
      if ( this._aInput) this._aInput.value = rgb.a;
    }
    this._fireChange(true);
    
    this._rInput.on("change", this._rgbChangeHandler);
    this._gInput.on("change", this._rgbChangeHandler);
    this._bInput.on("change", this._rgbChangeHandler);
    if ( this._aInput) this._aInput.on("change", this._rgbChangeHandler);
  }
  _fireChange (withoutUpdateInput) {
    if ( this._color == undefined ) this._color = new MA.Color();
    this._color.copyFrom({
      h: this._hSelector.h,
      s: this._svSelector.s,
      v: this._svSelector.v,
      a: ( this._opacitySelector ? this._opacitySelector.opacity : 1 )
    });
    if (!withoutUpdateInput )this._updateInput();
    //this._refreshRGBInputValue();
    //this._refreshSample();
    this._updateSample();
    this.fire("change", { color: this._color ? this._color.clone(): undefined });
  }

  _updateSample() {
    if ( this._color == undefined) {
      this._sampleElement.style.backgroundColor = 'transparent';
    }else {
      var rgb  = MA.Color.fix( this._color.getRGB() );
      this._sampleElement.style.backgroundColor = 'rgba(' + rgb.r + "," + rgb.g + "," + rgb.b + "," + rgb.a + ")" ;
    }
  }
  _updateInput() {

    this._rInput.off("change", this._rgbChangeHandler);
    this._gInput.off("change", this._rgbChangeHandler);
    this._bInput.off("change", this._rgbChangeHandler);
    if ( this._aInput) this._aInput.off("change", this._rgbChangeHandler);
    this._hexInput.off("change", this._hexChangeHandler);

    if ( this._color == undefined) {
      this._rInput.value = '';
      this._gInput.value = '';
      this._bInput.value = '';
      if ( this._aInput) this._aInput.value = '';
      this._hexInput.value = '';
      return;
    }

    var rgb  = MA.Color.fix( this._color.getRGB() );
    this._rInput.value = rgb.r;
    this._gInput.value = rgb.g;
    this._bInput.value = rgb.b;
    if ( this._aInput) this._aInput.value = rgb.a;
    this._hexInput.value = MA.Color.toHTMLHex(rgb);

    this._rInput.on("change", this._rgbChangeHandler);
    this._gInput.on("change", this._rgbChangeHandler);
    this._bInput.on("change", this._rgbChangeHandler);
    if ( this._aInput) this._aInput.on("change", this._rgbChangeHandler);
    this._hexInput.on("change", this._hexChangeHandler);
  }
};




/***************************************
    GSIBV.UI.ColorPicker.SVSelector
    彩度明度選択  
***************************************/
GSIBV.UI.ColorPicker.SVSelector = class extends MA.Class.Base {

  constructor(elem,h,s,v) {
    super();
    this._handleSize = 24;
    this._handleHalfSize = 12;
    
    if (typeof elem == 'string') {
      this._element = MA.DOM.select(elem)[0];
    } else {
      this._element = elem;
    }
    this._h = (h ? h : 0);
    this._s = (s ? s : 0);
    this._v = (v ? v : 0);

    this._create();
  }

  _create() {
    this._element.style.overflow = 'hidden';
    this._canvas = MA.DOM.create("canvas");
    this._canvas.style.position = 'absolute';
    this._canvas.style.left = '0px';
    this._canvas.style.top = '0px';
    this._canvas.style.width = '100%';
    this._canvas.style.height = '100%';
    this._canvas.style.background = '#ff0000';
    this._canvas.style.cursor = 'pointer';
    this._canvas.style.borderRadius = '2px';
    this._element.style.borderRadius = '2px';

    this._element.appendChild(this._canvas);

    // ハンドル
    this._handle = MA.DOM.create("div");
    this._handle.style.position = 'absolute';
    this._handle.style.borderRadius = '50%';
    this._handle.style.width = this._handleSize + 'px';
    this._handle.style.height = this._handleSize + 'px';
    this._handle.style.left = '0px';
    this._handle.style.top = '100%';
    this._handle.style.marginTop = '-' + this._handleHalfSize + 'px';
    this._handle.style.marginLeft = '-' + this._handleHalfSize + 'px';
    this._handle.style.opacity = 1;
    this._handle.style.outline = 0;
    this._handle.style.cursor = 'pointer';

    this._handle.style.zIndex = 10;
    this._handle.style.boxShadow = "0px 0px 2px 2px rgba(255, 255, 255, 1)";


    this._element.appendChild(this._handle);

    this._refreshCanvas();
    this.setSV(this._s, this._v, true);

    MA.DOM.on(this._canvas, "mousedown", MA.bind(this._onCanvasMouseDown, this));
    MA.DOM.on(this._handle, "mousedown", MA.bind(this._onHandleMouseDown, this));
    MA.DOM.on(this._handle, "touchstart", MA.bind(this._onHandleMouseDown, this));


  }

  set h(h) {
    this._h = h;
    this._refreshCanvas();
    this._refreshHandleColor();
  }

  setSV(s,v, withoutNotify) {
    var size = MA.DOM.size(this._canvas);
    var x, y = 0;

    this._s = s;
    this._v = v;

    if (s == undefined) s = 1;
    if (v == undefined) v = 1;
    x = Math.round(size.width * s);
    y = Math.round(size.height * (1 - v));

    this._setHandlePosition(x, y, withoutNotify);
  }

  get s() {
    return this._s;
  }

  get v() {
    return this._v;
  }

  _refreshCanvas() {
    var h = this._h;
    var canvas = this._canvas;
    var ctx = canvas.getContext('2d');

    var imageWidth = canvas.width;
    var imageHeight = canvas.height;
    var lastX = imageWidth - 1;
    var lastY = imageHeight - 1;


    var imageData = ctx.getImageData(0, 0, imageWidth, imageHeight);
    var idx = 0;
    var rgb = null;

    for (var y = 0; y < imageHeight; y++) {
      for (var x = 0; x < imageWidth; x++) {
        rgb = MA.Color.hsv2rgb({ h: h, s: x / lastX, v: 1 - y / lastY });
        idx = x * 4 + y * imageWidth * 4;
        imageData.data[0 + idx] = rgb.r;
        imageData.data[1 + idx] = rgb.g;
        imageData.data[2 + idx] = rgb.b;
        imageData.data[3 + idx] = 255;
      }
    }

    ctx.putImageData(imageData, 0, 0);
  }

  _refreshHandleColor () {

    var h = this._h;
    var s = this._s;
    var v = this._v;

    if (!h || h < 0) h = 0;
    if (!s || s < 0) s = 0;
    if (!v || v < 0) v = 0;

    var rgb = MA.Color.fix(MA.Color.hsv2rgb({ h: h, s: s, v: v }));
    this._handle.style.background = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',1)';
  }

  _setHandlePosition(x, y, withoutNotify) {

    var size = MA.DOM.size(this._canvas);

    if (x < 0) x = 0;
    if (x > size.width) x = size.width;

    if (y < 0) y = 0;
    if (y > size.height) y = size.height;

    var s = (x / size.width);
    var v = ((size.height - y) / size.height);

    var h = this._h;
    if (!h || h < 0) h = 0;


    this._handle.style.left = x + 'px';
    this._handle.style.top = y + 'px';
    this._s = s;
    this._v = v;

    this._refreshHandleColor();

    if (!withoutNotify) this.fire("change", { s: s, v: v });

  }

  _startHandleDrag(offsetX, offsetY) {
    //this._handle.setAttribute("tabindex",-1);
    //this._handle.focus();
    document.activeElement.blur();

    this._dragState = {};
    this._dragState.startOffsetX = offsetX;
    this._dragState.startOffsetY = offsetY;

    this._handleMouseMoveHandler = MA.bind(this._onHandleMouseMove, this);
    this._handleMouseUpHandler = MA.bind(this._onHandleMouseUp, this);

    MA.DOM.on(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.on(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "touchend", this._handleMouseUpHandler);

  }

  _onCanvasMouseDown(e) {
    this._setHandlePosition(e.offsetX, e.offsetY);
    this._startHandleDrag(this._handleHalfSize, this._handleHalfSize);

    if (e.preventDefault) e.preventDefault();

    return false;
  }

  _onHandleMouseDown(e) {
    this._startHandleDrag(e.targetTouches ? 0 : e.offsetX, e.targetTouches ? 0 : e.offsetY);

    if (e.preventDefault) e.preventDefault();
    return false;
  }

  _onHandleMouseMove(e) {

    if (!this._dragState) {
      MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
      MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
      return true;
    }

    var pos = MA.DOM.offset(this._canvas);

    var newX = ( e.touches ? e.touches[0].pageX : e.pageX ) - pos.left - (this._dragState.startOffsetX - this._handleHalfSize);
    var newY = ( e.touches ? e.touches[0].pageY : e.pageY )- pos.top - (this._dragState.startOffsetY - this._handleHalfSize);

    this._setHandlePosition(newX, newY);

    if (e.preventDefault) e.preventDefault();
    return false;
  }

  _onHandleMouseUp(e) {

    this._dragState = null;
    MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
  }

};







/***************************************
    GSIBV.UI.ColorPicker.HueSelector
    色相選択  
***************************************/
GSIBV.UI.ColorPicker.HueSelector = class extends MA.Class.Base {


  constructor(elem, height, h) {
    super();
    this._h = h;
    this._height = height;

    if (typeof elem == 'string') {
      this._element = MA.DOM.select(elem)[0];
    } else {
      this._element = elem;
    }

    this._create();
  }

  _create() {

    this._backgroundElement = MA.DOM.create('div');
    this._backgroundElement.style.position = 'absolute';
    this._backgroundElement.style.left = '0px';
    this._backgroundElement.style.top = '4px';
    this._backgroundElement.style.right = '0px';
    this._backgroundElement.style.bottom = '4px';
    this._backgroundElement.style.cursor = 'pointer';
    this._backgroundElement.style.borderRadius = '2px';
    this._backgroundElement.style.background = 'linear-gradient(to right,' +
      'hsl(0,100%,50%),' +
      'hsl(60,100%,50%),' +
      'hsl(120,100%,50%),' +
      'hsl(180,100%,50%),' +
      'hsl(240,100%,50%),' +
      'hsl(300,100%,50%),' +
      'hsl(360,100%,50%)' +
      ')';


    this._element.appendChild(this._backgroundElement);
    var size = MA.DOM.size(this._element);

    this._handleSize = ( this._height ? this._height : size.height ) - 2;
    this._handleHalfSize = Math.round(this._handleSize / 2);


    // ハンドル生成
    this._handleElement = MA.DOM.create("div");
    this._handleElement.style.position = 'absolute';
    this._handleElement.style.borderRadius = '50%';
    this._handleElement.style.width = this._handleSize + 'px';
    this._handleElement.style.height = this._handleSize + 'px';
    this._handleElement.style.left = '0px';
    this._handleElement.style.top = '50%';
    this._handleElement.style.marginTop = '-' + this._handleHalfSize + 'px';
    this._handleElement.style.marginLeft = '-' + this._handleHalfSize + 'px';
    this._handleElement.style.opacity = 1;
    this._handleElement.style.outline = 0;
    this._handleElement.style.cursor = 'pointer';

    this._handleElement.style.zIndex = 10;
    this._handleElement.style.boxShadow = "0px 0px 2px 2px rgba(255, 255, 255, 0.95)";


    MA.DOM.on(this._backgroundElement, "mousedown", MA.bind(this._onBackgroundMouseDown, this));
    MA.DOM.on(this._handleElement, "mousedown", MA.bind(this._onHandleMouseDown, this));
    MA.DOM.on(this._handleElement, "touchstart", MA.bind(this._onHandleMouseDown, this));

    this._element.appendChild(this._handleElement);

    //this._setHandlePosition(0,0);
    this.setHue(this._h ? this._h : 0, true);


  }

  setHue(h, withoutNotify) {
    var size = MA.DOM.size(this._backgroundElement);

    var width = size.width;
    var pos = Math.round(width * (h / 360));
    this._setHandlePosition(pos, withoutNotify);
  }

  get h() {
    return this._h;
  }

  _setHandlePosition(pos, withoutNotify) {
    var size = MA.DOM.size(this._backgroundElement);

    // 横の場合
    var width = size.width;

    if (pos < 0) pos = 0;
    if (pos > width) pos = width;

    var h = Math.round(pos / width * 360);

    var rgb = MA.Color.fix(MA.Color.hsv2rgb({ h: h, s: 1, v: 1 }));
    this._handleElement.style.background = 'rgba(' + rgb.r + ',' + rgb.g + ',' + rgb.b + ',1)';
    //this._setColor({h:h,s:-1,v:-1});
    this._handleElement.style.left = pos + 'px';
    this._h = h;

    if (!withoutNotify) this.fire("change", { h: h });
  }

  _startHandleDrag(pos) {

    //this._handleElement.setAttribute("tabindex",-1);
    //this._handleElement.focus();
    document.activeElement.blur();

    this._dragState = {};
    this._dragState.startOffsetPos = pos;

    this._handleMouseMoveHandler = MA.bind(this._onHandleMouseMove, this);
    this._handleMouseUpHandler = MA.bind(this._onHandleMouseUp, this);

    MA.DOM.on(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.on(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "touchend", this._handleMouseUpHandler);

  }

  _onBackgroundMouseDown(e) {

    this._setHandlePosition(e.offsetX);
    this._startHandleDrag(this._handleHalfSize);

    if (e.preventDefault) e.preventDefault();
    return false;
  }

  _onHandleMouseDown(e) {

    this._startHandleDrag(e.targetTouches ? 0 : e.offsetX);

    if (e.preventDefault) e.preventDefault();
    return false;
  }

  _onHandleMouseMove(e) {
    if (!this._dragState) {
      MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
      MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
      return true;
    }

    var elementPos = MA.DOM.offset(this._element);

    var newPos = ( e.touches ? e.touches[0].pageX : e.pageX )- elementPos.left - (this._dragState.startOffsetPos - this._handleHalfSize);

    this._setHandlePosition(newPos);

    if (e.preventDefault) e.preventDefault();
    return false;

  }

  _onHandleMouseUp(e) {

    this._dragState = null;
    MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
  }
};



/***************************************
    GSIBV.UI.ColorPicker.OpacitySelector
    不透明度選択  
***************************************/
GSIBV.UI.ColorPicker.OpacitySelector = class extends MA.Class.Base {

  constructor(elem, height, opacity) {
    super();
    this._opacity = opacity;
    this._height = height;
    if (typeof elem == 'string') {
      this._element = MA.DOM.select(elem)[0];
    } else {
      this._element = elem;
    }

    this._create();
  }

  _create() {

    var dotSize = 3;

    this._canvas = MA.DOM.create('canvas');
    this._canvas.width = dotSize * 2;
    this._canvas.height = dotSize * 2;
    var ctx = this._canvas.getContext("2d");

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.globalAlpha = 1.0;
    ctx.fillRect(0, 0, dotSize * 2, dotSize * 2);

    ctx.fillStyle = "rgb(128, 128, 128)";
    ctx.globalAlpha = 1.0;
    ctx.fillRect(0, 0, dotSize, dotSize);
    ctx.fillRect(dotSize, dotSize, dotSize, dotSize);

    var url = this._canvas.toDataURL("image/png");

    this._backgroundElement = MA.DOM.create('div');
    this._backgroundElement.style.position = 'absolute';
    this._backgroundElement.style.left = '0px';
    this._backgroundElement.style.top = '4px';
    this._backgroundElement.style.right = '0px';
    this._backgroundElement.style.bottom = '4px';
    this._backgroundElement.style.cursor = 'pointer';
    this._backgroundElement.style.borderRadius = '2px';
    this._backgroundElement.style.backgroundImage = 'url("' + url + '")';


    this._opacityElement = MA.DOM.create('div');
    this._opacityElement.style.position = 'absolute';
    this._opacityElement.style.left = '0px';
    this._opacityElement.style.top = '4px';
    this._opacityElement.style.right = '0px';
    this._opacityElement.style.bottom = '4px';
    this._opacityElement.style.cursor = 'pointer';
    this._opacityElement.style.background = 'linear-gradient(to right,' +
      'rgba(0,0,0,1),' +
      'rgba(0,0,0,0)' +
      ')';

    this._element.appendChild(this._backgroundElement);
    this._element.appendChild(this._opacityElement);

    var size = MA.DOM.size(this._element);

    this._handleSize = ( this._height ? this._height : size.height) - 2;
    this._handleHalfSize = Math.round(this._handleSize / 2);

    // ハンドル生成
    this._handleElement = MA.DOM.create("div");
    this._handleElement.style.position = 'absolute';
    this._handleElement.style.borderRadius = '50%';
    this._handleElement.style.width = this._handleSize + 'px';
    this._handleElement.style.height = this._handleSize + 'px';
    this._handleElement.style.left = '0px';
    this._handleElement.style.top = '50%';
    this._handleElement.style.marginTop = '-' + this._handleHalfSize + 'px';
    this._handleElement.style.marginLeft = '-' + this._handleHalfSize + 'px';
    this._handleElement.style.opacity = 1;
    this._handleElement.style.outline = 0;
    this._handleElement.style.cursor = 'pointer';
    this._handleElement.style.background = 'rgba(0,0,0,1)';

    this._handleElement.style.zIndex = 10;
    this._handleElement.style.boxShadow = "0px 0px 2px 2px rgba(255, 255, 255, 0.95)";


    MA.DOM.on(this._opacityElement, "mousedown", MA.bind(this._onBackgroundMouseDown, this));
    MA.DOM.on(this._handleElement, "mousedown", MA.bind(this._onHandleMouseDown, this));
    MA.DOM.on(this._handleElement, "touchstart", MA.bind(this._onHandleMouseDown, this));

    this._element.appendChild(this._handleElement);

    this.setOpacity(this._opacity ? this._opacity : 1, true);
  }

  setOpacity(opacity, withoutNotify) {
    var size = MA.DOM.size(this._backgroundElement);

    var width = size.width;
    var pos = Math.round(width * (1 - opacity));
    this._setHandlePosition(pos, withoutNotify);
  }

  get opacity() {
    return this._opacity;
  }
  getOpacity() {
    return this._opacity;
  }

  _setHandlePosition(pos, withoutNotify) {
    var size = MA.DOM.size(this._backgroundElement);

    // 横の場合
    var width = size.width;

    if (pos < 0) pos = 0;
    if (pos > width) pos = width;

    var opacity = 1 - (pos / width);

    this._handleElement.style.background = 'rgba(0,0,0,' + (Math.round(opacity * 100) / 100) + ')';
    //this._setColor({h:h,s:-1,v:-1});
    this._handleElement.style.left = pos + 'px';
    this._opacity = opacity;

    if (!withoutNotify) this.fire("change", { opacity: opacity });
  }

  _startHandleDrag(pos) {
    //this._handleElement.setAttribute("tabindex",-1);
    //this._handleElement.focus();
    document.activeElement.blur();

    this._dragState = {};
    this._dragState.startOffsetPos = pos;

    this._handleMouseMoveHandler = MA.bind(this._onHandleMouseMove, this);
    this._handleMouseUpHandler = MA.bind(this._onHandleMouseUp, this);

    MA.DOM.on(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.on(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.on(document, "touchend", this._handleMouseUpHandler);

  }

  _onBackgroundMouseDown(e) {

    this._setHandlePosition(e.offsetX);
    this._startHandleDrag(this._handleHalfSize);

    if (e.preventDefault) e.preventDefault();
    return false;
  }

  _onHandleMouseDown(e) {

    //this._startHandleDrag(e.offsetX);
    this._startHandleDrag(e.targetTouches ? 0 : e.offsetX);

    if (e.preventDefault) e.preventDefault();
    return false;
  }

  _onHandleMouseMove(e) {
    if (!this._dragState) {
      MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
      MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
      return true;
    }

    var elementPos = MA.DOM.offset(this._element);

    var newPos = ( e.touches ? e.touches[0].pageX : e.pageX ) - elementPos.left - (this._dragState.startOffsetPos - this._handleHalfSize);

    this._setHandlePosition(newPos);

    if (e.preventDefault) e.preventDefault();
    return false;

  }

  _onHandleMouseUp(e) {

    this._dragState = null;
    MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
  }
};
