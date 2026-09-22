import fs from "fs";
import path from "path";

const ROOT = process.cwd();
const TMP = path.join(ROOT, "tmp-docx");
const OUT_JSON = path.join(ROOT, "src/data/limited-editions-catalog.json");

const FILES = [
  {
    key: "collectors",
    xml: "Breitling Limited edition collectors-document.xml",
    rels: "Breitling Limited edition collectors-document.xml.rels"
  },
  {
    key: "limited",
    xml: "Breitling Limited Edition-document.xml",
    rels: "Breitling Limited Edition-document.xml.rels"
  },
  {
    key: "navitimer",
    xml: "Navitimer Limited Editions-document.xml",
    rels: "Navitimer Limited Editions-document.xml.rels"
  }
];

const INTERNAL =
  /we can (place|list)|please make a note|let's get it|for atlas|i would |image source:|we will |we might |recommended sources|one note about completeness|important observations|key reference decoding|working census|this list is based|after cross-checking|needs verification/i;

const JUNK_NAME =
  /boutique editions$|retailer editions$|japan limited navitimers|world limited editions$|professional dealer|listed for \$|housekihiroba|jack road|super constellation —|bulk lots|yahoo! auctions|atlas rarity|production range/i;

function decode(text) {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/\s+/g, " ")
    .trim();
}

function parseRels(xml) {
  const map = {};
  const re = /Id="(rId\d+)"[^>]*Target="([^"]+)"/g;
  let m;
  while ((m = re.exec(xml))) map[m[1]] = m[2].replace(/^\/?/, "");
  return map;
}

function cellContent(tcXml, rels, source) {
  const texts = [];
  const textRe = /<w:t[^>]*>([^<]*)<\/w:t>/g;
  let m;
  while ((m = textRe.exec(tcXml))) texts.push(decode(m[1]));
  const images = [];
  const imgRe = /r:embed="([^"]+)"/g;
  while ((m = imgRe.exec(tcXml))) {
    const target = rels[m[1]];
    if (target) images.push(`${source}/${target.replace(/^.*\//, "")}`);
  }
  return { text: texts.join(" ").replace(/\s+/g, " ").trim(), images };
}

function extractTables(xml, rels, source) {
  const tables = [];
  const tblRe = /<w:tbl[\s>][\s\S]*?<\/w:tbl>/g;
  let tbl;
  while ((tbl = tblRe.exec(xml))) {
    const rows = [];
    const trRe = /<w:tr[\s>][\s\S]*?<\/w:tr>/g;
    let tr;
    while ((tr = trRe.exec(tbl[0]))) {
      const raw = [];
      const tcRe = /<w:tc[\s>][\s\S]*?<\/w:tc>/g;
      let tc;
      while ((tc = tcRe.exec(tr[0]))) raw.push(cellContent(tc[0], rels, source));
      const cells = [];
      for (const cell of raw) {
        if (!cell.text && cell.images.length) {
          if (cells.length) cells[cells.length - 1].images.push(...cell.images);
          else cells.push(cell);
          continue;
        }
        cells.push(cell);
      }
      if (cells.some((c) => c.text || c.images.length)) rows.push(cells);
    }
    if (rows.length) tables.push(rows);
  }
  return tables;
}

function slugify(value) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function normHeader(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function headerIndex(headers, aliases) {
  for (const alias of aliases) {
    const i = headers.findIndex((h) => h === alias || h.includes(alias));
    if (i >= 0) return i;
  }
  return -1;
}

function parseYear(value) {
  if (!value) return 0;
  if (/2010s/i.test(value)) return 2010;
  const c = value.match(/c\.?\s*(19|20)\d{2}/i);
  if (c) return Number((c[0].match(/(19|20)\d{2}/) || [])[0]);
  const years = [...String(value).matchAll(/(19|20)\d{2}/g)].map((m) => Number(m[0]));
  if (!years.length) {
    if (/early 2000s/i.test(value)) return 2002;
    if (/late 1990s/i.test(value)) return 1998;
    return 0;
  }
  return years[0];
}

function parsePieces(value) {
  if (!value) return "";
  return value.replace(/\s+/g, " ").trim();
}

function parsePiecesNumber(value) {
  if (!value) return 0;
  if (/not (published|announced|limited)|standard production|current model|needs verification/i.test(value)) return 0;
  const n = Number(String(value).replace(/,/g, "").match(/\d+/)?.[0] || "");
  if (!Number.isFinite(n) || n <= 0 || n >= 100000) return 0;
  if (n >= 1900 && n <= 2035) return 0;
  return n;
}

function parsePrice(value) {
  if (!value) return 0;
  const nums = [...String(value).matchAll(/\$?\s*([0-9]{1,3}(?:,[0-9]{3})+|[0-9]{4,})/g)].map((m) =>
    Number(m[1].replace(/,/g, ""))
  );
  const usable = nums.filter((n) => n >= 500 && n < 500000);
  return usable[0] || 0;
}

function cleanRef(text) {
  if (!text) return "";
  let t = text.replace(/\s+/g, " ").trim();
  if (/^n\/?a$/i.test(t) || /^various$/i.test(t)) return "";
  t = t.replace(/^(ref\.?|likely|exact ref\. unconfirmed)\s*/i, "");
  const found = t.match(/[A-Z]{1,4}[0-9]{4,}[A-Z0-9/]*/i);
  if (!found) return "";
  return found[0].replace(/\/$/, "");
}

function collectionFromName(name) {
  const n = name.toLowerCase();
  if (n.includes("navitimer") || n.includes("old navitimer")) return "Navitimer";
  if (n.includes("chronomat")) return "Chronomat";
  if (n.includes("top time")) return "Top Time";
  if (n.includes("superocean")) return "Superocean";
  if (n.includes("avenger")) return "Avenger";
  if (n.includes("endurance")) return "Endurance Pro";
  if (n.includes("premier")) return "Premier";
  if (n.includes("bentley")) return "Bentley";
  if (n.includes("transocean")) return "Transocean";
  if (/\bavi\b|co-pilot/i.test(n)) return "AVI";
  return "Limited Edition";
}

function displayName(model) {
  const trimmed = model.replace(/^breitling\s+/i, "").replace(/\s+erence.*$/i, "").trim();
  return `Breitling ${trimmed}`;
}

function skipModel(name, pieces) {
  if (!name) return true;
  if (name.length < 6) return true;
  if (JUNK_NAME.test(name)) return true;
  if (/^chronomat$/i.test(name) || /^navitimer$/i.test(name)) return true;
  if (/standard production/i.test(pieces)) return true;
  if (/not limited \(current model\)/i.test(pieces)) return true;
  return false;
}

function customerNote(text) {
  if (!text) return "";
  return text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !INTERNAL.test(sentence) && !/^found 1 on/i.test(sentence))
    .join(" ")
    .trim();
}

function looksLikeHeaderRow(cells) {
  const joined = cells.map((c) => normHeader(c.text)).join(" ");
  if (/\bmodel\b/.test(joined) && (/\breference\b/.test(joined) || /\byear\b/.test(joined) || /\bpieces\b/.test(joined)))
    return true;
  if (joined.includes("estimated market") || joined.includes("estimated value")) return true;
  if (/\bpiece\b/.test(joined) && joined.includes("ref")) return true;
  return false;
}

function skipTable(headers) {
  const joined = headers.join(" | ");
  if (headers.includes("model") && headers.includes("production") && headers.length <= 2) return true;
  if (joined.includes("bulk purchase") || joined.includes("good for navitimer")) return true;
  if (joined.includes("japanese market") || joined.includes("atlas rarity")) return true;
  if (joined.includes("searchable") || joined.includes("limitededition")) return true;
  if (headers.includes("source") && headers.includes("type")) return true;
  return false;
}

const CHRONOMAT_HEADERS = [
  "model",
  "movement",
  "reference",
  "year",
  "pieces",
  "material",
  "estimated market value usd",
  "source",
  "notes",
  "listing note"
];

const catalog = new Map();

function nameKey(name, material = "") {
  const n = slugify(name.replace(/^breitling\s+/i, "").replace(/\([^)]*\)/g, ""));
  const m = slugify(material).split("-")[0];
  return `name-${n}${m ? `-${m}` : ""}`;
}

function keyFor(item) {
  const ref = slugify((item.referenceNumber || "").split("/")[0]);
  if (ref && ref.length >= 5 && !["various", "na", "n-a"].includes(ref)) return `ref-${ref}`;
  return nameKey(item.name, item.material);
}

function merge(item) {
  const key = keyFor(item);
  let existing = catalog.get(key);
  if (!existing) {
    const nameOnly = nameKey(item.name, item.material);
    existing = catalog.get(nameOnly);
    if (existing && (!existing.referenceNumber || !item.referenceNumber)) {
      catalog.delete(nameOnly);
    } else {
      existing = null;
    }
  }
  if (!existing) {
    catalog.set(key, item);
    return;
  }
  existing.images = [...new Set([...existing.images, ...item.images])];
  if (item.referenceNumber && item.referenceNumber.length > (existing.referenceNumber || "").length) {
    existing.referenceNumber = item.referenceNumber;
  }
  if (item.year && (!existing.year || existing.year === new Date().getFullYear())) existing.year = item.year;
  if (item.priceUsd && !existing.priceUsd) existing.priceUsd = item.priceUsd;
  if (item.productionQuantity && !existing.productionQuantity) existing.productionQuantity = item.productionQuantity;
  if (item.material && !existing.material) existing.material = item.material;
  if (item.listingPrice) existing.listingPrice = item.listingPrice;
  if (item.listingNote) existing.listingNote = item.listingNote;
  if (item.description && item.description.length > existing.description.length) existing.description = item.description;
  catalog.set(keyFor(existing), existing);
}

function processRows(headers, rows) {
  if (skipTable(headers)) return;

  const iModel = headerIndex(headers, ["model", "piece", "watch"]);
  const iRef = headerIndex(headers, ["reference if known", "ref likely ref", "reference", "ref"]);
  const iYear = headerIndex(headers, ["year"]);
  const iMaterial = headerIndex(headers, ["material"]);
  const iPieces = headerIndex(headers, ["pieces made", "pieces", "edition", "production"]);
  const iNotes = headerIndex(headers, ["why it s unique", "listing note", "notes", "why its unique"]);
  const iValue = headerIndex(headers, [
    "estimated market value usd",
    "estimated market value",
    "estimated value range usd",
    "estimated value range",
    "suggested retail price"
  ]);
  const iCollection = headerIndex(headers, ["collection"]);
  const iSellers = headerIndex(headers, ["how sellers may list it"]);
  const iLastPrice = headerIndex(headers, ["last public price found"]);
  const iListingNote = headerIndex(headers, ["listing note"]);

  if (iModel < 0) return;

  for (const row of rows) {
    const modelCell = row[iModel] || { text: "", images: [] };
    let name = modelCell.text.replace(/^\d+\s+/, "").trim();
    if (!name || INTERNAL.test(name) || skipModel(name, "")) continue;
    if (/^#+$/.test(name)) continue;

    const refText = iRef >= 0 ? row[iRef]?.text || "" : "";
    const yearText = iYear >= 0 ? row[iYear]?.text || "" : "";
    const material = iMaterial >= 0 ? row[iMaterial]?.text || "" : "";
    const piecesRaw = iPieces >= 0 ? row[iPieces]?.text || "" : "";
    const pieces = parsePieces(piecesRaw);
    const notes = [iNotes >= 0 ? row[iNotes]?.text || "" : "", iListingNote >= 0 ? row[iListingNote]?.text || "" : ""]
      .filter(Boolean)
      .join(" ");
    const sellers = iSellers >= 0 ? row[iSellers]?.text || "" : "";
    const collectionText = iCollection >= 0 ? row[iCollection]?.text || "" : "";
    const valueText = iValue >= 0 ? row[iValue]?.text || "" : "";
    const lastPrice = iLastPrice >= 0 ? row[iLastPrice]?.text || "" : "";

    if (skipModel(name, pieces)) continue;
    if (/breitling cal|breiting b01|^automatic/i.test(name)) continue;

    const listingMatch = notes.match(/(?:we can list that one at|list(?:ing)? price should be)\s*\$?\s*([\d,]+)|\$\s*(6,?999|22,?500)/i);
    const listingPrice = listingMatch ? parsePrice(listingMatch[0]) : 0;
    const images = row.flatMap((c) => c.images);
    const referenceNumber = cleanRef(refText);
    const year = parseYear(yearText);
    const priceUsd = listingPrice || parsePrice(valueText) || parsePrice(lastPrice);
    const piecesNum = parsePiecesNumber(pieces);

    const bits = [
      `${displayName(name)}${referenceNumber ? ` (Ref. ${referenceNumber})` : ""}.`,
      material ? `${material}.` : "",
      piecesNum
        ? `Limited edition — ${piecesNum.toLocaleString()} pieces worldwide.`
        : pieces && !/not (published|announced)/i.test(pieces)
          ? `Limited edition (${pieces}).`
          : "Limited edition.",
      customerNote(notes),
      sellers ? `Also listed as: ${sellers}.` : ""
    ].filter(Boolean);

    merge({
      name: displayName(name),
      brand: "Breitling",
      referenceNumber,
      collection:
        collectionText && !/^n\/?a$/i.test(collectionText) && !/breitling cal|b01/i.test(collectionText)
          ? collectionText
          : collectionFromName(name),
      year,
      priceUsd,
      listingPrice,
      listingNote: customerNote(notes.match(/out of stock.*|allow \d+.*/i)?.[0] || ""),
      productionQuantity: piecesNum ? String(piecesNum) : pieces,
      material,
      images,
      description: bits.join(" ")
    });
  }
}

function processTable(rows) {
  if (!rows.length) return;
  if (looksLikeHeaderRow(rows[0])) {
    processRows(
      rows[0].map((c) => normHeader(c.text)),
      rows.slice(1)
    );
    return;
  }

  const first = rows[0].map((c) => c.text);
  const looksLikeWatch =
    /navitimer|chronomat|superocean|avenger|premier|top time|endurance|avi |bentley|transocean/i.test(first[0] || "") &&
    !/^#+$/.test(first[0] || "");
  if (looksLikeWatch) {
    processRows(CHRONOMAT_HEADERS.slice(0, rows[0].length), rows);
    return;
  }

  if (/^\d+$/.test((first[0] || "").trim())) {
    processRows(["#", "model", "reference", "pieces", "material", "notes"].slice(0, rows[0].length), rows);
  }
}

for (const file of FILES) {
  const xml = fs.readFileSync(path.join(TMP, file.xml), "utf8");
  const rels = parseRels(fs.readFileSync(path.join(TMP, file.rels), "utf8"));
  const tables = extractTables(xml, rels, file.key);
  console.log(file.key, "tables", tables.length);
  for (const table of tables) processTable(table);
}

const OVERRIDES = [
  {
    test: (item) => /time place 25/i.test(item.name),
    priceUsd: 22500,
    callForPricing: false,
    availabilityNote: "Out of Stock. Full set. Allow 35 days for delivery."
  },
  {
    test: (item) => /new york jets/i.test(item.name),
    priceUsd: 6999,
    callForPricing: false,
    availabilityNote: "Out of Stock. Allow 60–90 days for delivery."
  }
];

function inferYear(item) {
  if (item.year) return item.year;
  if (/old navitimer|1461|pluton/i.test(item.name)) return 2000;
  return 2020;
}

const listings = [...catalog.values()]
  .filter((item) => !JUNK_NAME.test(item.name) && item.name.length < 120)
  .map((item) => {
    const override = OVERRIDES.find((o) => o.test(item));
    const piecesNum = parsePiecesNumber(item.productionQuantity);
    const isQpRattrapante = /rattrapante/i.test(item.name) && /qp/i.test(item.name);
    const isUltraRare = isQpRattrapante || /p4622c2b/i.test(item.referenceNumber) || (piecesNum > 0 && piecesNum <= 25);
    let callForPricing = Boolean(isUltraRare && !override);
    let priceUsd = override?.priceUsd || item.listingPrice || item.priceUsd;
    let availabilityNote =
      override?.availabilityNote ||
      (callForPricing ? "Out of Stock. Call for Pricing" : "Not in Stock — Estimated Delivery 3–4 Weeks");
    if (override) callForPricing = false;
    if (!priceUsd && !callForPricing) {
      callForPricing = true;
      availabilityNote = "Out of Stock. Call for Pricing";
    }
    const year = inferYear(item);
    const slug = slugify(
      ["breitling", item.name.replace(/^breitling\s+/i, ""), item.referenceNumber].filter(Boolean).join(" ")
    );
    return {
      slug,
      name: item.name,
      brand: "Breitling",
      referenceNumber: item.referenceNumber || "",
      collection: item.collection || "Limited Edition",
      year,
      priceUsd: callForPricing ? 0 : priceUsd,
      condition: year <= 2006 ? "Very Good" : "Excellent",
      category: year <= 2006 ? "vintage" : "shop",
      inStock: false,
      availabilityNote,
      callForPricing,
      limitedEdition: true,
      productionQuantity: item.productionQuantity || "",
      description: item.description,
      images: item.images,
      published: true
    };
  });

listings.sort((a, b) => a.name.localeCompare(b.name));
fs.mkdirSync(path.dirname(OUT_JSON), { recursive: true });
fs.writeFileSync(OUT_JSON, JSON.stringify(listings, null, 2));
console.log("listings", listings.length);
console.log("with images", listings.filter((l) => l.images.length).length);
console.log("call for pricing", listings.filter((l) => l.callForPricing).length);
console.log("priced", listings.filter((l) => l.priceUsd > 0).length);
const jets = listings.filter((l) => /jets|time place|blackbird|jet team/i.test(l.name));
console.log("specials", jets.map((l) => `${l.name} $${l.priceUsd} ${l.availabilityNote}`));
