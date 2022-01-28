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

// JPEGの圧縮オプション
const jpgEncodeOptions = {
  mozjpeg: { quality: 75 },
};

// PNGの圧縮オプション
const pngEncodeOptions = {
  oxipng: {
    effort: 2,
  },
};

// 画像フォルダ内のJPEGとPNGを抽出
const imageFileList = readdirSync(IMAGE_DIR).filter((file) => {
  const regex = /\.(jpe?g|png)/i;
  return regex.test(file);
});

// 抽出したファイルをimagePool内にセットし、ファイル名とimagePoolの配列を作成
const imagePoolList = imageFileList.map((fileName) => {
  const imageFile = readFileSync(`${IMAGE_DIR}/${fileName}`);
  const image = imagePool.ingestImage(imageFile);
  return { name: fileName, image };
});

// JPEGならMozJPEGをに、PNGならOxiPNGに圧縮する
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
  await writeFile(`${OUTPUT_DIR}/optimized_${name}`, data.binary);
}

// imagePoolを閉じる
await imagePool.close();
