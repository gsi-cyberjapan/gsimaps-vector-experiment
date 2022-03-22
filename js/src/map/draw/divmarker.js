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
    if(json.properties._html) {
      this._style.fileHtml = json.properties._html;
      this._style.keepFileHtml();
    }
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
    hash["_text"] = "";
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
    this._text = "";
    this._html = "";
    this._fileHtml = null;
    this._oriFileHtml = null;
    this._fontSize = 9.5;
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
    this._fileHtml = from._fileHtml;
    this.keepFileHtml();
  }

  clear() {
    super.clear();

    this._fontSize = 9.5;
    this._italic = false; 
    this._bold = false; 
    this._underLine = false;
    this._color = undefined;
    this._backgroundColor = undefined;
    this._fileHtml = null;

  }

  setJSON(properties) {
    super.setJSON(properties);

    var html = properties["_html"];
    if(!html) {
      this.clear();
      return;
    }

    html = html == '' ? ' ' : html;
    var $html = $.parseHTML(html);
    if ( $html[0].nodeType == 3 ) {
			$html = $('<div></div>').append(html);
		} else {
			$html = $(html);
		}
    if (html == ' ') {
      this.clear();
      return;
    }

    this._text = $html.text();
    var htmlColor = $html.css('color') || '#000';
    this.color = MA.Color.toHTMLHex(MA.Color.parse(htmlColor));
    var htmlBgColor = $html.css('background-color') || $html.css('background');
    this.backgroundColor = htmlBgColor? MA.Color.toHTMLHex(MA.Color.parse(htmlBgColor)):"transparent";
    this.fontSize = $html.css('font-size') || "9.5pt";

    var getStyle = function(text,key) {
      var m= text.match(key);
      if ( m && m.length >= 2) return m[1];
      return undefined;
    };
    var fontWeight = getStyle( html, /font-weight:([^;|^\s|^>]+)/i);
    var fontStyle = getStyle( html, /font-style:([^;|^\s|^>]+)/i);
    var textDecoration = getStyle( html, /text-decoration:([^;|^\s|^>]+)/i);
    //var fontSize = getStyle( html, /font-size:([^;|^\s|^>]+)/i);
    this.italic = fontStyle && fontStyle.match(/italic/i);
    this.underLine = textDecoration && textDecoration.match(/underline/i);
    this.bold = false;
    if ( fontWeight && fontWeight.match(/bold/i)) {
      this.bold = true;
    } else if ( fontWeight && fontWeight.match(/^([1-9]\d*|0)$/i)) {
      if ( parseInt(fontWeight) >= 700) {
        this.bold = true;
      }
    }
  }

  updateFileHtml(){
    if(!this._fileHtml) return;

    var htmlText = this._text;
    var $fileHtml = $(this._fileHtml);
    if($fileHtml.prop('nodeName') != "DIV" && !$fileHtml.find("div").html()) {
      htmlText = this._fileHtml;
      this._fileHtml = $('<div></div>').append(this._fileHtml);
    }

    if(htmlText) this._fileHtml = this._fileHtml.replace(/\>(.*)<\/div\>/g, "\>" + htmlText.replace(/(\r\n|\n|\r)$/gm, "") + '<\/div>'); 
    var _htmlStyle = "";
    if(this._fontSize) _htmlStyle += "font-size:" + this._fontSize + "pt;";
    if(this._color) _htmlStyle += "color:" + this._color + ";";
    if(this._backgroundColor) _htmlStyle += "background-color:" + this._backgroundColor + ";";
    if(this._bold) _htmlStyle += "font-weight:bold;";
    if(this.italic) _htmlStyle += "font-style:italic;";
    if(this.underLine) _htmlStyle += "text-decoration:underline;";
    this._fileHtml = this._fileHtml.replace(/<div(\s+style\s?=\s?\".*?\")?>/g, "<div style=\"" + _htmlStyle + "\">");
  }
  
  _makeHTML() {
    if(this._fileHtml) return this._fileHtml;

    var style = {};

    if ( this._fontSize) style["font-size"] = this._fontSize + "pt";
    if ( this.italic) style["font-style"] = "italic";
    if ( this.bold) style["font-weight"] = "bold";
    if ( this.underLine) style["text-decoration"] = "underline";
    if ( this.color) style["color"] = this.color;
    if ( this.backgroundColor) style["background-color"] = this.backgroundColor;
    
    var text = this._text;
    if ( !text) text = "";
    text = text.replace(/\n/g, "\n<br>");
    
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
  
  get styleValueStr() {
    var json = {};
    if(this._text) json.text = this._text;
    if(this._fontSize) json.fontSize = this._fontSize;
    if(this._color) json.color = this._color;
    if(this._bgcolor) json.bgcolor = this._bgcolor;
    if(this._bold) json.bold = this._bold;
    if(this._italic) json.italic = this._italic;
    if(this._underline) json.underline = this._underline;
    return JSON.stringify(json);
  }
  get text() { return this._text;}
  get html() { return this._html;}
  get fileHtml() { return this._fileHtml;}
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
  set html( value ) {
    this._html = value;
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
      this._fontSize = parseFloat(value);
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
  set fileHtml(value){
    this._fileHtml = value;
  }

  keepFileHtml(){
    this._oriFileHtml = this._fileHtml;
  }

  recoverFileHtml(){
    this._fileHtml = this._oriFileHtml;
  }
};