import { defineConfig } from 'vite'
import squoosh from "./plugins/squoosh";

export default defineConfig({
  root:"./src/",
  build:{
    outDir:"../dist"
  },
  plugins:[squoosh()]
})