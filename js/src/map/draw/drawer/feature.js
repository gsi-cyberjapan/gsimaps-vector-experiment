/*****************************************************************
 * GSIBV.Map.Draw.FeatureDrawer
 * 地物作成基底クラス
******************************************************************/

GSIBV.Map.Draw.FeatureDrawer= class extends MA.Class.Base {

  constructor(map, layer) {
    super();
    this._map = map;
    this._layer = layer;
    this._featureCollection = layer.featureCollection;
    this._controls = [];
  }

  get feature() {
    return this._feature;
  }
  _startAutoPan() {
    if ( !this._autoPan ) {
      this._autoPan = new GSIBV.Map.AutoPan(this._map.map);
      this._autoPan.on("move", MA.bind(function(evt){
        if (! this._currentMousePos) return;
        this._onMouseMove(this._currentMousePos);
      },this));
    }
    this._autoPan.start();

  }
  _stopAutoPan() {
    if ( this._autoPan ) this._autoPan.destroy();
    this._autoPan = undefined;
  }

  start() {
    this._startAutoPan();
    if ( !this._toolTip ) this._toolTip = new GSIBV.Map.Draw.Tooltip(this._map);
  }

  stop() {
    this._stopAutoPan();
    if ( this._toolTip ) this._toolTip.destroy();
    this._toolTip = undefined;
  }

  destroy() {
    this._stopAutoPan();
    if ( this._toolTip ) this._toolTip.destroy();
    this._toolTip = undefined;
    this.destroyControls();
  }

  destroyControls() {
    for( var i=0; i<this._controls.length; i++) {
      this._controls[i].destroy();
    }
    this._controls = [];
  }



  
  _pagePosToCanvasPos(evt) {

    var pos = {
      x : evt.pageX,
      y : evt.pageY
    };
    var canvasContainer = this._map.map.getCanvasContainer();
    var offset = MA.DOM.offset(canvasContainer);
    pos.x -= offset.left;
    pos.y -= offset.top;

    return pos;
  }

};
