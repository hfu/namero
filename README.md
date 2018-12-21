# namero なめろう
多数の Shapefile データを（モジュールに）刻み直してベクトルタイルにする一式

# このレポジトリが行うこと
1. 多数の Shapefile データをファイルごとに ndjson.gz ファイルに変換する
2. ステップ1で作成した多数の ndjson.gz ファイルをモジュールごとの ndjson.gz ファイルに刻み直す
3. モジュールごとの ndjson.gz ファイルを Tippecanoe で mbtiles ファイル群に変換する。

## データフォルダの説明
多数の Shapefile データをファイルごとに ndjson.gz ファイルに変換したものは 200000 および 25000 フォルダに格納するようにしています。Shapefile の読み出し元については、25000.rb および 200000.rb をみてください。モジュールごとに刻み直した ndjson.gz は dst フォルダに格納します。Tippecanoe で変換して得られる mbtiles ファイルは、mbtiles フォルダに格納します。

# このレポジトリを使う前提として必要なプログラム
- Ruby: ふつうの Ruby で OK
- Node: ふつうの Node で OK
- ogr2ogr: GeoJSONSeq 形式でデータを出力する必要があるので、GDAL 2.4.0dev の ogr2ogr が必要です。GDAL 2.4.0dev は、おそらくソースからインストールする必要があります。node-shapefile を用いる方法では、丁寧すぎる方式で DBF ファイルに格納された属性を上手く引き出せないようなので、ここは少し頑張って ogr2ogr 2.4.0dev を導入してください。おそらく、半年後くらいにはふつうの ogr2ogr になるのだと思います。

# 各ステップの説明
## インストール
```console
$ git clone git@github.com:hfu/namero
$ cd namero
$ npm install
```

## 大量の Shapefile データをファイルごとに ndjson.gz ファイルに変換する
```console
$ ruby 200000.rb | sh
$ ruby 25000.rb | sh
```
これら rb スクリプトは、内部で ogr2ogr を呼び出します。

ファイルの読み先と文字コードについては、それぞれの rb ファイルにハードコードしているので、適宜変更してください。

## ndjson.gz ファイルをモジュールで刻み直して ndjson.gz ファイルに格納する
```console
$ ruby modularize.rb | sh
```
modularize.rb は内部で mod.js を呼び出します。mod.js は gh:hfu/tentsuki の index.js の改造版です。

## モジュールごとの ndjson.gz ファイルを Tippecanoe で mbtiles ファイル群に変換する
```console
$ tipp.sh | sh
```
tippe.sh は内部で UNIX の find コマンドと、tippecanoe を呼び出します。

これでできた mbtiles ファイルを spinel か pietra でホストすれば完了です。

# 技術的なメモ
- mod.js では、「gz 圧縮したデータは cat でつなぐことができる」という特性を使っています。
