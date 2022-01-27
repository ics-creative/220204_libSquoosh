import { ImagePool } from "@squoosh/lib";
import { cpus } from "os";
import { existsSync, readdirSync, readFileSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
const imagePool = new ImagePool(cpus().length);

/**
 * 画像フォルダのパス。今回はこのフォルダ内の画像を対象とする
 * @type {string}
 */
const IMAGE_DIR = "./images";

/**
 * 出力先フォルダ
 * @type {string}
 */
const OUTPUT_DIR = "./dist";

// JPGの圧縮オプション
const jpgEncodeOptions = {
  mozjpeg: { quality: 75 },
};

// PNGの圧縮オプション
const pngEncodeOptions = {
  oxipng: {
    effort: 2,
  },
};

// 前処理（リサイズなど）のオプション
const preprocessOptions = {
  // リサイズのオプション。heightまたwidthを指定しない場合は比率を維持
  resize: {
    enabled: true,
    // 横
    width: 400,
    // 縦
    // height: 300,
    // 画像サンプリング手法 lanczos3, mitchell, catrom, triangleの4つがある。デフォルトはlanczos3
    // method: "mitchell",
  },
  // 減色処理
  // quant: {
  //   // 色数。最大256
  //   numColors: 4,
  //   // ディザ。0〜1で設定
  //   dither: 0.9,
  // },
};

// 画像フォルダ内のJPGとPNGを抽出
const imageFileList = readdirSync(IMAGE_DIR).filter((file) => {
  const regex = /\.(jpe?g|png)/i;
  return regex.test(file);
});

// 抽出したファイルをimagePool内にセットすし、ファイル名とimagePoolの配列を作成
const imagePoolList = imageFileList.map((fileName) => {
  const imageFile = readFileSync(`${IMAGE_DIR}/${fileName}`);
  const image = imagePool.ingestImage(imageFile);
  return { name: fileName, image };
});

// 前処理を実行
await Promise.all(
  imagePoolList.map(async (item) => {
    const { image } = item;
    // リサイズなどを処理するためにデコードする
    await image.decoded;
    return await image.preprocess(preprocessOptions);
  })
);

// JPGならMozJPEGをに、PNGならOxiPNGに圧縮する
await Promise.all(
  imagePoolList.map(async (item) => {
    const { image } = item;
    if (/\.(jpe?g)/i.test(item.name)) {
      await image.encode(jpgEncodeOptions);
    }
    if (/\.(png)/i.test(item.name)) {
      await image.encode(pngEncodeOptions);
    }
  })
);

// 圧縮したデータを出力する
for (const item of imagePoolList) {
  const {
    name,
    image: { encodedWith },
  } = item;

  // 圧縮したデータを格納する変数
  let data;

  // JPGならMozJPEGで圧縮したデータを取得
  if (encodedWith.mozjpeg) {
    data = await encodedWith.mozjpeg;
  }
  // PNGならOxiPNGで圧縮したデータを取得
  if (encodedWith.oxipng) {
    data = await encodedWith.oxipng;
  }
  // 出力先フォルダがなければ作成
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR);
  }
  // ファイルを書き込む
  await writeFile(`${OUTPUT_DIR}/resised_${name}`, data.binary);
}

// imagePoolを閉じる
await imagePool.close();
