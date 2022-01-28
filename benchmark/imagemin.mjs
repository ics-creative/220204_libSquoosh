import imagemin from "imagemin";
import imageminMozjpeg from "imagemin-mozjpeg";

await imagemin(["images/*.jpg"], {
  destination: "dist_imagemin",
  plugins: [
    imageminMozjpeg({
      quality: 75,
      quantBaseline: false,
      arithmetic: false,
      progressive: true,
      smooth: 0,
      quantTable: 3,
      trellis: false,
    }),
  ],
});
