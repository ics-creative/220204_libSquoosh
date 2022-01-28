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
const OUTPUT_DIR = "./dist_squoosh";

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
    await image.encode({ mozjpeg: { quality: 75,
        baseline: false,
        arithmetic: false,
        progressive: true,
        optimize_coding: true,
        smoothing: 0,
        color_space: 3 /*YCbCr*/,
        quant_table: 3,
        trellis_multipass: false,
        trellis_opt_zero: false,
        trellis_opt_table: false,
        trellis_loops: 1,
        auto_subsample: true,
        chroma_subsample: 2,
        separate_chroma_quality: false,
        chroma_quality: 75, } });
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

  data = await encodedWith.mozjpeg;

  // 出力先フォルダがなければ作成
  if (!existsSync(OUTPUT_DIR)) {
    mkdirSync(OUTPUT_DIR);
  }
  // ファイルを書き込む
  await writeFile(`${OUTPUT_DIR}/${name}`, data.binary);
}

// imagePoolを閉じる
await imagePool.close();
