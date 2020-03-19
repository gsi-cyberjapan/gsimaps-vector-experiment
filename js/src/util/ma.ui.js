if (!MA.UI) MA.UI = {};
/***************************************
    MA.UI.Slider
    スライダー  
***************************************/
MA.UI.Slider = class extends MA.Class.Base {

  constructor(element, options) {
    super();
    this._element = element;
    this._value = (options && options.value != undefined ? options.value : 1);
    if (options && options.handleSize) {
      this._handleSize = options.handleSize;
    }
  }

  create() {
    var dotSize = 3;
    this._canvas = MA.DOM.create('canvas');
    this._canvas.width = dotSize * 2;
    this._canvas.height = dotSize * 2;
    var ctx = this._canvas.getContext("2d");

    ctx.fillStyle = "rgb(255, 255, 255)";
    ctx.globalAlpha = 0;
    ctx.fillRect(0, 0, dotSize * 2, dotSize * 2);

    ctx.fillStyle = "rgb(128, 128, 128)";
    ctx.globalAlpha = 1.0;
    ctx.fillRect(0, 0, dotSize, dotSize);
    ctx.fillRect(dotSize, dotSize, dotSize, dotSize);

    var url = this._canvas.toDataURL("image/png");

    this._backgroundElement = MA.DOM.create('div');
    MA.DOM.addClass(this._backgroundElement, "-gsi-ui-slider-background");
    this._backgroundElement.style.position = 'absolute';
    this._backgroundElement.style.left = '0px';
    this._backgroundElement.style.top = '4px';
    this._backgroundElement.style.right = '0px';
    this._backgroundElement.style.bottom = '4px';
    this._backgroundElement.style.cursor = 'pointer';
    this._backgroundElement.style.borderRadius = '2px';
    this._backgroundElement.style.backgroundImage = 'url("' + url + '")';


    this._valueElement = MA.DOM.create('div');
    this._valueElement.style.position = 'absolute';
    this._valueElement.style.left = '0px';
    this._valueElement.style.top = '4px';
    this._valueElement.style.right = '0px';
    this._valueElement.style.bottom = '4px';
    this._valueElement.style.cursor = 'pointer';
    this._valueElement.style.borderRadius = '2px';
    this._valueElement.style.background = 'linear-gradient(to right,' +
      'rgba(0,0,0,1),' +
      'rgba(0,0,0,0)' +
      ')';

    this._element.appendChild(this._backgroundElement);
    this._element.appendChild(this._valueElement);

    var size = MA.DOM.size(this._element);

    if ( !this._handleSize ) this._handleSize = size.height - 2;
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


    MA.DOM.on(this._valueElement, "mousedown", MA.bind(this._onBackgroundMouseDown, this));
    MA.DOM.on(this._handleElement, "mousedown", MA.bind(this._onHandleMouseDown, this));
    MA.DOM.on(this._handleElement, "touchstart", MA.bind(this._onHandleMouseDown, this));

    this._element.appendChild(this._handleElement);


    this.setValue(this._value ? this._value : 1, true);
  }

  setValue(value, withoutNotify) {
    var size = MA.DOM.size(this._backgroundElement);

    var width = size.width;
    var pos = Math.round(width * (1 - value));
    this._setHandlePosition(pos, true);
  }

  set value(value) {
    this.setValue(value, false);
  }

  get value() {
    return this._value;
  }

  _setHandlePosition(pos, withoutNotify) {
    var size = MA.DOM.size(this._backgroundElement);

    // 横の場合
    var width = size.width;

    if (pos < 0) pos = 0;
    if (pos > width) pos = width;

    var value = 1 - (pos / width);

    this._handleElement.style.background = 'rgba(0,0,0,' + (Math.round(value * 100) / 100) + ')';
    //this._setColor({h:h,s:-1,v:-1});
    this._handleElement.style.left = pos + 'px';
    this._value = value;

    if (!withoutNotify) this.fire("change", { value: value });
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
      MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
      MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
      MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
      return true;
    }

    var elementPos = MA.DOM.offset(this._element);

    var pageX = undefined;
    if (e.touches) {
      pageX = e.touches[0].pageX;
    } else {
      pageX = e.pageX;
    }   

    var newPos = pageX- elementPos.left - (this._dragState.startOffsetPos - this._handleHalfSize);

    this._setHandlePosition(newPos);

    if (e.preventDefault) e.preventDefault();
    return false;

  }

  _onHandleMouseUp(e) {

    this._dragState = null;
    MA.DOM.off(document, "mousemove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "touchmove", this._handleMouseMoveHandler);
    MA.DOM.off(document, "mouseup", this._handleMouseUpHandler);
    MA.DOM.off(document, "touchend", this._handleMouseUpHandler);
  }
}
