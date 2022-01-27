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
        return { file, image: imagePool.ingestImage(imageSource) };
      });

      await Promise.all(
        imagePoolList.map(async (item) => {
          const { image, file } = item;
          if (/\.(jpe?g)/i.test(file)) {
            await image.encode(jpgEncodeOptions);
          }
          if (/\.(png)/i.test(file)) {
            await image.encode(pngEncodeOptions);
          }
        })
      );

      for (const item of imagePoolList) {
        const { image, file } = item;
        let data;
        if (/\.(jpe?g)/i.test(file)) {
          data = await image.encodedWith.mozjpeg;
        }
        if (/\.(png)/i.test(file)) {
          data = await image.encodedWith.oxipng;
        }
        bundle[file].source = data.binary;
      }

      await imagePool.close();
    },
  };
}
