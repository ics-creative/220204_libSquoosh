import { ImagePool } from "@squoosh/lib";
import { cpus } from "os";
const imagePool = new ImagePool(cpus().length);

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

export default function squoosh() {
  return {
    name: "squoosh",
    async generateBundle(_options, bundle) {
      // JPGとPNGを抽出
      const imageFileList = Object.keys(bundle).filter((key) => {
        const regex = /\.(jpe?g|png)/i;
        return regex.test(key);
      });
      const imagePoolList = imageFileList.map((file) => {
        const imageSource = bundle[file].source;
        return { file, imagePool: imagePool.ingestImage(imageSource) };
      });

      await Promise.all(
        imagePoolList.map(async (item) => {
          const { imagePool, file } = item;
          if (/\.(jpe?g)/i.test(file)) {
            await imagePool.encode(jpgEncodeOptions);
          }
          if (/\.(png)/i.test(file)) {
            await imagePool.encode(pngEncodeOptions);
          }
        })
      );

      for (const item of imagePoolList) {
        const { imagePool, file } = item;
        let data;
        if (/\.(jpe?g)/i.test(file)) {
          data = await imagePool.encodedWith.mozjpeg;
        }
        if (/\.(png)/i.test(file)) {
          data = await imagePool.encodedWith.oxipng;
        }
        bundle[file].source = data.binary;
      }

      await imagePool.close();
    },
  };
}
