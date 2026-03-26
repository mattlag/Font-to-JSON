function Ji(t) {
  const { header: n, tables: e } = t, o = ea(e), i = sa(e), s = { font: o, glyphs: i }, r = ra(e, i);
  r.length > 0 && (s.kerning = r), e.fvar && (s.axes = aa(e), s.instances = ca(e));
  const a = {};
  return e.GPOS && !e.GPOS._raw && (a.GPOS = e.GPOS), e.GSUB && !e.GSUB._raw && (a.GSUB = e.GSUB), e.GDEF && !e.GDEF._raw && (a.GDEF = e.GDEF), Object.keys(a).length > 0 && (s.features = a), e.gasp && !e.gasp._raw && e.gasp.gaspRanges && (s.gasp = e.gasp.gaspRanges.map((c) => ({
    maxPPEM: c.rangeMaxPPEM,
    behavior: c.rangeGaspBehavior
  }))), e["cvt "] && !e["cvt "]._raw && e["cvt "].values && (s.cvt = e["cvt "].values), e.fpgm && !e.fpgm._raw && e.fpgm.instructions && (s.fpgm = e.fpgm.instructions), e.prep && !e.prep._raw && e.prep.instructions && (s.prep = e.prep.instructions), s.tables = { ...e }, s._header = n, s;
}
const na = {
  0: "copyright",
  1: "familyName",
  2: "styleName",
  3: "uniqueID",
  4: "fullName",
  5: "version",
  6: "postScriptName",
  7: "trademark",
  8: "manufacturer",
  9: "designer",
  10: "description",
  11: "vendorURL",
  12: "designerURL",
  13: "license",
  14: "licenseURL",
  19: "sampleText"
};
function Ln(t, n) {
  if (!t || !t.names) return;
  const e = t.names.filter((r) => r.nameID === n);
  if (e.length === 0) return;
  const o = e.find(
    (r) => r.platformID === 3 && r.encodingID === 1 && r.languageID === 1033
  );
  if (o) return o.value;
  const i = e.find((r) => r.platformID === 0);
  if (i) return i.value;
  const s = e.find(
    (r) => r.platformID === 1 && r.encodingID === 0 && r.languageID === 0
  );
  return s ? s.value : e[0].value;
}
function ea(t) {
  const n = t.name, e = t.head, o = t.hhea, i = t["OS/2"], s = t.post, r = {};
  for (const [a, c] of Object.entries(na)) {
    const f = Ln(n, Number(a));
    f !== void 0 && f.trim() !== "" && (r[c] = f);
  }
  return e && !e._raw && (r.unitsPerEm = e.unitsPerEm, r.created = Ao(e.created), r.modified = Ao(e.modified)), o && !o._raw && (r.ascender = o.ascender, r.descender = o.descender, r.lineGap = o.lineGap), s && !s._raw && (r.italicAngle = s.italicAngle, r.underlinePosition = s.underlinePosition, r.underlineThickness = s.underlineThickness, r.isFixedPitch = s.isFixedPitch !== 0), i && !i._raw && (r.weightClass = i.usWeightClass, r.widthClass = i.usWidthClass, r.fsType = i.fsType, r.fsSelection = i.fsSelection, r.achVendID = i.achVendID, i.panose && (r.panose = i.panose)), r;
}
function oa(t) {
  const n = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return n;
  for (const e of t.subtables)
    switch (e.format) {
      case 0:
        for (let o = 0; o < e.glyphIdArray.length; o++) {
          const i = e.glyphIdArray[o];
          i !== 0 && $t(n, i, o);
        }
        break;
      case 4:
        for (const o of e.segments)
          for (let i = o.startCode; i <= o.endCode; i++) {
            let s;
            if (o.idRangeOffset === 0)
              s = i + o.idDelta & 65535;
            else {
              const r = o.idRangeOffset / 2 + (i - o.startCode) - (e.segments.length - e.segments.indexOf(o));
              s = e.glyphIdArray[r], s !== void 0 && s !== 0 && (s = s + o.idDelta & 65535);
            }
            s !== void 0 && s !== 0 && $t(n, s, i);
          }
        break;
      case 6:
        for (let o = 0; o < e.glyphIdArray.length; o++) {
          const i = e.glyphIdArray[o];
          i !== 0 && $t(n, i, e.firstCode + o);
        }
        break;
      case 12:
        for (const o of e.groups)
          for (let i = o.startCharCode; i <= o.endCharCode; i++) {
            const s = o.startGlyphID + (i - o.startCharCode);
            s !== 0 && $t(n, s, i);
          }
        break;
      case 13:
        for (const o of e.groups)
          for (let i = o.startCharCode; i <= o.endCharCode; i++)
            o.glyphID !== 0 && $t(n, o.glyphID, i);
        break;
    }
  return n;
}
function $t(t, n, e) {
  t.has(n) || t.set(n, []);
  const o = t.get(n);
  o.includes(e) || o.push(e);
}
function ia(t, n) {
  if (t.post && !t.post._raw && t.post.glyphNames && t.post.glyphNames.length > 0)
    return t.post.glyphNames;
  if (t["CFF "] && !t["CFF "]._raw) {
    const o = t["CFF "];
    if (o.fonts && o.fonts[0] && o.fonts[0].charset)
      return [".notdef", ...o.fonts[0].charset];
  }
  const e = [];
  for (let o = 0; o < n; o++)
    e.push(o === 0 ? ".notdef" : `glyph${o}`);
  return e;
}
function sa(t) {
  const n = t.glyf && !t.glyf._raw, e = t["CFF "] && !t["CFF "]._raw, o = t.hmtx && !t.hmtx._raw ? t.hmtx : null, i = t.vmtx && !t.vmtx._raw ? t.vmtx : null, s = t.hhea && !t.hhea._raw ? t.hhea : null, r = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : n ? a = t.glyf.glyphs.length : e ? a = t["CFF "].fonts[0].charStrings.length : o && (a = o.hMetrics.length + (o.leftSideBearings?.length || 0));
  const c = s ? s.numberOfHMetrics : a, f = r ? r.numOfLongVerMetrics : 0, u = oa(t.cmap), l = ia(t, a), g = [];
  for (let p = 0; p < a; p++) {
    const h = {};
    l[p] && (h.name = l[p]);
    const d = u.get(p) || [];
    if (d.length === 1 ? h.unicode = d[0] : d.length > 1 ? (h.unicode = d[0], h.unicodes = d) : h.unicode = null, o && (p < c ? (h.advanceWidth = o.hMetrics[p].advanceWidth, h.leftSideBearing = o.hMetrics[p].lsb) : (h.advanceWidth = o.hMetrics[c - 1].advanceWidth, h.leftSideBearing = o.leftSideBearings[p - c])), i && (p < f ? (h.advanceHeight = i.vMetrics[p].advanceHeight, h.topSideBearing = i.vMetrics[p].topSideBearing) : i.topSideBearings && (h.advanceHeight = i.vMetrics[f - 1].advanceHeight, h.topSideBearing = i.topSideBearings[p - f])), n) {
      const x = t.glyf.glyphs[p];
      x && x.type === "simple" ? (h.contours = x.contours, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions)) : x && x.type === "composite" && (h.components = x.components, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions));
    }
    if (e) {
      const x = t["CFF "].fonts[0].charStrings;
      x[p] && (h.charString = x[p]);
    }
    g.push(h);
  }
  return g;
}
function ra(t, n) {
  const e = t.kern;
  if (!e || e._raw || !e.subtables) return [];
  const o = [];
  for (const i of e.subtables)
    if (i.format === 0 && i.pairs)
      for (const s of i.pairs) {
        const r = n[s.left]?.name || `glyph${s.left}`, a = n[s.right]?.name || `glyph${s.right}`;
        o.push({
          left: r,
          right: a,
          value: s.value
        });
      }
  return o;
}
function aa(t) {
  const n = t.fvar;
  return !n || n._raw || !n.axes ? [] : n.axes.map((e) => ({
    tag: e.axisTag,
    name: Ln(t.name, e.axisNameID) || e.axisTag,
    min: e.minValue,
    default: e.defaultValue,
    max: e.maxValue,
    hidden: (e.flags & 1) !== 0
  }));
}
function ca(t) {
  const n = t.fvar;
  if (!n || n._raw || !n.instances) return [];
  const e = n.axes;
  return n.instances.map((o) => {
    const i = {};
    for (let r = 0; r < e.length; r++)
      i[e[r].axisTag] = o.coordinates[r];
    const s = {
      name: Ln(t.name, o.subfamilyNameID) || `Instance ${o.subfamilyNameID}`,
      coordinates: i
    };
    if (o.postScriptNameID !== void 0) {
      const r = Ln(t.name, o.postScriptNameID);
      r && (s.postScriptName = r);
    }
    return s;
  });
}
const Qi = Date.UTC(1904, 0, 1, 0, 0, 0);
function Ao(t) {
  if (t == null) return;
  const n = typeof t == "bigint" ? t : BigInt(t);
  if (n === 0n) return;
  const e = Number(n) * 1e3 + Qi;
  if (!(!Number.isFinite(e) || e < -864e13 || e > 864e13))
    return new Date(e).toISOString();
}
function bo(t) {
  if (!t) return 0n;
  const n = Date.parse(t);
  return isNaN(n) ? 0n : BigInt(Math.floor((n - Qi) / 1e3));
}
function fa(t) {
  const { font: n, glyphs: e } = t, o = e.some((a) => a.charString), i = ua(e, n), s = {};
  if (s.head = ha(n, i), s.hhea = ga(n, i, e.length), s.maxp = pa(e, o), s["OS/2"] = da(n, i), s.name = ma(n), s.post = xa(n, e), s.cmap = wa(e), s.hmtx = va(e), o ? s["CFF "] = ba(n, e) : (s.glyf = Aa(e), s.loca = { offsets: [] }), t.kerning && t.kerning.length > 0 && (s.kern = Ca(t.kerning, e)), t.axes && t.axes.length > 0 && (s.fvar = Oa(t, s.name)), t.gasp && (s.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((a) => ({
      rangeMaxPPEM: a.maxPPEM,
      rangeGaspBehavior: a.behavior
    }))
  }), t.cvt && (s["cvt "] = { values: t.cvt }), t.fpgm && (s.fpgm = { instructions: t.fpgm }), t.prep && (s.prep = { instructions: t.prep }), t.features && (t.features.GPOS && (s.GPOS = t.features.GPOS), t.features.GSUB && (s.GSUB = t.features.GSUB), t.features.GDEF && (s.GDEF = t.features.GDEF)), t.tables)
    for (const [a, c] of Object.entries(t.tables))
      s[a] || (s[a] = c);
  let r;
  if (t._header)
    r = { ...t._header, numTables: Object.keys(s).length };
  else {
    const a = Object.keys(s).length, c = Math.floor(Math.log2(a)), f = Math.pow(2, c) * 16, u = a * 16 - f;
    r = {
      sfVersion: o ? 1330926671 : 65536,
      numTables: a,
      searchRange: f,
      entrySelector: c,
      rangeShift: u
    };
  }
  return { header: r, tables: s };
}
function ua(t, n) {
  let e = 1 / 0, o = 1 / 0, i = -1 / 0, s = -1 / 0, r = 0, a = 0, c = 1 / 0, f = 1 / 0, u = -1 / 0, l = 65535, g = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > r && (r = m);
    const y = io(x);
    if (y) {
      y.xMin < e && (e = y.xMin), y.yMin < o && (o = y.yMin), y.xMax > i && (i = y.xMax), y.yMax > s && (s = y.yMax);
      const w = x.leftSideBearing ?? y.xMin, v = m - (w + (y.xMax - y.xMin)), b = w + (y.xMax - y.xMin);
      w < c && (c = w), v < f && (f = v), b > u && (u = b);
    }
    const _ = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const w of _)
      w < l && (l = w), w > g && (g = w), p.add(w);
  }
  e === 1 / 0 && (e = 0), o === 1 / 0 && (o = 0), i === -1 / 0 && (i = 0), s === -1 / 0 && (s = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), u === -1 / 0 && (u = 0), l === 65535 && (l = 0), g === 0 && (g = 0);
  const h = ko(
    t,
    "xyvw",
    n.ascender ? Math.round(n.ascender / 2) : 0
  ), d = ko(
    t,
    "HIKLEFJMNTZBDPRAGOQSUVWXY",
    s
  );
  return {
    xMin: e,
    yMin: o,
    xMax: i,
    yMax: s,
    advanceWidthMax: r,
    advanceWidthAvg: t.length > 0 ? Math.round(a / t.length) : 0,
    minLSB: c,
    minRSB: f,
    maxExtent: u,
    firstCharIndex: Math.min(l, 65535),
    lastCharIndex: Math.min(g, 65535),
    sxHeight: h,
    sCapHeight: d,
    unicodeRanges: p
  };
}
function io(t) {
  if (t.contours && t.contours.length > 0) {
    let n = 1 / 0, e = 1 / 0, o = -1 / 0, i = -1 / 0;
    for (const s of t.contours)
      for (const r of s)
        r.x < n && (n = r.x), r.y < e && (e = r.y), r.x > o && (o = r.x), r.y > i && (i = r.y);
    return { xMin: n, yMin: e, xMax: o, yMax: i };
  }
  return null;
}
function ko(t, n, e) {
  for (const o of n) {
    const i = o.charCodeAt(0), s = t.find((r) => (r.unicodes || (r.unicode ? [r.unicode] : [])).includes(i));
    if (s) {
      const r = io(s);
      if (r) return r.yMax;
    }
  }
  return e || 0;
}
function la(t) {
  const n = [0, 0, 0, 0], e = [
    // [bitPosition (0-127), rangeStart, rangeEnd]
    [0, 32, 126],
    // Basic Latin
    [1, 128, 255],
    // Latin-1 Supplement
    [2, 256, 383],
    // Latin Extended-A
    [3, 384, 591],
    // Latin Extended-B
    [7, 880, 1023],
    // Greek
    [9, 1024, 1279],
    // Cyrillic
    [10, 1328, 1423],
    // Armenian
    [11, 1424, 1535],
    // Hebrew
    [13, 1536, 1791],
    // Arabic
    [24, 3584, 3711],
    // Thai
    [28, 4352, 4607],
    // Hangul Jamo
    [30, 7680, 7935],
    // Latin Extended Additional
    [31, 7936, 8191],
    // Greek Extended
    [32, 8192, 8303],
    // General Punctuation
    [33, 8304, 8351],
    // Superscripts and Subscripts
    [34, 8352, 8399],
    // Currency Symbols
    [35, 8400, 8447],
    // Combining Diacritical Marks for Symbols
    [36, 8448, 8527],
    // Letterlike Symbols
    [37, 8528, 8591],
    // Number Forms
    [38, 8592, 8703],
    // Arrows
    [39, 8704, 8959],
    // Mathematical Operators
    [40, 8960, 9215],
    // Miscellaneous Technical
    [42, 9472, 9599],
    // Box Drawing
    [43, 9600, 9631],
    // Block Elements
    [44, 9632, 9727],
    // Geometric Shapes
    [45, 9728, 9983],
    // Miscellaneous Symbols
    [46, 9984, 10175],
    // Dingbats
    [48, 12288, 12351],
    // CJK Symbols and Punctuation
    [49, 12352, 12447],
    // Hiragana
    [50, 12448, 12543],
    // Katakana
    [52, 12544, 12591],
    // Bopomofo
    [56, 44032, 55215],
    // Hangul Syllables
    [57, 55296, 57343],
    // Surrogates (should not appear)
    [59, 19968, 40959],
    // CJK Unified Ideographs
    [60, 57344, 63743],
    // Private Use Area
    [62, 65056, 65071],
    // Combining Half Marks
    [69, 64336, 65023],
    // Arabic Presentation Forms-A
    [70, 65136, 65279],
    // Arabic Presentation Forms-B
    [78, 65280, 65519]
    // Halfwidth and Fullwidth Forms
  ];
  for (const [o, i, s] of e)
    for (const r of t)
      if (r >= i && r <= s) {
        const a = Math.floor(o / 32);
        n[a] |= 1 << o % 32;
        break;
      }
  return n;
}
function ha(t, n) {
  const e = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let i = 0;
  return e && (i |= 1), o && (i |= 2), {
    majorVersion: 1,
    minorVersion: 0,
    fontRevision: 1,
    checksumAdjustment: 0,
    // will be overwritten by export
    magicNumber: 1594834165,
    flags: 11,
    // baseline at y=0, lsb at x=0, instructions may alter advance
    unitsPerEm: t.unitsPerEm,
    created: bo(t.created),
    modified: bo(t.modified),
    xMin: n.xMin,
    yMin: n.yMin,
    xMax: n.xMax,
    yMax: n.yMax,
    macStyle: i,
    lowestRecPPEM: 8,
    fontDirectionHint: 2,
    indexToLocFormat: 0,
    // coordinated by export.js for glyf/loca
    glyphDataFormat: 0
  };
}
function ga(t, n, e) {
  return {
    majorVersion: 1,
    minorVersion: 0,
    ascender: t.ascender || 0,
    descender: t.descender || 0,
    lineGap: t.lineGap || 0,
    advanceWidthMax: n.advanceWidthMax,
    minLeftSideBearing: n.minLSB,
    minRightSideBearing: n.minRSB,
    xMaxExtent: n.maxExtent,
    caretSlopeRise: 1,
    caretSlopeRun: 0,
    caretOffset: 0,
    reserved1: 0,
    reserved2: 0,
    reserved3: 0,
    reserved4: 0,
    metricDataFormat: 0,
    numberOfHMetrics: e
  };
}
function pa(t, n) {
  if (n)
    return {
      version: 20480,
      numGlyphs: t.length
    };
  let e = 0, o = 0, i = 0, s = 0, r = 0, a = 0, c = 0;
  for (const f of t) {
    if (f.contours) {
      let u = 0;
      for (const l of f.contours)
        u += l.length;
      u > e && (e = u), f.contours.length > o && (o = f.contours.length);
    }
    f.components && (f.components.length > r && (r = f.components.length), 1 > a && (a = 1)), f.instructions && f.instructions.length > c && (c = f.instructions.length);
  }
  return {
    version: 65536,
    numGlyphs: t.length,
    maxPoints: e,
    maxContours: o,
    maxCompositePoints: i,
    maxCompositeContours: s,
    maxZones: 2,
    maxTwilightPoints: 0,
    maxStorage: 0,
    maxFunctionDefs: 0,
    maxInstructionDefs: 0,
    maxStackElements: 0,
    maxSizeOfInstructions: c,
    maxComponentElements: r,
    maxComponentDepth: a
  };
}
function da(t, n) {
  const e = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let i = t.fsSelection;
  i === void 0 && (i = 0, e && (i |= 32), o && (i |= 1), !e && !o && (i |= 64));
  const s = la(n.unicodeRanges), r = n.unicodeRanges.has(32);
  return {
    version: 4,
    xAvgCharWidth: n.advanceWidthAvg,
    usWeightClass: t.weightClass || 400,
    usWidthClass: t.widthClass || 5,
    fsType: t.fsType || 0,
    ySubscriptXSize: Math.round((t.unitsPerEm || 1e3) * 0.65),
    ySubscriptYSize: Math.round((t.unitsPerEm || 1e3) * 0.6),
    ySubscriptXOffset: 0,
    ySubscriptYOffset: Math.round((t.unitsPerEm || 1e3) * 0.075),
    ySuperscriptXSize: Math.round((t.unitsPerEm || 1e3) * 0.65),
    ySuperscriptYSize: Math.round((t.unitsPerEm || 1e3) * 0.6),
    ySuperscriptXOffset: 0,
    ySuperscriptYOffset: Math.round((t.unitsPerEm || 1e3) * 0.35),
    yStrikeoutSize: Math.round((t.unitsPerEm || 1e3) * 0.05),
    yStrikeoutPosition: Math.round((t.unitsPerEm || 1e3) * 0.3),
    sFamilyClass: 0,
    panose: t.panose || [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    ulUnicodeRange1: s[0],
    ulUnicodeRange2: s[1],
    ulUnicodeRange3: s[2],
    ulUnicodeRange4: s[3],
    achVendID: t.achVendID || "XXXX",
    fsSelection: i,
    usFirstCharIndex: n.firstCharIndex,
    usLastCharIndex: n.lastCharIndex,
    sTypoAscender: t.ascender || 0,
    sTypoDescender: t.descender || 0,
    sTypoLineGap: t.lineGap || 0,
    usWinAscent: n.yMax > 0 ? n.yMax : t.ascender || 0,
    usWinDescent: n.yMin < 0 ? Math.abs(n.yMin) : 0,
    ulCodePageRange1: 1,
    ulCodePageRange2: 0,
    sxHeight: n.sxHeight,
    sCapHeight: n.sCapHeight,
    usDefaultChar: r ? 32 : 0,
    usBreakChar: r ? 32 : 0,
    usMaxContext: 0
  };
}
function ma(t) {
  const n = [], e = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || ya(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || ts(t),
    7: t.trademark || "",
    8: t.manufacturer || "",
    9: t.designer || "",
    10: t.description || "",
    11: t.vendorURL || "",
    12: t.designerURL || "",
    13: t.license || "",
    14: t.licenseURL || "",
    19: t.sampleText || ""
  };
  for (const [o, i] of Object.entries(e)) {
    const s = Number(o);
    i && (n.push({
      platformID: 3,
      encodingID: 1,
      languageID: 1033,
      nameID: s,
      value: i
    }), n.push({
      platformID: 1,
      encodingID: 0,
      languageID: 0,
      nameID: s,
      value: i
    }), n.push({
      platformID: 0,
      encodingID: 3,
      languageID: 0,
      nameID: s,
      value: i
    }));
  }
  return { version: 0, names: n };
}
function ya(t) {
  const n = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${n}` : n;
}
function ts(t) {
  const n = (t.familyName || "").replace(/\s/g, ""), e = t.styleName || "Regular";
  return `${n}-${e}`;
}
function xa(t, n) {
  const e = t.italicAngle || 0, o = t.underlinePosition || Math.round(-(t.unitsPerEm || 1e3) * 0.1), i = t.underlineThickness || Math.round((t.unitsPerEm || 1e3) * 0.05);
  return {
    version: 131072,
    italicAngle: e,
    underlinePosition: o,
    underlineThickness: i,
    isFixedPitch: t.isFixedPitch ? 1 : 0,
    minMemType42: 0,
    maxMemType42: 0,
    minMemType1: 0,
    maxMemType1: 0,
    glyphNames: n.map((s) => s.name || ".notdef")
  };
}
function wa(t) {
  const n = /* @__PURE__ */ new Map();
  let e = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const u of f)
      n.has(u) || n.set(u, a), u > 65535 && (e = !0);
  }
  const o = [...n.entries()].sort((a, c) => a[0] - c[0]), i = [], s = [];
  if (e) {
    const a = _a(o);
    i.push({ format: 12, language: 0, groups: a }), s.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), s.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const r = o.filter(([a]) => a <= 65535);
  if (r.length > 0) {
    const { segments: a, glyphIdArray: c } = Sa(r), f = i.length;
    i.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), s.push({ platformID: 3, encodingID: 1, subtableIndex: f }), s.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: s, subtables: i };
}
function _a(t) {
  if (t.length === 0) return [];
  const n = [];
  let e = t[0][0], o = t[0][1], i = e, s = o;
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r];
    a === i + 1 && c === s + 1 ? (i = a, s = c) : (n.push({
      startCharCode: e,
      endCharCode: i,
      startGlyphID: o
    }), e = a, o = c, i = a, s = c);
  }
  return n.push({
    startCharCode: e,
    endCharCode: i,
    startGlyphID: o
  }), n;
}
function Sa(t) {
  const n = [], e = [];
  if (t.length === 0)
    return n.push({
      startCode: 65535,
      endCode: 65535,
      idDelta: 1,
      idRangeOffset: 0
    }), { segments: n, glyphIdArray: e };
  let o = t[0][0], i = t[0][1] - t[0][0], s = t[0][0];
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r], f = c - a;
    a === s + 1 && f === i || (n.push({
      startCode: o,
      endCode: s,
      idDelta: i,
      idRangeOffset: 0
    }), o = a, i = f), s = a;
  }
  return n.push({
    startCode: o,
    endCode: s,
    idDelta: i,
    idRangeOffset: 0
  }), n.push({
    startCode: 65535,
    endCode: 65535,
    idDelta: 1,
    idRangeOffset: 0
  }), { segments: n, glyphIdArray: e };
}
function va(t) {
  return { hMetrics: t.map((e) => ({
    advanceWidth: e.advanceWidth || 0,
    lsb: e.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function Aa(t) {
  return { glyphs: t.map((e) => {
    if (e.contours && e.contours.length > 0) {
      const o = io(e);
      return {
        type: "simple",
        xMin: o ? o.xMin : 0,
        yMin: o ? o.yMin : 0,
        xMax: o ? o.xMax : 0,
        yMax: o ? o.yMax : 0,
        contours: e.contours,
        instructions: e.instructions || [],
        overlapSimple: !1
      };
    }
    return e.components && e.components.length > 0 ? {
      type: "composite",
      xMin: 0,
      yMin: 0,
      xMax: 0,
      yMax: 0,
      components: e.components,
      instructions: e.instructions || []
    } : null;
  }) };
}
function ba(t, n) {
  const e = t.postScriptName || ts(t), o = n.slice(1).map((s) => s.name || ".notdef"), i = n.map((s) => s.charString || []);
  return {
    majorVersion: 1,
    minorVersion: 0,
    names: [e],
    strings: [],
    globalSubrs: [],
    fonts: [
      {
        topDict: {
          FullName: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
          FamilyName: t.familyName || "",
          Weight: ka(t.weightClass),
          FontBBox: [
            0,
            t.descender || 0,
            t.unitsPerEm || 1e3,
            t.ascender || 0
          ]
        },
        charset: o,
        encoding: [],
        charStrings: i,
        privateDict: {},
        localSubrs: []
      }
    ]
  };
}
function ka(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function Ca(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (let c = 0; c < n.length; c++)
    n[c].name && e.set(n[c].name, c);
  const o = [];
  for (const c of t) {
    const f = e.get(c.left), u = e.get(c.right);
    f !== void 0 && u !== void 0 && o.push({ left: f, right: u, value: c.value });
  }
  if (o.length === 0) return null;
  const i = o.length, s = Math.floor(Math.log2(i)), r = Math.pow(2, s) * 6, a = i * 6 - r;
  return {
    formatVariant: "opentype",
    version: 0,
    nTables: 1,
    subtables: [
      {
        version: 0,
        coverage: 1,
        format: 0,
        nPairs: i,
        searchRange: r,
        entrySelector: s,
        rangeShift: a,
        pairs: o
      }
    ]
  };
}
function Oa(t, n) {
  const { axes: e, instances: o = [] } = t;
  let i = 256;
  const s = e.map((a) => {
    const c = i++;
    return ae(n, c, a.name || a.tag), {
      axisTag: a.tag,
      minValue: a.min,
      defaultValue: a.default,
      maxValue: a.max,
      flags: a.hidden ? 1 : 0,
      axisNameID: c
    };
  }), r = o.map((a) => {
    const c = i++;
    ae(n, c, a.name);
    const f = e.map((l) => a.coordinates[l.tag] ?? l.default), u = {
      subfamilyNameID: c,
      flags: 0,
      coordinates: f
    };
    if (a.postScriptName) {
      const l = i++;
      ae(n, l, a.postScriptName), u.postScriptNameID = l;
    }
    return u;
  });
  return {
    majorVersion: 1,
    minorVersion: 0,
    reserved: 2,
    axisSize: 20,
    instanceSize: 4 + e.length * 4 + (r.some((a) => a.postScriptNameID !== void 0) ? 2 : 0),
    axes: s,
    instances: r
  };
}
function ae(t, n, e) {
  e && t.names.push(
    { platformID: 3, encodingID: 1, languageID: 1033, nameID: n, value: e },
    { platformID: 1, encodingID: 0, languageID: 0, nameID: n, value: e },
    { platformID: 0, encodingID: 3, languageID: 0, nameID: n, value: e }
  );
}
function Ia(t, n, e = !0) {
  const o = t[n];
  if (o >= 32 && o <= 246)
    return { value: o - 139, bytesConsumed: 1 };
  if (o >= 247 && o <= 250) {
    const i = t[n + 1];
    return { value: (o - 247) * 256 + i + 108, bytesConsumed: 2 };
  }
  if (o >= 251 && o <= 254) {
    const i = t[n + 1];
    return { value: -(o - 251) * 256 - i - 108, bytesConsumed: 2 };
  }
  if (o === 28) {
    const i = t[n + 1] << 8 | t[n + 2];
    return { value: i > 32767 ? i - 65536 : i, bytesConsumed: 3 };
  }
  return o === 29 && e ? { value: t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0, bytesConsumed: 5 } : o === 30 && e ? Da(t, n + 1) : o === 255 && !e ? { value: (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function Da(t, n) {
  const e = [
    "0",
    "1",
    "2",
    "3",
    "4",
    "5",
    "6",
    "7",
    "8",
    "9",
    ".",
    "E",
    "E-",
    "",
    "-",
    ""
  ];
  let o = "", i = n, s = !1;
  for (; !s; ) {
    const a = t[i++], c = a >> 4 & 15, f = a & 15;
    c === 15 ? s = !0 : (o += e[c], f === 15 ? s = !0 : o += e[f]);
  }
  return { value: o === "" || o === "." ? 0 : parseFloat(o), bytesConsumed: 1 + (i - n) };
}
function ns(t) {
  return Number.isInteger(t) ? Ea(t) : Ba(t);
}
function Ea(t) {
  if (t >= -107 && t <= 107)
    return [t + 139];
  if (t >= 108 && t <= 1131) {
    const n = t - 108;
    return [247 + (n >> 8 & 3), n & 255];
  }
  if (t >= -1131 && t <= -108) {
    const n = -t - 108;
    return [251 + (n >> 8 & 3), n & 255];
  }
  return t >= -32768 && t <= 32767 ? [28, t >> 8 & 255, t & 255] : [
    29,
    t >> 24 & 255,
    t >> 16 & 255,
    t >> 8 & 255,
    t & 255
  ];
}
function Ba(t) {
  const n = [30];
  let e = t.toString();
  (e.includes("e") || e.includes("E")) && (e = t.toPrecision(10), e.includes(".") && (e = e.replace(/0+$/, "").replace(/\.$/, "")));
  const o = [];
  for (const i of e)
    switch (i) {
      case "0":
        o.push(0);
        break;
      case "1":
        o.push(1);
        break;
      case "2":
        o.push(2);
        break;
      case "3":
        o.push(3);
        break;
      case "4":
        o.push(4);
        break;
      case "5":
        o.push(5);
        break;
      case "6":
        o.push(6);
        break;
      case "7":
        o.push(7);
        break;
      case "8":
        o.push(8);
        break;
      case "9":
        o.push(9);
        break;
      case ".":
        o.push(10);
        break;
      case "E":
      case "e":
        o.push(11);
        break;
      case "-":
        o.push(14);
        break;
    }
  for (let i = 0; i < o.length - 1; i++)
    o[i] === 11 && o[i + 1] === 14 && o.splice(i, 2, 12);
  o.push(15);
  for (let i = 0; i < o.length; i += 2) {
    const s = o[i], r = i + 1 < o.length ? o[i + 1] : 15;
    n.push(s << 4 | r);
  }
  return n;
}
function Ta(t) {
  return t <= 21 && t !== 28 && t !== 29 && t !== 30;
}
function gt(t, n = 0, e = t.length) {
  const o = [], i = [];
  let s = n;
  for (; s < e; ) {
    const r = t[s];
    if (Ta(r)) {
      let a;
      r === 12 ? (a = 3072 | t[s + 1], s += 2) : (a = r, s += 1), o.push({ operator: a, operands: [...i] }), i.length = 0;
    } else {
      const a = Ia(t, s, !0);
      a === null ? s += 1 : (i.push(a.value), s += a.bytesConsumed);
    }
  }
  return o;
}
function st(t, n) {
  const e = t[n] << 8 | t[n + 1];
  if (e === 0)
    return { items: [], totalBytes: 2 };
  const o = t[n + 2], i = n + 3, s = [];
  for (let f = 0; f <= e; f++) {
    let u = 0;
    const l = i + f * o;
    for (let g = 0; g < o; g++)
      u = u << 8 | t[l + g];
    s.push(u);
  }
  const r = i + (e + 1) * o, a = [];
  for (let f = 0; f < e; f++) {
    const u = r + s[f] - 1, l = r + s[f + 1] - 1;
    a.push(new Uint8Array(Array.prototype.slice.call(t, u, l)));
  }
  const c = r + s[e] - 1 - n;
  return { items: a, totalBytes: c };
}
function wn(t, n) {
  const o = (t[n] << 24 | t[n + 1] << 16 | t[n + 2] << 8 | t[n + 3]) >>> 0;
  if (o === 0)
    return { items: [], totalBytes: 4 };
  const i = t[n + 4], s = n + 5, r = [];
  for (let u = 0; u <= o; u++) {
    let l = 0;
    const g = s + u * i;
    for (let p = 0; p < i; p++)
      l = l << 8 | t[g + p];
    r.push(l >>> 0);
  }
  const a = s + (o + 1) * i, c = [];
  for (let u = 0; u < o; u++) {
    const l = a + r[u] - 1, g = a + r[u + 1] - 1;
    c.push(new Uint8Array(Array.prototype.slice.call(t, l, g)));
  }
  const f = a + r[o] - 1 - n;
  return { items: c, totalBytes: f };
}
function ot(t) {
  const n = t.length;
  if (n === 0)
    return [0, 0];
  const e = [1];
  for (const r of t)
    e.push(e[e.length - 1] + r.length);
  const o = e[e.length - 1];
  let i;
  o <= 255 ? i = 1 : o <= 65535 ? i = 2 : o <= 16777215 ? i = 3 : i = 4;
  const s = [];
  s.push(n >> 8 & 255, n & 255), s.push(i);
  for (const r of e)
    for (let a = i - 1; a >= 0; a--)
      s.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      s.push(r[a]);
  return s;
}
function _n(t) {
  const n = t.length;
  if (n === 0)
    return [0, 0, 0, 0];
  const e = [1];
  for (const r of t)
    e.push(e[e.length - 1] + r.length);
  const o = e[e.length - 1];
  let i;
  o <= 255 ? i = 1 : o <= 65535 ? i = 2 : o <= 16777215 ? i = 3 : i = 4;
  const s = [];
  s.push(
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ), s.push(i);
  for (const r of e)
    for (let a = i - 1; a >= 0; a--)
      s.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      s.push(r[a]);
  return s;
}
const Be = {
  0: "version",
  1: "Notice",
  2: "FullName",
  3: "FamilyName",
  4: "Weight",
  5: "FontBBox",
  13: "UniqueID",
  14: "XUID",
  15: "charset",
  16: "Encoding",
  17: "CharStrings",
  18: "Private",
  // Two-byte operators (12, x)
  3072: "Copyright",
  3073: "isFixedPitch",
  3074: "ItalicAngle",
  3075: "UnderlinePosition",
  3076: "UnderlineThickness",
  3077: "PaintType",
  3078: "CharstringType",
  3079: "FontMatrix",
  3080: "StrokeWidth",
  3092: "SyntheticBase",
  3093: "PostScript",
  3094: "BaseFontName",
  3095: "BaseFontBlend",
  // CIDFont operators
  3102: "ROS",
  3103: "CIDFontVersion",
  3104: "CIDFontRevision",
  3105: "CIDFontType",
  3106: "CIDCount",
  3107: "UIDBase",
  3108: "FDArray",
  3109: "FDSelect",
  3110: "FontName"
}, X = Object.fromEntries(
  Object.entries(Be).map(([t, n]) => [n, Number(t)])
), Te = {
  6: "BlueValues",
  7: "OtherBlues",
  8: "FamilyBlues",
  9: "FamilyOtherBlues",
  10: "StdHW",
  11: "StdVW",
  19: "Subrs",
  20: "defaultWidthX",
  21: "nominalWidthX",
  3081: "BlueScale",
  3082: "BlueShift",
  3083: "BlueFuzz",
  3084: "StemSnapH",
  3085: "StemSnapV",
  3086: "ForceBold",
  3089: "LanguageGroup",
  3090: "ExpansionFactor",
  3091: "initialRandomSeed"
}, Co = Object.fromEntries(
  Object.entries(Te).map(([t, n]) => [n, Number(t)])
), Re = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, Ot = Object.fromEntries(
  Object.entries(Re).map(([t, n]) => [n, Number(t)])
), es = {
  18: "Private"
}, os = {
  6: "BlueValues",
  7: "OtherBlues",
  8: "FamilyBlues",
  9: "FamilyOtherBlues",
  10: "StdHW",
  11: "StdVW",
  19: "Subrs",
  22: "vsindex",
  23: "blend",
  3081: "BlueScale",
  3082: "BlueShift",
  3083: "BlueFuzz",
  3084: "StemSnapH",
  3085: "StemSnapV",
  3089: "LanguageGroup",
  3090: "ExpansionFactor"
};
function pt(t, n) {
  const e = {};
  for (const { operator: o, operands: i } of t) {
    const s = n[o] || `op_${o}`;
    e[s] = i.length === 1 ? i[0] : i;
  }
  return e;
}
function Lt(t, n) {
  const e = [];
  for (const [o, i] of Object.entries(t)) {
    const s = n[o];
    if (s === void 0) continue;
    const r = Array.isArray(i) ? i : [i];
    e.push({ operator: s, operands: r });
  }
  return e;
}
function is(t, n, e) {
  const o = t[n];
  if (o === 0) {
    const i = [];
    for (let s = 0; s < e; s++)
      i.push(t[n + 1 + s]);
    return i;
  }
  if (o === 3) {
    const i = t[n + 1] << 8 | t[n + 2], s = new Array(e);
    let r = n + 3;
    for (let a = 0; a < i; a++) {
      const c = t[r] << 8 | t[r + 1], f = t[r + 2];
      r += 3;
      const u = a < i - 1 ? t[r] << 8 | t[r + 1] : e;
      for (let l = c; l < u; l++)
        s[l] = f;
    }
    return s;
  }
  if (o === 4) {
    const i = (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4]) >>> 0, s = new Array(e);
    let r = n + 5;
    for (let a = 0; a < i; a++) {
      const c = (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0, f = t[r + 4] << 8 | t[r + 5];
      r += 6;
      const u = a < i - 1 ? (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0 : e;
      for (let l = c; l < u; l++)
        s[l] = f;
    }
    return s;
  }
  throw new Error(`Unsupported FDSelect format: ${o}`);
}
function ss(t) {
  const n = [0];
  for (const e of t)
    n.push(e);
  return n;
}
function Ra(t, n, e) {
  if (n === 0) return "ISOAdobe";
  if (n === 1) return "Expert";
  if (n === 2) return "ExpertSubset";
  const o = t[n], i = [];
  if (o === 0)
    for (let s = 1; s < e; s++) {
      const r = t[n + 1 + (s - 1) * 2] << 8 | t[n + 2 + (s - 1) * 2];
      i.push(r);
    }
  else if (o === 1) {
    let s = n + 1;
    for (; i.length < e - 1; ) {
      const r = t[s] << 8 | t[s + 1], a = t[s + 2];
      s += 3;
      for (let c = 0; c <= a && i.length < e - 1; c++)
        i.push(r + c);
    }
  } else if (o === 2) {
    let s = n + 1;
    for (; i.length < e - 1; ) {
      const r = t[s] << 8 | t[s + 1], a = t[s + 2] << 8 | t[s + 3];
      s += 4;
      for (let c = 0; c <= a && i.length < e - 1; c++)
        i.push(r + c);
    }
  }
  return i;
}
function Ma(t) {
  if (typeof t == "string")
    return [];
  const n = [0];
  for (const e of t)
    n.push(e >> 8 & 255, e & 255);
  return n;
}
function La(t, n) {
  if (n === 0) return "Standard";
  if (n === 1) return "Expert";
  const e = t[n] & 127, o = (t[n] & 128) !== 0, i = [];
  if (e === 0) {
    const s = t[n + 1];
    for (let r = 0; r < s; r++)
      i.push(t[n + 2 + r]);
  } else if (e === 1) {
    const s = t[n + 1];
    let r = n + 2;
    for (let a = 0; a < s; a++) {
      const c = t[r], f = t[r + 1];
      r += 2;
      for (let u = 0; u <= f; u++)
        i.push(c + u);
    }
  }
  return { format: e, codes: i, hasSupplement: o };
}
const rs = /* @__PURE__ */ new Set([
  15,
  // charset
  16,
  // Encoding
  17,
  // CharStrings
  18,
  // Private  (size + offset — both forced)
  3108,
  // FDArray
  3109
  // FDSelect
]), Oo = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset from Private start)
]);
function En(t, n) {
  const e = [];
  for (const { operator: o, operands: i } of t) {
    const s = n.has(o);
    for (const r of i)
      s && Number.isInteger(r) ? e.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : e.push(...ns(r));
    o >= 3072 ? e.push(12, o & 255) : e.push(o);
  }
  return e;
}
function Io(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) n.push(t.charCodeAt(e));
  return n;
}
function Do(t) {
  return String.fromCharCode(...t);
}
function za(t, n) {
  const e = new Uint8Array(t), o = e[0], i = e[1];
  let r = e[2];
  const a = st(e, r);
  r += a.totalBytes;
  const c = a.items.map(Do), f = st(e, r);
  r += f.totalBytes;
  const u = st(e, r);
  r += u.totalBytes;
  const l = u.items.map(Do), p = st(e, r).items.map((d) => Array.from(d)), h = f.items.map((d) => Va(e, d));
  return {
    majorVersion: o,
    minorVersion: i,
    names: c,
    strings: l,
    globalSubrs: p,
    fonts: h
  };
}
function Va(t, n) {
  const e = gt(n, 0, n.length), o = pt(e, Be), i = o.CharStrings, s = o.charset ?? 0, r = o.Encoding ?? 0, a = o.Private;
  delete o.CharStrings, delete o.charset, delete o.Encoding, delete o.Private;
  const c = o.FDArray, f = o.FDSelect;
  delete o.FDArray, delete o.FDSelect;
  let u = [];
  i !== void 0 && (u = st(t, i).items.map((v) => Array.from(v)));
  const l = u.length, g = Ra(t, s, l), p = La(t, r);
  let h = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [w, v] = a, b = gt(t, v, v + w);
    h = pt(b, Te), h.Subrs !== void 0 && (d = st(t, v + h.Subrs).items.map((D) => Array.from(D)), delete h.Subrs);
  }
  const x = o.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = st(t, c).items.map((v) => {
    const b = gt(v, 0, v.length), A = pt(b, Be);
    let D = {}, C = [];
    if (Array.isArray(A.Private) && A.Private.length === 2) {
      const [k, O] = A.Private, I = gt(t, O, O + k);
      D = pt(I, Te), D.Subrs !== void 0 && (C = st(t, O + D.Subrs).items.map((F) => Array.from(F)), delete D.Subrs), delete A.Private;
    }
    return {
      fontDict: A,
      privateDict: D,
      localSubrs: C
    };
  })), f !== void 0 && (y = is(t, f, l)));
  const _ = {
    topDict: o,
    charset: g,
    encoding: p,
    charStrings: u,
    privateDict: h,
    localSubrs: d
  };
  return x && (_.isCIDFont = !0, m && (_.fdArray = m), y && (_.fdSelect = y)), _;
}
function Fa(t) {
  const {
    majorVersion: n = 1,
    minorVersion: e = 0,
    names: o = [],
    strings: i = [],
    globalSubrs: s = [],
    fonts: r = []
  } = t, a = [n, e, 4, 4], c = ot(o.map(Io)), f = ot(i.map(Io)), u = ot(
    s.map((_) => new Uint8Array(_))
  ), l = r.map((_) => Pa(_)), g = r.map(
    (_, w) => Eo(
      _,
      l[w],
      /* baseOffset */
      0
    )
  ), p = ot(g);
  let d = a.length + c.length + p.length + f.length + u.length;
  const x = r.map((_, w) => {
    const v = Eo(_, l[w], d);
    return d += l[w].totalSize, v;
  }), m = ot(x);
  if (m.length !== p.length)
    throw new Error(
      "CFF Top DICT INDEX size mismatch — this should not happen with forced int32 offsets"
    );
  const y = [
    ...a,
    ...c,
    ...m,
    ...f,
    ...u
  ];
  for (const _ of l)
    for (const w of _.sections)
      for (let v = 0; v < w.length; v++) y.push(w[v]);
  return y;
}
function Pa(t) {
  const n = [], e = {};
  let o = 0;
  const i = (t.charStrings || []).map((l) => new Uint8Array(l)), s = ot(i);
  e.charStrings = o, n.push(s), o += s.length;
  const r = t.charset;
  if (typeof r == "string")
    e.charset = r === "ISOAdobe" ? 0 : r === "Expert" ? 1 : 2, e.charsetIsPredefined = !0;
  else {
    const l = Ma(r || []);
    e.charset = o, e.charsetIsPredefined = !1, n.push(l), o += l.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    e.encoding = a === "Standard" ? 0 : 1, e.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const l = Ua(a);
    e.encoding = o, e.encodingIsPredefined = !1, n.push(l), o += l.length;
  } else
    e.encoding = 0, e.encodingIsPredefined = !0;
  const c = Lt(
    t.privateDict || {},
    Co
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = ot(
    t.localSubrs.map((l) => new Uint8Array(l))
  )), f) {
    const g = En(
      c,
      Oo
    ).length + 6;
    c.push({
      operator: Co.Subrs,
      operands: [g]
    });
  }
  const u = En(c, Oo);
  if (e.privateOffset = o, e.privateSize = u.length, n.push(u), o += u.length, f && (n.push(f), o += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const l = ss(t.fdSelect);
      e.fdSelect = o, n.push(l), o += l.length;
    }
    if (t.fdArray) {
      const l = t.fdArray.map((p) => {
        const h = Lt(
          p.fontDict || {},
          X
        );
        return En(h, rs);
      }), g = ot(l);
      e.fdArray = o, n.push(g), o += g.length;
    }
  }
  return { sections: n, totalSize: o, offsets: e };
}
function Eo(t, n, e) {
  const o = n.offsets, i = Lt(
    t.topDict || {},
    X
  );
  return i.push({
    operator: X.CharStrings,
    operands: [e + o.charStrings]
  }), o.charsetIsPredefined ? o.charset !== 0 && i.push({
    operator: X.charset,
    operands: [o.charset]
  }) : i.push({
    operator: X.charset,
    operands: [e + o.charset]
  }), o.encodingIsPredefined ? o.encoding !== 0 && i.push({
    operator: X.Encoding,
    operands: [o.encoding]
  }) : i.push({
    operator: X.Encoding,
    operands: [e + o.encoding]
  }), i.push({
    operator: X.Private,
    operands: [o.privateSize, e + o.privateOffset]
  }), t.isCIDFont && (o.fdArray !== void 0 && i.push({
    operator: X.FDArray,
    operands: [e + o.fdArray]
  }), o.fdSelect !== void 0 && i.push({
    operator: X.FDSelect,
    operands: [e + o.fdSelect]
  })), En(i, rs);
}
function Ua(t) {
  const { format: n = 0, codes: e = [], hasSupplement: o = !1 } = t, i = [], s = n | (o ? 128 : 0);
  if (n === 0) {
    i.push(s), i.push(e.length);
    for (const r of e) i.push(r);
  } else if (n === 1) {
    const r = [];
    if (e.length > 0) {
      let a = e[0], c = 0;
      for (let f = 1; f < e.length; f++)
        e[f] === a + c + 1 ? c++ : (r.push([a, c]), a = e[f], c = 0);
      r.push([a, c]);
    }
    i.push(s), i.push(r.length);
    for (const [a, c] of r)
      i.push(a, c);
  }
  return i;
}
const Na = Object.fromEntries(
  Object.entries(es).map(([t, n]) => [n, Number(t)])
), Ga = Object.fromEntries(
  Object.entries(os).map(([t, n]) => [n, Number(t)])
), Ha = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), $a = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), Bo = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset)
]);
function Bn(t, n) {
  const e = [];
  for (const { operator: o, operands: i } of t) {
    const s = n.has(o);
    for (const r of i)
      s && Number.isInteger(r) ? e.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : e.push(...ns(r));
    o >= 3072 ? e.push(12, o & 255) : e.push(o);
  }
  return e;
}
function Za(t, n) {
  const e = new Uint8Array(t), o = e[0], i = e[1], s = e[2], r = e[3] << 8 | e[4], a = s, c = a + r, f = gt(e, a, c), u = pt(f, Re), l = u.CharStrings, g = u.VariationStore, p = u.FDArray, h = u.FDSelect;
  delete u.CharStrings, delete u.VariationStore, delete u.FDArray, delete u.FDSelect;
  const x = wn(e, c).items.map((b) => Array.from(b));
  let m = [];
  l !== void 0 && (m = wn(e, l).items.map((A) => Array.from(A)));
  const y = m.length;
  let _ = [];
  p !== void 0 && (_ = wn(e, p).items.map((A) => {
    const D = gt(A, 0, A.length), C = pt(D, {
      ...es,
      ...Re
      // Font DICTs can also have FontMatrix
    });
    let k = {}, O = [];
    if (Array.isArray(C.Private) && C.Private.length === 2) {
      const [I, B] = C.Private, F = gt(e, B, B + I);
      k = pt(F, os), k.Subrs !== void 0 && (O = wn(e, B + k.Subrs).items.map((xn) => Array.from(xn)), delete k.Subrs), delete C.Private;
    }
    return {
      fontDict: C,
      privateDict: k,
      localSubrs: O
    };
  }));
  let w = null;
  h !== void 0 && y > 0 && (w = is(e, h, y));
  let v = null;
  if (g !== void 0) {
    const b = e[g] << 8 | e[g + 1];
    v = Array.from(
      e.slice(g, g + b)
    );
  }
  return {
    majorVersion: o,
    minorVersion: i,
    topDict: u,
    globalSubrs: x,
    charStrings: m,
    fontDicts: _,
    fdSelect: w,
    variationStore: v
  };
}
function ja(t) {
  const {
    majorVersion: n = 2,
    minorVersion: e = 0,
    topDict: o = {},
    globalSubrs: i = [],
    charStrings: s = [],
    fontDicts: r = [],
    fdSelect: a = null,
    variationStore: c = null
  } = t, f = _n(
    i.map((I) => new Uint8Array(I))
  ), u = _n(s.map((I) => new Uint8Array(I))), l = a ? ss(a) : null, g = c ? new Uint8Array(c) : null, h = To(o, {
    charStrings: 0,
    fdArray: r.length > 0 ? 0 : void 0,
    fdSelect: a ? 0 : void 0,
    variationStore: c ? 0 : void 0
  }).length, d = 5;
  let m = d + h + f.length;
  const y = m;
  m += u.length;
  let _;
  l && (_ = m, m += l.length);
  let w;
  g && (w = m, m += g.length);
  const v = r.map((I) => {
    const B = Lt(
      I.privateDict || {},
      Ga
    );
    let F = null;
    if (I.localSubrs && I.localSubrs.length > 0 && (F = _n(
      I.localSubrs.map((xn) => new Uint8Array(xn))
    )), F) {
      const ta = Bn(
        B,
        Bo
      ).length + 6;
      B.push({
        operator: 19,
        // Subrs
        operands: [ta]
      });
    }
    const q = Bn(B, Bo);
    return {
      privBytes: q,
      localSubrBytes: F,
      totalSize: q.length + (F ? F.length : 0)
    };
  }), b = [];
  for (const I of v)
    b.push({ offset: m, size: I.privBytes.length }), m += I.totalSize;
  let A = null, D;
  if (r.length > 0) {
    const I = r.map((B, F) => {
      const q = Lt(B.fontDict || {}, {
        ...Na,
        ...Ot
      });
      return q.push({
        operator: 18,
        // Private
        operands: [b[F].size, b[F].offset]
      }), Bn(q, $a);
    });
    A = _n(I), D = m, m += A.length;
  }
  const C = To(o, {
    charStrings: y,
    fdArray: D,
    fdSelect: _,
    variationStore: w
  });
  if (C.length !== h)
    throw new Error(
      "CFF2 TopDICT size mismatch — this should not happen with forced int32 offsets"
    );
  const O = [
    ...[
      n,
      e,
      d,
      h >> 8 & 255,
      h & 255
    ],
    ...C,
    ...f,
    ...u
  ];
  if (l)
    for (let I = 0; I < l.length; I++)
      O.push(l[I]);
  if (g)
    for (let I = 0; I < g.length; I++)
      O.push(g[I]);
  for (const I of v) {
    for (let B = 0; B < I.privBytes.length; B++) O.push(I.privBytes[B]);
    if (I.localSubrBytes)
      for (let B = 0; B < I.localSubrBytes.length; B++)
        O.push(I.localSubrBytes[B]);
  }
  if (A)
    for (let I = 0; I < A.length; I++) O.push(A[I]);
  return O;
}
function To(t, n) {
  const e = Lt(t, Ot);
  return n.charStrings !== void 0 && e.push({
    operator: Ot.CharStrings,
    operands: [n.charStrings]
  }), n.fdArray !== void 0 && e.push({
    operator: Ot.FDArray,
    operands: [n.fdArray]
  }), n.fdSelect !== void 0 && e.push({
    operator: Ot.FDSelect,
    operands: [n.fdSelect]
  }), n.variationStore !== void 0 && e.push({
    operator: Ot.VariationStore,
    operands: [n.variationStore]
  }), Bn(e, Ha);
}
class E {
  /**
   * @param {number[]|Uint8Array} bytes - source bytes
   * @param {number} [startOffset=0]    - initial cursor position
   */
  constructor(n, e = 0) {
    const o = n instanceof Uint8Array ? n : new Uint8Array(n);
    this._view = new DataView(o.buffer, o.byteOffset, o.byteLength), this._pos = e;
  }
  /** Current byte offset. */
  get position() {
    return this._pos;
  }
  /** Total byte length of the underlying data. */
  get length() {
    return this._view.byteLength;
  }
  /**
   * The underlying DataView — for callers that need random-access reads
   * (e.g., subtable offsets that jump around within a table).
   */
  get view() {
    return this._view;
  }
  // --- Cursor control -------------------------------------------------
  /** Move the cursor to an absolute byte offset. */
  seek(n) {
    return this._pos = n, this;
  }
  /** Advance the cursor by `n` bytes without reading. */
  skip(n) {
    return this._pos += n, this;
  }
  // --- Unsigned integers ----------------------------------------------
  /** Read uint8 (1 byte). */
  uint8() {
    const n = this._view.getUint8(this._pos);
    return this._pos += 1, n;
  }
  /** Read uint16 (2 bytes, big-endian). */
  uint16() {
    const n = this._view.getUint16(this._pos);
    return this._pos += 2, n;
  }
  /** Read uint24 (3 bytes, big-endian). */
  uint24() {
    const n = this._view.getUint8(this._pos) << 16 | this._view.getUint8(this._pos + 1) << 8 | this._view.getUint8(this._pos + 2);
    return this._pos += 3, n;
  }
  /** Read uint32 (4 bytes, big-endian). */
  uint32() {
    const n = this._view.getUint32(this._pos);
    return this._pos += 4, n;
  }
  // --- Signed integers ------------------------------------------------
  /** Read int8 (1 byte, signed). */
  int8() {
    const n = this._view.getInt8(this._pos);
    return this._pos += 1, n;
  }
  /** Read int16 (2 bytes, big-endian, signed). */
  int16() {
    const n = this._view.getInt16(this._pos);
    return this._pos += 2, n;
  }
  /** Read int32 (4 bytes, big-endian, signed). */
  int32() {
    const n = this._view.getInt32(this._pos);
    return this._pos += 4, n;
  }
  // --- OpenType-specific types ----------------------------------------
  /** Read a Tag — 4 ASCII bytes returned as a string. */
  tag() {
    const n = String.fromCharCode(
      this._view.getUint8(this._pos),
      this._view.getUint8(this._pos + 1),
      this._view.getUint8(this._pos + 2),
      this._view.getUint8(this._pos + 3)
    );
    return this._pos += 4, n;
  }
  /** Read Offset16 (alias for uint16). */
  offset16() {
    return this.uint16();
  }
  /** Read Offset32 (alias for uint32). */
  offset32() {
    return this.uint32();
  }
  /** Read Fixed (16.16 signed fixed-point -> JS number). */
  fixed() {
    const n = this._view.getInt32(this._pos);
    return this._pos += 4, n / 65536;
  }
  /** Read FWORD (alias for int16). */
  fword() {
    return this.int16();
  }
  /** Read UFWORD (alias for uint16). */
  ufword() {
    return this.uint16();
  }
  /** Read F2DOT14 (2.14 signed fixed-point -> JS number). */
  f2dot14() {
    const n = this._view.getInt16(this._pos);
    return this._pos += 2, n / 16384;
  }
  /**
   * Read LONGDATETIME — signed 64-bit integer representing seconds since
   * 1904-01-01 00:00 UTC.  Returned as a BigInt.
   */
  longDateTime() {
    const n = this._view.getInt32(this._pos), e = this._view.getUint32(this._pos + 4);
    return this._pos += 8, BigInt(n) << 32n | BigInt(e);
  }
  // --- Bulk reads -----------------------------------------------------
  /**
   * Read `count` values using the named method.
   * @param {string} method - name of a read method, e.g. 'uint16'
   * @param {number} count
   * @returns {Array}
   */
  array(n, e) {
    const o = [], i = this[n].bind(this);
    for (let s = 0; s < e; s++)
      o.push(i());
    return o;
  }
  /**
   * Read `count` raw bytes and return a plain Array of numbers.
   * @param {number} count
   * @returns {number[]}
   */
  bytes(n) {
    const e = [];
    for (let o = 0; o < n; o++)
      e.push(this._view.getUint8(this._pos + o));
    return this._pos += n, e;
  }
}
class S {
  /**
   * @param {number} size - number of bytes to allocate (all initialised to 0)
   */
  constructor(n) {
    this._buffer = new ArrayBuffer(n), this._view = new DataView(this._buffer), this._bytes = new Uint8Array(this._buffer), this._pos = 0;
  }
  /** Current byte offset. */
  get position() {
    return this._pos;
  }
  /** Total byte length of the buffer. */
  get length() {
    return this._buffer.byteLength;
  }
  /** The underlying DataView — for random-access writes when needed. */
  get view() {
    return this._view;
  }
  /** The underlying Uint8Array — for bulk set operations. */
  get bytes() {
    return this._bytes;
  }
  // --- Cursor control -------------------------------------------------
  /** Move the cursor to an absolute byte offset. */
  seek(n) {
    return this._pos = n, this;
  }
  /** Advance the cursor by `n` bytes without writing. */
  skip(n) {
    return this._pos += n, this;
  }
  // --- Unsigned integers ----------------------------------------------
  /** Write uint8 (1 byte). */
  uint8(n) {
    return this._view.setUint8(this._pos, n), this._pos += 1, this;
  }
  /** Write uint16 (2 bytes, big-endian). */
  uint16(n) {
    return this._view.setUint16(this._pos, n), this._pos += 2, this;
  }
  /** Write uint24 (3 bytes, big-endian). */
  uint24(n) {
    return this._view.setUint8(this._pos, n >> 16 & 255), this._view.setUint8(this._pos + 1, n >> 8 & 255), this._view.setUint8(this._pos + 2, n & 255), this._pos += 3, this;
  }
  /** Write uint32 (4 bytes, big-endian). */
  uint32(n) {
    return this._view.setUint32(this._pos, n), this._pos += 4, this;
  }
  // --- Signed integers ------------------------------------------------
  /** Write int8 (1 byte, signed). */
  int8(n) {
    return this._view.setInt8(this._pos, n), this._pos += 1, this;
  }
  /** Write int16 (2 bytes, big-endian, signed). */
  int16(n) {
    return this._view.setInt16(this._pos, n), this._pos += 2, this;
  }
  /** Write int32 (4 bytes, big-endian, signed). */
  int32(n) {
    return this._view.setInt32(this._pos, n), this._pos += 4, this;
  }
  // --- OpenType-specific types ----------------------------------------
  /** Write a Tag — 4 ASCII bytes from a string. */
  tag(n) {
    for (let e = 0; e < 4; e++)
      this._view.setUint8(this._pos + e, n.charCodeAt(e));
    return this._pos += 4, this;
  }
  /** Write Offset16 (alias for uint16). */
  offset16(n) {
    return this.uint16(n);
  }
  /** Write Offset32 (alias for uint32). */
  offset32(n) {
    return this.uint32(n);
  }
  /** Write Fixed (JS number -> 16.16 signed fixed-point). */
  fixed(n) {
    return this._view.setInt32(this._pos, Math.round(n * 65536)), this._pos += 4, this;
  }
  /** Write FWORD (alias for int16). */
  fword(n) {
    return this.int16(n);
  }
  /** Write UFWORD (alias for uint16). */
  ufword(n) {
    return this.uint16(n);
  }
  /** Write F2DOT14 (JS number -> 2.14 signed fixed-point). */
  f2dot14(n) {
    return this._view.setInt16(this._pos, Math.round(n * 16384)), this._pos += 2, this;
  }
  /**
   * Write LONGDATETIME — BigInt representing seconds since 1904-01-01 00:00 UTC.
   */
  longDateTime(n) {
    const e = BigInt(n);
    return this._view.setInt32(this._pos, Number(e >> 32n)), this._view.setUint32(this._pos + 4, Number(e & 0xffffffffn)), this._pos += 8, this;
  }
  // --- Bulk writes ----------------------------------------------------
  /**
   * Write an array of values using the named method.
   * @param {string} method - name of a write method, e.g. 'uint16'
   * @param {Array} values
   */
  array(n, e) {
    const o = this[n].bind(this);
    for (const i of e)
      o(i);
    return this;
  }
  /**
   * Write raw bytes (number[] or Uint8Array) at the current position.
   * @param {number[]|Uint8Array} data
   */
  rawBytes(n) {
    const e = n instanceof Uint8Array ? n : new Uint8Array(n);
    return this._bytes.set(e, this._pos), this._pos += e.length, this;
  }
  // --- Output ---------------------------------------------------------
  /** Return the buffer contents as a plain number[]. */
  toArray() {
    return Array.from(this._bytes);
  }
}
const Ya = 8, qa = 4;
function Wa(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.int16(), s = n.uint16(), r = [];
  for (let a = 0; a < s; a++)
    r.push({
      glyphIndex: n.uint16(),
      vertOriginY: n.int16()
    });
  return {
    majorVersion: e,
    minorVersion: o,
    defaultVertOriginY: i,
    numVertOriginYMetrics: s,
    vertOriginYMetrics: r
  };
}
function Xa(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.defaultVertOriginY ?? 0, i = t.vertOriginYMetrics ?? [], s = t.numVertOriginYMetrics ?? i.length, r = i.slice(0, s);
  for (; r.length < s; )
    r.push({ glyphIndex: 0, vertOriginY: o });
  const a = new S(
    Ya + s * qa
  );
  a.uint16(n), a.uint16(e), a.int16(o), a.uint16(s);
  for (const c of r)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? o);
  return a.toArray();
}
const Ka = 8;
function Ja(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = n.uint16(), r = [];
  for (let a = 0; a < s; a++) {
    const c = n.uint16(), f = [];
    for (let u = 0; u < c; u++)
      f.push({
        fromCoordinate: n.f2dot14(),
        toCoordinate: n.f2dot14()
      });
    r.push({ positionMapCount: c, axisValueMaps: f });
  }
  return {
    majorVersion: e,
    minorVersion: o,
    reserved: i,
    segmentMaps: r
  };
}
function Qa(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 0, i = t.segmentMaps ?? [];
  let s = Ka;
  for (const a of i) {
    const c = a.axisValueMaps?.length ?? a.positionMapCount ?? 0;
    s += 2 + c * 4;
  }
  const r = new S(s);
  r.uint16(n), r.uint16(e), r.uint16(o), r.uint16(i.length);
  for (const a of i) {
    const c = a.axisValueMaps ?? [];
    r.uint16(c.length);
    for (const f of c)
      r.f2dot14(f.fromCoordinate), r.f2dot14(f.toCoordinate);
  }
  return r.toArray();
}
const Me = 32768, Le = 32767;
function zt(t) {
  const n = new E(t), e = n.uint16(), o = n.offset32(), i = n.uint16(), s = n.array(
    "offset32",
    i
  ), r = tc(
    n,
    o
  ), a = [];
  for (let c = 0; c < i; c++) {
    const f = s[c];
    f === 0 ? a.push(null) : a.push(nc(n, f));
  }
  return {
    format: e,
    variationRegionList: r,
    itemVariationData: a
  };
}
function tc(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = [];
  for (let s = 0; s < o; s++) {
    const r = [];
    for (let a = 0; a < e; a++)
      r.push({
        startCoord: t.f2dot14(),
        peakCoord: t.f2dot14(),
        endCoord: t.f2dot14()
      });
    i.push({ regionAxes: r });
  }
  return { axisCount: e, regions: i };
}
function nc(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.uint16(), s = t.array("uint16", i), r = (o & Me) !== 0, a = o & Le, c = [];
  for (let f = 0; f < e; f++) {
    const u = [];
    for (let l = 0; l < a; l++)
      u.push(r ? t.int32() : t.int16());
    for (let l = a; l < i; l++)
      u.push(r ? t.int16() : t.int8());
    c.push(u);
  }
  return {
    itemCount: e,
    wordDeltaCount: o,
    regionIndexes: s,
    deltaSets: c
  };
}
function pn(t) {
  const n = t.variationRegionList, e = t.itemVariationData ?? [], o = e.length, i = 8 + 4 * o, s = n.axisCount, r = n.regions.length, a = 4 + r * s * 6, c = i;
  let f = c + a;
  const u = [];
  for (let p = 0; p < o; p++) {
    const h = e[p];
    if (!h) {
      u.push(0);
      continue;
    }
    u.push(f);
    const d = h.regionIndexes.length, x = (h.wordDeltaCount & Me) !== 0, m = h.wordDeltaCount & Le, y = 6 + 2 * d, _ = x ? 4 : 2, w = x ? 2 : 1, v = m * _ + (d - m) * w, b = y + h.itemCount * v;
    f += b;
  }
  const l = f, g = new S(l);
  g.uint16(t.format ?? 1), g.offset32(c), g.uint16(o);
  for (let p = 0; p < o; p++)
    g.offset32(u[p]);
  g.uint16(s), g.uint16(r);
  for (const p of n.regions)
    for (const h of p.regionAxes)
      g.f2dot14(h.startCoord), g.f2dot14(h.peakCoord), g.f2dot14(h.endCoord);
  for (let p = 0; p < o; p++) {
    const h = e[p];
    if (!h) continue;
    const d = h.regionIndexes.length, x = (h.wordDeltaCount & Me) !== 0, m = h.wordDeltaCount & Le;
    g.uint16(h.itemCount), g.uint16(h.wordDeltaCount), g.uint16(d), g.array("uint16", h.regionIndexes);
    for (const y of h.deltaSets) {
      for (let _ = 0; _ < m; _++)
        x ? g.int32(y[_] ?? 0) : g.int16(y[_] ?? 0);
      for (let _ = m; _ < d; _++)
        x ? g.int16(y[_] ?? 0) : g.int8(y[_] ?? 0);
    }
  }
  return g.toArray();
}
function L(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), i = t.array("uint16", o);
    return { format: e, glyphs: i };
  }
  if (e === 2) {
    const o = t.uint16(), i = [];
    for (let s = 0; s < o; s++)
      i.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        startCoverageIndex: t.uint16()
      });
    return { format: e, ranges: i };
  }
  throw new Error(`Unknown Coverage format: ${e}`);
}
function z(t) {
  if (t.format === 1) {
    const n = 4 + t.glyphs.length * 2, e = new S(n);
    return e.uint16(1), e.uint16(t.glyphs.length), e.array("uint16", t.glyphs), e.toArray();
  }
  if (t.format === 2) {
    const n = 4 + t.ranges.length * 6, e = new S(n);
    e.uint16(2), e.uint16(t.ranges.length);
    for (const o of t.ranges)
      e.uint16(o.startGlyphID), e.uint16(o.endGlyphID), e.uint16(o.startCoverageIndex);
    return e.toArray();
  }
  throw new Error(`Unknown Coverage format: ${t.format}`);
}
function ct(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), i = t.uint16(), s = t.array("uint16", i);
    return { format: e, startGlyphID: o, classValues: s };
  }
  if (e === 2) {
    const o = t.uint16(), i = [];
    for (let s = 0; s < o; s++)
      i.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        class: t.uint16()
      });
    return { format: e, ranges: i };
  }
  throw new Error(`Unknown ClassDef format: ${e}`);
}
function ft(t) {
  if (t.format === 1) {
    const n = 6 + t.classValues.length * 2, e = new S(n);
    return e.uint16(1), e.uint16(t.startGlyphID), e.uint16(t.classValues.length), e.array("uint16", t.classValues), e.toArray();
  }
  if (t.format === 2) {
    const n = 4 + t.ranges.length * 6, e = new S(n);
    e.uint16(2), e.uint16(t.ranges.length);
    for (const o of t.ranges)
      e.uint16(o.startGlyphID), e.uint16(o.endGlyphID), e.uint16(o.class);
    return e.toArray();
  }
  throw new Error(`Unknown ClassDef format: ${t.format}`);
}
function Vt(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.uint16();
  if (i === 32768)
    return {
      format: 32768,
      deltaSetOuterIndex: e,
      deltaSetInnerIndex: o
    };
  const s = e, r = o, a = i, c = r - s + 1;
  let f, u, l;
  if (a === 1)
    f = 2, u = 3, l = 2;
  else if (a === 2)
    f = 4, u = 15, l = 8;
  else if (a === 3)
    f = 8, u = 255, l = 128;
  else
    throw new Error(
      `Unknown Device deltaFormat: ${a} at offset ${n} (words: ${e}, ${o}, ${i})`
    );
  const g = 16 / f, p = Math.ceil(c / g), h = [];
  for (let d = 0; d < p; d++) {
    const x = t.uint16(), m = Math.min(g, c - d * g);
    for (let y = 0; y < m; y++) {
      const _ = 16 - f * (y + 1);
      let w = x >> _ & u;
      w >= l && (w -= l * 2), h.push(w);
    }
  }
  return { format: a, startSize: s, endSize: r, deltaValues: h };
}
function zn(t) {
  if (t.format === 32768) {
    const l = new S(6);
    return l.uint16(t.deltaSetOuterIndex), l.uint16(t.deltaSetInnerIndex), l.uint16(32768), l.toArray();
  }
  const { startSize: n, endSize: e, deltaFormat: o, deltaValues: i } = t;
  let s;
  if (o === 1) s = 2;
  else if (o === 2) s = 4;
  else if (o === 3) s = 8;
  else throw new Error(`Unknown Device deltaFormat: ${o}`);
  const r = 16 / s, a = Math.ceil(i.length / r), c = (1 << s) - 1, f = 6 + a * 2, u = new S(f);
  u.uint16(n), u.uint16(e), u.uint16(o);
  for (let l = 0; l < a; l++) {
    let g = 0;
    const p = Math.min(
      r,
      i.length - l * r
    );
    for (let h = 0; h < p; h++) {
      const d = 16 - s * (h + 1);
      g |= (i[l * r + h] & c) << d;
    }
    u.uint16(g);
  }
  return u.toArray();
}
function as(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: o.map((s) => ({
    scriptTag: s.scriptTag,
    script: ec(t, n + s.scriptOffset)
  })) };
}
function ec(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = [];
  for (let a = 0; a < o; a++)
    i.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const s = e !== 0 ? Ro(t, n + e) : null, r = i.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: Ro(t, n + a.langSysOffset)
  }));
  return { defaultLangSys: s, langSysRecords: r };
}
function Ro(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.uint16(), s = t.array("uint16", i);
  return { lookupOrderOffset: e, requiredFeatureIndex: o, featureIndices: s };
}
function cs(t) {
  const { scriptRecords: n } = t, e = n.map((a) => oc(a.script)), o = 2 + n.length * 6, i = [];
  let s = o;
  for (const a of e)
    i.push(s), s += a.length;
  const r = new S(s);
  r.uint16(n.length);
  for (let a = 0; a < n.length; a++)
    r.tag(n[a].scriptTag), r.uint16(i[a]);
  for (let a = 0; a < e.length; a++)
    r.seek(i[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function oc(t) {
  const { defaultLangSys: n, langSysRecords: e } = t, o = e.map((u) => Mo(u.langSys)), i = n ? Mo(n) : null;
  let r = 4 + e.length * 6;
  const a = i ? r : 0;
  i && (r += i.length);
  const c = [];
  for (const u of o)
    c.push(r), r += u.length;
  const f = new S(r);
  f.uint16(a), f.uint16(e.length);
  for (let u = 0; u < e.length; u++)
    f.tag(e[u].langSysTag), f.uint16(c[u]);
  i && (f.seek(a), f.rawBytes(i));
  for (let u = 0; u < o.length; u++)
    f.seek(c[u]), f.rawBytes(o[u]);
  return f.toArray();
}
function Mo(t) {
  const n = 6 + t.featureIndices.length * 2, e = new S(n);
  return e.uint16(t.lookupOrderOffset), e.uint16(t.requiredFeatureIndex), e.uint16(t.featureIndices.length), e.array("uint16", t.featureIndices), e.toArray();
}
function fs(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: o.map((s) => ({
    featureTag: s.featureTag,
    feature: us(t, n + s.featureOffset)
  })) };
}
function us(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.array("uint16", o);
  return { featureParamsOffset: e, lookupListIndices: i };
}
function ls(t) {
  const { featureRecords: n } = t, e = n.map((a) => hs(a.feature)), o = 2 + n.length * 6, i = [];
  let s = o;
  for (const a of e)
    i.push(s), s += a.length;
  const r = new S(s);
  r.uint16(n.length);
  for (let a = 0; a < n.length; a++)
    r.tag(n[a].featureTag), r.uint16(i[a]);
  for (let a = 0; a < e.length; a++)
    r.seek(i[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function hs(t) {
  const n = 4 + t.lookupListIndices.length * 2, e = new S(n);
  return e.uint16(t.featureParamsOffset), e.uint16(t.lookupListIndices.length), e.array("uint16", t.lookupListIndices), e.toArray();
}
function gs(t, n, e, o) {
  t.seek(n);
  const i = t.uint16();
  return { lookups: t.array("uint16", i).map(
    (a) => ic(t, n + a, e, o)
  ) };
}
function ic(t, n, e, o) {
  t.seek(n);
  const i = t.uint16(), s = t.uint16(), r = t.uint16(), a = t.array("uint16", r), c = s & 16 ? t.uint16() : void 0, f = a.map(
    (p) => e(t, n + p, i)
  );
  let u = i, l = f;
  o !== void 0 && i === o && f.length > 0 && (u = f[0].extensionLookupType, l = f.map((p) => p.subtable));
  const g = {
    lookupType: u,
    lookupFlag: s,
    subtables: l
  };
  return c !== void 0 && (g.markFilteringSet = c), g;
}
function ps(t, n, e) {
  const { lookups: o } = t, i = 8, s = o.map((p) => {
    const h = p.subtables.map(
      (d) => n(d, p.lookupType)
    );
    return { ...p, subtableBytes: h };
  }), r = (p) => {
    const { lookupType: h, lookupFlag: d, subtableBytes: x, markFilteringSet: m } = p, y = m !== void 0;
    let w = 6 + x.length * 2 + (y ? 2 : 0);
    const v = x.map((A) => {
      const D = w;
      return w += A.length, D;
    }), b = new S(w);
    b.uint16(h), b.uint16(d), b.uint16(x.length), b.array("uint16", v), y && b.uint16(m);
    for (let A = 0; A < x.length; A++)
      b.seek(v[A]), b.rawBytes(x[A]);
    return b.toArray();
  };
  let a = s.map(r);
  const c = 2 + o.length * 2;
  if (((p) => {
    let h = c;
    for (const d of p) {
      if (h > 65535) return !0;
      h += d.length;
    }
    return !1;
  })(a) && e !== void 0) {
    const p = s.map((y) => {
      const { lookupType: _, lookupFlag: w, subtableBytes: v, markFilteringSet: b } = y, A = b !== void 0;
      let C = 6 + v.length * 2 + (A ? 2 : 0);
      const k = v.map(() => {
        const I = C;
        return C += i, I;
      }), O = new S(C);
      O.uint16(e), O.uint16(w), O.uint16(v.length), O.array("uint16", k), A && O.uint16(b);
      for (let I = 0; I < v.length; I++)
        O.seek(k[I]), O.uint16(1), O.uint16(_), O.uint32(0);
      return {
        compactBytes: O.toArray(),
        subtableOffsets: k,
        innerDataBytes: v
      };
    });
    let h = c;
    const d = p.map((y) => {
      const _ = h;
      return h += y.compactBytes.length, _;
    }), x = p.map(
      (y) => y.innerDataBytes.map((_) => {
        const w = h;
        return h += _.length, w;
      })
    ), m = new S(h);
    m.uint16(o.length), m.array("uint16", d);
    for (let y = 0; y < p.length; y++)
      m.seek(d[y]), m.rawBytes(p[y].compactBytes);
    for (let y = 0; y < p.length; y++) {
      const _ = p[y];
      for (let w = 0; w < _.innerDataBytes.length; w++) {
        const v = d[y] + _.subtableOffsets[w], b = x[y][w], A = b - v;
        m.seek(v + 4), m.uint32(A), m.seek(b), m.rawBytes(_.innerDataBytes[w]);
      }
    }
    return m.toArray();
  }
  let u = c;
  const l = a.map((p) => {
    const h = u;
    return u += p.length, h;
  }), g = new S(u);
  g.uint16(o.length), g.array("uint16", l);
  for (let p = 0; p < a.length; p++)
    g.seek(l[p]), g.rawBytes(a[p]);
  return g.toArray();
}
function ds(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), i = t.uint16(), s = [];
    for (let c = 0; c < i; c++)
      s.push(t.uint16());
    const r = L(t, n + o), a = s.map(
      (c) => c === 0 ? null : sc(t, n + c)
    );
    return { format: e, coverage: r, seqRuleSets: a };
  }
  if (e === 2) {
    const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = [];
    for (let u = 0; u < s; u++)
      r.push(t.uint16());
    const a = L(t, n + o), c = ct(t, n + i), f = r.map(
      (u) => u === 0 ? null : rc(t, n + u)
    );
    return { format: e, coverage: a, classDef: c, classSeqRuleSets: f };
  }
  if (e === 3) {
    const o = t.uint16(), i = t.uint16(), s = t.array("uint16", o), r = dn(t, i), a = s.map(
      (c) => L(t, n + c)
    );
    return { format: e, coverages: a, seqLookupRecords: r };
  }
  throw new Error(`Unknown SequenceContext format: ${e}`);
}
function sc(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((i) => {
    t.seek(n + i);
    const s = t.uint16(), r = t.uint16(), a = t.array("uint16", s - 1), c = dn(t, r);
    return { glyphCount: s, inputSequence: a, seqLookupRecords: c };
  });
}
function rc(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((i) => {
    t.seek(n + i);
    const s = t.uint16(), r = t.uint16(), a = t.array("uint16", s - 1), c = dn(t, r);
    return { glyphCount: s, inputSequence: a, seqLookupRecords: c };
  });
}
function dn(t, n) {
  const e = [];
  for (let o = 0; o < n; o++)
    e.push({
      sequenceIndex: t.uint16(),
      lookupListIndex: t.uint16()
    });
  return e;
}
function ms(t) {
  if (t.format === 1) return ac(t);
  if (t.format === 2) return cc(t);
  if (t.format === 3) return fc(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function ac(t) {
  const { coverage: n, seqRuleSets: e } = t, o = z(n), i = e.map(
    (u) => u === null ? null : ys(u)
  );
  let r = 6 + e.length * 2;
  const a = r;
  r += o.length;
  const c = i.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new S(r);
  f.uint16(1), f.uint16(a), f.uint16(e.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let u = 0; u < i.length; u++)
    i[u] && (f.seek(c[u]), f.rawBytes(i[u]));
  return f.toArray();
}
function cc(t) {
  const { coverage: n, classDef: e, classSeqRuleSets: o } = t, i = z(n), s = ft(e), r = o.map(
    (p) => p === null ? null : ys(p)
  );
  let c = 8 + o.length * 2;
  const f = c;
  c += i.length;
  const u = c;
  c += s.length;
  const l = r.map((p) => {
    if (p === null) return 0;
    const h = c;
    return c += p.length, h;
  }), g = new S(c);
  g.uint16(2), g.uint16(f), g.uint16(u), g.uint16(o.length), g.array("uint16", l), g.seek(f), g.rawBytes(i), g.seek(u), g.rawBytes(s);
  for (let p = 0; p < r.length; p++)
    r[p] && (g.seek(l[p]), g.rawBytes(r[p]));
  return g.toArray();
}
function fc(t) {
  const { coverages: n, seqLookupRecords: e } = t, o = n.map(z);
  let s = 6 + n.length * 2 + e.length * 4;
  const r = o.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new S(s);
  a.uint16(3), a.uint16(n.length), a.uint16(e.length), a.array("uint16", r), Wn(a, e);
  for (let c = 0; c < o.length; c++)
    a.seek(r[c]), a.rawBytes(o[c]);
  return a.toArray();
}
function ys(t) {
  const n = t.map(uc);
  let o = 2 + t.length * 2;
  const i = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.length), s.array("uint16", i);
  for (let r = 0; r < n.length; r++)
    s.seek(i[r]), s.rawBytes(n[r]);
  return s.toArray();
}
function uc(t) {
  const { glyphCount: n, inputSequence: e, seqLookupRecords: o } = t, i = 4 + (n - 1) * 2 + o.length * 4, s = new S(i);
  return s.uint16(n), s.uint16(o.length), s.array("uint16", e), Wn(s, o), s.toArray();
}
function Wn(t, n) {
  for (const e of n)
    t.uint16(e.sequenceIndex), t.uint16(e.lookupListIndex);
}
function xs(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), i = t.uint16(), s = [];
    for (let c = 0; c < i; c++)
      s.push(t.uint16());
    const r = L(t, n + o), a = s.map(
      (c) => c === 0 ? null : lc(t, n + c)
    );
    return { format: e, coverage: r, chainedSeqRuleSets: a };
  }
  if (e === 2) {
    const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = t.uint16(), a = t.uint16(), c = [];
    for (let h = 0; h < a; h++)
      c.push(t.uint16());
    const f = L(t, n + o), u = ct(
      t,
      n + i
    ), l = ct(
      t,
      n + s
    ), g = ct(
      t,
      n + r
    ), p = c.map(
      (h) => h === 0 ? null : hc(t, n + h)
    );
    return {
      format: e,
      coverage: f,
      backtrackClassDef: u,
      inputClassDef: l,
      lookaheadClassDef: g,
      chainedClassSeqRuleSets: p
    };
  }
  if (e === 3) {
    const o = t.uint16(), i = t.array(
      "uint16",
      o
    ), s = t.uint16(), r = t.array("uint16", s), a = t.uint16(), c = t.array(
      "uint16",
      a
    ), f = t.uint16(), u = dn(t, f), l = i.map(
      (h) => L(t, n + h)
    ), g = r.map(
      (h) => L(t, n + h)
    ), p = c.map(
      (h) => L(t, n + h)
    );
    return {
      format: e,
      backtrackCoverages: l,
      inputCoverages: g,
      lookaheadCoverages: p,
      seqLookupRecords: u
    };
  }
  throw new Error(`Unknown ChainedSequenceContext format: ${e}`);
}
function lc(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((i) => ws(t, n + i));
}
function ws(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.array("uint16", e), i = t.uint16(), s = t.array("uint16", i - 1), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = dn(t, c);
  return {
    backtrackSequence: o,
    inputGlyphCount: i,
    inputSequence: s,
    lookaheadSequence: a,
    seqLookupRecords: f
  };
}
function hc(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((i) => ws(t, n + i));
}
function _s(t) {
  if (t.format === 1) return gc(t);
  if (t.format === 2) return pc(t);
  if (t.format === 3) return dc(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function gc(t) {
  const { coverage: n, chainedSeqRuleSets: e } = t, o = z(n), i = e.map(
    (u) => u === null ? null : Ss(u)
  );
  let r = 6 + e.length * 2;
  const a = r;
  r += o.length;
  const c = i.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new S(r);
  f.uint16(1), f.uint16(a), f.uint16(e.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let u = 0; u < i.length; u++)
    i[u] && (f.seek(c[u]), f.rawBytes(i[u]));
  return f.toArray();
}
function pc(t) {
  const {
    coverage: n,
    backtrackClassDef: e,
    inputClassDef: o,
    lookaheadClassDef: i,
    chainedClassSeqRuleSets: s
  } = t, r = z(n), a = ft(e), c = ft(o), f = ft(i), u = s.map(
    (_) => _ === null ? null : Ss(_)
  );
  let g = 12 + s.length * 2;
  const p = g;
  g += r.length;
  const h = g;
  g += a.length;
  const d = g;
  g += c.length;
  const x = g;
  g += f.length;
  const m = u.map((_) => {
    if (_ === null) return 0;
    const w = g;
    return g += _.length, w;
  }), y = new S(g);
  y.uint16(2), y.uint16(p), y.uint16(h), y.uint16(d), y.uint16(x), y.uint16(s.length), y.array("uint16", m), y.seek(p), y.rawBytes(r), y.seek(h), y.rawBytes(a), y.seek(d), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let _ = 0; _ < u.length; _++)
    u[_] && (y.seek(m[_]), y.rawBytes(u[_]));
  return y.toArray();
}
function dc(t) {
  const {
    backtrackCoverages: n,
    inputCoverages: e,
    lookaheadCoverages: o,
    seqLookupRecords: i
  } = t, s = n.map(z), r = e.map(z), a = o.map(z);
  let f = 4 + n.length * 2 + 2 + e.length * 2 + 2 + o.length * 2 + 2 + i.length * 4;
  const u = s.map((h) => {
    const d = f;
    return f += h.length, d;
  }), l = r.map((h) => {
    const d = f;
    return f += h.length, d;
  }), g = a.map((h) => {
    const d = f;
    return f += h.length, d;
  }), p = new S(f);
  p.uint16(3), p.uint16(n.length), p.array("uint16", u), p.uint16(e.length), p.array("uint16", l), p.uint16(o.length), p.array("uint16", g), p.uint16(i.length), Wn(p, i);
  for (let h = 0; h < s.length; h++)
    p.seek(u[h]), p.rawBytes(s[h]);
  for (let h = 0; h < r.length; h++)
    p.seek(l[h]), p.rawBytes(r[h]);
  for (let h = 0; h < a.length; h++)
    p.seek(g[h]), p.rawBytes(a[h]);
  return p.toArray();
}
function Ss(t) {
  const n = t.map(mc);
  let o = 2 + t.length * 2;
  const i = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.length), s.array("uint16", i);
  for (let r = 0; r < n.length; r++)
    s.seek(i[r]), s.rawBytes(n[r]);
  return s.toArray();
}
function mc(t) {
  const {
    backtrackSequence: n,
    inputGlyphCount: e,
    inputSequence: o,
    lookaheadSequence: i,
    seqLookupRecords: s
  } = t, r = 2 + n.length * 2 + 2 + o.length * 2 + 2 + i.length * 2 + 2 + s.length * 4, a = new S(r);
  return a.uint16(n.length), a.array("uint16", n), a.uint16(e), a.array("uint16", o), a.uint16(i.length), a.array("uint16", i), a.uint16(s.length), Wn(a, s), a.toArray();
}
function vs(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.uint32(), s = [];
  for (let a = 0; a < i; a++)
    s.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const r = s.map((a) => {
    const c = a.conditionSetOffset !== 0 ? yc(t, n + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? xc(
      t,
      n + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: e, minorVersion: o, featureVariationRecords: r };
}
function yc(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++)
    o.push(t.uint32());
  return { conditions: o.map((s) => {
    t.seek(n + s);
    const r = t.uint16();
    if (r === 1) {
      const a = t.uint16(), c = t.int16(), f = t.int16();
      return { format: r, axisIndex: a, filterRangeMinValue: c, filterRangeMaxValue: f };
    }
    return { format: r, _raw: !0 };
  }) };
}
function xc(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.uint16(), s = [];
  for (let r = 0; r < i; r++) {
    const a = t.uint16(), c = t.uint32(), f = us(t, n + c);
    s.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: e, minorVersion: o, substitutions: s };
}
function As(t) {
  const { majorVersion: n, minorVersion: e, featureVariationRecords: o } = t, i = o.map((f) => ({
    csBytes: f.conditionSet ? wc(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? Sc(f.featureTableSubstitution) : null
  }));
  let r = 8 + o.length * 8;
  const a = i.map((f) => {
    const u = f.csBytes ? r : 0;
    f.csBytes && (r += f.csBytes.length);
    const l = f.ftsBytes ? r : 0;
    return f.ftsBytes && (r += f.ftsBytes.length), { csOff: u, ftsOff: l };
  }), c = new S(r);
  c.uint16(n), c.uint16(e), c.uint32(o.length);
  for (const f of a)
    c.uint32(f.csOff), c.uint32(f.ftsOff);
  for (let f = 0; f < i.length; f++) {
    const u = i[f];
    u.csBytes && (c.seek(a[f].csOff), c.rawBytes(u.csBytes)), u.ftsBytes && (c.seek(a[f].ftsOff), c.rawBytes(u.ftsBytes));
  }
  return c.toArray();
}
function wc(t) {
  const n = t.conditions.map(_c);
  let o = 2 + t.conditions.length * 4;
  const i = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.conditions.length);
  for (const r of i) s.uint32(r);
  for (let r = 0; r < n.length; r++)
    s.seek(i[r]), s.rawBytes(n[r]);
  return s.toArray();
}
function _c(t) {
  if (t.format === 1) {
    const n = new S(8);
    return n.uint16(1), n.uint16(t.axisIndex), n.int16(t.filterRangeMinValue), n.int16(t.filterRangeMaxValue), n.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function Sc(t) {
  const n = t.substitutions.map(
    (r) => hs(r.feature)
  );
  let o = 6 + t.substitutions.length * 6;
  const i = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.majorVersion), s.uint16(t.minorVersion), s.uint16(t.substitutions.length);
  for (let r = 0; r < t.substitutions.length; r++)
    s.uint16(t.substitutions[r].featureIndex), s.uint32(i[r]);
  for (let r = 0; r < n.length; r++)
    s.seek(i[r]), s.rawBytes(n[r]);
  return s.toArray();
}
const vc = 8, Ac = 12;
function bc(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.offset16(), s = n.offset16(), r = e > 1 || e === 1 && o >= 1 ? n.offset32() : 0, a = [i, s, r].filter(
    (c) => c > 0
  );
  return {
    majorVersion: e,
    minorVersion: o,
    horizAxis: i ? Lo(t, i) : null,
    vertAxis: s ? Lo(t, s) : null,
    itemVariationStore: r ? zt(
      t.slice(
        r,
        kc(t.length, r, a)
      )
    ) : null
  };
}
function kc(t, n, e) {
  return e.filter((i) => i > n).sort((i, s) => i - s)[0] ?? t;
}
function Lo(t, n) {
  if (n + 4 > t.length) return null;
  const e = new E(t);
  e.seek(n);
  const o = e.offset16(), i = e.offset16(), s = o ? Cc(e, n + o) : null, r = i ? Oc(e, n + i) : [];
  return { baseTagList: s, baseScriptList: r };
}
function Cc(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++)
    o.push(t.tag());
  return o;
}
function Oc(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++)
    o.push({ tag: t.tag(), off: t.offset16() });
  return o.map((i) => ({
    tag: i.tag,
    ...Ic(t, n + i.off)
  }));
}
function Ic(t, n) {
  t.seek(n);
  const e = t.offset16(), o = t.offset16(), i = t.uint16(), s = [];
  for (let r = 0; r < i; r++)
    s.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: e ? Dc(t, n + e) : null,
    defaultMinMax: o ? zo(t, n + o) : null,
    langSystems: s.map((r) => ({
      tag: r.tag,
      minMax: zo(t, n + r.off)
    }))
  };
}
function Dc(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = [];
  for (let s = 0; s < o; s++)
    i.push(t.offset16());
  return {
    defaultBaselineIndex: e,
    baseCoords: i.map(
      (s) => s ? jt(t, n + s) : null
    )
  };
}
function zo(t, n) {
  t.seek(n);
  const e = t.offset16(), o = t.offset16(), i = t.uint16(), s = [];
  for (let r = 0; r < i; r++)
    s.push({
      tag: t.tag(),
      minOff: t.offset16(),
      maxOff: t.offset16()
    });
  return {
    minCoord: e ? jt(t, n + e) : null,
    maxCoord: o ? jt(t, n + o) : null,
    featMinMax: s.map((r) => ({
      tag: r.tag,
      minCoord: r.minOff ? jt(t, n + r.minOff) : null,
      maxCoord: r.maxOff ? jt(t, n + r.maxOff) : null
    }))
  };
}
function jt(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.int16();
  if (e === 1) return { format: e, coordinate: o };
  if (e === 2)
    return {
      format: e,
      coordinate: o,
      referenceGlyph: t.uint16(),
      baseCoordPoint: t.uint16()
    };
  if (e === 3) {
    const i = t.offset16();
    return {
      format: e,
      coordinate: o,
      device: i ? Vt(t, n + i) : null
    };
  }
  return { format: e, coordinate: o };
}
function Ec(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = n > 1 || n === 1 && e >= 1, i = Vo(t.horizAxis), s = Vo(t.vertAxis), r = o && t.itemVariationStore ? pn(t.itemVariationStore) : [];
  let c = o ? Ac : vc;
  const f = i.length ? c : 0;
  c += i.length;
  const u = s.length ? c : 0;
  c += s.length;
  const l = r.length ? c : 0;
  c += r.length;
  const g = new S(c);
  return g.uint16(n), g.uint16(e), g.offset16(f), g.offset16(u), o && g.offset32(l), g.rawBytes(i), g.rawBytes(s), g.rawBytes(r), g.toArray();
}
function Vo(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const n = t.baseTagList ? Bc(t.baseTagList) : [], e = Tc(t.baseScriptList ?? []);
  let i = 4;
  const s = n.length ? i : 0;
  i += n.length;
  const r = e.length ? i : 0;
  i += e.length;
  const a = new S(i);
  return a.offset16(s), a.offset16(r), a.rawBytes(n), a.rawBytes(e), a.toArray();
}
function Bc(t) {
  const n = 2 + 4 * t.length, e = new S(n);
  e.uint16(t.length);
  for (const o of t)
    e.tag(o);
  return e.toArray();
}
function Tc(t) {
  const n = 2 + 6 * t.length, e = t.map((r) => Rc(r));
  let o = n;
  const i = e.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    s.tag(t[r].tag), s.offset16(i[r]);
  for (const r of e)
    s.rawBytes(r);
  return s.toArray();
}
function Rc(t) {
  const n = Mc(t.baseValues), e = Fo(t.defaultMinMax), o = t.langSystems ?? [], i = o.map((l) => Fo(l.minMax));
  let r = 6 + 6 * o.length;
  const a = n.length ? r : 0;
  r += n.length;
  const c = e.length ? r : 0;
  r += e.length;
  const f = i.map((l) => {
    const g = l.length ? r : 0;
    return r += l.length, g;
  }), u = new S(r);
  u.offset16(a), u.offset16(c), u.uint16(o.length);
  for (let l = 0; l < o.length; l++)
    u.tag(o[l].tag), u.offset16(f[l]);
  u.rawBytes(n), u.rawBytes(e);
  for (const l of i)
    u.rawBytes(l);
  return u.toArray();
}
function Mc(t) {
  if (!t) return [];
  const n = t.baseCoords ?? [], e = 4 + 2 * n.length, o = n.map((a) => Yt(a));
  let i = e;
  const s = o.map((a) => {
    const c = a.length ? i : 0;
    return i += a.length, c;
  }), r = new S(i);
  r.uint16(t.defaultBaselineIndex ?? 0), r.uint16(n.length);
  for (const a of s)
    r.offset16(a);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function Fo(t) {
  if (!t) return [];
  const n = t.featMinMax ?? [], e = 6 + 8 * n.length, o = Yt(t.minCoord), i = Yt(t.maxCoord), s = n.map((l) => ({
    tag: l.tag,
    min: Yt(l.minCoord),
    max: Yt(l.maxCoord)
  }));
  let r = e;
  const a = o.length ? r : 0;
  r += o.length;
  const c = i.length ? r : 0;
  r += i.length;
  const f = s.map((l) => {
    const g = l.min.length ? r : 0;
    r += l.min.length;
    const p = l.max.length ? r : 0;
    return r += l.max.length, { minOff: g, maxOff: p };
  }), u = new S(r);
  u.offset16(a), u.offset16(c), u.uint16(n.length);
  for (let l = 0; l < n.length; l++)
    u.tag(n[l].tag), u.offset16(f[l].minOff), u.offset16(f[l].maxOff);
  u.rawBytes(o), u.rawBytes(i);
  for (const l of s)
    u.rawBytes(l.min), u.rawBytes(l.max);
  return u.toArray();
}
function Yt(t) {
  if (!t) return [];
  if (t.format === 1) {
    const n = new S(4);
    return n.uint16(1), n.int16(t.coordinate), n.toArray();
  }
  if (t.format === 2) {
    const n = new S(8);
    return n.uint16(2), n.int16(t.coordinate), n.uint16(t.referenceGlyph ?? 0), n.uint16(t.baseCoordPoint ?? 0), n.toArray();
  }
  if (t.format === 3) {
    const n = t.device ? zn(t.device) : [], e = n.length ? 6 : 0, o = new S(6 + n.length);
    return o.uint16(3), o.int16(t.coordinate), o.offset16(e), o.rawBytes(n), o.toArray();
  }
  return [];
}
const Kt = 5, xt = 8;
function Sn(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function ce(t, n) {
  t.uint8(n.height ?? 0), t.uint8(n.width ?? 0), t.int8(n.bearingX ?? 0), t.int8(n.bearingY ?? 0), t.uint8(n.advance ?? 0);
}
function It(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    horiBearingX: t.int8(),
    horiBearingY: t.int8(),
    horiAdvance: t.uint8(),
    vertBearingX: t.int8(),
    vertBearingY: t.int8(),
    vertAdvance: t.uint8()
  };
}
function Jt(t, n) {
  t.uint8(n.height ?? 0), t.uint8(n.width ?? 0), t.int8(n.horiBearingX ?? 0), t.int8(n.horiBearingY ?? 0), t.uint8(n.horiAdvance ?? 0), t.int8(n.vertBearingX ?? 0), t.int8(n.vertBearingY ?? 0), t.uint8(n.vertAdvance ?? 0);
}
function so(t, n) {
  const e = new E(t), o = e.uint32(), i = n?.CBLC;
  if (!i?.sizes)
    return { version: o, data: Array.from(t.slice(4)) };
  const s = [];
  for (const r of i.sizes) {
    const a = [];
    for (const c of r.indexSubTables ?? [])
      a.push(Lc(t, e, c));
    s.push(a);
  }
  return { version: o, bitmapData: s };
}
function ro(t) {
  const n = t.version ?? 196608;
  if (t.data) {
    const o = t.data, i = new S(4 + o.length);
    return i.uint32(n), i.rawBytes(o), i.toArray();
  }
  const e = new S(4);
  return e.uint32(n), e.toArray();
}
function fe(t, n) {
  const e = t.version ?? 196608, o = t.bitmapData ?? [], i = n.sizes ?? [], s = [], r = [];
  let a = 4;
  for (let u = 0; u < i.length; u++) {
    const l = i[u].indexSubTables ?? [], g = o[u] ?? [], p = [];
    for (let h = 0; h < l.length; h++) {
      const d = l[h], x = g[h] ?? [], { bytes: m, info: y } = zc(
        x,
        d,
        a
      );
      p.push(y), s.push(m), a += m.length;
    }
    r.push(p);
  }
  const c = a, f = new S(c);
  f.uint32(e);
  for (const u of s)
    f.rawBytes(u);
  return { bytes: f.toArray(), offsetInfo: r };
}
function Lc(t, n, e) {
  const { indexFormat: o, imageFormat: i, imageDataOffset: s } = e, r = [];
  switch (o) {
    case 1:
    case 3: {
      const a = e.sbitOffsets;
      for (let c = 0; c < a.length - 1; c++) {
        const f = s + a[c], l = s + a[c + 1] - f;
        l <= 0 ? r.push(null) : r.push(
          vn(
            t,
            n,
            f,
            i,
            l
          )
        );
      }
      break;
    }
    case 2: {
      const a = e.lastGlyphIndex - e.firstGlyphIndex + 1, { imageSize: c } = e;
      for (let f = 0; f < a; f++) {
        const u = s + f * c;
        r.push(
          vn(
            t,
            n,
            u,
            i,
            c
          )
        );
      }
      break;
    }
    case 4: {
      const a = e.glyphArray;
      for (let c = 0; c < a.length - 1; c++) {
        const f = s + a[c].sbitOffset, l = s + a[c + 1].sbitOffset - f;
        l <= 0 ? r.push(null) : r.push(
          vn(
            t,
            n,
            f,
            i,
            l
          )
        );
      }
      break;
    }
    case 5: {
      const a = e.glyphIdArray.length, { imageSize: c } = e;
      for (let f = 0; f < a; f++) {
        const u = s + f * c;
        r.push(
          vn(
            t,
            n,
            u,
            i,
            c
          )
        );
      }
      break;
    }
  }
  return r;
}
function vn(t, n, e, o, i) {
  if (i <= 0) return null;
  n.seek(e);
  const s = (r, a) => t.slice(r, r + a);
  switch (o) {
    case 1: {
      const r = Sn(n), a = s(
        n.position,
        i - Kt
      );
      return { smallMetrics: r, imageData: a };
    }
    case 2: {
      const r = Sn(n), a = s(
        n.position,
        i - Kt
      );
      return { smallMetrics: r, imageData: a };
    }
    case 5:
      return { imageData: s(e, i) };
    case 6: {
      const r = It(n), a = s(
        n.position,
        i - xt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 7: {
      const r = It(n), a = s(
        n.position,
        i - xt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 8: {
      const r = Sn(n);
      n.skip(1);
      const a = n.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: n.uint16(),
          xOffset: n.int8(),
          yOffset: n.int8()
        });
      return { smallMetrics: r, components: c };
    }
    case 9: {
      const r = It(n), a = n.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: n.uint16(),
          xOffset: n.int8(),
          yOffset: n.int8()
        });
      return { bigMetrics: r, components: c };
    }
    case 17: {
      const r = Sn(n), a = n.uint32(), c = s(n.position, a);
      return { smallMetrics: r, imageData: c };
    }
    case 18: {
      const r = It(n), a = n.uint32(), c = s(n.position, a);
      return { bigMetrics: r, imageData: c };
    }
    case 19: {
      const r = n.uint32();
      return { imageData: s(n.position, r) };
    }
    default:
      return { imageData: s(e, i) };
  }
}
function zc(t, n, e) {
  const { indexFormat: o, imageFormat: i } = n, s = { imageDataOffset: e }, r = t.map(
    (f) => f ? Vc(f, i) : []
  );
  switch (o) {
    case 1:
    case 3: {
      const f = [0];
      let u = 0;
      for (const l of r)
        u += l.length, f.push(u);
      s.sbitOffsets = f;
      break;
    }
    case 2:
    case 5: {
      s.imageSize = n.imageSize ?? (r.length > 0 ? r[0].length : 0);
      break;
    }
    case 4: {
      const f = n.glyphIdArray ?? [], u = [];
      let l = 0;
      for (let g = 0; g < r.length; g++)
        u.push({
          glyphID: f[g] ?? 0,
          sbitOffset: l
        }), l += r[g].length;
      u.push({ glyphID: 0, sbitOffset: l }), s.glyphArray = u;
      break;
    }
  }
  const a = r.reduce((f, u) => f + u.length, 0), c = new S(a);
  for (const f of r)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: s };
}
function Vc(t, n) {
  switch (n) {
    case 1:
    case 2: {
      const e = t.imageData ?? [], o = new S(Kt + e.length);
      return ce(o, t.smallMetrics ?? {}), o.rawBytes(e), o.toArray();
    }
    case 5: {
      const e = t.imageData ?? [];
      return Array.from(e);
    }
    case 6:
    case 7: {
      const e = t.imageData ?? [], o = new S(xt + e.length);
      return Jt(o, t.bigMetrics ?? {}), o.rawBytes(e), o.toArray();
    }
    case 8: {
      const e = t.components ?? [], o = new S(
        Kt + 1 + 2 + e.length * 4
      );
      ce(o, t.smallMetrics ?? {}), o.uint8(0), o.uint16(e.length);
      for (const i of e)
        o.uint16(i.glyphID ?? 0), o.int8(i.xOffset ?? 0), o.int8(i.yOffset ?? 0);
      return o.toArray();
    }
    case 9: {
      const e = t.components ?? [], o = new S(
        xt + 2 + e.length * 4
      );
      Jt(o, t.bigMetrics ?? {}), o.uint16(e.length);
      for (const i of e)
        o.uint16(i.glyphID ?? 0), o.int8(i.xOffset ?? 0), o.int8(i.yOffset ?? 0);
      return o.toArray();
    }
    case 17: {
      const e = t.imageData ?? [], o = new S(Kt + 4 + e.length);
      return ce(o, t.smallMetrics ?? {}), o.uint32(e.length), o.rawBytes(e), o.toArray();
    }
    case 18: {
      const e = t.imageData ?? [], o = new S(xt + 4 + e.length);
      return Jt(o, t.bigMetrics ?? {}), o.uint32(e.length), o.rawBytes(e), o.toArray();
    }
    case 19: {
      const e = t.imageData ?? [], o = new S(4 + e.length);
      return o.uint32(e.length), o.rawBytes(e), o.toArray();
    }
    default:
      return Array.from(t.imageData ?? []);
  }
}
function Fc(t, n) {
  return so(t, n?.bloc ? { CBLC: n.bloc } : n);
}
function Pc(t) {
  return ro(t);
}
const bs = 48;
function ao(t) {
  return Uc(t);
}
function Rt(t, n) {
  return n ? Gc(t, n) : Zc(t);
}
function Uc(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint32(), s = [], r = [];
  for (let a = 0; a < i; a++) {
    const c = n.uint32();
    n.uint32();
    const f = n.uint32(), u = n.uint32(), l = Po(n), g = Po(n), p = n.uint16(), h = n.uint16(), d = n.uint8(), x = n.uint8(), m = n.uint8(), y = n.int8();
    s.push({
      colorRef: u,
      hori: l,
      vert: g,
      startGlyphIndex: p,
      endGlyphIndex: h,
      ppemX: d,
      ppemY: x,
      bitDepth: m,
      flags: y,
      indexSubTables: []
    }), r.push({
      indexSubTableArrayOffset: c,
      numberOfIndexSubTables: f
    });
  }
  for (let a = 0; a < i; a++) {
    const { indexSubTableArrayOffset: c, numberOfIndexSubTables: f } = r[a];
    f !== 0 && (s[a].indexSubTables = Nc(
      n,
      c,
      f
    ));
  }
  return { majorVersion: e, minorVersion: o, sizes: s };
}
function Nc(t, n, e) {
  t.seek(n);
  const o = [];
  for (let s = 0; s < e; s++)
    o.push({
      firstGlyphIndex: t.uint16(),
      lastGlyphIndex: t.uint16(),
      indexSubtableOffset: t.uint32()
    });
  const i = [];
  for (const s of o) {
    const r = n + s.indexSubtableOffset;
    t.seek(r);
    const a = t.uint16(), c = t.uint16(), f = t.uint32(), u = {
      firstGlyphIndex: s.firstGlyphIndex,
      lastGlyphIndex: s.lastGlyphIndex,
      indexFormat: a,
      imageFormat: c,
      imageDataOffset: f
    }, l = s.lastGlyphIndex - s.firstGlyphIndex + 1;
    switch (a) {
      case 1: {
        u.sbitOffsets = t.array("uint32", l + 1);
        break;
      }
      case 2: {
        u.imageSize = t.uint32(), u.bigMetrics = It(t);
        break;
      }
      case 3: {
        u.sbitOffsets = t.array("uint16", l + 1);
        break;
      }
      case 4: {
        const g = t.uint32();
        u.glyphArray = [];
        for (let p = 0; p <= g; p++)
          u.glyphArray.push({
            glyphID: t.uint16(),
            sbitOffset: t.uint16()
          });
        break;
      }
      case 5: {
        u.imageSize = t.uint32(), u.bigMetrics = It(t);
        const g = t.uint32();
        u.glyphIdArray = t.array("uint16", g);
        break;
      }
    }
    i.push(u);
  }
  return i;
}
function Gc(t, n) {
  const e = t.majorVersion ?? 2, o = t.minorVersion ?? 0, i = t.sizes ?? [], s = i.map(
    (u, l) => Hc(u.indexSubTables ?? [], n[l] ?? [])
  );
  let a = 8 + i.length * bs;
  const c = [];
  for (const u of s)
    c.push(a), a += u.length;
  const f = new S(a);
  f.uint16(e), f.uint16(o), f.uint32(i.length);
  for (let u = 0; u < i.length; u++) {
    const l = i[u], g = l.indexSubTables ?? [];
    f.uint32(c[u]), f.uint32(s[u].length), f.uint32(g.length), f.uint32(l.colorRef ?? 0), Vn(f, l.hori ?? {}), Vn(f, l.vert ?? {}), f.uint16(l.startGlyphIndex ?? 0), f.uint16(l.endGlyphIndex ?? 0), f.uint8(l.ppemX ?? 0), f.uint8(l.ppemY ?? 0), f.uint8(l.bitDepth ?? 0), f.int8(l.flags ?? 0);
  }
  for (const u of s)
    f.rawBytes(u);
  return f.toArray();
}
function Hc(t, n) {
  const e = t.map(
    (a, c) => $c(a, n[c] ?? {})
  );
  let i = t.length * 8;
  const s = [];
  for (const a of e)
    s.push(i), i += a.length;
  const r = new S(i);
  for (let a = 0; a < t.length; a++)
    r.uint16(t[a].firstGlyphIndex), r.uint16(t[a].lastGlyphIndex), r.uint32(s[a]);
  for (const a of e)
    r.rawBytes(a);
  return r.toArray();
}
function $c(t, n) {
  const e = t.indexFormat, o = t.imageFormat, i = n.imageDataOffset ?? 0, s = 8;
  switch (e) {
    case 1: {
      const r = n.sbitOffsets ?? [], a = new S(s + r.length * 4);
      a.uint16(e), a.uint16(o), a.uint32(i);
      for (const c of r) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const r = new S(s + 4 + xt);
      return r.uint16(e), r.uint16(o), r.uint32(i), r.uint32(t.imageSize ?? n.imageSize ?? 0), Jt(r, t.bigMetrics ?? {}), r.toArray();
    }
    case 3: {
      const r = n.sbitOffsets ?? [];
      let a = s + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new S(a);
      c.uint16(e), c.uint16(o), c.uint32(i);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    case 4: {
      const r = n.glyphArray ?? [], a = r.length > 0 ? r.length - 1 : 0, c = new S(s + 4 + r.length * 4);
      c.uint16(e), c.uint16(o), c.uint32(i), c.uint32(a);
      for (const f of r)
        c.uint16(f.glyphID), c.uint16(f.sbitOffset);
      return c.toArray();
    }
    case 5: {
      const r = t.glyphIdArray ?? [];
      let a = s + 4 + xt + 4 + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new S(a);
      c.uint16(e), c.uint16(o), c.uint32(i), c.uint32(t.imageSize ?? n.imageSize ?? 0), Jt(c, t.bigMetrics ?? {}), c.uint32(r.length);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    default:
      throw new Error(`Unsupported index format: ${e}`);
  }
}
function Zc(t) {
  const n = t.majorVersion ?? 2, e = t.minorVersion ?? 0, o = t.sizes ?? [], i = t.data ?? [], s = 8 + o.length * bs + i.length, r = new S(s);
  r.uint16(n), r.uint16(e), r.uint32(o.length);
  for (const a of o)
    r.uint32(a.indexSubTableArrayOffset ?? 0), r.uint32(a.indexTablesSize ?? 0), r.uint32(a.numberOfIndexSubTables ?? 0), r.uint32(a.colorRef ?? 0), Vn(r, a.hori ?? {}), Vn(r, a.vert ?? {}), r.uint16(a.startGlyphIndex ?? 0), r.uint16(a.endGlyphIndex ?? 0), r.uint8(a.ppemX ?? 0), r.uint8(a.ppemY ?? 0), r.uint8(a.bitDepth ?? 0), r.int8(a.flags ?? 0);
  return r.rawBytes(i), r.toArray();
}
function Po(t) {
  return {
    ascender: t.int8(),
    descender: t.int8(),
    widthMax: t.uint8(),
    caretSlopeNumerator: t.int8(),
    caretSlopeDenominator: t.int8(),
    caretOffset: t.int8(),
    minOriginSB: t.int8(),
    minAdvanceSB: t.int8(),
    maxBeforeBL: t.int8(),
    minAfterBL: t.int8(),
    pad1: t.int8(),
    pad2: t.int8()
  };
}
function Vn(t, n) {
  t.int8(n.ascender ?? 0), t.int8(n.descender ?? 0), t.uint8(n.widthMax ?? 0), t.int8(n.caretSlopeNumerator ?? 0), t.int8(n.caretSlopeDenominator ?? 0), t.int8(n.caretOffset ?? 0), t.int8(n.minOriginSB ?? 0), t.int8(n.minAdvanceSB ?? 0), t.int8(n.maxBeforeBL ?? 0), t.int8(n.minAfterBL ?? 0), t.int8(n.pad1 ?? 0), t.int8(n.pad2 ?? 0);
}
function jc(t) {
  return ao(t);
}
function Yc(t) {
  return Rt(t);
}
function qc(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = [], s = /* @__PURE__ */ new Set();
  for (let u = 0; u < o; u++) {
    const l = n.uint16(), g = n.uint16(), p = n.offset32();
    s.add(p), i.push({ platformID: l, encodingID: g, subtableOffset: p });
  }
  const r = [...s].sort((u, l) => u - l), a = r.map((u) => Wc(n, u)), c = new Map(r.map((u, l) => [u, l])), f = i.map((u) => ({
    platformID: u.platformID,
    encodingID: u.encodingID,
    subtableIndex: c.get(u.subtableOffset)
  }));
  return { version: e, encodingRecords: f, subtables: a };
}
function Wc(t, n) {
  t.seek(n);
  const e = t.uint16();
  switch (e) {
    case 0:
      return Xc(t);
    case 2:
      return Kc(t, n);
    case 4:
      return Jc(t, n);
    case 6:
      return Qc(t);
    case 8:
      return rf(t);
    case 10:
      return af(t);
    case 12:
      return tf(t);
    case 13:
      return nf(t);
    case 14:
      return ef(t, n);
    default:
      return cf(t, n, e);
  }
}
function Xc(t) {
  t.skip(2);
  const n = t.uint16(), e = t.array("uint8", 256);
  return { format: 0, language: n, glyphIdArray: e };
}
function Kc(t, n) {
  const e = t.uint16(), o = t.uint16(), i = t.array("uint16", 256);
  let s = 0;
  for (let g = 0; g < 256; g++)
    i[g] > s && (s = i[g]);
  const r = s / 8 + 1, a = [];
  for (let g = 0; g < r; g++)
    a.push({
      firstCode: t.uint16(),
      entryCount: t.uint16(),
      idDelta: t.int16(),
      idRangeOffset: t.uint16()
    });
  const c = t.position, u = (n + e - c) / 2, l = t.array("uint16", u);
  return { format: 2, language: o, subHeaderKeys: i, subHeaders: a, glyphIdArray: l };
}
function Jc(t, n) {
  const e = t.uint16(), o = t.uint16(), s = t.uint16() / 2;
  t.skip(6);
  const r = t.array("uint16", s);
  t.skip(2);
  const a = t.array("uint16", s), c = t.array("int16", s), f = t.array("uint16", s), u = t.position, l = (e - (u - n)) / 2, g = t.array("uint16", l), p = [];
  for (let h = 0; h < s; h++)
    p.push({
      endCode: r[h],
      startCode: a[h],
      idDelta: c[h],
      idRangeOffset: f[h]
    });
  return { format: 4, language: o, segments: p, glyphIdArray: g };
}
function Qc(t) {
  t.skip(2);
  const n = t.uint16(), e = t.uint16(), o = t.uint16(), i = t.array("uint16", o);
  return { format: 6, language: n, firstCode: e, glyphIdArray: i };
}
function tf(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 12, language: n, groups: o };
}
function nf(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      glyphID: t.uint32()
    });
  return { format: 13, language: n, groups: o };
}
function ef(t, n) {
  t.skip(4);
  const e = t.uint32(), o = [];
  for (let i = 0; i < e; i++) {
    const s = t.uint24(), r = t.offset32(), a = t.offset32();
    let c = null;
    if (r !== 0) {
      const u = t.position;
      c = of(t, n + r), t.seek(u);
    }
    let f = null;
    if (a !== 0) {
      const u = t.position;
      f = sf(
        t,
        n + a
      ), t.seek(u);
    }
    o.push({ varSelector: s, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: o };
}
function of(t, n) {
  t.seek(n);
  const e = t.uint32(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return o;
}
function sf(t, n) {
  t.seek(n);
  const e = t.uint32(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return o;
}
function rf(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.bytes(8192), o = t.uint32(), i = [];
  for (let s = 0; s < o; s++)
    i.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 8, language: n, is32: e, groups: i };
}
function af(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), o = t.uint32(), i = t.array("uint16", o);
  return { format: 10, language: n, startCharCode: e, glyphIdArray: i };
}
function cf(t, n, e) {
  let o;
  e >= 8 ? (t.skip(2), o = t.uint32()) : o = t.uint16(), t.seek(n);
  const i = t.bytes(o);
  return { format: e, _raw: i };
}
function ff(t) {
  const { version: n, encodingRecords: e, subtables: o } = t, i = o.map(uf), s = 4 + e.length * 8, r = [];
  let a = s;
  for (const u of i)
    r.push(a), a += u.length;
  const c = a, f = new S(c);
  f.uint16(n), f.uint16(e.length);
  for (const u of e)
    f.uint16(u.platformID), f.uint16(u.encodingID), f.offset32(r[u.subtableIndex]);
  for (let u = 0; u < i.length; u++)
    f.seek(r[u]), f.rawBytes(i[u]);
  return f.toArray();
}
function uf(t) {
  switch (t.format) {
    case 0:
      return lf(t);
    case 2:
      return hf(t);
    case 4:
      return gf(t);
    case 6:
      return pf(t);
    case 8:
      return df(t);
    case 10:
      return mf(t);
    case 12:
      return yf(t);
    case 13:
      return xf(t);
    case 14:
      return wf(t);
    default:
      return t._raw;
  }
}
function lf(t) {
  const e = new S(262);
  return e.uint16(0), e.uint16(262), e.uint16(t.language), e.array("uint8", t.glyphIdArray), e.toArray();
}
function hf(t) {
  const { language: n, subHeaderKeys: e, subHeaders: o, glyphIdArray: i } = t, s = 518 + o.length * 8 + i.length * 2, r = new S(s);
  r.uint16(2), r.uint16(s), r.uint16(n), r.array("uint16", e);
  for (const a of o)
    r.uint16(a.firstCode), r.uint16(a.entryCount), r.int16(a.idDelta), r.uint16(a.idRangeOffset);
  return r.array("uint16", i), r.toArray();
}
function gf(t) {
  const { language: n, segments: e, glyphIdArray: o } = t, i = e.length, s = i * 2, r = Math.floor(Math.log2(i)), a = Math.pow(2, r) * 2, c = s - a, f = 14 + i * 8 + 2 + o.length * 2, u = new S(f);
  u.uint16(4), u.uint16(f), u.uint16(n), u.uint16(s), u.uint16(a), u.uint16(r), u.uint16(c);
  for (const l of e) u.uint16(l.endCode);
  u.uint16(0);
  for (const l of e) u.uint16(l.startCode);
  for (const l of e) u.int16(l.idDelta);
  for (const l of e) u.uint16(l.idRangeOffset);
  return u.array("uint16", o), u.toArray();
}
function pf(t) {
  const { language: n, firstCode: e, glyphIdArray: o } = t, i = o.length, s = 10 + i * 2, r = new S(s);
  return r.uint16(6), r.uint16(s), r.uint16(n), r.uint16(e), r.uint16(i), r.array("uint16", o), r.toArray();
}
function df(t) {
  const { language: n, is32: e, groups: o } = t, i = 8208 + o.length * 12, s = new S(i);
  s.uint16(8), s.uint16(0), s.uint32(i), s.uint32(n), s.rawBytes(e), s.uint32(o.length);
  for (const r of o)
    s.uint32(r.startCharCode), s.uint32(r.endCharCode), s.uint32(r.startGlyphID);
  return s.toArray();
}
function mf(t) {
  const { language: n, startCharCode: e, glyphIdArray: o } = t, i = 20 + o.length * 2, s = new S(i);
  return s.uint16(10), s.uint16(0), s.uint32(i), s.uint32(n), s.uint32(e), s.uint32(o.length), s.array("uint16", o), s.toArray();
}
function yf(t) {
  const n = t.groups.length, e = 16 + n * 12, o = new S(e);
  o.uint16(12), o.uint16(0), o.uint32(e), o.uint32(t.language), o.uint32(n);
  for (const i of t.groups)
    o.uint32(i.startCharCode), o.uint32(i.endCharCode), o.uint32(i.startGlyphID);
  return o.toArray();
}
function xf(t) {
  const n = t.groups.length, e = 16 + n * 12, o = new S(e);
  o.uint16(13), o.uint16(0), o.uint32(e), o.uint32(t.language), o.uint32(n);
  for (const i of t.groups)
    o.uint32(i.startCharCode), o.uint32(i.endCharCode), o.uint32(i.glyphID);
  return o.toArray();
}
function wf(t) {
  const { varSelectorRecords: n } = t, e = n.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? _f(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? Sf(c.nonDefaultUVS) : null
  }));
  let i = 10 + n.length * 11;
  const s = e.map((c) => {
    let f = 0;
    c.defaultUVSBytes && (f = i, i += c.defaultUVSBytes.length);
    let u = 0;
    return c.nonDefaultUVSBytes && (u = i, i += c.nonDefaultUVSBytes.length), { defaultUVSOffset: f, nonDefaultUVSOffset: u };
  }), r = i, a = new S(r);
  a.uint16(14), a.uint32(r), a.uint32(n.length);
  for (let c = 0; c < n.length; c++)
    a.uint24(n[c].varSelector), a.uint32(s[c].defaultUVSOffset), a.uint32(s[c].nonDefaultUVSOffset);
  for (let c = 0; c < e.length; c++)
    e[c].defaultUVSBytes && a.rawBytes(e[c].defaultUVSBytes), e[c].nonDefaultUVSBytes && a.rawBytes(e[c].nonDefaultUVSBytes);
  return a.toArray();
}
function _f(t) {
  const n = 4 + t.length * 4, e = new S(n);
  e.uint32(t.length);
  for (const o of t)
    e.uint24(o.startUnicodeValue), e.uint8(o.additionalCount);
  return e.toArray();
}
function Sf(t) {
  const n = 4 + t.length * 5, e = new S(n);
  e.uint32(t.length);
  for (const o of t)
    e.uint24(o.unicodeValue), e.uint16(o.glyphID);
  return e.toArray();
}
const qt = [
  0,
  // index 0 unused
  6,
  5,
  9,
  // 1-3
  16,
  20,
  // 4-5  (+ ColorLine / VarColorLine inline)
  16,
  20,
  // 6-7  (+ ColorLine / VarColorLine inline)
  12,
  16,
  // 8-9  (+ ColorLine / VarColorLine inline)
  6,
  3,
  // 10-11
  7,
  7,
  // 12-13 (+ Affine2x3 / VarAffine2x3 inline)
  8,
  12,
  // 14-15
  8,
  12,
  // 16-17
  12,
  16,
  // 18-19
  6,
  10,
  // 20-21
  10,
  14,
  // 22-23
  6,
  10,
  // 24-25
  10,
  14,
  // 26-27
  8,
  12,
  // 28-29
  12,
  16,
  // 30-31
  8
  // 32
], ks = 15, Cs = 48;
function vf(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function Af(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
function bf(t, n) {
  t.seek(n);
  const e = t.uint8(), o = t.uint8(), i = e === 1 ? t.uint32() : t.uint16(), s = (o & ks) + 1, r = ((o & Cs) >> 4) + 1, a = [];
  for (let c = 0; c < i; c++) {
    const f = vf(t, r), u = (1 << s) - 1;
    a.push({
      outerIndex: f >> s,
      innerIndex: f & u
    });
  }
  return { format: e, entryFormat: o, mapCount: i, entries: a };
}
function kf(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = t.format ?? (e > 65535 ? 1 : 0);
  let i = 0, s = 0;
  for (const h of n)
    i = Math.max(i, h.innerIndex ?? 0), s = Math.max(s, h.outerIndex ?? 0);
  let r = 1;
  for (; (1 << r) - 1 < i && r < 16; )
    r++;
  const a = s << r | i;
  let c = 1;
  for (; c < 4 && a > (c === 1 ? 255 : c === 2 ? 65535 : 16777215); )
    c++;
  const f = t.entryFormat ?? c - 1 << 4 | r - 1, u = o === 1 ? 6 : 4, l = (f & ks) + 1, g = ((f & Cs) >> 4) + 1, p = new S(u + e * g);
  p.uint8(o), p.uint8(f), o === 1 ? p.uint32(e) : p.uint16(e);
  for (let h = 0; h < e; h++) {
    const d = n[h] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << l | (d.innerIndex ?? 0) & (1 << l) - 1;
    Af(p, x, g);
  }
  return p.toArray();
}
function Cf(t, n) {
  const e = /* @__PURE__ */ new Map(), o = Of(
    t,
    n.baseGlyphListOffset,
    e
  ), i = n.layerListOffset ? If(t, n.layerListOffset, e) : null, s = n.clipListOffset ? Df(t, n.clipListOffset) : null, r = n.varIndexMapOffset ? bf(t, n.varIndexMapOffset) : null;
  n.itemVariationStoreOffset && zt(
    t.bytes(0).length ? [] : []
    // unused — we re-read below
  );
  let a = null;
  if (n.itemVariationStoreOffset) {
    t.seek(n.itemVariationStoreOffset);
    const c = [];
    for (; t.position < t.length; )
      c.push(t.uint8());
    a = zt(c);
  }
  return {
    baseGlyphPaintRecords: o,
    layerPaints: i,
    clipList: s,
    varIndexMap: r,
    itemVariationStore: a
  };
}
function Of(t, n, e) {
  t.seek(n);
  const o = t.uint32(), i = [], s = [];
  for (let r = 0; r < o; r++)
    s.push({
      glyphID: t.uint16(),
      paintOffset: t.uint32()
    });
  for (const r of s)
    i.push({
      glyphID: r.glyphID,
      paint: G(t, n + r.paintOffset, e)
    });
  return i;
}
function If(t, n, e) {
  t.seek(n);
  const o = t.uint32(), i = [];
  for (let r = 0; r < o; r++)
    i.push(t.uint32());
  const s = [];
  for (const r of i)
    s.push(G(t, n + r, e));
  return s;
}
function Df(t, n) {
  t.seek(n);
  const e = t.uint8(), o = t.uint32(), i = [];
  for (let r = 0; r < o; r++)
    i.push({
      startGlyphID: t.uint16(),
      endGlyphID: t.uint16(),
      clipBoxOffset: t.uint24()
    });
  const s = i.map((r) => ({
    startGlyphID: r.startGlyphID,
    endGlyphID: r.endGlyphID,
    clipBox: Ef(t, n + r.clipBoxOffset)
  }));
  return { format: e, clips: s };
}
function Ef(t, n) {
  t.seek(n);
  const e = t.uint8(), o = t.fword(), i = t.fword(), s = t.fword(), r = t.fword(), a = { format: e, xMin: o, yMin: i, xMax: s, yMax: r };
  return e === 2 && (a.varIndexBase = t.uint32()), a;
}
function co(t, n, e) {
  t.seek(n);
  const o = t.uint8(), i = t.uint16(), s = [];
  for (let r = 0; r < i; r++) {
    const a = {
      stopOffset: t.f2dot14(),
      paletteIndex: t.uint16(),
      alpha: t.f2dot14()
    };
    e && (a.varIndexBase = t.uint32()), s.push(a);
  }
  return { extend: o, colorStops: s };
}
function Bf(t, n, e) {
  t.seek(n);
  const o = {
    xx: t.fixed(),
    yx: t.fixed(),
    xy: t.fixed(),
    yy: t.fixed(),
    dx: t.fixed(),
    dy: t.fixed()
  };
  return e && (o.varIndexBase = t.uint32()), o;
}
function G(t, n, e) {
  if (e.has(n)) return e.get(n);
  t.seek(n);
  const o = t.uint8();
  let i;
  switch (o) {
    case 1:
      i = Tf(t);
      break;
    case 2:
      i = Uo(t, !1);
      break;
    case 3:
      i = Uo(t, !0);
      break;
    case 4:
      i = No(t, n, !1);
      break;
    case 5:
      i = No(t, n, !0);
      break;
    case 6:
      i = Go(t, n, !1);
      break;
    case 7:
      i = Go(t, n, !0);
      break;
    case 8:
      i = Ho(t, n, !1);
      break;
    case 9:
      i = Ho(t, n, !0);
      break;
    case 10:
      i = Rf(t, n, e);
      break;
    case 11:
      i = Mf(t);
      break;
    case 12:
      i = $o(t, n, e, !1);
      break;
    case 13:
      i = $o(t, n, e, !0);
      break;
    case 14:
      i = Zo(t, n, e, !1);
      break;
    case 15:
      i = Zo(t, n, e, !0);
      break;
    case 16:
      i = jo(t, n, e, !1);
      break;
    case 17:
      i = jo(t, n, e, !0);
      break;
    case 18:
      i = Yo(t, n, e, !1);
      break;
    case 19:
      i = Yo(t, n, e, !0);
      break;
    case 20:
      i = qo(t, n, e, !1);
      break;
    case 21:
      i = qo(t, n, e, !0);
      break;
    case 22:
      i = Wo(t, n, e, !1);
      break;
    case 23:
      i = Wo(t, n, e, !0);
      break;
    case 24:
      i = Xo(t, n, e, !1);
      break;
    case 25:
      i = Xo(t, n, e, !0);
      break;
    case 26:
      i = Ko(t, n, e, !1);
      break;
    case 27:
      i = Ko(t, n, e, !0);
      break;
    case 28:
      i = Jo(t, n, e, !1);
      break;
    case 29:
      i = Jo(t, n, e, !0);
      break;
    case 30:
      i = Qo(t, n, e, !1);
      break;
    case 31:
      i = Qo(t, n, e, !0);
      break;
    case 32:
      i = Lf(t, n, e);
      break;
    default:
      return i = { format: o, _unknown: !0 }, e.set(n, i), i;
  }
  return i.format = o, e.set(n, i), i;
}
function Tf(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function Uo(t, n) {
  const e = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return n && (e.varIndexBase = t.uint32()), e;
}
function No(t, n, e) {
  const o = t.uint24(), i = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return e && (i.varIndexBase = t.uint32()), i.colorLine = co(t, n + o, e), i;
}
function Go(t, n, e) {
  const o = t.uint24(), i = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return e && (i.varIndexBase = t.uint32()), i.colorLine = co(t, n + o, e), i;
}
function Ho(t, n, e) {
  const o = t.uint24(), i = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return e && (i.varIndexBase = t.uint32()), i.colorLine = co(t, n + o, e), i;
}
function Rf(t, n, e) {
  const o = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: G(t, n + o, e)
  };
}
function Mf(t) {
  return { glyphID: t.uint16() };
}
function $o(t, n, e, o) {
  const i = t.uint24(), s = t.uint24();
  return {
    paint: G(t, n + i, e),
    transform: Bf(t, n + s, o)
  };
}
function Zo(t, n, e, o) {
  const i = t.uint24(), s = {
    dx: t.fword(),
    dy: t.fword()
  };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function jo(t, n, e, o) {
  const i = t.uint24(), s = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function Yo(t, n, e, o) {
  const i = t.uint24(), s = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function qo(t, n, e, o) {
  const i = t.uint24(), s = { scale: t.f2dot14() };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function Wo(t, n, e, o) {
  const i = t.uint24(), s = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function Xo(t, n, e, o) {
  const i = t.uint24(), s = { angle: t.f2dot14() };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function Ko(t, n, e, o) {
  const i = t.uint24(), s = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function Jo(t, n, e, o) {
  const i = t.uint24(), s = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function Qo(t, n, e, o) {
  const i = t.uint24(), s = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (s.varIndexBase = t.uint32()), s.paint = G(t, n + i, e), s;
}
function Lf(t, n, e) {
  const o = t.uint24(), i = t.uint8(), s = t.uint24();
  return {
    sourcePaint: G(t, n + o, e),
    compositeMode: i,
    backdropPaint: G(t, n + s, e)
  };
}
function zf(t) {
  const {
    baseGlyphPaintRecords: n,
    layerPaints: e,
    clipList: o,
    varIndexMap: i,
    itemVariationStore: s
  } = t, r = /* @__PURE__ */ new Map(), a = [];
  function c(B) {
    if (!(!B || r.has(B))) {
      r.set(B, a.length), a.push(B);
      for (const F of ze(B))
        c(F);
    }
  }
  if (n)
    for (const B of n)
      c(B.paint);
  if (e)
    for (const B of e)
      c(B);
  const f = Vf(a), u = /* @__PURE__ */ new Map();
  for (const B of f)
    u.set(B, Ff(B));
  const l = /* @__PURE__ */ new Map();
  let g = 0;
  for (const B of f)
    l.set(B, g), g += u.get(B);
  const p = g, h = n ? n.length : 0, d = 4 + h * 6, x = e ? e.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = o ? Nf(o) : [], _ = i ? kf(i) : [], w = s ? pn(s) : [], v = d + m + p + y.length + _.length + w.length, b = 0, A = d, D = d + m, C = D + p, k = C + y.length, O = k + _.length, I = new S(v);
  I.uint32(h);
  for (const B of n || [])
    I.uint16(B.glyphID), I.uint32(D - b + l.get(B.paint));
  if (x > 0) {
    I.uint32(x);
    for (const B of e)
      I.uint32(D - A + l.get(B));
  }
  for (const B of f)
    Pf(
      I,
      B,
      D + l.get(B),
      l,
      D
    );
  return I.rawBytes(y), I.rawBytes(_), I.rawBytes(w), {
    bodyBytes: I.toArray(),
    bglBodyOffset: b,
    llBodyOffset: x > 0 ? A : 0,
    clipBodyOffset: y.length > 0 ? C : 0,
    dimBodyOffset: _.length > 0 ? k : 0,
    ivsBodyOffset: w.length > 0 ? O : 0
  };
}
function ze(t) {
  if (!t) return [];
  const n = [];
  return t.paint && n.push(t.paint), t.sourcePaint && n.push(t.sourcePaint), t.backdropPaint && n.push(t.backdropPaint), n;
}
function Vf(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (const a of t) e.set(a, 0);
  for (const a of t)
    for (const c of ze(a))
      e.has(c) && e.set(c, e.get(c) + 1);
  const o = [];
  let i = 0;
  for (const a of t)
    e.get(a) === 0 && o.push(a);
  const s = [], r = /* @__PURE__ */ new Set();
  for (; i < o.length; ) {
    const a = o[i++];
    s.push(a), r.add(a);
    for (const c of ze(a)) {
      if (!e.has(c)) continue;
      const f = e.get(c) - 1;
      e.set(c, f), f === 0 && o.push(c);
    }
  }
  for (const a of t)
    r.has(a) || s.push(a);
  return s;
}
function Ff(t) {
  const n = qt[t.format] || 0, e = t.format;
  return e === 4 || e === 6 || e === 8 ? n + ti(t.colorLine, !1) : e === 5 || e === 7 || e === 9 ? n + ti(t.colorLine, !0) : e === 12 ? n + 24 : e === 13 ? n + 28 : n;
}
function ti(t, n) {
  if (!t) return 0;
  const e = n ? 10 : 6;
  return 3 + t.colorStops.length * e;
}
function Pf(t, n, e, o, i) {
  const s = n.format;
  switch (t.uint8(s), s) {
    case 1:
      t.uint8(n.numLayers), t.uint32(n.firstLayerIndex);
      break;
    case 2:
      t.uint16(n.paletteIndex), t.f2dot14(n.alpha);
      break;
    case 3:
      t.uint16(n.paletteIndex), t.f2dot14(n.alpha), t.uint32(n.varIndexBase);
      break;
    case 4:
    // PaintLinearGradient
    case 5: {
      const r = qt[s];
      t.uint24(r), t.fword(n.x0), t.fword(n.y0), t.fword(n.x1), t.fword(n.y1), t.fword(n.x2), t.fword(n.y2), s === 5 && t.uint32(n.varIndexBase), ue(t, n.colorLine, s === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const r = qt[s];
      t.uint24(r), t.fword(n.x0), t.fword(n.y0), t.ufword(n.radius0), t.fword(n.x1), t.fword(n.y1), t.ufword(n.radius1), s === 7 && t.uint32(n.varIndexBase), ue(t, n.colorLine, s === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const r = qt[s];
      t.uint24(r), t.fword(n.centerX), t.fword(n.centerY), t.f2dot14(n.startAngle), t.f2dot14(n.endAngle), s === 9 && t.uint32(n.varIndexBase), ue(t, n.colorLine, s === 9);
      break;
    }
    case 10: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.uint16(n.glyphID);
      break;
    }
    case 11:
      t.uint16(n.glyphID);
      break;
    case 12:
    // PaintTransform
    case 13: {
      const r = i + o.get(n.paint), a = qt[s];
      t.uint24(r - e), t.uint24(a), Uf(t, n.transform, s === 13);
      break;
    }
    case 14:
    // PaintTranslate
    case 15: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.fword(n.dx), t.fword(n.dy), s === 15 && t.uint32(n.varIndexBase);
      break;
    }
    case 16:
    // PaintScale
    case 17: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scaleX), t.f2dot14(n.scaleY), s === 17 && t.uint32(n.varIndexBase);
      break;
    }
    case 18:
    // PaintScaleAroundCenter
    case 19: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scaleX), t.f2dot14(n.scaleY), t.fword(n.centerX), t.fword(n.centerY), s === 19 && t.uint32(n.varIndexBase);
      break;
    }
    case 20:
    // PaintScaleUniform
    case 21: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scale), s === 21 && t.uint32(n.varIndexBase);
      break;
    }
    case 22:
    // PaintScaleUniformAroundCenter
    case 23: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scale), t.fword(n.centerX), t.fword(n.centerY), s === 23 && t.uint32(n.varIndexBase);
      break;
    }
    case 24:
    // PaintRotate
    case 25: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.angle), s === 25 && t.uint32(n.varIndexBase);
      break;
    }
    case 26:
    // PaintRotateAroundCenter
    case 27: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.angle), t.fword(n.centerX), t.fword(n.centerY), s === 27 && t.uint32(n.varIndexBase);
      break;
    }
    case 28:
    // PaintSkew
    case 29: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.xSkewAngle), t.f2dot14(n.ySkewAngle), s === 29 && t.uint32(n.varIndexBase);
      break;
    }
    case 30:
    // PaintSkewAroundCenter
    case 31: {
      const r = i + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.xSkewAngle), t.f2dot14(n.ySkewAngle), t.fword(n.centerX), t.fword(n.centerY), s === 31 && t.uint32(n.varIndexBase);
      break;
    }
    case 32: {
      const r = i + o.get(n.sourcePaint), a = i + o.get(n.backdropPaint);
      t.uint24(r - e), t.uint8(n.compositeMode), t.uint24(a - e);
      break;
    }
  }
}
function ue(t, n, e) {
  t.uint8(n.extend), t.uint16(n.colorStops.length);
  for (const o of n.colorStops)
    t.f2dot14(o.stopOffset), t.uint16(o.paletteIndex), t.f2dot14(o.alpha), e && t.uint32(o.varIndexBase);
}
function Uf(t, n, e) {
  t.fixed(n.xx), t.fixed(n.yx), t.fixed(n.xy), t.fixed(n.yy), t.fixed(n.dx), t.fixed(n.dy), e && t.uint32(n.varIndexBase);
}
function Nf(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const n = [];
  for (const a of t.clips)
    n.push(Gf(a.clipBox));
  let o = 5 + t.clips.length * 7;
  const i = [];
  for (const a of n)
    i.push(o), o += a.length;
  const s = o, r = new S(s);
  r.uint8(t.format || 1), r.uint32(t.clips.length);
  for (let a = 0; a < t.clips.length; a++)
    r.uint16(t.clips[a].startGlyphID), r.uint16(t.clips[a].endGlyphID), r.uint24(i[a]);
  for (const a of n)
    r.rawBytes(a);
  return r.toArray();
}
function Gf(t) {
  const n = t.format === 2 ? 13 : 9, e = new S(n);
  return e.uint8(t.format), e.fword(t.xMin), e.fword(t.yMin), e.fword(t.xMax), e.fword(t.yMax), t.format === 2 && e.uint32(t.varIndexBase), e.toArray();
}
function Hf(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint32(), s = n.uint32(), r = n.uint16(), a = [];
  if (o > 0 && i > 0) {
    n.seek(i);
    for (let u = 0; u < o; u++)
      a.push({
        glyphID: n.uint16(),
        firstLayerIndex: n.uint16(),
        numLayers: n.uint16()
      });
  }
  const c = [];
  if (r > 0 && s > 0) {
    n.seek(s);
    for (let u = 0; u < r; u++)
      c.push({
        glyphID: n.uint16(),
        paletteIndex: n.uint16()
      });
  }
  const f = {
    version: e,
    baseGlyphRecords: a,
    layerRecords: c
  };
  if (e >= 1) {
    n.seek(14);
    const u = n.uint32(), l = n.uint32(), g = n.uint32(), p = n.uint32(), h = n.uint32(), x = Cf(n, {
      baseGlyphListOffset: u,
      layerListOffset: l,
      clipListOffset: g,
      varIndexMapOffset: p,
      itemVariationStoreOffset: h
    });
    f.baseGlyphPaintRecords = x.baseGlyphPaintRecords, f.layerPaints = x.layerPaints, f.clipList = x.clipList, f.varIndexMap = x.varIndexMap, f.itemVariationStore = x.itemVariationStore;
  }
  return f;
}
function $f(t) {
  const { baseGlyphRecords: n, layerRecords: e } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const l = n.length * 6, g = e.length * 4, d = 14 + 20, x = l + g, m = d + x, y = zf({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), _ = y.bodyBytes, w = m + y.bglBodyOffset, v = y.llBodyOffset ? m + y.llBodyOffset : 0, b = y.clipBodyOffset ? m + y.clipBodyOffset : 0, A = y.dimBodyOffset ? m + y.dimBodyOffset : 0, D = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, C = m + _.length, k = new S(C);
    k.uint16(t.version), k.uint16(n.length), k.uint32(n.length > 0 ? d : 0), k.uint32(e.length > 0 ? d + l : 0), k.uint16(e.length), k.uint32(w), k.uint32(v), k.uint32(b), k.uint32(A), k.uint32(D);
    for (const O of n)
      k.uint16(O.glyphID), k.uint16(O.firstLayerIndex), k.uint16(O.numLayers);
    for (const O of e)
      k.uint16(O.glyphID), k.uint16(O.paletteIndex);
    return k.rawBytes(_), k.toArray();
  }
  const o = 14, i = n.length > 0 ? o : 0, s = n.length * 6, r = e.length > 0 ? o + s : 0, a = e.length * 4, c = o + s + a, f = new S(c);
  f.uint16(t.version), f.uint16(n.length), f.uint32(i), f.uint32(r), f.uint16(e.length);
  for (const u of n)
    f.uint16(u.glyphID), f.uint16(u.firstLayerIndex), f.uint16(u.numLayers);
  for (const u of e)
    f.uint16(u.glyphID), f.uint16(u.paletteIndex);
  return f.toArray();
}
function Zf(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = n.uint16(), r = n.uint32(), a = [];
  for (let h = 0; h < i; h++)
    a.push(n.uint16());
  let c = 0, f = 0, u = 0;
  e >= 1 && (c = n.uint32(), f = n.uint32(), u = n.uint32()), n.seek(r);
  const l = [];
  for (let h = 0; h < s; h++)
    l.push({
      blue: n.uint8(),
      green: n.uint8(),
      red: n.uint8(),
      alpha: n.uint8()
    });
  const g = [];
  for (let h = 0; h < i; h++) {
    const d = a[h], x = [];
    for (let m = 0; m < o; m++)
      x.push({ ...l[d + m] });
    g.push(x);
  }
  const p = {
    version: e,
    numPaletteEntries: o,
    palettes: g
  };
  if (e >= 1 && c !== 0) {
    n.seek(c), p.paletteTypes = [];
    for (let h = 0; h < i; h++)
      p.paletteTypes.push(n.uint32());
  }
  if (e >= 1 && f !== 0) {
    n.seek(f), p.paletteLabels = [];
    for (let h = 0; h < i; h++)
      p.paletteLabels.push(n.uint16());
  }
  if (e >= 1 && u !== 0) {
    n.seek(u), p.paletteEntryLabels = [];
    for (let h = 0; h < o; h++)
      p.paletteEntryLabels.push(n.uint16());
  }
  return p;
}
function jf(t) {
  const { version: n, numPaletteEntries: e, palettes: o } = t, i = o.length, s = [], r = [];
  for (let y = 0; y < i; y++) {
    s.push(r.length);
    for (let _ = 0; _ < e; _++)
      r.push(o[y][_]);
  }
  const a = r.length, c = 12 + i * 2, f = n >= 1 ? 12 : 0, u = c + f, l = a * 4;
  let g = u + l, p = 0, h = 0, d = 0;
  n >= 1 && t.paletteTypes && (p = g, g += i * 4), n >= 1 && t.paletteLabels && (h = g, g += i * 2), n >= 1 && t.paletteEntryLabels && (d = g, g += e * 2);
  const x = g, m = new S(x);
  m.uint16(n), m.uint16(e), m.uint16(i), m.uint16(a), m.uint32(u);
  for (let y = 0; y < i; y++)
    m.uint16(s[y]);
  n >= 1 && (m.uint32(p), m.uint32(h), m.uint32(d));
  for (const y of r)
    m.uint8(y.blue), m.uint8(y.green), m.uint8(y.red), m.uint8(y.alpha);
  if (n >= 1 && t.paletteTypes)
    for (const y of t.paletteTypes)
      m.uint32(y);
  if (n >= 1 && t.paletteLabels)
    for (const y of t.paletteLabels)
      m.uint16(y);
  if (n >= 1 && t.paletteEntryLabels)
    for (const y of t.paletteEntryLabels)
      m.uint16(y);
  return m.toArray();
}
const Yf = 8, qf = 12;
function Wf(t) {
  const n = new E(t), e = n.uint32(), o = n.uint16(), i = n.uint16(), s = [];
  for (let a = 0; a < o; a++)
    s.push({
      format: n.uint32(),
      length: n.uint32(),
      offset: n.offset32()
    });
  const r = s.map((a) => {
    const c = a.offset, f = Math.min(t.length, c + a.length);
    return c <= 0 || c >= t.length || f < c ? { ...a, _raw: [] } : {
      ...a,
      _raw: Array.from(t.slice(c, f))
    };
  });
  return {
    version: e,
    flags: i,
    signatures: r
  };
}
function Xf(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, i = (t.signatures ?? []).map((c) => {
    const f = Kf(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let s = Yf + i.length * qf;
  const r = i.map((c) => {
    const f = {
      format: c.format,
      length: c.bytes.length,
      offset: c.bytes.length ? s : 0
    };
    return s += c.bytes.length, f;
  }), a = new S(s);
  a.uint32(n), a.uint16(i.length), a.uint16(e);
  for (const c of r)
    a.uint32(c.format), a.uint32(c.length), a.offset32(c.offset);
  for (const c of i)
    a.rawBytes(c.bytes);
  return a.toArray();
}
function Kf(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function Jf(t, n) {
  return so(t, n?.EBLC ? { CBLC: n.EBLC } : n);
}
function Qf(t) {
  return ro(t);
}
function tu(t) {
  return ao(t);
}
function nu(t) {
  return Rt(t);
}
const Ve = 28;
function eu(t) {
  const n = new E(t), e = n.uint32(), o = n.uint32(), i = [];
  for (let s = 0; s < o; s++) {
    const r = n.position;
    i.push({
      hori: ni(n),
      vert: ni(n),
      substitutePpemX: n.uint8(),
      substitutePpemY: n.uint8(),
      originalPpemX: n.uint8(),
      originalPpemY: n.uint8(),
      _raw: Array.from(t.slice(r, r + Ve))
    });
  }
  return { version: e, scales: i };
}
function ou(t) {
  const n = t.version ?? 131072, e = t.scales ?? [], o = new S(8 + e.length * Ve);
  o.uint32(n), o.uint32(e.length);
  for (const i of e) {
    if (i._raw && i._raw.length === Ve) {
      o.rawBytes(i._raw);
      continue;
    }
    ei(o, i.hori ?? {}), ei(o, i.vert ?? {}), o.uint8(i.substitutePpemX ?? 0), o.uint8(i.substitutePpemY ?? 0), o.uint8(i.originalPpemX ?? 0), o.uint8(i.originalPpemY ?? 0);
  }
  return o.toArray();
}
function ni(t) {
  return {
    ascender: t.int8(),
    descender: t.int8(),
    widthMax: t.uint8(),
    caretSlopeNumerator: t.int8(),
    caretSlopeDenominator: t.int8(),
    caretOffset: t.int8(),
    minOriginSB: t.int8(),
    minAdvanceSB: t.int8(),
    maxBeforeBL: t.int8(),
    minAfterBL: t.int8(),
    pad1: t.int8(),
    pad2: t.int8()
  };
}
function ei(t, n) {
  t.int8(n.ascender ?? 0), t.int8(n.descender ?? 0), t.uint8(n.widthMax ?? 0), t.int8(n.caretSlopeNumerator ?? 0), t.int8(n.caretSlopeDenominator ?? 0), t.int8(n.caretOffset ?? 0), t.int8(n.minOriginSB ?? 0), t.int8(n.minAdvanceSB ?? 0), t.int8(n.maxBeforeBL ?? 0), t.int8(n.minAfterBL ?? 0), t.int8(n.pad1 ?? 0), t.int8(n.pad2 ?? 0);
}
const oi = 16, iu = 20;
function su(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.offset16(), s = n.uint16(), r = n.uint16(), a = n.uint16(), c = n.uint16(), f = n.uint16(), u = [];
  for (let d = 0; d < r; d++)
    n.seek(i + d * a), u.push({
      axisTag: n.tag(),
      minValue: n.fixed(),
      defaultValue: n.fixed(),
      maxValue: n.fixed(),
      flags: n.uint16(),
      axisNameID: n.uint16()
    });
  const l = [], g = i + r * a, p = 4 + r * 4, h = f >= p + 2;
  for (let d = 0; d < c; d++) {
    n.seek(g + d * f);
    const x = {
      subfamilyNameID: n.uint16(),
      flags: n.uint16(),
      coordinates: []
    };
    for (let m = 0; m < r; m++)
      x.coordinates.push(n.fixed());
    h && (x.postScriptNameID = n.uint16()), l.push(x);
  }
  return {
    majorVersion: e,
    minorVersion: o,
    reserved: s,
    axisSize: a,
    instanceSize: f,
    axes: u,
    instances: l
  };
}
function ru(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 2, i = t.axes ?? [], s = t.instances ?? [], r = i.length, a = iu, c = 4 + r * 4, f = s.some(
    (d) => d.postScriptNameID !== void 0
  ), u = f ? c + 2 : c, l = s.length, g = oi, p = oi + r * a + l * u, h = new S(p);
  h.uint16(n), h.uint16(e), h.offset16(g), h.uint16(o), h.uint16(r), h.uint16(a), h.uint16(l), h.uint16(u);
  for (const d of i)
    h.tag(d.axisTag), h.fixed(d.minValue), h.fixed(d.defaultValue), h.fixed(d.maxValue), h.uint16(d.flags ?? 0), h.uint16(d.axisNameID ?? 0);
  for (const d of s) {
    h.uint16(d.subfamilyNameID ?? 0), h.uint16(d.flags ?? 0);
    for (let x = 0; x < r; x++)
      h.fixed(d.coordinates?.[x] ?? 0);
    f && h.uint16(d.postScriptNameID ?? 65535);
  }
  return h.toArray();
}
function au(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = n.uint16(), r = n.uint16(), a = n.uint16();
  let c = 0;
  o >= 2 && (c = n.uint16());
  let f = 0;
  o >= 3 && (f = n.uint32());
  const u = { majorVersion: e, minorVersion: o };
  return i !== 0 && (u.glyphClassDef = ct(n, i)), s !== 0 && (u.attachList = cu(n, s)), r !== 0 && (u.ligCaretList = fu(n, r)), a !== 0 && (u.markAttachClassDef = ct(n, a)), c !== 0 && (u.markGlyphSetsDef = lu(
    n,
    c
  )), f !== 0 && (u.itemVarStoreOffset = f, u.itemVarStoreRaw = Array.from(
    new Uint8Array(
      new E(t).view.buffer,
      new E(t).view.byteOffset + f,
      t.length - f
    )
  )), u;
}
function cu(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.array("uint16", o), s = L(t, n + e), r = i.map((a) => {
    t.seek(n + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: s, attachPoints: r };
}
function fu(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = t.array("uint16", o), s = L(t, n + e), r = i.map(
    (a) => uu(t, n + a)
  );
  return { coverage: s, ligGlyphs: r };
}
function uu(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((i) => {
    const s = n + i;
    t.seek(s);
    const r = t.uint16();
    if (r === 1)
      return { format: r, coordinate: t.int16() };
    if (r === 2)
      return { format: r, caretValuePointIndex: t.uint16() };
    if (r === 3) {
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? Vt(t, s + c) : null;
      return { format: r, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${r}`);
  });
}
function lu(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++)
    i.push(t.uint32());
  const s = i.map(
    (r) => L(t, n + r)
  );
  return { format: e, coverages: s };
}
function hu(t) {
  const { majorVersion: n, minorVersion: e } = t, o = t.glyphClassDef ? ft(t.glyphClassDef) : null, i = t.attachList ? gu(t.attachList) : null, s = t.ligCaretList ? du(t.ligCaretList) : null, r = t.markAttachClassDef ? ft(t.markAttachClassDef) : null, a = e >= 2 && t.markGlyphSetsDef ? xu(t.markGlyphSetsDef) : null, c = e >= 3 && t.itemVarStoreRaw ? t.itemVarStoreRaw : null;
  let f = 12;
  e >= 2 && (f += 2), e >= 3 && (f += 4);
  let u = f;
  const l = o ? u : 0;
  o && (u += o.length);
  const g = i ? u : 0;
  i && (u += i.length);
  const p = s ? u : 0;
  s && (u += s.length);
  const h = r ? u : 0;
  r && (u += r.length);
  const d = a ? u : 0;
  a && (u += a.length);
  const x = c ? u : 0;
  c && (u += c.length);
  const m = new S(u);
  return m.uint16(n), m.uint16(e), m.uint16(l), m.uint16(g), m.uint16(p), m.uint16(h), e >= 2 && m.uint16(d), e >= 3 && m.uint32(x), o && (m.seek(l), m.rawBytes(o)), i && (m.seek(g), m.rawBytes(i)), s && (m.seek(p), m.rawBytes(s)), r && (m.seek(h), m.rawBytes(r)), a && (m.seek(d), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function gu(t) {
  const n = z(t.coverage), e = t.attachPoints.map(pu);
  let i = 4 + t.attachPoints.length * 2;
  const s = i;
  i += n.length;
  const r = e.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new S(i);
  a.uint16(s), a.uint16(t.attachPoints.length), a.array("uint16", r), a.seek(s), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function pu(t) {
  const n = 2 + t.length * 2, e = new S(n);
  return e.uint16(t.length), e.array("uint16", t), e.toArray();
}
function du(t) {
  const n = z(t.coverage), e = t.ligGlyphs.map(mu);
  let i = 4 + t.ligGlyphs.length * 2;
  const s = i;
  i += n.length;
  const r = e.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new S(i);
  a.uint16(s), a.uint16(t.ligGlyphs.length), a.array("uint16", r), a.seek(s), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function mu(t) {
  const n = t.map(yu);
  let o = 2 + t.length * 2;
  const i = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.length), s.array("uint16", i);
  for (let r = 0; r < n.length; r++)
    s.seek(i[r]), s.rawBytes(n[r]);
  return s.toArray();
}
function yu(t) {
  if (t.format === 1) {
    const n = new S(4);
    return n.uint16(1), n.int16(t.coordinate), n.toArray();
  }
  if (t.format === 2) {
    const n = new S(4);
    return n.uint16(2), n.uint16(t.caretValuePointIndex), n.toArray();
  }
  if (t.format === 3) {
    const n = t.device ? zn(t.device) : null, e = 6 + (n ? n.length : 0), o = new S(e);
    return o.uint16(3), o.int16(t.coordinate), o.uint16(n ? 6 : 0), n && o.rawBytes(n), o.toArray();
  }
  throw new Error(`Unknown CaretValue format: ${t.format}`);
}
function xu(t) {
  const n = t.coverages.map(z);
  let o = 4 + t.coverages.length * 4;
  const i = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.format), s.uint16(t.coverages.length);
  for (const r of i) s.uint32(r);
  for (let r = 0; r < n.length; r++)
    s.seek(i[r]), s.rawBytes(n[r]);
  return s.toArray();
}
function rt(t) {
  let n = 0, e = t;
  for (; e; )
    n += e & 1, e >>>= 1;
  return n * 2;
}
function Dt(t, n, e) {
  if (n === 0) return null;
  const o = t.position, i = {};
  n & 1 && (i.xPlacement = t.int16()), n & 2 && (i.yPlacement = t.int16()), n & 4 && (i.xAdvance = t.int16()), n & 8 && (i.yAdvance = t.int16());
  const s = n & 16 ? t.uint16() : 0, r = n & 32 ? t.uint16() : 0, a = n & 64 ? t.uint16() : 0, c = n & 128 ? t.uint16() : 0, f = t.position, u = (l, g) => {
    const p = e + l, h = o + l;
    try {
      return Vt(t, p);
    } catch (d) {
      if (h !== p)
        try {
          return Vt(t, h);
        } catch {
        }
      const x = d instanceof Error ? d.message : String(d);
      throw new Error(
        `${x}; ValueRecord context: valueFormat=${n}, subtableOffset=${e}, valueRecordStart=${o}, offsets={xPla:${s},yPla:${r},xAdv:${a},yAdv:${c}}, field=${g}`
      );
    }
  };
  return s && (i.xPlaDevice = u(s, "xPlaDevice"), t.seek(f)), r && (i.yPlaDevice = u(r, "yPlaDevice"), t.seek(f)), a && (i.xAdvDevice = u(a, "xAdvDevice"), t.seek(f)), c && (i.yAdvDevice = u(c, "yAdvDevice"), t.seek(f)), i;
}
function Ft(t, n) {
  if (n === 0) return null;
  t.seek(n);
  const e = t.uint16(), o = t.int16(), i = t.int16(), s = { format: e, xCoordinate: o, yCoordinate: i };
  if (e === 2)
    s.anchorPoint = t.uint16();
  else if (e === 3) {
    const r = t.uint16(), a = t.uint16();
    r && (s.xDevice = Vt(t, n + r)), a && (s.yDevice = Vt(t, n + a));
  }
  return s;
}
function fo(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++) {
    const s = t.uint16(), r = t.uint16();
    o.push({ markClass: s, anchorOffset: r });
  }
  return o.map((i) => ({
    markClass: i.markClass,
    markAnchor: Ft(t, n + i.anchorOffset)
  }));
}
function wu(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = n.uint16(), r = n.uint16();
  let a = 0;
  o >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: o,
    scriptList: as(n, i),
    featureList: fs(n, s),
    lookupList: gs(n, r, Os, 9)
  };
  return a !== 0 && (c.featureVariations = vs(
    n,
    a
  )), c;
}
function Os(t, n, e) {
  switch (e) {
    case 1:
      return _u(t, n);
    case 2:
      return Su(t, n);
    case 3:
      return vu(t, n);
    case 4:
      return Au(t, n);
    case 5:
      return bu(t, n);
    case 6:
      return ku(t, n);
    case 7:
      return ds(t, n);
    case 8:
      return xs(t, n);
    case 9:
      return Cu(t, n);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function _u(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), i = t.uint16(), s = Dt(t, i, n), r = L(t, n + o);
    return { format: e, coverage: r, valueFormat: i, valueRecord: s };
  }
  if (e === 2) {
    const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = [];
    for (let c = 0; c < s; c++)
      r.push(Dt(t, i, n));
    const a = L(t, n + o);
    return { format: e, coverage: a, valueFormat: i, valueCount: s, valueRecords: r };
  }
  throw new Error(`Unknown SinglePos format: ${e}`);
}
function Su(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = t.uint16(), c = t.array("uint16", r).map((u) => {
      const l = n + u;
      t.seek(l);
      const g = t.uint16(), p = [];
      for (let h = 0; h < g; h++) {
        const d = t.uint16(), x = Dt(t, i, l), m = Dt(t, s, l);
        p.push({ secondGlyph: d, value1: x, value2: m });
      }
      return p;
    }), f = L(t, n + o);
    return {
      format: e,
      coverage: f,
      valueFormat1: i,
      valueFormat2: s,
      pairSets: c
    };
  }
  if (e === 2) {
    const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = t.uint16(), a = t.uint16(), c = t.uint16(), f = t.uint16(), u = [];
    for (let h = 0; h < c; h++) {
      const d = [];
      for (let x = 0; x < f; x++) {
        const m = Dt(t, i, n), y = Dt(t, s, n);
        d.push({ value1: m, value2: y });
      }
      u.push(d);
    }
    const l = L(t, n + o), g = ct(t, n + r), p = ct(t, n + a);
    return {
      format: e,
      coverage: l,
      valueFormat1: i,
      valueFormat2: s,
      classDef1: g,
      classDef2: p,
      class1Count: c,
      class2Count: f,
      class1Records: u
    };
  }
  throw new Error(`Unknown PairPos format: ${e}`);
}
function vu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown CursivePos format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = [];
  for (let c = 0; c < i; c++) {
    const f = t.uint16(), u = t.uint16();
    s.push({ entryAnchorOff: f, exitAnchorOff: u });
  }
  const r = L(t, n + o), a = s.map((c) => ({
    entryAnchor: c.entryAnchorOff ? Ft(t, n + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? Ft(t, n + c.exitAnchorOff) : null
  }));
  return { format: e, coverage: r, entryExitRecords: a };
}
function Au(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkBasePos format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = t.uint16(), a = t.uint16(), c = L(t, n + o), f = L(t, n + i), u = fo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), g = [];
  for (let h = 0; h < l; h++) {
    const d = t.array("uint16", s);
    g.push(d);
  }
  const p = g.map(
    (h) => h.map(
      (d) => d ? Ft(t, n + a + d) : null
    )
  );
  return {
    format: e,
    markCoverage: c,
    baseCoverage: f,
    markClassCount: s,
    markArray: u,
    baseArray: p
  };
}
function bu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkLigPos format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = t.uint16(), a = t.uint16(), c = L(t, n + o), f = L(t, n + i), u = fo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), p = t.array("uint16", l).map((h) => {
    const d = n + a + h;
    t.seek(d);
    const x = t.uint16(), m = [];
    for (let y = 0; y < x; y++) {
      const _ = t.array("uint16", s);
      m.push(_);
    }
    return m.map(
      (y) => y.map((_) => _ ? Ft(t, d + _) : null)
    );
  });
  return {
    format: e,
    markCoverage: c,
    ligatureCoverage: f,
    markClassCount: s,
    markArray: u,
    ligatureArray: p
  };
}
function ku(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkMarkPos format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = t.uint16(), r = t.uint16(), a = t.uint16(), c = L(t, n + o), f = L(t, n + i), u = fo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), g = [];
  for (let h = 0; h < l; h++) {
    const d = t.array("uint16", s);
    g.push(d);
  }
  const p = g.map(
    (h) => h.map(
      (d) => d ? Ft(t, n + a + d) : null
    )
  );
  return {
    format: e,
    mark1Coverage: c,
    mark2Coverage: f,
    markClassCount: s,
    mark1Array: u,
    mark2Array: p
  };
}
function Cu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionPos format: ${e}`);
  const o = t.uint16(), i = t.uint32(), s = Os(
    t,
    n + i,
    o
  );
  return { format: e, extensionLookupType: o, extensionOffset: i, subtable: s };
}
function Et(t, n, e) {
  if (!n) return [];
  const o = new S(rt(n));
  return n & 1 && o.int16(t ? t.xPlacement ?? 0 : 0), n & 2 && o.int16(t ? t.yPlacement ?? 0 : 0), n & 4 && o.int16(t ? t.xAdvance ?? 0 : 0), n & 8 && o.int16(t ? t.yAdvance ?? 0 : 0), n & 16 && (t?.xPlaDevice && e.push({ field: o.position, device: t.xPlaDevice }), o.uint16(0)), n & 32 && (t?.yPlaDevice && e.push({ field: o.position, device: t.yPlaDevice }), o.uint16(0)), n & 64 && (t?.xAdvDevice && e.push({ field: o.position, device: t.xAdvDevice }), o.uint16(0)), n & 128 && (t?.yAdvDevice && e.push({ field: o.position, device: t.yAdvDevice }), o.uint16(0)), o.toArray();
}
function en(t) {
  if (!t) return [];
  const { format: n, xCoordinate: e, yCoordinate: o } = t;
  if (n === 1) {
    const i = new S(6);
    return i.uint16(1), i.int16(e), i.int16(o), i.toArray();
  }
  if (n === 2) {
    const i = new S(8);
    return i.uint16(2), i.int16(e), i.int16(o), i.uint16(t.anchorPoint), i.toArray();
  }
  if (n === 3) {
    const i = t.xDevice ? zn(t.xDevice) : null, s = t.yDevice ? zn(t.yDevice) : null;
    let a = 10;
    const c = i ? a : 0;
    i && (a += i.length);
    const f = s ? a : 0;
    s && (a += s.length);
    const u = new S(a);
    return u.uint16(3), u.int16(e), u.int16(o), u.uint16(c), u.uint16(f), i && (u.seek(c), u.rawBytes(i)), s && (u.seek(f), u.rawBytes(s)), u.toArray();
  }
  throw new Error(`Unknown Anchor format: ${n}`);
}
function uo(t) {
  const n = t.map((r) => en(r.markAnchor));
  let o = 2 + t.length * 4;
  const i = n.map((r) => {
    if (!r.length) return 0;
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    s.uint16(t[r].markClass), s.uint16(i[r]);
  for (let r = 0; r < n.length; r++)
    n[r].length && (s.seek(i[r]), s.rawBytes(n[r]));
  return s.toArray();
}
function Ou(t) {
  const { majorVersion: n, minorVersion: e } = t, o = Iu(t), i = cs(o.scriptList), s = ls(o.featureList), r = ps(
    o.lookupList,
    Is,
    9
  ), a = o.featureVariations ? As(o.featureVariations) : null;
  let c = 10;
  e >= 1 && (c += 4);
  let f = c;
  const u = f;
  f += i.length;
  const l = f;
  f += s.length;
  const g = f;
  f += r.length;
  const p = a ? f : 0;
  a && (f += a.length);
  const h = new S(f);
  return h.uint16(n), h.uint16(e), h.uint16(u), h.uint16(l), h.uint16(g), e >= 1 && h.uint32(p), h.seek(u), h.rawBytes(i), h.seek(l), h.rawBytes(s), h.seek(g), h.rawBytes(r), a && (h.seek(p), h.rawBytes(a)), h.toArray();
}
function Iu(t) {
  const n = t.lookupList.lookups.map((e) => {
    if (e.lookupType !== 2 || !Array.isArray(e.subtables))
      return e;
    const o = e.subtables.flatMap((i) => i?.format !== 1 || !Array.isArray(i.pairSets) ? [i] : Du(i));
    return {
      ...e,
      subtables: o
    };
  });
  return {
    ...t,
    lookupList: {
      ...t.lookupList,
      lookups: n
    }
  };
}
function Du(t) {
  const n = Eu(t.coverage);
  if (n.length !== t.pairSets.length)
    return [t];
  const e = rt(t.valueFormat1) + rt(t.valueFormat2), o = t.pairSets.map(
    (c) => 2 + c.length * (2 + e)
  ), i = o.reduce((c, f) => c + f, 0);
  if (ii(
    t.pairSets.length,
    i
  ) <= 65535)
    return [t];
  const r = [];
  let a = 0;
  for (; a < t.pairSets.length; ) {
    let c = a, f = 0, u = !1;
    for (; c < t.pairSets.length; ) {
      const l = f + o[c], g = c - a + 1;
      if (ii(
        g,
        l
      ) > 65535)
        break;
      f = l, c += 1, u = !0;
    }
    if (!u)
      throw new Error(
        "Cannot encode PairPos format 1: single PairSet exceeds 16-bit offset range"
      );
    r.push({
      ...t,
      coverage: {
        format: 1,
        glyphs: n.slice(a, c)
      },
      pairSets: t.pairSets.slice(a, c)
    }), a = c;
  }
  return r;
}
function ii(t, n) {
  const e = 10 + t * 2, o = 4 + t * 2;
  return e + o + n;
}
function Eu(t) {
  if (!t)
    return [];
  if (t.format === 1)
    return t.glyphs;
  if (t.format === 2) {
    const n = [];
    for (const e of t.ranges)
      for (let o = e.startGlyphID; o <= e.endGlyphID; o++)
        n.push(o);
    return n;
  }
  return [];
}
function Is(t, n) {
  switch (n) {
    case 1:
      return Bu(t);
    case 2:
      return Tu(t);
    case 3:
      return Ru(t);
    case 4:
      return Mu(t);
    case 5:
      return Lu(t);
    case 6:
      return Vu(t);
    case 7:
      return ms(t);
    case 8:
      return _s(t);
    case 9:
      return Fu(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function Bu(t) {
  const n = z(t.coverage), e = [];
  if (t.format === 1) {
    const o = Et(
      t.valueRecord,
      t.valueFormat,
      e
    ), s = 6 + o.length, r = s + n.length, a = new S(r);
    return a.uint16(1), a.uint16(s), a.uint16(t.valueFormat), a.rawBytes(o), a.seek(s), a.rawBytes(n), a.toArray();
  }
  if (t.format === 2) {
    const o = rt(t.valueFormat), i = t.valueRecords.map(
      (f) => Et(f, t.valueFormat, e)
    ), r = 8 + i.length * o, a = r + n.length, c = new S(a);
    c.uint16(2), c.uint16(r), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of i) c.rawBytes(f);
    return c.seek(r), c.rawBytes(n), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function Tu(t) {
  const n = z(t.coverage), e = [];
  if (t.format === 1) {
    const o = t.pairSets.map((f) => {
      const u = rt(t.valueFormat1), l = rt(t.valueFormat2), g = 2 + u + l, p = new S(2 + f.length * g);
      p.uint16(f.length);
      for (const h of f)
        p.uint16(h.secondGlyph), p.rawBytes(
          Et(h.value1, t.valueFormat1, e)
        ), p.rawBytes(
          Et(h.value2, t.valueFormat2, e)
        );
      return p.toArray();
    });
    let s = 10 + t.pairSets.length * 2;
    const r = s;
    s += n.length;
    const a = o.map((f) => {
      const u = s;
      return s += f.length, u;
    }), c = new S(s);
    c.uint16(1), c.uint16(r), c.uint16(t.valueFormat1), c.uint16(t.valueFormat2), c.uint16(t.pairSets.length), c.array("uint16", a), c.seek(r), c.rawBytes(n);
    for (let f = 0; f < o.length; f++)
      c.seek(a[f]), c.rawBytes(o[f]);
    return c.toArray();
  }
  if (t.format === 2) {
    const o = ft(t.classDef1), i = ft(t.classDef2), s = rt(t.valueFormat1), r = rt(t.valueFormat2), a = s + r;
    let u = 16 + t.class1Count * t.class2Count * a;
    const l = u;
    u += n.length;
    const g = u;
    u += o.length;
    const p = u;
    u += i.length;
    const h = new S(u);
    h.uint16(2), h.uint16(l), h.uint16(t.valueFormat1), h.uint16(t.valueFormat2), h.uint16(g), h.uint16(p), h.uint16(t.class1Count), h.uint16(t.class2Count);
    for (const d of t.class1Records)
      for (const x of d)
        h.rawBytes(
          Et(x.value1, t.valueFormat1, e)
        ), h.rawBytes(
          Et(x.value2, t.valueFormat2, e)
        );
    return h.seek(l), h.rawBytes(n), h.seek(g), h.rawBytes(o), h.seek(p), h.rawBytes(i), h.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function Ru(t) {
  const n = z(t.coverage), e = t.entryExitRecords.map((c) => ({
    entry: c.entryAnchor ? en(c.entryAnchor) : null,
    exit: c.exitAnchor ? en(c.exitAnchor) : null
  }));
  let i = 6 + t.entryExitRecords.length * 4;
  const s = i;
  i += n.length;
  const r = e.map((c) => {
    const f = c.entry ? i : 0;
    c.entry && (i += c.entry.length);
    const u = c.exit ? i : 0;
    return c.exit && (i += c.exit.length), { entryOff: f, exitOff: u };
  }), a = new S(i);
  a.uint16(1), a.uint16(s), a.uint16(t.entryExitRecords.length);
  for (const c of r)
    a.uint16(c.entryOff), a.uint16(c.exitOff);
  a.seek(s), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    e[c].entry && (a.seek(r[c].entryOff), a.rawBytes(e[c].entry)), e[c].exit && (a.seek(r[c].exitOff), a.rawBytes(e[c].exit));
  return a.toArray();
}
function Mu(t) {
  const n = z(t.markCoverage), e = z(t.baseCoverage), o = uo(t.markArray), i = Ds(t.baseArray);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += o.length;
  const u = r;
  r += i.length;
  const l = new S(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(i), l.toArray();
}
function Ds(t) {
  const n = t.length > 0 ? t[0].length : 0, e = t.map((a) => a.map(en));
  let i = 2 + t.length * n * 2;
  const s = e.map(
    (a) => a.map((c) => {
      if (!c.length) return 0;
      const f = i;
      return i += c.length, f;
    })
  ), r = new S(i);
  r.uint16(t.length);
  for (let a = 0; a < t.length; a++)
    for (let c = 0; c < n; c++)
      r.uint16(s[a][c]);
  for (let a = 0; a < e.length; a++)
    for (let c = 0; c < n; c++)
      e[a][c].length && (r.seek(s[a][c]), r.rawBytes(e[a][c]));
  return r.toArray();
}
function Lu(t) {
  const n = z(t.markCoverage), e = z(t.ligatureCoverage), o = uo(t.markArray), i = zu(t.ligatureArray, t.markClassCount);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += o.length;
  const u = r;
  r += i.length;
  const l = new S(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(i), l.toArray();
}
function zu(t, n) {
  const e = t.map((a) => {
    const c = a.map((p) => p.map(en));
    let u = 2 + a.length * n * 2;
    const l = c.map(
      (p) => p.map((h) => {
        if (!h.length) return 0;
        const d = u;
        return u += h.length, d;
      })
    ), g = new S(u);
    g.uint16(a.length);
    for (let p = 0; p < a.length; p++)
      for (let h = 0; h < n; h++)
        g.uint16(l[p][h]);
    for (let p = 0; p < c.length; p++)
      for (let h = 0; h < n; h++)
        c[p][h].length && (g.seek(l[p][h]), g.rawBytes(c[p][h]));
    return g.toArray();
  });
  let i = 2 + t.length * 2;
  const s = e.map((a) => {
    const c = i;
    return i += a.length, c;
  }), r = new S(i);
  r.uint16(t.length), r.array("uint16", s);
  for (let a = 0; a < e.length; a++)
    r.seek(s[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function Vu(t) {
  const n = z(t.mark1Coverage), e = z(t.mark2Coverage), o = uo(t.mark1Array), i = Ds(t.mark2Array);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += o.length;
  const u = r;
  r += i.length;
  const l = new S(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(i), l.toArray();
}
function Fu(t) {
  const n = Is(t.subtable, t.extensionLookupType), e = 8, o = new S(e + n.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(e), o.rawBytes(n), o.toArray();
}
function Pu(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = n.uint16(), r = n.uint16();
  let a = 0;
  o >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: o,
    scriptList: as(n, i),
    featureList: fs(n, s),
    lookupList: gs(n, r, Es, 7)
  };
  return a !== 0 && (c.featureVariations = vs(
    n,
    a
  )), c;
}
function Es(t, n, e) {
  switch (e) {
    case 1:
      return Uu(t, n);
    case 2:
      return Nu(t, n);
    case 3:
      return Gu(t, n);
    case 4:
      return Hu(t, n);
    case 5:
      return ds(t, n);
    case 6:
      return xs(t, n);
    case 7:
      return $u(t, n);
    case 8:
      return Zu(t, n);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function Uu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), i = t.int16(), s = L(t, n + o);
    return { format: e, coverage: s, deltaGlyphID: i };
  }
  if (e === 2) {
    const o = t.uint16(), i = t.uint16(), s = t.array("uint16", i), r = L(t, n + o);
    return { format: e, coverage: r, substituteGlyphIDs: s };
  }
  throw new Error(`Unknown SingleSubst format: ${e}`);
}
function Nu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MultipleSubst format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = t.array("uint16", i), r = L(t, n + o), a = s.map((c) => {
    t.seek(n + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: e, coverage: r, sequences: a };
}
function Gu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown AlternateSubst format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = t.array("uint16", i), r = L(t, n + o), a = s.map((c) => {
    t.seek(n + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: e, coverage: r, alternateSets: a };
}
function Hu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown LigatureSubst format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = t.array("uint16", i), r = L(t, n + o), a = s.map((c) => {
    const f = n + c;
    t.seek(f);
    const u = t.uint16();
    return t.array("uint16", u).map((g) => {
      t.seek(f + g);
      const p = t.uint16(), h = t.uint16(), d = t.array("uint16", h - 1);
      return { ligatureGlyph: p, componentCount: h, componentGlyphIDs: d };
    });
  });
  return { format: e, coverage: r, ligatureSets: a };
}
function $u(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionSubst format: ${e}`);
  const o = t.uint16(), i = t.uint32(), s = Es(
    t,
    n + i,
    o
  );
  return { format: e, extensionLookupType: o, extensionOffset: i, subtable: s };
}
function Zu(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1)
    throw new Error(`Unknown ReverseChainSingleSubst format: ${e}`);
  const o = t.uint16(), i = t.uint16(), s = t.array("uint16", i), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = t.array("uint16", c), u = L(t, n + o), l = s.map(
    (p) => L(t, n + p)
  ), g = a.map(
    (p) => L(t, n + p)
  );
  return {
    format: e,
    coverage: u,
    backtrackCoverages: l,
    lookaheadCoverages: g,
    substituteGlyphIDs: f
  };
}
function ju(t) {
  const { majorVersion: n, minorVersion: e } = t, o = cs(t.scriptList), i = ls(t.featureList), s = ps(
    t.lookupList,
    Bs,
    7
  ), r = t.featureVariations ? As(t.featureVariations) : null;
  let a = 10;
  e >= 1 && (a += 4);
  let c = a;
  const f = c;
  c += o.length;
  const u = c;
  c += i.length;
  const l = c;
  c += s.length;
  const g = r ? c : 0;
  r && (c += r.length);
  const p = new S(c);
  return p.uint16(n), p.uint16(e), p.uint16(f), p.uint16(u), p.uint16(l), e >= 1 && p.uint32(g), p.seek(f), p.rawBytes(o), p.seek(u), p.rawBytes(i), p.seek(l), p.rawBytes(s), r && (p.seek(g), p.rawBytes(r)), p.toArray();
}
function Bs(t, n) {
  switch (n) {
    case 1:
      return Yu(t);
    case 2:
      return qu(t);
    case 3:
      return Wu(t);
    case 4:
      return Xu(t);
    case 5:
      return ms(t);
    case 6:
      return _s(t);
    case 7:
      return Ju(t);
    case 8:
      return Qu(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function Yu(t) {
  const n = z(t.coverage);
  if (t.format === 1) {
    const i = new S(6 + n.length);
    return i.uint16(1), i.uint16(6), i.int16(t.deltaGlyphID), i.seek(6), i.rawBytes(n), i.toArray();
  }
  if (t.format === 2) {
    const e = 6 + t.substituteGlyphIDs.length * 2, o = e, i = new S(e + n.length);
    return i.uint16(2), i.uint16(o), i.uint16(t.substituteGlyphIDs.length), i.array("uint16", t.substituteGlyphIDs), i.seek(o), i.rawBytes(n), i.toArray();
  }
  throw new Error(`Unknown SingleSubst format: ${t.format}`);
}
function qu(t) {
  const n = z(t.coverage), e = t.sequences.map((c) => {
    const f = new S(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let i = 6 + t.sequences.length * 2;
  const s = i;
  i += n.length;
  const r = e.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new S(i);
  a.uint16(1), a.uint16(s), a.uint16(t.sequences.length), a.array("uint16", r), a.seek(s), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Wu(t) {
  const n = z(t.coverage), e = t.alternateSets.map((c) => {
    const f = new S(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let i = 6 + t.alternateSets.length * 2;
  const s = i;
  i += n.length;
  const r = e.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new S(i);
  a.uint16(1), a.uint16(s), a.uint16(t.alternateSets.length), a.array("uint16", r), a.seek(s), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Xu(t) {
  const n = z(t.coverage), e = t.ligatureSets.map(Ku);
  let i = 6 + t.ligatureSets.length * 2;
  const s = i;
  i += n.length;
  const r = e.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new S(i);
  a.uint16(1), a.uint16(s), a.uint16(t.ligatureSets.length), a.array("uint16", r), a.seek(s), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Ku(t) {
  const n = t.map((r) => {
    const a = 4 + (r.componentCount - 1) * 2, c = new S(a);
    return c.uint16(r.ligatureGlyph), c.uint16(r.componentCount), c.array("uint16", r.componentGlyphIDs), c.toArray();
  });
  let o = 2 + t.length * 2;
  const i = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), s = new S(o);
  s.uint16(t.length), s.array("uint16", i);
  for (let r = 0; r < n.length; r++)
    s.seek(i[r]), s.rawBytes(n[r]);
  return s.toArray();
}
function Ju(t) {
  const n = Bs(t.subtable, t.extensionLookupType), e = 8, o = new S(e + n.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(e), o.rawBytes(n), o.toArray();
}
function Qu(t) {
  const n = z(t.coverage), e = t.backtrackCoverages.map(z), o = t.lookaheadCoverages.map(z);
  let s = 6 + t.backtrackCoverages.length * 2 + 2 + t.lookaheadCoverages.length * 2 + 2 + t.substituteGlyphIDs.length * 2;
  const r = s;
  s += n.length;
  const a = e.map((u) => {
    const l = s;
    return s += u.length, l;
  }), c = o.map((u) => {
    const l = s;
    return s += u.length, l;
  }), f = new S(s);
  f.uint16(1), f.uint16(r), f.uint16(t.backtrackCoverages.length), f.array("uint16", a), f.uint16(t.lookaheadCoverages.length), f.array("uint16", c), f.uint16(t.substituteGlyphIDs.length), f.array("uint16", t.substituteGlyphIDs), f.seek(r), f.rawBytes(n);
  for (let u = 0; u < e.length; u++)
    f.seek(a[u]), f.rawBytes(e[u]);
  for (let u = 0; u < o.length; u++)
    f.seek(c[u]), f.rawBytes(o[u]);
  return f.toArray();
}
const tl = 8;
function nl(t, n) {
  const e = new E(t), o = e.uint16(), i = e.uint16(), s = e.uint32(), r = n?.maxp?.numGlyphs, a = [];
  for (let c = 0; c < i && !(e.position + s > t.length || s < 2); c++) {
    const u = e.uint8(), l = e.uint8(), g = s - 2, p = typeof r == "number" ? Math.min(r, g) : g, h = e.bytes(p), d = g - p, x = d > 0 ? e.bytes(d) : [];
    a.push({
      pixelSize: u,
      maxWidth: l,
      widths: h,
      padding: x
    });
  }
  return {
    version: o,
    numRecords: i,
    sizeDeviceRecord: s,
    records: a
  };
}
function el(t) {
  const n = t.version ?? 0, e = t.records ?? [], o = Math.max(
    0,
    ...e.map((f) => (f.widths ?? []).length)
  ), i = ol(2 + o), s = t.sizeDeviceRecord ?? i, r = Math.max(2, s), a = tl + r * e.length, c = new S(a);
  c.uint16(n), c.uint16(e.length), c.uint32(r);
  for (const f of e) {
    c.uint8(f.pixelSize ?? 0), c.uint8(f.maxWidth ?? 0);
    const u = r - 2, l = (f.widths ?? []).slice(0, u), g = f.padding ?? [], p = l.concat(g).slice(0, u);
    for (; p.length < u; )
      p.push(0);
    c.rawBytes(p);
  }
  return c.toArray();
}
function ol(t) {
  return t + (4 - t % 4) % 4;
}
const il = 54;
function Fe(t) {
  const n = new E(t);
  return {
    majorVersion: n.uint16(),
    minorVersion: n.uint16(),
    fontRevision: n.fixed(),
    checksumAdjustment: n.uint32(),
    magicNumber: n.uint32(),
    flags: n.uint16(),
    unitsPerEm: n.uint16(),
    created: n.longDateTime(),
    modified: n.longDateTime(),
    xMin: n.int16(),
    yMin: n.int16(),
    xMax: n.int16(),
    yMax: n.int16(),
    macStyle: n.uint16(),
    lowestRecPPEM: n.uint16(),
    fontDirectionHint: n.int16(),
    indexToLocFormat: n.int16(),
    glyphDataFormat: n.int16()
  };
}
function Ts(t) {
  const n = new S(il);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fixed(t.fontRevision), n.uint32(t.checksumAdjustment), n.uint32(t.magicNumber), n.uint16(t.flags), n.uint16(t.unitsPerEm), n.longDateTime(t.created), n.longDateTime(t.modified), n.int16(t.xMin), n.int16(t.yMin), n.int16(t.xMax), n.int16(t.yMax), n.uint16(t.macStyle), n.uint16(t.lowestRecPPEM), n.int16(t.fontDirectionHint), n.int16(t.indexToLocFormat), n.int16(t.glyphDataFormat), n.toArray();
}
const sl = 36;
function rl(t) {
  const n = new E(t);
  return {
    majorVersion: n.uint16(),
    minorVersion: n.uint16(),
    ascender: n.fword(),
    descender: n.fword(),
    lineGap: n.fword(),
    advanceWidthMax: n.ufword(),
    minLeftSideBearing: n.fword(),
    minRightSideBearing: n.fword(),
    xMaxExtent: n.fword(),
    caretSlopeRise: n.int16(),
    caretSlopeRun: n.int16(),
    caretOffset: n.int16(),
    reserved1: n.int16(),
    reserved2: n.int16(),
    reserved3: n.int16(),
    reserved4: n.int16(),
    metricDataFormat: n.int16(),
    numberOfHMetrics: n.uint16()
  };
}
function al(t) {
  const n = new S(sl);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fword(t.ascender), n.fword(t.descender), n.fword(t.lineGap), n.ufword(t.advanceWidthMax), n.fword(t.minLeftSideBearing), n.fword(t.minRightSideBearing), n.fword(t.xMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numberOfHMetrics), n.toArray();
}
function cl(t, n) {
  const e = n.hhea.numberOfHMetrics, o = n.maxp.numGlyphs, i = new E(t), s = [];
  for (let c = 0; c < e; c++)
    s.push({
      advanceWidth: i.ufword(),
      lsb: i.fword()
    });
  const r = o - e, a = i.array("fword", r);
  return { hMetrics: s, leftSideBearings: a };
}
function fl(t) {
  const { hMetrics: n, leftSideBearings: e } = t, o = n.length * 4 + e.length * 2, i = new S(o);
  for (const s of n)
    i.ufword(s.advanceWidth), i.fword(s.lsb);
  return i.array("fword", e), i.toArray();
}
const ul = 20, Rs = 15, Ms = 48;
function ll(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.offset32(), s = n.offset32(), r = n.offset32(), a = n.offset32();
  return {
    majorVersion: e,
    minorVersion: o,
    itemVariationStore: i ? zt(
      t.slice(
        i,
        Ls(t.length, i, [
          s,
          r,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: le(
      t,
      s,
      [i, r, a]
    ),
    lsbMapping: le(t, r, [
      i,
      s,
      a
    ]),
    rsbMapping: le(t, a, [
      i,
      s,
      r
    ])
  };
}
function le(t, n, e) {
  if (!n)
    return null;
  const o = Ls(t.length, n, e);
  if (o <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const i = Array.from(t.slice(n, o));
  return {
    ...hl(i),
    _raw: i
  };
}
function Ls(t, n, e) {
  return e.filter((i) => i > n).sort((i, s) => i - s)[0] ?? t;
}
function hl(t) {
  const n = new E(t), e = n.uint8(), o = n.uint8(), i = e === 1 ? n.uint32() : n.uint16(), s = (o & Rs) + 1, r = ((o & Ms) >> 4) + 1, a = [];
  for (let c = 0; c < i; c++) {
    const f = wl(n, r);
    a.push(ml(f, s));
  }
  return {
    format: e,
    entryFormat: o,
    mapCount: i,
    entries: a
  };
}
function gl(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.itemVariationStore ? pn(t.itemVariationStore) : [], i = he(
    t.advanceWidthMapping
  ), s = he(t.lsbMapping), r = he(t.rsbMapping);
  let a = ul;
  const c = o.length ? a : 0;
  a += o.length;
  const f = i.length ? a : 0;
  a += i.length;
  const u = s.length ? a : 0;
  a += s.length;
  const l = r.length ? a : 0;
  a += r.length;
  const g = new S(a);
  return g.uint16(n), g.uint16(e), g.offset32(c), g.offset32(f), g.offset32(u), g.offset32(l), g.rawBytes(o), g.rawBytes(i), g.rawBytes(s), g.rawBytes(r), g.toArray();
}
function he(t) {
  return t ? t._raw ? t._raw : pl(t) : [];
}
function pl(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = yl(n), i = t.format ?? (e > 65535 ? 1 : 0), s = t.entryFormat ?? o.entryFormat, r = (s & Rs) + 1, a = ((s & Ms) >> 4) + 1, c = i === 1 ? 6 : 4, f = new S(c + e * a);
  f.uint8(i), f.uint8(s), i === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, g = dl(l, r);
    _l(f, g, a);
  }
  return f.toArray();
}
function dl(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function ml(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function yl(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < n && o < 16; )
    o++;
  const i = e << o | n;
  let s = 1;
  for (; s < 4 && i > xl(s); )
    s++;
  return { entryFormat: s - 1 << 4 | o - 1 };
}
function xl(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function wl(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function _l(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const Sl = 6, vl = 6;
function Al(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = [];
  for (let c = 0; c < i; c++)
    s.push({
      tag: n.tag(),
      offset: n.offset16()
    });
  const r = s.map((c) => c.offset).filter((c) => c > 0), a = s.map((c) => ({
    ...c,
    table: kl(t, c.offset, r)
  }));
  return {
    majorVersion: e,
    minorVersion: o,
    scripts: a
  };
}
function bl(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.scripts ?? [], i = o.map((c) => Cl(c.table));
  let s = Sl + o.length * vl;
  const r = i.map((c) => {
    if (!c.length)
      return 0;
    const f = s;
    return s += c.length, f;
  }), a = new S(s);
  a.uint16(n), a.uint16(e), a.uint16(o.length);
  for (let c = 0; c < o.length; c++) {
    const u = (o[c].tag ?? "    ").slice(0, 4).padEnd(4, " ");
    a.tag(u), a.offset16(r[c]);
  }
  for (const c of i)
    a.rawBytes(c);
  return a.toArray();
}
function kl(t, n, e) {
  if (!n)
    return null;
  const i = e.filter((s) => s > n).sort((s, r) => s - r)[0] ?? t.length;
  return i <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, i)) };
}
function Cl(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const zs = 4, Tn = 6, Vs = 8, Rn = 8;
function Ol(t) {
  const n = new E(t);
  return (t.length >= 4 ? n.uint32() : 0) === 65536 ? El(t) : Il(t);
}
function Il(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = [];
  let s = zs;
  for (let r = 0; r < o && !(s + Tn > t.length); r++) {
    n.seek(s);
    const a = n.uint16(), c = n.uint16(), f = n.uint16(), u = f >> 8 & 255, l = Math.min(
      t.length,
      s + Math.max(c, Tn)
    ), g = s + Tn, p = Array.from(t.slice(g, l)), h = {
      version: a,
      coverage: f,
      format: u
    };
    u === 0 ? Object.assign(h, Dl(p)) : h._raw = p, i.push(h), s = l;
  }
  return {
    formatVariant: "opentype",
    version: e,
    nTables: o,
    subtables: i
  };
}
function Dl(t) {
  const n = new E(t);
  if (t.length < 8)
    return {
      nPairs: 0,
      searchRange: 0,
      entrySelector: 0,
      rangeShift: 0,
      pairs: []
    };
  const e = n.uint16();
  n.uint16(), n.uint16(), n.uint16();
  const o = [];
  for (let c = 0; c < e && !(n.position + 6 > t.length); c++)
    o.push({
      left: n.uint16(),
      right: n.uint16(),
      value: n.int16()
    });
  const i = o.length, s = Math.floor(
    Math.log2(Math.max(1, i))
  ), r = Math.pow(2, s) * 6, a = i * 6 - r;
  return {
    nPairs: i,
    searchRange: r,
    entrySelector: s,
    rangeShift: a,
    pairs: o
  };
}
function El(t) {
  const n = new E(t), e = n.uint32(), o = n.uint32(), i = [];
  let s = Vs;
  for (let r = 0; r < o && !(s + Rn > t.length); r++) {
    n.seek(s);
    const a = n.uint32(), c = n.uint8(), f = n.uint8(), u = n.uint16(), l = Math.min(
      t.length,
      s + Math.max(a, Rn)
    ), g = Array.from(
      t.slice(s + Rn, l)
    );
    i.push({
      coverage: c,
      format: f,
      tupleIndex: u,
      _raw: g
    }), s = l;
  }
  return {
    formatVariant: "apple",
    version: e,
    nTables: o,
    subtables: i
  };
}
function Bl(t) {
  return t.formatVariant === "apple" ? Ll(t) : Tl(t);
}
function Tl(t) {
  const n = t.version ?? 0, e = t.subtables ?? [], o = e.map(
    (a) => Rl(a)
  ), i = e.length, s = zs + o.reduce((a, c) => a + c.length, 0), r = new S(s);
  r.uint16(n), r.uint16(i);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function Rl(t) {
  const n = t._raw ? t._raw : t.format === 0 ? Ml(t) : [], e = Tn + n.length, o = t.coverage ?? (t.format ?? 0) << 8, i = new S(e);
  return i.uint16(t.version ?? 0), i.uint16(e), i.uint16(o), i.rawBytes(n), i.toArray();
}
function Ml(t) {
  const n = t.pairs ?? [], e = n.length, o = Math.floor(Math.log2(Math.max(1, e))), i = Math.pow(2, o) * 6, s = e * 6 - i, r = new S(8 + e * 6);
  r.uint16(e), r.uint16(t.searchRange ?? i), r.uint16(t.entrySelector ?? o), r.uint16(t.rangeShift ?? s);
  for (const a of n)
    r.uint16(a.left), r.uint16(a.right), r.int16(a.value);
  return r.toArray();
}
function Ll(t) {
  const n = t.version ?? 65536, e = t.subtables ?? [], o = e.map((a) => {
    const c = a._raw ?? [], f = Rn + c.length, u = new S(f);
    return u.uint32(f), u.uint8(a.coverage ?? 0), u.uint8(a.format ?? 0), u.uint16(a.tupleIndex ?? 0), u.rawBytes(c), u.toArray();
  }), i = e.length, s = Vs + o.reduce((a, c) => a + c.length, 0), r = new S(s);
  r.uint32(n), r.uint32(i);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function zl(t) {
  const n = new E(t), e = n.uint32(), o = n.uint32(), i = n.uint32(), s = [], r = [];
  for (let a = 0; a < i; a++)
    r.push({ offset: n.uint16(), length: n.uint16() });
  for (const a of r) {
    const c = t.slice(a.offset, a.offset + a.length);
    s.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: e, flags: o, tags: s };
}
function Vl(t) {
  const { version: n, flags: e, tags: o } = t, i = new TextEncoder(), s = o.map((u) => i.encode(u)), r = 12 + o.length * 4, a = r + s.reduce((u, l) => u + l.length, 0), c = new S(a);
  c.uint32(n), c.uint32(e), c.uint32(o.length);
  let f = r;
  for (const u of s)
    c.uint16(f), c.uint16(u.length), f += u.length;
  for (const u of s)
    c.rawBytes(u);
  return c.toArray();
}
function Fl(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.bytes(o);
  return {
    version: e,
    numGlyphs: o,
    yPels: i
  };
}
function Pl(t) {
  const n = t.version ?? 0, e = t.yPels ?? [], o = t.numGlyphs ?? e.length, i = e.slice(0, o);
  for (; i.length < o; )
    i.push(0);
  const s = new S(4 + o);
  return s.uint16(n), s.uint16(o), s.rawBytes(i), s.toArray();
}
const Ul = 10;
function Nl(t) {
  const n = new E(t), e = n.uint32(), o = n.offset16(), i = n.offset16(), s = n.offset16(), r = [
    o,
    i,
    s
  ].filter((a) => a > 0);
  return {
    version: e,
    mathConstants: ge(t, o, r),
    mathGlyphInfo: ge(t, i, r),
    mathVariants: ge(t, s, r)
  };
}
function Gl(t) {
  const n = t.version ?? 65536, e = pe(t.mathConstants), o = pe(t.mathGlyphInfo), i = pe(t.mathVariants);
  let s = Ul;
  const r = e.length ? s : 0;
  s += e.length;
  const a = o.length ? s : 0;
  s += o.length;
  const c = i.length ? s : 0;
  s += i.length;
  const f = new S(s);
  return f.uint32(n), f.offset16(r), f.offset16(a), f.offset16(c), f.rawBytes(e), f.rawBytes(o), f.rawBytes(i), f.toArray();
}
function ge(t, n, e) {
  if (!n)
    return null;
  const i = e.filter((s) => s > n).sort((s, r) => s - r)[0] ?? t.length;
  return i <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, i)) };
}
function pe(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Hl = 6, $l = 32;
function Zl(t) {
  const n = new E(t), e = n.uint32(), o = n.uint16(), i = { version: e, numGlyphs: o };
  return e === 65536 && (i.maxPoints = n.uint16(), i.maxContours = n.uint16(), i.maxCompositePoints = n.uint16(), i.maxCompositeContours = n.uint16(), i.maxZones = n.uint16(), i.maxTwilightPoints = n.uint16(), i.maxStorage = n.uint16(), i.maxFunctionDefs = n.uint16(), i.maxInstructionDefs = n.uint16(), i.maxStackElements = n.uint16(), i.maxSizeOfInstructions = n.uint16(), i.maxComponentElements = n.uint16(), i.maxComponentDepth = n.uint16()), i;
}
function jl(t) {
  const n = t.version === 65536, e = n ? $l : Hl, o = new S(e);
  return o.uint32(t.version), o.uint16(t.numGlyphs), n && (o.uint16(t.maxPoints), o.uint16(t.maxContours), o.uint16(t.maxCompositePoints), o.uint16(t.maxCompositeContours), o.uint16(t.maxZones), o.uint16(t.maxTwilightPoints), o.uint16(t.maxStorage), o.uint16(t.maxFunctionDefs), o.uint16(t.maxInstructionDefs), o.uint16(t.maxStackElements), o.uint16(t.maxSizeOfInstructions), o.uint16(t.maxComponentElements), o.uint16(t.maxComponentDepth)), o.toArray();
}
function Yl(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const n = new E(t), e = t.length >= 2 ? n.uint16() : 0, o = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: e,
    data: o
  };
}
function ql(t) {
  const n = t.version ?? 0, e = t.data ?? [], o = new S(2 + e.length);
  return o.uint16(n), o.rawBytes(e), o.toArray();
}
const Fs = 16, Wl = 12;
function Xl(t) {
  const n = new E(t), e = n.uint32(), o = n.uint32(), i = n.uint32(), s = n.uint32(), r = [];
  for (let a = 0; a < s; a++) {
    const c = n.tag(), f = n.uint32(), u = n.uint32(), l = f, g = Math.min(t.length, l + u), p = l < Fs || l >= t.length || g < l ? [] : Array.from(t.slice(l, g));
    r.push({ tag: c, dataOffset: f, dataLength: u, data: p });
  }
  return {
    version: e,
    flags: o,
    reserved: i,
    dataMaps: r
  };
}
function Kl(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, o = t.reserved ?? 0, s = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let r = Fs + s.length * Wl;
  const a = s.map((f) => {
    const u = r, l = f.data.length;
    return r += l, {
      tag: f.tag,
      dataOffset: u,
      dataLength: l,
      data: f.data
    };
  }), c = new S(r);
  c.uint32(n), c.uint32(e), c.uint32(o), c.uint32(a.length);
  for (const f of a)
    c.tag(f.tag), c.uint32(f.dataOffset), c.uint32(f.dataLength);
  for (const f of a)
    c.rawBytes(f.data);
  return c.toArray();
}
const Pe = 12, Bt = 8;
function Jl(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = n.uint16(), r = n.uint16(), a = n.offset16(), c = [];
  for (let u = 0; u < r; u++) {
    const l = Pe + u * s;
    if (l >= t.length) {
      c.push({
        valueTag: "    ",
        deltaSetOuterIndex: 0,
        deltaSetInnerIndex: 0,
        _extra: []
      });
      continue;
    }
    n.seek(l);
    const g = {
      valueTag: n.tag(),
      deltaSetOuterIndex: n.uint16(),
      deltaSetInnerIndex: n.uint16()
    };
    s > Bt && (g._extra = n.bytes(s - Bt)), c.push(g);
  }
  const f = a > 0 && a < t.length ? zt(t.slice(a)) : null;
  return {
    majorVersion: e,
    minorVersion: o,
    reserved: i,
    valueRecordSize: s,
    valueRecords: c,
    itemVariationStore: f
  };
}
function Ql(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 0, i = [...t.valueRecords ?? []].sort(
    (p, h) => th(p.valueTag, h.valueTag)
  ), s = t.valueRecordSize ?? Bt, r = i.reduce((p, h) => {
    const d = h._extra?.length ?? 0;
    return Math.max(p, Bt + d);
  }, Bt), a = Math.max(
    s,
    r
  ), c = i.length, f = t.itemVariationStore ? pn(t.itemVariationStore) : [], u = f.length > 0 || c > 0 ? Pe + c * a : 0, l = u > 0 ? u + f.length : Pe, g = new S(l);
  g.uint16(n), g.uint16(e), g.uint16(o), g.uint16(a), g.uint16(c), g.offset16(u);
  for (const p of i) {
    g.tag(p.valueTag ?? "    "), g.uint16(p.deltaSetOuterIndex ?? 0), g.uint16(p.deltaSetInnerIndex ?? 0);
    const h = p._extra ?? [];
    g.rawBytes(h);
    const d = a - Bt - h.length;
    d > 0 && g.rawBytes(new Array(d).fill(0));
  }
  return g.rawBytes(f), g.toArray();
}
function th(t, n) {
  const e = t ?? "    ", o = n ?? "    ";
  for (let i = 0; i < 4; i++) {
    const s = e.charCodeAt(i) - o.charCodeAt(i);
    if (s !== 0)
      return s;
  }
  return 0;
}
const Ue = [
  196,
  197,
  199,
  201,
  209,
  214,
  220,
  225,
  224,
  226,
  228,
  227,
  229,
  231,
  233,
  232,
  234,
  235,
  237,
  236,
  238,
  239,
  241,
  243,
  242,
  244,
  246,
  245,
  250,
  249,
  251,
  252,
  8224,
  176,
  162,
  163,
  167,
  8226,
  182,
  223,
  174,
  169,
  8482,
  180,
  168,
  8800,
  198,
  216,
  8734,
  177,
  8804,
  8805,
  165,
  181,
  8706,
  8721,
  8719,
  960,
  8747,
  170,
  186,
  937,
  230,
  248,
  191,
  161,
  172,
  8730,
  402,
  8776,
  8710,
  171,
  187,
  8230,
  160,
  192,
  195,
  213,
  338,
  339,
  8211,
  8212,
  8220,
  8221,
  8216,
  8217,
  247,
  9674,
  255,
  376,
  8260,
  8364,
  8249,
  8250,
  64257,
  64258,
  8225,
  183,
  8218,
  8222,
  8240,
  194,
  202,
  193,
  203,
  200,
  205,
  206,
  207,
  204,
  211,
  212,
  63743,
  210,
  218,
  219,
  217,
  305,
  710,
  732,
  175,
  728,
  729,
  730,
  184,
  733,
  731,
  711
], lo = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  lo.set(t, t);
for (let t = 0; t < Ue.length; t++)
  lo.set(Ue[t], 128 + t);
function nh(t, n, e) {
  return n === 0 || n === 3 ? Ne(t) : n === 1 && e === 0 ? oh(t) : t.length % 2 === 0 ? Ne(t) : "0x:" + t.map((o) => o.toString(16).padStart(2, "0")).join("");
}
function eh(t, n, e) {
  if (t.startsWith("0x:")) {
    const o = t.slice(3), i = [];
    for (let s = 0; s < o.length; s += 2)
      i.push(parseInt(o.slice(s, s + 2), 16));
    return i;
  }
  return n === 0 || n === 3 ? Ge(t) : n === 1 && e === 0 ? ih(t) : Ge(t);
}
function Ne(t) {
  const n = [];
  for (let e = 0; e + 1 < t.length; e += 2) {
    const o = t[e] << 8 | t[e + 1];
    n.push(o);
  }
  return String.fromCharCode(...n);
}
function Ge(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const o = t.charCodeAt(e);
    n.push(o >> 8 & 255, o & 255);
  }
  return n;
}
function oh(t) {
  return t.map((n) => n < 128 ? String.fromCharCode(n) : String.fromCharCode(Ue[n - 128])).join("");
}
function ih(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const o = t.charCodeAt(e), i = lo.get(o);
    n.push(i !== void 0 ? i : 63);
  }
  return n;
}
function sh(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = [];
  for (let f = 0; f < o; f++)
    s.push({
      platformID: n.uint16(),
      encodingID: n.uint16(),
      languageID: n.uint16(),
      nameID: n.uint16(),
      length: n.uint16(),
      stringOffset: n.uint16()
    });
  let r = [];
  if (e === 1) {
    const f = n.uint16();
    for (let u = 0; u < f; u++) {
      const l = n.uint16(), g = n.uint16(), p = t.slice(
        i + g,
        i + g + l
      );
      r.push({
        tag: Ne(p)
      });
    }
  }
  const a = s.map((f) => {
    const u = t.slice(
      i + f.stringOffset,
      i + f.stringOffset + f.length
    );
    return {
      platformID: f.platformID,
      encodingID: f.encodingID,
      languageID: f.languageID,
      nameID: f.nameID,
      value: nh(u, f.platformID, f.encodingID)
    };
  }), c = { version: e, names: a };
  return e === 1 && r.length > 0 && (c.langTagRecords = r), c;
}
function rh(t) {
  const { version: n, names: e, langTagRecords: o = [] } = t, i = e.map((w) => ({
    platformID: w.platformID,
    encodingID: w.encodingID,
    languageID: w.languageID,
    nameID: w.nameID,
    bytes: eh(w.value, w.platformID, w.encodingID)
  })), s = o.map((w) => Ge(w.tag)), r = 6, a = 12, u = n === 1 ? (n === 1 ? 2 : 0) + o.length * 4 : 0, l = r + i.length * a + u, g = [];
  let p = 0;
  const h = /* @__PURE__ */ new Map();
  function d(w) {
    const v = w.join(",");
    if (h.has(v))
      return h.get(v);
    const b = p;
    return h.set(v, b), g.push(w), p += w.length, b;
  }
  const x = i.map((w) => ({
    ...w,
    stringOffset: d(w.bytes),
    stringLength: w.bytes.length
  })), m = s.map((w) => ({
    stringOffset: d(w),
    stringLength: w.length
  })), y = l + p, _ = new S(y);
  _.uint16(n), _.uint16(i.length), _.uint16(l);
  for (const w of x)
    _.uint16(w.platformID).uint16(w.encodingID).uint16(w.languageID).uint16(w.nameID).uint16(w.stringLength).uint16(w.stringOffset);
  if (n === 1) {
    _.uint16(m.length);
    for (const w of m)
      _.uint16(w.stringLength).uint16(w.stringOffset);
  }
  for (const w of g)
    _.rawBytes(w);
  return _.toArray();
}
const Ps = 78, Us = 86, Ns = 96, Gs = 100;
function ah(t) {
  const n = new E(t), e = t.length, o = {};
  return o.version = n.uint16(), o.xAvgCharWidth = n.fword(), o.usWeightClass = n.uint16(), o.usWidthClass = n.uint16(), o.fsType = n.uint16(), o.ySubscriptXSize = n.fword(), o.ySubscriptYSize = n.fword(), o.ySubscriptXOffset = n.fword(), o.ySubscriptYOffset = n.fword(), o.ySuperscriptXSize = n.fword(), o.ySuperscriptYSize = n.fword(), o.ySuperscriptXOffset = n.fword(), o.ySuperscriptYOffset = n.fword(), o.yStrikeoutSize = n.fword(), o.yStrikeoutPosition = n.fword(), o.sFamilyClass = n.int16(), o.panose = n.bytes(10), o.ulUnicodeRange1 = n.uint32(), o.ulUnicodeRange2 = n.uint32(), o.ulUnicodeRange3 = n.uint32(), o.ulUnicodeRange4 = n.uint32(), o.achVendID = n.tag(), o.fsSelection = n.uint16(), o.usFirstCharIndex = n.uint16(), o.usLastCharIndex = n.uint16(), e < Ps || (o.sTypoAscender = n.fword(), o.sTypoDescender = n.fword(), o.sTypoLineGap = n.fword(), o.usWinAscent = n.ufword(), o.usWinDescent = n.ufword(), o.version < 1 || e < Us) || (o.ulCodePageRange1 = n.uint32(), o.ulCodePageRange2 = n.uint32(), o.version < 2 || e < Ns) || (o.sxHeight = n.fword(), o.sCapHeight = n.fword(), o.usDefaultChar = n.uint16(), o.usBreakChar = n.uint16(), o.usMaxContext = n.uint16(), o.version < 5 || e < Gs) || (o.usLowerOpticalPointSize = n.uint16(), o.usUpperOpticalPointSize = n.uint16()), o;
}
function ch(t) {
  const n = t.version;
  let e;
  n >= 5 ? e = Gs : n >= 2 ? e = Ns : n >= 1 ? e = Us : e = t.sTypoAscender !== void 0 ? Ps : 68;
  const o = new S(e);
  return o.uint16(n).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), e <= 68 || (o.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), n < 1) || (o.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), n < 2) || (o.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), n < 5) || o.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), o.toArray();
}
const fh = 54;
function uh(t) {
  const n = new E(t);
  return {
    version: n.uint32(),
    fontNumber: n.uint32(),
    pitch: n.uint16(),
    xHeight: n.uint16(),
    style: n.uint16(),
    typeFamily: n.uint16(),
    capHeight: n.uint16(),
    symbolSet: n.uint16(),
    typeface: de(n.bytes(16)),
    characterComplement: de(n.bytes(8)),
    fileName: de(n.bytes(6)),
    strokeWeight: n.int8(),
    widthType: n.int8(),
    serifStyle: n.uint8(),
    reserved: n.uint8()
  };
}
function lh(t) {
  const n = new S(fh);
  return n.uint32(t.version ?? 65536), n.uint32(t.fontNumber ?? 0), n.uint16(t.pitch ?? 0), n.uint16(t.xHeight ?? 0), n.uint16(t.style ?? 0), n.uint16(t.typeFamily ?? 0), n.uint16(t.capHeight ?? 0), n.uint16(t.symbolSet ?? 0), n.rawBytes(me(t.typeface ?? "", 16)), n.rawBytes(me(t.characterComplement ?? "", 8)), n.rawBytes(me(t.fileName ?? "", 6)), n.int8(t.strokeWeight ?? 0), n.int8(t.widthType ?? 0), n.uint8(t.serifStyle ?? 0), n.uint8(t.reserved ?? 0), n.toArray();
}
function de(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function me(t, n) {
  const e = new Array(n).fill(0);
  for (let o = 0; o < n && o < t.length; o++) {
    const i = t.charCodeAt(o);
    e[o] = i >= 0 && i <= 127 ? i : 63;
  }
  return e;
}
const ho = 32, He = [
  ".notdef",
  ".null",
  "nonmarkingreturn",
  "space",
  "exclam",
  "quotedbl",
  "numbersign",
  "dollar",
  "percent",
  "ampersand",
  "quotesingle",
  "parenleft",
  "parenright",
  "asterisk",
  "plus",
  "comma",
  "hyphen",
  "period",
  "slash",
  "zero",
  "one",
  "two",
  "three",
  "four",
  "five",
  "six",
  "seven",
  "eight",
  "nine",
  "colon",
  "semicolon",
  "less",
  "equal",
  "greater",
  "question",
  "at",
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
  "bracketleft",
  "backslash",
  "bracketright",
  "asciicircum",
  "underscore",
  "grave",
  "a",
  "b",
  "c",
  "d",
  "e",
  "f",
  "g",
  "h",
  "i",
  "j",
  "k",
  "l",
  "m",
  "n",
  "o",
  "p",
  "q",
  "r",
  "s",
  "t",
  "u",
  "v",
  "w",
  "x",
  "y",
  "z",
  "braceleft",
  "bar",
  "braceright",
  "asciitilde",
  "Adieresis",
  "Aring",
  "Ccedilla",
  "Eacute",
  "Ntilde",
  "Odieresis",
  "Udieresis",
  "aacute",
  "agrave",
  "acircumflex",
  "adieresis",
  "atilde",
  "aring",
  "ccedilla",
  "eacute",
  "egrave",
  "ecircumflex",
  "edieresis",
  "iacute",
  "igrave",
  "icircumflex",
  "idieresis",
  "ntilde",
  "oacute",
  "ograve",
  "ocircumflex",
  "odieresis",
  "otilde",
  "uacute",
  "ugrave",
  "ucircumflex",
  "udieresis",
  "dagger",
  "degree",
  "cent",
  "sterling",
  "section",
  "bullet",
  "paragraph",
  "germandbls",
  "registered",
  "copyright",
  "trademark",
  "acute",
  "dieresis",
  "notequal",
  "AE",
  "Oslash",
  "infinity",
  "plusminus",
  "lessequal",
  "greaterequal",
  "yen",
  "mu",
  "partialdiff",
  "summation",
  "product",
  "pi",
  "integral",
  "ordfeminine",
  "ordmasculine",
  "Omega",
  "ae",
  "oslash",
  "questiondown",
  "exclamdown",
  "logicalnot",
  "radical",
  "florin",
  "approxequal",
  "Delta",
  "guillemotleft",
  "guillemotright",
  "ellipsis",
  "nonbreakingspace",
  "Agrave",
  "Atilde",
  "Otilde",
  "OE",
  "oe",
  "endash",
  "emdash",
  "quotedblleft",
  "quotedblright",
  "quoteleft",
  "quoteright",
  "divide",
  "lozenge",
  "ydieresis",
  "Ydieresis",
  "fraction",
  "currency",
  "guilsinglleft",
  "guilsinglright",
  "fi",
  "fl",
  "daggerdbl",
  "periodcentered",
  "quotesinglbase",
  "quotedblbase",
  "perthousand",
  "Acircumflex",
  "Ecircumflex",
  "Aacute",
  "Edieresis",
  "Egrave",
  "Iacute",
  "Icircumflex",
  "Idieresis",
  "Igrave",
  "Oacute",
  "Ocircumflex",
  "apple",
  "Ograve",
  "Uacute",
  "Ucircumflex",
  "Ugrave",
  "dotlessi",
  "circumflex",
  "tilde",
  "macron",
  "breve",
  "dotaccent",
  "ring",
  "cedilla",
  "hungarumlaut",
  "ogonek",
  "caron",
  "Lslash",
  "lslash",
  "Scaron",
  "scaron",
  "Zcaron",
  "zcaron",
  "brokenbar",
  "Eth",
  "eth",
  "Yacute",
  "yacute",
  "Thorn",
  "thorn",
  "minus",
  "multiply",
  "onesuperior",
  "twosuperior",
  "threesuperior",
  "onehalf",
  "onequarter",
  "threequarters",
  "franc",
  "Gbreve",
  "gbreve",
  "Idotaccent",
  "Scedilla",
  "scedilla",
  "Cacute",
  "cacute",
  "Ccaron",
  "ccaron",
  "dcroat"
], Hs = new Map(
  He.map((t, n) => [t, n])
);
function hh(t) {
  const n = new E(t), e = n.uint32(), o = n.fixed(), i = n.fword(), s = n.fword(), r = n.uint32(), a = n.uint32(), c = n.uint32(), f = n.uint32(), u = n.uint32(), l = {
    version: e,
    italicAngle: o,
    underlinePosition: i,
    underlineThickness: s,
    isFixedPitch: r,
    minMemType42: a,
    maxMemType42: c,
    minMemType1: f,
    maxMemType1: u
  };
  if (e === 65536 || e === 196608)
    return l;
  if (e === 131072) {
    const g = n.uint16(), p = n.array("uint16", g);
    let h = -1;
    for (const y of p)
      y > h && (h = y);
    const d = h >= 258 ? h - 258 + 1 : 0, x = [];
    for (let y = 0; y < d; y++) {
      const _ = n.uint8(), w = n.bytes(_);
      x.push(String.fromCharCode(...w));
    }
    const m = p.map((y) => y < 258 ? He[y] : x[y - 258]);
    return l.glyphNames = m, l;
  }
  if (e === 151552) {
    const g = n.uint16(), h = n.array("int8", g).map(
      (d, x) => He[x + d]
    );
    return l.glyphNames = h, l;
  }
  return l;
}
function gh(t) {
  const { version: n } = t;
  return n === 65536 || n === 196608 ? si(t) : n === 131072 ? ph(t) : n === 151552 ? dh(t) : si(t);
}
function si(t) {
  const n = new S(ho);
  return n.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), n.toArray();
}
function ph(t) {
  const { glyphNames: n } = t, e = n.length, o = [], i = [], s = /* @__PURE__ */ new Map();
  for (const f of n) {
    const u = Hs.get(f);
    u !== void 0 ? o.push(u) : (s.has(f) || (s.set(f, i.length), i.push(f)), o.push(258 + s.get(f)));
  }
  let r = 0;
  for (const f of i)
    r += 1 + f.length;
  const a = ho + 2 + e * 2 + r, c = new S(a);
  c.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), c.uint16(e);
  for (const f of o)
    c.uint16(f);
  for (const f of i) {
    c.uint8(f.length);
    for (let u = 0; u < f.length; u++)
      c.uint8(f.charCodeAt(u));
  }
  return c.toArray();
}
function dh(t) {
  const { glyphNames: n } = t, e = n.length, o = ho + 2 + e, i = new S(o);
  i.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), i.uint16(e);
  for (let s = 0; s < e; s++) {
    const r = n[s], c = Hs.get(r) - s;
    i.int8(c);
  }
  return i.toArray();
}
function mh(t, n) {
  const e = new E(t), o = e.uint16(), i = e.uint16(), s = e.uint32(), r = e.array("uint32", s);
  let a = n?.maxp?.numGlyphs;
  const c = [];
  for (let f = 0; f < s; f++) {
    const u = r[f], l = r[f + 1] ?? t.length;
    if (u >= t.length || l <= u) {
      c.push({ ppem: 0, ppi: 0, glyphs: [] });
      continue;
    }
    e.seek(u);
    const g = e.uint16(), p = e.uint16();
    a == null && (a = (e.uint32() - 4) / 4 - 1, e.seek(u + 4));
    const h = e.array("uint32", a + 1), d = [];
    for (let x = 0; x < a; x++) {
      const m = u + h[x], y = u + h[x + 1], _ = y - m;
      if (_ <= 0) {
        d.push(null);
        continue;
      }
      e.seek(m);
      const w = e.int16(), v = e.int16(), b = e.tag(), A = _ > 8 ? t.slice(m + 8, y) : [];
      d.push({ originOffsetX: w, originOffsetY: v, graphicType: b, imageData: A });
    }
    c.push({ ppem: g, ppi: p, glyphs: d });
  }
  return { version: o, flags: i, strikes: c };
}
function yh(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, o = t.strikes ?? [], i = o.map((f) => f._raw ? f._raw : xh(f));
  let r = 8 + o.length * 4;
  const a = [];
  for (const f of i)
    a.push(r), r += f.length;
  const c = new S(r);
  c.uint16(n), c.uint16(e), c.uint32(o.length);
  for (const f of a)
    c.uint32(f);
  for (const f of i)
    c.rawBytes(f);
  return c.toArray();
}
function xh(t) {
  const n = t.glyphs ?? [], e = n.length, o = n.map((u) => {
    if (!u) return [];
    const l = u.imageData ?? [], g = new S(8 + l.length);
    return g.int16(u.originOffsetX ?? 0), g.int16(u.originOffsetY ?? 0), g.tag(u.graphicType ?? "png "), g.rawBytes(l), g.toArray();
  });
  let r = 4 + (e + 1) * 4;
  const a = [];
  for (const u of o)
    a.push(r), r += u.length;
  a.push(r);
  const c = r, f = new S(c);
  f.uint16(t.ppem ?? 0), f.uint16(t.ppi ?? 0);
  for (const u of a)
    f.uint32(u);
  for (const u of o)
    f.rawBytes(u);
  return f.toArray();
}
const wh = 18, $s = 20, Tt = 8;
function _h(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = n.uint16(), r = n.offset32(), a = n.uint16(), c = n.offset32();
  let f;
  o >= 1 && t.length >= $s && (f = n.uint16());
  const u = [];
  if (s > 0 && r > 0)
    for (let h = 0; h < s; h++) {
      n.seek(r + h * i);
      const d = {
        axisTag: n.tag(),
        axisNameID: n.uint16(),
        axisOrdering: n.uint16()
      };
      i > Tt && (d._extra = n.bytes(i - Tt)), u.push(d);
    }
  const l = [];
  if (a > 0 && c > 0) {
    n.seek(c);
    for (let h = 0; h < a; h++)
      l.push(n.offset16());
  }
  const g = [];
  for (let h = 0; h < l.length; h++) {
    const d = l[h], x = c + d, m = h < l.length - 1 ? c + l[h + 1] : t.length;
    if (x >= t.length || m < x) {
      g.push({ format: 0, _raw: [] });
      continue;
    }
    g.push(Sh(t, x, m));
  }
  const p = {
    majorVersion: e,
    minorVersion: o,
    designAxisSize: i,
    designAxes: u,
    axisValues: g
  };
  return f !== void 0 && (p.elidedFallbackNameID = f), p;
}
function Sh(t, n, e) {
  const o = new E(t);
  o.seek(n);
  const i = o.uint16();
  switch (i) {
    case 1:
      return {
        format: i,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        value: o.fixed()
      };
    case 2:
      return {
        format: i,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        nominalValue: o.fixed(),
        rangeMinValue: o.fixed(),
        rangeMaxValue: o.fixed()
      };
    case 3:
      return {
        format: i,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        value: o.fixed(),
        linkedValue: o.fixed()
      };
    case 4: {
      const s = o.uint16(), r = o.uint16(), a = o.uint16(), c = [];
      for (let f = 0; f < s; f++)
        c.push({
          axisIndex: o.uint16(),
          value: o.fixed()
        });
      return {
        format: i,
        axisCount: s,
        flags: r,
        valueNameID: a,
        axisValues: c
      };
    }
    default:
      return {
        format: i,
        _raw: Array.from(t.slice(n, e))
      };
  }
}
function vh(t) {
  const n = t.majorVersion ?? 1;
  let e = t.minorVersion ?? 2;
  const o = t.designAxes ?? [], i = t.axisValues ?? [], s = t.designAxisSize ?? Tt, r = o.reduce((b, A) => {
    const D = A._extra?.length ?? 0;
    return Math.max(b, Tt + D);
  }, Tt), a = Math.max(
    s,
    r
  ), c = e >= 1 || t.elidedFallbackNameID !== void 0;
  c && e === 0 && (e = 1);
  const f = c ? $s : wh, u = o.length, l = i.length, g = u > 0 ? f : 0, p = u * a, h = l > 0 ? f + p : 0, d = l * 2, x = i.map(
    (b) => Ah(b)
  );
  let m = d;
  const y = x.map((b) => {
    const A = m;
    return m += b.length, A;
  }), _ = x.reduce(
    (b, A) => b + A.length,
    0
  ), w = f + p + d + _, v = new S(w);
  v.uint16(n), v.uint16(e), v.uint16(a), v.uint16(u), v.offset32(g), v.uint16(l), v.offset32(h), c && v.uint16(t.elidedFallbackNameID ?? 2);
  for (const b of o) {
    v.tag(b.axisTag), v.uint16(b.axisNameID ?? 0), v.uint16(b.axisOrdering ?? 0);
    const A = b._extra ?? [];
    v.rawBytes(A);
    const D = a - Tt - A.length;
    D > 0 && v.rawBytes(new Array(D).fill(0));
  }
  for (const b of y)
    v.offset16(b);
  for (const b of x)
    v.rawBytes(b);
  return v.toArray();
}
function Ah(t) {
  if (t._raw)
    return t._raw;
  switch (t.format) {
    case 1: {
      const n = new S(12);
      return n.uint16(1), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.value ?? 0), n.toArray();
    }
    case 2: {
      const n = new S(20);
      return n.uint16(2), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.nominalValue ?? 0), n.fixed(t.rangeMinValue ?? 0), n.fixed(t.rangeMaxValue ?? 0), n.toArray();
    }
    case 3: {
      const n = new S(16);
      return n.uint16(3), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.value ?? 0), n.fixed(t.linkedValue ?? 0), n.toArray();
    }
    case 4: {
      const n = t.axisValues ?? [], e = t.axisCount ?? n.length, o = new S(8 + e * 6);
      o.uint16(4), o.uint16(e), o.uint16(t.flags ?? 0), o.uint16(t.valueNameID ?? 0);
      for (let i = 0; i < e; i++) {
        const s = n[i] ?? { axisIndex: 0, value: 0 };
        o.uint16(s.axisIndex ?? 0), o.fixed(s.value ?? 0);
      }
      return o.toArray();
    }
    default:
      throw new Error(
        `Unsupported STAT axis value format: ${t.format}`
      );
  }
}
function bh(t) {
  const n = new E(t), e = n.uint16(), o = n.uint32();
  n.uint32(), n.seek(o);
  const i = n.uint16(), s = [];
  for (let u = 0; u < i; u++)
    s.push({
      startGlyphID: n.uint16(),
      endGlyphID: n.uint16(),
      svgDocOffset: n.uint32(),
      svgDocLength: n.uint32()
    });
  const r = new TextDecoder("utf-8"), a = /* @__PURE__ */ new Map(), c = [];
  for (const u of s) {
    const l = `${u.svgDocOffset}:${u.svgDocLength}`;
    if (!a.has(l)) {
      const g = o + u.svgDocOffset, p = t.slice(g, g + u.svgDocLength), h = p.length >= 3 && p[0] === 31 && p[1] === 139 && p[2] === 8, d = c.length;
      if (h)
        c.push({ compressed: !0, data: p });
      else {
        const x = r.decode(new Uint8Array(p));
        c.push({ compressed: !1, text: x });
      }
      a.set(l, d);
    }
  }
  const f = [];
  for (const u of s) {
    const l = `${u.svgDocOffset}:${u.svgDocLength}`;
    f.push({
      startGlyphID: u.startGlyphID,
      endGlyphID: u.endGlyphID,
      documentIndex: a.get(l)
    });
  }
  return {
    version: e,
    documents: c,
    entries: f
  };
}
function kh(t) {
  const { version: n, documents: e, entries: o } = t, i = new TextEncoder(), s = e.map((h) => h.compressed ? h.data instanceof Uint8Array ? Array.from(h.data) : h.data : Array.from(i.encode(h.text))), a = 10, c = o.length;
  let u = 2 + c * 12;
  const l = [];
  for (let h = 0; h < s.length; h++) {
    const d = s[h];
    l.push({ offset: u, length: d.length }), u += d.length;
  }
  const g = a + u, p = new S(g);
  p.uint16(n), p.uint32(a), p.uint32(0), p.uint16(c);
  for (const h of o) {
    const d = l[h.documentIndex];
    p.uint16(h.startGlyphID), p.uint16(h.endGlyphID), p.uint32(d.offset), p.uint32(d.length);
  }
  for (const h of s)
    for (const d of h)
      p.uint8(d);
  return p.toArray();
}
const Ch = 6, Oh = 4, Ih = 2, Zs = 6;
function Dh(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.uint16(), s = [];
  for (let l = 0; l < i; l++)
    s.push({
      bCharSet: n.uint8(),
      xRatio: n.uint8(),
      yStartRatio: n.uint8(),
      yEndRatio: n.uint8()
    });
  const r = [];
  for (let l = 0; l < i; l++)
    r.push(n.offset16());
  const a = [...new Set(r)].sort((l, g) => l - g), c = a.map((l) => Bh(t, l)), f = new Map(
    a.map((l, g) => [l, g])
  ), u = s.map((l, g) => ({
    ...l,
    groupIndex: f.get(r[g]) ?? 0
  }));
  return {
    version: e,
    numRecs: o,
    numRatios: i,
    ratios: u,
    groups: c
  };
}
function Eh(t) {
  const n = t.version ?? 0, e = t.ratios ?? [], o = t.groups ?? [], i = o.map((u) => Th(u)), s = t.numRecs ?? Math.max(0, ...o.map((u) => (u.entries ?? []).length)), r = e.length;
  let a = Ch + r * Oh + r * Ih;
  const c = i.map((u) => {
    const l = a;
    return a += u.length, l;
  }), f = new S(a);
  f.uint16(n), f.uint16(s), f.uint16(r);
  for (const u of e)
    f.uint8(u.bCharSet ?? 0), f.uint8(u.xRatio ?? 0), f.uint8(u.yStartRatio ?? 0), f.uint8(u.yEndRatio ?? 0);
  for (const u of e) {
    const l = u.groupIndex ?? 0, g = c[l] ?? 0;
    f.offset16(g);
  }
  for (const u of i)
    f.rawBytes(u);
  return f.toArray();
}
function Bh(t, n) {
  if (!n || n >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const e = new E(t, n), o = e.uint16(), i = e.uint8(), s = e.uint8(), r = [];
  for (let a = 0; a < o && !(e.position + Zs > t.length); a++)
    r.push({
      yPelHeight: e.uint16(),
      yMax: e.int16(),
      yMin: e.int16()
    });
  return { recs: o, startsz: i, endsz: s, entries: r };
}
function Th(t) {
  const n = t.entries ?? [], e = t.recs ?? n.length, o = n.slice(0, e);
  for (; o.length < e; )
    o.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const i = new S(4 + e * Zs);
  i.uint16(e), i.uint8(t.startsz ?? 0), i.uint8(t.endsz ?? 0);
  for (const s of o)
    i.uint16(s.yPelHeight ?? 0), i.int16(s.yMax ?? 0), i.int16(s.yMin ?? 0);
  return i.toArray();
}
const Rh = 36;
function Mh(t) {
  const n = new E(t);
  return {
    version: n.uint32(),
    vertTypoAscender: n.fword(),
    vertTypoDescender: n.fword(),
    vertTypoLineGap: n.fword(),
    advanceHeightMax: n.ufword(),
    minTopSideBearing: n.fword(),
    minBottomSideBearing: n.fword(),
    yMaxExtent: n.fword(),
    caretSlopeRise: n.int16(),
    caretSlopeRun: n.int16(),
    caretOffset: n.int16(),
    reserved1: n.int16(),
    reserved2: n.int16(),
    reserved3: n.int16(),
    reserved4: n.int16(),
    metricDataFormat: n.int16(),
    numOfLongVerMetrics: n.uint16()
  };
}
function Lh(t) {
  const n = new S(Rh);
  return n.uint32(t.version), n.fword(t.vertTypoAscender), n.fword(t.vertTypoDescender), n.fword(t.vertTypoLineGap), n.ufword(t.advanceHeightMax), n.fword(t.minTopSideBearing), n.fword(t.minBottomSideBearing), n.fword(t.yMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numOfLongVerMetrics), n.toArray();
}
function zh(t, n) {
  const e = n.vhea.numOfLongVerMetrics, o = n.maxp.numGlyphs, i = new E(t), s = [];
  for (let c = 0; c < e; c++)
    s.push({
      advanceHeight: i.ufword(),
      topSideBearing: i.fword()
    });
  const r = o - e, a = i.array("fword", r);
  return { vMetrics: s, topSideBearings: a };
}
function Vh(t) {
  const { vMetrics: n, topSideBearings: e } = t, o = n.length * 4 + e.length * 2, i = new S(o);
  for (const s of n)
    i.ufword(s.advanceHeight), i.fword(s.topSideBearing);
  return i.array("fword", e), i.toArray();
}
const Fh = 24, js = 15, Ys = 48;
function Ph(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = n.offset32(), s = n.offset32(), r = n.offset32(), a = n.offset32(), c = n.offset32(), f = [
    i,
    s,
    r,
    a,
    c
  ];
  return {
    majorVersion: e,
    minorVersion: o,
    itemVariationStore: i ? zt(
      t.slice(
        i,
        qs(
          t.length,
          i,
          f
        )
      )
    ) : null,
    advanceHeightMapping: An(
      t,
      s,
      f
    ),
    tsbMapping: An(
      t,
      r,
      f
    ),
    bsbMapping: An(
      t,
      a,
      f
    ),
    vOrgMapping: An(
      t,
      c,
      f
    )
  };
}
function An(t, n, e) {
  if (!n)
    return null;
  const o = qs(t.length, n, e);
  if (o <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const i = Array.from(t.slice(n, o));
  return {
    ...Uh(i),
    _raw: i
  };
}
function qs(t, n, e) {
  return e.filter((i) => i > n).sort((i, s) => i - s)[0] ?? t;
}
function Uh(t) {
  const n = new E(t), e = n.uint8(), o = n.uint8(), i = e === 1 ? n.uint32() : n.uint16(), s = (o & js) + 1, r = ((o & Ys) >> 4) + 1, a = [];
  for (let c = 0; c < i; c++) {
    const f = Yh(n, r);
    a.push($h(f, s));
  }
  return {
    format: e,
    entryFormat: o,
    mapCount: i,
    entries: a
  };
}
function Nh(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.itemVariationStore ? pn(t.itemVariationStore) : [], i = bn(
    t.advanceHeightMapping
  ), s = bn(t.tsbMapping), r = bn(t.bsbMapping), a = bn(t.vOrgMapping);
  let c = Fh;
  const f = o.length ? c : 0;
  c += o.length;
  const u = i.length ? c : 0;
  c += i.length;
  const l = s.length ? c : 0;
  c += s.length;
  const g = r.length ? c : 0;
  c += r.length;
  const p = a.length ? c : 0;
  c += a.length;
  const h = new S(c);
  return h.uint16(n), h.uint16(e), h.offset32(f), h.offset32(u), h.offset32(l), h.offset32(g), h.offset32(p), h.rawBytes(o), h.rawBytes(i), h.rawBytes(s), h.rawBytes(r), h.rawBytes(a), h.toArray();
}
function bn(t) {
  return t ? t._raw ? t._raw : Gh(t) : [];
}
function Gh(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = Zh(n), i = t.format ?? (e > 65535 ? 1 : 0), s = t.entryFormat ?? o.entryFormat, r = (s & js) + 1, a = ((s & Ys) >> 4) + 1, c = i === 1 ? 6 : 4, f = new S(c + e * a);
  f.uint8(i), f.uint8(s), i === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, g = Hh(l, r);
    qh(f, g, a);
  }
  return f.toArray();
}
function Hh(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function $h(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function Zh(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < n && o < 16; )
    o++;
  const i = e << o | n;
  let s = 1;
  for (; s < 4 && i > jh(s); )
    s++;
  return { entryFormat: s - 1 << 4 | o - 1 };
}
function jh(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function Yh(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function qh(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const Xn = 32768, Kn = 4095, Jn = 32768, Qn = 16384, te = 8192, Wh = 4095, Ws = 128, Xh = 127, Xs = 128, Ks = 64, Kh = 63;
function Fn(t) {
  const n = t.uint8();
  let e;
  if (n === 0)
    return null;
  if ((n & 128) === 0)
    e = n;
  else {
    const s = t.uint8();
    e = (n & 127) << 8 | s;
  }
  const o = [];
  let i = 0;
  for (; o.length < e; ) {
    const s = t.uint8(), r = (s & Xh) + 1, a = (s & Ws) !== 0;
    for (let c = 0; c < r && o.length < e; c++) {
      const f = a ? t.uint16() : t.uint8();
      i += f, o.push(i);
    }
  }
  return o;
}
function Pn(t) {
  if (t === null)
    return [0];
  const n = t.length, e = [];
  n < 128 ? e.push(n) : (e.push(128 | n >> 8), e.push(n & 255));
  const o = [];
  let i = 0;
  for (const r of t)
    o.push(r - i), i = r;
  let s = 0;
  for (; s < o.length; ) {
    const r = o[s] > 255;
    let a = 1;
    const c = Math.min(128, o.length - s);
    for (; a < c && o[s + a] > 255 === r; )
      a++;
    const f = (r ? Ws : 0) | a - 1;
    e.push(f);
    for (let u = 0; u < a; u++) {
      const l = o[s + u];
      r ? e.push(l >> 8 & 255, l & 255) : e.push(l & 255);
    }
    s += a;
  }
  return e;
}
function Js(t, n) {
  const e = [];
  for (; e.length < n; ) {
    const o = t.uint8(), i = (o & Kh) + 1;
    if (o & Xs)
      for (let s = 0; s < i && e.length < n; s++)
        e.push(0);
    else if (o & Ks)
      for (let s = 0; s < i && e.length < n; s++)
        e.push(t.int16());
    else
      for (let s = 0; s < i && e.length < n; s++)
        e.push(t.int8());
  }
  return e;
}
function Qs(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; )
    if (t[e] === 0) {
      let o = 1;
      const i = Math.min(64, t.length - e);
      for (; o < i && t[e + o] === 0; )
        o++;
      n.push(Xs | o - 1), e += o;
    } else if (t[e] < -128 || t[e] > 127) {
      let o = 1;
      const i = Math.min(64, t.length - e);
      for (; o < i; ) {
        const s = t[e + o];
        if (s === 0 || s >= -128 && s <= 127) break;
        o++;
      }
      n.push(Ks | o - 1);
      for (let s = 0; s < o; s++) {
        const r = t[e + s] & 65535;
        n.push(r >> 8 & 255, r & 255);
      }
      e += o;
    } else {
      let o = 1;
      const i = Math.min(64, t.length - e);
      for (; o < i; ) {
        const s = t[e + o];
        if (s === 0 || s < -128 || s > 127) break;
        o++;
      }
      n.push(o - 1);
      for (let s = 0; s < o; s++)
        n.push(t[e + s] & 255);
      e += o;
    }
  return n;
}
function Jh(t, n, e, o) {
  if (!t || t.length === 0) return [];
  const i = new E(t), s = i.uint16(), r = i.offset16(), a = s & Kn, c = (s & Xn) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let g = 0; g < a; g++) {
    const p = i.uint16(), h = i.uint16();
    let d;
    if (h & Jn)
      d = i.array("f2dot14", n);
    else {
      const y = h & Wh;
      d = e[y] ?? new Array(n).fill(0);
    }
    let x = null, m = null;
    h & Qn && (x = i.array("f2dot14", n), m = i.array("f2dot14", n)), f.push({
      variationDataSize: p,
      tupleIndex: h,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (h & te) !== 0
    });
  }
  i.seek(r);
  let u = null;
  c && (u = Fn(i));
  const l = [];
  for (const g of f) {
    const h = i.position + g.variationDataSize;
    let d;
    g.hasPrivatePoints ? d = Fn(i) : d = u;
    const x = d === null ? o : d.length, m = x * 2, y = Js(i, m);
    l.push({
      peakTuple: g.peakTuple,
      intermediateStartTuple: g.intermediateStartTuple,
      intermediateEndTuple: g.intermediateEndTuple,
      pointIndices: d,
      xDeltas: y.slice(0, x),
      yDeltas: y.slice(x)
    }), i.seek(h);
  }
  return l;
}
function Qh(t, n) {
  if (!t || t.length === 0) return [];
  const e = t.length, i = t.every(
    (h) => JSON.stringify(h.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && e > 1, s = [];
  let r = [];
  i && (r = Pn(t[0].pointIndices), s.push(r));
  const a = [];
  for (const h of t) {
    const d = [];
    i || d.push(...Pn(h.pointIndices));
    const x = [...h.xDeltas ?? [], ...h.yDeltas ?? []];
    d.push(...Qs(x)), a.push(d.length), s.push(d);
  }
  const c = [];
  for (const h of s)
    c.push(...h);
  const f = [];
  for (let h = 0; h < e; h++) {
    const d = t[h];
    let x = Jn;
    i || (x |= te), d.intermediateStartTuple && (x |= Qn);
    const m = [];
    m.push(a[h] >> 8 & 255), m.push(a[h] & 255), m.push(x >> 8 & 255), m.push(x & 255);
    for (let y = 0; y < n; y++) {
      const _ = Math.round((d.peakTuple[y] ?? 0) * 16384) & 65535;
      m.push(_ >> 8 & 255, _ & 255);
    }
    if (d.intermediateStartTuple) {
      for (let y = 0; y < n; y++) {
        const _ = Math.round((d.intermediateStartTuple[y] ?? 0) * 16384) & 65535;
        m.push(_ >> 8 & 255, _ & 255);
      }
      for (let y = 0; y < n; y++) {
        const _ = Math.round((d.intermediateEndTuple[y] ?? 0) * 16384) & 65535;
        m.push(_ >> 8 & 255, _ & 255);
      }
    }
    f.push(m);
  }
  const u = [];
  for (const h of f)
    u.push(...h);
  const l = (i ? Xn : 0) | e & Kn, g = 4 + u.length, p = [];
  return p.push(l >> 8 & 255), p.push(l & 255), p.push(g >> 8 & 255), p.push(g & 255), p.push(...u), p.push(...c), p;
}
function t0(t, n, e) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const o = new E(t), i = o.uint16(), s = o.uint16(), r = o.uint16(), a = o.offset16(), c = r & Kn, f = (r & Xn) !== 0;
  if (c === 0)
    return { majorVersion: i, minorVersion: s, tupleVariations: [] };
  const u = [];
  for (let p = 0; p < c; p++) {
    const h = o.uint16(), d = o.uint16();
    let x = null;
    d & Jn && (x = o.array("f2dot14", n));
    let m = null, y = null;
    d & Qn && (m = o.array("f2dot14", n), y = o.array("f2dot14", n)), u.push({
      variationDataSize: h,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (d & te) !== 0
    });
  }
  o.seek(a);
  let l = null;
  f && (l = Fn(o));
  const g = [];
  for (const p of u) {
    const d = o.position + p.variationDataSize;
    let x;
    p.hasPrivatePoints ? x = Fn(o) : x = l;
    const m = x === null ? e : x.length, y = Js(o, m);
    g.push({
      peakTuple: p.peakTuple,
      intermediateStartTuple: p.intermediateStartTuple,
      intermediateEndTuple: p.intermediateEndTuple,
      pointIndices: x,
      deltas: y
    }), o.seek(d);
  }
  return { majorVersion: i, minorVersion: s, tupleVariations: g };
}
function n0(t, n) {
  const e = t.majorVersion ?? 1, o = t.minorVersion ?? 0, i = t.tupleVariations ?? [], s = i.length;
  if (s === 0) {
    const x = new S(8);
    return x.uint16(e), x.uint16(o), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = i.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(i[0].pointIndices)
  ) && s > 1, c = [];
  a && c.push(
    Pn(i[0].pointIndices)
  );
  const f = [];
  for (const x of i) {
    const m = [];
    a || m.push(...Pn(x.pointIndices)), m.push(...Qs(x.deltas ?? [])), f.push(m.length), c.push(m);
  }
  const u = [];
  for (const x of c)
    u.push(...x);
  const l = [];
  for (let x = 0; x < s; x++) {
    const m = i[x];
    let y = Jn;
    a || (y |= te), m.intermediateStartTuple && (y |= Qn), l.push(f[x] >> 8 & 255), l.push(f[x] & 255), l.push(y >> 8 & 255), l.push(y & 255);
    for (let _ = 0; _ < n; _++) {
      const w = Math.round((m.peakTuple[_] ?? 0) * 16384) & 65535;
      l.push(w >> 8 & 255, w & 255);
    }
    if (m.intermediateStartTuple) {
      for (let _ = 0; _ < n; _++) {
        const w = Math.round((m.intermediateStartTuple[_] ?? 0) * 16384) & 65535;
        l.push(w >> 8 & 255, w & 255);
      }
      for (let _ = 0; _ < n; _++) {
        const w = Math.round((m.intermediateEndTuple[_] ?? 0) * 16384) & 65535;
        l.push(w >> 8 & 255, w & 255);
      }
    }
  }
  const g = (a ? Xn : 0) | s & Kn, p = 8 + l.length, h = p + u.length, d = new S(h);
  return d.uint16(e), d.uint16(o), d.uint16(g), d.offset16(p), d.rawBytes(l), d.rawBytes(u), d.toArray();
}
function e0(t, n = {}) {
  const e = n.fvar?.axes?.length ?? 0, o = n["cvt "]?.values?.length ?? 0;
  return t0(t, e, o);
}
function o0(t) {
  const n = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return n0(t, n);
}
function i0(t) {
  const n = new E(t), e = t.length >>> 1;
  return { values: n.array("fword", e) };
}
function s0(t) {
  const n = t.values, e = new S(n.length * 2);
  return e.array("fword", n), e.toArray();
}
function r0(t) {
  return { instructions: Array.from(t) };
}
function a0(t) {
  return Array.from(t.instructions);
}
function c0(t) {
  const n = new E(t), e = n.uint16(), o = n.uint16(), i = [];
  for (let s = 0; s < o; s++)
    i.push({
      rangeMaxPPEM: n.uint16(),
      rangeGaspBehavior: n.uint16()
    });
  return { version: e, gaspRanges: i };
}
function f0(t) {
  const { version: n, gaspRanges: e } = t, o = new S(4 + e.length * 4);
  o.uint16(n), o.uint16(e.length);
  for (const i of e)
    o.uint16(i.rangeMaxPPEM), o.uint16(i.rangeGaspBehavior);
  return o.toArray();
}
const tr = 1, nr = 2, er = 4, or = 8, Un = 16, Nn = 32, ir = 64, on = 1, Gn = 2, sr = 4, go = 8, $e = 32, po = 64, mo = 128, sn = 256, rr = 512, ar = 1024, cr = 2048, fr = 4096;
function u0(t, n) {
  const e = n.loca.offsets, o = n.maxp.numGlyphs, i = new E(t), s = [];
  for (let r = 0; r < o; r++) {
    const a = e[r], c = e[r + 1];
    if (a === c) {
      s.push(null);
      continue;
    }
    i.seek(a);
    const f = i.int16(), u = i.int16(), l = i.int16(), g = i.int16(), p = i.int16();
    f >= 0 ? s.push(
      l0(i, f, u, l, g, p)
    ) : s.push(h0(i, u, l, g, p));
  }
  return { glyphs: s };
}
function l0(t, n, e, o, i, s) {
  const r = t.array("uint16", n), a = n > 0 ? r[n - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), u = [];
  for (; u.length < a; ) {
    const y = t.uint8();
    if (u.push(y), y & or) {
      const _ = t.uint8();
      for (let w = 0; w < _; w++)
        u.push(y);
    }
  }
  const l = new Array(a);
  let g = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & nr) {
      const w = t.uint8();
      g += _ & Un ? w : -w;
    } else _ & Un || (g += t.int16());
    l[y] = g;
  }
  const p = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & er) {
      const w = t.uint8();
      h += _ & Nn ? w : -w;
    } else _ & Nn || (h += t.int16());
    p[y] = h;
  }
  const d = a > 0 && (u[0] & ir) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < n; y++) {
    const _ = r[y], w = [];
    for (; m <= _; )
      w.push({
        x: l[m],
        y: p[m],
        onCurve: (u[m] & tr) !== 0
      }), m++;
    x.push(w);
  }
  return {
    type: "simple",
    xMin: e,
    yMin: o,
    xMax: i,
    yMax: s,
    contours: x,
    instructions: f,
    overlapSimple: d
  };
}
function h0(t, n, e, o, i) {
  const s = [];
  let r, a = !1;
  do {
    r = t.uint16();
    const f = t.uint16();
    let u, l;
    r & on ? r & Gn ? (u = t.int16(), l = t.int16()) : (u = t.uint16(), l = t.uint16()) : r & Gn ? (u = t.int8(), l = t.int8()) : (u = t.uint8(), l = t.uint8());
    const g = {
      glyphIndex: f,
      flags: g0(r),
      argument1: u,
      argument2: l
    };
    r & go ? g.transform = { scale: t.f2dot14() } : r & po ? g.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : r & mo && (g.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), s.push(g), r & sn && (a = !0);
  } while (r & $e);
  let c = [];
  if (a) {
    const f = t.uint16();
    c = t.bytes(f);
  }
  return {
    type: "composite",
    xMin: n,
    yMin: e,
    xMax: o,
    yMax: i,
    components: s,
    instructions: c
  };
}
function g0(t) {
  const n = {};
  return t & on && (n.argsAreWords = !0), t & Gn && (n.argsAreXYValues = !0), t & sr && (n.roundXYToGrid = !0), t & go && (n.weHaveAScale = !0), t & po && (n.weHaveAnXAndYScale = !0), t & mo && (n.weHaveATwoByTwo = !0), t & sn && (n.weHaveInstructions = !0), t & rr && (n.useMyMetrics = !0), t & ar && (n.overlapCompound = !0), t & cr && (n.scaledComponentOffset = !0), t & fr && (n.unscaledComponentOffset = !0), n;
}
function ur(t) {
  const { glyphs: n } = t, e = [];
  for (const s of n) {
    if (s === null) {
      e.push([]);
      continue;
    }
    s.type === "simple" ? e.push(d0(s)) : e.push(y0(s));
  }
  const o = [], i = [];
  for (const s of e) {
    i.push(o.length);
    for (let r = 0; r < s.length; r++)
      o.push(s[r]);
    s.length % 2 !== 0 && o.push(0);
  }
  return i.push(o.length), { bytes: o, offsets: i };
}
function p0(t) {
  return ur(t).bytes;
}
function d0(t) {
  const { contours: n, instructions: e, xMin: o, yMin: i, xMax: s, yMax: r, overlapSimple: a } = t, c = n.length, f = [], u = [];
  for (const k of n) {
    for (const O of k)
      f.push(O);
    u.push(f.length - 1);
  }
  const l = f.length, g = f.map((k) => k.x), p = f.map((k) => k.y), h = new Array(l), d = new Array(l);
  for (let k = 0; k < l; k++)
    h[k] = k === 0 ? g[k] : g[k] - g[k - 1], d[k] = k === 0 ? p[k] : p[k] - p[k - 1];
  const x = [], m = [], y = [];
  for (let k = 0; k < l; k++) {
    let O = 0;
    f[k].onCurve && (O |= tr);
    const I = h[k], B = d[k];
    I === 0 ? O |= Un : I >= -255 && I <= 255 ? (O |= nr, I > 0 ? (O |= Un, m.push(I)) : m.push(-I)) : m.push(I >> 8 & 255, I & 255), B === 0 ? O |= Nn : B >= -255 && B <= 255 ? (O |= er, B > 0 ? (O |= Nn, y.push(B)) : y.push(-B)) : y.push(B >> 8 & 255, B & 255), k === 0 && a && (O |= ir), x.push(O);
  }
  const _ = m0(x), w = 10, v = c * 2, b = 2, A = e.length, D = w + v + b + A + _.length + m.length + y.length, C = new S(D);
  return C.int16(c), C.int16(o), C.int16(i), C.int16(s), C.int16(r), C.array("uint16", u), C.uint16(e.length), C.rawBytes(e), C.rawBytes(_), C.rawBytes(m), C.rawBytes(y), C.toArray();
}
function m0(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; ) {
    const o = t[e];
    let i = 0;
    for (; e + 1 + i < t.length && t[e + 1 + i] === o && i < 255; )
      i++;
    i > 0 ? (n.push(o | or, i), e += 1 + i) : (n.push(o), e++);
  }
  return n;
}
function y0(t) {
  const { components: n, instructions: e, xMin: o, yMin: i, xMax: s, yMax: r } = t;
  let a = 10;
  for (let f = 0; f < n.length; f++) {
    const u = n[f];
    a += 4;
    const l = u.flags.argsAreWords || ri(u.argument1, u.argument2, u.flags.argsAreXYValues);
    a += l ? 4 : 2, u.transform && ("scale" in u.transform ? a += 2 : "scale01" in u.transform ? a += 8 : "xScale" in u.transform && (a += 4));
  }
  e && e.length > 0 && (a += 2 + e.length);
  const c = new S(a);
  c.int16(-1), c.int16(o), c.int16(i), c.int16(s), c.int16(r);
  for (let f = 0; f < n.length; f++) {
    const u = n[f], l = f === n.length - 1;
    let g = x0(u.flags);
    const p = u.flags.argsAreWords || ri(u.argument1, u.argument2, u.flags.argsAreXYValues);
    p ? g |= on : g &= ~on, l ? g &= ~$e : g |= $e, l && e && e.length > 0 ? g |= sn : l && (g &= ~sn), c.uint16(g), c.uint16(u.glyphIndex), p ? u.flags.argsAreXYValues ? (c.int16(u.argument1), c.int16(u.argument2)) : (c.uint16(u.argument1), c.uint16(u.argument2)) : u.flags.argsAreXYValues ? (c.int8(u.argument1), c.int8(u.argument2)) : (c.uint8(u.argument1), c.uint8(u.argument2)), u.transform && ("scale" in u.transform ? c.f2dot14(u.transform.scale) : "scale01" in u.transform ? (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.scale01), c.f2dot14(u.transform.scale10), c.f2dot14(u.transform.yScale)) : "xScale" in u.transform && (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.yScale)));
  }
  return e && e.length > 0 && (c.uint16(e.length), c.rawBytes(e)), c.toArray();
}
function ri(t, n, e) {
  return e ? t < -128 || t > 127 || n < -128 || n > 127 : t > 255 || n > 255;
}
function x0(t) {
  let n = 0;
  return t.argsAreWords && (n |= on), t.argsAreXYValues && (n |= Gn), t.roundXYToGrid && (n |= sr), t.weHaveAScale && (n |= go), t.weHaveAnXAndYScale && (n |= po), t.weHaveATwoByTwo && (n |= mo), t.weHaveInstructions && (n |= sn), t.useMyMetrics && (n |= rr), t.overlapCompound && (n |= ar), t.scaledComponentOffset && (n |= cr), t.unscaledComponentOffset && (n |= fr), n;
}
const w0 = 20, Ze = 1;
function _0(t, n = {}) {
  const e = new E(t), o = e.uint16(), i = e.uint16(), s = e.uint16(), r = e.uint16(), a = e.offset32(), c = e.uint16(), f = e.uint16(), u = e.offset32(), l = (f & Ze) !== 0, g = c + 1, p = [];
  for (let x = 0; x < g; x++)
    l ? p.push(e.uint32()) : p.push(e.uint16() * 2);
  const h = [];
  if (r > 0 && a > 0) {
    e.seek(a);
    for (let x = 0; x < r; x++) {
      const m = [];
      for (let y = 0; y < s; y++)
        m.push(e.f2dot14());
      h.push(m);
    }
  }
  const d = [];
  for (let x = 0; x < c; x++) {
    const m = p[x], y = p[x + 1], _ = Math.max(0, y - m);
    if (_ === 0) {
      d.push([]);
      continue;
    }
    const w = u + m, v = t.slice(w, w + _), b = S0(n, x);
    d.push(
      Jh(v, s, h, b)
    );
  }
  return {
    majorVersion: o,
    minorVersion: i,
    axisCount: s,
    flags: f,
    sharedTuples: h,
    glyphVariationData: d
  };
}
function S0(t, n) {
  const e = t.glyf?.glyphs?.[n];
  if (!e) return 0;
  if (e.type === "simple" && e.contours) {
    let o = 0;
    for (const i of e.contours)
      o += i.length;
    return o + 4;
  }
  return e.type === "composite" && e.components ? e.components.length + 4 : 0;
}
function v0(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.axisCount ?? 0, i = t.glyphVariationData ?? [], s = i.length, r = i.map((v) => Array.isArray(v) && (v.length === 0 || typeof v[0] == "number") ? v : Array.isArray(v) ? Qh(v, o) : []), a = t.sharedTuples ?? A0(i, o), c = a.length, f = c * o * 2, u = [0];
  let l = 0;
  for (const v of r)
    l += v.length, u.push(l);
  const g = u.every(
    (v) => v % 2 === 0 && v / 2 <= 65535
  ), p = g ? 2 : 4, h = (s + 1) * p, d = w0 + h, x = d + f, m = x + l, y = t.flags ?? 0, _ = g ? y & ~Ze : y | Ze, w = new S(m);
  w.uint16(n), w.uint16(e), w.uint16(o), w.uint16(c), w.offset32(d), w.uint16(s), w.uint16(_), w.offset32(x);
  for (const v of u)
    g ? w.uint16(v / 2) : w.uint32(v);
  for (const v of a)
    for (let b = 0; b < o; b++)
      w.f2dot14(v[b] ?? 0);
  for (const v of r)
    w.rawBytes(v);
  return w.toArray();
}
function A0(t, n) {
  if (n === 0) return [];
  const e = /* @__PURE__ */ new Set(), o = [];
  for (const i of t)
    if (Array.isArray(i))
      for (const s of i) {
        if (!s || !s.peakTuple) continue;
        const r = s.peakTuple.map((a) => Math.round((a ?? 0) * 16384)).join(",");
        e.has(r) || (e.add(r), o.push(s.peakTuple));
      }
  return o;
}
function b0(t, n) {
  const e = n.head.indexToLocFormat, i = n.maxp.numGlyphs + 1, s = new E(t), r = [];
  if (e === 0)
    for (let a = 0; a < i; a++)
      r.push(s.uint16() * 2);
  else
    for (let a = 0; a < i; a++)
      r.push(s.uint32());
  return { offsets: r };
}
function lr(t) {
  const { offsets: n } = t;
  if (n.every((i) => i % 2 === 0 && i / 2 <= 65535)) {
    const i = new S(n.length * 2);
    for (const s of n)
      i.uint16(s / 2);
    return i.toArray();
  }
  const o = new S(n.length * 4);
  for (const i of n)
    o.uint32(i);
  return o.toArray();
}
function k0(t) {
  return { instructions: Array.from(t) };
}
function C0(t) {
  return Array.from(t.instructions);
}
const O0 = 4, ai = 0, ci = 1, I0 = 2;
function Nt(t) {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}
const D0 = 0, hr = 1, E0 = 2, B0 = 3, T0 = 258, yo = 29, mn = 256, rn = mn + 1 + yo, Mt = 30, xo = 19, gr = 2 * rn + 1, dt = 15, ye = 16, R0 = 7, wo = 256, pr = 16, dr = 17, mr = 18, je = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), Mn = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), M0 = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), yr = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), L0 = 512, nt = new Array((rn + 2) * 2);
Nt(nt);
const Qt = new Array(Mt * 2);
Nt(Qt);
const an = new Array(L0);
Nt(an);
const cn = new Array(T0 - B0 + 1);
Nt(cn);
const _o = new Array(yo);
Nt(_o);
const Hn = new Array(Mt);
Nt(Hn);
function xe(t, n, e, o, i) {
  this.static_tree = t, this.extra_bits = n, this.extra_base = e, this.elems = o, this.max_length = i, this.has_stree = t && t.length;
}
let xr, wr, _r;
function we(t, n) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = n;
}
const Sr = (t) => t < 256 ? an[t] : an[256 + (t >>> 7)], fn = (t, n) => {
  t.pending_buf[t.pending++] = n & 255, t.pending_buf[t.pending++] = n >>> 8 & 255;
}, H = (t, n, e) => {
  t.bi_valid > ye - e ? (t.bi_buf |= n << t.bi_valid & 65535, fn(t, t.bi_buf), t.bi_buf = n >> ye - t.bi_valid, t.bi_valid += e - ye) : (t.bi_buf |= n << t.bi_valid & 65535, t.bi_valid += e);
}, K = (t, n, e) => {
  H(
    t,
    e[n * 2],
    e[n * 2 + 1]
    /*.Len*/
  );
}, vr = (t, n) => {
  let e = 0;
  do
    e |= t & 1, t >>>= 1, e <<= 1;
  while (--n > 0);
  return e >>> 1;
}, z0 = (t) => {
  t.bi_valid === 16 ? (fn(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, V0 = (t, n) => {
  const e = n.dyn_tree, o = n.max_code, i = n.stat_desc.static_tree, s = n.stat_desc.has_stree, r = n.stat_desc.extra_bits, a = n.stat_desc.extra_base, c = n.stat_desc.max_length;
  let f, u, l, g, p, h, d = 0;
  for (g = 0; g <= dt; g++)
    t.bl_count[g] = 0;
  for (e[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < gr; f++)
    u = t.heap[f], g = e[e[u * 2 + 1] * 2 + 1] + 1, g > c && (g = c, d++), e[u * 2 + 1] = g, !(u > o) && (t.bl_count[g]++, p = 0, u >= a && (p = r[u - a]), h = e[u * 2], t.opt_len += h * (g + p), s && (t.static_len += h * (i[u * 2 + 1] + p)));
  if (d !== 0) {
    do {
      for (g = c - 1; t.bl_count[g] === 0; )
        g--;
      t.bl_count[g]--, t.bl_count[g + 1] += 2, t.bl_count[c]--, d -= 2;
    } while (d > 0);
    for (g = c; g !== 0; g--)
      for (u = t.bl_count[g]; u !== 0; )
        l = t.heap[--f], !(l > o) && (e[l * 2 + 1] !== g && (t.opt_len += (g - e[l * 2 + 1]) * e[l * 2], e[l * 2 + 1] = g), u--);
  }
}, Ar = (t, n, e) => {
  const o = new Array(dt + 1);
  let i = 0, s, r;
  for (s = 1; s <= dt; s++)
    i = i + e[s - 1] << 1, o[s] = i;
  for (r = 0; r <= n; r++) {
    let a = t[r * 2 + 1];
    a !== 0 && (t[r * 2] = vr(o[a]++, a));
  }
}, F0 = () => {
  let t, n, e, o, i;
  const s = new Array(dt + 1);
  for (e = 0, o = 0; o < yo - 1; o++)
    for (_o[o] = e, t = 0; t < 1 << je[o]; t++)
      cn[e++] = o;
  for (cn[e - 1] = o, i = 0, o = 0; o < 16; o++)
    for (Hn[o] = i, t = 0; t < 1 << Mn[o]; t++)
      an[i++] = o;
  for (i >>= 7; o < Mt; o++)
    for (Hn[o] = i << 7, t = 0; t < 1 << Mn[o] - 7; t++)
      an[256 + i++] = o;
  for (n = 0; n <= dt; n++)
    s[n] = 0;
  for (t = 0; t <= 143; )
    nt[t * 2 + 1] = 8, t++, s[8]++;
  for (; t <= 255; )
    nt[t * 2 + 1] = 9, t++, s[9]++;
  for (; t <= 279; )
    nt[t * 2 + 1] = 7, t++, s[7]++;
  for (; t <= 287; )
    nt[t * 2 + 1] = 8, t++, s[8]++;
  for (Ar(nt, rn + 1, s), t = 0; t < Mt; t++)
    Qt[t * 2 + 1] = 5, Qt[t * 2] = vr(t, 5);
  xr = new xe(nt, je, mn + 1, rn, dt), wr = new xe(Qt, Mn, 0, Mt, dt), _r = new xe(new Array(0), M0, 0, xo, R0);
}, br = (t) => {
  let n;
  for (n = 0; n < rn; n++)
    t.dyn_ltree[n * 2] = 0;
  for (n = 0; n < Mt; n++)
    t.dyn_dtree[n * 2] = 0;
  for (n = 0; n < xo; n++)
    t.bl_tree[n * 2] = 0;
  t.dyn_ltree[wo * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, kr = (t) => {
  t.bi_valid > 8 ? fn(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, fi = (t, n, e, o) => {
  const i = n * 2, s = e * 2;
  return t[i] < t[s] || t[i] === t[s] && o[n] <= o[e];
}, _e = (t, n, e) => {
  const o = t.heap[e];
  let i = e << 1;
  for (; i <= t.heap_len && (i < t.heap_len && fi(n, t.heap[i + 1], t.heap[i], t.depth) && i++, !fi(n, o, t.heap[i], t.depth)); )
    t.heap[e] = t.heap[i], e = i, i <<= 1;
  t.heap[e] = o;
}, ui = (t, n, e) => {
  let o, i, s = 0, r, a;
  if (t.sym_next !== 0)
    do
      o = t.pending_buf[t.sym_buf + s++] & 255, o += (t.pending_buf[t.sym_buf + s++] & 255) << 8, i = t.pending_buf[t.sym_buf + s++], o === 0 ? K(t, i, n) : (r = cn[i], K(t, r + mn + 1, n), a = je[r], a !== 0 && (i -= _o[r], H(t, i, a)), o--, r = Sr(o), K(t, r, e), a = Mn[r], a !== 0 && (o -= Hn[r], H(t, o, a)));
    while (s < t.sym_next);
  K(t, wo, n);
}, Ye = (t, n) => {
  const e = n.dyn_tree, o = n.stat_desc.static_tree, i = n.stat_desc.has_stree, s = n.stat_desc.elems;
  let r, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = gr, r = 0; r < s; r++)
    e[r * 2] !== 0 ? (t.heap[++t.heap_len] = c = r, t.depth[r] = 0) : e[r * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, e[f * 2] = 1, t.depth[f] = 0, t.opt_len--, i && (t.static_len -= o[f * 2 + 1]);
  for (n.max_code = c, r = t.heap_len >> 1; r >= 1; r--)
    _e(t, e, r);
  f = s;
  do
    r = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], _e(
      t,
      e,
      1
      /*SMALLEST*/
    ), a = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[--t.heap_max] = r, t.heap[--t.heap_max] = a, e[f * 2] = e[r * 2] + e[a * 2], t.depth[f] = (t.depth[r] >= t.depth[a] ? t.depth[r] : t.depth[a]) + 1, e[r * 2 + 1] = e[a * 2 + 1] = f, t.heap[
      1
      /*SMALLEST*/
    ] = f++, _e(
      t,
      e,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], V0(t, n), Ar(e, c, t.bl_count);
}, li = (t, n, e) => {
  let o, i = -1, s, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), n[(e + 1) * 2 + 1] = 65535, o = 0; o <= e; o++)
    s = r, r = n[(o + 1) * 2 + 1], !(++a < c && s === r) && (a < f ? t.bl_tree[s * 2] += a : s !== 0 ? (s !== i && t.bl_tree[s * 2]++, t.bl_tree[pr * 2]++) : a <= 10 ? t.bl_tree[dr * 2]++ : t.bl_tree[mr * 2]++, a = 0, i = s, r === 0 ? (c = 138, f = 3) : s === r ? (c = 6, f = 3) : (c = 7, f = 4));
}, hi = (t, n, e) => {
  let o, i = -1, s, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), o = 0; o <= e; o++)
    if (s = r, r = n[(o + 1) * 2 + 1], !(++a < c && s === r)) {
      if (a < f)
        do
          K(t, s, t.bl_tree);
        while (--a !== 0);
      else s !== 0 ? (s !== i && (K(t, s, t.bl_tree), a--), K(t, pr, t.bl_tree), H(t, a - 3, 2)) : a <= 10 ? (K(t, dr, t.bl_tree), H(t, a - 3, 3)) : (K(t, mr, t.bl_tree), H(t, a - 11, 7));
      a = 0, i = s, r === 0 ? (c = 138, f = 3) : s === r ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, P0 = (t) => {
  let n;
  for (li(t, t.dyn_ltree, t.l_desc.max_code), li(t, t.dyn_dtree, t.d_desc.max_code), Ye(t, t.bl_desc), n = xo - 1; n >= 3 && t.bl_tree[yr[n] * 2 + 1] === 0; n--)
    ;
  return t.opt_len += 3 * (n + 1) + 5 + 5 + 4, n;
}, U0 = (t, n, e, o) => {
  let i;
  for (H(t, n - 257, 5), H(t, e - 1, 5), H(t, o - 4, 4), i = 0; i < o; i++)
    H(t, t.bl_tree[yr[i] * 2 + 1], 3);
  hi(t, t.dyn_ltree, n - 1), hi(t, t.dyn_dtree, e - 1);
}, N0 = (t) => {
  let n = 4093624447, e;
  for (e = 0; e <= 31; e++, n >>>= 1)
    if (n & 1 && t.dyn_ltree[e * 2] !== 0)
      return ai;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return ci;
  for (e = 32; e < mn; e++)
    if (t.dyn_ltree[e * 2] !== 0)
      return ci;
  return ai;
};
let gi = !1;
const G0 = (t) => {
  gi || (F0(), gi = !0), t.l_desc = new we(t.dyn_ltree, xr), t.d_desc = new we(t.dyn_dtree, wr), t.bl_desc = new we(t.bl_tree, _r), t.bi_buf = 0, t.bi_valid = 0, br(t);
}, Cr = (t, n, e, o) => {
  H(t, (D0 << 1) + (o ? 1 : 0), 3), kr(t), fn(t, e), fn(t, ~e), e && t.pending_buf.set(t.window.subarray(n, n + e), t.pending), t.pending += e;
}, H0 = (t) => {
  H(t, hr << 1, 3), K(t, wo, nt), z0(t);
}, $0 = (t, n, e, o) => {
  let i, s, r = 0;
  t.level > 0 ? (t.strm.data_type === I0 && (t.strm.data_type = N0(t)), Ye(t, t.l_desc), Ye(t, t.d_desc), r = P0(t), i = t.opt_len + 3 + 7 >>> 3, s = t.static_len + 3 + 7 >>> 3, s <= i && (i = s)) : i = s = e + 5, e + 4 <= i && n !== -1 ? Cr(t, n, e, o) : t.strategy === O0 || s === i ? (H(t, (hr << 1) + (o ? 1 : 0), 3), ui(t, nt, Qt)) : (H(t, (E0 << 1) + (o ? 1 : 0), 3), U0(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, r + 1), ui(t, t.dyn_ltree, t.dyn_dtree)), br(t), o && kr(t);
}, Z0 = (t, n, e) => (t.pending_buf[t.sym_buf + t.sym_next++] = n, t.pending_buf[t.sym_buf + t.sym_next++] = n >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = e, n === 0 ? t.dyn_ltree[e * 2]++ : (t.matches++, n--, t.dyn_ltree[(cn[e] + mn + 1) * 2]++, t.dyn_dtree[Sr(n) * 2]++), t.sym_next === t.sym_end);
var j0 = G0, Y0 = Cr, q0 = $0, W0 = Z0, X0 = H0, K0 = {
  _tr_init: j0,
  _tr_stored_block: Y0,
  _tr_flush_block: q0,
  _tr_tally: W0,
  _tr_align: X0
};
const J0 = (t, n, e, o) => {
  let i = t & 65535 | 0, s = t >>> 16 & 65535 | 0, r = 0;
  for (; e !== 0; ) {
    r = e > 2e3 ? 2e3 : e, e -= r;
    do
      i = i + n[o++] | 0, s = s + i | 0;
    while (--r);
    i %= 65521, s %= 65521;
  }
  return i | s << 16 | 0;
};
var un = J0;
const Q0 = () => {
  let t, n = [];
  for (var e = 0; e < 256; e++) {
    t = e;
    for (var o = 0; o < 8; o++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    n[e] = t;
  }
  return n;
}, t1 = new Uint32Array(Q0()), n1 = (t, n, e, o) => {
  const i = t1, s = o + e;
  t ^= -1;
  for (let r = o; r < s; r++)
    t = t >>> 8 ^ i[(t ^ n[r]) & 255];
  return t ^ -1;
};
var P = n1, wt = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
}, ne = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_PARTIAL_FLUSH: 1,
  Z_SYNC_FLUSH: 2,
  Z_FULL_FLUSH: 3,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  Z_DEFAULT_COMPRESSION: -1,
  Z_FILTERED: 1,
  Z_HUFFMAN_ONLY: 2,
  Z_RLE: 3,
  Z_FIXED: 4,
  Z_DEFAULT_STRATEGY: 0,
  //Z_ASCII:                1, // = Z_TEXT (deprecated)
  Z_UNKNOWN: 2,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
const { _tr_init: e1, _tr_stored_block: qe, _tr_flush_block: o1, _tr_tally: ut, _tr_align: i1 } = K0, {
  Z_NO_FLUSH: lt,
  Z_PARTIAL_FLUSH: s1,
  Z_FULL_FLUSH: r1,
  Z_FINISH: j,
  Z_BLOCK: pi,
  Z_OK: U,
  Z_STREAM_END: di,
  Z_STREAM_ERROR: J,
  Z_DATA_ERROR: a1,
  Z_BUF_ERROR: Se,
  Z_DEFAULT_COMPRESSION: c1,
  Z_FILTERED: f1,
  Z_HUFFMAN_ONLY: kn,
  Z_RLE: u1,
  Z_FIXED: l1,
  Z_DEFAULT_STRATEGY: h1,
  Z_UNKNOWN: g1,
  Z_DEFLATED: ee
} = ne, p1 = 9, d1 = 15, m1 = 8, y1 = 29, x1 = 256, We = x1 + 1 + y1, w1 = 30, _1 = 19, S1 = 2 * We + 1, v1 = 15, T = 3, at = 258, Q = at + T + 1, A1 = 32, Pt = 42, So = 57, Xe = 69, Ke = 73, Je = 91, Qe = 103, mt = 113, Wt = 666, N = 1, Gt = 2, _t = 3, Ht = 4, b1 = 3, yt = (t, n) => (t.msg = wt[n], n), mi = (t) => t * 2 - (t > 4 ? 9 : 0), it = (t) => {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}, k1 = (t) => {
  let n, e, o, i = t.w_size;
  n = t.hash_size, o = n;
  do
    e = t.head[--o], t.head[o] = e >= i ? e - i : 0;
  while (--n);
  n = i, o = n;
  do
    e = t.prev[--o], t.prev[o] = e >= i ? e - i : 0;
  while (--n);
};
let C1 = (t, n, e) => (n << t.hash_shift ^ e) & t.hash_mask, ht = C1;
const $ = (t) => {
  const n = t.state;
  let e = n.pending;
  e > t.avail_out && (e = t.avail_out), e !== 0 && (t.output.set(n.pending_buf.subarray(n.pending_out, n.pending_out + e), t.next_out), t.next_out += e, n.pending_out += e, t.total_out += e, t.avail_out -= e, n.pending -= e, n.pending === 0 && (n.pending_out = 0));
}, Z = (t, n) => {
  o1(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, n), t.block_start = t.strstart, $(t.strm);
}, R = (t, n) => {
  t.pending_buf[t.pending++] = n;
}, Zt = (t, n) => {
  t.pending_buf[t.pending++] = n >>> 8 & 255, t.pending_buf[t.pending++] = n & 255;
}, to = (t, n, e, o) => {
  let i = t.avail_in;
  return i > o && (i = o), i === 0 ? 0 : (t.avail_in -= i, n.set(t.input.subarray(t.next_in, t.next_in + i), e), t.state.wrap === 1 ? t.adler = un(t.adler, n, i, e) : t.state.wrap === 2 && (t.adler = P(t.adler, n, i, e)), t.next_in += i, t.total_in += i, i);
}, Or = (t, n) => {
  let e = t.max_chain_length, o = t.strstart, i, s, r = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - Q ? t.strstart - (t.w_size - Q) : 0, f = t.window, u = t.w_mask, l = t.prev, g = t.strstart + at;
  let p = f[o + r - 1], h = f[o + r];
  t.prev_length >= t.good_match && (e >>= 2), a > t.lookahead && (a = t.lookahead);
  do
    if (i = n, !(f[i + r] !== h || f[i + r - 1] !== p || f[i] !== f[o] || f[++i] !== f[o + 1])) {
      o += 2, i++;
      do
        ;
      while (f[++o] === f[++i] && f[++o] === f[++i] && f[++o] === f[++i] && f[++o] === f[++i] && f[++o] === f[++i] && f[++o] === f[++i] && f[++o] === f[++i] && f[++o] === f[++i] && o < g);
      if (s = at - (g - o), o = g - at, s > r) {
        if (t.match_start = n, r = s, s >= a)
          break;
        p = f[o + r - 1], h = f[o + r];
      }
    }
  while ((n = l[n & u]) > c && --e !== 0);
  return r <= t.lookahead ? r : t.lookahead;
}, Ut = (t) => {
  const n = t.w_size;
  let e, o, i;
  do {
    if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= n + (n - Q) && (t.window.set(t.window.subarray(n, n + n - o), 0), t.match_start -= n, t.strstart -= n, t.block_start -= n, t.insert > t.strstart && (t.insert = t.strstart), k1(t), o += n), t.strm.avail_in === 0)
      break;
    if (e = to(t.strm, t.window, t.strstart + t.lookahead, o), t.lookahead += e, t.lookahead + t.insert >= T)
      for (i = t.strstart - t.insert, t.ins_h = t.window[i], t.ins_h = ht(t, t.ins_h, t.window[i + 1]); t.insert && (t.ins_h = ht(t, t.ins_h, t.window[i + T - 1]), t.prev[i & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = i, i++, t.insert--, !(t.lookahead + t.insert < T)); )
        ;
  } while (t.lookahead < Q && t.strm.avail_in !== 0);
}, Ir = (t, n) => {
  let e = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, o, i, s, r = 0, a = t.strm.avail_in;
  do {
    if (o = 65535, s = t.bi_valid + 42 >> 3, t.strm.avail_out < s || (s = t.strm.avail_out - s, i = t.strstart - t.block_start, o > i + t.strm.avail_in && (o = i + t.strm.avail_in), o > s && (o = s), o < e && (o === 0 && n !== j || n === lt || o !== i + t.strm.avail_in)))
      break;
    r = n === j && o === i + t.strm.avail_in ? 1 : 0, qe(t, 0, 0, r), t.pending_buf[t.pending - 4] = o, t.pending_buf[t.pending - 3] = o >> 8, t.pending_buf[t.pending - 2] = ~o, t.pending_buf[t.pending - 1] = ~o >> 8, $(t.strm), i && (i > o && (i = o), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + i), t.strm.next_out), t.strm.next_out += i, t.strm.avail_out -= i, t.strm.total_out += i, t.block_start += i, o -= i), o && (to(t.strm, t.strm.output, t.strm.next_out, o), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o);
  } while (r === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), r ? Ht : n !== lt && n !== j && t.strm.avail_in === 0 && t.strstart === t.block_start ? Gt : (s = t.window_size - t.strstart, t.strm.avail_in > s && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, s += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), s > t.strm.avail_in && (s = t.strm.avail_in), s && (to(t.strm, t.window, t.strstart, s), t.strstart += s, t.insert += s > t.w_size - t.insert ? t.w_size - t.insert : s), t.high_water < t.strstart && (t.high_water = t.strstart), s = t.bi_valid + 42 >> 3, s = t.pending_buf_size - s > 65535 ? 65535 : t.pending_buf_size - s, e = s > t.w_size ? t.w_size : s, i = t.strstart - t.block_start, (i >= e || (i || n === j) && n !== lt && t.strm.avail_in === 0 && i <= s) && (o = i > s ? s : i, r = n === j && t.strm.avail_in === 0 && o === i ? 1 : 0, qe(t, t.block_start, o, r), t.block_start += o, $(t.strm)), r ? _t : N);
}, ve = (t, n) => {
  let e, o;
  for (; ; ) {
    if (t.lookahead < Q) {
      if (Ut(t), t.lookahead < Q && n === lt)
        return N;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= T && (t.ins_h = ht(t, t.ins_h, t.window[t.strstart + T - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), e !== 0 && t.strstart - e <= t.w_size - Q && (t.match_length = Or(t, e)), t.match_length >= T)
      if (o = ut(t, t.strstart - t.match_start, t.match_length - T), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= T) {
        t.match_length--;
        do
          t.strstart++, t.ins_h = ht(t, t.ins_h, t.window[t.strstart + T - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = ht(t, t.ins_h, t.window[t.strstart + 1]);
    else
      o = ut(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (o && (Z(t, !1), t.strm.avail_out === 0))
      return N;
  }
  return t.insert = t.strstart < T - 1 ? t.strstart : T - 1, n === j ? (Z(t, !0), t.strm.avail_out === 0 ? _t : Ht) : t.sym_next && (Z(t, !1), t.strm.avail_out === 0) ? N : Gt;
}, bt = (t, n) => {
  let e, o, i;
  for (; ; ) {
    if (t.lookahead < Q) {
      if (Ut(t), t.lookahead < Q && n === lt)
        return N;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= T && (t.ins_h = ht(t, t.ins_h, t.window[t.strstart + T - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = T - 1, e !== 0 && t.prev_length < t.max_lazy_match && t.strstart - e <= t.w_size - Q && (t.match_length = Or(t, e), t.match_length <= 5 && (t.strategy === f1 || t.match_length === T && t.strstart - t.match_start > 4096) && (t.match_length = T - 1)), t.prev_length >= T && t.match_length <= t.prev_length) {
      i = t.strstart + t.lookahead - T, o = ut(t, t.strstart - 1 - t.prev_match, t.prev_length - T), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= i && (t.ins_h = ht(t, t.ins_h, t.window[t.strstart + T - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = T - 1, t.strstart++, o && (Z(t, !1), t.strm.avail_out === 0))
        return N;
    } else if (t.match_available) {
      if (o = ut(t, 0, t.window[t.strstart - 1]), o && Z(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return N;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (o = ut(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < T - 1 ? t.strstart : T - 1, n === j ? (Z(t, !0), t.strm.avail_out === 0 ? _t : Ht) : t.sym_next && (Z(t, !1), t.strm.avail_out === 0) ? N : Gt;
}, O1 = (t, n) => {
  let e, o, i, s;
  const r = t.window;
  for (; ; ) {
    if (t.lookahead <= at) {
      if (Ut(t), t.lookahead <= at && n === lt)
        return N;
      if (t.lookahead === 0)
        break;
    }
    if (t.match_length = 0, t.lookahead >= T && t.strstart > 0 && (i = t.strstart - 1, o = r[i], o === r[++i] && o === r[++i] && o === r[++i])) {
      s = t.strstart + at;
      do
        ;
      while (o === r[++i] && o === r[++i] && o === r[++i] && o === r[++i] && o === r[++i] && o === r[++i] && o === r[++i] && o === r[++i] && i < s);
      t.match_length = at - (s - i), t.match_length > t.lookahead && (t.match_length = t.lookahead);
    }
    if (t.match_length >= T ? (e = ut(t, 1, t.match_length - T), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (e = ut(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), e && (Z(t, !1), t.strm.avail_out === 0))
      return N;
  }
  return t.insert = 0, n === j ? (Z(t, !0), t.strm.avail_out === 0 ? _t : Ht) : t.sym_next && (Z(t, !1), t.strm.avail_out === 0) ? N : Gt;
}, I1 = (t, n) => {
  let e;
  for (; ; ) {
    if (t.lookahead === 0 && (Ut(t), t.lookahead === 0)) {
      if (n === lt)
        return N;
      break;
    }
    if (t.match_length = 0, e = ut(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, e && (Z(t, !1), t.strm.avail_out === 0))
      return N;
  }
  return t.insert = 0, n === j ? (Z(t, !0), t.strm.avail_out === 0 ? _t : Ht) : t.sym_next && (Z(t, !1), t.strm.avail_out === 0) ? N : Gt;
};
function W(t, n, e, o, i) {
  this.good_length = t, this.max_lazy = n, this.nice_length = e, this.max_chain = o, this.func = i;
}
const Xt = [
  /*      good lazy nice chain */
  new W(0, 0, 0, 0, Ir),
  /* 0 store only */
  new W(4, 4, 8, 4, ve),
  /* 1 max speed, no lazy matches */
  new W(4, 5, 16, 8, ve),
  /* 2 */
  new W(4, 6, 32, 32, ve),
  /* 3 */
  new W(4, 4, 16, 16, bt),
  /* 4 lazy matches */
  new W(8, 16, 32, 32, bt),
  /* 5 */
  new W(8, 16, 128, 128, bt),
  /* 6 */
  new W(8, 32, 128, 256, bt),
  /* 7 */
  new W(32, 128, 258, 1024, bt),
  /* 8 */
  new W(32, 258, 258, 4096, bt)
  /* 9 max compression */
], D1 = (t) => {
  t.window_size = 2 * t.w_size, it(t.head), t.max_lazy_match = Xt[t.level].max_lazy, t.good_match = Xt[t.level].good_length, t.nice_match = Xt[t.level].nice_length, t.max_chain_length = Xt[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = T - 1, t.match_available = 0, t.ins_h = 0;
};
function E1() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = ee, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(S1 * 2), this.dyn_dtree = new Uint16Array((2 * w1 + 1) * 2), this.bl_tree = new Uint16Array((2 * _1 + 1) * 2), it(this.dyn_ltree), it(this.dyn_dtree), it(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(v1 + 1), this.heap = new Uint16Array(2 * We + 1), it(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * We + 1), it(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const yn = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.status !== Pt && //#ifdef GZIP
  n.status !== So && //#endif
  n.status !== Xe && n.status !== Ke && n.status !== Je && n.status !== Qe && n.status !== mt && n.status !== Wt ? 1 : 0;
}, Dr = (t) => {
  if (yn(t))
    return yt(t, J);
  t.total_in = t.total_out = 0, t.data_type = g1;
  const n = t.state;
  return n.pending = 0, n.pending_out = 0, n.wrap < 0 && (n.wrap = -n.wrap), n.status = //#ifdef GZIP
  n.wrap === 2 ? So : (
    //#endif
    n.wrap ? Pt : mt
  ), t.adler = n.wrap === 2 ? 0 : 1, n.last_flush = -2, e1(n), U;
}, Er = (t) => {
  const n = Dr(t);
  return n === U && D1(t.state), n;
}, B1 = (t, n) => yn(t) || t.state.wrap !== 2 ? J : (t.state.gzhead = n, U), Br = (t, n, e, o, i, s) => {
  if (!t)
    return J;
  let r = 1;
  if (n === c1 && (n = 6), o < 0 ? (r = 0, o = -o) : o > 15 && (r = 2, o -= 16), i < 1 || i > p1 || e !== ee || o < 8 || o > 15 || n < 0 || n > 9 || s < 0 || s > l1 || o === 8 && r !== 1)
    return yt(t, J);
  o === 8 && (o = 9);
  const a = new E1();
  return t.state = a, a.strm = t, a.status = Pt, a.wrap = r, a.gzhead = null, a.w_bits = o, a.w_size = 1 << a.w_bits, a.w_mask = a.w_size - 1, a.hash_bits = i + 7, a.hash_size = 1 << a.hash_bits, a.hash_mask = a.hash_size - 1, a.hash_shift = ~~((a.hash_bits + T - 1) / T), a.window = new Uint8Array(a.w_size * 2), a.head = new Uint16Array(a.hash_size), a.prev = new Uint16Array(a.w_size), a.lit_bufsize = 1 << i + 6, a.pending_buf_size = a.lit_bufsize * 4, a.pending_buf = new Uint8Array(a.pending_buf_size), a.sym_buf = a.lit_bufsize, a.sym_end = (a.lit_bufsize - 1) * 3, a.level = n, a.strategy = s, a.method = e, Er(t);
}, T1 = (t, n) => Br(t, n, ee, d1, m1, h1), R1 = (t, n) => {
  if (yn(t) || n > pi || n < 0)
    return t ? yt(t, J) : J;
  const e = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || e.status === Wt && n !== j)
    return yt(t, t.avail_out === 0 ? Se : J);
  const o = e.last_flush;
  if (e.last_flush = n, e.pending !== 0) {
    if ($(t), t.avail_out === 0)
      return e.last_flush = -1, U;
  } else if (t.avail_in === 0 && mi(n) <= mi(o) && n !== j)
    return yt(t, Se);
  if (e.status === Wt && t.avail_in !== 0)
    return yt(t, Se);
  if (e.status === Pt && e.wrap === 0 && (e.status = mt), e.status === Pt) {
    let i = ee + (e.w_bits - 8 << 4) << 8, s = -1;
    if (e.strategy >= kn || e.level < 2 ? s = 0 : e.level < 6 ? s = 1 : e.level === 6 ? s = 2 : s = 3, i |= s << 6, e.strstart !== 0 && (i |= A1), i += 31 - i % 31, Zt(e, i), e.strstart !== 0 && (Zt(e, t.adler >>> 16), Zt(e, t.adler & 65535)), t.adler = 1, e.status = mt, $(t), e.pending !== 0)
      return e.last_flush = -1, U;
  }
  if (e.status === So) {
    if (t.adler = 0, R(e, 31), R(e, 139), R(e, 8), e.gzhead)
      R(
        e,
        (e.gzhead.text ? 1 : 0) + (e.gzhead.hcrc ? 2 : 0) + (e.gzhead.extra ? 4 : 0) + (e.gzhead.name ? 8 : 0) + (e.gzhead.comment ? 16 : 0)
      ), R(e, e.gzhead.time & 255), R(e, e.gzhead.time >> 8 & 255), R(e, e.gzhead.time >> 16 & 255), R(e, e.gzhead.time >> 24 & 255), R(e, e.level === 9 ? 2 : e.strategy >= kn || e.level < 2 ? 4 : 0), R(e, e.gzhead.os & 255), e.gzhead.extra && e.gzhead.extra.length && (R(e, e.gzhead.extra.length & 255), R(e, e.gzhead.extra.length >> 8 & 255)), e.gzhead.hcrc && (t.adler = P(t.adler, e.pending_buf, e.pending, 0)), e.gzindex = 0, e.status = Xe;
    else if (R(e, 0), R(e, 0), R(e, 0), R(e, 0), R(e, 0), R(e, e.level === 9 ? 2 : e.strategy >= kn || e.level < 2 ? 4 : 0), R(e, b1), e.status = mt, $(t), e.pending !== 0)
      return e.last_flush = -1, U;
  }
  if (e.status === Xe) {
    if (e.gzhead.extra) {
      let i = e.pending, s = (e.gzhead.extra.length & 65535) - e.gzindex;
      for (; e.pending + s > e.pending_buf_size; ) {
        let a = e.pending_buf_size - e.pending;
        if (e.pending_buf.set(e.gzhead.extra.subarray(e.gzindex, e.gzindex + a), e.pending), e.pending = e.pending_buf_size, e.gzhead.hcrc && e.pending > i && (t.adler = P(t.adler, e.pending_buf, e.pending - i, i)), e.gzindex += a, $(t), e.pending !== 0)
          return e.last_flush = -1, U;
        i = 0, s -= a;
      }
      let r = new Uint8Array(e.gzhead.extra);
      e.pending_buf.set(r.subarray(e.gzindex, e.gzindex + s), e.pending), e.pending += s, e.gzhead.hcrc && e.pending > i && (t.adler = P(t.adler, e.pending_buf, e.pending - i, i)), e.gzindex = 0;
    }
    e.status = Ke;
  }
  if (e.status === Ke) {
    if (e.gzhead.name) {
      let i = e.pending, s;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > i && (t.adler = P(t.adler, e.pending_buf, e.pending - i, i)), $(t), e.pending !== 0)
            return e.last_flush = -1, U;
          i = 0;
        }
        e.gzindex < e.gzhead.name.length ? s = e.gzhead.name.charCodeAt(e.gzindex++) & 255 : s = 0, R(e, s);
      } while (s !== 0);
      e.gzhead.hcrc && e.pending > i && (t.adler = P(t.adler, e.pending_buf, e.pending - i, i)), e.gzindex = 0;
    }
    e.status = Je;
  }
  if (e.status === Je) {
    if (e.gzhead.comment) {
      let i = e.pending, s;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > i && (t.adler = P(t.adler, e.pending_buf, e.pending - i, i)), $(t), e.pending !== 0)
            return e.last_flush = -1, U;
          i = 0;
        }
        e.gzindex < e.gzhead.comment.length ? s = e.gzhead.comment.charCodeAt(e.gzindex++) & 255 : s = 0, R(e, s);
      } while (s !== 0);
      e.gzhead.hcrc && e.pending > i && (t.adler = P(t.adler, e.pending_buf, e.pending - i, i));
    }
    e.status = Qe;
  }
  if (e.status === Qe) {
    if (e.gzhead.hcrc) {
      if (e.pending + 2 > e.pending_buf_size && ($(t), e.pending !== 0))
        return e.last_flush = -1, U;
      R(e, t.adler & 255), R(e, t.adler >> 8 & 255), t.adler = 0;
    }
    if (e.status = mt, $(t), e.pending !== 0)
      return e.last_flush = -1, U;
  }
  if (t.avail_in !== 0 || e.lookahead !== 0 || n !== lt && e.status !== Wt) {
    let i = e.level === 0 ? Ir(e, n) : e.strategy === kn ? I1(e, n) : e.strategy === u1 ? O1(e, n) : Xt[e.level].func(e, n);
    if ((i === _t || i === Ht) && (e.status = Wt), i === N || i === _t)
      return t.avail_out === 0 && (e.last_flush = -1), U;
    if (i === Gt && (n === s1 ? i1(e) : n !== pi && (qe(e, 0, 0, !1), n === r1 && (it(e.head), e.lookahead === 0 && (e.strstart = 0, e.block_start = 0, e.insert = 0))), $(t), t.avail_out === 0))
      return e.last_flush = -1, U;
  }
  return n !== j ? U : e.wrap <= 0 ? di : (e.wrap === 2 ? (R(e, t.adler & 255), R(e, t.adler >> 8 & 255), R(e, t.adler >> 16 & 255), R(e, t.adler >> 24 & 255), R(e, t.total_in & 255), R(e, t.total_in >> 8 & 255), R(e, t.total_in >> 16 & 255), R(e, t.total_in >> 24 & 255)) : (Zt(e, t.adler >>> 16), Zt(e, t.adler & 65535)), $(t), e.wrap > 0 && (e.wrap = -e.wrap), e.pending !== 0 ? U : di);
}, M1 = (t) => {
  if (yn(t))
    return J;
  const n = t.state.status;
  return t.state = null, n === mt ? yt(t, a1) : U;
}, L1 = (t, n) => {
  let e = n.length;
  if (yn(t))
    return J;
  const o = t.state, i = o.wrap;
  if (i === 2 || i === 1 && o.status !== Pt || o.lookahead)
    return J;
  if (i === 1 && (t.adler = un(t.adler, n, e, 0)), o.wrap = 0, e >= o.w_size) {
    i === 0 && (it(o.head), o.strstart = 0, o.block_start = 0, o.insert = 0);
    let c = new Uint8Array(o.w_size);
    c.set(n.subarray(e - o.w_size, e), 0), n = c, e = o.w_size;
  }
  const s = t.avail_in, r = t.next_in, a = t.input;
  for (t.avail_in = e, t.next_in = 0, t.input = n, Ut(o); o.lookahead >= T; ) {
    let c = o.strstart, f = o.lookahead - (T - 1);
    do
      o.ins_h = ht(o, o.ins_h, o.window[c + T - 1]), o.prev[c & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = c, c++;
    while (--f);
    o.strstart = c, o.lookahead = T - 1, Ut(o);
  }
  return o.strstart += o.lookahead, o.block_start = o.strstart, o.insert = o.lookahead, o.lookahead = 0, o.match_length = o.prev_length = T - 1, o.match_available = 0, t.next_in = r, t.input = a, t.avail_in = s, o.wrap = i, U;
};
var z1 = T1, V1 = Br, F1 = Er, P1 = Dr, U1 = B1, N1 = R1, G1 = M1, H1 = L1, $1 = "pako deflate (from Nodeca project)", tn = {
  deflateInit: z1,
  deflateInit2: V1,
  deflateReset: F1,
  deflateResetKeep: P1,
  deflateSetHeader: U1,
  deflate: N1,
  deflateEnd: G1,
  deflateSetDictionary: H1,
  deflateInfo: $1
};
const Z1 = (t, n) => Object.prototype.hasOwnProperty.call(t, n);
var j1 = function(t) {
  const n = Array.prototype.slice.call(arguments, 1);
  for (; n.length; ) {
    const e = n.shift();
    if (e) {
      if (typeof e != "object")
        throw new TypeError(e + "must be non-object");
      for (const o in e)
        Z1(e, o) && (t[o] = e[o]);
    }
  }
  return t;
}, Y1 = (t) => {
  let n = 0;
  for (let o = 0, i = t.length; o < i; o++)
    n += t[o].length;
  const e = new Uint8Array(n);
  for (let o = 0, i = 0, s = t.length; o < s; o++) {
    let r = t[o];
    e.set(r, i), i += r.length;
  }
  return e;
}, oe = {
  assign: j1,
  flattenChunks: Y1
};
let Tr = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Tr = !1;
}
const ln = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  ln[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
ln[254] = ln[254] = 1;
var q1 = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let n, e, o, i, s, r = t.length, a = 0;
  for (i = 0; i < r; i++)
    e = t.charCodeAt(i), (e & 64512) === 55296 && i + 1 < r && (o = t.charCodeAt(i + 1), (o & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (o - 56320), i++)), a += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (n = new Uint8Array(a), s = 0, i = 0; s < a; i++)
    e = t.charCodeAt(i), (e & 64512) === 55296 && i + 1 < r && (o = t.charCodeAt(i + 1), (o & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (o - 56320), i++)), e < 128 ? n[s++] = e : e < 2048 ? (n[s++] = 192 | e >>> 6, n[s++] = 128 | e & 63) : e < 65536 ? (n[s++] = 224 | e >>> 12, n[s++] = 128 | e >>> 6 & 63, n[s++] = 128 | e & 63) : (n[s++] = 240 | e >>> 18, n[s++] = 128 | e >>> 12 & 63, n[s++] = 128 | e >>> 6 & 63, n[s++] = 128 | e & 63);
  return n;
};
const W1 = (t, n) => {
  if (n < 65534 && t.subarray && Tr)
    return String.fromCharCode.apply(null, t.length === n ? t : t.subarray(0, n));
  let e = "";
  for (let o = 0; o < n; o++)
    e += String.fromCharCode(t[o]);
  return e;
};
var X1 = (t, n) => {
  const e = n || t.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(t.subarray(0, n));
  let o, i;
  const s = new Array(e * 2);
  for (i = 0, o = 0; o < e; ) {
    let r = t[o++];
    if (r < 128) {
      s[i++] = r;
      continue;
    }
    let a = ln[r];
    if (a > 4) {
      s[i++] = 65533, o += a - 1;
      continue;
    }
    for (r &= a === 2 ? 31 : a === 3 ? 15 : 7; a > 1 && o < e; )
      r = r << 6 | t[o++] & 63, a--;
    if (a > 1) {
      s[i++] = 65533;
      continue;
    }
    r < 65536 ? s[i++] = r : (r -= 65536, s[i++] = 55296 | r >> 10 & 1023, s[i++] = 56320 | r & 1023);
  }
  return W1(s, i);
}, K1 = (t, n) => {
  n = n || t.length, n > t.length && (n = t.length);
  let e = n - 1;
  for (; e >= 0 && (t[e] & 192) === 128; )
    e--;
  return e < 0 || e === 0 ? n : e + ln[t[e]] > n ? e : n;
}, hn = {
  string2buf: q1,
  buf2string: X1,
  utf8border: K1
};
function J1() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var Rr = J1;
const Mr = Object.prototype.toString, {
  Z_NO_FLUSH: Q1,
  Z_SYNC_FLUSH: tg,
  Z_FULL_FLUSH: ng,
  Z_FINISH: eg,
  Z_OK: $n,
  Z_STREAM_END: og,
  Z_DEFAULT_COMPRESSION: ig,
  Z_DEFAULT_STRATEGY: sg,
  Z_DEFLATED: rg
} = ne;
function ie(t) {
  this.options = oe.assign({
    level: ig,
    method: rg,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: sg
  }, t || {});
  let n = this.options;
  n.raw && n.windowBits > 0 ? n.windowBits = -n.windowBits : n.gzip && n.windowBits > 0 && n.windowBits < 16 && (n.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Rr(), this.strm.avail_out = 0;
  let e = tn.deflateInit2(
    this.strm,
    n.level,
    n.method,
    n.windowBits,
    n.memLevel,
    n.strategy
  );
  if (e !== $n)
    throw new Error(wt[e]);
  if (n.header && tn.deflateSetHeader(this.strm, n.header), n.dictionary) {
    let o;
    if (typeof n.dictionary == "string" ? o = hn.string2buf(n.dictionary) : Mr.call(n.dictionary) === "[object ArrayBuffer]" ? o = new Uint8Array(n.dictionary) : o = n.dictionary, e = tn.deflateSetDictionary(this.strm, o), e !== $n)
      throw new Error(wt[e]);
    this._dict_set = !0;
  }
}
ie.prototype.push = function(t, n) {
  const e = this.strm, o = this.options.chunkSize;
  let i, s;
  if (this.ended)
    return !1;
  for (n === ~~n ? s = n : s = n === !0 ? eg : Q1, typeof t == "string" ? e.input = hn.string2buf(t) : Mr.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    if (e.avail_out === 0 && (e.output = new Uint8Array(o), e.next_out = 0, e.avail_out = o), (s === tg || s === ng) && e.avail_out <= 6) {
      this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      continue;
    }
    if (i = tn.deflate(e, s), i === og)
      return e.next_out > 0 && this.onData(e.output.subarray(0, e.next_out)), i = tn.deflateEnd(this.strm), this.onEnd(i), this.ended = !0, i === $n;
    if (e.avail_out === 0) {
      this.onData(e.output);
      continue;
    }
    if (s > 0 && e.next_out > 0) {
      this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      continue;
    }
    if (e.avail_in === 0) break;
  }
  return !0;
};
ie.prototype.onData = function(t) {
  this.chunks.push(t);
};
ie.prototype.onEnd = function(t) {
  t === $n && (this.result = oe.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function ag(t, n) {
  const e = new ie(n);
  if (e.push(t, !0), e.err)
    throw e.msg || wt[e.err];
  return e.result;
}
var cg = ag, fg = {
  deflate: cg
};
const Cn = 16209, ug = 16191;
var lg = function(n, e) {
  let o, i, s, r, a, c, f, u, l, g, p, h, d, x, m, y, _, w, v, b, A, D, C, k;
  const O = n.state;
  o = n.next_in, C = n.input, i = o + (n.avail_in - 5), s = n.next_out, k = n.output, r = s - (e - n.avail_out), a = s + (n.avail_out - 257), c = O.dmax, f = O.wsize, u = O.whave, l = O.wnext, g = O.window, p = O.hold, h = O.bits, d = O.lencode, x = O.distcode, m = (1 << O.lenbits) - 1, y = (1 << O.distbits) - 1;
  t:
    do {
      h < 15 && (p += C[o++] << h, h += 8, p += C[o++] << h, h += 8), _ = d[p & m];
      n:
        for (; ; ) {
          if (w = _ >>> 24, p >>>= w, h -= w, w = _ >>> 16 & 255, w === 0)
            k[s++] = _ & 65535;
          else if (w & 16) {
            v = _ & 65535, w &= 15, w && (h < w && (p += C[o++] << h, h += 8), v += p & (1 << w) - 1, p >>>= w, h -= w), h < 15 && (p += C[o++] << h, h += 8, p += C[o++] << h, h += 8), _ = x[p & y];
            e:
              for (; ; ) {
                if (w = _ >>> 24, p >>>= w, h -= w, w = _ >>> 16 & 255, w & 16) {
                  if (b = _ & 65535, w &= 15, h < w && (p += C[o++] << h, h += 8, h < w && (p += C[o++] << h, h += 8)), b += p & (1 << w) - 1, b > c) {
                    n.msg = "invalid distance too far back", O.mode = Cn;
                    break t;
                  }
                  if (p >>>= w, h -= w, w = s - r, b > w) {
                    if (w = b - w, w > u && O.sane) {
                      n.msg = "invalid distance too far back", O.mode = Cn;
                      break t;
                    }
                    if (A = 0, D = g, l === 0) {
                      if (A += f - w, w < v) {
                        v -= w;
                        do
                          k[s++] = g[A++];
                        while (--w);
                        A = s - b, D = k;
                      }
                    } else if (l < w) {
                      if (A += f + l - w, w -= l, w < v) {
                        v -= w;
                        do
                          k[s++] = g[A++];
                        while (--w);
                        if (A = 0, l < v) {
                          w = l, v -= w;
                          do
                            k[s++] = g[A++];
                          while (--w);
                          A = s - b, D = k;
                        }
                      }
                    } else if (A += l - w, w < v) {
                      v -= w;
                      do
                        k[s++] = g[A++];
                      while (--w);
                      A = s - b, D = k;
                    }
                    for (; v > 2; )
                      k[s++] = D[A++], k[s++] = D[A++], k[s++] = D[A++], v -= 3;
                    v && (k[s++] = D[A++], v > 1 && (k[s++] = D[A++]));
                  } else {
                    A = s - b;
                    do
                      k[s++] = k[A++], k[s++] = k[A++], k[s++] = k[A++], v -= 3;
                    while (v > 2);
                    v && (k[s++] = k[A++], v > 1 && (k[s++] = k[A++]));
                  }
                } else if ((w & 64) === 0) {
                  _ = x[(_ & 65535) + (p & (1 << w) - 1)];
                  continue e;
                } else {
                  n.msg = "invalid distance code", O.mode = Cn;
                  break t;
                }
                break;
              }
          } else if ((w & 64) === 0) {
            _ = d[(_ & 65535) + (p & (1 << w) - 1)];
            continue n;
          } else if (w & 32) {
            O.mode = ug;
            break t;
          } else {
            n.msg = "invalid literal/length code", O.mode = Cn;
            break t;
          }
          break;
        }
    } while (o < i && s < a);
  v = h >> 3, o -= v, h -= v << 3, p &= (1 << h) - 1, n.next_in = o, n.next_out = s, n.avail_in = o < i ? 5 + (i - o) : 5 - (o - i), n.avail_out = s < a ? 257 + (a - s) : 257 - (s - a), O.hold = p, O.bits = h;
};
const kt = 15, yi = 852, xi = 592, wi = 0, Ae = 1, _i = 2, hg = new Uint16Array([
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]), gg = new Uint8Array([
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]), pg = new Uint16Array([
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]), dg = new Uint8Array([
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]), mg = (t, n, e, o, i, s, r, a) => {
  const c = a.bits;
  let f = 0, u = 0, l = 0, g = 0, p = 0, h = 0, d = 0, x = 0, m = 0, y = 0, _, w, v, b, A, D = null, C;
  const k = new Uint16Array(kt + 1), O = new Uint16Array(kt + 1);
  let I = null, B, F, q;
  for (f = 0; f <= kt; f++)
    k[f] = 0;
  for (u = 0; u < o; u++)
    k[n[e + u]]++;
  for (p = c, g = kt; g >= 1 && k[g] === 0; g--)
    ;
  if (p > g && (p = g), g === 0)
    return i[s++] = 1 << 24 | 64 << 16 | 0, i[s++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (l = 1; l < g && k[l] === 0; l++)
    ;
  for (p < l && (p = l), x = 1, f = 1; f <= kt; f++)
    if (x <<= 1, x -= k[f], x < 0)
      return -1;
  if (x > 0 && (t === wi || g !== 1))
    return -1;
  for (O[1] = 0, f = 1; f < kt; f++)
    O[f + 1] = O[f] + k[f];
  for (u = 0; u < o; u++)
    n[e + u] !== 0 && (r[O[n[e + u]]++] = u);
  if (t === wi ? (D = I = r, C = 20) : t === Ae ? (D = hg, I = gg, C = 257) : (D = pg, I = dg, C = 0), y = 0, u = 0, f = l, A = s, h = p, d = 0, v = -1, m = 1 << p, b = m - 1, t === Ae && m > yi || t === _i && m > xi)
    return 1;
  for (; ; ) {
    B = f - d, r[u] + 1 < C ? (F = 0, q = r[u]) : r[u] >= C ? (F = I[r[u] - C], q = D[r[u] - C]) : (F = 96, q = 0), _ = 1 << f - d, w = 1 << h, l = w;
    do
      w -= _, i[A + (y >> d) + w] = B << 24 | F << 16 | q | 0;
    while (w !== 0);
    for (_ = 1 << f - 1; y & _; )
      _ >>= 1;
    if (_ !== 0 ? (y &= _ - 1, y += _) : y = 0, u++, --k[f] === 0) {
      if (f === g)
        break;
      f = n[e + r[u]];
    }
    if (f > p && (y & b) !== v) {
      for (d === 0 && (d = p), A += l, h = f - d, x = 1 << h; h + d < g && (x -= k[h + d], !(x <= 0)); )
        h++, x <<= 1;
      if (m += 1 << h, t === Ae && m > yi || t === _i && m > xi)
        return 1;
      v = y & b, i[v] = p << 24 | h << 16 | A - s | 0;
    }
  }
  return y !== 0 && (i[A + y] = f - d << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var nn = mg;
const yg = 0, Lr = 1, zr = 2, {
  Z_FINISH: Si,
  Z_BLOCK: xg,
  Z_TREES: On,
  Z_OK: St,
  Z_STREAM_END: wg,
  Z_NEED_DICT: _g,
  Z_STREAM_ERROR: Y,
  Z_DATA_ERROR: Vr,
  Z_MEM_ERROR: Fr,
  Z_BUF_ERROR: Sg,
  Z_DEFLATED: vi
} = ne, se = 16180, Ai = 16181, bi = 16182, ki = 16183, Ci = 16184, Oi = 16185, Ii = 16186, Di = 16187, Ei = 16188, Bi = 16189, Zn = 16190, tt = 16191, be = 16192, Ti = 16193, ke = 16194, Ri = 16195, Mi = 16196, Li = 16197, zi = 16198, In = 16199, Dn = 16200, Vi = 16201, Fi = 16202, Pi = 16203, Ui = 16204, Ni = 16205, Ce = 16206, Gi = 16207, Hi = 16208, V = 16209, Pr = 16210, Ur = 16211, vg = 852, Ag = 592, bg = 15, kg = bg, $i = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function Cg() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const At = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.mode < se || n.mode > Ur ? 1 : 0;
}, Nr = (t) => {
  if (At(t))
    return Y;
  const n = t.state;
  return t.total_in = t.total_out = n.total = 0, t.msg = "", n.wrap && (t.adler = n.wrap & 1), n.mode = se, n.last = 0, n.havedict = 0, n.flags = -1, n.dmax = 32768, n.head = null, n.hold = 0, n.bits = 0, n.lencode = n.lendyn = new Int32Array(vg), n.distcode = n.distdyn = new Int32Array(Ag), n.sane = 1, n.back = -1, St;
}, Gr = (t) => {
  if (At(t))
    return Y;
  const n = t.state;
  return n.wsize = 0, n.whave = 0, n.wnext = 0, Nr(t);
}, Hr = (t, n) => {
  let e;
  if (At(t))
    return Y;
  const o = t.state;
  return n < 0 ? (e = 0, n = -n) : (e = (n >> 4) + 5, n < 48 && (n &= 15)), n && (n < 8 || n > 15) ? Y : (o.window !== null && o.wbits !== n && (o.window = null), o.wrap = e, o.wbits = n, Gr(t));
}, $r = (t, n) => {
  if (!t)
    return Y;
  const e = new Cg();
  t.state = e, e.strm = t, e.window = null, e.mode = se;
  const o = Hr(t, n);
  return o !== St && (t.state = null), o;
}, Og = (t) => $r(t, kg);
let Zi = !0, Oe, Ie;
const Ig = (t) => {
  if (Zi) {
    Oe = new Int32Array(512), Ie = new Int32Array(32);
    let n = 0;
    for (; n < 144; )
      t.lens[n++] = 8;
    for (; n < 256; )
      t.lens[n++] = 9;
    for (; n < 280; )
      t.lens[n++] = 7;
    for (; n < 288; )
      t.lens[n++] = 8;
    for (nn(Lr, t.lens, 0, 288, Oe, 0, t.work, { bits: 9 }), n = 0; n < 32; )
      t.lens[n++] = 5;
    nn(zr, t.lens, 0, 32, Ie, 0, t.work, { bits: 5 }), Zi = !1;
  }
  t.lencode = Oe, t.lenbits = 9, t.distcode = Ie, t.distbits = 5;
}, Zr = (t, n, e, o) => {
  let i;
  const s = t.state;
  return s.window === null && (s.wsize = 1 << s.wbits, s.wnext = 0, s.whave = 0, s.window = new Uint8Array(s.wsize)), o >= s.wsize ? (s.window.set(n.subarray(e - s.wsize, e), 0), s.wnext = 0, s.whave = s.wsize) : (i = s.wsize - s.wnext, i > o && (i = o), s.window.set(n.subarray(e - o, e - o + i), s.wnext), o -= i, o ? (s.window.set(n.subarray(e - o, e), 0), s.wnext = o, s.whave = s.wsize) : (s.wnext += i, s.wnext === s.wsize && (s.wnext = 0), s.whave < s.wsize && (s.whave += i))), 0;
}, Dg = (t, n) => {
  let e, o, i, s, r, a, c, f, u, l, g, p, h, d, x = 0, m, y, _, w, v, b, A, D;
  const C = new Uint8Array(4);
  let k, O;
  const I = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (At(t) || !t.output || !t.input && t.avail_in !== 0)
    return Y;
  e = t.state, e.mode === tt && (e.mode = be), r = t.next_out, i = t.output, c = t.avail_out, s = t.next_in, o = t.input, a = t.avail_in, f = e.hold, u = e.bits, l = a, g = c, D = St;
  t:
    for (; ; )
      switch (e.mode) {
        case se:
          if (e.wrap === 0) {
            e.mode = be;
            break;
          }
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          if (e.wrap & 2 && f === 35615) {
            e.wbits === 0 && (e.wbits = 15), e.check = 0, C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = P(e.check, C, 2, 0), f = 0, u = 0, e.mode = Ai;
            break;
          }
          if (e.head && (e.head.done = !1), !(e.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", e.mode = V;
            break;
          }
          if ((f & 15) !== vi) {
            t.msg = "unknown compression method", e.mode = V;
            break;
          }
          if (f >>>= 4, u -= 4, A = (f & 15) + 8, e.wbits === 0 && (e.wbits = A), A > 15 || A > e.wbits) {
            t.msg = "invalid window size", e.mode = V;
            break;
          }
          e.dmax = 1 << e.wbits, e.flags = 0, t.adler = e.check = 1, e.mode = f & 512 ? Bi : tt, f = 0, u = 0;
          break;
        case Ai:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          if (e.flags = f, (e.flags & 255) !== vi) {
            t.msg = "unknown compression method", e.mode = V;
            break;
          }
          if (e.flags & 57344) {
            t.msg = "unknown header flags set", e.mode = V;
            break;
          }
          e.head && (e.head.text = f >> 8 & 1), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = P(e.check, C, 2, 0)), f = 0, u = 0, e.mode = bi;
        /* falls through */
        case bi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          e.head && (e.head.time = f), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, C[2] = f >>> 16 & 255, C[3] = f >>> 24 & 255, e.check = P(e.check, C, 4, 0)), f = 0, u = 0, e.mode = ki;
        /* falls through */
        case ki:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          e.head && (e.head.xflags = f & 255, e.head.os = f >> 8), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = P(e.check, C, 2, 0)), f = 0, u = 0, e.mode = Ci;
        /* falls through */
        case Ci:
          if (e.flags & 1024) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            e.length = f, e.head && (e.head.extra_len = f), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = P(e.check, C, 2, 0)), f = 0, u = 0;
          } else e.head && (e.head.extra = null);
          e.mode = Oi;
        /* falls through */
        case Oi:
          if (e.flags & 1024 && (p = e.length, p > a && (p = a), p && (e.head && (A = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(
            o.subarray(
              s,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              s + p
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            A
          )), e.flags & 512 && e.wrap & 4 && (e.check = P(e.check, o, p, s)), a -= p, s += p, e.length -= p), e.length))
            break t;
          e.length = 0, e.mode = Ii;
        /* falls through */
        case Ii:
          if (e.flags & 2048) {
            if (a === 0)
              break t;
            p = 0;
            do
              A = o[s + p++], e.head && A && e.length < 65536 && (e.head.name += String.fromCharCode(A));
            while (A && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = P(e.check, o, p, s)), a -= p, s += p, A)
              break t;
          } else e.head && (e.head.name = null);
          e.length = 0, e.mode = Di;
        /* falls through */
        case Di:
          if (e.flags & 4096) {
            if (a === 0)
              break t;
            p = 0;
            do
              A = o[s + p++], e.head && A && e.length < 65536 && (e.head.comment += String.fromCharCode(A));
            while (A && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = P(e.check, o, p, s)), a -= p, s += p, A)
              break t;
          } else e.head && (e.head.comment = null);
          e.mode = Ei;
        /* falls through */
        case Ei:
          if (e.flags & 512) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            if (e.wrap & 4 && f !== (e.check & 65535)) {
              t.msg = "header crc mismatch", e.mode = V;
              break;
            }
            f = 0, u = 0;
          }
          e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), t.adler = e.check = 0, e.mode = tt;
          break;
        case Bi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          t.adler = e.check = $i(f), f = 0, u = 0, e.mode = Zn;
        /* falls through */
        case Zn:
          if (e.havedict === 0)
            return t.next_out = r, t.avail_out = c, t.next_in = s, t.avail_in = a, e.hold = f, e.bits = u, _g;
          t.adler = e.check = 1, e.mode = tt;
        /* falls through */
        case tt:
          if (n === xg || n === On)
            break t;
        /* falls through */
        case be:
          if (e.last) {
            f >>>= u & 7, u -= u & 7, e.mode = Ce;
            break;
          }
          for (; u < 3; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          switch (e.last = f & 1, f >>>= 1, u -= 1, f & 3) {
            case 0:
              e.mode = Ti;
              break;
            case 1:
              if (Ig(e), e.mode = In, n === On) {
                f >>>= 2, u -= 2;
                break t;
              }
              break;
            case 2:
              e.mode = Mi;
              break;
            case 3:
              t.msg = "invalid block type", e.mode = V;
          }
          f >>>= 2, u -= 2;
          break;
        case Ti:
          for (f >>>= u & 7, u -= u & 7; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", e.mode = V;
            break;
          }
          if (e.length = f & 65535, f = 0, u = 0, e.mode = ke, n === On)
            break t;
        /* falls through */
        case ke:
          e.mode = Ri;
        /* falls through */
        case Ri:
          if (p = e.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            i.set(o.subarray(s, s + p), r), a -= p, s += p, c -= p, r += p, e.length -= p;
            break;
          }
          e.mode = tt;
          break;
        case Mi:
          for (; u < 14; ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          if (e.nlen = (f & 31) + 257, f >>>= 5, u -= 5, e.ndist = (f & 31) + 1, f >>>= 5, u -= 5, e.ncode = (f & 15) + 4, f >>>= 4, u -= 4, e.nlen > 286 || e.ndist > 30) {
            t.msg = "too many length or distance symbols", e.mode = V;
            break;
          }
          e.have = 0, e.mode = Li;
        /* falls through */
        case Li:
          for (; e.have < e.ncode; ) {
            for (; u < 3; ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            e.lens[I[e.have++]] = f & 7, f >>>= 3, u -= 3;
          }
          for (; e.have < 19; )
            e.lens[I[e.have++]] = 0;
          if (e.lencode = e.lendyn, e.lenbits = 7, k = { bits: e.lenbits }, D = nn(yg, e.lens, 0, 19, e.lencode, 0, e.work, k), e.lenbits = k.bits, D) {
            t.msg = "invalid code lengths set", e.mode = V;
            break;
          }
          e.have = 0, e.mode = zi;
        /* falls through */
        case zi:
          for (; e.have < e.nlen + e.ndist; ) {
            for (; x = e.lencode[f & (1 << e.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            if (_ < 16)
              f >>>= m, u -= m, e.lens[e.have++] = _;
            else {
              if (_ === 16) {
                for (O = m + 2; u < O; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[s++] << u, u += 8;
                }
                if (f >>>= m, u -= m, e.have === 0) {
                  t.msg = "invalid bit length repeat", e.mode = V;
                  break;
                }
                A = e.lens[e.have - 1], p = 3 + (f & 3), f >>>= 2, u -= 2;
              } else if (_ === 17) {
                for (O = m + 3; u < O; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[s++] << u, u += 8;
                }
                f >>>= m, u -= m, A = 0, p = 3 + (f & 7), f >>>= 3, u -= 3;
              } else {
                for (O = m + 7; u < O; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[s++] << u, u += 8;
                }
                f >>>= m, u -= m, A = 0, p = 11 + (f & 127), f >>>= 7, u -= 7;
              }
              if (e.have + p > e.nlen + e.ndist) {
                t.msg = "invalid bit length repeat", e.mode = V;
                break;
              }
              for (; p--; )
                e.lens[e.have++] = A;
            }
          }
          if (e.mode === V)
            break;
          if (e.lens[256] === 0) {
            t.msg = "invalid code -- missing end-of-block", e.mode = V;
            break;
          }
          if (e.lenbits = 9, k = { bits: e.lenbits }, D = nn(Lr, e.lens, 0, e.nlen, e.lencode, 0, e.work, k), e.lenbits = k.bits, D) {
            t.msg = "invalid literal/lengths set", e.mode = V;
            break;
          }
          if (e.distbits = 6, e.distcode = e.distdyn, k = { bits: e.distbits }, D = nn(zr, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, k), e.distbits = k.bits, D) {
            t.msg = "invalid distances set", e.mode = V;
            break;
          }
          if (e.mode = In, n === On)
            break t;
        /* falls through */
        case In:
          e.mode = Dn;
        /* falls through */
        case Dn:
          if (a >= 6 && c >= 258) {
            t.next_out = r, t.avail_out = c, t.next_in = s, t.avail_in = a, e.hold = f, e.bits = u, lg(t, g), r = t.next_out, i = t.output, c = t.avail_out, s = t.next_in, o = t.input, a = t.avail_in, f = e.hold, u = e.bits, e.mode === tt && (e.back = -1);
            break;
          }
          for (e.back = 0; x = e.lencode[f & (1 << e.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          if (y && (y & 240) === 0) {
            for (w = m, v = y, b = _; x = e.lencode[b + ((f & (1 << w + v) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            f >>>= w, u -= w, e.back += w;
          }
          if (f >>>= m, u -= m, e.back += m, e.length = _, y === 0) {
            e.mode = Ni;
            break;
          }
          if (y & 32) {
            e.back = -1, e.mode = tt;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", e.mode = V;
            break;
          }
          e.extra = y & 15, e.mode = Vi;
        /* falls through */
        case Vi:
          if (e.extra) {
            for (O = e.extra; u < O; ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            e.length += f & (1 << e.extra) - 1, f >>>= e.extra, u -= e.extra, e.back += e.extra;
          }
          e.was = e.length, e.mode = Fi;
        /* falls through */
        case Fi:
          for (; x = e.distcode[f & (1 << e.distbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[s++] << u, u += 8;
          }
          if ((y & 240) === 0) {
            for (w = m, v = y, b = _; x = e.distcode[b + ((f & (1 << w + v) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            f >>>= w, u -= w, e.back += w;
          }
          if (f >>>= m, u -= m, e.back += m, y & 64) {
            t.msg = "invalid distance code", e.mode = V;
            break;
          }
          e.offset = _, e.extra = y & 15, e.mode = Pi;
        /* falls through */
        case Pi:
          if (e.extra) {
            for (O = e.extra; u < O; ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            e.offset += f & (1 << e.extra) - 1, f >>>= e.extra, u -= e.extra, e.back += e.extra;
          }
          if (e.offset > e.dmax) {
            t.msg = "invalid distance too far back", e.mode = V;
            break;
          }
          e.mode = Ui;
        /* falls through */
        case Ui:
          if (c === 0)
            break t;
          if (p = g - c, e.offset > p) {
            if (p = e.offset - p, p > e.whave && e.sane) {
              t.msg = "invalid distance too far back", e.mode = V;
              break;
            }
            p > e.wnext ? (p -= e.wnext, h = e.wsize - p) : h = e.wnext - p, p > e.length && (p = e.length), d = e.window;
          } else
            d = i, h = r - e.offset, p = e.length;
          p > c && (p = c), c -= p, e.length -= p;
          do
            i[r++] = d[h++];
          while (--p);
          e.length === 0 && (e.mode = Dn);
          break;
        case Ni:
          if (c === 0)
            break t;
          i[r++] = e.length, c--, e.mode = Dn;
          break;
        case Ce:
          if (e.wrap) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f |= o[s++] << u, u += 8;
            }
            if (g -= c, t.total_out += g, e.total += g, e.wrap & 4 && g && (t.adler = e.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            e.flags ? P(e.check, i, g, r - g) : un(e.check, i, g, r - g)), g = c, e.wrap & 4 && (e.flags ? f : $i(f)) !== e.check) {
              t.msg = "incorrect data check", e.mode = V;
              break;
            }
            f = 0, u = 0;
          }
          e.mode = Gi;
        /* falls through */
        case Gi:
          if (e.wrap && e.flags) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f += o[s++] << u, u += 8;
            }
            if (e.wrap & 4 && f !== (e.total & 4294967295)) {
              t.msg = "incorrect length check", e.mode = V;
              break;
            }
            f = 0, u = 0;
          }
          e.mode = Hi;
        /* falls through */
        case Hi:
          D = wg;
          break t;
        case V:
          D = Vr;
          break t;
        case Pr:
          return Fr;
        case Ur:
        /* falls through */
        default:
          return Y;
      }
  return t.next_out = r, t.avail_out = c, t.next_in = s, t.avail_in = a, e.hold = f, e.bits = u, (e.wsize || g !== t.avail_out && e.mode < V && (e.mode < Ce || n !== Si)) && Zr(t, t.output, t.next_out, g - t.avail_out), l -= t.avail_in, g -= t.avail_out, t.total_in += l, t.total_out += g, e.total += g, e.wrap & 4 && g && (t.adler = e.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  e.flags ? P(e.check, i, g, t.next_out - g) : un(e.check, i, g, t.next_out - g)), t.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === tt ? 128 : 0) + (e.mode === In || e.mode === ke ? 256 : 0), (l === 0 && g === 0 || n === Si) && D === St && (D = Sg), D;
}, Eg = (t) => {
  if (At(t))
    return Y;
  let n = t.state;
  return n.window && (n.window = null), t.state = null, St;
}, Bg = (t, n) => {
  if (At(t))
    return Y;
  const e = t.state;
  return (e.wrap & 2) === 0 ? Y : (e.head = n, n.done = !1, St);
}, Tg = (t, n) => {
  const e = n.length;
  let o, i, s;
  return At(t) || (o = t.state, o.wrap !== 0 && o.mode !== Zn) ? Y : o.mode === Zn && (i = 1, i = un(i, n, e, 0), i !== o.check) ? Vr : (s = Zr(t, n, e, e), s ? (o.mode = Pr, Fr) : (o.havedict = 1, St));
};
var Rg = Gr, Mg = Hr, Lg = Nr, zg = Og, Vg = $r, Fg = Dg, Pg = Eg, Ug = Bg, Ng = Tg, Gg = "pako inflate (from Nodeca project)", et = {
  inflateReset: Rg,
  inflateReset2: Mg,
  inflateResetKeep: Lg,
  inflateInit: zg,
  inflateInit2: Vg,
  inflate: Fg,
  inflateEnd: Pg,
  inflateGetHeader: Ug,
  inflateSetDictionary: Ng,
  inflateInfo: Gg
};
function Hg() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var $g = Hg;
const jr = Object.prototype.toString, {
  Z_NO_FLUSH: Zg,
  Z_FINISH: jg,
  Z_OK: gn,
  Z_STREAM_END: De,
  Z_NEED_DICT: Ee,
  Z_STREAM_ERROR: Yg,
  Z_DATA_ERROR: ji,
  Z_MEM_ERROR: qg
} = ne;
function re(t) {
  this.options = oe.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const n = this.options;
  n.raw && n.windowBits >= 0 && n.windowBits < 16 && (n.windowBits = -n.windowBits, n.windowBits === 0 && (n.windowBits = -15)), n.windowBits >= 0 && n.windowBits < 16 && !(t && t.windowBits) && (n.windowBits += 32), n.windowBits > 15 && n.windowBits < 48 && (n.windowBits & 15) === 0 && (n.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Rr(), this.strm.avail_out = 0;
  let e = et.inflateInit2(
    this.strm,
    n.windowBits
  );
  if (e !== gn)
    throw new Error(wt[e]);
  if (this.header = new $g(), et.inflateGetHeader(this.strm, this.header), n.dictionary && (typeof n.dictionary == "string" ? n.dictionary = hn.string2buf(n.dictionary) : jr.call(n.dictionary) === "[object ArrayBuffer]" && (n.dictionary = new Uint8Array(n.dictionary)), n.raw && (e = et.inflateSetDictionary(this.strm, n.dictionary), e !== gn)))
    throw new Error(wt[e]);
}
re.prototype.push = function(t, n) {
  const e = this.strm, o = this.options.chunkSize, i = this.options.dictionary;
  let s, r, a;
  if (this.ended) return !1;
  for (n === ~~n ? r = n : r = n === !0 ? jg : Zg, jr.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(o), e.next_out = 0, e.avail_out = o), s = et.inflate(e, r), s === Ee && i && (s = et.inflateSetDictionary(e, i), s === gn ? s = et.inflate(e, r) : s === ji && (s = Ee)); e.avail_in > 0 && s === De && e.state.wrap > 0 && t[e.next_in] !== 0; )
      et.inflateReset(e), s = et.inflate(e, r);
    switch (s) {
      case Yg:
      case ji:
      case Ee:
      case qg:
        return this.onEnd(s), this.ended = !0, !1;
    }
    if (a = e.avail_out, e.next_out && (e.avail_out === 0 || s === De))
      if (this.options.to === "string") {
        let c = hn.utf8border(e.output, e.next_out), f = e.next_out - c, u = hn.buf2string(e.output, c);
        e.next_out = f, e.avail_out = o - f, f && e.output.set(e.output.subarray(c, c + f), 0), this.onData(u);
      } else
        this.onData(e.output.length === e.next_out ? e.output : e.output.subarray(0, e.next_out));
    if (!(s === gn && a === 0)) {
      if (s === De)
        return s = et.inflateEnd(this.strm), this.onEnd(s), this.ended = !0, !0;
      if (e.avail_in === 0) break;
    }
  }
  return !0;
};
re.prototype.onData = function(t) {
  this.chunks.push(t);
};
re.prototype.onEnd = function(t) {
  t === gn && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = oe.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Wg(t, n) {
  const e = new re(n);
  if (e.push(t), e.err) throw e.msg || wt[e.err];
  return e.result;
}
var Xg = Wg, Kg = {
  inflate: Xg
};
const { deflate: Jg } = fg, { inflate: Qg } = Kg;
var Yi = Jg, qi = Qg;
const Yr = 2001684038, no = 44, eo = 20, jn = 12, Yn = 16;
function tp(t) {
  const n = new DataView(t), e = new Uint8Array(t);
  if (n.getUint32(0) !== Yr)
    throw new Error("Invalid WOFF1 signature");
  const i = n.getUint32(4), s = n.getUint16(12), r = n.getUint32(24), a = n.getUint32(28), c = n.getUint32(36), f = n.getUint32(40), u = [];
  let l = no;
  for (let C = 0; C < s; C++)
    u.push({
      tag: String.fromCharCode(
        n.getUint8(l),
        n.getUint8(l + 1),
        n.getUint8(l + 2),
        n.getUint8(l + 3)
      ),
      offset: n.getUint32(l + 4),
      compLength: n.getUint32(l + 8),
      origLength: n.getUint32(l + 12),
      origChecksum: n.getUint32(l + 16)
    }), l += eo;
  const g = u.map((C) => {
    const k = e.subarray(
      C.offset,
      C.offset + C.compLength
    );
    let O;
    if (C.compLength < C.origLength) {
      if (O = qi(k), O.length !== C.origLength)
        throw new Error(
          `WOFF1 table '${C.tag}': decompressed size ${O.length} !== expected ${C.origLength}`
        );
    } else
      O = k;
    return {
      tag: C.tag,
      checksum: C.origChecksum,
      data: O,
      length: C.origLength,
      paddedLength: C.origLength + (4 - C.origLength % 4) % 4
    };
  }), p = jn + s * Yn;
  let h = p + (4 - p % 4) % 4;
  const { searchRange: d, entrySelector: x, rangeShift: m } = np(s);
  let y = h;
  for (const C of g)
    y += C.paddedLength;
  const _ = new ArrayBuffer(y), w = new DataView(_), v = new Uint8Array(_);
  w.setUint32(0, i), w.setUint16(4, s), w.setUint16(6, d), w.setUint16(8, x), w.setUint16(10, m);
  const b = g.map((C, k) => ({ ...C, originalIndex: k })).sort((C, k) => C.tag < k.tag ? -1 : C.tag > k.tag ? 1 : 0);
  for (let C = 0; C < b.length; C++) {
    const k = b[C], O = jn + C * Yn;
    for (let I = 0; I < 4; I++)
      w.setUint8(O + I, k.tag.charCodeAt(I));
    w.setUint32(O + 4, k.checksum), w.setUint32(O + 8, h), w.setUint32(O + 12, k.length), v.set(k.data, h), h += k.paddedLength;
  }
  let A = null;
  if (r && a) {
    const C = e.subarray(r, r + a);
    A = qi(C);
  }
  let D = null;
  return c && f && (D = e.slice(c, c + f)), { sfnt: _, metadata: A, privateData: D };
}
function oo(t, n = null, e = null) {
  const o = new DataView(t), i = new Uint8Array(t), s = o.getUint32(0), r = o.getUint16(4), a = [];
  for (let b = 0; b < r; b++) {
    const A = jn + b * Yn;
    a.push({
      tag: String.fromCharCode(
        o.getUint8(A),
        o.getUint8(A + 1),
        o.getUint8(A + 2),
        o.getUint8(A + 3)
      ),
      checksum: o.getUint32(A + 4),
      offset: o.getUint32(A + 8),
      length: o.getUint32(A + 12)
    });
  }
  const c = a.map((b) => {
    const A = i.subarray(b.offset, b.offset + b.length), D = Yi(A), C = D.length < b.length;
    return {
      tag: b.tag,
      origChecksum: b.checksum,
      origLength: b.length,
      data: C ? D : A,
      compLength: C ? D.length : b.length
    };
  });
  let f = null, u = 0;
  n && n.length > 0 && (u = n.length, f = Yi(n));
  let g = no + r * eo;
  g += (4 - g % 4) % 4;
  for (const b of c)
    b.woffOffset = g, g += b.compLength, g += (4 - g % 4) % 4;
  let p = 0, h = 0;
  f && (p = g, h = f.length, g += h, g += (4 - g % 4) % 4);
  let d = 0, x = 0;
  e && e.length > 0 && (d = g, x = e.length, g += x);
  const m = g;
  let y = jn + r * Yn;
  for (const b of c)
    y += b.origLength + (4 - b.origLength % 4) % 4;
  const _ = new ArrayBuffer(m), w = new DataView(_), v = new Uint8Array(_);
  w.setUint32(0, Yr), w.setUint32(4, s), w.setUint32(8, m), w.setUint16(12, r), w.setUint16(14, 0), w.setUint32(16, y), w.setUint16(20, 0), w.setUint16(22, 0), w.setUint32(24, p), w.setUint32(28, h), w.setUint32(32, u), w.setUint32(36, d), w.setUint32(40, x);
  for (let b = 0; b < c.length; b++) {
    const A = c[b], D = no + b * eo;
    for (let C = 0; C < 4; C++)
      w.setUint8(D + C, A.tag.charCodeAt(C));
    w.setUint32(D + 4, A.woffOffset), w.setUint32(D + 8, A.compLength), w.setUint32(D + 12, A.origLength), w.setUint32(D + 16, A.origChecksum);
  }
  for (const b of c)
    v.set(b.data, b.woffOffset);
  return f && v.set(f, p), e && e.length > 0 && v.set(e, d), _;
}
function np(t) {
  let n = 1, e = 0;
  for (; n * 2 <= t; )
    n *= 2, e++;
  n *= 16;
  const o = t * 16 - n;
  return { searchRange: n, entrySelector: e, rangeShift: o };
}
const ep = {
  cmap: ff,
  head: Ts,
  hhea: al,
  HVAR: gl,
  hmtx: fl,
  maxp: jl,
  MVAR: Ql,
  name: rh,
  hdmx: el,
  BASE: Ec,
  JSTF: bl,
  MATH: Gl,
  MERG: ql,
  meta: Kl,
  DSIG: Xf,
  LTSH: Pl,
  CBLC: Rt,
  CBDT: ro,
  "OS/2": ch,
  kern: Bl,
  PCLT: lh,
  VDMX: Eh,
  post: gh,
  STAT: vh,
  "CFF ": Fa,
  CFF2: ja,
  VORG: Xa,
  fvar: ru,
  avar: Qa,
  loca: lr,
  glyf: p0,
  gvar: v0,
  GDEF: hu,
  GPOS: Ou,
  GSUB: ju,
  "cvt ": s0,
  cvar: o0,
  fpgm: a0,
  prep: C0,
  gasp: f0,
  vhea: Lh,
  VVAR: Nh,
  vmtx: Vh,
  COLR: $f,
  CPAL: jf,
  EBDT: Qf,
  EBLC: nu,
  EBSC: ou,
  bloc: Yc,
  bdat: Pc,
  sbix: yh,
  ltag: Vl,
  "SVG ": kh
}, Wi = 12, Xi = 16, op = /* @__PURE__ */ new Set(["sfnt", "woff"]);
function ip(t) {
  const n = t._woff?.version;
  return n === 2 ? "woff2" : n === 1 ? "woff" : "sfnt";
}
function Cp(t, n = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  const e = n.format ? n.format.toLowerCase() : ip(t);
  if (e === "woff2")
    throw new Error('WOFF2 export is not yet supported. Use "sfnt" or "woff".');
  if (!op.has(e))
    throw new Error(
      `Unknown export format "${e}". Supported: sfnt, woff.`
    );
  if (rp(t)) {
    if (n.split)
      return sp(t, e);
    const s = ap(t);
    return e === "woff" ? oo(
      s,
      t._woff?.metadata,
      t._woff?.privateData
    ) : s;
  }
  const o = vo(t), i = qn(o, 0);
  if (e === "woff") {
    const s = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return oo(i, s, r);
  }
  return i;
}
function sp(t, n) {
  const { fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return e.map((o) => {
    const i = vo(o), s = qn(i, 0);
    return n === "woff" ? oo(s) : s;
  });
}
function rp(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function vo(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return fa(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function qn(t, n) {
  const { header: e, tables: o } = t, i = Object.keys(o), s = i.length, r = cp(o), a = i.map((h) => {
    const d = o[h];
    let x;
    if (r.has(h))
      x = r.get(h);
    else if (d._raw)
      x = d._raw;
    else {
      const y = ep[h];
      if (!y)
        throw new Error(`No writer registered for parsed table: ${h}`);
      x = y(d);
    }
    const m = new Uint8Array(x);
    return {
      tag: h,
      data: m,
      length: m.length,
      paddedLength: m.length + (4 - m.length % 4) % 4,
      checksum: d._checksum
    };
  }), c = Wi + s * Xi;
  let f = c + (4 - c % 4) % 4;
  for (const h of a)
    h.offset = f, f += h.paddedLength;
  const u = f, l = new ArrayBuffer(u), g = new DataView(l), p = new Uint8Array(l);
  g.setUint32(0, e.sfVersion), g.setUint16(4, s), g.setUint16(6, e.searchRange), g.setUint16(8, e.entrySelector), g.setUint16(10, e.rangeShift);
  for (let h = 0; h < a.length; h++) {
    const d = a[h], x = Wi + h * Xi;
    for (let m = 0; m < 4; m++)
      g.setUint8(x + m, d.tag.charCodeAt(m));
    g.setUint32(x + 4, d.checksum), g.setUint32(x + 8, d.offset + n), g.setUint32(x + 12, d.length);
  }
  for (const h of a)
    p.set(h.data, h.offset);
  return l;
}
function ap(t) {
  const { collection: n, fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const o = e.map((m) => vo(m)), i = n.majorVersion ?? 2, s = n.minorVersion ?? 0, r = o.length, a = i >= 2, c = 12 + r * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const l = o.map(
    (m) => new Uint8Array(qn(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), g = o.map(
    (m, y) => new Uint8Array(qn(m, l[y]))
  ), p = f, h = new ArrayBuffer(p), d = new DataView(h), x = new Uint8Array(h);
  d.setUint8(0, 116), d.setUint8(1, 116), d.setUint8(2, 99), d.setUint8(3, 102), d.setUint16(4, i), d.setUint16(6, s), d.setUint32(8, r);
  for (let m = 0; m < r; m++)
    d.setUint32(12 + m * 4, l[m]);
  if (a) {
    const m = 12 + r * 4;
    d.setUint32(m + 0, n.dsigTag ?? 0), d.setUint32(m + 4, n.dsigLength ?? 0), d.setUint32(m + 8, n.dsigOffset ?? 0);
  }
  for (let m = 0; m < r; m++)
    x.set(g[m], l[m]);
  return h;
}
function cp(t) {
  const n = /* @__PURE__ */ new Map(), e = t.glyf && !t.glyf._raw, o = t.loca && !t.loca._raw;
  if (e && o) {
    const { bytes: u, offsets: l } = ur(t.glyf);
    if (n.set("glyf", u), n.set("loca", lr({ offsets: l })), t.head && !t.head._raw) {
      const p = l.every((h) => h % 2 === 0 && h / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== p && n.set(
        "head",
        Ts({ ...t.head, indexToLocFormat: p })
      );
    }
  }
  const i = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, s = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (i && s) {
    const { bytes: u, offsetInfo: l } = fe(
      t.CBDT,
      t.CBLC
    );
    n.set("CBDT", u), n.set("CBLC", Rt(t.CBLC, l));
  }
  const r = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, a = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (r && a) {
    const { bytes: u, offsetInfo: l } = fe(t.EBDT, t.EBLC);
    n.set("EBDT", u), n.set("EBLC", Rt(t.EBLC, l));
  }
  const c = t.bloc && !t.bloc._raw && t.bloc.sizes, f = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (c && f) {
    const { bytes: u, offsetInfo: l } = fe(t.bdat, t.bloc);
    n.set("bdat", u), n.set("bloc", Rt(t.bloc, l));
  }
  return n;
}
const fp = {
  cmap: qc,
  head: Fe,
  hhea: rl,
  HVAR: ll,
  hmtx: cl,
  maxp: Zl,
  MVAR: Jl,
  name: sh,
  hdmx: nl,
  BASE: bc,
  JSTF: Al,
  MATH: Nl,
  MERG: Yl,
  meta: Xl,
  DSIG: Wf,
  LTSH: Fl,
  CBLC: ao,
  CBDT: so,
  "OS/2": ah,
  kern: Ol,
  PCLT: uh,
  VDMX: Dh,
  post: hh,
  STAT: _h,
  "CFF ": za,
  CFF2: Za,
  VORG: Wa,
  fvar: su,
  avar: Ja,
  loca: b0,
  glyf: u0,
  gvar: _0,
  GDEF: au,
  GPOS: wu,
  GSUB: Pu,
  "cvt ": i0,
  cvar: e0,
  fpgm: r0,
  prep: k0,
  gasp: c0,
  vhea: Mh,
  VVAR: Ph,
  vmtx: zh,
  COLR: Hf,
  CPAL: Zf,
  EBLC: tu,
  EBDT: Jf,
  EBSC: eu,
  bloc: jc,
  bdat: Fc,
  sbix: mh,
  ltag: zl,
  "SVG ": bh
}, up = [
  "head",
  "maxp",
  "fvar",
  "avar",
  "cvt ",
  "hhea",
  "cmap",
  "hmtx",
  "HVAR",
  "name",
  "BASE",
  "JSTF",
  "MATH",
  "STAT",
  "MVAR",
  "OS/2",
  "kern",
  "hdmx",
  "LTSH",
  "MERG",
  "meta",
  "DSIG",
  "PCLT",
  "VDMX",
  "post",
  "CFF ",
  "CFF2",
  "VORG",
  "loca",
  "glyf",
  "gvar",
  "cvar",
  "vhea",
  "vmtx",
  "VVAR",
  "CBLC",
  "CBDT",
  "EBLC",
  "EBDT",
  "EBSC",
  "bloc",
  "bdat",
  "sbix",
  "ltag"
];
function lp(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFont expects an ArrayBuffer");
  const n = new Uint8Array(t);
  if (n.length >= 4) {
    const o = String.fromCharCode(
      n[0],
      n[1],
      n[2],
      n[3]
    );
    if (o === "wOFF") {
      const { sfnt: i, metadata: s, privateData: r } = tp(t), a = lp(i);
      return a._woff = { version: 1 }, s && (a._woff.metadata = s), r && (a._woff.privateData = r), a;
    }
    if (o === "ttcf")
      return gp(t);
  }
  const e = hp(t);
  return Ji(e);
}
function hp(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const n = new E(new Uint8Array(t)), e = qr(n), o = Wr(n, e.numTables), i = Xr(t, o);
  return { header: e, tables: i };
}
function gp(t) {
  const n = new E(new Uint8Array(t)), e = n.tag();
  if (e !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const o = n.uint16(), i = n.uint16(), s = n.uint32(), r = n.array("uint32", s);
  let a, c, f;
  o >= 2 && (a = n.uint32(), c = n.uint32(), f = n.uint32());
  const u = r.map((g) => {
    const p = new E(new Uint8Array(t), g), h = qr(p), d = Wr(p, h.numTables), x = pp(
      t,
      d,
      g
    ), m = Xr(t, x);
    return Ji({ header: h, tables: m });
  }), l = {
    tag: e,
    majorVersion: o,
    minorVersion: i,
    numFonts: s
  };
  return o >= 2 && (l.dsigTag = a, l.dsigLength = c, l.dsigOffset = f), { collection: l, fonts: u };
}
function pp(t, n, e) {
  const o = n.find((g) => g.tag === "head");
  if (!o)
    return n;
  const i = o.offset, s = e + o.offset, r = i + o.length <= t.byteLength, a = s + o.length <= t.byteLength;
  if (!r && a)
    return n.map((g) => ({
      ...g,
      offset: e + g.offset
    }));
  if (r && !a || !r && !a)
    return n;
  const c = Fe(
    Array.from(new Uint8Array(t, i, o.length))
  ), f = Fe(
    Array.from(new Uint8Array(t, s, o.length))
  ), u = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !u ? n.map((g) => ({
    ...g,
    offset: e + g.offset
  })) : n;
}
function qr(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function Wr(t, n) {
  const e = [];
  for (let o = 0; o < n; o++)
    e.push({
      tag: t.tag(),
      checksum: t.uint32(),
      offset: t.offset32(),
      length: t.uint32()
    });
  return e;
}
function Xr(t, n) {
  const e = {}, o = new Map(n.map((a) => [a.tag, a])), i = up.filter((a) => o.has(a)), s = n.map((a) => a.tag).filter((a) => !i.includes(a)), r = [...i, ...s];
  for (const a of r) {
    const c = o.get(a), f = c.offset, u = new Uint8Array(t, f, c.length), l = Array.from(u), g = fp[a];
    g ? e[a] = {
      ...g(l, e),
      _checksum: c.checksum
    } : e[a] = {
      _raw: l,
      _checksum: c.checksum
    };
  }
  if (e.loca && e.glyf && !e.glyf._raw && delete e.loca.offsets, e.CBLC && e.CBDT?.bitmapData)
    for (const a of e.CBLC.sizes)
      for (const c of a.indexSubTables ?? [])
        delete c.imageDataOffset, delete c.sbitOffsets, c.glyphArray && (c.glyphIdArray = c.glyphArray.slice(0, -1).map((f) => f.glyphID), delete c.glyphArray);
  if (e.EBLC && e.EBDT?.bitmapData)
    for (const a of e.EBLC.sizes)
      for (const c of a.indexSubTables ?? [])
        delete c.imageDataOffset, delete c.sbitOffsets, c.glyphArray && (c.glyphIdArray = c.glyphArray.slice(0, -1).map((f) => f.glyphID), delete c.glyphArray);
  if (e.bloc && e.bdat?.bitmapData)
    for (const a of e.bloc.sizes)
      for (const c of a.indexSubTables ?? [])
        delete c.imageDataOffset, delete c.sbitOffsets, c.glyphArray && (c.glyphIdArray = c.glyphArray.slice(0, -1).map((f) => f.glyphID), delete c.glyphArray);
  return e;
}
const dp = [
  "BASE",
  "CBDT",
  "CBLC",
  "COLR",
  "CPAL",
  "DSIG",
  "EBDT",
  "EBLC",
  "EBSC",
  "GDEF",
  "GPOS",
  "GSUB",
  "HVAR",
  "JSTF",
  "LTSH",
  "MATH",
  "MERG",
  "MVAR",
  "OS/2",
  "PCLT",
  "STAT",
  "SVG ",
  "VDMX",
  "VVAR",
  "avar",
  "cmap",
  "fvar",
  "hdmx",
  "head",
  "hhea",
  "hmtx",
  "kern",
  "maxp",
  "meta",
  "name",
  "post",
  "sbix",
  "vhea",
  "vmtx"
], mp = ["CFF ", "CFF2", "VORG"], yp = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], xp = /* @__PURE__ */ new Set([
  ...dp,
  ...mp,
  ...yp
]), wp = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
];
function vt(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function Kr(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function Ct(t) {
  return Number.isInteger(t) && t >= 0 && t <= 65535;
}
function Jr(t) {
  return Array.isArray(t?._raw);
}
function M(t, n, e, o, i) {
  t.push({ severity: n, code: e, message: o, path: i });
}
function Ki(t) {
  const n = t.filter((o) => o.severity === "error"), e = t.filter((o) => o.severity === "warning");
  return {
    valid: n.length === 0,
    errors: n,
    warnings: e,
    issues: t,
    summary: {
      errorCount: n.length,
      warningCount: e.length,
      issueCount: t.length
    }
  };
}
function _p(t, n, e, o) {
  if (!vt(t)) {
    M(
      o,
      "error",
      "HEADER_MISSING",
      "Font header is required and must be an object.",
      e
    );
    return;
  }
  if (Kr(t.sfVersion) || M(
    o,
    "error",
    "HEADER_SFVERSION_INVALID",
    "header.sfVersion must be a uint32 number.",
    `${e}.sfVersion`
  ), t.numTables !== void 0 && (!Number.isInteger(t.numTables) || t.numTables < 0) && M(
    o,
    "error",
    "HEADER_NUMTABLES_INVALID",
    "header.numTables must be a non-negative integer when provided.",
    `${e}.numTables`
  ), Number.isInteger(t.numTables) && t.numTables !== n && M(
    o,
    "warning",
    "HEADER_NUMTABLES_MISMATCH",
    `header.numTables (${t.numTables}) does not match tables count (${n}).`,
    `${e}.numTables`
  ), (t.searchRange !== void 0 || t.entrySelector !== void 0 || t.rangeShift !== void 0) && (Ct(t.searchRange ?? -1) || M(
    o,
    "error",
    "HEADER_SEARCHRANGE_INVALID",
    "header.searchRange must be a uint16 when provided.",
    `${e}.searchRange`
  ), Ct(t.entrySelector ?? -1) || M(
    o,
    "error",
    "HEADER_ENTRYSELECTOR_INVALID",
    "header.entrySelector must be a uint16 when provided.",
    `${e}.entrySelector`
  ), Ct(t.rangeShift ?? -1) || M(
    o,
    "error",
    "HEADER_RANGESHIFT_INVALID",
    "header.rangeShift must be a uint16 when provided.",
    `${e}.rangeShift`
  ), Ct(t.searchRange) && Ct(t.entrySelector) && Ct(t.rangeShift))) {
    const s = n > 0 ? 2 ** Math.floor(Math.log2(n)) : 0, r = s * 16, a = s > 0 ? Math.floor(Math.log2(s)) : 0, c = n * 16 - r;
    (t.searchRange !== r || t.entrySelector !== a || t.rangeShift !== c) && M(
      o,
      "warning",
      "HEADER_DIRECTORY_FIELDS_MISMATCH",
      `Header directory fields differ from expected values for ${n} tables (expected searchRange=${r}, entrySelector=${a}, rangeShift=${c}).`,
      e
    );
  }
}
function Sp(t, n, e) {
  if (!Array.isArray(t)) {
    M(
      e,
      "error",
      "TABLE_RAW_INVALID_TYPE",
      "_raw must be an array of byte values.",
      n
    );
    return;
  }
  for (let o = 0; o < t.length; o++) {
    const i = t[o];
    if (!Number.isInteger(i) || i < 0 || i > 255) {
      M(
        e,
        "error",
        "TABLE_RAW_INVALID_BYTE",
        `_raw[${o}] must be an integer byte (0-255).`,
        `${n}[${o}]`
      );
      break;
    }
  }
}
function vp(t, n, e) {
  if (!vt(t))
    return M(
      e,
      "error",
      "TABLES_MISSING",
      "Font tables are required and must be an object keyed by 4-char table tag.",
      n
    ), [];
  const o = Object.keys(t);
  o.length === 0 && M(
    e,
    "error",
    "TABLES_EMPTY",
    "Font tables object is empty; at least core required tables are needed.",
    n
  );
  for (const i of o) {
    (typeof i != "string" || i.length !== 4) && M(
      e,
      "error",
      "TABLE_TAG_INVALID",
      `Table tag "${i}" must be exactly 4 characters.`,
      `${n}.${i}`
    );
    const s = t[i], r = `${n}.${i}`;
    if (!vt(s)) {
      M(
        e,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${i}" must be an object.`,
        r
      );
      continue;
    }
    s._checksum !== void 0 && !Kr(s._checksum) && M(
      e,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${i}" _checksum must be uint32 when provided.`,
      `${r}._checksum`
    ), s._raw !== void 0 && Sp(s._raw, `${r}._raw`, e);
    const a = xp.has(i);
    !Jr(s) && !a && M(
      e,
      "error",
      "TABLE_WRITER_UNSUPPORTED",
      `Table "${i}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
      r
    );
  }
  return o;
}
function Ap(t, n, e) {
  const o = (r) => t[r] !== void 0, i = (r) => o(r) && !Jr(t[r]), s = (r, a, c = "requires") => {
    if (i(r))
      for (const f of a)
        o(f) || M(
          e,
          "error",
          "TABLE_DEPENDENCY_MISSING",
          `Parsed table "${r}" ${c} table "${f}".`,
          `${n}.${r}`
        );
  };
  s("hmtx", ["hhea", "maxp"]), s("loca", ["head", "maxp"]), s("glyf", ["loca", "head", "maxp"]), s("vmtx", ["vhea", "maxp"]), i("gvar") && !o("fvar") && M(
    e,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "gvar" usually expects "fvar" to describe variation axes.',
    `${n}.gvar`
  ), i("cvar") && !o("fvar") && M(
    e,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "cvar" usually expects "fvar" to describe variation axes.',
    `${n}.cvar`
  );
}
function bp(t, n, e) {
  const o = (r) => t[r] !== void 0;
  for (const r of wp)
    o(r) || M(
      e,
      "error",
      "REQUIRED_TABLE_MISSING",
      `Required core table "${r}" is missing.`,
      n
    );
  o("OS/2") || M(
    e,
    "warning",
    "RECOMMENDED_TABLE_MISSING",
    'Recommended table "OS/2" is missing.',
    n
  );
  const i = o("glyf") || o("loca"), s = o("CFF ") || o("CFF2");
  !i && !s && M(
    e,
    "error",
    "OUTLINE_MISSING",
    "No outline tables found. Include TrueType (glyf+loca) or CFF (CFF / CFF2) outlines.",
    n
  ), i && (o("glyf") || M(
    e,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "glyf".',
    n
  ), o("loca") || M(
    e,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "loca".',
    n
  )), i && s && M(
    e,
    "warning",
    "MULTIPLE_OUTLINE_TYPES",
    "Both TrueType and CFF outline tables are present; most fonts use one outline model.",
    n
  );
}
function Qr(t, n, e) {
  if (!vt(t)) {
    M(
      e,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      n
    );
    return;
  }
  const o = vp(t.tables, `${n}.tables`, e);
  _p(t.header, o.length, `${n}.header`, e), vt(t.tables) && (bp(t.tables, `${n}.tables`, e), Ap(t.tables, `${n}.tables`, e));
}
function kp(t, n, e) {
  const o = t.collection, i = t.fonts;
  if (vt(o) || M(
    e,
    "error",
    "COLLECTION_META_INVALID",
    "collection must be an object for TTC/OTC inputs.",
    `${n}.collection`
  ), !Array.isArray(i) || i.length === 0) {
    M(
      e,
      "error",
      "COLLECTION_FONTS_INVALID",
      "fonts must be a non-empty array for TTC/OTC inputs.",
      `${n}.fonts`
    );
    return;
  }
  o && o.numFonts !== void 0 && o.numFonts !== i.length && M(
    e,
    "warning",
    "COLLECTION_NUMFONTS_MISMATCH",
    `collection.numFonts (${o.numFonts}) does not match fonts.length (${i.length}).`,
    `${n}.collection.numFonts`
  );
  for (let s = 0; s < i.length; s++)
    Qr(i[s], `${n}.fonts[${s}]`, e);
}
function Op(t) {
  const n = [];
  return vt(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? kp(t, "$", n) : Qr(t, "$", n), Ki(n)) : (M(
    n,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), Ki(n));
}
export {
  fa as buildRawFromSimplified,
  Ji as buildSimplified,
  Cp as exportFont,
  lp as importFont,
  hp as importFontTables,
  Op as validateJSON
};
