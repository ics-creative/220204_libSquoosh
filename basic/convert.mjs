import { ImagePool } from "@squoosh/lib";
import { cpus } from "os";
import { existsSync, readdirSync, readFileSync, mkdirSync } from "fs";
import { writeFile } from "fs/promises";
import path from "path";
const imagePool = new ImagePool(cpus().length);

/**
 * 画像フォルダのパス。今回はこのフォルダ内の画像を対象とする
 */
const IMAGE_DIR = "./images";

/**
 * 出力先フォルダ
 */
const OUTPUT_DIR = "./dist";

// WebPの圧縮オプション
const webpEncodeOptions = {
  webp: {
    quality: 75,
  },
};

// 画像フォルダ内のJPGとPNGを抽出
const imageFileList = readdirSync(IMAGE_DIR).filter((file) => {
  const regex = /\.(jpe?g|png)/i;
  return regex.test(file);
});

// 抽出したファイルをimagePool内にセットし、ファイル名とimagePoolの配列を作成
const imagePoolList = imageFileList.map((file) => {
  const imageFile = readFileSync(`${IMAGE_DIR}/${file}`);
  const fileName = path.parse(`${IMAGE_DIR}/${file}`).name;
  const image = imagePool.ingestImage(imageFile);
  return { name: fileName, image };
});

// Webpで圧縮する
await Promise.all(
  imagePoolList.map(async (item) => {
    const { image } = item;
    await image.encode(webpEncodeOptions);
  })
);

// 圧縮したデータを出力する
for (const item of imagePoolList) {
  const {
    name,
    image: { encodedWith },
  } = item;

  // WebPで圧縮したデータを取得
  const data = await encodedWith.webp;
  // 出力先フォルダがなければ作成
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR);
  }
  // 拡張子をwebpに変換してファイルを書き込む
  await writeFile(`${OUTPUT_DIR}/${name}.webp`, data.binary);
}

// imagePoolを閉じる
await imagePool.close();
