/***************************************
    GSIBV.UI.RecommendSelector
    おすすめ管理
***************************************/
GSIBV.UI.RecommendSelector = class extends GSIBV.UI.Base {
  constructor(options) {
    super(options);
    this._options = options;
    this.initialize();
    
    this._onLangChange();
    GSIBV.application.on("langchange", MA.bind( this._onLangChange, this ) );
  }
  
  _onLangChange() {
    
    if ( !this._liHash ) return;
    for( var key in this._liHash) {
      var li = this._liHash[key].li;
      var layerInfo = this._liHash[key].layerInfo;
      MA.DOM.find(li, ".title")[0].innerHTML = layerInfo.getTitle(); //layerInfo.title;
    }
  }

  set map(map) {
    this._map = map;
    this._layerList = this._map.layerList;
    this.refreshState();

    this._map.on("change", MA.bind(this._onLayerListChange, this));
    this._layerList.on("change", MA.bind(this._onLayerListChange, this));
  }

  get layerInfoList() {
    return this._layerInfoList;
  }

  findById(id) {

    for (var i = 0; i < this._layerInfoList.length; i++) {
      var child = this._layerInfoList.get(i);
      if (child.id == id) return child;
      else if (child.isDirectory) {
        return _findId._find(child, id);
      } else if ( child.type=="layerset") {

        for( var j=0;j<child.layers.length; j++ ) {
          if ( child.layers[j].id == id ) return child.layers[j];
        }
      }
    }

    return null;

  }

  initialize() {

    //this._data = [];
    this._layerInfoList = new GSIBV.LayerDirectoryInfo();
    this._layerInfoList._title = "おすすめの地図";
    for (var i = 0; i < this._options.data.length; i++) {
      this._layerInfoList.add(
        new GSIBV.UI.RecommendSelector.LayerInfo(this._layerInfoList, this._options.data[i])
      );
      //this._data.push( new GSIBV.UI.RecommendSelector.LayerInfo(this._options.data[i]) );
    }

    if (typeof this._options.container == "string") {
      this._container = MA.DOM.select(this._options.container)[0];
    }
    else {
      this._container = this._options.container;
    }


    try {
      this._listScrollBar = new PerfectScrollbar(MA.DOM.find(this._container, ".list")[0]);
    } catch (e) { }


    this._ulElement = MA.DOM.find(this._container, ".list ul")[0];
    this._liTemplate = MA.DOM.find(this._ulElement, 'li')[0].cloneNode(true);

    this.refreshList();
  }


  refreshList() {
    this._ulElement.innerHTML = '';
    this._liHash = {};
    for (var i = 0; i < this._layerInfoList.length; i++) {
      var layerInfo = this._layerInfoList.get(i);
      var li = this._liTemplate.cloneNode(true);

      var img = MA.DOM.find(li, "img")[0];
      img.src = layerInfo.thumbnail;
      MA.DOM.find(li, ".title")[0].innerHTML = layerInfo.title;
      /*
          var img = MA.DOM.find(li, "img")[0];
          var label = MA.DOM.find(li, "label")[0];
          var check = MA.DOM.find(li, "input[type=checkbox]")[0];
          img.src = layerInfo.thumbnail;
          label.innerHTML = layerInfo.title;

          var id = '__recommend__item__id__' + i;
          check.setAttribute( 'id', id );
          label.setAttribute( 'for', id );
      */
      this._ulElement.appendChild(li);

      this._liHash[layerInfo.id] = { "layerInfo": layerInfo, "li": li };

      //check._layerInfo = layerInfo;
      //MA.DOM.find(li, "a")[0].setAttribute('title', 
      //  layerInfo.description ? layerInfo.description : layerInfo.title);
      GSIBV.application.tooltipManager.add( MA.DOM.find(li, "a")[0],
          layerInfo.description ? layerInfo.description : layerInfo.title );
      //MA.DOM.find(li, "a")[0].title = layerInfo.description ? layerInfo.description : layerInfo.title;

      MA.DOM.on(MA.DOM.find(li, "a")[0], "click", MA.bind(this._onClick, this, li, layerInfo));

    }
    this.refreshState();

    if (this._listScrollBar) this._listScrollBar.update();
  }
  refreshState() {
    if (!this._layerList) return;
    
    for (var id in this._liHash) {
      var li = this._liHash[id].li;
      var layerInfo = this._liHash[id].layerInfo;
      
      if ( layerInfo.layers && layerInfo.layers.length > 0 )  {

        var hit = true;
        for( var i=0; i<layerInfo.layers.length; i++ ) {
          
          var layer = this._layerList.find(layerInfo.layers[i].id);
          if ( !layer ) {
            hit = false;
            break;
          }
        }

        if (hit) { 
          MA.DOM.addClass(li, "-ma-selected");
          if (layer.visible) {
            MA.DOM.removeClass(li, "-ma-hidden");
          } else {
            MA.DOM.addClass(li, "-ma-hidden");
          }
        } else {
          MA.DOM.removeClass(li, "-ma-selected");
        }

      } else {
          
        var layer = this._layerList.find(id);
        if (layer) {
          //MA.DOM.find(li, "input[type=checkbox]")[0].checked = true;   
          MA.DOM.addClass(li, "-ma-selected");
          if (layer.visible) {
            MA.DOM.removeClass(li, "-ma-hidden");
          } else {
            MA.DOM.addClass(li, "-ma-hidden");
          }
        } else {
          MA.DOM.removeClass(li, "-ma-selected");
          //MA.DOM.find(li, "input[type=checkbox]")[0].checked = false;
        }
      }
    }


  }
  _onLayerListChange() {
    this.refreshState();
  }

  _onClick(li, layerInfo) {
    
    // 全て消す
    var visible = MA.DOM.hasClass(li, "-ma-selected");
    for (var id in this._liHash) {
      if (MA.DOM.hasClass(this._liHash[id].li, "-ma-selected")) {
        MA.DOM.removeClass(this._liHash[id].li, "-ma-selected");
        if ( this._liHash[id].layerInfo.layers && this._liHash[id].layerInfo.layers.length > 0 )  {
              
          for( var i=0; i<this._liHash[id].layerInfo.layers.length; i++ ) {
            
            this.fire("change", {
              "layerInfo": this._liHash[id].layerInfo.layers[i],
              "visible": false
            });
          }
        } else {
          this.fire("change", {
            "layerInfo": this._liHash[id].layerInfo,
            "visible": false
          });
        }
      }
    }

    if (visible) {
      MA.DOM.removeClass(li, "-ma-selected");
    } else {
      MA.DOM.addClass(li, "-ma-selected");
    }

    if ( layerInfo.layers && layerInfo.layers.length > 0 )  {
      for( var i=0; i<layerInfo.layers.length; i++ ) {
        this.fire("change", {
          "layerInfo": layerInfo.layers[i],
          "visible": !visible
        });
      }
    } else {
    
      this.fire("change", {
        "layerInfo": layerInfo,
        "visible": !visible
      });
    }
  }

  _onChange(check) {

    this.fire("change", {
      "layerInfo": check._layerInfo,
      "visible": check.checked
    });
  }

}

GSIBV.UI.RecommendSelector.LayerInfo = class extends GSIBV.LayerInfo {
  constructor(parent, data) {
    super(parent);
    this._id = data.id;
    this._title = data.title;
    this._thumbnaile = data.thumbnail;
    this._type = data.type;
    this._url = data.url;
    this._html = data.html;
    this._description = data.description;
    this._legendUrl = data.legendUrl;
    this._minZoom = data.minZoom;
    this._maxNativeZoom = data.maxNativeZoom;
    this._layers = [];

    if ( data.layers ) {
      for( var i=0; i<data.layers.length ; i++) {
        this._layers.push( new GSIBV.UI.RecommendSelector.LayerInfo( this, data.layers[i]) );
      }
    }

  }

  get thumbnail() { return this._thumbnaile; }
  get type() { return this._type; }
  get description() { return this._description; }
  get layers() { return this._layers;}
  get entries() { return this._layers;}
}