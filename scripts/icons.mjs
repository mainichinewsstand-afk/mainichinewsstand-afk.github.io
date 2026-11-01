// public/icons/icon.svg からアプリ用のPNGアイコンを作る(公開のたびに自動実行)
import { readFile, writeFile } from "node:fs/promises";
import { Resvg } from "@resvg/resvg-js";

const dir = new URL("../public/icons/", import.meta.url);
const svg = await readFile(new URL("icon.svg", dir));
const sizes = { "icon-192.png": 192, "icon-512.png": 512, "maskable-512.png": 512, "apple-touch-icon.png": 180 };
for (const [name, size] of Object.entries(sizes)) {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: size } }).render().asPng();
  await writeFile(new URL(name, dir), png);
  console.log(`✓ ${name} (${size}px)`);
}
