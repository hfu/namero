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
    case '5100':
    case '5101':
    case '5102':
    case '5103':
    case '5111':
    case '5121':
    case '5188':
    case '5199':
    case '5200':
    case '5201':
    case '5202':
    case '5203':
    case '5211':
    case '5212':
    case '5221':
    case '5231':
    case '5232':
    case '5233':
    case '5242':
    case '5251':
    case '5288':
    case '5299':
    case '5301':
    case '5302':
    case '5311':
    case '5312':
    case '5321':
    case '5322':
    case '5331':
    case '5388':
    case '5399':
    case '5911': // 流水方向
      f.tippecanoe.layer = 'water'
      if (f.properties._src === '200000') {
        switch (f.properties.ftCode) {
          case '5201':
          case '5202':
          case '5203':
            f.tippecanoe.minzoom = 10
            break
          default:
            f.tippecanoe.minzoom = 12
            break
        }
      }
      break

    // landform
    case '5521': // 滝
    case '5801': // 滝領域
    case '7401':
    case '7402':
    case '7403':
    case '7501':
    case '7502':
    case '7509':
    case '7511':
    case '7512':
    case '7513': // 段丘崖
    case '7521':
    case '7531':
    case '7532':
    case '7533':
    case '7541':
    case '7551':
    case '7561':
    case '7571':
    case '7572':
    case '7601':
    case '7621':
      f.tippecanoe.layer = 'landform'
      break

    // cotour
    case '7351':
    case '7352':
    case '7353':
    case '7371':
    case '7372':
    case '7373':
      f.tippecanoe.layer = 'contour'
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
      } else {
        f.tippecanoe.minzoom = 15
      }
      let area = geojsonArea.geometry(f.geometry)
      if (area < 100) {
        f.tippecanoe.minzoom = 14
      } else if (area < 1000) {
        f.tippecanoe.minzoom = 13
      } else if (area > 5000) { // 面積が約 5000 m^2 以上の地物は z=11 から採用する
        f.tippecanoe.minzoom = 11
      }
      break

    // structure
    case '4201':
    case '4202':
    case '4301': // 巨大構造物
    case '4302': // タンク
    case '5401':
    case '5501': // ダム
    case '5514':
    case '5515':
    case '5532':
    case '5551':
    case '8202': // 送電線
    case '8206': // 大水制
      f.tippecanoe.layer = 'structure'
      break
 
    // route
    case '5901':
    case '5902':
      f.tippecanoe.layer = 'route'
      break

    // boundary
    case '1103':
    case '1104':
    case '1201':
    case '1202':
    case '1203':
    case '1204':
    case '1208':
    case '1209':
    case '1211':
    case '1212':
    case '1218':
    case '1219':
    case '1221':
    case '1222':
    case '1288':
    case '1299':
    case '1301':
    case '1302':
    case '1303':
    case '1304':
    case '1388':
    case '1399':
    case '1601':
    case '1688':
    case '1699':
    case '1701':
    case '1801':
    case '6101': // 特定地区界
    case '6111':
    case '8104': // 植生界点
    case '8205': // 植生界線
      f.tippecanoe.layer = 'boundary'
      break

    // road
    case '2200':
    case '2201':
    case '2202':
    case '2203':
    case '2204':
    case '2221':
    case '2222':
    case '2223':
    case '2224':
    case '2241':
    case '2242':
    case '2243':
    case '2244':
    case '2251':
    case '2271':
    case '2272':
    case '2273':
    case '2274':
    case '2288':
    case '2299':
    case '2401':
    case '2411':
    case '2412':
    case '2501':
      f.tippecanoe.minzoom = 15 // 道路縁・道路構成線・道路区域界線は z=15 で採用
    case '2701':
    case '2702':
    case '2703':
    case '2704':
    case '2711':
    case '2712':
    case '2713':
    case '2714':
    case '2721':
    case '2722':
    case '2723':
    case '2724':
    case '2731':
    case '2732':
    case '2733':
    case '2734':
    case '2788':
    case '2799':
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
      if (f.properties._src === '200000') {
        switch (f.properties.snglDbl) {
          case '複線以上':
            f.tippecanoe.minzoom = 10
            break
          default:
            f.tippecanoe.minzoom = 11
            break
        }
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
