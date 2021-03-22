


GSIBV.Map.MousePosition = class extends MA.Class.Base {

  constructor(map, options) {
    super();
    this._map = map;
    this._visible = false;
    if (options) {
      if (options.visible == true) this._visible = true;
    }

    if (this._visible) this.create();
  }

  set visible(visible) {
    if (this._visible != visible) {
      this._visible = visible;
      if (this._visible) {
        this.create();
        this._refreshCurrentPositionCanvas();
      } else {
        this.destroy();
      }

    }

  }

  set latlng( latlng) {
    this._latlng = latlng;
    this._refreshCurrentPositionCanvas();
  }

  create() {
    if (this._canvas) return;
    var canvasContainer = this._map.getCanvasContainer();
    //var rect = canvasContainer.getBoundingClientRect();


    var canvas = MA.DOM.create("canvas");
    canvas.style.position = "absolute";
    canvas.style.left = "0px";
    canvas.style.top = "0px";

    this._canvas = canvas;
    this._resize();
    canvasContainer.appendChild(canvas);


    this._mouseMoveHandler = MA.bind(this._onMouseMove, this);
    this._mapMoveHandler = MA.bind(this._onMapMove, this);
    this._map.on("mousemove", this._mouseMoveHandler);
    this._map.on("move", this._mapMoveHandler);
    
    this._resizeHandler = MA.bind(this._onResize, this);
    MA.DOM.on(window, "resize", this._resizeHandler);


    this._currentPositionCanvas = MA.DOM.create("canvas");
    this._currentPositionCanvas.style.position = "absolute";
    this._currentPositionCanvas.style.left = "0px";
    this._currentPositionCanvas.style.top = "0px";
    this._currentPositionCanvas.style.marginLeft = "-16px";
    this._currentPositionCanvas.style.marginTop = "-32px";
    this._currentPositionCanvas.width = 32;
    this._currentPositionCanvas.height = 32;
    this._drawCurrentPositionCanvas();
    this._currentPositionCanvas.style.display = 'none';
    canvasContainer.appendChild(this._currentPositionCanvas);

  }

  _drawCurrentPositionCanvas() {

    var ctx = this._currentPositionCanvas.getContext("2d");
    //ctx.fillRect(0, 0, 32, 32);
    ctx.lineWidth = 2;
    ctx.fillStyle = "rgb(79, 178, 218)";
    ctx.strokeStyle = "#333";
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    ctx.moveTo(10, 18);
    ctx.lineTo(16, 32);
    ctx.lineTo(22, 18);
    ctx.lineTo(10, 18);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(16, 16, 10, 0, Math.PI*2, false);
    
    ctx.fill();
    ctx.stroke();
    
  }

  _refreshCurrentPositionCanvas () {
    if ( !this._currentPositionCanvas) return;
    if ( !this._latlng ) {
      this._currentPositionCanvas.style.display = 'none';
      return;
    }
    
    var pos = this._map.project(this._latlng);
    
    this._currentPositionCanvas.style.left = Math.round(pos.x) + 'px';
    this._currentPositionCanvas.style.top = Math.round(pos.y) + 'px';

    
    this._currentPositionCanvas.style.display = '';



  }
  _resize() {
    if (!this._canvas) return;
    var canvasContainer = this._map.getContainer();
    var w = 0;
    var h = 0;

    if (canvasContainer.getBoundingClientRect) {
      var rect = canvasContainer.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
    } else {
      var size = MA.DOM.size(canvasContainer);
      w = size.width;
      h = size.height;
    }
    this._canvas.width = w;
    this._canvas.height = h;
    this._canvas.style.width = w + "px";
    this._canvas.style.height = h + "px";
    var ctx = this._canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    this._refreshCurrentPositionCanvas();
  }
  _onResize() {
    this._resize();

  }

  _onMapMove(e) {
    this._refreshCurrentPositionCanvas();
  }

  _onMouseMove(e) {
    this._draw(e.point);
  }

  _draw(p) {

    if (!this._canvas) return;
    var canvasContainer = this._map.getContainer();

    var size = MA.DOM.size(canvasContainer);
    var w = size.width;
    var h = size.height;

    var ctx = this._canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    ctx.beginPath();
    if (ctx.setLineDash) {
      ctx.setLineDash([1, 1]);
    }
    ctx.lineWidth = 1;
    ctx.moveTo(p.x, 0);
    ctx.lineTo(p.x, h);
    ctx.moveTo(0, p.y);
    ctx.lineTo(w, p.y);
    ctx.stroke();

  }

  destroy() {
    this._latlng = undefined;
    if (!this._canvas) return;

    this._map.off("mousemove", this._mouseMoveHandler);
    this._mouseMoveHandler = null;
    
    this._map.off("move", this._mapMoveHandler);
    this._mapMoveHandler = null;


    MA.DOM.off(window, "resize", this._resizeHandler);
    this._resizeHandler = null;

    var canvasContainer = this._map.getCanvasContainer();
    canvasContainer.removeChild(this._canvas);
    canvasContainer.removeChild(this._currentPositionCanvas);
    

    delete this._canvas;
    this._canvas = null;
  }
}
