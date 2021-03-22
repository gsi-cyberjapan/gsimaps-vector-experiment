
GSIBV.UI.Dialog.Dsloret = class extends GSIBV.UI.Dialog.Alert {


  constructor() {
    super();
    this._dialogs = [];
    this._frameClass = ["dsloret"];
    this._autoDestroy =true;
    this._hideAroundClick = true;
  }

  show( data) {
    this._title = data.title;
    this._msg = MA.DOM.create("div");
    MA.DOM.addClass( this._msg, "message" );

    var outerTable = MA.DOM.create("table");
    this._outerTable = outerTable;
    MA.DOM.addClass( outerTable, "outer" );

    this._topImageTr = MA.DOM.create("tr");
    this._topImageTd = MA.DOM.create("td");
    this._topImageTd.setAttribute("colspan",2);
    this._topImageTr.appendChild(this._topImageTd);

    var tr = MA.DOM.create("tr");
    var td = MA.DOM.create("td");
    var table = this._createInfoTable(data.list);
    this._infoTable = table;
    td.appendChild(table);

    if ( data.id ) {
      var idDiv = MA.DOM.create("div");
      idDiv.style.fontSize = "10.5pt";
      idDiv.innerHTML ="ID:" +  data.id;
      td.appendChild(idDiv)
    }

    tr.appendChild(td);

    this._rightImageTd = MA.DOM.create("td");
    tr.appendChild(this._rightImageTd);

    outerTable.append( this._topImageTr );
    outerTable.append( tr );
    this._msg.appendChild(outerTable);

    if ( data.images && data.images.length > 0 ) {    
      this._img = MA.DOM.create("img");
      /*
      this._img.onload = MA.bind( function(){
        this._img._loaded = true;
        this._img._origSize = {
          width : this._img.width,
          height : this._img.height
        };
        this._refresh();
      },this);
      */
      MA.DOM.on( this._img, "load", MA.bind( function(img){
        this._img._loaded = true;
        this._imageWidth = img.width;
        this._imageHeight = img.height;
        this._refresh();
      },this, this._img ) );
      this._imageWidth = undefined;
      this._imageHeight = undefined;
      this._img.src = data.images[0].src;
    }
    
    this._buttons = undefined;
    super.show(this._title,this._msg, this._buttons);
    
    if ( !this._windowResizeHandler ) {
      this._windowResizeHandler = MA.bind( this._onWindowResize, this );
      MA.DOM.on(window,"resize", this._windowResizeHandler);
    }
  }

  _createInfoTable(list) {
    var table = MA.DOM.create("table");
    MA.DOM.addClass( table, "inner" );
    var tbody = MA.DOM.create("tbody");

    var tr = MA.DOM.create("tr");
    var th = MA.DOM.create("th");
    MA.DOM.addClass(th, "table-header");
    th.setAttribute("colspan", 2);
    th.innerHTML="概要";
    tr.appendChild(th);
    tbody.appendChild(tr);


    for( var i=0; i<list.length; i++ ) {
      var item = list[i];
      if ( item["type"] == "image") {
        continue;
      }
      tr = MA.DOM.create("tr");
      th = MA.DOM.create("th");
      var td = MA.DOM.create("td");

      th.innerHTML = item.title;
      td.innerHTML = item.content;

      tr.appendChild(th);
      tr.appendChild(td);
      tbody.appendChild(tr);
    }

    table.appendChild(tbody);

    return table;
  }

  _onWindowResize() {
    this._refresh();
  }

  hide() {
    super.hide();
    
    if ( this._windowResizeHandler ) {
      MA.DOM.off(window,"resize", this._windowResizeHandler);
      this._windowResizeHandler = null;
    }
  }
  
  _beforeShow() {

    
    this._frame.style.visibility = 'hidden';
    this._frame.style.display = '';
    this._refresh();
    this._frame.style.display = 'none';
    this._frame.style.visibility = 'visible';


  }

  _refresh() {
    if ( !this._img._loaded ) return;

    
    var headerSize = MA.DOM.size(this._header);

    this._contentsFrame.style.top = headerSize.height + "px";

    
    if ( !this._img._loaded ) {
      this._adjustPosition();
      return;
    }

    var windowSize = MA.DOM.size(document.body);
    var tableSize = MA.DOM.size( this._outerTable );
    var rightTdSize = MA.DOM.size( this._rightImageTd );
    var infoTableSize = MA.DOM.size( this._infoTable );
    
    if ( this._img.parentNode ) {
      this._img.parentNode.removeChild( this._img );
    }
    
    if ( windowSize.width >= windowSize.height ) {
      this._infoTable .style.maxWidth = "280px";
      var maxImageWidth = Math.round( windowSize.width * (windowSize.width <800 ? 0.9 : 0.7 ) ) - 300;
      var maxImageHeight = Math.round( windowSize.height * 0.7 );
      
      var imageWidth = maxImageWidth;
      if ( imageWidth > this._imageWidth ) {
        imageWidth = this._imageWidth;
      }

      var imageHeight = Math.floor( this._imageHeight * ( imageWidth / this._imageWidth) );


      
      if ( imageHeight > maxImageHeight) {
        imageHeight = maxImageHeight;
        imageWidth = Math.floor( this._imageWidth * ( imageHeight / this._imageHeight) );
      }

      this._img.style.width = imageWidth + "px";
      this._img.style.height = imageHeight + "px";
      this._img.style.marginLeft = "4px";
      this._img.style.marginBottom = "0px";
      this._rightImageTd.append( this._img );
      
      var frameSize = {
        height : 0
      };
      if ( imageHeight > infoTableSize.height ) {
        frameSize.height = imageHeight + headerSize.height + 30;
      } else {
        frameSize.height = infoTableSize.height + headerSize.height + 40;
      }

      this._adjustPosition(
        imageWidth + 300,
        frameSize.height);
    } else {
      this._infoTable .style.maxWidth = "100%";
      this._img.style.marginLeft = "0px";
      this._img.style.marginBottom = "4px";
      this._img.style.width = "100%";
      this._img.style.height = "auto";
      this._topImageTd.append( this._img );
      this._adjustPosition();
    }

    //this._frame.style.height = (size.height + headerSize.height + 24) + "px";


  }

  _adjustPosition(w,h) {

    var headerSize = MA.DOM.size(this._header);
    this._contentsFrame.style.top = headerSize.height + "px";

    var windowSize = MA.DOM.size(document.body);
    var tableSize = MA.DOM.size( this._outerTable );

  
    this._frame.style.height = ( h ? h : (tableSize.height + headerSize.height + 25 ) ) + "px";
    this._frame.style.width =  ( w ? w :Math.round( windowSize.width * 0.8 ) ) + "px";

    var frameSize = MA.DOM.size(this._frame);
    this._frame.style.marginLeft = -Math.round(frameSize.width / 2) + "px";
    this._frame.style.marginTop = -Math.round(frameSize.height / 2) + "px";
  }

  _createHeader(headerContainer) {
    super._createHeader(headerContainer);
    headerContainer.style.textAlign = "center";
    headerContainer.style.padding = "0.4em";
    headerContainer.style.fontSize = "14px";
    headerContainer.style.fontWeight = "bold";
    
  }

  _createContents(contentsContainer) {
    if (!this._msg) return;

    if (typeof this._msg == "string") {
      this._contents.innerHTML = this._msg;
    } else {
      this._contents.appendChild(this._msg);
    }

  }
};