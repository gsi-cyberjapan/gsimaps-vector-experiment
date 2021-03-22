GSIBV.VectorTileData.MapboxLayerGenerator = class {
    constructor() { }
  
    static generate(draw, id) {

      var result = [];
      var type = draw.type;
      var filter = draw.filter;
      var sourceLayer = draw.sourceLayer;
      var paint = draw.paint;
      var layout = draw.layout;
      var metadata = draw.metadata;
      
      if ( !paint && !layout ) return result;

      if ( type == "fill" ) {
        for( var key in paint) {
          if ( key.indexOf("line-") == 0) {
            var paint2 = JSON.parse( JSON.stringify(paint));
            paint2["line-width"] *=2;
            if ( paint2["line-dasharray"]) {
              for( var i=0; i< paint2["line-dasharray"].length; i++ ) {
                paint2["line-dasharray"][i] /= 2;
              }
            }
            result.push( GSIBV.VectorTileData.MapboxLayerGenerator.generateOne(
              draw,id,"line",sourceLayer, filter, paint2,layout) );
            break;
          }
        }
      }

      result.push( GSIBV.VectorTileData.MapboxLayerGenerator.generateOne(
        draw,id, type,sourceLayer, filter, paint,layout) );
      
      for( var i=0; i<result.length; i++ ) {
        for ( var key in metadata ) {
          result[i]["metadata"][key] = metadata[key];
        }
      }

      return result;
    }

    
    static generateOne(draw,id, type, sourceLayer, filter, paint,layout) {
      
      var minzoom = parseFloat(draw.minzoom);
      var maxzoom = parseFloat(draw.maxzoom) + 1;

      var source = draw.source;
      var s = JSON.parse(JSON.stringify( source.mapboxSource ) );
      var sourceId = source.id + "-" + s.minzoom + "-" + s.maxzoom; 
      /*
      var sources = source.mapboxSource;
      var sourceId = source.id;
      var hit  =false;
      for ( var i=0; i<sources.length; i++ ) {

        if ( sources[i].minzoom > minzoom  ) {
          sourceId += "-" + sources[i-1].minzoom + "-" + sources[i-1].maxzoom; 
          hit = true;
          break;
        }
      
      }

      if (!hit) {
        sourceId += "-" + sources[sources.length-1].minzoom + "-" + sources[sources.length-1].maxzoom;
      }
      */

      var result = {
        "metadata": {
          "layer-id": id,
          "title": draw.title,
          "path": draw.path
        },
        "type": type,
        "source": sourceId,
        "source-layer": sourceLayer,
        "minzoom": minzoom,
        "maxzoom": maxzoom,
        "filter": JSON.parse(JSON.stringify(filter))
      }
  
      if (paint != undefined) {
        result.paint = JSON.parse(JSON.stringify(paint));
  
  
        if (result.paint["gsi-fill-hatch-style"] != undefined) {
          result.metadata["gsi-fill-hatch-style"] = result.paint["gsi-fill-hatch-style"];
          result.metadata["fill-color"] = result.paint["fill-color"];
  
          var hatchImageManager = GSIBV.Map.HatchImageManager.instance;
          var fillColor = MA.Color.parse(result.paint["fill-color"]);
          var fillBGColor = MA.Color.parse(result.paint["gsi-fill-hatch-bgcolor"]);
          if (fillColor) {
            result.paint["fill-pattern"]
              = hatchImageManager.getImageId(result.paint["gsi-fill-hatch-style"],
                fillColor.r, fillColor.g, fillColor.b, fillColor.a,
                undefined, fillBGColor
                );
  
            if (result.paint["fill-pattern"])
              delete result.paint["fill-color"];
            else
              delete result.paint["fill-pattern"];
  
          }
        }
  
        var paintType = GSIBV.VectorTileData.PaintType[type];
  
        if (result.paint) {
          for (var key in result.paint) {
            if (paintType[key] == undefined) {
              delete result.paint[key];
            }
          }
        }
      }
  
  
      if (layout != undefined) {
        result.layout = JSON.parse(JSON.stringify(layout));
        var layoutType = GSIBV.VectorTileData.LayoutType[type];
        for (var key in result.layout) {
          if (layoutType[key] == undefined) {
            delete result.layout[key];
          }
        }
        var layoutRequired = GSIBV.VectorTileData.MapboxLayerGenerator.LayoutRequired[type];
        if (layoutRequired) {
          for (var key in layoutRequired) {
            if (result.layout[key] == undefined)
              result.layout[key] = layoutRequired[key];
          }
        }
  
      }
      return result;
    }
  }
  
  
  
  
  
  
  // 必須
  GSIBV.VectorTileData.MapboxLayerGenerator.LayoutRequired = {
    "symbol": {
      "text-font": [
        "NotoSansCJKjp-Regular"
      ],
      "symbol-placement": "point",
      /*
      "icon-pitch-alignment": "map",
      "icon-rotation-alignment": "map",
      "text-pitch-alignment": "viewport",
      "text-rotation-alignment": "viewport",
      */
      "icon-allow-overlap": true,
      "text-keep-upright": true,
      "text-allow-overlap": false,
      "symbol-z-order": "auto",
      "text-max-width": 100/*,
          
          "text-max-width": [ "case",
              ["==",["get", "字列"], 2], 1,
              10
          ],
          "text-rotate" :  [ "case",
              ["==",["get", "字列"], 2], 
              ["*", ["+", ["to-number", ["get","配置角度"]], 90 ], -1],
              ["*", ["to-number", ["get","配置角度"]], -1]
          ],
          "text-anchor": [ "case",
              ["==",["get", "字列"], 2], 
                  [ "case",
                      ["==",["get", "表示位置"], "LC"], "top",
                      "center"
                  ],
              [ "case",
                  ["==",["get", "表示位置"], "LT"], "top-left",
                  ["==",["get", "表示位置"], "CT"], "top",
                  ["==",["get", "表示位置"], "RT"], "top-right",
                  ["==",["get", "表示位置"], "LC"], "left",
                  ["==",["get", "表示位置"], "CC"], "center",
                  ["==",["get", "表示位置"], "RC"], "right",
                  ["==",["get", "表示位置"], "LB"], "bottom-left",
                  ["==",["get", "表示位置"], "CB"], "bottom",
                  ["==",["get", "表示位置"], "RB"], "bottom-right",
                  "center"
              ]
          ]
          */
    }
  };
  
  /*
  "layout"?: {|
      "symbol-placement"?: PropertyValueSpecification<"point" | "line" | "line-center">,
      "symbol-spacing"?: PropertyValueSpecification<number>,
      "symbol-avoid-edges"?: PropertyValueSpecification<boolean>,
      "symbol-z-order"?: PropertyValueSpecification<"viewport-y" | "source">,
      "icon-allow-overlap"?: PropertyValueSpecification<boolean>,
      "icon-ignore-placement"?: PropertyValueSpecification<boolean>,
      "icon-optional"?: PropertyValueSpecification<boolean>,
      "icon-rotation-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
      "icon-size"?: DataDrivenPropertyValueSpecification<number>,
      "icon-text-fit"?: PropertyValueSpecification<"none" | "width" | "height" | "both">,
      "icon-text-fit-padding"?: PropertyValueSpecification<[number, number, number, number]>,
      "icon-image"?: DataDrivenPropertyValueSpecification<string>,
      "icon-rotate"?: DataDrivenPropertyValueSpecification<number>,
      "icon-padding"?: PropertyValueSpecification<number>,
      "icon-keep-upright"?: PropertyValueSpecification<boolean>,
      "icon-offset"?: DataDrivenPropertyValueSpecification<[number, number]>,
      "icon-anchor"?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">,
      "icon-pitch-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
      "text-pitch-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
      "text-rotation-alignment"?: PropertyValueSpecification<"map" | "viewport" | "auto">,
      "text-field"?: DataDrivenPropertyValueSpecification<FormattedSpecification>,
      "text-font"?: DataDrivenPropertyValueSpecification<Array<string>>,
      "text-size"?: DataDrivenPropertyValueSpecification<number>,
      "text-max-width"?: DataDrivenPropertyValueSpecification<number>,
      "text-line-height"?: PropertyValueSpecification<number>,
      "text-letter-spacing"?: DataDrivenPropertyValueSpecification<number>,
      "text-justify"?: DataDrivenPropertyValueSpecification<"left" | "center" | "right">,
      "text-anchor"?: DataDrivenPropertyValueSpecification<"center" | "left" | "right" | "top" | "bottom" | "top-left" | "top-right" | "bottom-left" | "bottom-right">,
      "text-max-angle"?: PropertyValueSpecification<number>,
      "text-rotate"?: DataDrivenPropertyValueSpecification<number>,
      "text-padding"?: PropertyValueSpecification<number>,
      "text-keep-upright"?: PropertyValueSpecification<boolean>,
      "text-transform"?: DataDrivenPropertyValueSpecification<"none" | "uppercase" | "lowercase">,
      "text-offset"?: DataDrivenPropertyValueSpecification<[number, number]>,
      "text-allow-overlap"?: PropertyValueSpecification<boolean>,
      "text-ignore-placement"?: PropertyValueSpecification<boolean>,
      "text-optional"?: PropertyValueSpecification<boolean>,
      "visibility"?: "visible" | "none"
  |},
  "paint"?: {|
      "icon-opacity"?: DataDrivenPropertyValueSpecification<number>,
      "icon-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
      "icon-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
      "icon-halo-width"?: DataDrivenPropertyValueSpecification<number>,
      "icon-halo-blur"?: DataDrivenPropertyValueSpecification<number>,
      "icon-translate"?: PropertyValueSpecification<[number, number]>,
      "icon-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">,
      "text-opacity"?: DataDrivenPropertyValueSpecification<number>,
      "text-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
      "text-halo-color"?: DataDrivenPropertyValueSpecification<ColorSpecification>,
      "text-halo-width"?: DataDrivenPropertyValueSpecification<number>,
      "text-halo-blur"?: DataDrivenPropertyValueSpecification<number>,
      "text-translate"?: PropertyValueSpecification<[number, number]>,
      "text-translate-anchor"?: PropertyValueSpecification<"map" | "viewport">
  |}
  */
  