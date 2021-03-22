


GSIBV.Map.CenterCross = class extends MA.Class.Base {

  constructor(map, options) {
    super();
    this._map = map;
    this._visible = true;
    if (options) {
      if (options.visible == false) this._visible = false;
    }

    if (this._visible) this.create();
  }

  set visible(visible) {
    if (this._visible != visible) {
      this._visible = visible;
      if (this._visible) {
        this.create();
      } else {
        this.destroy();
      }

    }



  }
  create() {
    if (this._canvas) return;
    var canvasContainer = this._map.getCanvasContainer();
    //var rect = canvasContainer.getBoundingClientRect();

    var canvas = MA.DOM.create("canvas");
    canvas.style.position = "absolute";
    canvas.width = 32;
    canvas.height = 32;
    canvas.style.width = "32px";
    canvas.style.height = "32px";
    canvas.style.left = "50%";
    canvas.style.top = "50%";
    canvas.style.marginTop = "-16px";
    canvas.style.marginLeft = "-16px";

    var ctx = canvas.getContext("2d");
    ctx.beginPath();
    ctx.lineWidth = 2.5;
    ctx.moveTo(16, 0);
    ctx.lineTo(16, 32);
    ctx.moveTo(0, 16);
    ctx.lineTo(32, 16);
    ctx.stroke();
    canvasContainer.appendChild(canvas);

    this._canvas = canvas;
  }

  destroy() {
    if (!this._canvas) return;

    var canvasContainer = this._map.getCanvasContainer();
    canvasContainer.removeChild(this._canvas);
    delete this._canvas;
    this._canvas = null;
  }
}
