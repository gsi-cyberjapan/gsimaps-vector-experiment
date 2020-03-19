/*****************************************************************
 * GSIBV.Map.Draw.DivMarker
 * Markerクラス
******************************************************************/
GSIBV.Map.Draw.DivMarker = class extends GSIBV.Map.Draw.MarkerBase{

  constructor() {
    super();
    this._style = new GSIBV.Map.Draw.DivMarker.Style();
  }

  setJSON(json) {
    super.setJSON(json);
  }

  get markerType() {
    return GSIBV.Map.Draw.DivMarker.MarkerType;
  }

  get size() {

    var div = MA.DOM.create("div");
    div.style.whiteSpace = "nowrap";
    div.style.visibility = "hidden";
    div.style.position = "absolute";
    div.innerHTML = this._style._makeHTML();

    document.body.appendChild(div);

    var size = MA.DOM.size(div);
    document.body.removeChild(div);

    return size;
  }

  getFrameBounds( map, padding) {
    if ( !padding) padding = 0;

    var size = this.size;

    
    var latlng = this._coordinates.position;
    var centerPos = map.project(latlng);
    
    padding += 20;

    var minX = centerPos.x;// - Math.ceil( size.width / 2 );
    var minY = centerPos.y; // - Math.ceil( size.height / 2 );
    var maxX = centerPos.x + Math.ceil(size.width); //+ Math.ceil( size.width / 2 );
    var maxY = centerPos.y + Math.ceil( size.height ); // + Math.ceil( size.height / 2 );


    var result = {
      left : Math.floor( minX - padding ),
      top : Math.floor( minY - padding ),
      right : Math.ceil( maxX + padding ),
      bottom : Math.ceil( maxY + padding )
    };
    result.width = result.right - result.left;
    result.height = result.bottom - result.top;
    return result;
  }
  
  _addMapboxStyleToHash(hash) {
    
    super._addMapboxStyleToHash(hash);
    if ( this._style.text )
      hash["_text"] = this._style.text;
    
      
    if ( this._style.fontSize ) {
      hash["_textSize"] = this._style.fontSize;
    }

    if ( this._style.color ) {
      hash["_color"] =this._style.color;
    }

    if ( this._style.backgroundColor ) {
      hash["_backgroundColor"] =this._style.backgroundColor;
    }
    
    hash["_italic"] =this._style.italic;
    hash["_bold"] =this._style.bold;
    hash["_underline"] =this._style.underLine;

  }
  
};

GSIBV.Map.Draw.DivMarker.MarkerType = "DivIcon";



/*****************************************************************
 * GSIBV.Map.Draw.DivMarker.Style
 * DivMarkerスタイルクラス
******************************************************************/
GSIBV.Map.Draw.DivMarker.Style = class extends GSIBV.Map.Draw.Feature.Style{

  constructor() {
    super();


  }


  copyFrom(from) {
    super.copyFrom(from);
    if ( !from ) return;
    this._text = from._text;
  
    this._fontSize = from._fontSize;
    this._italic = from._italic; 
    this._bold = from._bold; 
    this._underLine = from._underLine;
    this._color = from._color;
    this._backgroundColor = from._backgroundColor;
  }

  clear() {
    super.clear();

    
    this._fontSize = undefined;
    this._italic = false; 
    this._bold = false; 
    this._underLine = false;
    this._color = undefined;
    this._backgroundColor = undefined;

  }

  setJSON(properties) {
    
    super.setJSON(properties);

    var html = properties["_html"];

    if ( !html ) {
      this.clear();
      return;
    }

    var div = MA.DOM.create("div");
    div.innerHTML = html.replace(/\<br[\s]*[\/]*\>/ig,"\n");
    this._text = div.firstChild.innerText;
    
    if ( !this._text || this._text== "") {
      this._text = div.innerText;
    }
    if ( this._text == undefined) this._text = "";

    
    var getStyle = function(text,key) {
      var m= text.match(key);
      if ( m && m.length >= 2) return m[1];
      return undefined;
    };

    var fontWeight = getStyle( html, /font-weight:([^;|^\s|^>]+)/i);
    var fontStyle = getStyle( html, /font-style:([^;|^\s|^>]+)/i);
    var textDecoration = getStyle( html, /text-decoration:([^;|^\s|^>]+)/i);
    var color = getStyle( html, /color:([^;|^\s|^>]+)/i);
    var background = getStyle( html, /background-color:([^;|^\s|^>]+)/i);
    if ( !background ) background = getStyle( html, /background:([^;|^\s|^>]+)/i);
    var fontSize = getStyle( html, /font-size:([^;|^\s|^>]+)/i);
    
    if ( fontStyle && fontStyle.match(/italic/i)) {
      this.italic = true;
    }
    
    if ( textDecoration && textDecoration.match(/underline/i)) {
      this.underLine = true;
    }

    if ( fontWeight && fontWeight.match(/bold/i)) {
      this.bold = true;
    } else if ( fontWeight && fontWeight.match(/^([1-9]\d*|0)$/i)) {
      if ( parseInt(fontWeight) >= 700) {
        this.bold = true;
      }
    }


    if ( fontSize ) {
      this.fontSize = fontSize;
    }

    if ( color ) {
      this.color = color;
    }

    if ( background ) {
      this.backgroundColor = background;
    }
  }
  
  _makeHTML() {
    
    var style = {};

    if ( this._fontSize) style["font-size"] = this._fontSize + "pt";
    if ( this.italic) style["font-style"] = "italic";
    if ( this.bold) style["font-weight"] = "bold";
    if ( this.underLine) style["text-decoration"] = "underline";
    if ( this.color) style["color"] = this.color;
    if ( this.backgroundColor) style["background-color"] = this.backgroundColor;
    
    var text = this._text;
    if ( !text) text = "";
    text = text.replace(/\n/g, "<br>");
    
    var html ='<div style="';
    for( var key in style) {
      html += key + ":" + style[key] + ";";
    }

    html += '">'
    html += text + "</div>"
    return html;
  }

  _getHash() {
    var hash = super._getHash();

    hash["_markerType"] = GSIBV.Map.Draw.DivMarker.MarkerType;
    hash["_html"] = this._makeHTML();

    return hash;
  }
  
  get text() { return this._text;}
  get fontSize() { return this._fontSize;}
  get italic() { return this._italic;}
  get bold() { return this._bold;}
  get underLine() { return this._underLine;}
  get color() { return this._color;}
  get backgroundColor() { return this._backgroundColor;}

  get fontSizePx() {
    return Math.round( this._fontSize * 1.33 );
  }
  set text( value ) {
    this._text = value;
  }

  set fontSize( value ) {
    if ( value == undefined) {
      this._fontSize = undefined;
    }

    if ( MA.isString(value )) {
      if ( value.match(/^([1-9]\d*|0)(\.\d+)?/) ) {
        this._fontSize = parseFloat(value);
        
        if ( value.match(/px/) ) {
          this._fontSize = Math.round( this._fontSize/ 1.33 );
        }

      } else {
        this._fontSize = undefined;
      }
    } else {
      this._fontSize = parseFloat( value);
    }
  }
  set italic( value ) {
    this._italic = ( value ? true:false );
  }
  set bold( value ) {
    this._bold =  ( value ? true:false );
  }
  set underLine( value ) {
    this._underLine =  ( value ? true:false );
  }

  set color( value ) {
    this._color = value;
  }
  set backgroundColor( value ) {
    this._backgroundColor = value;
  }
};