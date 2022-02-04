import { defineConfig } from 'vite'
import squoosh from "./plugins/squoosh.js";

export default defineConfig({
  root:"./src/",
  build:{
    outDir:"../dist"
  },
  plugins:[squoosh()]
})