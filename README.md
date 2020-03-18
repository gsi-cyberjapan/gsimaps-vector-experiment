# 地理院地図Vector（仮称）提供実験

## ベクトルタイルの仕様
本提供実験によるベクトルタイルは、[地理院タイル（ラスタ）](http://maps.gsi.go.jp/development/siyou.html)と同じ方式で配信します。
`https://cyberjapandata.gsi.go.jp/xyz/{t}/{z}/{x}/{y}.{ext}`

* 本提供実験によるベクトルタイルは、タイルに分割した[Vector tile specification](https://github.com/mapbox/vector-tile-spec)形式のファイル群。
* 拡張子は「pbf」。

### ズームレベルについて
本提供実験によるベクトルタイルにおけるズームレベル（{z}）は、現在「地理院地図」で提供している地理院タイル（ラスタ）（ https://maps.gsi.go.jp/development/ichiran.html ）のズームレベルと同一ではありません。

画面上で同じ大きさで表示される際のズームレベルは、ベクトルタイルにおける数値が、地理院タイル（ラスタ）のズームレベルと比べて1小さい数値となります。そのため、ベクトルタイルにおけるズームレベル11のデータは、ズームレベルが12の地理院タイル（ラスタ）と同じデータを用いて作成しています。

また、ベクトルタイルにおいて画面に表示されるタイルの大きさは、地理院タイル（ラスタ）でズームレベルが1大きい（大きさが小さい）タイルの4枚分に相当します。

<table>
	<tr><th colspan="2">対応するズームレベルの範囲</th></tr>
	<tr><th>本実験で提供するベクトルタイル</th><th>地理院タイル（ラスタ）</th></tr>
	<tr><td>4～7</td><td>5～8</td></tr>
	<tr><td>8～10</td><td>9～11</td></tr>
	<tr><td>11～13</td><td>12～14</td></tr>
	<tr><td>14～16</td><td>15～17</td></tr>
	<tr><td>17</td><td>18</td></tr>
</table>

## タイル一覧
提供実験中のデータであるため、URL やデータ構成、データの内容（属性の有無や名称等）が変わる可能性があります。

<table>
	<tr><th>URL</th><td>https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf</tr>
	<tr><th class="titletd">データソース</td><td>数値地図（国土基本情報）- 地図情報　等</td></tr>
	<th>ズームレベル</td><td>4～16<br>
	※ズームレベル17の情報は、ズームレベル16に含んだうえでオーバーズームして表示</td></tr>
	<tr><th>提供開始日</td><td>2019年7月29日（関東の一部地域）<br>2020年3月19日（全国）</td></tr>
	<th>データ更新情報</td><td>2020年1月1日時点<br>
	※最新の状況が反映されていない場合があります。</td></tr>
	<tr><th colspan="2"><a href="https://maps.gsi.go.jp/vector/" class="blank">地理院地図Vectorで表示</a></td></tr>
</table>

### 属性等の仕様詳細
* [地物コード及び表示ズームレベル一覧](https://maps.gsi.go.jp/help/pdf/vector/dataspec.pdf)
* [地物等の属性一覧](https://maps.gsi.go.jp/help/pdf/vector/attribute.pdf)

## style.json
* 地図のデザインを規定しているファイル。[Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)をベースにしたうえで、若干の拡張を施しています。
* 2020年3月19日現在の地理院地図Vector「おすすめの地図」から閲覧できるstyle.jsonは以下表のとおりです。
* 以下表のリンクを右クリックし、「名前をつけて保存」からダウンロードすることができます。
* 保存したファイルは、地理院地図Vectorの「地図デザインの追加」-「地図デザインファイルを開く」から読み込むこともできます。
<table>
	<tr>
		<td><a href="https://maps.gsi.go.jp/vector/data/std.json">標準地図</a></td>
		<td><a href="https://maps.gsi.go.jp/vector/data/pale.json">淡色地図</a></td>
		<td><a href="https://maps.gsi.go.jp/vector/data/blank.json">白地図</a></td>
	</tr>
	<tr>
		<td></td>
		<td><a href="https://maps.gsi.go.jp/vector/data/label.json">写真＋注記の注記</a></td>
		<td><a href="https://maps.gsi.go.jp/vector/data/llabel.json">大きい注記の地図</a></td>
	</tr>
	<tr>
		<td><a href="https://maps.gsi.go.jp/vector/data/std2.json">標準地図2</a></td>
		<td><a href="https://maps.gsi.go.jp/vector/data/pale2.json">淡色地図2</a></td>
		<td><a href="https://maps.gsi.go.jp/vector/data/blank2.json">白地図2</a></td>
	</tr>
</table>
※　「2」がついているものは、若干初期表示は遅いが、道路の立体交差を表現しているものになります。<br><br>

* この他、[地理院地図](https://maps.gsi.go.jp)の「標準地図」にできる限り表現を近づけたstyle.jsonは下記リンクからダウンロードできます。このファイルも、「地図デザインの追加」-「地図デザインファイルを開く」から読み込むことができますが、初期表示に長い時間がかかりますので、ご注意ください。
  * [地理院地図の「標準地図」にできる限り表現を近づけたstyle.json]( https://maps.gsi.go.jp/vector/data/std3.json)

## 地理院地図Vector（仮称）
- 地理院地図Vector　https://maps.gsi.go.jp/vector/
  * 地理院地図Vectorは、[Mapbox GL JS](https://github.com/mapbox/mapbox-gl-js)をベースに構築されています。
  
## 提供の位置づけ
国土地理院ベクトルタイル提供実験におけるデータの提供の位置づけは次のとおりです。
- 本提供実験は、ベクトルタイル提供における技術的・施策的課題を国土地理院が把握するとともに、外部からの技術的な提案を受け取り、外部との技術的な議論を通じてベクトルタイルの適切な提供方法を研究開発することを目的とするものです。
- 本提供実験の期間は、2019年7月29日から本提供実験終了までとなります。
- 本提供実験のデータは、[国土地理院コンテンツ利用規約](http://www.gsi.go.jp/kikakuchousei/kikakuchousei40182.html)に従って利用できます。データを利用する際は、「国土地理院ベクトルタイル提供実験」と、出典の明示を行ってください。
- 本提供実験のベクトルタイルは基本測量成果と位置付けているものではありませんが、基本測量成果としての提供を検討するにあたって、提供を行うものです。
- 本提供実験の利用により生じた損失及び損害等について、国土地理院はいかなる責任も負わないものとします。

## 履歴
- 2019-07-29 提供実験開始。提供範囲は20万分1地勢図「宇都宮」「水戸」「甲府」「東京」「千葉」の範囲（縮尺によっては、その周辺も提供）
- 2019-08-07 中心十字線のON/OFF切替え機能の追加
- 2019-08-09 最小表示ズームレベルを4に変更。また、ズームレベル4から情報を表示。
- 2010-08-09 描画ハッチ等の改良
- 2019-08-27 注記が重なった場合、ふりがなを優先的に消す仕様に変更
- 2019-08-27 エラー修正（ズームレベル13で市区町村道が表示できないエラー）
- 2019-09-03 エラー修正（一部データの文字化けに伴い注記や道路が描画されないエラー）
- 2019-11-19 エラー修正（ポリゴンデータの中抜きが表現されないエラー）
- 2020-03-19 印刷、作図、自分で作る色別標高図、現在位置表示等の機能を追加
- 2020-03-19 全国データ公開開始
