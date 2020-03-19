/*****************************************************************
 * GSIBV.Map.Draw.PolygonEditor
 * 地物ポリゴン編集
******************************************************************/


GSIBV.Map.Draw.PolygonEditor = class extends GSIBV.Map.Draw.LineEditor {

  constructor(map, targetFeature) {
    super( map, targetFeature);
    this._minCoordinatesLength = 3;
  }


  _createControls() {
    super._createControls();
    this._editor .on("markermove", MA.bind(function(evt){
      
      GSIBV.Map.Draw.PolygonEditor.checkOuter( this,
        this.targetFeature.coordinates,this.targetFeature.innerList,evt.params.target );
    },this));

    this._editor .on("markermoveend", MA.bind(function(evt){
      if (!GSIBV.Map.Draw.PolygonEditor.checkOuter( this,
        this.targetFeature.coordinates,this.targetFeature.innerList, evt.params.target ) ) {
        evt.params.cancel = true;
      }
      this._toolTip.clear();
    },this));

    this._editor .on("markerremove", MA.bind(function(evt){
      var idx1 = evt.params.target.index-1;
      var idx2 = evt.params.target.index;
      
      var coordinates = this.targetFeature.coordinates.clone();
      coordinates.remove(  evt.params.target.index );

      if ( idx1 < 0 ) idx1 = coordinates.length-1;
      if ( idx2 >= coordinates.length) idx2 = 0;

      if (!GSIBV.Map.Draw.PolygonEditor.checkOuter(  
        this, coordinates,this.targetFeature.innerList, idx1, idx2 ) ) {
        this._toolTip._onMouseMove(evt.params.originalEvent);
        evt.params.cancel = true;
      }else {
        this._toolTip.clear();
      }
    },this));


    for( var i=0; i<this.targetFeature.innerList.length; i++ ) {

      var editor = new GSIBV.Map.Draw.Control.LineEditor(  this._map, this.targetFeature.innerList[i], this._minCoordinatesLength);
      editor.on("update",MA.bind(function(){
        this.targetFeature.update();
        if ( this._layer ) this._layer.update();
      },this));
      
      editor .on("markermove", MA.bind(function(feature, index,evt){
        GSIBV.Map.Draw.PolygonEditor.checkInner( this, feature, index, evt.params.target );
      },this, this.targetFeature, i ));

      editor .on("markermoveend", MA.bind(function(feature, index,evt){
        if (!GSIBV.Map.Draw.PolygonEditor.checkInner( this, feature, index, evt.params.target ) ) {
          evt.params.cancel = true;
        }
        this._toolTip.clear();
      },this, this.targetFeature, i ));
      
      this._controls.push(editor);
    }
    // inner
  }

  static checkInner( editor, feature, index, marker ) {
    var coordinates = feature.innerList[index];
    if ( !GSIBV.Map.Draw.PolygonEditor.checkOwn(coordinates, marker ) ) {
      editor._toolTip.errorMessage = "ポリゴンが交差しています";
      return false;
    }

    // 外との交差
    var idx = marker.index;
    var prevIdx = ( idx > 0 ? idx -1 : coordinates.length-1 );
    var nextIdx = ( idx < coordinates.length-1 ? idx +1 : 0 );
    
    var line1 = [coordinates.get(prevIdx), coordinates.get(idx)];
    var line2 = [coordinates.get(nextIdx), coordinates.get(idx)];
    if ( GSIBV.Map.Draw.PolygonEditor.lineIntersectsPolygon(feature.coordinates, line1 )||
        GSIBV.Map.Draw.PolygonEditor.lineIntersectsPolygon(feature.coordinates, line2 ) ) {
      editor._toolTip.errorMessage = "ポリゴンが交差しています";
      return false;
    }

    // 内同士の判定
    var inner0 = [];

    for( var i=0; i<feature.innerList[index].length; i++ ) {
      inner0.push([feature.innerList[index].get(i).lng, feature.innerList[index].get(i).lat]);
    }
    inner0.push([feature.innerList[index].get(0).lng, feature.innerList[index].get(0).lat]);

    var innerList = feature.innerList;
    for( var i=0; i<innerList.length; i++ ) {
      if ( i == index ) continue;
      
      var innerCoordinates = innerList[i];
      
      
      if ( GSIBV.Map.Draw.PolygonEditor.lineIntersectsPolygon(innerCoordinates, line1 )||
          GSIBV.Map.Draw.PolygonEditor.lineIntersectsPolygon(innerCoordinates, line2 ) ) {
        editor._toolTip.errorMessage = "ポリゴンが交差しています";
        return false;
      }

      var inner = [];

      for( var j=0; j<innerCoordinates.length; j++ ) {
        inner.push([innerCoordinates.get(j).lng, innerCoordinates.get(j).lat]);
      }
      inner.push([innerCoordinates.get(0).lng, innerCoordinates.get(0).lat]);
      if ( MA.isPolygonInPolygon( inner, inner0) ) {
        editor._toolTip.errorMessage = "ポリゴンが交差しています";
        return false;
      }
      
    }

    editor._toolTip.errorMessage = "";
    return true;
  }
  static checkOwn( coordinates,marker, idx2) {
    var error = GSIBV.Map.Draw.PolygonEditor.checkCrossing(coordinates, 
      ( marker instanceof GSIBV.Map.Draw.Control.MarkerBase ? marker.index : marker ), idx2);
    
    return !error;
  }

  static checkOuter( editor, coordinates, innerList, marker, idx2) {
    var error = !GSIBV.Map.Draw.PolygonEditor.checkOwn(coordinates,marker, idx2 );
    if ( !error ) {
      var outer = [];
      for( var i=0; i<coordinates.length; i++ ) {
        outer.push([coordinates.get(i).lng, coordinates.get(i).lat]);
      }
      outer.push([coordinates.get(0).lng, coordinates.get(0).lat]);

      for( var i=0; i<innerList.length; i++ ) {
        var innerCoordinates = innerList[i];
        
        var inner = [];

        for( var j=0; j<innerCoordinates.length; j++ ) {
          inner.push([innerCoordinates.get(j).lng, innerCoordinates.get(j).lat]);
        }
        inner.push([innerCoordinates.get(0).lng, innerCoordinates.get(0).lat]);
        
        if ( !MA.isPolygonInPolygon( inner, outer) ) {
          error = true;
          editor._toolTip.errorMessage = "中抜きポリゴンは内側にある必要があります";
          break;
        }
        if ( MA.polygonIntersects(inner, outer ) ) {
          error = true;
          editor._toolTip.errorMessage = "中抜きポリゴンは内側にある必要があります";
          break;
        }
      }
      
    } else {
      editor._toolTip.errorMessage = "ポリゴンが交差しています";
    }
    if ( !error ) {
      editor._toolTip.errorMessage = "";
    }
    return !error;
  }

  static lineIntersectsPolygon(coordinates, line) {
    for( var i=0; i<coordinates.length; i++ ) {

      var i2 = i+1;
      if ( i >= coordinates.length-1 ) {
        i2 = 0;
      }
      
      var line2 = [ coordinates.get(i), coordinates.get(i2) ];
      if ( MA.lineIntersects( 
          line[0].lng, line[0].lat, line[1].lng, line[1].lat, 
          line2[0].lng, line2[0].lat,line2[1].lng, line2[1].lat )) {
        return true;
      }
    }

    return false;

  }

  static checkCrossing2(coordinates) {
    
    for( var i=0; i<coordinates.length; i++ ) {
      var i2 = i+1;
      var line = [];
      if ( i >= coordinates.length-1 ) {
        i2 = 0;
      }
      
      line.push( coordinates.get(i), coordinates.get(i2));

      for( var j=0; j<coordinates.length; j++ ) {

        var j2 = j+1;
        var line2 = [];
        if ( j >= coordinates.length-1 ) {
          j2 = 0;
        }
        
        line2.push( coordinates.get(j), coordinates.get(j2));
        if ( MA.lineIntersects( 
            line[0].lng, line[0].lat, line[1].lng, line[1].lat, 
            line2[0].lng, line2[0].lat,line2[1].lng, line2[1].lat )) {
          return true;
        }
      }

    }

    return false;
  }

  static checkCrossing(coordinates, idx, idx2) {
    var lines = [];
    
    if ( idx2 != undefined) {
      //console.log( idx, idx2);
      lines.push([coordinates.get(idx), coordinates.get(idx2)]);
    } else {
      var prevIdx = ( idx > 0 ? idx -1 : coordinates.length-1 );
      var nextIdx = ( idx < coordinates.length-1 ? idx +1 : 0 );
      lines.push([coordinates.get(prevIdx), coordinates.get(idx)]);
      lines.push([coordinates.get(nextIdx), coordinates.get(idx)]);
    }

    for( var i=0; i<lines.length; i++ ) {
      var line = lines[i];

      for( var j=0; j<coordinates.length; j++ ) {

        var j2 = j+1;
        var line2 = [];
        if ( j >= coordinates.length-1 ) {
          j2 = 0;
        }
        
        if ( idx2 == undefined ) {
          if ( j == idx || j2 == idx ) continue;
        } else {
          if ( ( j == idx && j2== idx2 ) || (j2 == idx && j== idx2) )continue;
        }
        line2.push( coordinates.get(j), coordinates.get(j2));
        if ( MA.lineIntersects( 
            line[0].lng, line[0].lat, line[1].lng, line[1].lat, 
            line2[0].lng, line2[0].lat,line2[1].lng, line2[1].lat )) {
          return true;
        }
      }

    }

    return false;
  }

};