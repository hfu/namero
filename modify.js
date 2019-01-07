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

    // water
    // 51: 海岸線, 52: 水涯線, 53: 河川中心線
    case '5100': // 海の水域
    case '5101': // 海岸線の通常部
    case '5102': // 海岸線の岩等に接する部分
    case '5103': // 海岸線の堤防等に接する部分
    case '5111': // 海側の河口線
    case '5121': // 海岸線の露岩
    case '5188': // その他の海岸線
    case '5199': // 不明な海岸線
    case '5200': // 河川と湖池の水域
    case '5201': // 河川の通常部
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

    // landform
    case '5521': // 滝の水部構造物線
    case '5801': // 滝の領域
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
      f.tippecanoe.layer = 'landform'
      switch (f.properties._src) {
        case '200000':
          f.tippecanoe.maxzoon = 13
          if (f.geometry.type === 'LineString') {
            f.tippecanoe.minzoom = 11
          }
          break
        case '25000':
          f.tippecanoe.minzoom = 14
          break
      }
      break

    // contour
    case '7351': // ふつうの等高線
    case '7352': // 等高線に数値が入るところ
    case '7353': // 等高線が崖に重なるところ
    case '7371': // ふつうの等深線
    case '7372': // 等深線に数値が入るところ
    case '7373': // 等深線が崖に重なるところ
      f.tippecanoe.layer = 'contour'
      switch (f.properties._src) {
        case '200000':
          f.tippecanoe.maxzoom = 13
          break
        case '25000':
          f.tippecanoe.minzoom = 15
          if (f.properties.alti % 20 === 0) {
            f.tippecanoe.minzoom = 14
          }
          break
      }
      break

    // building
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

    // structure
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

    // route
    case '5901': // 船舶の表記線
    case '5902': // 航路の表記線
      f.tippecanoe.layer = 'route'
      break

    // boundary
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

    // road (道路縁)
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

    // road (道路中心線)
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

    // railway
    case '2801':
    case '2802':
    case '2803':
    case '2804':
    case '2805':
    case '2806':
    case '2811':
    case '2812':
    case '2813':
    case '2814':
    case '2815':
    case '2816':
    case '2821':
    case '2822':
    case '2823':
    case '2824':
    case '2825':
    case '2826':
    case '2831':
    case '2832':
    case '2833':
    case '2834':
    case '2835':
    case '2836':
    case '2841':
    case '2842':
    case '2843':
    case '2844':
    case '2845':
    case '2846':
    case '2888':
    case '2899':
    case '8201': // 鉄道中心線
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

    // transport
    case '2901': // 国道番号
    case '2902': // 踏切
    case '2903': // 都市高速道路番号
    case '2904':
    case '2911':
    case '2921': // 地上プラットフォーム
    case '2922': // 地下プラットフォーム
    case '2931': // 雪覆い等
    case '2941':
    case '2942':
    case '2943':
    case '2944':
    case '2945':
      f.tippecanoe.layer = 'transport'
      break

    // symbol
    case '3200':
    case '3201':
    case '3202':
    case '3203':
    case '3204':
    case '3205':
    case '3206':
    case '3207':
    case '3211':
    case '3212':
    case '3213':
    case '3214':
    case '3215':
    case '3216':
    case '3217':
    case '3218':
    case '3219':
    case '3221':
    case '3231':
    case '3232':
    case '3241':
    case '3242': 
    case '3243':
    case '3244':
    case '3251': // <20>発電所
    case '3261': // <20>工場
    case '4101':
    case '4102':
    case '4103': // 油井とガス井
    case '4104': // 記念碑
    case '6201': // 公園
    case '6301':
    case '6311':
    case '6312':
    case '6313':
    case '6314':
    case '6321':
    case '6322':
    case '6323':
    case '6324':
    case '6325':
    case '6326':
    case '6327':
    case '6331':
    case '6332':
    case '6341':
    case '6342':
    case '6351':
    case '6361':
    case '6362':
    case '6371': // 空港
    case '6373': // 自衛隊等の飛行場
    case '6381': // 自衛隊
    case '7101':
    case '7102':
    case '7103':
    case '7104':
    case '7105':
    case '7106':
    case '7107':
    case '7108':
    case '7111':
    case '7121':
    case '7122':
    case '7131':
    case '7188':
    case '7201':
    case '7202':
    case '7211':
    case '7212':
    case '7288':
    case '7299':
    case '7221':
    case '7701':
    case '7711':
    case '8103': // 発電所等
    case '8105': // 電波塔
    case '8301': // 樹木に囲まれた居住地
      f.tippecanoe.layer = 'symbol'
      break

    // label 
    case '100': // <20>注記
    case '200': // <20>注記（probably undocumented, but found）
    case '300': // <20>注記（probably undocumented, but found）
    case '0110':
    case '0120':
    case '0210':
    case '0220':
    case '0311':
    case '0312':
    case '0313':
    case '0321':
    case '0322':
    case '0323':
    case '0331':
    case '0332':
    case '0341':
    case '0342':
    case '0343':
    case '0351':
    case '0352':
    case '0353':
    case '0411':
    case '0412':
    case '0413':
    case '0421':
    case '0422':
    case '0423':
    case '0431':
    case '0432':
    case '0441':
    case '0511':
    case '0521':
    case '0522':
    case '0523':
    case '0531':
    case '0532':
    case '0533':
    case '0534':
    case '0611':
    case '0612':
    case '0613':
    case '0615':
    case '0621':
    case '0631':
    case '0632':
    case '0633':
    case '0634':
    case '0651':
    case '0653':
    case '0654':
    case '0661':
    case '0662':
    case '0671':
    case '0672':
    case '0673':
    case '0681':
    case '0710':
    case '0720':
    case '0999':
      f.tippecanoe.layer = 'label'
      break

    case '9201':
    default:
      f.tippecanoe.layer = 'other'
      break
  }
  return f
}
