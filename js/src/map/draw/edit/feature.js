/*****************************************************************
 * GSIBV.Map.Draw.FeatureEditor
 * 地物基底クラス
******************************************************************/

GSIBV.Map.Draw.FeatureEditor = class extends MA.Class.Base {
  constructor( map, targetFeature ) {
    super();
    this._map = map;
    this._targetFeature = targetFeature;
    this._controls = [];
    


  }

  get targetFeature() {
    return this._targetFeature;
  }

  set layer(layer) {
    this._layer = layer;
  }

  get layer() { return this._layer; }

  start() {
    if ( !this._toolTip ) this._toolTip = new GSIBV.Map.Draw.Tooltip(this._map);

    this._createControls();
    if (!this._mapMoveHandler ) {
      this._mapMoveHandler = MA.bind( this._onMapMove, this );
      this._map.on("move",this._mapMoveHandler );
    }
  }

  _createControls() {

  }

  stop() {
    if ( this._toolTip ) this._toolTip.destroy();
    this._toolTip = undefined;
    this.destroy();
  }

  destroyControls() {

    for( var i=0; i<this._controls.length; i++ ) {
      this._controls[i].destroy();
    }
    this._controls = [];
  }

  destroy() {

    if ( this._toolTip ) this._toolTip.destroy();
    this._toolTip = undefined;

    this.destroyControls();
    if (this._mapMoveHandler ) {
      this._map.off("move",this._mapMoveHandler );
      this._mapMoveHandler = undefined;
    }
  }

  _onMapMove() {
    for( var i=0; i<this._controls.length; i++ ) {
      this._controls[i].refresh();
    }
  }
}