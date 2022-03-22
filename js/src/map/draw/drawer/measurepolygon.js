/*****************************************************************
 * GSIBV.Map.Draw.LineDrawer
 * ライン作成クラス
******************************************************************/

GSIBV.Map.Draw.MeasurePolygonDrawer = class extends GSIBV.Map.Draw.MeasureLineDrawer {

  constructor(map, layer) {
    super(map, layer);
  }
  get type() {
    return GSIBV.Map.Draw.MeasurePolygon.Type;
  }
  
  _getDistance(latlng) {
    if ( !this._latlngs || this._latlngs.length <= 1 || ( this._latlngs.length == 2 && !latlng ) )  return undefined;
    // ここで面積計算
    var area = 0;
    if (this._restart || !this._latlngs || this._latlngs.length <= 0 ) {
      this._toolTip.message = "開始位置をクリック";
    } else {
      area = GSI.Utils.AreaCalculator.calc(this._latlngs);
      if ( this._latlngs.length >= this._feature.coordinatesMinLength ) {
        this._toolTip.message = "<div class='tooltip-subtext'>"+GSI.Utils.AreaCalculator.getAreaStr(area)+"</div>" +
        "次の位置を選択(最終点をもう一度クリックして終了)" + 
          '<div class="mini">※右クリックで直前の点を取り消すことができます。</div>';
      }　else {
        this._toolTip.message = "次の位置を選択" + 
        '<div class="mini">※右クリックで直前の点を取り消すことができます。</div>';
      }
    }
    return {"distance":area, "type":"area" };
  }

  
  _updateTooltip() {
    this._toolTip.distanceCalculator = MA.bind( this._getDistance, this );
    // console.log(this._toolTip._area);
    
    var area = 0;
    if (!this._latlngs || this._latlngs.length <= 0 ) {
      this._toolTip.message = "開始位置をクリック";
    } else {
      area = GSI.Utils.AreaCalculator.calc(this._latlngs);
      this._toolTip._area = area;
      if ( this._latlngs.length >= this._feature.coordinatesMinLength ) {
        this._toolTip.message = "<div class='tooltip-subtext'>"+GSI.Utils.AreaCalculator.getAreaStr(area)+"</div>" +
        "次の位置を選択(最終点をもう一度クリックして終了)" + 
          '<div class="mini">※右クリックで直前の点を取り消すことができます。</div>';
      }　else {
        this._toolTip.message = "次の位置を選択" + 
        '<div class="mini">※右クリックで直前の点を取り消すことができます。</div>';
      }
    }
  }
  _addLatLng(latlng) {
    if (!this._restart && this._latlngs.length >= 3 ) {
      
      if ( this._checkCrossing(latlng) ) {
        return;
      }

    }
    // super._addLatLng(latlng);
    
    if(this._restart) {
      // this._map.drawManager.stopDraw();
      this._map.drawManager._userDrawingItem.featureCollection.clear();

      this.start();
      this._restart = false;
    }
    this._latlngs.push(latlng);
    this._feature.coordinates.set( this._latlngs );
    this._editor.recreate();
    this._layer.update();
    this._updateTooltip();

    var area = GSI.Utils.AreaCalculator.calc(this._latlngs);
    var dialog = MA.DOM.find( document.body, ".-gsibv-measure-dialog" )[0];
    MA.DOM.find( dialog, ".measure-result" )[0].innerHTML = GSI.Utils.AreaCalculator.getAreaStr(area);
    MA.DOM.find( dialog, ".measure-lastlatlng" )[0].innerHTML = latlng.lat.toFixed(6) + ", " + latlng.lng.toFixed(6);
    if(this._latlngs.length>2) {
      GSIBV.application._measureDialog.enableButton(0);
    } else {
      GSIBV.application._measureDialog.disableButton(0);
    }
  }

  _onMouseMove(evt) {
    super._onMouseMove(evt);
    if ( this._feature.coordinates.length > 3 ) {
      if ( this._checkCrossing(this._feature.coordinates.get(this._feature.coordinates.length-1)) ) {
        this._toolTip.errorMessage = "ポリゴンが交差しています";
        return;
      }
    }

    this._toolTip.errorMessage = "";


  }

  _checkCrossing(newLatLng) {
    
    if ( this._latlngs.length < 3 ) return false;

    var lines = [];
    
    lines.push([this._latlngs[0], newLatLng]);
    lines.push([this._latlngs[this._latlngs.length-1], newLatLng]);

    for( var i=0; i<lines.length; i++ ) {
      var line = lines[i];

      for( var j=0; j<this._latlngs.length-1; j++ ) {
        var line2 = [];
        line2.push( this._latlngs[j], this._latlngs[j+1]);
        if ( MA.lineIntersects( 
            line[0].lng, line[0].lat, line[1].lng, line[1].lat, 
            line2[0].lng, line2[0].lat,line2[1].lng, line2[1].lat )) {
          return true;
        }
      }
    }
    return false;
  }

  
  _popLatLng() {
    
    if ( this._latlngs.length == 2 ) {
      var latlngs = this._latlngs;
      this._latlngs = [];
      this._destroyFeature();
      this._createFeature();
      this._latlngs = latlngs;
    }
    super._popLatLng();

    this._updateTooltip();
    var len = this._latlngs.length;
    var dialog = MA.DOM.find( document.body, ".-gsibv-measure-dialog" )[0];
    if(len>0) {
      MA.DOM.find( dialog, ".measure-result" )[0].innerHTML = GSI.Utils.AreaCalculator.getAreaStr(this._toolTip._area);
      MA.DOM.find( dialog, ".measure-lastlatlng" )[0].innerHTML =this._latlngs[len-1].lat + ", " + this._latlngs[len-1].lng;
    } else {
      MA.DOM.find( dialog, ".measure-result" )[0].innerHTML = "------";
      MA.DOM.find( dialog, ".measure-lastlatlng" )[0].innerHTML = "------";
    }

    if(len>2) {
      GSIBV.application._measureDialog.enableButton(0);
    } else {
      GSIBV.application._measureDialog.disableButton(0);
    }
  }

  _makerFeature() {
    return new GSIBV.Map.Draw.MeasurePolygon();
  }

};