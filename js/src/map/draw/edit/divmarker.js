/*****************************************************************
 * GSIBV.Map.Draw.DivMarkerEditor
 * 地物ライン編集
******************************************************************/


GSIBV.Map.Draw.DivMarkerEditor = class extends GSIBV.Map.Draw.MarkerEditor {
  constructor(map, targetFeature) {
    super( map, targetFeature);
  }



  _createTextCanvas() {
    var textToCanvas = new GSIBV.Map.Draw.Layer.TextToCanvas();
    textToCanvas.text = this._targetFeature.style.text;
    if ( this._targetFeature.style.fontSize)textToCanvas.fontSize = this._targetFeature.style.fontSize;
    if ( this._targetFeature.style.color)textToCanvas.color = this._targetFeature.style.color;
    if ( this._targetFeature.style.backgroundColor)textToCanvas.backgroundColor = this._targetFeature.style.backgroundColor;
    if ( this._targetFeature.style.bold)textToCanvas.bold = this._targetFeature.style.bold;
    if ( this._targetFeature.style.underLine)textToCanvas.underline = this._targetFeature.style.underLine;
    if ( this._targetFeature.style.italic)textToCanvas.italic = this._targetFeature.style.italic;
    var canvas = textToCanvas.execute();
    canvas.style.position = "absolute";
    canvas.style.zIndex = 1;
    canvas.style.cursor = "pointer";
    return canvas;
  }

  _createMarker() {
    if ( this._marker ) return;
    var canvasContainer = this._map.map.getCanvasContainer();

    
    this._marker = this._createTextCanvas();

    
    
    this._initMarker();

    canvasContainer.appendChild( this._marker );
  }


};
  