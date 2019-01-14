const geojsonArea = require('@mapbox/geojson-area')
let undefined

// the flap function:
// a function to return a function to dynamically assign maximum and minimim
// zoom levels from the area of the polygon geometry.
const flap = (minzoom, maxzoom, F) => {
  if (!F) F = 19 // default flap constant
  return (f) => {
    if (f.geometry.type !== 'MultiPolygon') return f
    f.tippecanoe.minzoom = Math.floor(
      F - Math.log2(geojsonArea.geometry(f.geometry)) / 2
    )
    if (f.tippecanoe.minzoom <= minzoom) {
      if (minzoom === 0) {
        // tippecanoe requires that minzoom should not be 0.
        delete f.tippecanoe.minzoom
      } else {
        f.tippecanoe.minzoom = minzoom
      }
    }
    if (f.tippecanoe.minzoom >= maxzoom) f.tippecanoe.minzoom = maxzoom
    return f
  }
}

// flap cache
const flaps = {
  area: flap(11, 15, 17)
}

module.exports = (f) => {
  // tippecanoe 属性のデフォルトをセットする
  f.tippecanoe = { layer: 'other' }
  switch (f.properties._src) {
    case '200000':
      f.tippecanoe.minzoom = 10
      f.tippecanoe.maxzoom = 12
      break
    case '25000':
      f.tippecanoe.minzoom = 13
      f.tippecanoe.maxzoom = 15
      break
  }

  // 当面不要と思われる属性を削除する
  delete f.properties.lfSpanFr
  delete f.properties.lfSpanTo
  delete f.properties.tmpFlg
  delete f.properties.admCode
  delete f.properties.devDate
  delete f.properties.type

  // see https://www.gsi.go.jp/common/000195806.pdf
  // see https://www.gsi.go.jp/common/000080761.pdf
  switch (f.properties.ftCode) {
    case undefined:
      return null

    // (1) nature (formarly known as contour and landform)
    case '5521': // 滝の水部構造物線
    case '5801': // 滝の領域
    case '7351': // ふつうの等高線
    case '7352': // 等高線に数値が入るところ
    case '7353': // 等高線が崖に重なるところ
    case '7371': // ふつうの等深線
    case '7372': // 等深線に数値が入るところ
    case '7373': // 等深線が崖に重なるところ
    case '7401': // 湿地の地形表記面
    case '7402': // 万年雪の地形表記面
    case '7403': // 領域が明瞭な砂礫地の地形表記面
    case '7501': // コンクリートな土崖
    case '7502': // コンクリートでない土崖
    case '7509': // 不明な土崖
    case '7511': // 岩崖
    case '7512': // 岩
    case '7513': // 段丘崖
    case '7521': // 雨裂の上部
    case '7531': // 大凹地の方向線
    case '7532': // 小凹地の方向線
    case '7533': // <20>凹地の方向線
    case '7541': // 隠顕岩
    case '7551': // 干潟界
    case '7561': // 枯れ川水涯線
    case '7571': // 湖底急斜面
    case '7572': // 水部の凹地の方向線
    case '7601': // 領域が不明瞭な砂礫地の地形記号
    case '7621': // 雨裂の下部
      f.tippecanoe.layer = 'nature'
      switch (f.properties._src) {
        case '200000':
          f.tippecanoe.maxzoom = 13
          if (f.geometry.type === 'LineString') {
            f.tippecanoe.minzoom = 10
          }
          break
        case '25000':
          f.tippecanoe.minzoom = 14
          if (
            f.properties.hasOwnProperty('alti') &&
            f.properties.alti % 20 !== 0
          ) {
            f.tippecanoe.minzoom = 15
          }
          break
        default:
          throw new Error(`_src value ${f.properties._src} unknown.`)
      }
      break

    // (2) water
    // 51: 海岸線, 52: 水涯線, 53: 河川中心線
    case '5100': // 海の水域
    case '5101': // 海岸線
    case '5102': // 海岸線の岩等に接する部分
    case '5103': // 海岸線の堤防等に接する部分
    case '5111': // 海側の河口線
    case '5121': // 海岸線の露岩
    case '5188': // その他の海岸線
    case '5199': // 不明な海岸線
    case '5200': // 河川と湖池の水域
    case '5201': // 河川
    case '5202': // 河川の岩等に接する部分
    case '5203': // 河川の堤防等に接する部分
    case '5211': // 河川側の河口線
    case '5212': // 河川側の湖池界線
    case '5221': // 河川の露岩
    case '5231': // 湖池の通常部
    case '5232': // 湖池の岩等に接する部分
    case '5233': // 湖池の堤防等に接する部分
    case '5242': // 湖池側の湖池界線
    case '5251': // 湖池の露岩
    case '5288': // その他の水涯線
    case '5299': // 不明な水涯線
    case '5301': // 一条河川の通常部
    case '5302': // 一条河川の枯れ川部
    case '5311': // 二条河川中心線の通常部
    case '5312': // 二条河川中心線の枯れ川部
    case '5321': // 空間の人工水路
    case '5322': // 地下の人工水路
    case '5331': // 用水路
    case '5388': // その他の河川中心線
    case '5399': // 不明な河川中心線
    case '5911': // 流水方向
      f.tippecanoe.layer = 'water'
      break

    // (3) boundary
    case '1103': // 郡と市と東京都の区の区画
    case '1104': // 町と村と指定都市の区の区画
    case '1201': // 都道府県の境界
    case '1202': // 総合振興局や振興局の境界
    case '1203': // 郡や市や東京都の区の境界
    case '1204': // 町や村や指定都市の区の境界
    case '1208': // 未定の境界
    case '1209': // 不明の境界
    case '1211': // 25000の都道府県や総合振興局や振興局の境界
    case '1212': // 25000の市区町村の境界
    case '1218': // 25000の未定の境界
    case '1219': // 25000の不明の境界
    case '1221': // 25000で所属を明示する境界線
    case '1222': // 25000で所属を包括する非表示線
    case '1288': // その他の境界
    case '1299': // 不明な境界
    case '1301': // 都道府県の代表点
    case '1302': // 総合振興局や振興局の代表点
    case '1303': // 郡や市や東京都の区の代表点
    case '1304': // 町や村や指定都市の区の代表点
    case '1388': // その他の行政区画の代表点
    case '1399': // 不明な行政区画の代表点
    case '1601': // 住居表示地域の街区域
    case '1688': // その他の街区域
    case '1699': // 不明な街区域
    case '1701': // 街区線
    case '1801': // 街区の代表点
    case '6101': // 特定地区界
    case '8104': // 植生界点
    case '8205': // 植生界線
      f.tippecanoe.layer = 'boundary'
      switch (f.properties.ftCode) {
        case '1601':
        case '1688':
        case '1699':
        case '1701':
        case '1801':
          f.tippecanoe.minzoom = 15
          break
      }
      break

    // (4) road (道路縁)
    case '2200': // 階層化面閉じ線
    case '2201': // 通常の道路縁
    case '2202': // 通常の遮蔽された道路縁
    case '2203': // 通常の橋や高架の道路縁
    case '2204': // 通常のトンネル入口線
    case '2221': // 庭園路の道路縁
    case '2222': // 庭園路の遮蔽された道路縁
    case '2223': // 庭園路の橋や高架の道路縁
    case '2224': // 庭園路のトンネル入口線
    case '2241': // 中心線由来の道路縁
    case '2242': // 中心線由来の遮蔽された道路縁
    case '2243': // 中心線由来の橋や高架の道路縁
    case '2244': // 中心線由来のトンネル入口線
    case '2251': // 中心線由来の庭園路の道路縁
    case '2271': // 軽車道の道路縁
    case '2272': // 軽車道の隠蔽された道路縁
    case '2273': // 軽車道の橋や高架の道路縁
    case '2274': // 軽車道のトンネル入口線
    case '2288': // その他の道路縁
    case '2299': // 不明な道路縁
    case '2401': // トンネル内の道路
    case '2411': // 分離帯
    case '2412': // 遮蔽された分離帯
    case '2501': // 道路区域界線
      f.tippecanoe.layer = 'road'
      f.tippecanoe.minzoom = 15 // 道路縁・道路構成線・道路区域界線は z=15 で採用
      break

    // (4) road (道路中心線)
    case '2701': // ２条道路中心線
    case '2702': // 雪覆いがされた２条道路中心線
    case '2703': // 橋や高架の２条道路中心線
    case '2704': // トンネルの２条道路中心線
    case '2711': // 庭園路の２条道路中心線
    case '2712': // 雪覆いがされた庭園路の２条道路中心線
    case '2713': // 橋や高架の庭園路の２条道路中心線
    case '2714': // トンネルの庭園路の２条道路中心線
    case '2721': // 徒歩道
    case '2722': // 雪覆いがされた徒歩道
    case '2723': // 橋や高架の徒歩道
    case '2724': // トンネルの徒歩道
    case '2731': // 石段
    case '2732': // 雪覆いがされた石段
    case '2733': // 橋や高架の石段
    case '2734': // トンネルの石段
    case '2788': // その他の道路中心線
    case '2799': // 不明な道路中心線
      f.tippecanoe.layer = 'road'
      if (f.properties._src === '200000') {
        switch (f.properties.rdCtg) {
          case '高速自動車国道等':
            f.tippecanoe.minzoom = 10
            break
          case '国道':
            f.tippecanoe.minzoom = 11
            break
          case '都道府県道':
          case '市区町村道等':
          case 'その他':
          case '不明':
          default:
            f.tippecanoe.minzooom = 12
            break
        }
      }
      break

    // (5) railway
    case '2801': // 普通鉄道
    case '2802': // 遮蔽された普通鉄道
    case '2803': // 橋や高架の普通鉄道
    case '2804': // トンネルの普通鉄道
    case '2805': // 建設中の普通鉄道
    case '2806': // 運休中の普通鉄道
    case '2811': // 特殊鉄道
    case '2812': // 遮蔽された特殊鉄道
    case '2813': // 橋や高架の特殊鉄道
    case '2814': // トンネルの特殊鉄道
    case '2815': // 建設中の特殊鉄道
    case '2816': // 運休中の特殊鉄道
    case '2821': // 索道
    case '2822': // 隠蔽された索道
    case '2823': // 橋や高架の索道
    case '2824': // トンネルの索道
    case '2825': // 建設中の索道
    case '2826': // 運休中の索道
    case '2831': // 路面
    case '2832': // 隠蔽された路面
    case '2833': // 橋や高架の路面
    case '2834': // トンネルの路面
    case '2835': // 建設中の路面
    case '2836': // 運休中の路面
    case '2841': // 側線
    case '2842': // 遮蔽された側線
    case '2843': // 橋や高架の側線
    case '2844': // トンネルの側線
    case '2845': // 建設中の側線
    case '2846': // 運休中の側線
    case '2888': // その他の軌道の中心線
    case '2899': // 不明な軌道の中心線
    case '8201': // <20>鉄道中心線
      f.tippecanoe.layer = 'railway'
      switch (f.properties._src) {
        case '200000':
          switch (f.properties.snglDbl) {
            case '複線以上':
              f.tippecanoe.minzoom = 10
              break
            default:
              f.tippecanoe.minzoom = 11
              break
          }
          f.tippecanoe.maxzoom = 14
          break
        case '25000':
          f.tippecanoe.minzoom = 15
          f.tippecanoe.maxzoom = 15
          break
      }
      break

    // (6) route
    case '5901': // 船舶の表記線
    case '5902': // 航路の表記線
      f.tippecanoe.layer = 'route'
      break

    // (7) structure (formerly known as structure and transport)
    case '2901': // 国道番号(20/25共通)
    case '2902': // 踏切
    case '2903': // 都市高速道路番号(20/25共通)
    case '2904': // UNKNOWN
    case '2911': // 交通トンネル口
    case '2921': // 地上プラットフォーム
    case '2922': // 地下プラットフォーム
    case '2931': // 雪覆い等
    case '2941': // <20>インターチェンジ
    case '2942': // <20>ジャンクション
    case '2943': // <20>サービスエリア
    case '2944': // <20>パーキングエリア
    case '2945': // <20>スマートインターチェンジ
    case '4201': // 高塔の線
    case '4202': // 坑口の線
    case '4301': // 巨大構造物の面
    case '4302': // タンクの面
    case '5501': // ダムの線
    case '5514': // せきの線
    case '5515': // 水門の線
    case '5532': // 透過水制の線
    case '5551': // 河川トンネル口の線
    case '8202': // 送電線
    case '8206': // 大きな水制
      f.tippecanoe.layer = 'structure'
      break

    // (8) building
    case '3101': // 普通建物
    case '3102': // 堅ろう建物
    case '3103': // 高層建物
    case '3111': // 普通無壁舎
    case '3112': // 堅ろう無壁舎
    case '3177': // <20>建築物
    case '3188': // その他
    case '3199': // 不明
      f.tippecanoe.layer = 'building'
      if (f.properties.ftCode === '3177') {
        f.tippecanoe.minzoom = 12
        f.tippecanoe.maxzoom = 14
        let area = geojsonArea.geometry(f.geometry)
        if (area < 1000) {
          f.tippecanoe.minzoom = 15
        } else if (area > 5000) {
          f.tippecanoe.minzoom = 11
        }
      } else {
        f.tippecanoe.minzoom = 15
      }
      break

    // (9) place (formarly known as label and symbol)
    case '100': // <20>注記
    case '200': // <20>注記（probably undocumented, but found）
    case '300': // <20>注記（probably undocumented, but found）
    case '0110': // 市区町村の行政区画
    case '0120': // 飛び地の行政区画
    case '0210': // 町字名の公称の居住地名
    case '0220': // 集落名称の通称の居住地名
    case '0311': // 山の総称
    case '0312': // 山や岳や峰
    case '0313': // 尖峰や丘や塚
    case '0321': // 湖や沼や池や浦
    case '0322': // 河川や用水
    case '0323': // 沢や瀬や淵や瀞や谷や峡や雪渓や河原や州や滝や浜や崎や半島や尻や島
    case '0331': // 高原や原や森や林や砂丘や湿原
    case '0332': // 岩や溶岩や崖や鍾乳洞や温泉や湧水や噴泉や噴火口や峠や坂
    case '0341': // 海や湾や灘や淵や浦や瀬や海峡や瀬戸
    case '0342': // 海岸や浜や半島
    case '0343': // 岬や鼻や崎や磯や敷
    case '0351': // 群島や列島や島の総称
    case '0352': // 島
    case '0353': // はえや岩礁
    case '0411': // 道路名
    case '0412': // ICやPAや道の駅などの道路施設
    case '0413': // 橋やトンネルなどの道路構造物
    case '0421': // 鉄道路線名
    case '0422': // 鉄道駅名
    case '0423': // 橋やトンネルや操車場などの鉄道構造物
    case '0431': // 港湾
    case '0432': // フェリー発着所や埠頭などの港湾施設
    case '0441': // 空港名（これだけ「名」と付いているのはなんでだろう）
    case '0511': // 高塔や煙突などの構造物名称
    case '0521': // ダム
    case '0522': // 堰
    case '0523': // 水門や堤防などの河川や海岸の施設
    case '0531': // 演習場やゴルフ場や遊園地や建設予定地などの土地利用名
    case '0532': // 史跡や名勝や天然記念物
    case '0533': // 漁港
    case '0534': // 公園
    case '0611': // 合同庁舎
    case '0612': // 合同庁舎や矯正施設や自衛隊を除く国の機関
    case '0613': // 刑務所や少年院などの矯正施設
    case '0615': // 自衛隊と米軍
    case '0621': // 県庁
    case '0631': // 大学と大学院
    case '0632': // 短期大学
    case '0633': // 高等専門学校
    case '0634': // 特殊学校
    case '0651': // 水族館や動植物園
    case '0653': // 発電所
    case '0654': // 料金所
    case '0661': // 神社
    case '0662': // 寺院
    case '0671': // 商業施設
    case '0672': // 高層施設
    case '0673': // 文教施設
    case '0681': // その他の主要または著名な建物
    case '0710': // ふりがな
    case '0720': // 鉱山の鉱種名
    case '0999': // その他の注記
    case '3200': // 指示点
    case '3201': // 官公署
    case '3202': // 裁判所
    case '3203': // 税務署
    case '3204': // 外国公館
    case '3205': // 市役所や東京都の区役所(20/25共通)
    case '3206': // 町村役場や政令指定都市の区役所(20/25共通)
    case '3207': // <20>都道府県庁と北海道の総合振興局や振興局
    case '3211': // 交番
    case '3212': // 高等学校と中等教育学校
    case '3213': // 中学校
    case '3214': // 小学校
    case '3215': // 老人ホーム
    case '3216': // 博物館法の登録博物館と博物館相当施設
    case '3217': // 図書館
    case '3218': // 郵便局
    case '3219': // <20>大学や大学院や短期大学
    case '3221': // 灯台(20/25共通)
    case '3231': // 神社(20/25共通)
    case '3232': // 寺院(20/25共通)
    case '3241': // 警察署(20/25共通)
    case '3242': // 消防署
    case '3243': // 病院
    case '3244': // 保健所
    case '3251': // <20>発電所
    case '3261': // <20>工場
    case '4101': // 煙突
    case '4102': // 風車
    case '4103': // 油井とガス井
    case '4104': // 記念碑
    case '6201': // 公園
    case '6301': // 墓地
    case '6311': // 田
    case '6312': // 畑
    case '6313': // 茶畑
    case '6314': // 果樹園
    case '6321': // 広葉樹林
    case '6322': // 針葉樹林
    case '6323': // 竹林
    case '6324': // ヤシ科樹林
    case '6325': // ハイマツ地
    case '6326': // 笹地
    case '6327': // 荒地
    case '6331': // 温泉
    case '6332': // 噴火口と噴気孔
    case '6341': // 史跡や名称や天然記念物
    case '6342': // 城跡
    case '6351': // 採鉱地
    case '6361': // 港湾
    case '6362': // 漁港
    case '6371': // 空港
    case '6373': // 自衛隊等の飛行場
    case '6381': // 自衛隊
    case '7101': // 電子基準点
    case '7102': // 三角点
    case '7103': // 水準点
    case '7104': // 多角点
    case '7105': // 地殻変動観測点
    case '7106': // 磁気点
    case '7107': // VLBI 観測点
    case '7108': // その他の国家基準点
    case '7111': // 水路測量標
    case '7121': // 公共基準点
    case '7122': // 公共水準点
    case '7131': // 街区基準点
    case '7188': // その他の基準点
    case '7201': // 測点
    case '7202': // 等高線の構成点
    case '7211': // 特別標高点
    case '7212': // グリッド標高点
    case '7288': // その他の標高点
    case '7299': // 不明な標高点
    case '7221': // UNKNOWN
    case '7701': // 水面標高
    case '7711': // 水深
    case '8103': // 発電所等
    case '8105': // 電波塔
    case '8301': // 樹木に囲まれた居住地
      switch (f.properties._src) {
        case '200000':
          f.tippecanoe.maxzoom = 14
          break
        case '25000':
          f.tippecanoe.minzoom = 15
          break
      }
      f.tippecanoe.layer = 'place'
      break

    case '9201': // 仮想線
    default:
      f.tippecanoe.layer = 'other'
      break
  }
  return f
}
