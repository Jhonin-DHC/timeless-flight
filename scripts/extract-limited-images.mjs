import fs from "fs";
import path from "path";
import { execFileSync } from "child_process";

const ROOT = process.cwd();
const TMP = path.join(ROOT, "tmp-docx", "media");
const PUBLIC = path.join(ROOT, "public", "images", "limited-editions");
const CATALOG = path.join(ROOT, "src/data/limited-editions-catalog.json");

fs.mkdirSync(TMP, { recursive: true });
fs.mkdirSync(PUBLIC, { recursive: true });

const sources = [
  {
    key: "limited",
    docx: path.join(ROOT, "public/public/Breitling Limited Edition.docx")
  },
  {
    key: "navitimer",
    docx: path.join(ROOT, "public/public/Navitimer Limited Editions.docx")
  }
];

const py = `
import zipfile, os, sys
docx, dest = sys.argv[1], sys.argv[2]
os.makedirs(dest, exist_ok=True)
with zipfile.ZipFile(docx) as z:
    for name in z.namelist():
        if name.startswith("word/media/") and not name.endswith("/"):
            target = os.path.join(dest, os.path.basename(name))
            with z.open(name) as src, open(target, "wb") as out:
                out.write(src.read())
            print(os.path.basename(name), os.path.getsize(target))
`;
fs.writeFileSync(path.join(ROOT, "tmp-docx", "extract_media.py"), py);

for (const source of sources) {
  const dest = path.join(TMP, source.key);
  fs.mkdirSync(dest, { recursive: true });
  console.log("extracting", source.key);
  execFileSync("python", [path.join(ROOT, "tmp-docx", "extract_media.py"), source.docx, dest], { stdio: "inherit" });
}

const sharp = (await import("sharp")).default;
const catalog = JSON.parse(fs.readFileSync(CATALOG, "utf8"));

let saved = 0;
let missing = 0;
for (const listing of catalog) {
  const urls = [];
  let index = 0;
  for (const image of listing.images || []) {
    const abs = path.join(TMP, image.replaceAll("/", path.sep));
    if (!fs.existsSync(abs)) {
      missing += 1;
      continue;
    }
    index += 1;
    const outName = `${listing.slug}-${index}.jpg`;
    const outPath = path.join(PUBLIC, outName);
    await sharp(abs)
      .rotate()
      .resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 82, mozjpeg: true })
      .toFile(outPath);
    urls.push(`/images/limited-editions/${outName}`);
    saved += 1;
  }
  listing.imageUrl = urls[0] || "/images/watch-placeholder.svg";
  listing.imageUrls = urls.slice(1);
  delete listing.images;
}

fs.writeFileSync(CATALOG, JSON.stringify(catalog, null, 2));
console.log(JSON.stringify({ saved, missing, listings: catalog.length, withPhotos: catalog.filter((l) => l.imageUrl !== "/images/watch-placeholder.svg").length }, null, 2));
