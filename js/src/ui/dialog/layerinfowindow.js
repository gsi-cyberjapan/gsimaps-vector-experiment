
GSIBV.UI.Dialog.LayerInfoWindow = class extends GSIBV.UI.Base {


  constructor(options) {
    super(options);
    this._options = options;
    this.eventList = [];
    this._contentsCache = [];
  }

  show(item, position) {
    this._create();
    this.clear();
    this._item = item;

    this._createContents();

    this._container.style.left = "0px";
    this._container.style.top = "0px";
    this._container.style.width = "auto";
    this._container.style.visibility = 'hidden';
    this._container.style.display = 'block';
    var size = MA.DOM.size(this._container);

    var windowSize = MA.DOM.size(this._container.parentNode);
    
    if ( position.left + size.width > windowSize.width) {
      position.left = windowSize.width -size.width;
    }

    if ( position.top + size.height > windowSize.height) {
      position.top = windowSize.height -size.height;
    }

    this._container.style.width = size.width + "px";
    this._container.style.display = 'none';
    this._container.style.visibility = 'visible';

    this._container.style.left = position.left + "px";
    this._container.style.top = position.top + "px";
    this._container.style.display = 'block';
    this._restoreContentsStatus();
    MA.DOM.fadeIn(this._container, 300);
    this._initMouseDownHandler();
    this._initEventListHandlers();
  }
  _createContents(){
    var html = '';
    if (this._item.html) {
      html = this._item.html;
    }
    if (this._item.legendUrl) {
      html += '<div><a target="_blank" href="' + this._item.legendUrl + '">凡例を表示</a></div>';
    }

    if (html == '') return;

    if(this._item.id=='pp'){
      if( this._item instanceof GSIBV.Map.Layer.TileGeoJSON){
        html = html.replace(/(onchange=")([a-zA-Z0-9:;\.\s\(\)\-\,]*)(")/gi, '');
        this._item.setFeaturesFilter(
          MA.bind((features)=>{
            var dropDownList = this._content.querySelector("select");
            var value = dropDownList.options[dropDownList.selectedIndex].value;
            return features.filter((feature)=>{
              return !value || value == 'ppall' || value == feature.properties['_className'];
            })
          }, this)
        );
        this.eventList.push(["select","change", (evet)=> this._item.fire("update")]);
      } 
      //else {
      //html=html.substring(0,html.indexOf("<br>"))+html.substring(html.indexOf("</form>")+7,html.length-1);
      //}
    }

    this._content.innerHTML = html;

    if ( this._item.id=="relief_free")
      this._content.appendChild(GSIBV.Map.Layer.FreeRelief.DataManager.instance.getImage(true));
    
  }
  _saveContentsStatus(){
    if(this._item.id=='pp' && this._item instanceof GSIBV.Map.Layer.TileGeoJSON){
      this._contentsCache[this._item.id] = this._content.querySelector("select").selectedIndex;
    }
  }
  _restoreContentsStatus(){
    if(this._item.id=='pp' && this._item instanceof GSIBV.Map.Layer.TileGeoJSON){
      this._content.querySelector("select").selectedIndex = this._contentsCache[this._item.id];
    }
  }
  _create() {
    if ( this._container)return;
    this._container = MA.DOM.create("div");
    MA.DOM.addClass( this._container, "-gsibv-layerinfowindow" );
    this._content = MA.DOM.create("div");
    MA.DOM.addClass( this._content, "-gsibv-layerinfowindow-content" );

    this._container.appendChild( this._content);
    document.body.appendChild( this._container);
  }

  clear() {
    if ( !this._container ) return;
    this._content.innerHTML = "";
  }
  _initEventListHandlers() {
    if (this.eventList.length > 0) {
      for(var eventDefinde of this.eventList){
        MA.DOM.on( MA.DOM.find(this._content,eventDefinde[0]), eventDefinde[1], MA.bind( eventDefinde[2], this ) );
      }
    }
  }
  _destroyEventListHandlers() {
    if (this.eventList.length > 0) {
      for(var eventDefinde of this.eventList){
        MA.DOM.off( MA.DOM.find(this._content,eventDefinde[0]), eventDefinde[1], MA.bind( eventDefinde[2], this ) );
      }
    }
  }
  _onBodyMouseDown(e) {
    if (e.type != "ps-scroll-y") {
      var target = e.target;

      while (target) {
        if (target == this._container) {
          return;
        }
        target = target.parentNode;
      }
    }
    this.hide();
  }
  _initMouseDownHandler() {
    if (!this._bodyMouseDownHandler) {
      this._bodyMouseDownHandler =  MA.bind( this._onBodyMouseDown, this );
      MA.DOM.on(document.body, "mousedown", this._bodyMouseDownHandler);
    }
  }


  _destroyMouseDownHandler() {
    if (this._bodyMouseDownHandler) {
      MA.DOM.off(document.body, "mousedown", this._bodyMouseDownHandler);
      this._bodyMouseDownHandler =  null;
    }
  }

  hide() {
    this._destroyEventListHandlers();
    this._destroyMouseDownHandler();
    if ( !this._container ) return;

    this._saveContentsStatus();
    //this._container.style.display = 'none';
    MA.DOM.fadeOut(this._container, 300);
  }

};
