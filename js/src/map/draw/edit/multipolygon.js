/*****************************************************************
 * GSIBV.Map.Draw.MultiPolygonEditor
 * 地物マルチポリゴン編集
******************************************************************/


GSIBV.Map.Draw.MultiPolygonEditor = class extends GSIBV.Map.Draw.FeatureEditor {
  constructor(map, targetFeature) {
    super( map, targetFeature);
    this._minCoordinatesLength = 3;
  }
  
  _createControls() {
    var polygonList = this.targetFeature.polygons;

    for( var i=0; i<polygonList.length; i++ ) {
      var feature = polygonList[i];
      var editor = new GSIBV.Map.Draw.Control.LineEditor(  this._map, feature.coordinates,this._minCoordinatesLength );
      editor.on("update",MA.bind(function(){
        this.targetFeature.update();
        if ( this._layer ) this._layer.update();
      },this));
      editor .on("markermove", MA.bind(function(feature,evt){
        GSIBV.Map.Draw.PolygonEditor.checkOuter( this,
          feature.coordinates,feature.innerList,evt.params.target );

      },this, feature));

      editor .on("markermoveend", MA.bind(function(feature,evt){
        if (!GSIBV.Map.Draw.PolygonEditor.checkOuter( this,
          feature.coordinates,feature.innerList,evt.params.target ) ) {
          evt.params.cancel = true;
        }
        this._toolTip.clear();
      },this, feature));

      this._controls.push(editor);
      
      // 内側
      for( var j=0; j<feature.innerList.length; j++ ) {
        var editor = new GSIBV.Map.Draw.Control.LineEditor(  this._map, feature.innerList[j], this._minCoordinatesLength);
        editor.on("update",MA.bind(function(){
          this.targetFeature.update();
          if ( this._layer ) this._layer.update();
        },this));
        
        editor .on("markermove", MA.bind(function(feature, index,evt){
          GSIBV.Map.Draw.PolygonEditor.checkInner( this, feature, index, evt.params.target );
        },this, feature,i));

        editor .on("markermoveend", MA.bind(function(feature, index,evt){
          if ( !GSIBV.Map.Draw.PolygonEditor.checkInner( this, feature, index, evt.params.target ) ) {
            evt.params.cancel = true;
          }
          this._toolTip.clear();
        },this, feature,i));
        
        this._controls.push(editor);
      }
      
    }

  }

  

};