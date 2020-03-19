GSIBV.LocalFileLoader = class extends MA.Class.Base {
  
  constructor( files ) {
    super();
    this._files = files;
  }

  load() {
    this._queue = [];
    for( var i=0;i<this._files.length; i++) {
      var reader = new FileReader();
      var fileName = decodeURIComponent(this._files[i].name);
      var queItem = { "no" : i, "reader": reader, "file": this._files[i], "fileName": fileName };
      reader.addEventListener( "load", MA.bind( this._onLoad, this, queItem ) );
      reader.addEventListener( "error", MA.bind( this._onError, this, queItem ) );
      
      this._queue.push( queItem );
    }
    
    if( this._queue.length <= 0 ) {
      return;
    }

    for( var i=0; i<this._queue.length; i++ ) {
      this._queue[i].reader.readAsArrayBuffer(this._queue[i].file);
    }

  }

  _fireLoad () {

    for( var i=0; i<this._queue.length; i++ ) {
      if( !this._queue[i].loaded) {
        return;
      }
    }

    this.fire("load", {"list": this._queue } )
  }

  _onError( queItem ) {
    queItem.error = true;
    queItem.loaded = true;
    this._fireLoad();
  }

  _onLoad(queItem) {

    if (queItem.reader.readyState != FileReader.DONE) return;

    queItem.error = false;
    queItem.loaded = true;

    this._fireLoad();
  }

};