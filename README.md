# 地理院地図Vector（仮称）提供実験

## ベクトルタイルの仕様
本提供実験によるベクトルタイルは、[地理院タイル](http://maps.gsi.go.jp/development/siyou.html)と同じ方式で配信します。
`https://cyberjapandata.gsi.go.jp/xyz/{t}/{z}/{x}/{y}.{ext}`

* 本提供実験によるベクトルタイルは、タイルに分割した[Vector tile specification](https://github.com/mapbox/vector-tile-spec)形式のファイル群。
* 拡張子は「pbf」。

## タイル一覧
提供実験中のデータであるため、事業化までに URL やデータ構成、データの内容（属性の有無や名称等）が変わる可能性があります。

<table>
	<tr><th>URL</th><td colspan="3">https://cyberjapandata.gsi.go.jp/xyz/experimental_bvmap/{z}/{x}/{y}.pbf</tr>
	<tr><th class="titletd">データソース</td><td>数値地図（国土基本情報）- 地図情報　等</td>
		<th>ズームレベル</td><td>5～17</td></tr>
	<tr><th class="titletd">提供範囲</td><td>20万分1地勢図「宇都宮」「水戸」「甲府」「東京」「千葉」の範囲（縮尺によっては、その周辺も提供）</td>
		<th>提供開始</td><td>令和元年7月29日</td></tr>
	<tr><th colspan="4"><a href="https://maps.gsi.go.jp/vector/" class="blank">地理院地図Vectorで表示</a></td></tr>
</table>

### 属性等の仕様詳細
* [地物コード及び表示ズームレベル一覧](https://maps.gsi.go.jp/help/pdf/vector/dataspec.pdf)
* [地物の属性一覧](https://maps.gsi.go.jp/help/pdf/vector/attribute.pdf)

## style.json
* 地図のデザインを規定しているファイル。[Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/)に従って記述されています。
* 2019年7月29日現在の地理院地図Vectorの「おすすめの地図」のデザインファイル「style.json」は以下の表の通りです。
* 右クリックの「名前をつけて保存」からダウンロードすることができます。
* 保存したファイルは、地理院地図Vectorの「スタイルファイルを読み込む」機能から読み込むこともできます。
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
※　「2」がついているものは、若干初期表示は遅いが、道路の立体交差を表現しているものになります。

## デモサイト
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
2019-07-29 提供実験開始。提供範囲は20万分1地勢図「宇都宮」「水戸」「甲府」「東京」「千葉」の範囲（縮尺によっては、その周辺も提供）

