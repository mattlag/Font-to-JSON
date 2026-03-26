function Gi(t, n) {
  const e = t[n];
  if (e >= 32 && e <= 246)
    return { value: e - 139, bytesConsumed: 1 };
  if (e >= 247 && e <= 250)
    return {
      value: (e - 247) * 256 + t[n + 1] + 108,
      bytesConsumed: 2
    };
  if (e >= 251 && e <= 254)
    return {
      value: -(e - 251) * 256 - t[n + 1] - 108,
      bytesConsumed: 2
    };
  if (e === 28) {
    const o = t[n + 1] << 8 | t[n + 2];
    return { value: o > 32767 ? o - 65536 : o, bytesConsumed: 3 };
  }
  if (e === 255) {
    const o = (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4]) >>> 0;
    return { value: (o > 2147483647 ? o - 4294967296 : o) / 65536, bytesConsumed: 5 };
  }
  return null;
}
function cs(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function Qa(t, n = [], e = []) {
  const o = [], s = [];
  let i = null, r = 0, a = 0, c = null, f = !1, u = !0;
  const l = cs(n.length), g = cs(e.length);
  function p(w, S) {
    i && i.length > 0 && s.push(i), r += w, a += S, i = [{ type: "M", x: r, y: a }];
  }
  function h(w, S) {
    r += w, a += S, i && i.push({ type: "L", x: r, y: a });
  }
  function d(w, S, A, b, D, C) {
    const k = r + w, I = a + S, O = k + A, E = I + b;
    r = O + D, a = E + C, i && i.push({ type: "C", x1: k, y1: I, x2: O, y2: E, x: r, y: a });
  }
  function x() {
    u && (o.length % 2 !== 0 && (c = o.shift()), u = !1, f = !0);
  }
  function m(w) {
    switch (w) {
      case 1:
      // hstem
      case 3:
      // vstem
      case 18:
      // hstemhm
      case 23:
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), o.length = 0;
        break;
      case 4:
        u && (o.length > 1 && (c = o.shift()), u = !1, f = !0), p(0, o.pop()), o.length = 0;
        break;
      case 5:
        for (let S = 0; S < o.length; S += 2)
          h(o[S], o[S + 1]);
        o.length = 0;
        break;
      case 6:
        for (let S = 0; S < o.length; S++)
          S % 2 === 0 ? h(o[S], 0) : h(0, o[S]);
        o.length = 0;
        break;
      case 7:
        for (let S = 0; S < o.length; S++)
          S % 2 === 0 ? h(0, o[S]) : h(o[S], 0);
        o.length = 0;
        break;
      case 8:
        for (let S = 0; S + 5 < o.length; S += 6)
          d(
            o[S],
            o[S + 1],
            o[S + 2],
            o[S + 3],
            o[S + 4],
            o[S + 5]
          );
        o.length = 0;
        break;
      case 10: {
        const S = o.pop() + g;
        e[S] && (callStack.push(null), execute(e[S]));
        break;
      }
      case 11:
        return;
      // Return from subroutine
      case 14:
        !f && o.length > 0 && (c = o.shift(), f = !0, u = !1), i && i.length > 0 && (s.push(i), i = null), o.length = 0;
        break;
      case 19:
      // hintmask
      case 20:
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), o.length = 0;
        break;
      case 21:
        x();
        {
          const S = o.pop(), A = o.pop();
          p(A, S);
        }
        o.length = 0;
        break;
      case 22:
        u && (o.length > 1 && (c = o.shift()), u = !1, f = !0), p(o.pop(), 0), o.length = 0;
        break;
      case 24:
        {
          const A = o.length - 2;
          let b = 0;
          for (; b < A; b += 6)
            d(
              o[b],
              o[b + 1],
              o[b + 2],
              o[b + 3],
              o[b + 4],
              o[b + 5]
            );
          h(o[b], o[b + 1]);
        }
        o.length = 0;
        break;
      case 25:
        {
          const A = o.length - 6;
          let b = 0;
          for (; b < A; b += 2)
            h(o[b], o[b + 1]);
          d(
            o[b],
            o[b + 1],
            o[b + 2],
            o[b + 3],
            o[b + 4],
            o[b + 5]
          );
        }
        o.length = 0;
        break;
      case 26:
        {
          let S = 0, A = 0;
          for (o.length % 4 !== 0 && (A = o[S++]); S + 3 < o.length; S += 4)
            d(A, o[S], o[S + 1], o[S + 2], 0, o[S + 3]), A = 0;
        }
        o.length = 0;
        break;
      case 27:
        {
          let S = 0, A = 0;
          for (o.length % 4 !== 0 && (A = o[S++]); S + 3 < o.length; S += 4)
            d(o[S], A, o[S + 1], o[S + 2], o[S + 3], 0), A = 0;
        }
        o.length = 0;
        break;
      case 29: {
        const S = o.pop() + l;
        n[S] && (callStack.push(null), execute(n[S]));
        break;
      }
      case 30:
        {
          let S = 0;
          for (; S < o.length && S + 3 < o.length; ) {
            {
              const A = o.length - S === 5 ? o[S + 4] : 0;
              d(
                0,
                o[S],
                o[S + 1],
                o[S + 2],
                o[S + 3],
                A
              ), S += A !== 0 ? 5 : 4;
            }
            if (S + 3 < o.length) {
              const A = o.length - S === 5 ? o[S + 4] : 0;
              d(
                o[S],
                0,
                o[S + 1],
                o[S + 2],
                A,
                o[S + 3]
              ), S += A !== 0 ? 5 : 4;
            } else break;
          }
        }
        o.length = 0;
        break;
      case 31:
        {
          let S = 0;
          for (; S < o.length && S + 3 < o.length; ) {
            {
              const A = o.length - S === 5 ? o[S + 4] : 0;
              d(
                o[S],
                0,
                o[S + 1],
                o[S + 2],
                A,
                o[S + 3]
              ), S += A !== 0 ? 5 : 4;
            }
            if (S + 3 < o.length) {
              const A = o.length - S === 5 ? o[S + 4] : 0;
              d(
                0,
                o[S],
                o[S + 1],
                o[S + 2],
                o[S + 3],
                A
              ), S += A !== 0 ? 5 : 4;
            } else break;
          }
        }
        o.length = 0;
        break;
      default:
        o.length = 0;
        break;
    }
  }
  function y(w) {
    switch (w) {
      case 34:
        {
          const S = o[0], A = 0, b = o[1], D = o[2], C = o[3], k = 0, I = o[4], O = 0, E = o[5], B = -D, M = o[6], L = 0;
          d(S, A, b, D, C, k), d(I, O, E, B, M, L);
        }
        o.length = 0;
        break;
      case 35:
        d(o[0], o[1], o[2], o[3], o[4], o[5]), d(o[6], o[7], o[8], o[9], o[10], o[11]), o.length = 0;
        break;
      case 36:
        {
          const S = o[0], A = o[1], b = o[2], D = o[3], C = o[4], k = 0, I = o[5], O = 0, E = o[6], B = o[7], M = o[8], L = -(A + D + B);
          d(S, A, b, D, C, k), d(I, O, E, B, M, L);
        }
        o.length = 0;
        break;
      case 37:
        {
          const S = o[0], A = o[1], b = o[2], D = o[3], C = o[4], k = o[5], I = o[6], O = o[7], E = o[8], B = o[9], M = o[10], L = S + b + C + I + E, $ = A + D + k + O + B;
          let U, Z;
          Math.abs(L) > Math.abs($) ? (U = M, Z = -$) : (U = -L, Z = M), d(S, A, b, D, C, k), d(I, O, E, B, U, Z);
        }
        o.length = 0;
        break;
      default:
        o.length = 0;
        break;
    }
  }
  function _(w, S) {
    let A = S || 0, b = 0;
    for (; b < w.length; ) {
      const D = w[b], C = Gi(w, b);
      if (C !== null) {
        o.push(C.value), b += C.bytesConsumed;
        continue;
      }
      if (D === 12) {
        b++;
        const k = w[b];
        b++, y(k);
      } else if (D === 19 || D === 20) {
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), A += o.length >> 1, o.length = 0, b++;
        const k = Math.ceil(A / 8);
        b += k;
      } else if (D === 1 || D === 3 || D === 18 || D === 23)
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), A += o.length >> 1, o.length = 0, b++;
      else if (D === 10) {
        b++;
        const k = o.pop() + g;
        e[k] && _(e[k], A);
      } else if (D === 29) {
        b++;
        const k = o.pop() + l;
        n[k] && _(n[k], A);
      } else {
        if (D === 11)
          return;
        b++, m(D);
      }
    }
  }
  return _(t, 0), i && i.length > 0 && s.push(i), { contours: s, width: c };
}
const fs = {
  1: "hstem",
  3: "vstem",
  4: "vmoveto",
  5: "rlineto",
  6: "hlineto",
  7: "vlineto",
  8: "rrcurveto",
  10: "callsubr",
  11: "return",
  14: "endchar",
  18: "hstemhm",
  19: "hintmask",
  20: "cntrmask",
  21: "rmoveto",
  22: "hmoveto",
  23: "vstemhm",
  24: "rcurveline",
  25: "rlinecurve",
  26: "vvcurveto",
  27: "hhcurveto",
  29: "callgsubr",
  30: "vhcurveto",
  31: "hvcurveto"
}, tc = {
  0: "dotsection",
  3: "and",
  4: "or",
  5: "not",
  9: "abs",
  10: "add",
  11: "sub",
  12: "div",
  14: "neg",
  15: "eq",
  18: "drop",
  20: "put",
  21: "get",
  22: "ifelse",
  23: "random",
  24: "mul",
  26: "sqrt",
  27: "dup",
  28: "exch",
  29: "index",
  30: "roll",
  34: "hflex",
  35: "flex",
  36: "hflex1",
  37: "flex1"
};
function nc(t) {
  const n = [], e = [];
  let o = 0, s = 0;
  for (; s < t.length; ) {
    const i = t[s], r = Gi(t, s);
    if (r !== null) {
      e.push(r.value), s += r.bytesConsumed;
      continue;
    }
    if (i === 12) {
      s++;
      const a = t[s];
      s++;
      const c = tc[a] || `op12.${a}`;
      n.push(e.length ? `${e.join(" ")} ${c}` : c), e.length = 0;
    } else if (i === 19 || i === 20) {
      const a = i === 19 ? "hintmask" : "cntrmask";
      o += e.length >> 1, s++;
      const c = Math.ceil(o / 8), f = [];
      for (let l = 0; l < c && s < t.length; l++, s++)
        f.push(t[s].toString(2).padStart(8, "0"));
      const u = e.length ? `${e.join(" ")} ` : "";
      n.push(`${u}${a} ${f.join("")}`), e.length = 0;
    } else if (i === 1 || i === 3 || i === 18 || i === 23) {
      o += e.length >> 1;
      const a = fs[i];
      n.push(e.length ? `${e.join(" ")} ${a}` : a), e.length = 0, s++;
    } else {
      const a = fs[i] || `op${i}`;
      n.push(e.length ? `${e.join(" ")} ${a}` : a), e.length = 0, s++;
    }
  }
  return e.length && n.push(e.join(" ")), n.join(`
`);
}
function $i(t) {
  const { header: n, tables: e } = t, o = oc(e), s = rc(e), i = { font: o, glyphs: s }, r = ac(e, s);
  r.length > 0 && (i.kerning = r), e.fvar && (i.axes = cc(e), i.instances = fc(e));
  const a = {};
  return e.GPOS && !e.GPOS._raw && (a.GPOS = e.GPOS), e.GSUB && !e.GSUB._raw && (a.GSUB = e.GSUB), e.GDEF && !e.GDEF._raw && (a.GDEF = e.GDEF), Object.keys(a).length > 0 && (i.features = a), e.gasp && !e.gasp._raw && e.gasp.gaspRanges && (i.gasp = e.gasp.gaspRanges.map((c) => ({
    maxPPEM: c.rangeMaxPPEM,
    behavior: c.rangeGaspBehavior
  }))), e["cvt "] && !e["cvt "]._raw && e["cvt "].values && (i.cvt = e["cvt "].values), e.fpgm && !e.fpgm._raw && e.fpgm.instructions && (i.fpgm = e.fpgm.instructions), e.prep && !e.prep._raw && e.prep.instructions && (i.prep = e.prep.instructions), i.tables = { ...e }, i._header = n, i;
}
const ec = {
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
function le(t, n) {
  if (!t || !t.names) return;
  const e = t.names.filter((r) => r.nameID === n);
  if (e.length === 0) return;
  const o = e.find(
    (r) => r.platformID === 3 && r.encodingID === 1 && r.languageID === 1033
  );
  if (o) return o.value;
  const s = e.find((r) => r.platformID === 0);
  if (s) return s.value;
  const i = e.find(
    (r) => r.platformID === 1 && r.encodingID === 0 && r.languageID === 0
  );
  return i ? i.value : e[0].value;
}
function oc(t) {
  const n = t.name, e = t.head, o = t.hhea, s = t["OS/2"], i = t.post, r = {};
  for (const [a, c] of Object.entries(ec)) {
    const f = le(n, Number(a));
    f !== void 0 && f.trim() !== "" && (r[c] = f);
  }
  return e && !e._raw && (r.unitsPerEm = e.unitsPerEm, r.created = us(e.created), r.modified = us(e.modified)), o && !o._raw && (r.ascender = o.ascender, r.descender = o.descender, r.lineGap = o.lineGap), i && !i._raw && (r.italicAngle = i.italicAngle, r.underlinePosition = i.underlinePosition, r.underlineThickness = i.underlineThickness, r.isFixedPitch = i.isFixedPitch !== 0), s && !s._raw && (r.weightClass = s.usWeightClass, r.widthClass = s.usWidthClass, r.fsType = s.fsType, r.fsSelection = s.fsSelection, r.achVendID = s.achVendID, s.panose && (r.panose = s.panose)), r;
}
function sc(t) {
  const n = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return n;
  for (const e of t.subtables)
    switch (e.format) {
      case 0:
        for (let o = 0; o < e.glyphIdArray.length; o++) {
          const s = e.glyphIdArray[o];
          s !== 0 && wn(n, s, o);
        }
        break;
      case 4:
        for (const o of e.segments)
          for (let s = o.startCode; s <= o.endCode; s++) {
            let i;
            if (o.idRangeOffset === 0)
              i = s + o.idDelta & 65535;
            else {
              const r = o.idRangeOffset / 2 + (s - o.startCode) - (e.segments.length - e.segments.indexOf(o));
              i = e.glyphIdArray[r], i !== void 0 && i !== 0 && (i = i + o.idDelta & 65535);
            }
            i !== void 0 && i !== 0 && wn(n, i, s);
          }
        break;
      case 6:
        for (let o = 0; o < e.glyphIdArray.length; o++) {
          const s = e.glyphIdArray[o];
          s !== 0 && wn(n, s, e.firstCode + o);
        }
        break;
      case 12:
        for (const o of e.groups)
          for (let s = o.startCharCode; s <= o.endCharCode; s++) {
            const i = o.startGlyphID + (s - o.startCharCode);
            i !== 0 && wn(n, i, s);
          }
        break;
      case 13:
        for (const o of e.groups)
          for (let s = o.startCharCode; s <= o.endCharCode; s++)
            o.glyphID !== 0 && wn(n, o.glyphID, s);
        break;
    }
  return n;
}
function wn(t, n, e) {
  t.has(n) || t.set(n, []);
  const o = t.get(n);
  o.includes(e) || o.push(e);
}
function ic(t, n) {
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
function rc(t) {
  const n = t.glyf && !t.glyf._raw, e = t["CFF "] && !t["CFF "]._raw, o = t.hmtx && !t.hmtx._raw ? t.hmtx : null, s = t.vmtx && !t.vmtx._raw ? t.vmtx : null, i = t.hhea && !t.hhea._raw ? t.hhea : null, r = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : n ? a = t.glyf.glyphs.length : e ? a = t["CFF "].fonts[0].charStrings.length : o && (a = o.hMetrics.length + (o.leftSideBearings?.length || 0));
  const c = i ? i.numberOfHMetrics : a, f = r ? r.numOfLongVerMetrics : 0, u = sc(t.cmap), l = ic(t, a), g = [];
  for (let p = 0; p < a; p++) {
    const h = {};
    l[p] && (h.name = l[p]);
    const d = u.get(p) || [];
    if (d.length === 1 ? h.unicode = d[0] : d.length > 1 ? (h.unicode = d[0], h.unicodes = d) : h.unicode = null, o && (p < c ? (h.advanceWidth = o.hMetrics[p].advanceWidth, h.leftSideBearing = o.hMetrics[p].lsb) : (h.advanceWidth = o.hMetrics[c - 1].advanceWidth, h.leftSideBearing = o.leftSideBearings[p - c])), s && (p < f ? (h.advanceHeight = s.vMetrics[p].advanceHeight, h.topSideBearing = s.vMetrics[p].topSideBearing) : s.topSideBearings && (h.advanceHeight = s.vMetrics[f - 1].advanceHeight, h.topSideBearing = s.topSideBearings[p - f])), n) {
      const x = t.glyf.glyphs[p];
      x && x.type === "simple" ? (h.contours = x.contours, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions)) : x && x.type === "composite" && (h.components = x.components, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions));
    }
    if (e) {
      const x = t["CFF "], m = x.fonts[0], y = m.charStrings;
      if (y[p]) {
        h.charString = y[p], h.charStringDisassembly = nc(y[p]);
        const _ = x.globalSubrs || [], w = m.localSubrs || [], S = Qa(
          y[p],
          _,
          w
        );
        S.contours.length > 0 && (h.contours = S.contours);
      }
    }
    g.push(h);
  }
  return g;
}
function ac(t, n) {
  const e = t.kern;
  if (!e || e._raw || !e.subtables) return [];
  const o = [];
  for (const s of e.subtables)
    if (s.format === 0 && s.pairs)
      for (const i of s.pairs) {
        const r = n[i.left]?.name || `glyph${i.left}`, a = n[i.right]?.name || `glyph${i.right}`;
        o.push({
          left: r,
          right: a,
          value: i.value
        });
      }
  return o;
}
function cc(t) {
  const n = t.fvar;
  return !n || n._raw || !n.axes ? [] : n.axes.map((e) => ({
    tag: e.axisTag,
    name: le(t.name, e.axisNameID) || e.axisTag,
    min: e.minValue,
    default: e.defaultValue,
    max: e.maxValue,
    hidden: (e.flags & 1) !== 0
  }));
}
function fc(t) {
  const n = t.fvar;
  if (!n || n._raw || !n.instances) return [];
  const e = n.axes;
  return n.instances.map((o) => {
    const s = {};
    for (let r = 0; r < e.length; r++)
      s[e[r].axisTag] = o.coordinates[r];
    const i = {
      name: le(t.name, o.subfamilyNameID) || `Instance ${o.subfamilyNameID}`,
      coordinates: s
    };
    if (o.postScriptNameID !== void 0) {
      const r = le(t.name, o.postScriptNameID);
      r && (i.postScriptName = r);
    }
    return i;
  });
}
const Hi = Date.UTC(1904, 0, 1, 0, 0, 0);
function us(t) {
  if (t == null) return;
  const n = typeof t == "bigint" ? t : BigInt(t);
  if (n === 0n) return;
  const e = Number(n) * 1e3 + Hi;
  if (!(!Number.isFinite(e) || e < -864e13 || e > 864e13))
    return new Date(e).toISOString();
}
function ls(t) {
  if (!t) return 0n;
  const n = Date.parse(t);
  return isNaN(n) ? 0n : BigInt(Math.floor((n - Hi) / 1e3));
}
function uc(t) {
  const { font: n, glyphs: e } = t, o = e.some((a) => a.charString), s = lc(e, n), i = {};
  if (i.head = gc(n, s), i.hhea = pc(n, s, e.length), i.maxp = dc(e, o), i["OS/2"] = mc(n, s), i.name = yc(n), i.post = wc(n, e), i.cmap = Sc(e), i.hmtx = vc(e), o ? i["CFF "] = kc(n, e) : (i.glyf = Ac(e), i.loca = { offsets: [] }), t.kerning && t.kerning.length > 0 && (i.kern = Oc(t.kerning, e)), t.axes && t.axes.length > 0 && (i.fvar = Ic(t, i.name)), t.gasp && (i.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((a) => ({
      rangeMaxPPEM: a.maxPPEM,
      rangeGaspBehavior: a.behavior
    }))
  }), t.cvt && (i["cvt "] = { values: t.cvt }), t.fpgm && (i.fpgm = { instructions: t.fpgm }), t.prep && (i.prep = { instructions: t.prep }), t.features && (t.features.GPOS && (i.GPOS = t.features.GPOS), t.features.GSUB && (i.GSUB = t.features.GSUB), t.features.GDEF && (i.GDEF = t.features.GDEF)), t.tables)
    for (const [a, c] of Object.entries(t.tables))
      i[a] || (i[a] = c);
  let r;
  if (t._header)
    r = { ...t._header, numTables: Object.keys(i).length };
  else {
    const a = Object.keys(i).length, c = Math.floor(Math.log2(a)), f = Math.pow(2, c) * 16, u = a * 16 - f;
    r = {
      sfVersion: o ? 1330926671 : 65536,
      numTables: a,
      searchRange: f,
      entrySelector: c,
      rangeShift: u
    };
  }
  return { header: r, tables: i };
}
function lc(t, n) {
  let e = 1 / 0, o = 1 / 0, s = -1 / 0, i = -1 / 0, r = 0, a = 0, c = 1 / 0, f = 1 / 0, u = -1 / 0, l = 65535, g = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > r && (r = m);
    const y = Ho(x);
    if (y) {
      y.xMin < e && (e = y.xMin), y.yMin < o && (o = y.yMin), y.xMax > s && (s = y.xMax), y.yMax > i && (i = y.yMax);
      const w = x.leftSideBearing ?? y.xMin, S = m - (w + (y.xMax - y.xMin)), A = w + (y.xMax - y.xMin);
      w < c && (c = w), S < f && (f = S), A > u && (u = A);
    }
    const _ = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const w of _)
      w < l && (l = w), w > g && (g = w), p.add(w);
  }
  e === 1 / 0 && (e = 0), o === 1 / 0 && (o = 0), s === -1 / 0 && (s = 0), i === -1 / 0 && (i = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), u === -1 / 0 && (u = 0), l === 65535 && (l = 0), g === 0 && (g = 0);
  const h = hs(
    t,
    "xyvw",
    n.ascender ? Math.round(n.ascender / 2) : 0
  ), d = hs(
    t,
    "HIKLEFJMNTZBDPRAGOQSUVWXY",
    i
  );
  return {
    xMin: e,
    yMin: o,
    xMax: s,
    yMax: i,
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
function Ho(t) {
  if (t.contours && t.contours.length > 0) {
    let n = 1 / 0, e = 1 / 0, o = -1 / 0, s = -1 / 0;
    for (const i of t.contours)
      for (const r of i)
        r.x < n && (n = r.x), r.y < e && (e = r.y), r.x > o && (o = r.x), r.y > s && (s = r.y);
    return { xMin: n, yMin: e, xMax: o, yMax: s };
  }
  return null;
}
function hs(t, n, e) {
  for (const o of n) {
    const s = o.charCodeAt(0), i = t.find((r) => (r.unicodes || (r.unicode ? [r.unicode] : [])).includes(s));
    if (i) {
      const r = Ho(i);
      if (r) return r.yMax;
    }
  }
  return e || 0;
}
function hc(t) {
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
  for (const [o, s, i] of e)
    for (const r of t)
      if (r >= s && r <= i) {
        const a = Math.floor(o / 32);
        n[a] |= 1 << o % 32;
        break;
      }
  return n;
}
function gc(t, n) {
  const e = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let s = 0;
  return e && (s |= 1), o && (s |= 2), {
    majorVersion: 1,
    minorVersion: 0,
    fontRevision: 1,
    checksumAdjustment: 0,
    // will be overwritten by export
    magicNumber: 1594834165,
    flags: 11,
    // baseline at y=0, lsb at x=0, instructions may alter advance
    unitsPerEm: t.unitsPerEm,
    created: ls(t.created),
    modified: ls(t.modified),
    xMin: n.xMin,
    yMin: n.yMin,
    xMax: n.xMax,
    yMax: n.yMax,
    macStyle: s,
    lowestRecPPEM: 8,
    fontDirectionHint: 2,
    indexToLocFormat: 0,
    // coordinated by export.js for glyf/loca
    glyphDataFormat: 0
  };
}
function pc(t, n, e) {
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
function dc(t, n) {
  if (n)
    return {
      version: 20480,
      numGlyphs: t.length
    };
  let e = 0, o = 0, s = 0, i = 0, r = 0, a = 0, c = 0;
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
    maxCompositePoints: s,
    maxCompositeContours: i,
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
function mc(t, n) {
  const e = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let s = t.fsSelection;
  s === void 0 && (s = 0, e && (s |= 32), o && (s |= 1), !e && !o && (s |= 64));
  const i = hc(n.unicodeRanges), r = n.unicodeRanges.has(32);
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
    ulUnicodeRange1: i[0],
    ulUnicodeRange2: i[1],
    ulUnicodeRange3: i[2],
    ulUnicodeRange4: i[3],
    achVendID: t.achVendID || "XXXX",
    fsSelection: s,
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
function yc(t) {
  const n = [], e = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || xc(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || Zi(t),
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
  for (const [o, s] of Object.entries(e)) {
    const i = Number(o);
    s && (n.push({
      platformID: 3,
      encodingID: 1,
      languageID: 1033,
      nameID: i,
      value: s
    }), n.push({
      platformID: 1,
      encodingID: 0,
      languageID: 0,
      nameID: i,
      value: s
    }), n.push({
      platformID: 0,
      encodingID: 3,
      languageID: 0,
      nameID: i,
      value: s
    }));
  }
  return { version: 0, names: n };
}
function xc(t) {
  const n = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${n}` : n;
}
function Zi(t) {
  const n = (t.familyName || "").replace(/\s/g, ""), e = t.styleName || "Regular";
  return `${n}-${e}`;
}
function wc(t, n) {
  const e = t.italicAngle || 0, o = t.underlinePosition || Math.round(-(t.unitsPerEm || 1e3) * 0.1), s = t.underlineThickness || Math.round((t.unitsPerEm || 1e3) * 0.05);
  return {
    version: 131072,
    italicAngle: e,
    underlinePosition: o,
    underlineThickness: s,
    isFixedPitch: t.isFixedPitch ? 1 : 0,
    minMemType42: 0,
    maxMemType42: 0,
    minMemType1: 0,
    maxMemType1: 0,
    glyphNames: n.map((i) => i.name || ".notdef")
  };
}
function Sc(t) {
  const n = /* @__PURE__ */ new Map();
  let e = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const u of f)
      n.has(u) || n.set(u, a), u > 65535 && (e = !0);
  }
  const o = [...n.entries()].sort((a, c) => a[0] - c[0]), s = [], i = [];
  if (e) {
    const a = _c(o);
    s.push({ format: 12, language: 0, groups: a }), i.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), i.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const r = o.filter(([a]) => a <= 65535);
  if (r.length > 0) {
    const { segments: a, glyphIdArray: c } = bc(r), f = s.length;
    s.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), i.push({ platformID: 3, encodingID: 1, subtableIndex: f }), i.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: i, subtables: s };
}
function _c(t) {
  if (t.length === 0) return [];
  const n = [];
  let e = t[0][0], o = t[0][1], s = e, i = o;
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r];
    a === s + 1 && c === i + 1 ? (s = a, i = c) : (n.push({
      startCharCode: e,
      endCharCode: s,
      startGlyphID: o
    }), e = a, o = c, s = a, i = c);
  }
  return n.push({
    startCharCode: e,
    endCharCode: s,
    startGlyphID: o
  }), n;
}
function bc(t) {
  const n = [], e = [];
  if (t.length === 0)
    return n.push({
      startCode: 65535,
      endCode: 65535,
      idDelta: 1,
      idRangeOffset: 0
    }), { segments: n, glyphIdArray: e };
  let o = t[0][0], s = t[0][1] - t[0][0], i = t[0][0];
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r], f = c - a;
    a === i + 1 && f === s || (n.push({
      startCode: o,
      endCode: i,
      idDelta: s,
      idRangeOffset: 0
    }), o = a, s = f), i = a;
  }
  return n.push({
    startCode: o,
    endCode: i,
    idDelta: s,
    idRangeOffset: 0
  }), n.push({
    startCode: 65535,
    endCode: 65535,
    idDelta: 1,
    idRangeOffset: 0
  }), { segments: n, glyphIdArray: e };
}
function vc(t) {
  return { hMetrics: t.map((e) => ({
    advanceWidth: e.advanceWidth || 0,
    lsb: e.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function Ac(t) {
  return { glyphs: t.map((e) => {
    if (e.contours && e.contours.length > 0) {
      const o = Ho(e);
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
function kc(t, n) {
  const e = t.postScriptName || Zi(t), o = n.slice(1).map((i) => i.name || ".notdef"), s = n.map((i) => i.charString || []);
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
          Weight: Cc(t.weightClass),
          FontBBox: [
            0,
            t.descender || 0,
            t.unitsPerEm || 1e3,
            t.ascender || 0
          ]
        },
        charset: o,
        encoding: [],
        charStrings: s,
        privateDict: {},
        localSubrs: []
      }
    ]
  };
}
function Cc(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function Oc(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (let c = 0; c < n.length; c++)
    n[c].name && e.set(n[c].name, c);
  const o = [];
  for (const c of t) {
    const f = e.get(c.left), u = e.get(c.right);
    f !== void 0 && u !== void 0 && o.push({ left: f, right: u, value: c.value });
  }
  if (o.length === 0) return null;
  const s = o.length, i = Math.floor(Math.log2(s)), r = Math.pow(2, i) * 6, a = s * 6 - r;
  return {
    formatVariant: "opentype",
    version: 0,
    nTables: 1,
    subtables: [
      {
        version: 0,
        coverage: 1,
        format: 0,
        nPairs: s,
        searchRange: r,
        entrySelector: i,
        rangeShift: a,
        pairs: o
      }
    ]
  };
}
function Ic(t, n) {
  const { axes: e, instances: o = [] } = t;
  let s = 256;
  const i = e.map((a) => {
    const c = s++;
    return Ne(n, c, a.name || a.tag), {
      axisTag: a.tag,
      minValue: a.min,
      defaultValue: a.default,
      maxValue: a.max,
      flags: a.hidden ? 1 : 0,
      axisNameID: c
    };
  }), r = o.map((a) => {
    const c = s++;
    Ne(n, c, a.name);
    const f = e.map((l) => a.coordinates[l.tag] ?? l.default), u = {
      subfamilyNameID: c,
      flags: 0,
      coordinates: f
    };
    if (a.postScriptName) {
      const l = s++;
      Ne(n, l, a.postScriptName), u.postScriptNameID = l;
    }
    return u;
  });
  return {
    majorVersion: 1,
    minorVersion: 0,
    reserved: 2,
    axisSize: 20,
    instanceSize: 4 + e.length * 4 + (r.some((a) => a.postScriptNameID !== void 0) ? 2 : 0),
    axes: i,
    instances: r
  };
}
function Ne(t, n, e) {
  e && t.names.push(
    { platformID: 3, encodingID: 1, languageID: 1033, nameID: n, value: e },
    { platformID: 1, encodingID: 0, languageID: 0, nameID: n, value: e },
    { platformID: 0, encodingID: 3, languageID: 0, nameID: n, value: e }
  );
}
function Dc(t, n, e = !0) {
  const o = t[n];
  if (o >= 32 && o <= 246)
    return { value: o - 139, bytesConsumed: 1 };
  if (o >= 247 && o <= 250) {
    const s = t[n + 1];
    return { value: (o - 247) * 256 + s + 108, bytesConsumed: 2 };
  }
  if (o >= 251 && o <= 254) {
    const s = t[n + 1];
    return { value: -(o - 251) * 256 - s - 108, bytesConsumed: 2 };
  }
  if (o === 28) {
    const s = t[n + 1] << 8 | t[n + 2];
    return { value: s > 32767 ? s - 65536 : s, bytesConsumed: 3 };
  }
  return o === 29 && e ? { value: t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0, bytesConsumed: 5 } : o === 30 && e ? Ec(t, n + 1) : o === 255 && !e ? { value: (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function Ec(t, n) {
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
  let o = "", s = n, i = !1;
  for (; !i; ) {
    const a = t[s++], c = a >> 4 & 15, f = a & 15;
    c === 15 ? i = !0 : (o += e[c], f === 15 ? i = !0 : o += e[f]);
  }
  return { value: o === "" || o === "." ? 0 : parseFloat(o), bytesConsumed: 1 + (s - n) };
}
function ji(t) {
  return Number.isInteger(t) ? Bc(t) : Tc(t);
}
function Bc(t) {
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
function Tc(t) {
  const n = [30];
  let e = t.toString();
  (e.includes("e") || e.includes("E")) && (e = t.toPrecision(10), e.includes(".") && (e = e.replace(/0+$/, "").replace(/\.$/, "")));
  const o = [];
  for (const s of e)
    switch (s) {
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
  for (let s = 0; s < o.length - 1; s++)
    o[s] === 11 && o[s + 1] === 14 && o.splice(s, 2, 12);
  o.push(15);
  for (let s = 0; s < o.length; s += 2) {
    const i = o[s], r = s + 1 < o.length ? o[s + 1] : 15;
    n.push(i << 4 | r);
  }
  return n;
}
function Mc(t) {
  return t <= 21 && t !== 28 && t !== 29 && t !== 30;
}
function Lt(t, n = 0, e = t.length) {
  const o = [], s = [];
  let i = n;
  for (; i < e; ) {
    const r = t[i];
    if (Mc(r)) {
      let a;
      r === 12 ? (a = 3072 | t[i + 1], i += 2) : (a = r, i += 1), o.push({ operator: a, operands: [...s] }), s.length = 0;
    } else {
      const a = Dc(t, i, !0);
      a === null ? i += 1 : (s.push(a.value), i += a.bytesConsumed);
    }
  }
  return o;
}
function vt(t, n) {
  const e = t[n] << 8 | t[n + 1];
  if (e === 0)
    return { items: [], totalBytes: 2 };
  const o = t[n + 2], s = n + 3, i = [];
  for (let f = 0; f <= e; f++) {
    let u = 0;
    const l = s + f * o;
    for (let g = 0; g < o; g++)
      u = u << 8 | t[l + g];
    i.push(u);
  }
  const r = s + (e + 1) * o, a = [];
  for (let f = 0; f < e; f++) {
    const u = r + i[f] - 1, l = r + i[f + 1] - 1;
    a.push(new Uint8Array(Array.prototype.slice.call(t, u, l)));
  }
  const c = r + i[e] - 1 - n;
  return { items: a, totalBytes: c };
}
function Wn(t, n) {
  const o = (t[n] << 24 | t[n + 1] << 16 | t[n + 2] << 8 | t[n + 3]) >>> 0;
  if (o === 0)
    return { items: [], totalBytes: 4 };
  const s = t[n + 4], i = n + 5, r = [];
  for (let u = 0; u <= o; u++) {
    let l = 0;
    const g = i + u * s;
    for (let p = 0; p < s; p++)
      l = l << 8 | t[g + p];
    r.push(l >>> 0);
  }
  const a = i + (o + 1) * s, c = [];
  for (let u = 0; u < o; u++) {
    const l = a + r[u] - 1, g = a + r[u + 1] - 1;
    c.push(new Uint8Array(Array.prototype.slice.call(t, l, g)));
  }
  const f = a + r[o] - 1 - n;
  return { items: c, totalBytes: f };
}
function _t(t) {
  const n = t.length;
  if (n === 0)
    return [0, 0];
  const e = [1];
  for (const r of t)
    e.push(e[e.length - 1] + r.length);
  const o = e[e.length - 1];
  let s;
  o <= 255 ? s = 1 : o <= 65535 ? s = 2 : o <= 16777215 ? s = 3 : s = 4;
  const i = [];
  i.push(n >> 8 & 255, n & 255), i.push(s);
  for (const r of e)
    for (let a = s - 1; a >= 0; a--)
      i.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      i.push(r[a]);
  return i;
}
function Xn(t) {
  const n = t.length;
  if (n === 0)
    return [0, 0, 0, 0];
  const e = [1];
  for (const r of t)
    e.push(e[e.length - 1] + r.length);
  const o = e[e.length - 1];
  let s;
  o <= 255 ? s = 1 : o <= 65535 ? s = 2 : o <= 16777215 ? s = 3 : s = 4;
  const i = [];
  i.push(
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ), i.push(s);
  for (const r of e)
    for (let a = s - 1; a >= 0; a--)
      i.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      i.push(r[a]);
  return i;
}
const lo = {
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
}, ct = Object.fromEntries(
  Object.entries(lo).map(([t, n]) => [n, Number(t)])
), ho = {
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
}, gs = Object.fromEntries(
  Object.entries(ho).map(([t, n]) => [n, Number(t)])
), go = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, Kt = Object.fromEntries(
  Object.entries(go).map(([t, n]) => [n, Number(t)])
), Yi = {
  18: "Private"
}, qi = {
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
function Rt(t, n) {
  const e = {};
  for (const { operator: o, operands: s } of t) {
    const i = n[o] || `op_${o}`;
    e[i] = s.length === 1 ? s[0] : s;
  }
  return e;
}
function cn(t, n) {
  const e = [];
  for (const [o, s] of Object.entries(t)) {
    const i = n[o];
    if (i === void 0) continue;
    const r = Array.isArray(s) ? s : [s];
    e.push({ operator: i, operands: r });
  }
  return e;
}
function Wi(t, n, e) {
  const o = t[n];
  if (o === 0) {
    const s = [];
    for (let i = 0; i < e; i++)
      s.push(t[n + 1 + i]);
    return s;
  }
  if (o === 3) {
    const s = t[n + 1] << 8 | t[n + 2], i = new Array(e);
    let r = n + 3;
    for (let a = 0; a < s; a++) {
      const c = t[r] << 8 | t[r + 1], f = t[r + 2];
      r += 3;
      const u = a < s - 1 ? t[r] << 8 | t[r + 1] : e;
      for (let l = c; l < u; l++)
        i[l] = f;
    }
    return i;
  }
  if (o === 4) {
    const s = (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4]) >>> 0, i = new Array(e);
    let r = n + 5;
    for (let a = 0; a < s; a++) {
      const c = (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0, f = t[r + 4] << 8 | t[r + 5];
      r += 6;
      const u = a < s - 1 ? (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0 : e;
      for (let l = c; l < u; l++)
        i[l] = f;
    }
    return i;
  }
  throw new Error(`Unsupported FDSelect format: ${o}`);
}
function Xi(t) {
  const n = [0];
  for (const e of t)
    n.push(e);
  return n;
}
function Lc(t, n, e) {
  if (n === 0) return "ISOAdobe";
  if (n === 1) return "Expert";
  if (n === 2) return "ExpertSubset";
  const o = t[n], s = [];
  if (o === 0)
    for (let i = 1; i < e; i++) {
      const r = t[n + 1 + (i - 1) * 2] << 8 | t[n + 2 + (i - 1) * 2];
      s.push(r);
    }
  else if (o === 1) {
    let i = n + 1;
    for (; s.length < e - 1; ) {
      const r = t[i] << 8 | t[i + 1], a = t[i + 2];
      i += 3;
      for (let c = 0; c <= a && s.length < e - 1; c++)
        s.push(r + c);
    }
  } else if (o === 2) {
    let i = n + 1;
    for (; s.length < e - 1; ) {
      const r = t[i] << 8 | t[i + 1], a = t[i + 2] << 8 | t[i + 3];
      i += 4;
      for (let c = 0; c <= a && s.length < e - 1; c++)
        s.push(r + c);
    }
  }
  return s;
}
function Rc(t) {
  if (typeof t == "string")
    return [];
  const n = [0];
  for (const e of t)
    n.push(e >> 8 & 255, e & 255);
  return n;
}
function zc(t, n) {
  if (n === 0) return "Standard";
  if (n === 1) return "Expert";
  const e = t[n] & 127, o = (t[n] & 128) !== 0, s = [];
  if (e === 0) {
    const i = t[n + 1];
    for (let r = 0; r < i; r++)
      s.push(t[n + 2 + r]);
  } else if (e === 1) {
    const i = t[n + 1];
    let r = n + 2;
    for (let a = 0; a < i; a++) {
      const c = t[r], f = t[r + 1];
      r += 2;
      for (let u = 0; u <= f; u++)
        s.push(c + u);
    }
  }
  return { format: e, codes: s, hasSupplement: o };
}
const Ki = /* @__PURE__ */ new Set([
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
]), ps = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset from Private start)
]);
function re(t, n) {
  const e = [];
  for (const { operator: o, operands: s } of t) {
    const i = n.has(o);
    for (const r of s)
      i && Number.isInteger(r) ? e.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : e.push(...ji(r));
    o >= 3072 ? e.push(12, o & 255) : e.push(o);
  }
  return e;
}
function ds(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) n.push(t.charCodeAt(e));
  return n;
}
function ms(t) {
  return String.fromCharCode(...t);
}
function Fc(t, n) {
  const e = new Uint8Array(t), o = e[0], s = e[1];
  let r = e[2];
  const a = vt(e, r);
  r += a.totalBytes;
  const c = a.items.map(ms), f = vt(e, r);
  r += f.totalBytes;
  const u = vt(e, r);
  r += u.totalBytes;
  const l = u.items.map(ms), p = vt(e, r).items.map((d) => Array.from(d)), h = f.items.map((d) => Vc(e, d));
  return {
    majorVersion: o,
    minorVersion: s,
    names: c,
    strings: l,
    globalSubrs: p,
    fonts: h
  };
}
function Vc(t, n) {
  const e = Lt(n, 0, n.length), o = Rt(e, lo), s = o.CharStrings, i = o.charset ?? 0, r = o.Encoding ?? 0, a = o.Private;
  delete o.CharStrings, delete o.charset, delete o.Encoding, delete o.Private;
  const c = o.FDArray, f = o.FDSelect;
  delete o.FDArray, delete o.FDSelect;
  let u = [];
  s !== void 0 && (u = vt(t, s).items.map((S) => Array.from(S)));
  const l = u.length, g = Lc(t, i, l), p = zc(t, r);
  let h = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [w, S] = a, A = Lt(t, S, S + w);
    h = Rt(A, ho), h.Subrs !== void 0 && (d = vt(t, S + h.Subrs).items.map((D) => Array.from(D)), delete h.Subrs);
  }
  const x = o.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = vt(t, c).items.map((S) => {
    const A = Lt(S, 0, S.length), b = Rt(A, lo);
    let D = {}, C = [];
    if (Array.isArray(b.Private) && b.Private.length === 2) {
      const [k, I] = b.Private, O = Lt(t, I, I + k);
      D = Rt(O, ho), D.Subrs !== void 0 && (C = vt(t, I + D.Subrs).items.map((B) => Array.from(B)), delete D.Subrs), delete b.Private;
    }
    return {
      fontDict: b,
      privateDict: D,
      localSubrs: C
    };
  })), f !== void 0 && (y = Wi(t, f, l)));
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
function Pc(t) {
  const {
    majorVersion: n = 1,
    minorVersion: e = 0,
    names: o = [],
    strings: s = [],
    globalSubrs: i = [],
    fonts: r = []
  } = t, a = [n, e, 4, 4], c = _t(o.map(ds)), f = _t(s.map(ds)), u = _t(
    i.map((_) => new Uint8Array(_))
  ), l = r.map((_) => Uc(_)), g = r.map(
    (_, w) => ys(
      _,
      l[w],
      /* baseOffset */
      0
    )
  ), p = _t(g);
  let d = a.length + c.length + p.length + f.length + u.length;
  const x = r.map((_, w) => {
    const S = ys(_, l[w], d);
    return d += l[w].totalSize, S;
  }), m = _t(x);
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
      for (let S = 0; S < w.length; S++) y.push(w[S]);
  return y;
}
function Uc(t) {
  const n = [], e = {};
  let o = 0;
  const s = (t.charStrings || []).map((l) => new Uint8Array(l)), i = _t(s);
  e.charStrings = o, n.push(i), o += i.length;
  const r = t.charset;
  if (typeof r == "string")
    e.charset = r === "ISOAdobe" ? 0 : r === "Expert" ? 1 : 2, e.charsetIsPredefined = !0;
  else {
    const l = Rc(r || []);
    e.charset = o, e.charsetIsPredefined = !1, n.push(l), o += l.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    e.encoding = a === "Standard" ? 0 : 1, e.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const l = Nc(a);
    e.encoding = o, e.encodingIsPredefined = !1, n.push(l), o += l.length;
  } else
    e.encoding = 0, e.encodingIsPredefined = !0;
  const c = cn(
    t.privateDict || {},
    gs
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = _t(
    t.localSubrs.map((l) => new Uint8Array(l))
  )), f) {
    const g = re(
      c,
      ps
    ).length + 6;
    c.push({
      operator: gs.Subrs,
      operands: [g]
    });
  }
  const u = re(c, ps);
  if (e.privateOffset = o, e.privateSize = u.length, n.push(u), o += u.length, f && (n.push(f), o += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const l = Xi(t.fdSelect);
      e.fdSelect = o, n.push(l), o += l.length;
    }
    if (t.fdArray) {
      const l = t.fdArray.map((p) => {
        const h = cn(
          p.fontDict || {},
          ct
        );
        return re(h, Ki);
      }), g = _t(l);
      e.fdArray = o, n.push(g), o += g.length;
    }
  }
  return { sections: n, totalSize: o, offsets: e };
}
function ys(t, n, e) {
  const o = n.offsets, s = cn(
    t.topDict || {},
    ct
  );
  return s.push({
    operator: ct.CharStrings,
    operands: [e + o.charStrings]
  }), o.charsetIsPredefined ? o.charset !== 0 && s.push({
    operator: ct.charset,
    operands: [o.charset]
  }) : s.push({
    operator: ct.charset,
    operands: [e + o.charset]
  }), o.encodingIsPredefined ? o.encoding !== 0 && s.push({
    operator: ct.Encoding,
    operands: [o.encoding]
  }) : s.push({
    operator: ct.Encoding,
    operands: [e + o.encoding]
  }), s.push({
    operator: ct.Private,
    operands: [o.privateSize, e + o.privateOffset]
  }), t.isCIDFont && (o.fdArray !== void 0 && s.push({
    operator: ct.FDArray,
    operands: [e + o.fdArray]
  }), o.fdSelect !== void 0 && s.push({
    operator: ct.FDSelect,
    operands: [e + o.fdSelect]
  })), re(s, Ki);
}
function Nc(t) {
  const { format: n = 0, codes: e = [], hasSupplement: o = !1 } = t, s = [], i = n | (o ? 128 : 0);
  if (n === 0) {
    s.push(i), s.push(e.length);
    for (const r of e) s.push(r);
  } else if (n === 1) {
    const r = [];
    if (e.length > 0) {
      let a = e[0], c = 0;
      for (let f = 1; f < e.length; f++)
        e[f] === a + c + 1 ? c++ : (r.push([a, c]), a = e[f], c = 0);
      r.push([a, c]);
    }
    s.push(i), s.push(r.length);
    for (const [a, c] of r)
      s.push(a, c);
  }
  return s;
}
const Gc = Object.fromEntries(
  Object.entries(Yi).map(([t, n]) => [n, Number(t)])
), $c = Object.fromEntries(
  Object.entries(qi).map(([t, n]) => [n, Number(t)])
), Hc = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), Zc = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), xs = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset)
]);
function ae(t, n) {
  const e = [];
  for (const { operator: o, operands: s } of t) {
    const i = n.has(o);
    for (const r of s)
      i && Number.isInteger(r) ? e.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : e.push(...ji(r));
    o >= 3072 ? e.push(12, o & 255) : e.push(o);
  }
  return e;
}
function jc(t, n) {
  const e = new Uint8Array(t), o = e[0], s = e[1], i = e[2], r = e[3] << 8 | e[4], a = i, c = a + r, f = Lt(e, a, c), u = Rt(f, go), l = u.CharStrings, g = u.VariationStore, p = u.FDArray, h = u.FDSelect;
  delete u.CharStrings, delete u.VariationStore, delete u.FDArray, delete u.FDSelect;
  const x = Wn(e, c).items.map((A) => Array.from(A));
  let m = [];
  l !== void 0 && (m = Wn(e, l).items.map((b) => Array.from(b)));
  const y = m.length;
  let _ = [];
  p !== void 0 && (_ = Wn(e, p).items.map((b) => {
    const D = Lt(b, 0, b.length), C = Rt(D, {
      ...Yi,
      ...go
      // Font DICTs can also have FontMatrix
    });
    let k = {}, I = [];
    if (Array.isArray(C.Private) && C.Private.length === 2) {
      const [O, E] = C.Private, B = Lt(e, E, E + O);
      k = Rt(B, qi), k.Subrs !== void 0 && (I = Wn(e, E + k.Subrs).items.map((L) => Array.from(L)), delete k.Subrs), delete C.Private;
    }
    return {
      fontDict: C,
      privateDict: k,
      localSubrs: I
    };
  }));
  let w = null;
  h !== void 0 && y > 0 && (w = Wi(e, h, y));
  let S = null;
  if (g !== void 0) {
    const A = e[g] << 8 | e[g + 1];
    S = Array.from(
      e.slice(g, g + A)
    );
  }
  return {
    majorVersion: o,
    minorVersion: s,
    topDict: u,
    globalSubrs: x,
    charStrings: m,
    fontDicts: _,
    fdSelect: w,
    variationStore: S
  };
}
function Yc(t) {
  const {
    majorVersion: n = 2,
    minorVersion: e = 0,
    topDict: o = {},
    globalSubrs: s = [],
    charStrings: i = [],
    fontDicts: r = [],
    fdSelect: a = null,
    variationStore: c = null
  } = t, f = Xn(
    s.map((O) => new Uint8Array(O))
  ), u = Xn(i.map((O) => new Uint8Array(O))), l = a ? Xi(a) : null, g = c ? new Uint8Array(c) : null, h = ws(o, {
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
  const S = r.map((O) => {
    const E = cn(
      O.privateDict || {},
      $c
    );
    let B = null;
    if (O.localSubrs && O.localSubrs.length > 0 && (B = Xn(
      O.localSubrs.map((L) => new Uint8Array(L))
    )), B) {
      const $ = ae(
        E,
        xs
      ).length + 6;
      E.push({
        operator: 19,
        // Subrs
        operands: [$]
      });
    }
    const M = ae(E, xs);
    return {
      privBytes: M,
      localSubrBytes: B,
      totalSize: M.length + (B ? B.length : 0)
    };
  }), A = [];
  for (const O of S)
    A.push({ offset: m, size: O.privBytes.length }), m += O.totalSize;
  let b = null, D;
  if (r.length > 0) {
    const O = r.map((E, B) => {
      const M = cn(E.fontDict || {}, {
        ...Gc,
        ...Kt
      });
      return M.push({
        operator: 18,
        // Private
        operands: [A[B].size, A[B].offset]
      }), ae(M, Zc);
    });
    b = Xn(O), D = m, m += b.length;
  }
  const C = ws(o, {
    charStrings: y,
    fdArray: D,
    fdSelect: _,
    variationStore: w
  });
  if (C.length !== h)
    throw new Error(
      "CFF2 TopDICT size mismatch — this should not happen with forced int32 offsets"
    );
  const I = [
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
    for (let O = 0; O < l.length; O++)
      I.push(l[O]);
  if (g)
    for (let O = 0; O < g.length; O++)
      I.push(g[O]);
  for (const O of S) {
    for (let E = 0; E < O.privBytes.length; E++) I.push(O.privBytes[E]);
    if (O.localSubrBytes)
      for (let E = 0; E < O.localSubrBytes.length; E++)
        I.push(O.localSubrBytes[E]);
  }
  if (b)
    for (let O = 0; O < b.length; O++) I.push(b[O]);
  return I;
}
function ws(t, n) {
  const e = cn(t, Kt);
  return n.charStrings !== void 0 && e.push({
    operator: Kt.CharStrings,
    operands: [n.charStrings]
  }), n.fdArray !== void 0 && e.push({
    operator: Kt.FDArray,
    operands: [n.fdArray]
  }), n.fdSelect !== void 0 && e.push({
    operator: Kt.FDSelect,
    operands: [n.fdSelect]
  }), n.variationStore !== void 0 && e.push({
    operator: Kt.VariationStore,
    operands: [n.variationStore]
  }), ae(e, Hc);
}
class T {
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
    const o = [], s = this[n].bind(this);
    for (let i = 0; i < e; i++)
      o.push(s());
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
class v {
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
    for (const s of e)
      o(s);
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
const qc = 8, Wc = 4;
function Xc(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.int16(), i = n.uint16(), r = [];
  for (let a = 0; a < i; a++)
    r.push({
      glyphIndex: n.uint16(),
      vertOriginY: n.int16()
    });
  return {
    majorVersion: e,
    minorVersion: o,
    defaultVertOriginY: s,
    numVertOriginYMetrics: i,
    vertOriginYMetrics: r
  };
}
function Kc(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.defaultVertOriginY ?? 0, s = t.vertOriginYMetrics ?? [], i = t.numVertOriginYMetrics ?? s.length, r = s.slice(0, i);
  for (; r.length < i; )
    r.push({ glyphIndex: 0, vertOriginY: o });
  const a = new v(
    qc + i * Wc
  );
  a.uint16(n), a.uint16(e), a.int16(o), a.uint16(i);
  for (const c of r)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? o);
  return a.toArray();
}
const Jc = 8;
function Qc(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = [];
  for (let a = 0; a < i; a++) {
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
    reserved: s,
    segmentMaps: r
  };
}
function tf(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 0, s = t.segmentMaps ?? [];
  let i = Jc;
  for (const a of s) {
    const c = a.axisValueMaps?.length ?? a.positionMapCount ?? 0;
    i += 2 + c * 4;
  }
  const r = new v(i);
  r.uint16(n), r.uint16(e), r.uint16(o), r.uint16(s.length);
  for (const a of s) {
    const c = a.axisValueMaps ?? [];
    r.uint16(c.length);
    for (const f of c)
      r.f2dot14(f.fromCoordinate), r.f2dot14(f.toCoordinate);
  }
  return r.toArray();
}
const po = 32768, mo = 32767;
function fn(t) {
  const n = new T(t), e = n.uint16(), o = n.offset32(), s = n.uint16(), i = n.array(
    "offset32",
    s
  ), r = nf(
    n,
    o
  ), a = [];
  for (let c = 0; c < s; c++) {
    const f = i[c];
    f === 0 ? a.push(null) : a.push(ef(n, f));
  }
  return {
    format: e,
    variationRegionList: r,
    itemVariationData: a
  };
}
function nf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = [];
  for (let i = 0; i < o; i++) {
    const r = [];
    for (let a = 0; a < e; a++)
      r.push({
        startCoord: t.f2dot14(),
        peakCoord: t.f2dot14(),
        endCoord: t.f2dot14()
      });
    s.push({ regionAxes: r });
  }
  return { axisCount: e, regions: s };
}
function ef(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = (o & po) !== 0, a = o & mo, c = [];
  for (let f = 0; f < e; f++) {
    const u = [];
    for (let l = 0; l < a; l++)
      u.push(r ? t.int32() : t.int16());
    for (let l = a; l < s; l++)
      u.push(r ? t.int16() : t.int8());
    c.push(u);
  }
  return {
    itemCount: e,
    wordDeltaCount: o,
    regionIndexes: i,
    deltaSets: c
  };
}
function Hn(t) {
  const n = t.variationRegionList, e = t.itemVariationData ?? [], o = e.length, s = 8 + 4 * o, i = n.axisCount, r = n.regions.length, a = 4 + r * i * 6, c = s;
  let f = c + a;
  const u = [];
  for (let p = 0; p < o; p++) {
    const h = e[p];
    if (!h) {
      u.push(0);
      continue;
    }
    u.push(f);
    const d = h.regionIndexes.length, x = (h.wordDeltaCount & po) !== 0, m = h.wordDeltaCount & mo, y = 6 + 2 * d, _ = x ? 4 : 2, w = x ? 2 : 1, S = m * _ + (d - m) * w, A = y + h.itemCount * S;
    f += A;
  }
  const l = f, g = new v(l);
  g.uint16(t.format ?? 1), g.offset32(c), g.uint16(o);
  for (let p = 0; p < o; p++)
    g.offset32(u[p]);
  g.uint16(i), g.uint16(r);
  for (const p of n.regions)
    for (const h of p.regionAxes)
      g.f2dot14(h.startCoord), g.f2dot14(h.peakCoord), g.f2dot14(h.endCoord);
  for (let p = 0; p < o; p++) {
    const h = e[p];
    if (!h) continue;
    const d = h.regionIndexes.length, x = (h.wordDeltaCount & po) !== 0, m = h.wordDeltaCount & mo;
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
function V(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.array("uint16", o);
    return { format: e, glyphs: s };
  }
  if (e === 2) {
    const o = t.uint16(), s = [];
    for (let i = 0; i < o; i++)
      s.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        startCoverageIndex: t.uint16()
      });
    return { format: e, ranges: s };
  }
  throw new Error(`Unknown Coverage format: ${e}`);
}
function P(t) {
  if (t.format === 1) {
    const n = 4 + t.glyphs.length * 2, e = new v(n);
    return e.uint16(1), e.uint16(t.glyphs.length), e.array("uint16", t.glyphs), e.toArray();
  }
  if (t.format === 2) {
    const n = 4 + t.ranges.length * 6, e = new v(n);
    e.uint16(2), e.uint16(t.ranges.length);
    for (const o of t.ranges)
      e.uint16(o.startGlyphID), e.uint16(o.endGlyphID), e.uint16(o.startCoverageIndex);
    return e.toArray();
  }
  throw new Error(`Unknown Coverage format: ${t.format}`);
}
function Ct(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s);
    return { format: e, startGlyphID: o, classValues: i };
  }
  if (e === 2) {
    const o = t.uint16(), s = [];
    for (let i = 0; i < o; i++)
      s.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        class: t.uint16()
      });
    return { format: e, ranges: s };
  }
  throw new Error(`Unknown ClassDef format: ${e}`);
}
function Ot(t) {
  if (t.format === 1) {
    const n = 6 + t.classValues.length * 2, e = new v(n);
    return e.uint16(1), e.uint16(t.startGlyphID), e.uint16(t.classValues.length), e.array("uint16", t.classValues), e.toArray();
  }
  if (t.format === 2) {
    const n = 4 + t.ranges.length * 6, e = new v(n);
    e.uint16(2), e.uint16(t.ranges.length);
    for (const o of t.ranges)
      e.uint16(o.startGlyphID), e.uint16(o.endGlyphID), e.uint16(o.class);
    return e.toArray();
  }
  throw new Error(`Unknown ClassDef format: ${t.format}`);
}
function un(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint16();
  if (s === 32768)
    return {
      format: 32768,
      deltaSetOuterIndex: e,
      deltaSetInnerIndex: o
    };
  const i = e, r = o, a = s, c = r - i + 1;
  let f, u, l;
  if (a === 1)
    f = 2, u = 3, l = 2;
  else if (a === 2)
    f = 4, u = 15, l = 8;
  else if (a === 3)
    f = 8, u = 255, l = 128;
  else
    throw new Error(
      `Unknown Device deltaFormat: ${a} at offset ${n} (words: ${e}, ${o}, ${s})`
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
  return { format: a, startSize: i, endSize: r, deltaValues: h };
}
function he(t) {
  if (t.format === 32768) {
    const l = new v(6);
    return l.uint16(t.deltaSetOuterIndex), l.uint16(t.deltaSetInnerIndex), l.uint16(32768), l.toArray();
  }
  const { startSize: n, endSize: e, deltaFormat: o, deltaValues: s } = t;
  let i;
  if (o === 1) i = 2;
  else if (o === 2) i = 4;
  else if (o === 3) i = 8;
  else throw new Error(`Unknown Device deltaFormat: ${o}`);
  const r = 16 / i, a = Math.ceil(s.length / r), c = (1 << i) - 1, f = 6 + a * 2, u = new v(f);
  u.uint16(n), u.uint16(e), u.uint16(o);
  for (let l = 0; l < a; l++) {
    let g = 0;
    const p = Math.min(
      r,
      s.length - l * r
    );
    for (let h = 0; h < p; h++) {
      const d = 16 - i * (h + 1);
      g |= (s[l * r + h] & c) << d;
    }
    u.uint16(g);
  }
  return u.toArray();
}
function Ji(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: o.map((i) => ({
    scriptTag: i.scriptTag,
    script: of(t, n + i.scriptOffset)
  })) };
}
function of(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = [];
  for (let a = 0; a < o; a++)
    s.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const i = e !== 0 ? Ss(t, n + e) : null, r = s.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: Ss(t, n + a.langSysOffset)
  }));
  return { defaultLangSys: i, langSysRecords: r };
}
function Ss(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint16(), i = t.array("uint16", s);
  return { lookupOrderOffset: e, requiredFeatureIndex: o, featureIndices: i };
}
function Qi(t) {
  const { scriptRecords: n } = t, e = n.map((a) => sf(a.script)), o = 2 + n.length * 6, s = [];
  let i = o;
  for (const a of e)
    s.push(i), i += a.length;
  const r = new v(i);
  r.uint16(n.length);
  for (let a = 0; a < n.length; a++)
    r.tag(n[a].scriptTag), r.uint16(s[a]);
  for (let a = 0; a < e.length; a++)
    r.seek(s[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function sf(t) {
  const { defaultLangSys: n, langSysRecords: e } = t, o = e.map((u) => _s(u.langSys)), s = n ? _s(n) : null;
  let r = 4 + e.length * 6;
  const a = s ? r : 0;
  s && (r += s.length);
  const c = [];
  for (const u of o)
    c.push(r), r += u.length;
  const f = new v(r);
  f.uint16(a), f.uint16(e.length);
  for (let u = 0; u < e.length; u++)
    f.tag(e[u].langSysTag), f.uint16(c[u]);
  s && (f.seek(a), f.rawBytes(s));
  for (let u = 0; u < o.length; u++)
    f.seek(c[u]), f.rawBytes(o[u]);
  return f.toArray();
}
function _s(t) {
  const n = 6 + t.featureIndices.length * 2, e = new v(n);
  return e.uint16(t.lookupOrderOffset), e.uint16(t.requiredFeatureIndex), e.uint16(t.featureIndices.length), e.array("uint16", t.featureIndices), e.toArray();
}
function tr(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: o.map((i) => ({
    featureTag: i.featureTag,
    feature: nr(t, n + i.featureOffset)
  })) };
}
function nr(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { featureParamsOffset: e, lookupListIndices: s };
}
function er(t) {
  const { featureRecords: n } = t, e = n.map((a) => or(a.feature)), o = 2 + n.length * 6, s = [];
  let i = o;
  for (const a of e)
    s.push(i), i += a.length;
  const r = new v(i);
  r.uint16(n.length);
  for (let a = 0; a < n.length; a++)
    r.tag(n[a].featureTag), r.uint16(s[a]);
  for (let a = 0; a < e.length; a++)
    r.seek(s[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function or(t) {
  const n = 4 + t.lookupListIndices.length * 2, e = new v(n);
  return e.uint16(t.featureParamsOffset), e.uint16(t.lookupListIndices.length), e.array("uint16", t.lookupListIndices), e.toArray();
}
function sr(t, n, e, o) {
  t.seek(n);
  const s = t.uint16();
  return { lookups: t.array("uint16", s).map(
    (a) => rf(t, n + a, e, o)
  ) };
}
function rf(t, n, e, o) {
  t.seek(n);
  const s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.array("uint16", r), c = i & 16 ? t.uint16() : void 0, f = a.map(
    (p) => e(t, n + p, s)
  );
  let u = s, l = f;
  o !== void 0 && s === o && f.length > 0 && (u = f[0].extensionLookupType, l = f.map((p) => p.subtable));
  const g = {
    lookupType: u,
    lookupFlag: i,
    subtables: l
  };
  return c !== void 0 && (g.markFilteringSet = c), g;
}
function ir(t, n, e) {
  const { lookups: o } = t, s = 8, i = o.map((p) => {
    const h = p.subtables.map(
      (d) => n(d, p.lookupType)
    );
    return { ...p, subtableBytes: h };
  }), r = (p) => {
    const { lookupType: h, lookupFlag: d, subtableBytes: x, markFilteringSet: m } = p, y = m !== void 0;
    let w = 6 + x.length * 2 + (y ? 2 : 0);
    const S = x.map((b) => {
      const D = w;
      return w += b.length, D;
    }), A = new v(w);
    A.uint16(h), A.uint16(d), A.uint16(x.length), A.array("uint16", S), y && A.uint16(m);
    for (let b = 0; b < x.length; b++)
      A.seek(S[b]), A.rawBytes(x[b]);
    return A.toArray();
  };
  let a = i.map(r);
  const c = 2 + o.length * 2;
  if (((p) => {
    let h = c;
    for (const d of p) {
      if (h > 65535) return !0;
      h += d.length;
    }
    return !1;
  })(a) && e !== void 0) {
    const p = i.map((y) => {
      const { lookupType: _, lookupFlag: w, subtableBytes: S, markFilteringSet: A } = y, b = A !== void 0;
      let C = 6 + S.length * 2 + (b ? 2 : 0);
      const k = S.map(() => {
        const O = C;
        return C += s, O;
      }), I = new v(C);
      I.uint16(e), I.uint16(w), I.uint16(S.length), I.array("uint16", k), b && I.uint16(A);
      for (let O = 0; O < S.length; O++)
        I.seek(k[O]), I.uint16(1), I.uint16(_), I.uint32(0);
      return {
        compactBytes: I.toArray(),
        subtableOffsets: k,
        innerDataBytes: S
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
    ), m = new v(h);
    m.uint16(o.length), m.array("uint16", d);
    for (let y = 0; y < p.length; y++)
      m.seek(d[y]), m.rawBytes(p[y].compactBytes);
    for (let y = 0; y < p.length; y++) {
      const _ = p[y];
      for (let w = 0; w < _.innerDataBytes.length; w++) {
        const S = d[y] + _.subtableOffsets[w], A = x[y][w], b = A - S;
        m.seek(S + 4), m.uint32(b), m.seek(A), m.rawBytes(_.innerDataBytes[w]);
      }
    }
    return m.toArray();
  }
  let u = c;
  const l = a.map((p) => {
    const h = u;
    return u += p.length, h;
  }), g = new v(u);
  g.uint16(o.length), g.array("uint16", l);
  for (let p = 0; p < a.length; p++)
    g.seek(l[p]), g.rawBytes(a[p]);
  return g.toArray();
}
function rr(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = [];
    for (let c = 0; c < s; c++)
      i.push(t.uint16());
    const r = V(t, n + o), a = i.map(
      (c) => c === 0 ? null : af(t, n + c)
    );
    return { format: e, coverage: r, seqRuleSets: a };
  }
  if (e === 2) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = [];
    for (let u = 0; u < i; u++)
      r.push(t.uint16());
    const a = V(t, n + o), c = Ct(t, n + s), f = r.map(
      (u) => u === 0 ? null : cf(t, n + u)
    );
    return { format: e, coverage: a, classDef: c, classSeqRuleSets: f };
  }
  if (e === 3) {
    const o = t.uint16(), s = t.uint16(), i = t.array("uint16", o), r = Zn(t, s), a = i.map(
      (c) => V(t, n + c)
    );
    return { format: e, coverages: a, seqLookupRecords: r };
  }
  throw new Error(`Unknown SequenceContext format: ${e}`);
}
function af(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => {
    t.seek(n + s);
    const i = t.uint16(), r = t.uint16(), a = t.array("uint16", i - 1), c = Zn(t, r);
    return { glyphCount: i, inputSequence: a, seqLookupRecords: c };
  });
}
function cf(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => {
    t.seek(n + s);
    const i = t.uint16(), r = t.uint16(), a = t.array("uint16", i - 1), c = Zn(t, r);
    return { glyphCount: i, inputSequence: a, seqLookupRecords: c };
  });
}
function Zn(t, n) {
  const e = [];
  for (let o = 0; o < n; o++)
    e.push({
      sequenceIndex: t.uint16(),
      lookupListIndex: t.uint16()
    });
  return e;
}
function ar(t) {
  if (t.format === 1) return ff(t);
  if (t.format === 2) return uf(t);
  if (t.format === 3) return lf(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function ff(t) {
  const { coverage: n, seqRuleSets: e } = t, o = P(n), s = e.map(
    (u) => u === null ? null : cr(u)
  );
  let r = 6 + e.length * 2;
  const a = r;
  r += o.length;
  const c = s.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new v(r);
  f.uint16(1), f.uint16(a), f.uint16(e.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let u = 0; u < s.length; u++)
    s[u] && (f.seek(c[u]), f.rawBytes(s[u]));
  return f.toArray();
}
function uf(t) {
  const { coverage: n, classDef: e, classSeqRuleSets: o } = t, s = P(n), i = Ot(e), r = o.map(
    (p) => p === null ? null : cr(p)
  );
  let c = 8 + o.length * 2;
  const f = c;
  c += s.length;
  const u = c;
  c += i.length;
  const l = r.map((p) => {
    if (p === null) return 0;
    const h = c;
    return c += p.length, h;
  }), g = new v(c);
  g.uint16(2), g.uint16(f), g.uint16(u), g.uint16(o.length), g.array("uint16", l), g.seek(f), g.rawBytes(s), g.seek(u), g.rawBytes(i);
  for (let p = 0; p < r.length; p++)
    r[p] && (g.seek(l[p]), g.rawBytes(r[p]));
  return g.toArray();
}
function lf(t) {
  const { coverages: n, seqLookupRecords: e } = t, o = n.map(P);
  let i = 6 + n.length * 2 + e.length * 4;
  const r = o.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new v(i);
  a.uint16(3), a.uint16(n.length), a.uint16(e.length), a.array("uint16", r), Ce(a, e);
  for (let c = 0; c < o.length; c++)
    a.seek(r[c]), a.rawBytes(o[c]);
  return a.toArray();
}
function cr(t) {
  const n = t.map(hf);
  let o = 2 + t.length * 2;
  const s = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.length), i.array("uint16", s);
  for (let r = 0; r < n.length; r++)
    i.seek(s[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function hf(t) {
  const { glyphCount: n, inputSequence: e, seqLookupRecords: o } = t, s = 4 + (n - 1) * 2 + o.length * 4, i = new v(s);
  return i.uint16(n), i.uint16(o.length), i.array("uint16", e), Ce(i, o), i.toArray();
}
function Ce(t, n) {
  for (const e of n)
    t.uint16(e.sequenceIndex), t.uint16(e.lookupListIndex);
}
function fr(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = [];
    for (let c = 0; c < s; c++)
      i.push(t.uint16());
    const r = V(t, n + o), a = i.map(
      (c) => c === 0 ? null : gf(t, n + c)
    );
    return { format: e, coverage: r, chainedSeqRuleSets: a };
  }
  if (e === 2) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = [];
    for (let h = 0; h < a; h++)
      c.push(t.uint16());
    const f = V(t, n + o), u = Ct(
      t,
      n + s
    ), l = Ct(
      t,
      n + i
    ), g = Ct(
      t,
      n + r
    ), p = c.map(
      (h) => h === 0 ? null : pf(t, n + h)
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
    const o = t.uint16(), s = t.array(
      "uint16",
      o
    ), i = t.uint16(), r = t.array("uint16", i), a = t.uint16(), c = t.array(
      "uint16",
      a
    ), f = t.uint16(), u = Zn(t, f), l = s.map(
      (h) => V(t, n + h)
    ), g = r.map(
      (h) => V(t, n + h)
    ), p = c.map(
      (h) => V(t, n + h)
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
function gf(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => ur(t, n + s));
}
function ur(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.array("uint16", e), s = t.uint16(), i = t.array("uint16", s - 1), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = Zn(t, c);
  return {
    backtrackSequence: o,
    inputGlyphCount: s,
    inputSequence: i,
    lookaheadSequence: a,
    seqLookupRecords: f
  };
}
function pf(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => ur(t, n + s));
}
function lr(t) {
  if (t.format === 1) return df(t);
  if (t.format === 2) return mf(t);
  if (t.format === 3) return yf(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function df(t) {
  const { coverage: n, chainedSeqRuleSets: e } = t, o = P(n), s = e.map(
    (u) => u === null ? null : hr(u)
  );
  let r = 6 + e.length * 2;
  const a = r;
  r += o.length;
  const c = s.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new v(r);
  f.uint16(1), f.uint16(a), f.uint16(e.length), f.array("uint16", c), f.seek(a), f.rawBytes(o);
  for (let u = 0; u < s.length; u++)
    s[u] && (f.seek(c[u]), f.rawBytes(s[u]));
  return f.toArray();
}
function mf(t) {
  const {
    coverage: n,
    backtrackClassDef: e,
    inputClassDef: o,
    lookaheadClassDef: s,
    chainedClassSeqRuleSets: i
  } = t, r = P(n), a = Ot(e), c = Ot(o), f = Ot(s), u = i.map(
    (_) => _ === null ? null : hr(_)
  );
  let g = 12 + i.length * 2;
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
  }), y = new v(g);
  y.uint16(2), y.uint16(p), y.uint16(h), y.uint16(d), y.uint16(x), y.uint16(i.length), y.array("uint16", m), y.seek(p), y.rawBytes(r), y.seek(h), y.rawBytes(a), y.seek(d), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let _ = 0; _ < u.length; _++)
    u[_] && (y.seek(m[_]), y.rawBytes(u[_]));
  return y.toArray();
}
function yf(t) {
  const {
    backtrackCoverages: n,
    inputCoverages: e,
    lookaheadCoverages: o,
    seqLookupRecords: s
  } = t, i = n.map(P), r = e.map(P), a = o.map(P);
  let f = 4 + n.length * 2 + 2 + e.length * 2 + 2 + o.length * 2 + 2 + s.length * 4;
  const u = i.map((h) => {
    const d = f;
    return f += h.length, d;
  }), l = r.map((h) => {
    const d = f;
    return f += h.length, d;
  }), g = a.map((h) => {
    const d = f;
    return f += h.length, d;
  }), p = new v(f);
  p.uint16(3), p.uint16(n.length), p.array("uint16", u), p.uint16(e.length), p.array("uint16", l), p.uint16(o.length), p.array("uint16", g), p.uint16(s.length), Ce(p, s);
  for (let h = 0; h < i.length; h++)
    p.seek(u[h]), p.rawBytes(i[h]);
  for (let h = 0; h < r.length; h++)
    p.seek(l[h]), p.rawBytes(r[h]);
  for (let h = 0; h < a.length; h++)
    p.seek(g[h]), p.rawBytes(a[h]);
  return p.toArray();
}
function hr(t) {
  const n = t.map(xf);
  let o = 2 + t.length * 2;
  const s = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.length), i.array("uint16", s);
  for (let r = 0; r < n.length; r++)
    i.seek(s[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function xf(t) {
  const {
    backtrackSequence: n,
    inputGlyphCount: e,
    inputSequence: o,
    lookaheadSequence: s,
    seqLookupRecords: i
  } = t, r = 2 + n.length * 2 + 2 + o.length * 2 + 2 + s.length * 2 + 2 + i.length * 4, a = new v(r);
  return a.uint16(n.length), a.array("uint16", n), a.uint16(e), a.array("uint16", o), a.uint16(s.length), a.array("uint16", s), a.uint16(i.length), Ce(a, i), a.toArray();
}
function gr(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint32(), i = [];
  for (let a = 0; a < s; a++)
    i.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const r = i.map((a) => {
    const c = a.conditionSetOffset !== 0 ? wf(t, n + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? Sf(
      t,
      n + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: e, minorVersion: o, featureVariationRecords: r };
}
function wf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++)
    o.push(t.uint32());
  return { conditions: o.map((i) => {
    t.seek(n + i);
    const r = t.uint16();
    if (r === 1) {
      const a = t.uint16(), c = t.int16(), f = t.int16();
      return { format: r, axisIndex: a, filterRangeMinValue: c, filterRangeMaxValue: f };
    }
    return { format: r, _raw: !0 };
  }) };
}
function Sf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint16(), i = [];
  for (let r = 0; r < s; r++) {
    const a = t.uint16(), c = t.uint32(), f = nr(t, n + c);
    i.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: e, minorVersion: o, substitutions: i };
}
function pr(t) {
  const { majorVersion: n, minorVersion: e, featureVariationRecords: o } = t, s = o.map((f) => ({
    csBytes: f.conditionSet ? _f(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? vf(f.featureTableSubstitution) : null
  }));
  let r = 8 + o.length * 8;
  const a = s.map((f) => {
    const u = f.csBytes ? r : 0;
    f.csBytes && (r += f.csBytes.length);
    const l = f.ftsBytes ? r : 0;
    return f.ftsBytes && (r += f.ftsBytes.length), { csOff: u, ftsOff: l };
  }), c = new v(r);
  c.uint16(n), c.uint16(e), c.uint32(o.length);
  for (const f of a)
    c.uint32(f.csOff), c.uint32(f.ftsOff);
  for (let f = 0; f < s.length; f++) {
    const u = s[f];
    u.csBytes && (c.seek(a[f].csOff), c.rawBytes(u.csBytes)), u.ftsBytes && (c.seek(a[f].ftsOff), c.rawBytes(u.ftsBytes));
  }
  return c.toArray();
}
function _f(t) {
  const n = t.conditions.map(bf);
  let o = 2 + t.conditions.length * 4;
  const s = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.conditions.length);
  for (const r of s) i.uint32(r);
  for (let r = 0; r < n.length; r++)
    i.seek(s[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function bf(t) {
  if (t.format === 1) {
    const n = new v(8);
    return n.uint16(1), n.uint16(t.axisIndex), n.int16(t.filterRangeMinValue), n.int16(t.filterRangeMaxValue), n.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function vf(t) {
  const n = t.substitutions.map(
    (r) => or(r.feature)
  );
  let o = 6 + t.substitutions.length * 6;
  const s = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.majorVersion), i.uint16(t.minorVersion), i.uint16(t.substitutions.length);
  for (let r = 0; r < t.substitutions.length; r++)
    i.uint16(t.substitutions[r].featureIndex), i.uint32(s[r]);
  for (let r = 0; r < n.length; r++)
    i.seek(s[r]), i.rawBytes(n[r]);
  return i.toArray();
}
const Af = 8, kf = 12;
function Cf(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.offset16(), i = n.offset16(), r = e > 1 || e === 1 && o >= 1 ? n.offset32() : 0, a = [s, i, r].filter(
    (c) => c > 0
  );
  return {
    majorVersion: e,
    minorVersion: o,
    horizAxis: s ? bs(t, s) : null,
    vertAxis: i ? bs(t, i) : null,
    itemVariationStore: r ? fn(
      t.slice(
        r,
        Of(t.length, r, a)
      )
    ) : null
  };
}
function Of(t, n, e) {
  return e.filter((s) => s > n).sort((s, i) => s - i)[0] ?? t;
}
function bs(t, n) {
  if (n + 4 > t.length) return null;
  const e = new T(t);
  e.seek(n);
  const o = e.offset16(), s = e.offset16(), i = o ? If(e, n + o) : null, r = s ? Df(e, n + s) : [];
  return { baseTagList: i, baseScriptList: r };
}
function If(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++)
    o.push(t.tag());
  return o;
}
function Df(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++)
    o.push({ tag: t.tag(), off: t.offset16() });
  return o.map((s) => ({
    tag: s.tag,
    ...Ef(t, n + s.off)
  }));
}
function Ef(t, n) {
  t.seek(n);
  const e = t.offset16(), o = t.offset16(), s = t.uint16(), i = [];
  for (let r = 0; r < s; r++)
    i.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: e ? Bf(t, n + e) : null,
    defaultMinMax: o ? vs(t, n + o) : null,
    langSystems: i.map((r) => ({
      tag: r.tag,
      minMax: vs(t, n + r.off)
    }))
  };
}
function Bf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = [];
  for (let i = 0; i < o; i++)
    s.push(t.offset16());
  return {
    defaultBaselineIndex: e,
    baseCoords: s.map(
      (i) => i ? _n(t, n + i) : null
    )
  };
}
function vs(t, n) {
  t.seek(n);
  const e = t.offset16(), o = t.offset16(), s = t.uint16(), i = [];
  for (let r = 0; r < s; r++)
    i.push({
      tag: t.tag(),
      minOff: t.offset16(),
      maxOff: t.offset16()
    });
  return {
    minCoord: e ? _n(t, n + e) : null,
    maxCoord: o ? _n(t, n + o) : null,
    featMinMax: i.map((r) => ({
      tag: r.tag,
      minCoord: r.minOff ? _n(t, n + r.minOff) : null,
      maxCoord: r.maxOff ? _n(t, n + r.maxOff) : null
    }))
  };
}
function _n(t, n) {
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
    const s = t.offset16();
    return {
      format: e,
      coordinate: o,
      device: s ? un(t, n + s) : null
    };
  }
  return { format: e, coordinate: o };
}
function Tf(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = n > 1 || n === 1 && e >= 1, s = As(t.horizAxis), i = As(t.vertAxis), r = o && t.itemVariationStore ? Hn(t.itemVariationStore) : [];
  let c = o ? kf : Af;
  const f = s.length ? c : 0;
  c += s.length;
  const u = i.length ? c : 0;
  c += i.length;
  const l = r.length ? c : 0;
  c += r.length;
  const g = new v(c);
  return g.uint16(n), g.uint16(e), g.offset16(f), g.offset16(u), o && g.offset32(l), g.rawBytes(s), g.rawBytes(i), g.rawBytes(r), g.toArray();
}
function As(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const n = t.baseTagList ? Mf(t.baseTagList) : [], e = Lf(t.baseScriptList ?? []);
  let s = 4;
  const i = n.length ? s : 0;
  s += n.length;
  const r = e.length ? s : 0;
  s += e.length;
  const a = new v(s);
  return a.offset16(i), a.offset16(r), a.rawBytes(n), a.rawBytes(e), a.toArray();
}
function Mf(t) {
  const n = 2 + 4 * t.length, e = new v(n);
  e.uint16(t.length);
  for (const o of t)
    e.tag(o);
  return e.toArray();
}
function Lf(t) {
  const n = 2 + 6 * t.length, e = t.map((r) => Rf(r));
  let o = n;
  const s = e.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    i.tag(t[r].tag), i.offset16(s[r]);
  for (const r of e)
    i.rawBytes(r);
  return i.toArray();
}
function Rf(t) {
  const n = zf(t.baseValues), e = ks(t.defaultMinMax), o = t.langSystems ?? [], s = o.map((l) => ks(l.minMax));
  let r = 6 + 6 * o.length;
  const a = n.length ? r : 0;
  r += n.length;
  const c = e.length ? r : 0;
  r += e.length;
  const f = s.map((l) => {
    const g = l.length ? r : 0;
    return r += l.length, g;
  }), u = new v(r);
  u.offset16(a), u.offset16(c), u.uint16(o.length);
  for (let l = 0; l < o.length; l++)
    u.tag(o[l].tag), u.offset16(f[l]);
  u.rawBytes(n), u.rawBytes(e);
  for (const l of s)
    u.rawBytes(l);
  return u.toArray();
}
function zf(t) {
  if (!t) return [];
  const n = t.baseCoords ?? [], e = 4 + 2 * n.length, o = n.map((a) => bn(a));
  let s = e;
  const i = o.map((a) => {
    const c = a.length ? s : 0;
    return s += a.length, c;
  }), r = new v(s);
  r.uint16(t.defaultBaselineIndex ?? 0), r.uint16(n.length);
  for (const a of i)
    r.offset16(a);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function ks(t) {
  if (!t) return [];
  const n = t.featMinMax ?? [], e = 6 + 8 * n.length, o = bn(t.minCoord), s = bn(t.maxCoord), i = n.map((l) => ({
    tag: l.tag,
    min: bn(l.minCoord),
    max: bn(l.maxCoord)
  }));
  let r = e;
  const a = o.length ? r : 0;
  r += o.length;
  const c = s.length ? r : 0;
  r += s.length;
  const f = i.map((l) => {
    const g = l.min.length ? r : 0;
    r += l.min.length;
    const p = l.max.length ? r : 0;
    return r += l.max.length, { minOff: g, maxOff: p };
  }), u = new v(r);
  u.offset16(a), u.offset16(c), u.uint16(n.length);
  for (let l = 0; l < n.length; l++)
    u.tag(n[l].tag), u.offset16(f[l].minOff), u.offset16(f[l].maxOff);
  u.rawBytes(o), u.rawBytes(s);
  for (const l of i)
    u.rawBytes(l.min), u.rawBytes(l.max);
  return u.toArray();
}
function bn(t) {
  if (!t) return [];
  if (t.format === 1) {
    const n = new v(4);
    return n.uint16(1), n.int16(t.coordinate), n.toArray();
  }
  if (t.format === 2) {
    const n = new v(8);
    return n.uint16(2), n.int16(t.coordinate), n.uint16(t.referenceGlyph ?? 0), n.uint16(t.baseCoordPoint ?? 0), n.toArray();
  }
  if (t.format === 3) {
    const n = t.device ? he(t.device) : [], e = n.length ? 6 : 0, o = new v(6 + n.length);
    return o.uint16(3), o.int16(t.coordinate), o.offset16(e), o.rawBytes(n), o.toArray();
  }
  return [];
}
const Cn = 5, Pt = 8;
function Kn(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function Ge(t, n) {
  t.uint8(n.height ?? 0), t.uint8(n.width ?? 0), t.int8(n.bearingX ?? 0), t.int8(n.bearingY ?? 0), t.uint8(n.advance ?? 0);
}
function Jt(t) {
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
function On(t, n) {
  t.uint8(n.height ?? 0), t.uint8(n.width ?? 0), t.int8(n.horiBearingX ?? 0), t.int8(n.horiBearingY ?? 0), t.uint8(n.horiAdvance ?? 0), t.int8(n.vertBearingX ?? 0), t.int8(n.vertBearingY ?? 0), t.uint8(n.vertAdvance ?? 0);
}
function Zo(t, n) {
  const e = new T(t), o = e.uint32(), s = n?.CBLC;
  if (!s?.sizes)
    return { version: o, data: Array.from(t.slice(4)) };
  const i = [];
  for (const r of s.sizes) {
    const a = [];
    for (const c of r.indexSubTables ?? [])
      a.push(Ff(t, e, c));
    i.push(a);
  }
  return { version: o, bitmapData: i };
}
function jo(t) {
  const n = t.version ?? 196608;
  if (t.data) {
    const o = t.data, s = new v(4 + o.length);
    return s.uint32(n), s.rawBytes(o), s.toArray();
  }
  const e = new v(4);
  return e.uint32(n), e.toArray();
}
function $e(t, n) {
  const e = t.version ?? 196608, o = t.bitmapData ?? [], s = n.sizes ?? [], i = [], r = [];
  let a = 4;
  for (let u = 0; u < s.length; u++) {
    const l = s[u].indexSubTables ?? [], g = o[u] ?? [], p = [];
    for (let h = 0; h < l.length; h++) {
      const d = l[h], x = g[h] ?? [], { bytes: m, info: y } = Vf(
        x,
        d,
        a
      );
      p.push(y), i.push(m), a += m.length;
    }
    r.push(p);
  }
  const c = a, f = new v(c);
  f.uint32(e);
  for (const u of i)
    f.rawBytes(u);
  return { bytes: f.toArray(), offsetInfo: r };
}
function Ff(t, n, e) {
  const { indexFormat: o, imageFormat: s, imageDataOffset: i } = e, r = [];
  switch (o) {
    case 1:
    case 3: {
      const a = e.sbitOffsets;
      for (let c = 0; c < a.length - 1; c++) {
        const f = i + a[c], l = i + a[c + 1] - f;
        l <= 0 ? r.push(null) : r.push(
          Jn(
            t,
            n,
            f,
            s,
            l
          )
        );
      }
      break;
    }
    case 2: {
      const a = e.lastGlyphIndex - e.firstGlyphIndex + 1, { imageSize: c } = e;
      for (let f = 0; f < a; f++) {
        const u = i + f * c;
        r.push(
          Jn(
            t,
            n,
            u,
            s,
            c
          )
        );
      }
      break;
    }
    case 4: {
      const a = e.glyphArray;
      for (let c = 0; c < a.length - 1; c++) {
        const f = i + a[c].sbitOffset, l = i + a[c + 1].sbitOffset - f;
        l <= 0 ? r.push(null) : r.push(
          Jn(
            t,
            n,
            f,
            s,
            l
          )
        );
      }
      break;
    }
    case 5: {
      const a = e.glyphIdArray.length, { imageSize: c } = e;
      for (let f = 0; f < a; f++) {
        const u = i + f * c;
        r.push(
          Jn(
            t,
            n,
            u,
            s,
            c
          )
        );
      }
      break;
    }
  }
  return r;
}
function Jn(t, n, e, o, s) {
  if (s <= 0) return null;
  n.seek(e);
  const i = (r, a) => t.slice(r, r + a);
  switch (o) {
    case 1: {
      const r = Kn(n), a = i(
        n.position,
        s - Cn
      );
      return { smallMetrics: r, imageData: a };
    }
    case 2: {
      const r = Kn(n), a = i(
        n.position,
        s - Cn
      );
      return { smallMetrics: r, imageData: a };
    }
    case 5:
      return { imageData: i(e, s) };
    case 6: {
      const r = Jt(n), a = i(
        n.position,
        s - Pt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 7: {
      const r = Jt(n), a = i(
        n.position,
        s - Pt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 8: {
      const r = Kn(n);
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
      const r = Jt(n), a = n.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: n.uint16(),
          xOffset: n.int8(),
          yOffset: n.int8()
        });
      return { bigMetrics: r, components: c };
    }
    case 17: {
      const r = Kn(n), a = n.uint32(), c = i(n.position, a);
      return { smallMetrics: r, imageData: c };
    }
    case 18: {
      const r = Jt(n), a = n.uint32(), c = i(n.position, a);
      return { bigMetrics: r, imageData: c };
    }
    case 19: {
      const r = n.uint32();
      return { imageData: i(n.position, r) };
    }
    default:
      return { imageData: i(e, s) };
  }
}
function Vf(t, n, e) {
  const { indexFormat: o, imageFormat: s } = n, i = { imageDataOffset: e }, r = t.map(
    (f) => f ? Pf(f, s) : []
  );
  switch (o) {
    case 1:
    case 3: {
      const f = [0];
      let u = 0;
      for (const l of r)
        u += l.length, f.push(u);
      i.sbitOffsets = f;
      break;
    }
    case 2:
    case 5: {
      i.imageSize = n.imageSize ?? (r.length > 0 ? r[0].length : 0);
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
      u.push({ glyphID: 0, sbitOffset: l }), i.glyphArray = u;
      break;
    }
  }
  const a = r.reduce((f, u) => f + u.length, 0), c = new v(a);
  for (const f of r)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: i };
}
function Pf(t, n) {
  switch (n) {
    case 1:
    case 2: {
      const e = t.imageData ?? [], o = new v(Cn + e.length);
      return Ge(o, t.smallMetrics ?? {}), o.rawBytes(e), o.toArray();
    }
    case 5: {
      const e = t.imageData ?? [];
      return Array.from(e);
    }
    case 6:
    case 7: {
      const e = t.imageData ?? [], o = new v(Pt + e.length);
      return On(o, t.bigMetrics ?? {}), o.rawBytes(e), o.toArray();
    }
    case 8: {
      const e = t.components ?? [], o = new v(
        Cn + 1 + 2 + e.length * 4
      );
      Ge(o, t.smallMetrics ?? {}), o.uint8(0), o.uint16(e.length);
      for (const s of e)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 9: {
      const e = t.components ?? [], o = new v(
        Pt + 2 + e.length * 4
      );
      On(o, t.bigMetrics ?? {}), o.uint16(e.length);
      for (const s of e)
        o.uint16(s.glyphID ?? 0), o.int8(s.xOffset ?? 0), o.int8(s.yOffset ?? 0);
      return o.toArray();
    }
    case 17: {
      const e = t.imageData ?? [], o = new v(Cn + 4 + e.length);
      return Ge(o, t.smallMetrics ?? {}), o.uint32(e.length), o.rawBytes(e), o.toArray();
    }
    case 18: {
      const e = t.imageData ?? [], o = new v(Pt + 4 + e.length);
      return On(o, t.bigMetrics ?? {}), o.uint32(e.length), o.rawBytes(e), o.toArray();
    }
    case 19: {
      const e = t.imageData ?? [], o = new v(4 + e.length);
      return o.uint32(e.length), o.rawBytes(e), o.toArray();
    }
    default:
      return Array.from(t.imageData ?? []);
  }
}
function Uf(t, n) {
  return Zo(t, n?.bloc ? { CBLC: n.bloc } : n);
}
function Nf(t) {
  return jo(t);
}
const dr = 48;
function Yo(t) {
  return Gf(t);
}
function on(t, n) {
  return n ? Hf(t, n) : Yf(t);
}
function Gf(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint32(), i = [], r = [];
  for (let a = 0; a < s; a++) {
    const c = n.uint32();
    n.uint32();
    const f = n.uint32(), u = n.uint32(), l = Cs(n), g = Cs(n), p = n.uint16(), h = n.uint16(), d = n.uint8(), x = n.uint8(), m = n.uint8(), y = n.int8();
    i.push({
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
  for (let a = 0; a < s; a++) {
    const { indexSubTableArrayOffset: c, numberOfIndexSubTables: f } = r[a];
    f !== 0 && (i[a].indexSubTables = $f(
      n,
      c,
      f
    ));
  }
  return { majorVersion: e, minorVersion: o, sizes: i };
}
function $f(t, n, e) {
  t.seek(n);
  const o = [];
  for (let i = 0; i < e; i++)
    o.push({
      firstGlyphIndex: t.uint16(),
      lastGlyphIndex: t.uint16(),
      indexSubtableOffset: t.uint32()
    });
  const s = [];
  for (const i of o) {
    const r = n + i.indexSubtableOffset;
    t.seek(r);
    const a = t.uint16(), c = t.uint16(), f = t.uint32(), u = {
      firstGlyphIndex: i.firstGlyphIndex,
      lastGlyphIndex: i.lastGlyphIndex,
      indexFormat: a,
      imageFormat: c,
      imageDataOffset: f
    }, l = i.lastGlyphIndex - i.firstGlyphIndex + 1;
    switch (a) {
      case 1: {
        u.sbitOffsets = t.array("uint32", l + 1);
        break;
      }
      case 2: {
        u.imageSize = t.uint32(), u.bigMetrics = Jt(t);
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
        u.imageSize = t.uint32(), u.bigMetrics = Jt(t);
        const g = t.uint32();
        u.glyphIdArray = t.array("uint16", g);
        break;
      }
    }
    s.push(u);
  }
  return s;
}
function Hf(t, n) {
  const e = t.majorVersion ?? 2, o = t.minorVersion ?? 0, s = t.sizes ?? [], i = s.map(
    (u, l) => Zf(u.indexSubTables ?? [], n[l] ?? [])
  );
  let a = 8 + s.length * dr;
  const c = [];
  for (const u of i)
    c.push(a), a += u.length;
  const f = new v(a);
  f.uint16(e), f.uint16(o), f.uint32(s.length);
  for (let u = 0; u < s.length; u++) {
    const l = s[u], g = l.indexSubTables ?? [];
    f.uint32(c[u]), f.uint32(i[u].length), f.uint32(g.length), f.uint32(l.colorRef ?? 0), ge(f, l.hori ?? {}), ge(f, l.vert ?? {}), f.uint16(l.startGlyphIndex ?? 0), f.uint16(l.endGlyphIndex ?? 0), f.uint8(l.ppemX ?? 0), f.uint8(l.ppemY ?? 0), f.uint8(l.bitDepth ?? 0), f.int8(l.flags ?? 0);
  }
  for (const u of i)
    f.rawBytes(u);
  return f.toArray();
}
function Zf(t, n) {
  const e = t.map(
    (a, c) => jf(a, n[c] ?? {})
  );
  let s = t.length * 8;
  const i = [];
  for (const a of e)
    i.push(s), s += a.length;
  const r = new v(s);
  for (let a = 0; a < t.length; a++)
    r.uint16(t[a].firstGlyphIndex), r.uint16(t[a].lastGlyphIndex), r.uint32(i[a]);
  for (const a of e)
    r.rawBytes(a);
  return r.toArray();
}
function jf(t, n) {
  const e = t.indexFormat, o = t.imageFormat, s = n.imageDataOffset ?? 0, i = 8;
  switch (e) {
    case 1: {
      const r = n.sbitOffsets ?? [], a = new v(i + r.length * 4);
      a.uint16(e), a.uint16(o), a.uint32(s);
      for (const c of r) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const r = new v(i + 4 + Pt);
      return r.uint16(e), r.uint16(o), r.uint32(s), r.uint32(t.imageSize ?? n.imageSize ?? 0), On(r, t.bigMetrics ?? {}), r.toArray();
    }
    case 3: {
      const r = n.sbitOffsets ?? [];
      let a = i + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new v(a);
      c.uint16(e), c.uint16(o), c.uint32(s);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    case 4: {
      const r = n.glyphArray ?? [], a = r.length > 0 ? r.length - 1 : 0, c = new v(i + 4 + r.length * 4);
      c.uint16(e), c.uint16(o), c.uint32(s), c.uint32(a);
      for (const f of r)
        c.uint16(f.glyphID), c.uint16(f.sbitOffset);
      return c.toArray();
    }
    case 5: {
      const r = t.glyphIdArray ?? [];
      let a = i + 4 + Pt + 4 + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new v(a);
      c.uint16(e), c.uint16(o), c.uint32(s), c.uint32(t.imageSize ?? n.imageSize ?? 0), On(c, t.bigMetrics ?? {}), c.uint32(r.length);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    default:
      throw new Error(`Unsupported index format: ${e}`);
  }
}
function Yf(t) {
  const n = t.majorVersion ?? 2, e = t.minorVersion ?? 0, o = t.sizes ?? [], s = t.data ?? [], i = 8 + o.length * dr + s.length, r = new v(i);
  r.uint16(n), r.uint16(e), r.uint32(o.length);
  for (const a of o)
    r.uint32(a.indexSubTableArrayOffset ?? 0), r.uint32(a.indexTablesSize ?? 0), r.uint32(a.numberOfIndexSubTables ?? 0), r.uint32(a.colorRef ?? 0), ge(r, a.hori ?? {}), ge(r, a.vert ?? {}), r.uint16(a.startGlyphIndex ?? 0), r.uint16(a.endGlyphIndex ?? 0), r.uint8(a.ppemX ?? 0), r.uint8(a.ppemY ?? 0), r.uint8(a.bitDepth ?? 0), r.int8(a.flags ?? 0);
  return r.rawBytes(s), r.toArray();
}
function Cs(t) {
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
function ge(t, n) {
  t.int8(n.ascender ?? 0), t.int8(n.descender ?? 0), t.uint8(n.widthMax ?? 0), t.int8(n.caretSlopeNumerator ?? 0), t.int8(n.caretSlopeDenominator ?? 0), t.int8(n.caretOffset ?? 0), t.int8(n.minOriginSB ?? 0), t.int8(n.minAdvanceSB ?? 0), t.int8(n.maxBeforeBL ?? 0), t.int8(n.minAfterBL ?? 0), t.int8(n.pad1 ?? 0), t.int8(n.pad2 ?? 0);
}
function qf(t) {
  return Yo(t);
}
function Wf(t) {
  return on(t);
}
function Xf(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = [], i = /* @__PURE__ */ new Set();
  for (let u = 0; u < o; u++) {
    const l = n.uint16(), g = n.uint16(), p = n.offset32();
    i.add(p), s.push({ platformID: l, encodingID: g, subtableOffset: p });
  }
  const r = [...i].sort((u, l) => u - l), a = r.map((u) => Kf(n, u)), c = new Map(r.map((u, l) => [u, l])), f = s.map((u) => ({
    platformID: u.platformID,
    encodingID: u.encodingID,
    subtableIndex: c.get(u.subtableOffset)
  }));
  return { version: e, encodingRecords: f, subtables: a };
}
function Kf(t, n) {
  t.seek(n);
  const e = t.uint16();
  switch (e) {
    case 0:
      return Jf(t);
    case 2:
      return Qf(t, n);
    case 4:
      return tu(t, n);
    case 6:
      return nu(t);
    case 8:
      return au(t);
    case 10:
      return cu(t);
    case 12:
      return eu(t);
    case 13:
      return ou(t);
    case 14:
      return su(t, n);
    default:
      return fu(t, n, e);
  }
}
function Jf(t) {
  t.skip(2);
  const n = t.uint16(), e = t.array("uint8", 256);
  return { format: 0, language: n, glyphIdArray: e };
}
function Qf(t, n) {
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", 256);
  let i = 0;
  for (let g = 0; g < 256; g++)
    s[g] > i && (i = s[g]);
  const r = i / 8 + 1, a = [];
  for (let g = 0; g < r; g++)
    a.push({
      firstCode: t.uint16(),
      entryCount: t.uint16(),
      idDelta: t.int16(),
      idRangeOffset: t.uint16()
    });
  const c = t.position, u = (n + e - c) / 2, l = t.array("uint16", u);
  return { format: 2, language: o, subHeaderKeys: s, subHeaders: a, glyphIdArray: l };
}
function tu(t, n) {
  const e = t.uint16(), o = t.uint16(), i = t.uint16() / 2;
  t.skip(6);
  const r = t.array("uint16", i);
  t.skip(2);
  const a = t.array("uint16", i), c = t.array("int16", i), f = t.array("uint16", i), u = t.position, l = (e - (u - n)) / 2, g = t.array("uint16", l), p = [];
  for (let h = 0; h < i; h++)
    p.push({
      endCode: r[h],
      startCode: a[h],
      idDelta: c[h],
      idRangeOffset: f[h]
    });
  return { format: 4, language: o, segments: p, glyphIdArray: g };
}
function nu(t) {
  t.skip(2);
  const n = t.uint16(), e = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { format: 6, language: n, firstCode: e, glyphIdArray: s };
}
function eu(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 12, language: n, groups: o };
}
function ou(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      glyphID: t.uint32()
    });
  return { format: 13, language: n, groups: o };
}
function su(t, n) {
  t.skip(4);
  const e = t.uint32(), o = [];
  for (let s = 0; s < e; s++) {
    const i = t.uint24(), r = t.offset32(), a = t.offset32();
    let c = null;
    if (r !== 0) {
      const u = t.position;
      c = iu(t, n + r), t.seek(u);
    }
    let f = null;
    if (a !== 0) {
      const u = t.position;
      f = ru(
        t,
        n + a
      ), t.seek(u);
    }
    o.push({ varSelector: i, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: o };
}
function iu(t, n) {
  t.seek(n);
  const e = t.uint32(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return o;
}
function ru(t, n) {
  t.seek(n);
  const e = t.uint32(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return o;
}
function au(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.bytes(8192), o = t.uint32(), s = [];
  for (let i = 0; i < o; i++)
    s.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 8, language: n, is32: e, groups: s };
}
function cu(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), o = t.uint32(), s = t.array("uint16", o);
  return { format: 10, language: n, startCharCode: e, glyphIdArray: s };
}
function fu(t, n, e) {
  let o;
  e >= 8 ? (t.skip(2), o = t.uint32()) : o = t.uint16(), t.seek(n);
  const s = t.bytes(o);
  return { format: e, _raw: s };
}
function uu(t) {
  const { version: n, encodingRecords: e, subtables: o } = t, s = o.map(lu), i = 4 + e.length * 8, r = [];
  let a = i;
  for (const u of s)
    r.push(a), a += u.length;
  const c = a, f = new v(c);
  f.uint16(n), f.uint16(e.length);
  for (const u of e)
    f.uint16(u.platformID), f.uint16(u.encodingID), f.offset32(r[u.subtableIndex]);
  for (let u = 0; u < s.length; u++)
    f.seek(r[u]), f.rawBytes(s[u]);
  return f.toArray();
}
function lu(t) {
  switch (t.format) {
    case 0:
      return hu(t);
    case 2:
      return gu(t);
    case 4:
      return pu(t);
    case 6:
      return du(t);
    case 8:
      return mu(t);
    case 10:
      return yu(t);
    case 12:
      return xu(t);
    case 13:
      return wu(t);
    case 14:
      return Su(t);
    default:
      return t._raw;
  }
}
function hu(t) {
  const e = new v(262);
  return e.uint16(0), e.uint16(262), e.uint16(t.language), e.array("uint8", t.glyphIdArray), e.toArray();
}
function gu(t) {
  const { language: n, subHeaderKeys: e, subHeaders: o, glyphIdArray: s } = t, i = 518 + o.length * 8 + s.length * 2, r = new v(i);
  r.uint16(2), r.uint16(i), r.uint16(n), r.array("uint16", e);
  for (const a of o)
    r.uint16(a.firstCode), r.uint16(a.entryCount), r.int16(a.idDelta), r.uint16(a.idRangeOffset);
  return r.array("uint16", s), r.toArray();
}
function pu(t) {
  const { language: n, segments: e, glyphIdArray: o } = t, s = e.length, i = s * 2, r = Math.floor(Math.log2(s)), a = Math.pow(2, r) * 2, c = i - a, f = 14 + s * 8 + 2 + o.length * 2, u = new v(f);
  u.uint16(4), u.uint16(f), u.uint16(n), u.uint16(i), u.uint16(a), u.uint16(r), u.uint16(c);
  for (const l of e) u.uint16(l.endCode);
  u.uint16(0);
  for (const l of e) u.uint16(l.startCode);
  for (const l of e) u.int16(l.idDelta);
  for (const l of e) u.uint16(l.idRangeOffset);
  return u.array("uint16", o), u.toArray();
}
function du(t) {
  const { language: n, firstCode: e, glyphIdArray: o } = t, s = o.length, i = 10 + s * 2, r = new v(i);
  return r.uint16(6), r.uint16(i), r.uint16(n), r.uint16(e), r.uint16(s), r.array("uint16", o), r.toArray();
}
function mu(t) {
  const { language: n, is32: e, groups: o } = t, s = 8208 + o.length * 12, i = new v(s);
  i.uint16(8), i.uint16(0), i.uint32(s), i.uint32(n), i.rawBytes(e), i.uint32(o.length);
  for (const r of o)
    i.uint32(r.startCharCode), i.uint32(r.endCharCode), i.uint32(r.startGlyphID);
  return i.toArray();
}
function yu(t) {
  const { language: n, startCharCode: e, glyphIdArray: o } = t, s = 20 + o.length * 2, i = new v(s);
  return i.uint16(10), i.uint16(0), i.uint32(s), i.uint32(n), i.uint32(e), i.uint32(o.length), i.array("uint16", o), i.toArray();
}
function xu(t) {
  const n = t.groups.length, e = 16 + n * 12, o = new v(e);
  o.uint16(12), o.uint16(0), o.uint32(e), o.uint32(t.language), o.uint32(n);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.startGlyphID);
  return o.toArray();
}
function wu(t) {
  const n = t.groups.length, e = 16 + n * 12, o = new v(e);
  o.uint16(13), o.uint16(0), o.uint32(e), o.uint32(t.language), o.uint32(n);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.glyphID);
  return o.toArray();
}
function Su(t) {
  const { varSelectorRecords: n } = t, e = n.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? _u(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? bu(c.nonDefaultUVS) : null
  }));
  let s = 10 + n.length * 11;
  const i = e.map((c) => {
    let f = 0;
    c.defaultUVSBytes && (f = s, s += c.defaultUVSBytes.length);
    let u = 0;
    return c.nonDefaultUVSBytes && (u = s, s += c.nonDefaultUVSBytes.length), { defaultUVSOffset: f, nonDefaultUVSOffset: u };
  }), r = s, a = new v(r);
  a.uint16(14), a.uint32(r), a.uint32(n.length);
  for (let c = 0; c < n.length; c++)
    a.uint24(n[c].varSelector), a.uint32(i[c].defaultUVSOffset), a.uint32(i[c].nonDefaultUVSOffset);
  for (let c = 0; c < e.length; c++)
    e[c].defaultUVSBytes && a.rawBytes(e[c].defaultUVSBytes), e[c].nonDefaultUVSBytes && a.rawBytes(e[c].nonDefaultUVSBytes);
  return a.toArray();
}
function _u(t) {
  const n = 4 + t.length * 4, e = new v(n);
  e.uint32(t.length);
  for (const o of t)
    e.uint24(o.startUnicodeValue), e.uint8(o.additionalCount);
  return e.toArray();
}
function bu(t) {
  const n = 4 + t.length * 5, e = new v(n);
  e.uint32(t.length);
  for (const o of t)
    e.uint24(o.unicodeValue), e.uint16(o.glyphID);
  return e.toArray();
}
const vn = [
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
], mr = 15, yr = 48;
function vu(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function Au(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
function ku(t, n) {
  t.seek(n);
  const e = t.uint8(), o = t.uint8(), s = e === 1 ? t.uint32() : t.uint16(), i = (o & mr) + 1, r = ((o & yr) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = vu(t, r), u = (1 << i) - 1;
    a.push({
      outerIndex: f >> i,
      innerIndex: f & u
    });
  }
  return { format: e, entryFormat: o, mapCount: s, entries: a };
}
function Cu(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = t.format ?? (e > 65535 ? 1 : 0);
  let s = 0, i = 0;
  for (const h of n)
    s = Math.max(s, h.innerIndex ?? 0), i = Math.max(i, h.outerIndex ?? 0);
  let r = 1;
  for (; (1 << r) - 1 < s && r < 16; )
    r++;
  const a = i << r | s;
  let c = 1;
  for (; c < 4 && a > (c === 1 ? 255 : c === 2 ? 65535 : 16777215); )
    c++;
  const f = t.entryFormat ?? c - 1 << 4 | r - 1, u = o === 1 ? 6 : 4, l = (f & mr) + 1, g = ((f & yr) >> 4) + 1, p = new v(u + e * g);
  p.uint8(o), p.uint8(f), o === 1 ? p.uint32(e) : p.uint16(e);
  for (let h = 0; h < e; h++) {
    const d = n[h] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << l | (d.innerIndex ?? 0) & (1 << l) - 1;
    Au(p, x, g);
  }
  return p.toArray();
}
function Ou(t, n) {
  const e = /* @__PURE__ */ new Map(), o = Iu(
    t,
    n.baseGlyphListOffset,
    e
  ), s = n.layerListOffset ? Du(t, n.layerListOffset, e) : null, i = n.clipListOffset ? Eu(t, n.clipListOffset) : null, r = n.varIndexMapOffset ? ku(t, n.varIndexMapOffset) : null;
  n.itemVariationStoreOffset && fn(
    t.bytes(0).length ? [] : []
    // unused — we re-read below
  );
  let a = null;
  if (n.itemVariationStoreOffset) {
    t.seek(n.itemVariationStoreOffset);
    const c = [];
    for (; t.position < t.length; )
      c.push(t.uint8());
    a = fn(c);
  }
  return {
    baseGlyphPaintRecords: o,
    layerPaints: s,
    clipList: i,
    varIndexMap: r,
    itemVariationStore: a
  };
}
function Iu(t, n, e) {
  t.seek(n);
  const o = t.uint32(), s = [], i = [];
  for (let r = 0; r < o; r++)
    i.push({
      glyphID: t.uint16(),
      paintOffset: t.uint32()
    });
  for (const r of i)
    s.push({
      glyphID: r.glyphID,
      paint: K(t, n + r.paintOffset, e)
    });
  return s;
}
function Du(t, n, e) {
  t.seek(n);
  const o = t.uint32(), s = [];
  for (let r = 0; r < o; r++)
    s.push(t.uint32());
  const i = [];
  for (const r of s)
    i.push(K(t, n + r, e));
  return i;
}
function Eu(t, n) {
  t.seek(n);
  const e = t.uint8(), o = t.uint32(), s = [];
  for (let r = 0; r < o; r++)
    s.push({
      startGlyphID: t.uint16(),
      endGlyphID: t.uint16(),
      clipBoxOffset: t.uint24()
    });
  const i = s.map((r) => ({
    startGlyphID: r.startGlyphID,
    endGlyphID: r.endGlyphID,
    clipBox: Bu(t, n + r.clipBoxOffset)
  }));
  return { format: e, clips: i };
}
function Bu(t, n) {
  t.seek(n);
  const e = t.uint8(), o = t.fword(), s = t.fword(), i = t.fword(), r = t.fword(), a = { format: e, xMin: o, yMin: s, xMax: i, yMax: r };
  return e === 2 && (a.varIndexBase = t.uint32()), a;
}
function qo(t, n, e) {
  t.seek(n);
  const o = t.uint8(), s = t.uint16(), i = [];
  for (let r = 0; r < s; r++) {
    const a = {
      stopOffset: t.f2dot14(),
      paletteIndex: t.uint16(),
      alpha: t.f2dot14()
    };
    e && (a.varIndexBase = t.uint32()), i.push(a);
  }
  return { extend: o, colorStops: i };
}
function Tu(t, n, e) {
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
function K(t, n, e) {
  if (e.has(n)) return e.get(n);
  t.seek(n);
  const o = t.uint8();
  let s;
  switch (o) {
    case 1:
      s = Mu(t);
      break;
    case 2:
      s = Os(t, !1);
      break;
    case 3:
      s = Os(t, !0);
      break;
    case 4:
      s = Is(t, n, !1);
      break;
    case 5:
      s = Is(t, n, !0);
      break;
    case 6:
      s = Ds(t, n, !1);
      break;
    case 7:
      s = Ds(t, n, !0);
      break;
    case 8:
      s = Es(t, n, !1);
      break;
    case 9:
      s = Es(t, n, !0);
      break;
    case 10:
      s = Lu(t, n, e);
      break;
    case 11:
      s = Ru(t);
      break;
    case 12:
      s = Bs(t, n, e, !1);
      break;
    case 13:
      s = Bs(t, n, e, !0);
      break;
    case 14:
      s = Ts(t, n, e, !1);
      break;
    case 15:
      s = Ts(t, n, e, !0);
      break;
    case 16:
      s = Ms(t, n, e, !1);
      break;
    case 17:
      s = Ms(t, n, e, !0);
      break;
    case 18:
      s = Ls(t, n, e, !1);
      break;
    case 19:
      s = Ls(t, n, e, !0);
      break;
    case 20:
      s = Rs(t, n, e, !1);
      break;
    case 21:
      s = Rs(t, n, e, !0);
      break;
    case 22:
      s = zs(t, n, e, !1);
      break;
    case 23:
      s = zs(t, n, e, !0);
      break;
    case 24:
      s = Fs(t, n, e, !1);
      break;
    case 25:
      s = Fs(t, n, e, !0);
      break;
    case 26:
      s = Vs(t, n, e, !1);
      break;
    case 27:
      s = Vs(t, n, e, !0);
      break;
    case 28:
      s = Ps(t, n, e, !1);
      break;
    case 29:
      s = Ps(t, n, e, !0);
      break;
    case 30:
      s = Us(t, n, e, !1);
      break;
    case 31:
      s = Us(t, n, e, !0);
      break;
    case 32:
      s = zu(t, n, e);
      break;
    default:
      return s = { format: o, _unknown: !0 }, e.set(n, s), s;
  }
  return s.format = o, e.set(n, s), s;
}
function Mu(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function Os(t, n) {
  const e = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return n && (e.varIndexBase = t.uint32()), e;
}
function Is(t, n, e) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return e && (s.varIndexBase = t.uint32()), s.colorLine = qo(t, n + o, e), s;
}
function Ds(t, n, e) {
  const o = t.uint24(), s = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return e && (s.varIndexBase = t.uint32()), s.colorLine = qo(t, n + o, e), s;
}
function Es(t, n, e) {
  const o = t.uint24(), s = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return e && (s.varIndexBase = t.uint32()), s.colorLine = qo(t, n + o, e), s;
}
function Lu(t, n, e) {
  const o = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: K(t, n + o, e)
  };
}
function Ru(t) {
  return { glyphID: t.uint16() };
}
function Bs(t, n, e, o) {
  const s = t.uint24(), i = t.uint24();
  return {
    paint: K(t, n + s, e),
    transform: Tu(t, n + i, o)
  };
}
function Ts(t, n, e, o) {
  const s = t.uint24(), i = {
    dx: t.fword(),
    dy: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function Ms(t, n, e, o) {
  const s = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function Ls(t, n, e, o) {
  const s = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function Rs(t, n, e, o) {
  const s = t.uint24(), i = { scale: t.f2dot14() };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function zs(t, n, e, o) {
  const s = t.uint24(), i = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function Fs(t, n, e, o) {
  const s = t.uint24(), i = { angle: t.f2dot14() };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function Vs(t, n, e, o) {
  const s = t.uint24(), i = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function Ps(t, n, e, o) {
  const s = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function Us(t, n, e, o) {
  const s = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = K(t, n + s, e), i;
}
function zu(t, n, e) {
  const o = t.uint24(), s = t.uint8(), i = t.uint24();
  return {
    sourcePaint: K(t, n + o, e),
    compositeMode: s,
    backdropPaint: K(t, n + i, e)
  };
}
function Fu(t) {
  const {
    baseGlyphPaintRecords: n,
    layerPaints: e,
    clipList: o,
    varIndexMap: s,
    itemVariationStore: i
  } = t, r = /* @__PURE__ */ new Map(), a = [];
  function c(E) {
    if (!(!E || r.has(E))) {
      r.set(E, a.length), a.push(E);
      for (const B of yo(E))
        c(B);
    }
  }
  if (n)
    for (const E of n)
      c(E.paint);
  if (e)
    for (const E of e)
      c(E);
  const f = Vu(a), u = /* @__PURE__ */ new Map();
  for (const E of f)
    u.set(E, Pu(E));
  const l = /* @__PURE__ */ new Map();
  let g = 0;
  for (const E of f)
    l.set(E, g), g += u.get(E);
  const p = g, h = n ? n.length : 0, d = 4 + h * 6, x = e ? e.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = o ? Gu(o) : [], _ = s ? Cu(s) : [], w = i ? Hn(i) : [], S = d + m + p + y.length + _.length + w.length, A = 0, b = d, D = d + m, C = D + p, k = C + y.length, I = k + _.length, O = new v(S);
  O.uint32(h);
  for (const E of n || [])
    O.uint16(E.glyphID), O.uint32(D - A + l.get(E.paint));
  if (x > 0) {
    O.uint32(x);
    for (const E of e)
      O.uint32(D - b + l.get(E));
  }
  for (const E of f)
    Uu(
      O,
      E,
      D + l.get(E),
      l,
      D
    );
  return O.rawBytes(y), O.rawBytes(_), O.rawBytes(w), {
    bodyBytes: O.toArray(),
    bglBodyOffset: A,
    llBodyOffset: x > 0 ? b : 0,
    clipBodyOffset: y.length > 0 ? C : 0,
    dimBodyOffset: _.length > 0 ? k : 0,
    ivsBodyOffset: w.length > 0 ? I : 0
  };
}
function yo(t) {
  if (!t) return [];
  const n = [];
  return t.paint && n.push(t.paint), t.sourcePaint && n.push(t.sourcePaint), t.backdropPaint && n.push(t.backdropPaint), n;
}
function Vu(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (const a of t) e.set(a, 0);
  for (const a of t)
    for (const c of yo(a))
      e.has(c) && e.set(c, e.get(c) + 1);
  const o = [];
  let s = 0;
  for (const a of t)
    e.get(a) === 0 && o.push(a);
  const i = [], r = /* @__PURE__ */ new Set();
  for (; s < o.length; ) {
    const a = o[s++];
    i.push(a), r.add(a);
    for (const c of yo(a)) {
      if (!e.has(c)) continue;
      const f = e.get(c) - 1;
      e.set(c, f), f === 0 && o.push(c);
    }
  }
  for (const a of t)
    r.has(a) || i.push(a);
  return i;
}
function Pu(t) {
  const n = vn[t.format] || 0, e = t.format;
  return e === 4 || e === 6 || e === 8 ? n + Ns(t.colorLine, !1) : e === 5 || e === 7 || e === 9 ? n + Ns(t.colorLine, !0) : e === 12 ? n + 24 : e === 13 ? n + 28 : n;
}
function Ns(t, n) {
  if (!t) return 0;
  const e = n ? 10 : 6;
  return 3 + t.colorStops.length * e;
}
function Uu(t, n, e, o, s) {
  const i = n.format;
  switch (t.uint8(i), i) {
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
      const r = vn[i];
      t.uint24(r), t.fword(n.x0), t.fword(n.y0), t.fword(n.x1), t.fword(n.y1), t.fword(n.x2), t.fword(n.y2), i === 5 && t.uint32(n.varIndexBase), He(t, n.colorLine, i === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const r = vn[i];
      t.uint24(r), t.fword(n.x0), t.fword(n.y0), t.ufword(n.radius0), t.fword(n.x1), t.fword(n.y1), t.ufword(n.radius1), i === 7 && t.uint32(n.varIndexBase), He(t, n.colorLine, i === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const r = vn[i];
      t.uint24(r), t.fword(n.centerX), t.fword(n.centerY), t.f2dot14(n.startAngle), t.f2dot14(n.endAngle), i === 9 && t.uint32(n.varIndexBase), He(t, n.colorLine, i === 9);
      break;
    }
    case 10: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.uint16(n.glyphID);
      break;
    }
    case 11:
      t.uint16(n.glyphID);
      break;
    case 12:
    // PaintTransform
    case 13: {
      const r = s + o.get(n.paint), a = vn[i];
      t.uint24(r - e), t.uint24(a), Nu(t, n.transform, i === 13);
      break;
    }
    case 14:
    // PaintTranslate
    case 15: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.fword(n.dx), t.fword(n.dy), i === 15 && t.uint32(n.varIndexBase);
      break;
    }
    case 16:
    // PaintScale
    case 17: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scaleX), t.f2dot14(n.scaleY), i === 17 && t.uint32(n.varIndexBase);
      break;
    }
    case 18:
    // PaintScaleAroundCenter
    case 19: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scaleX), t.f2dot14(n.scaleY), t.fword(n.centerX), t.fword(n.centerY), i === 19 && t.uint32(n.varIndexBase);
      break;
    }
    case 20:
    // PaintScaleUniform
    case 21: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scale), i === 21 && t.uint32(n.varIndexBase);
      break;
    }
    case 22:
    // PaintScaleUniformAroundCenter
    case 23: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scale), t.fword(n.centerX), t.fword(n.centerY), i === 23 && t.uint32(n.varIndexBase);
      break;
    }
    case 24:
    // PaintRotate
    case 25: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.angle), i === 25 && t.uint32(n.varIndexBase);
      break;
    }
    case 26:
    // PaintRotateAroundCenter
    case 27: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.angle), t.fword(n.centerX), t.fword(n.centerY), i === 27 && t.uint32(n.varIndexBase);
      break;
    }
    case 28:
    // PaintSkew
    case 29: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.xSkewAngle), t.f2dot14(n.ySkewAngle), i === 29 && t.uint32(n.varIndexBase);
      break;
    }
    case 30:
    // PaintSkewAroundCenter
    case 31: {
      const r = s + o.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.xSkewAngle), t.f2dot14(n.ySkewAngle), t.fword(n.centerX), t.fword(n.centerY), i === 31 && t.uint32(n.varIndexBase);
      break;
    }
    case 32: {
      const r = s + o.get(n.sourcePaint), a = s + o.get(n.backdropPaint);
      t.uint24(r - e), t.uint8(n.compositeMode), t.uint24(a - e);
      break;
    }
  }
}
function He(t, n, e) {
  t.uint8(n.extend), t.uint16(n.colorStops.length);
  for (const o of n.colorStops)
    t.f2dot14(o.stopOffset), t.uint16(o.paletteIndex), t.f2dot14(o.alpha), e && t.uint32(o.varIndexBase);
}
function Nu(t, n, e) {
  t.fixed(n.xx), t.fixed(n.yx), t.fixed(n.xy), t.fixed(n.yy), t.fixed(n.dx), t.fixed(n.dy), e && t.uint32(n.varIndexBase);
}
function Gu(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const n = [];
  for (const a of t.clips)
    n.push($u(a.clipBox));
  let o = 5 + t.clips.length * 7;
  const s = [];
  for (const a of n)
    s.push(o), o += a.length;
  const i = o, r = new v(i);
  r.uint8(t.format || 1), r.uint32(t.clips.length);
  for (let a = 0; a < t.clips.length; a++)
    r.uint16(t.clips[a].startGlyphID), r.uint16(t.clips[a].endGlyphID), r.uint24(s[a]);
  for (const a of n)
    r.rawBytes(a);
  return r.toArray();
}
function $u(t) {
  const n = t.format === 2 ? 13 : 9, e = new v(n);
  return e.uint8(t.format), e.fword(t.xMin), e.fword(t.yMin), e.fword(t.xMax), e.fword(t.yMax), t.format === 2 && e.uint32(t.varIndexBase), e.toArray();
}
function Hu(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint32(), i = n.uint32(), r = n.uint16(), a = [];
  if (o > 0 && s > 0) {
    n.seek(s);
    for (let u = 0; u < o; u++)
      a.push({
        glyphID: n.uint16(),
        firstLayerIndex: n.uint16(),
        numLayers: n.uint16()
      });
  }
  const c = [];
  if (r > 0 && i > 0) {
    n.seek(i);
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
    const u = n.uint32(), l = n.uint32(), g = n.uint32(), p = n.uint32(), h = n.uint32(), x = Ou(n, {
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
function Zu(t) {
  const { baseGlyphRecords: n, layerRecords: e } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const l = n.length * 6, g = e.length * 4, d = 14 + 20, x = l + g, m = d + x, y = Fu({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), _ = y.bodyBytes, w = m + y.bglBodyOffset, S = y.llBodyOffset ? m + y.llBodyOffset : 0, A = y.clipBodyOffset ? m + y.clipBodyOffset : 0, b = y.dimBodyOffset ? m + y.dimBodyOffset : 0, D = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, C = m + _.length, k = new v(C);
    k.uint16(t.version), k.uint16(n.length), k.uint32(n.length > 0 ? d : 0), k.uint32(e.length > 0 ? d + l : 0), k.uint16(e.length), k.uint32(w), k.uint32(S), k.uint32(A), k.uint32(b), k.uint32(D);
    for (const I of n)
      k.uint16(I.glyphID), k.uint16(I.firstLayerIndex), k.uint16(I.numLayers);
    for (const I of e)
      k.uint16(I.glyphID), k.uint16(I.paletteIndex);
    return k.rawBytes(_), k.toArray();
  }
  const o = 14, s = n.length > 0 ? o : 0, i = n.length * 6, r = e.length > 0 ? o + i : 0, a = e.length * 4, c = o + i + a, f = new v(c);
  f.uint16(t.version), f.uint16(n.length), f.uint32(s), f.uint32(r), f.uint16(e.length);
  for (const u of n)
    f.uint16(u.glyphID), f.uint16(u.firstLayerIndex), f.uint16(u.numLayers);
  for (const u of e)
    f.uint16(u.glyphID), f.uint16(u.paletteIndex);
  return f.toArray();
}
function ju(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint32(), a = [];
  for (let h = 0; h < s; h++)
    a.push(n.uint16());
  let c = 0, f = 0, u = 0;
  e >= 1 && (c = n.uint32(), f = n.uint32(), u = n.uint32()), n.seek(r);
  const l = [];
  for (let h = 0; h < i; h++)
    l.push({
      blue: n.uint8(),
      green: n.uint8(),
      red: n.uint8(),
      alpha: n.uint8()
    });
  const g = [];
  for (let h = 0; h < s; h++) {
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
    for (let h = 0; h < s; h++)
      p.paletteTypes.push(n.uint32());
  }
  if (e >= 1 && f !== 0) {
    n.seek(f), p.paletteLabels = [];
    for (let h = 0; h < s; h++)
      p.paletteLabels.push(n.uint16());
  }
  if (e >= 1 && u !== 0) {
    n.seek(u), p.paletteEntryLabels = [];
    for (let h = 0; h < o; h++)
      p.paletteEntryLabels.push(n.uint16());
  }
  return p;
}
function Yu(t) {
  const { version: n, numPaletteEntries: e, palettes: o } = t, s = o.length, i = [], r = [];
  for (let y = 0; y < s; y++) {
    i.push(r.length);
    for (let _ = 0; _ < e; _++)
      r.push(o[y][_]);
  }
  const a = r.length, c = 12 + s * 2, f = n >= 1 ? 12 : 0, u = c + f, l = a * 4;
  let g = u + l, p = 0, h = 0, d = 0;
  n >= 1 && t.paletteTypes && (p = g, g += s * 4), n >= 1 && t.paletteLabels && (h = g, g += s * 2), n >= 1 && t.paletteEntryLabels && (d = g, g += e * 2);
  const x = g, m = new v(x);
  m.uint16(n), m.uint16(e), m.uint16(s), m.uint16(a), m.uint32(u);
  for (let y = 0; y < s; y++)
    m.uint16(i[y]);
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
const qu = 8, Wu = 12;
function Xu(t) {
  const n = new T(t), e = n.uint32(), o = n.uint16(), s = n.uint16(), i = [];
  for (let a = 0; a < o; a++)
    i.push({
      format: n.uint32(),
      length: n.uint32(),
      offset: n.offset32()
    });
  const r = i.map((a) => {
    const c = a.offset, f = Math.min(t.length, c + a.length);
    return c <= 0 || c >= t.length || f < c ? { ...a, _raw: [] } : {
      ...a,
      _raw: Array.from(t.slice(c, f))
    };
  });
  return {
    version: e,
    flags: s,
    signatures: r
  };
}
function Ku(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, s = (t.signatures ?? []).map((c) => {
    const f = Ju(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let i = qu + s.length * Wu;
  const r = s.map((c) => {
    const f = {
      format: c.format,
      length: c.bytes.length,
      offset: c.bytes.length ? i : 0
    };
    return i += c.bytes.length, f;
  }), a = new v(i);
  a.uint32(n), a.uint16(s.length), a.uint16(e);
  for (const c of r)
    a.uint32(c.format), a.uint32(c.length), a.offset32(c.offset);
  for (const c of s)
    a.rawBytes(c.bytes);
  return a.toArray();
}
function Ju(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function Qu(t, n) {
  return Zo(t, n?.EBLC ? { CBLC: n.EBLC } : n);
}
function tl(t) {
  return jo(t);
}
function nl(t) {
  return Yo(t);
}
function el(t) {
  return on(t);
}
const xo = 28;
function ol(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = [];
  for (let i = 0; i < o; i++) {
    const r = n.position;
    s.push({
      hori: Gs(n),
      vert: Gs(n),
      substitutePpemX: n.uint8(),
      substitutePpemY: n.uint8(),
      originalPpemX: n.uint8(),
      originalPpemY: n.uint8(),
      _raw: Array.from(t.slice(r, r + xo))
    });
  }
  return { version: e, scales: s };
}
function sl(t) {
  const n = t.version ?? 131072, e = t.scales ?? [], o = new v(8 + e.length * xo);
  o.uint32(n), o.uint32(e.length);
  for (const s of e) {
    if (s._raw && s._raw.length === xo) {
      o.rawBytes(s._raw);
      continue;
    }
    $s(o, s.hori ?? {}), $s(o, s.vert ?? {}), o.uint8(s.substitutePpemX ?? 0), o.uint8(s.substitutePpemY ?? 0), o.uint8(s.originalPpemX ?? 0), o.uint8(s.originalPpemY ?? 0);
  }
  return o.toArray();
}
function Gs(t) {
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
function $s(t, n) {
  t.int8(n.ascender ?? 0), t.int8(n.descender ?? 0), t.uint8(n.widthMax ?? 0), t.int8(n.caretSlopeNumerator ?? 0), t.int8(n.caretSlopeDenominator ?? 0), t.int8(n.caretOffset ?? 0), t.int8(n.minOriginSB ?? 0), t.int8(n.minAdvanceSB ?? 0), t.int8(n.maxBeforeBL ?? 0), t.int8(n.minAfterBL ?? 0), t.int8(n.pad1 ?? 0), t.int8(n.pad2 ?? 0);
}
const Hs = 16, il = 20;
function rl(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.offset16(), i = n.uint16(), r = n.uint16(), a = n.uint16(), c = n.uint16(), f = n.uint16(), u = [];
  for (let d = 0; d < r; d++)
    n.seek(s + d * a), u.push({
      axisTag: n.tag(),
      minValue: n.fixed(),
      defaultValue: n.fixed(),
      maxValue: n.fixed(),
      flags: n.uint16(),
      axisNameID: n.uint16()
    });
  const l = [], g = s + r * a, p = 4 + r * 4, h = f >= p + 2;
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
    reserved: i,
    axisSize: a,
    instanceSize: f,
    axes: u,
    instances: l
  };
}
function al(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 2, s = t.axes ?? [], i = t.instances ?? [], r = s.length, a = il, c = 4 + r * 4, f = i.some(
    (d) => d.postScriptNameID !== void 0
  ), u = f ? c + 2 : c, l = i.length, g = Hs, p = Hs + r * a + l * u, h = new v(p);
  h.uint16(n), h.uint16(e), h.offset16(g), h.uint16(o), h.uint16(r), h.uint16(a), h.uint16(l), h.uint16(u);
  for (const d of s)
    h.tag(d.axisTag), h.fixed(d.minValue), h.fixed(d.defaultValue), h.fixed(d.maxValue), h.uint16(d.flags ?? 0), h.uint16(d.axisNameID ?? 0);
  for (const d of i) {
    h.uint16(d.subfamilyNameID ?? 0), h.uint16(d.flags ?? 0);
    for (let x = 0; x < r; x++)
      h.fixed(d.coordinates?.[x] ?? 0);
    f && h.uint16(d.postScriptNameID ?? 65535);
  }
  return h.toArray();
}
function cl(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16(), a = n.uint16();
  let c = 0;
  o >= 2 && (c = n.uint16());
  let f = 0;
  o >= 3 && (f = n.uint32());
  const u = { majorVersion: e, minorVersion: o };
  return s !== 0 && (u.glyphClassDef = Ct(n, s)), i !== 0 && (u.attachList = fl(n, i)), r !== 0 && (u.ligCaretList = ul(n, r)), a !== 0 && (u.markAttachClassDef = Ct(n, a)), c !== 0 && (u.markGlyphSetsDef = hl(
    n,
    c
  )), f !== 0 && (u.itemVarStoreOffset = f, u.itemVarStoreRaw = Array.from(
    new Uint8Array(
      new T(t).view.buffer,
      new T(t).view.byteOffset + f,
      t.length - f
    )
  )), u;
}
function fl(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", o), i = V(t, n + e), r = s.map((a) => {
    t.seek(n + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: i, attachPoints: r };
}
function ul(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", o), i = V(t, n + e), r = s.map(
    (a) => ll(t, n + a)
  );
  return { coverage: i, ligGlyphs: r };
}
function ll(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => {
    const i = n + s;
    t.seek(i);
    const r = t.uint16();
    if (r === 1)
      return { format: r, coordinate: t.int16() };
    if (r === 2)
      return { format: r, caretValuePointIndex: t.uint16() };
    if (r === 3) {
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? un(t, i + c) : null;
      return { format: r, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${r}`);
  });
}
function hl(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push(t.uint32());
  const i = s.map(
    (r) => V(t, n + r)
  );
  return { format: e, coverages: i };
}
function gl(t) {
  const { majorVersion: n, minorVersion: e } = t, o = t.glyphClassDef ? Ot(t.glyphClassDef) : null, s = t.attachList ? pl(t.attachList) : null, i = t.ligCaretList ? ml(t.ligCaretList) : null, r = t.markAttachClassDef ? Ot(t.markAttachClassDef) : null, a = e >= 2 && t.markGlyphSetsDef ? wl(t.markGlyphSetsDef) : null, c = e >= 3 && t.itemVarStoreRaw ? t.itemVarStoreRaw : null;
  let f = 12;
  e >= 2 && (f += 2), e >= 3 && (f += 4);
  let u = f;
  const l = o ? u : 0;
  o && (u += o.length);
  const g = s ? u : 0;
  s && (u += s.length);
  const p = i ? u : 0;
  i && (u += i.length);
  const h = r ? u : 0;
  r && (u += r.length);
  const d = a ? u : 0;
  a && (u += a.length);
  const x = c ? u : 0;
  c && (u += c.length);
  const m = new v(u);
  return m.uint16(n), m.uint16(e), m.uint16(l), m.uint16(g), m.uint16(p), m.uint16(h), e >= 2 && m.uint16(d), e >= 3 && m.uint32(x), o && (m.seek(l), m.rawBytes(o)), s && (m.seek(g), m.rawBytes(s)), i && (m.seek(p), m.rawBytes(i)), r && (m.seek(h), m.rawBytes(r)), a && (m.seek(d), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function pl(t) {
  const n = P(t.coverage), e = t.attachPoints.map(dl);
  let s = 4 + t.attachPoints.length * 2;
  const i = s;
  s += n.length;
  const r = e.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(i), a.uint16(t.attachPoints.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function dl(t) {
  const n = 2 + t.length * 2, e = new v(n);
  return e.uint16(t.length), e.array("uint16", t), e.toArray();
}
function ml(t) {
  const n = P(t.coverage), e = t.ligGlyphs.map(yl);
  let s = 4 + t.ligGlyphs.length * 2;
  const i = s;
  s += n.length;
  const r = e.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(i), a.uint16(t.ligGlyphs.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function yl(t) {
  const n = t.map(xl);
  let o = 2 + t.length * 2;
  const s = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.length), i.array("uint16", s);
  for (let r = 0; r < n.length; r++)
    i.seek(s[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function xl(t) {
  if (t.format === 1) {
    const n = new v(4);
    return n.uint16(1), n.int16(t.coordinate), n.toArray();
  }
  if (t.format === 2) {
    const n = new v(4);
    return n.uint16(2), n.uint16(t.caretValuePointIndex), n.toArray();
  }
  if (t.format === 3) {
    const n = t.device ? he(t.device) : null, e = 6 + (n ? n.length : 0), o = new v(e);
    return o.uint16(3), o.int16(t.coordinate), o.uint16(n ? 6 : 0), n && o.rawBytes(n), o.toArray();
  }
  throw new Error(`Unknown CaretValue format: ${t.format}`);
}
function wl(t) {
  const n = t.coverages.map(P);
  let o = 4 + t.coverages.length * 4;
  const s = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.format), i.uint16(t.coverages.length);
  for (const r of s) i.uint32(r);
  for (let r = 0; r < n.length; r++)
    i.seek(s[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function At(t) {
  let n = 0, e = t;
  for (; e; )
    n += e & 1, e >>>= 1;
  return n * 2;
}
function Qt(t, n, e) {
  if (n === 0) return null;
  const o = t.position, s = {};
  n & 1 && (s.xPlacement = t.int16()), n & 2 && (s.yPlacement = t.int16()), n & 4 && (s.xAdvance = t.int16()), n & 8 && (s.yAdvance = t.int16());
  const i = n & 16 ? t.uint16() : 0, r = n & 32 ? t.uint16() : 0, a = n & 64 ? t.uint16() : 0, c = n & 128 ? t.uint16() : 0, f = t.position, u = (l, g) => {
    const p = e + l, h = o + l;
    try {
      return un(t, p);
    } catch (d) {
      if (h !== p)
        try {
          return un(t, h);
        } catch {
        }
      const x = d instanceof Error ? d.message : String(d);
      throw new Error(
        `${x}; ValueRecord context: valueFormat=${n}, subtableOffset=${e}, valueRecordStart=${o}, offsets={xPla:${i},yPla:${r},xAdv:${a},yAdv:${c}}, field=${g}`
      );
    }
  };
  return i && (s.xPlaDevice = u(i, "xPlaDevice"), t.seek(f)), r && (s.yPlaDevice = u(r, "yPlaDevice"), t.seek(f)), a && (s.xAdvDevice = u(a, "xAdvDevice"), t.seek(f)), c && (s.yAdvDevice = u(c, "yAdvDevice"), t.seek(f)), s;
}
function ln(t, n) {
  if (n === 0) return null;
  t.seek(n);
  const e = t.uint16(), o = t.int16(), s = t.int16(), i = { format: e, xCoordinate: o, yCoordinate: s };
  if (e === 2)
    i.anchorPoint = t.uint16();
  else if (e === 3) {
    const r = t.uint16(), a = t.uint16();
    r && (i.xDevice = un(t, n + r)), a && (i.yDevice = un(t, n + a));
  }
  return i;
}
function Wo(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++) {
    const i = t.uint16(), r = t.uint16();
    o.push({ markClass: i, anchorOffset: r });
  }
  return o.map((s) => ({
    markClass: s.markClass,
    markAnchor: ln(t, n + s.anchorOffset)
  }));
}
function Sl(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16();
  let a = 0;
  o >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: o,
    scriptList: Ji(n, s),
    featureList: tr(n, i),
    lookupList: sr(n, r, xr, 9)
  };
  return a !== 0 && (c.featureVariations = gr(
    n,
    a
  )), c;
}
function xr(t, n, e) {
  switch (e) {
    case 1:
      return _l(t, n);
    case 2:
      return bl(t, n);
    case 3:
      return vl(t, n);
    case 4:
      return Al(t, n);
    case 5:
      return kl(t, n);
    case 6:
      return Cl(t, n);
    case 7:
      return rr(t, n);
    case 8:
      return fr(t, n);
    case 9:
      return Ol(t, n);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function _l(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = Qt(t, s, n), r = V(t, n + o);
    return { format: e, coverage: r, valueFormat: s, valueRecord: i };
  }
  if (e === 2) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = [];
    for (let c = 0; c < i; c++)
      r.push(Qt(t, s, n));
    const a = V(t, n + o);
    return { format: e, coverage: a, valueFormat: s, valueCount: i, valueRecords: r };
  }
  throw new Error(`Unknown SinglePos format: ${e}`);
}
function bl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), c = t.array("uint16", r).map((u) => {
      const l = n + u;
      t.seek(l);
      const g = t.uint16(), p = [];
      for (let h = 0; h < g; h++) {
        const d = t.uint16(), x = Qt(t, s, l), m = Qt(t, i, l);
        p.push({ secondGlyph: d, value1: x, value2: m });
      }
      return p;
    }), f = V(t, n + o);
    return {
      format: e,
      coverage: f,
      valueFormat1: s,
      valueFormat2: i,
      pairSets: c
    };
  }
  if (e === 2) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = t.uint16(), f = t.uint16(), u = [];
    for (let h = 0; h < c; h++) {
      const d = [];
      for (let x = 0; x < f; x++) {
        const m = Qt(t, s, n), y = Qt(t, i, n);
        d.push({ value1: m, value2: y });
      }
      u.push(d);
    }
    const l = V(t, n + o), g = Ct(t, n + r), p = Ct(t, n + a);
    return {
      format: e,
      coverage: l,
      valueFormat1: s,
      valueFormat2: i,
      classDef1: g,
      classDef2: p,
      class1Count: c,
      class2Count: f,
      class1Records: u
    };
  }
  throw new Error(`Unknown PairPos format: ${e}`);
}
function vl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown CursivePos format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = [];
  for (let c = 0; c < s; c++) {
    const f = t.uint16(), u = t.uint16();
    i.push({ entryAnchorOff: f, exitAnchorOff: u });
  }
  const r = V(t, n + o), a = i.map((c) => ({
    entryAnchor: c.entryAnchorOff ? ln(t, n + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? ln(t, n + c.exitAnchorOff) : null
  }));
  return { format: e, coverage: r, entryExitRecords: a };
}
function Al(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkBasePos format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = V(t, n + o), f = V(t, n + s), u = Wo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), g = [];
  for (let h = 0; h < l; h++) {
    const d = t.array("uint16", i);
    g.push(d);
  }
  const p = g.map(
    (h) => h.map(
      (d) => d ? ln(t, n + a + d) : null
    )
  );
  return {
    format: e,
    markCoverage: c,
    baseCoverage: f,
    markClassCount: i,
    markArray: u,
    baseArray: p
  };
}
function kl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkLigPos format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = V(t, n + o), f = V(t, n + s), u = Wo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), p = t.array("uint16", l).map((h) => {
    const d = n + a + h;
    t.seek(d);
    const x = t.uint16(), m = [];
    for (let y = 0; y < x; y++) {
      const _ = t.array("uint16", i);
      m.push(_);
    }
    return m.map(
      (y) => y.map((_) => _ ? ln(t, d + _) : null)
    );
  });
  return {
    format: e,
    markCoverage: c,
    ligatureCoverage: f,
    markClassCount: i,
    markArray: u,
    ligatureArray: p
  };
}
function Cl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkMarkPos format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = V(t, n + o), f = V(t, n + s), u = Wo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), g = [];
  for (let h = 0; h < l; h++) {
    const d = t.array("uint16", i);
    g.push(d);
  }
  const p = g.map(
    (h) => h.map(
      (d) => d ? ln(t, n + a + d) : null
    )
  );
  return {
    format: e,
    mark1Coverage: c,
    mark2Coverage: f,
    markClassCount: i,
    mark1Array: u,
    mark2Array: p
  };
}
function Ol(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionPos format: ${e}`);
  const o = t.uint16(), s = t.uint32(), i = xr(
    t,
    n + s,
    o
  );
  return { format: e, extensionLookupType: o, extensionOffset: s, subtable: i };
}
function tn(t, n, e) {
  if (!n) return [];
  const o = new v(At(n));
  return n & 1 && o.int16(t ? t.xPlacement ?? 0 : 0), n & 2 && o.int16(t ? t.yPlacement ?? 0 : 0), n & 4 && o.int16(t ? t.xAdvance ?? 0 : 0), n & 8 && o.int16(t ? t.yAdvance ?? 0 : 0), n & 16 && (t?.xPlaDevice && e.push({ field: o.position, device: t.xPlaDevice }), o.uint16(0)), n & 32 && (t?.yPlaDevice && e.push({ field: o.position, device: t.yPlaDevice }), o.uint16(0)), n & 64 && (t?.xAdvDevice && e.push({ field: o.position, device: t.xAdvDevice }), o.uint16(0)), n & 128 && (t?.yAdvDevice && e.push({ field: o.position, device: t.yAdvDevice }), o.uint16(0)), o.toArray();
}
function Bn(t) {
  if (!t) return [];
  const { format: n, xCoordinate: e, yCoordinate: o } = t;
  if (n === 1) {
    const s = new v(6);
    return s.uint16(1), s.int16(e), s.int16(o), s.toArray();
  }
  if (n === 2) {
    const s = new v(8);
    return s.uint16(2), s.int16(e), s.int16(o), s.uint16(t.anchorPoint), s.toArray();
  }
  if (n === 3) {
    const s = t.xDevice ? he(t.xDevice) : null, i = t.yDevice ? he(t.yDevice) : null;
    let a = 10;
    const c = s ? a : 0;
    s && (a += s.length);
    const f = i ? a : 0;
    i && (a += i.length);
    const u = new v(a);
    return u.uint16(3), u.int16(e), u.int16(o), u.uint16(c), u.uint16(f), s && (u.seek(c), u.rawBytes(s)), i && (u.seek(f), u.rawBytes(i)), u.toArray();
  }
  throw new Error(`Unknown Anchor format: ${n}`);
}
function Xo(t) {
  const n = t.map((r) => Bn(r.markAnchor));
  let o = 2 + t.length * 4;
  const s = n.map((r) => {
    if (!r.length) return 0;
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    i.uint16(t[r].markClass), i.uint16(s[r]);
  for (let r = 0; r < n.length; r++)
    n[r].length && (i.seek(s[r]), i.rawBytes(n[r]));
  return i.toArray();
}
function Il(t) {
  const { majorVersion: n, minorVersion: e } = t, o = Dl(t), s = Qi(o.scriptList), i = er(o.featureList), r = ir(
    o.lookupList,
    wr,
    9
  ), a = o.featureVariations ? pr(o.featureVariations) : null;
  let c = 10;
  e >= 1 && (c += 4);
  let f = c;
  const u = f;
  f += s.length;
  const l = f;
  f += i.length;
  const g = f;
  f += r.length;
  const p = a ? f : 0;
  a && (f += a.length);
  const h = new v(f);
  return h.uint16(n), h.uint16(e), h.uint16(u), h.uint16(l), h.uint16(g), e >= 1 && h.uint32(p), h.seek(u), h.rawBytes(s), h.seek(l), h.rawBytes(i), h.seek(g), h.rawBytes(r), a && (h.seek(p), h.rawBytes(a)), h.toArray();
}
function Dl(t) {
  const n = t.lookupList.lookups.map((e) => {
    if (e.lookupType !== 2 || !Array.isArray(e.subtables))
      return e;
    const o = e.subtables.flatMap((s) => s?.format !== 1 || !Array.isArray(s.pairSets) ? [s] : El(s));
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
function El(t) {
  const n = Bl(t.coverage);
  if (n.length !== t.pairSets.length)
    return [t];
  const e = At(t.valueFormat1) + At(t.valueFormat2), o = t.pairSets.map(
    (c) => 2 + c.length * (2 + e)
  ), s = o.reduce((c, f) => c + f, 0);
  if (Zs(
    t.pairSets.length,
    s
  ) <= 65535)
    return [t];
  const r = [];
  let a = 0;
  for (; a < t.pairSets.length; ) {
    let c = a, f = 0, u = !1;
    for (; c < t.pairSets.length; ) {
      const l = f + o[c], g = c - a + 1;
      if (Zs(
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
function Zs(t, n) {
  const e = 10 + t * 2, o = 4 + t * 2;
  return e + o + n;
}
function Bl(t) {
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
function wr(t, n) {
  switch (n) {
    case 1:
      return Tl(t);
    case 2:
      return Ml(t);
    case 3:
      return Ll(t);
    case 4:
      return Rl(t);
    case 5:
      return zl(t);
    case 6:
      return Vl(t);
    case 7:
      return ar(t);
    case 8:
      return lr(t);
    case 9:
      return Pl(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function Tl(t) {
  const n = P(t.coverage), e = [];
  if (t.format === 1) {
    const o = tn(
      t.valueRecord,
      t.valueFormat,
      e
    ), i = 6 + o.length, r = i + n.length, a = new v(r);
    return a.uint16(1), a.uint16(i), a.uint16(t.valueFormat), a.rawBytes(o), a.seek(i), a.rawBytes(n), a.toArray();
  }
  if (t.format === 2) {
    const o = At(t.valueFormat), s = t.valueRecords.map(
      (f) => tn(f, t.valueFormat, e)
    ), r = 8 + s.length * o, a = r + n.length, c = new v(a);
    c.uint16(2), c.uint16(r), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of s) c.rawBytes(f);
    return c.seek(r), c.rawBytes(n), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function Ml(t) {
  const n = P(t.coverage), e = [];
  if (t.format === 1) {
    const o = t.pairSets.map((f) => {
      const u = At(t.valueFormat1), l = At(t.valueFormat2), g = 2 + u + l, p = new v(2 + f.length * g);
      p.uint16(f.length);
      for (const h of f)
        p.uint16(h.secondGlyph), p.rawBytes(
          tn(h.value1, t.valueFormat1, e)
        ), p.rawBytes(
          tn(h.value2, t.valueFormat2, e)
        );
      return p.toArray();
    });
    let i = 10 + t.pairSets.length * 2;
    const r = i;
    i += n.length;
    const a = o.map((f) => {
      const u = i;
      return i += f.length, u;
    }), c = new v(i);
    c.uint16(1), c.uint16(r), c.uint16(t.valueFormat1), c.uint16(t.valueFormat2), c.uint16(t.pairSets.length), c.array("uint16", a), c.seek(r), c.rawBytes(n);
    for (let f = 0; f < o.length; f++)
      c.seek(a[f]), c.rawBytes(o[f]);
    return c.toArray();
  }
  if (t.format === 2) {
    const o = Ot(t.classDef1), s = Ot(t.classDef2), i = At(t.valueFormat1), r = At(t.valueFormat2), a = i + r;
    let u = 16 + t.class1Count * t.class2Count * a;
    const l = u;
    u += n.length;
    const g = u;
    u += o.length;
    const p = u;
    u += s.length;
    const h = new v(u);
    h.uint16(2), h.uint16(l), h.uint16(t.valueFormat1), h.uint16(t.valueFormat2), h.uint16(g), h.uint16(p), h.uint16(t.class1Count), h.uint16(t.class2Count);
    for (const d of t.class1Records)
      for (const x of d)
        h.rawBytes(
          tn(x.value1, t.valueFormat1, e)
        ), h.rawBytes(
          tn(x.value2, t.valueFormat2, e)
        );
    return h.seek(l), h.rawBytes(n), h.seek(g), h.rawBytes(o), h.seek(p), h.rawBytes(s), h.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function Ll(t) {
  const n = P(t.coverage), e = t.entryExitRecords.map((c) => ({
    entry: c.entryAnchor ? Bn(c.entryAnchor) : null,
    exit: c.exitAnchor ? Bn(c.exitAnchor) : null
  }));
  let s = 6 + t.entryExitRecords.length * 4;
  const i = s;
  s += n.length;
  const r = e.map((c) => {
    const f = c.entry ? s : 0;
    c.entry && (s += c.entry.length);
    const u = c.exit ? s : 0;
    return c.exit && (s += c.exit.length), { entryOff: f, exitOff: u };
  }), a = new v(s);
  a.uint16(1), a.uint16(i), a.uint16(t.entryExitRecords.length);
  for (const c of r)
    a.uint16(c.entryOff), a.uint16(c.exitOff);
  a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    e[c].entry && (a.seek(r[c].entryOff), a.rawBytes(e[c].entry)), e[c].exit && (a.seek(r[c].exitOff), a.rawBytes(e[c].exit));
  return a.toArray();
}
function Rl(t) {
  const n = P(t.markCoverage), e = P(t.baseCoverage), o = Xo(t.markArray), s = Sr(t.baseArray);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += o.length;
  const u = r;
  r += s.length;
  const l = new v(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(s), l.toArray();
}
function Sr(t) {
  const n = t.length > 0 ? t[0].length : 0, e = t.map((a) => a.map(Bn));
  let s = 2 + t.length * n * 2;
  const i = e.map(
    (a) => a.map((c) => {
      if (!c.length) return 0;
      const f = s;
      return s += c.length, f;
    })
  ), r = new v(s);
  r.uint16(t.length);
  for (let a = 0; a < t.length; a++)
    for (let c = 0; c < n; c++)
      r.uint16(i[a][c]);
  for (let a = 0; a < e.length; a++)
    for (let c = 0; c < n; c++)
      e[a][c].length && (r.seek(i[a][c]), r.rawBytes(e[a][c]));
  return r.toArray();
}
function zl(t) {
  const n = P(t.markCoverage), e = P(t.ligatureCoverage), o = Xo(t.markArray), s = Fl(t.ligatureArray, t.markClassCount);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += o.length;
  const u = r;
  r += s.length;
  const l = new v(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(s), l.toArray();
}
function Fl(t, n) {
  const e = t.map((a) => {
    const c = a.map((p) => p.map(Bn));
    let u = 2 + a.length * n * 2;
    const l = c.map(
      (p) => p.map((h) => {
        if (!h.length) return 0;
        const d = u;
        return u += h.length, d;
      })
    ), g = new v(u);
    g.uint16(a.length);
    for (let p = 0; p < a.length; p++)
      for (let h = 0; h < n; h++)
        g.uint16(l[p][h]);
    for (let p = 0; p < c.length; p++)
      for (let h = 0; h < n; h++)
        c[p][h].length && (g.seek(l[p][h]), g.rawBytes(c[p][h]));
    return g.toArray();
  });
  let s = 2 + t.length * 2;
  const i = e.map((a) => {
    const c = s;
    return s += a.length, c;
  }), r = new v(s);
  r.uint16(t.length), r.array("uint16", i);
  for (let a = 0; a < e.length; a++)
    r.seek(i[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function Vl(t) {
  const n = P(t.mark1Coverage), e = P(t.mark2Coverage), o = Xo(t.mark1Array), s = Sr(t.mark2Array);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += o.length;
  const u = r;
  r += s.length;
  const l = new v(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(o), l.seek(u), l.rawBytes(s), l.toArray();
}
function Pl(t) {
  const n = wr(t.subtable, t.extensionLookupType), e = 8, o = new v(e + n.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(e), o.rawBytes(n), o.toArray();
}
function Ul(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16();
  let a = 0;
  o >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: o,
    scriptList: Ji(n, s),
    featureList: tr(n, i),
    lookupList: sr(n, r, _r, 7)
  };
  return a !== 0 && (c.featureVariations = gr(
    n,
    a
  )), c;
}
function _r(t, n, e) {
  switch (e) {
    case 1:
      return Nl(t, n);
    case 2:
      return Gl(t, n);
    case 3:
      return $l(t, n);
    case 4:
      return Hl(t, n);
    case 5:
      return rr(t, n);
    case 6:
      return fr(t, n);
    case 7:
      return Zl(t, n);
    case 8:
      return jl(t, n);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function Nl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.int16(), i = V(t, n + o);
    return { format: e, coverage: i, deltaGlyphID: s };
  }
  if (e === 2) {
    const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = V(t, n + o);
    return { format: e, coverage: r, substituteGlyphIDs: i };
  }
  throw new Error(`Unknown SingleSubst format: ${e}`);
}
function Gl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MultipleSubst format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = V(t, n + o), a = i.map((c) => {
    t.seek(n + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: e, coverage: r, sequences: a };
}
function $l(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown AlternateSubst format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = V(t, n + o), a = i.map((c) => {
    t.seek(n + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: e, coverage: r, alternateSets: a };
}
function Hl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown LigatureSubst format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = V(t, n + o), a = i.map((c) => {
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
function Zl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionSubst format: ${e}`);
  const o = t.uint16(), s = t.uint32(), i = _r(
    t,
    n + s,
    o
  );
  return { format: e, extensionLookupType: o, extensionOffset: s, subtable: i };
}
function jl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1)
    throw new Error(`Unknown ReverseChainSingleSubst format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = t.array("uint16", c), u = V(t, n + o), l = i.map(
    (p) => V(t, n + p)
  ), g = a.map(
    (p) => V(t, n + p)
  );
  return {
    format: e,
    coverage: u,
    backtrackCoverages: l,
    lookaheadCoverages: g,
    substituteGlyphIDs: f
  };
}
function Yl(t) {
  const { majorVersion: n, minorVersion: e } = t, o = Qi(t.scriptList), s = er(t.featureList), i = ir(
    t.lookupList,
    br,
    7
  ), r = t.featureVariations ? pr(t.featureVariations) : null;
  let a = 10;
  e >= 1 && (a += 4);
  let c = a;
  const f = c;
  c += o.length;
  const u = c;
  c += s.length;
  const l = c;
  c += i.length;
  const g = r ? c : 0;
  r && (c += r.length);
  const p = new v(c);
  return p.uint16(n), p.uint16(e), p.uint16(f), p.uint16(u), p.uint16(l), e >= 1 && p.uint32(g), p.seek(f), p.rawBytes(o), p.seek(u), p.rawBytes(s), p.seek(l), p.rawBytes(i), r && (p.seek(g), p.rawBytes(r)), p.toArray();
}
function br(t, n) {
  switch (n) {
    case 1:
      return ql(t);
    case 2:
      return Wl(t);
    case 3:
      return Xl(t);
    case 4:
      return Kl(t);
    case 5:
      return ar(t);
    case 6:
      return lr(t);
    case 7:
      return Ql(t);
    case 8:
      return t0(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function ql(t) {
  const n = P(t.coverage);
  if (t.format === 1) {
    const s = new v(6 + n.length);
    return s.uint16(1), s.uint16(6), s.int16(t.deltaGlyphID), s.seek(6), s.rawBytes(n), s.toArray();
  }
  if (t.format === 2) {
    const e = 6 + t.substituteGlyphIDs.length * 2, o = e, s = new v(e + n.length);
    return s.uint16(2), s.uint16(o), s.uint16(t.substituteGlyphIDs.length), s.array("uint16", t.substituteGlyphIDs), s.seek(o), s.rawBytes(n), s.toArray();
  }
  throw new Error(`Unknown SingleSubst format: ${t.format}`);
}
function Wl(t) {
  const n = P(t.coverage), e = t.sequences.map((c) => {
    const f = new v(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let s = 6 + t.sequences.length * 2;
  const i = s;
  s += n.length;
  const r = e.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(1), a.uint16(i), a.uint16(t.sequences.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Xl(t) {
  const n = P(t.coverage), e = t.alternateSets.map((c) => {
    const f = new v(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let s = 6 + t.alternateSets.length * 2;
  const i = s;
  s += n.length;
  const r = e.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(1), a.uint16(i), a.uint16(t.alternateSets.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Kl(t) {
  const n = P(t.coverage), e = t.ligatureSets.map(Jl);
  let s = 6 + t.ligatureSets.length * 2;
  const i = s;
  s += n.length;
  const r = e.map((c) => {
    const f = s;
    return s += c.length, f;
  }), a = new v(s);
  a.uint16(1), a.uint16(i), a.uint16(t.ligatureSets.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Jl(t) {
  const n = t.map((r) => {
    const a = 4 + (r.componentCount - 1) * 2, c = new v(a);
    return c.uint16(r.ligatureGlyph), c.uint16(r.componentCount), c.array("uint16", r.componentGlyphIDs), c.toArray();
  });
  let o = 2 + t.length * 2;
  const s = n.map((r) => {
    const a = o;
    return o += r.length, a;
  }), i = new v(o);
  i.uint16(t.length), i.array("uint16", s);
  for (let r = 0; r < n.length; r++)
    i.seek(s[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function Ql(t) {
  const n = br(t.subtable, t.extensionLookupType), e = 8, o = new v(e + n.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(e), o.rawBytes(n), o.toArray();
}
function t0(t) {
  const n = P(t.coverage), e = t.backtrackCoverages.map(P), o = t.lookaheadCoverages.map(P);
  let i = 6 + t.backtrackCoverages.length * 2 + 2 + t.lookaheadCoverages.length * 2 + 2 + t.substituteGlyphIDs.length * 2;
  const r = i;
  i += n.length;
  const a = e.map((u) => {
    const l = i;
    return i += u.length, l;
  }), c = o.map((u) => {
    const l = i;
    return i += u.length, l;
  }), f = new v(i);
  f.uint16(1), f.uint16(r), f.uint16(t.backtrackCoverages.length), f.array("uint16", a), f.uint16(t.lookaheadCoverages.length), f.array("uint16", c), f.uint16(t.substituteGlyphIDs.length), f.array("uint16", t.substituteGlyphIDs), f.seek(r), f.rawBytes(n);
  for (let u = 0; u < e.length; u++)
    f.seek(a[u]), f.rawBytes(e[u]);
  for (let u = 0; u < o.length; u++)
    f.seek(c[u]), f.rawBytes(o[u]);
  return f.toArray();
}
const n0 = 8;
function e0(t, n) {
  const e = new T(t), o = e.uint16(), s = e.uint16(), i = e.uint32(), r = n?.maxp?.numGlyphs, a = [];
  for (let c = 0; c < s && !(e.position + i > t.length || i < 2); c++) {
    const u = e.uint8(), l = e.uint8(), g = i - 2, p = typeof r == "number" ? Math.min(r, g) : g, h = e.bytes(p), d = g - p, x = d > 0 ? e.bytes(d) : [];
    a.push({
      pixelSize: u,
      maxWidth: l,
      widths: h,
      padding: x
    });
  }
  return {
    version: o,
    numRecords: s,
    sizeDeviceRecord: i,
    records: a
  };
}
function o0(t) {
  const n = t.version ?? 0, e = t.records ?? [], o = Math.max(
    0,
    ...e.map((f) => (f.widths ?? []).length)
  ), s = s0(2 + o), i = t.sizeDeviceRecord ?? s, r = Math.max(2, i), a = n0 + r * e.length, c = new v(a);
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
function s0(t) {
  return t + (4 - t % 4) % 4;
}
const i0 = 54;
function wo(t) {
  const n = new T(t);
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
function vr(t) {
  const n = new v(i0);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fixed(t.fontRevision), n.uint32(t.checksumAdjustment), n.uint32(t.magicNumber), n.uint16(t.flags), n.uint16(t.unitsPerEm), n.longDateTime(t.created), n.longDateTime(t.modified), n.int16(t.xMin), n.int16(t.yMin), n.int16(t.xMax), n.int16(t.yMax), n.uint16(t.macStyle), n.uint16(t.lowestRecPPEM), n.int16(t.fontDirectionHint), n.int16(t.indexToLocFormat), n.int16(t.glyphDataFormat), n.toArray();
}
const r0 = 36;
function a0(t) {
  const n = new T(t);
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
function c0(t) {
  const n = new v(r0);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fword(t.ascender), n.fword(t.descender), n.fword(t.lineGap), n.ufword(t.advanceWidthMax), n.fword(t.minLeftSideBearing), n.fword(t.minRightSideBearing), n.fword(t.xMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numberOfHMetrics), n.toArray();
}
function f0(t, n) {
  const e = n.hhea.numberOfHMetrics, o = n.maxp.numGlyphs, s = new T(t), i = [];
  for (let c = 0; c < e; c++)
    i.push({
      advanceWidth: s.ufword(),
      lsb: s.fword()
    });
  const r = o - e, a = s.array("fword", r);
  return { hMetrics: i, leftSideBearings: a };
}
function u0(t) {
  const { hMetrics: n, leftSideBearings: e } = t, o = n.length * 4 + e.length * 2, s = new v(o);
  for (const i of n)
    s.ufword(i.advanceWidth), s.fword(i.lsb);
  return s.array("fword", e), s.toArray();
}
const l0 = 20, Ar = 15, kr = 48;
function h0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.offset32(), i = n.offset32(), r = n.offset32(), a = n.offset32();
  return {
    majorVersion: e,
    minorVersion: o,
    itemVariationStore: s ? fn(
      t.slice(
        s,
        Cr(t.length, s, [
          i,
          r,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: Ze(
      t,
      i,
      [s, r, a]
    ),
    lsbMapping: Ze(t, r, [
      s,
      i,
      a
    ]),
    rsbMapping: Ze(t, a, [
      s,
      i,
      r
    ])
  };
}
function Ze(t, n, e) {
  if (!n)
    return null;
  const o = Cr(t.length, n, e);
  if (o <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(n, o));
  return {
    ...g0(s),
    _raw: s
  };
}
function Cr(t, n, e) {
  return e.filter((s) => s > n).sort((s, i) => s - i)[0] ?? t;
}
function g0(t) {
  const n = new T(t), e = n.uint8(), o = n.uint8(), s = e === 1 ? n.uint32() : n.uint16(), i = (o & Ar) + 1, r = ((o & kr) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = S0(n, r);
    a.push(y0(f, i));
  }
  return {
    format: e,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function p0(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.itemVariationStore ? Hn(t.itemVariationStore) : [], s = je(
    t.advanceWidthMapping
  ), i = je(t.lsbMapping), r = je(t.rsbMapping);
  let a = l0;
  const c = o.length ? a : 0;
  a += o.length;
  const f = s.length ? a : 0;
  a += s.length;
  const u = i.length ? a : 0;
  a += i.length;
  const l = r.length ? a : 0;
  a += r.length;
  const g = new v(a);
  return g.uint16(n), g.uint16(e), g.offset32(c), g.offset32(f), g.offset32(u), g.offset32(l), g.rawBytes(o), g.rawBytes(s), g.rawBytes(i), g.rawBytes(r), g.toArray();
}
function je(t) {
  return t ? t._raw ? t._raw : d0(t) : [];
}
function d0(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = x0(n), s = t.format ?? (e > 65535 ? 1 : 0), i = t.entryFormat ?? o.entryFormat, r = (i & Ar) + 1, a = ((i & kr) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + e * a);
  f.uint8(s), f.uint8(i), s === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, g = m0(l, r);
    _0(f, g, a);
  }
  return f.toArray();
}
function m0(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function y0(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function x0(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < n && o < 16; )
    o++;
  const s = e << o | n;
  let i = 1;
  for (; i < 4 && s > w0(i); )
    i++;
  return { entryFormat: i - 1 << 4 | o - 1 };
}
function w0(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function S0(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function _0(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const b0 = 6, v0 = 6;
function A0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = [];
  for (let c = 0; c < s; c++)
    i.push({
      tag: n.tag(),
      offset: n.offset16()
    });
  const r = i.map((c) => c.offset).filter((c) => c > 0), a = i.map((c) => ({
    ...c,
    table: C0(t, c.offset, r)
  }));
  return {
    majorVersion: e,
    minorVersion: o,
    scripts: a
  };
}
function k0(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.scripts ?? [], s = o.map((c) => O0(c.table));
  let i = b0 + o.length * v0;
  const r = s.map((c) => {
    if (!c.length)
      return 0;
    const f = i;
    return i += c.length, f;
  }), a = new v(i);
  a.uint16(n), a.uint16(e), a.uint16(o.length);
  for (let c = 0; c < o.length; c++) {
    const u = (o[c].tag ?? "    ").slice(0, 4).padEnd(4, " ");
    a.tag(u), a.offset16(r[c]);
  }
  for (const c of s)
    a.rawBytes(c);
  return a.toArray();
}
function C0(t, n, e) {
  if (!n)
    return null;
  const s = e.filter((i) => i > n).sort((i, r) => i - r)[0] ?? t.length;
  return s <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, s)) };
}
function O0(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Or = 4, ce = 6, Ir = 8, fe = 8;
function I0(t) {
  const n = new T(t);
  return (t.length >= 4 ? n.uint32() : 0) === 65536 ? B0(t) : D0(t);
}
function D0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = [];
  let i = Or;
  for (let r = 0; r < o && !(i + ce > t.length); r++) {
    n.seek(i);
    const a = n.uint16(), c = n.uint16(), f = n.uint16(), u = f >> 8 & 255, l = Math.min(
      t.length,
      i + Math.max(c, ce)
    ), g = i + ce, p = Array.from(t.slice(g, l)), h = {
      version: a,
      coverage: f,
      format: u
    };
    u === 0 ? Object.assign(h, E0(p)) : h._raw = p, s.push(h), i = l;
  }
  return {
    formatVariant: "opentype",
    version: e,
    nTables: o,
    subtables: s
  };
}
function E0(t) {
  const n = new T(t);
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
  const s = o.length, i = Math.floor(
    Math.log2(Math.max(1, s))
  ), r = Math.pow(2, i) * 6, a = s * 6 - r;
  return {
    nPairs: s,
    searchRange: r,
    entrySelector: i,
    rangeShift: a,
    pairs: o
  };
}
function B0(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = [];
  let i = Ir;
  for (let r = 0; r < o && !(i + fe > t.length); r++) {
    n.seek(i);
    const a = n.uint32(), c = n.uint8(), f = n.uint8(), u = n.uint16(), l = Math.min(
      t.length,
      i + Math.max(a, fe)
    ), g = Array.from(
      t.slice(i + fe, l)
    );
    s.push({
      coverage: c,
      format: f,
      tupleIndex: u,
      _raw: g
    }), i = l;
  }
  return {
    formatVariant: "apple",
    version: e,
    nTables: o,
    subtables: s
  };
}
function T0(t) {
  return t.formatVariant === "apple" ? z0(t) : M0(t);
}
function M0(t) {
  const n = t.version ?? 0, e = t.subtables ?? [], o = e.map(
    (a) => L0(a)
  ), s = e.length, i = Or + o.reduce((a, c) => a + c.length, 0), r = new v(i);
  r.uint16(n), r.uint16(s);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function L0(t) {
  const n = t._raw ? t._raw : t.format === 0 ? R0(t) : [], e = ce + n.length, o = t.coverage ?? (t.format ?? 0) << 8, s = new v(e);
  return s.uint16(t.version ?? 0), s.uint16(e), s.uint16(o), s.rawBytes(n), s.toArray();
}
function R0(t) {
  const n = t.pairs ?? [], e = n.length, o = Math.floor(Math.log2(Math.max(1, e))), s = Math.pow(2, o) * 6, i = e * 6 - s, r = new v(8 + e * 6);
  r.uint16(e), r.uint16(t.searchRange ?? s), r.uint16(t.entrySelector ?? o), r.uint16(t.rangeShift ?? i);
  for (const a of n)
    r.uint16(a.left), r.uint16(a.right), r.int16(a.value);
  return r.toArray();
}
function z0(t) {
  const n = t.version ?? 65536, e = t.subtables ?? [], o = e.map((a) => {
    const c = a._raw ?? [], f = fe + c.length, u = new v(f);
    return u.uint32(f), u.uint8(a.coverage ?? 0), u.uint8(a.format ?? 0), u.uint16(a.tupleIndex ?? 0), u.rawBytes(c), u.toArray();
  }), s = e.length, i = Ir + o.reduce((a, c) => a + c.length, 0), r = new v(i);
  r.uint32(n), r.uint32(s);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function F0(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = n.uint32(), i = [], r = [];
  for (let a = 0; a < s; a++)
    r.push({ offset: n.uint16(), length: n.uint16() });
  for (const a of r) {
    const c = t.slice(a.offset, a.offset + a.length);
    i.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: e, flags: o, tags: i };
}
function V0(t) {
  const { version: n, flags: e, tags: o } = t, s = new TextEncoder(), i = o.map((u) => s.encode(u)), r = 12 + o.length * 4, a = r + i.reduce((u, l) => u + l.length, 0), c = new v(a);
  c.uint32(n), c.uint32(e), c.uint32(o.length);
  let f = r;
  for (const u of i)
    c.uint16(f), c.uint16(u.length), f += u.length;
  for (const u of i)
    c.rawBytes(u);
  return c.toArray();
}
function P0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.bytes(o);
  return {
    version: e,
    numGlyphs: o,
    yPels: s
  };
}
function U0(t) {
  const n = t.version ?? 0, e = t.yPels ?? [], o = t.numGlyphs ?? e.length, s = e.slice(0, o);
  for (; s.length < o; )
    s.push(0);
  const i = new v(4 + o);
  return i.uint16(n), i.uint16(o), i.rawBytes(s), i.toArray();
}
const N0 = 10;
function G0(t) {
  const n = new T(t), e = n.uint32(), o = n.offset16(), s = n.offset16(), i = n.offset16(), r = [
    o,
    s,
    i
  ].filter((a) => a > 0);
  return {
    version: e,
    mathConstants: Ye(t, o, r),
    mathGlyphInfo: Ye(t, s, r),
    mathVariants: Ye(t, i, r)
  };
}
function $0(t) {
  const n = t.version ?? 65536, e = qe(t.mathConstants), o = qe(t.mathGlyphInfo), s = qe(t.mathVariants);
  let i = N0;
  const r = e.length ? i : 0;
  i += e.length;
  const a = o.length ? i : 0;
  i += o.length;
  const c = s.length ? i : 0;
  i += s.length;
  const f = new v(i);
  return f.uint32(n), f.offset16(r), f.offset16(a), f.offset16(c), f.rawBytes(e), f.rawBytes(o), f.rawBytes(s), f.toArray();
}
function Ye(t, n, e) {
  if (!n)
    return null;
  const s = e.filter((i) => i > n).sort((i, r) => i - r)[0] ?? t.length;
  return s <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, s)) };
}
function qe(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const H0 = 6, Z0 = 32;
function j0(t) {
  const n = new T(t), e = n.uint32(), o = n.uint16(), s = { version: e, numGlyphs: o };
  return e === 65536 && (s.maxPoints = n.uint16(), s.maxContours = n.uint16(), s.maxCompositePoints = n.uint16(), s.maxCompositeContours = n.uint16(), s.maxZones = n.uint16(), s.maxTwilightPoints = n.uint16(), s.maxStorage = n.uint16(), s.maxFunctionDefs = n.uint16(), s.maxInstructionDefs = n.uint16(), s.maxStackElements = n.uint16(), s.maxSizeOfInstructions = n.uint16(), s.maxComponentElements = n.uint16(), s.maxComponentDepth = n.uint16()), s;
}
function Y0(t) {
  const n = t.version === 65536, e = n ? Z0 : H0, o = new v(e);
  return o.uint32(t.version), o.uint16(t.numGlyphs), n && (o.uint16(t.maxPoints), o.uint16(t.maxContours), o.uint16(t.maxCompositePoints), o.uint16(t.maxCompositeContours), o.uint16(t.maxZones), o.uint16(t.maxTwilightPoints), o.uint16(t.maxStorage), o.uint16(t.maxFunctionDefs), o.uint16(t.maxInstructionDefs), o.uint16(t.maxStackElements), o.uint16(t.maxSizeOfInstructions), o.uint16(t.maxComponentElements), o.uint16(t.maxComponentDepth)), o.toArray();
}
function q0(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const n = new T(t), e = t.length >= 2 ? n.uint16() : 0, o = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: e,
    data: o
  };
}
function W0(t) {
  const n = t.version ?? 0, e = t.data ?? [], o = new v(2 + e.length);
  return o.uint16(n), o.rawBytes(e), o.toArray();
}
const Dr = 16, X0 = 12;
function K0(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = n.uint32(), i = n.uint32(), r = [];
  for (let a = 0; a < i; a++) {
    const c = n.tag(), f = n.uint32(), u = n.uint32(), l = f, g = Math.min(t.length, l + u), p = l < Dr || l >= t.length || g < l ? [] : Array.from(t.slice(l, g));
    r.push({ tag: c, dataOffset: f, dataLength: u, data: p });
  }
  return {
    version: e,
    flags: o,
    reserved: s,
    dataMaps: r
  };
}
function J0(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, o = t.reserved ?? 0, i = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let r = Dr + i.length * X0;
  const a = i.map((f) => {
    const u = r, l = f.data.length;
    return r += l, {
      tag: f.tag,
      dataOffset: u,
      dataLength: l,
      data: f.data
    };
  }), c = new v(r);
  c.uint32(n), c.uint32(e), c.uint32(o), c.uint32(a.length);
  for (const f of a)
    c.tag(f.tag), c.uint32(f.dataOffset), c.uint32(f.dataLength);
  for (const f of a)
    c.rawBytes(f.data);
  return c.toArray();
}
const So = 12, nn = 8;
function Q0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16(), a = n.offset16(), c = [];
  for (let u = 0; u < r; u++) {
    const l = So + u * i;
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
    i > nn && (g._extra = n.bytes(i - nn)), c.push(g);
  }
  const f = a > 0 && a < t.length ? fn(t.slice(a)) : null;
  return {
    majorVersion: e,
    minorVersion: o,
    reserved: s,
    valueRecordSize: i,
    valueRecords: c,
    itemVariationStore: f
  };
}
function th(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 0, s = [...t.valueRecords ?? []].sort(
    (p, h) => nh(p.valueTag, h.valueTag)
  ), i = t.valueRecordSize ?? nn, r = s.reduce((p, h) => {
    const d = h._extra?.length ?? 0;
    return Math.max(p, nn + d);
  }, nn), a = Math.max(
    i,
    r
  ), c = s.length, f = t.itemVariationStore ? Hn(t.itemVariationStore) : [], u = f.length > 0 || c > 0 ? So + c * a : 0, l = u > 0 ? u + f.length : So, g = new v(l);
  g.uint16(n), g.uint16(e), g.uint16(o), g.uint16(a), g.uint16(c), g.offset16(u);
  for (const p of s) {
    g.tag(p.valueTag ?? "    "), g.uint16(p.deltaSetOuterIndex ?? 0), g.uint16(p.deltaSetInnerIndex ?? 0);
    const h = p._extra ?? [];
    g.rawBytes(h);
    const d = a - nn - h.length;
    d > 0 && g.rawBytes(new Array(d).fill(0));
  }
  return g.rawBytes(f), g.toArray();
}
function nh(t, n) {
  const e = t ?? "    ", o = n ?? "    ";
  for (let s = 0; s < 4; s++) {
    const i = e.charCodeAt(s) - o.charCodeAt(s);
    if (i !== 0)
      return i;
  }
  return 0;
}
const _o = [
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
], Ko = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  Ko.set(t, t);
for (let t = 0; t < _o.length; t++)
  Ko.set(_o[t], 128 + t);
function eh(t, n, e) {
  return n === 0 || n === 3 ? bo(t) : n === 1 && e === 0 ? sh(t) : t.length % 2 === 0 ? bo(t) : "0x:" + t.map((o) => o.toString(16).padStart(2, "0")).join("");
}
function oh(t, n, e) {
  if (t.startsWith("0x:")) {
    const o = t.slice(3), s = [];
    for (let i = 0; i < o.length; i += 2)
      s.push(parseInt(o.slice(i, i + 2), 16));
    return s;
  }
  return n === 0 || n === 3 ? vo(t) : n === 1 && e === 0 ? ih(t) : vo(t);
}
function bo(t) {
  const n = [];
  for (let e = 0; e + 1 < t.length; e += 2) {
    const o = t[e] << 8 | t[e + 1];
    n.push(o);
  }
  return String.fromCharCode(...n);
}
function vo(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const o = t.charCodeAt(e);
    n.push(o >> 8 & 255, o & 255);
  }
  return n;
}
function sh(t) {
  return t.map((n) => n < 128 ? String.fromCharCode(n) : String.fromCharCode(_o[n - 128])).join("");
}
function ih(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const o = t.charCodeAt(e), s = Ko.get(o);
    n.push(s !== void 0 ? s : 63);
  }
  return n;
}
function rh(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = [];
  for (let f = 0; f < o; f++)
    i.push({
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
        s + g,
        s + g + l
      );
      r.push({
        tag: bo(p)
      });
    }
  }
  const a = i.map((f) => {
    const u = t.slice(
      s + f.stringOffset,
      s + f.stringOffset + f.length
    );
    return {
      platformID: f.platformID,
      encodingID: f.encodingID,
      languageID: f.languageID,
      nameID: f.nameID,
      value: eh(u, f.platformID, f.encodingID)
    };
  }), c = { version: e, names: a };
  return e === 1 && r.length > 0 && (c.langTagRecords = r), c;
}
function ah(t) {
  const { version: n, names: e, langTagRecords: o = [] } = t, s = e.map((w) => ({
    platformID: w.platformID,
    encodingID: w.encodingID,
    languageID: w.languageID,
    nameID: w.nameID,
    bytes: oh(w.value, w.platformID, w.encodingID)
  })), i = o.map((w) => vo(w.tag)), r = 6, a = 12, u = n === 1 ? (n === 1 ? 2 : 0) + o.length * 4 : 0, l = r + s.length * a + u, g = [];
  let p = 0;
  const h = /* @__PURE__ */ new Map();
  function d(w) {
    const S = w.join(",");
    if (h.has(S))
      return h.get(S);
    const A = p;
    return h.set(S, A), g.push(w), p += w.length, A;
  }
  const x = s.map((w) => ({
    ...w,
    stringOffset: d(w.bytes),
    stringLength: w.bytes.length
  })), m = i.map((w) => ({
    stringOffset: d(w),
    stringLength: w.length
  })), y = l + p, _ = new v(y);
  _.uint16(n), _.uint16(s.length), _.uint16(l);
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
const Er = 78, Br = 86, Tr = 96, Mr = 100;
function ch(t) {
  const n = new T(t), e = t.length, o = {};
  return o.version = n.uint16(), o.xAvgCharWidth = n.fword(), o.usWeightClass = n.uint16(), o.usWidthClass = n.uint16(), o.fsType = n.uint16(), o.ySubscriptXSize = n.fword(), o.ySubscriptYSize = n.fword(), o.ySubscriptXOffset = n.fword(), o.ySubscriptYOffset = n.fword(), o.ySuperscriptXSize = n.fword(), o.ySuperscriptYSize = n.fword(), o.ySuperscriptXOffset = n.fword(), o.ySuperscriptYOffset = n.fword(), o.yStrikeoutSize = n.fword(), o.yStrikeoutPosition = n.fword(), o.sFamilyClass = n.int16(), o.panose = n.bytes(10), o.ulUnicodeRange1 = n.uint32(), o.ulUnicodeRange2 = n.uint32(), o.ulUnicodeRange3 = n.uint32(), o.ulUnicodeRange4 = n.uint32(), o.achVendID = n.tag(), o.fsSelection = n.uint16(), o.usFirstCharIndex = n.uint16(), o.usLastCharIndex = n.uint16(), e < Er || (o.sTypoAscender = n.fword(), o.sTypoDescender = n.fword(), o.sTypoLineGap = n.fword(), o.usWinAscent = n.ufword(), o.usWinDescent = n.ufword(), o.version < 1 || e < Br) || (o.ulCodePageRange1 = n.uint32(), o.ulCodePageRange2 = n.uint32(), o.version < 2 || e < Tr) || (o.sxHeight = n.fword(), o.sCapHeight = n.fword(), o.usDefaultChar = n.uint16(), o.usBreakChar = n.uint16(), o.usMaxContext = n.uint16(), o.version < 5 || e < Mr) || (o.usLowerOpticalPointSize = n.uint16(), o.usUpperOpticalPointSize = n.uint16()), o;
}
function fh(t) {
  const n = t.version;
  let e;
  n >= 5 ? e = Mr : n >= 2 ? e = Tr : n >= 1 ? e = Br : e = t.sTypoAscender !== void 0 ? Er : 68;
  const o = new v(e);
  return o.uint16(n).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), e <= 68 || (o.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), n < 1) || (o.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), n < 2) || (o.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), n < 5) || o.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), o.toArray();
}
const uh = 54;
function lh(t) {
  const n = new T(t);
  return {
    version: n.uint32(),
    fontNumber: n.uint32(),
    pitch: n.uint16(),
    xHeight: n.uint16(),
    style: n.uint16(),
    typeFamily: n.uint16(),
    capHeight: n.uint16(),
    symbolSet: n.uint16(),
    typeface: We(n.bytes(16)),
    characterComplement: We(n.bytes(8)),
    fileName: We(n.bytes(6)),
    strokeWeight: n.int8(),
    widthType: n.int8(),
    serifStyle: n.uint8(),
    reserved: n.uint8()
  };
}
function hh(t) {
  const n = new v(uh);
  return n.uint32(t.version ?? 65536), n.uint32(t.fontNumber ?? 0), n.uint16(t.pitch ?? 0), n.uint16(t.xHeight ?? 0), n.uint16(t.style ?? 0), n.uint16(t.typeFamily ?? 0), n.uint16(t.capHeight ?? 0), n.uint16(t.symbolSet ?? 0), n.rawBytes(Xe(t.typeface ?? "", 16)), n.rawBytes(Xe(t.characterComplement ?? "", 8)), n.rawBytes(Xe(t.fileName ?? "", 6)), n.int8(t.strokeWeight ?? 0), n.int8(t.widthType ?? 0), n.uint8(t.serifStyle ?? 0), n.uint8(t.reserved ?? 0), n.toArray();
}
function We(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function Xe(t, n) {
  const e = new Array(n).fill(0);
  for (let o = 0; o < n && o < t.length; o++) {
    const s = t.charCodeAt(o);
    e[o] = s >= 0 && s <= 127 ? s : 63;
  }
  return e;
}
const Jo = 32, Ao = [
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
], Lr = new Map(
  Ao.map((t, n) => [t, n])
);
function gh(t) {
  const n = new T(t), e = n.uint32(), o = n.fixed(), s = n.fword(), i = n.fword(), r = n.uint32(), a = n.uint32(), c = n.uint32(), f = n.uint32(), u = n.uint32(), l = {
    version: e,
    italicAngle: o,
    underlinePosition: s,
    underlineThickness: i,
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
    const m = p.map((y) => y < 258 ? Ao[y] : x[y - 258]);
    return l.glyphNames = m, l;
  }
  if (e === 151552) {
    const g = n.uint16(), h = n.array("int8", g).map(
      (d, x) => Ao[x + d]
    );
    return l.glyphNames = h, l;
  }
  return l;
}
function ph(t) {
  const { version: n } = t;
  return n === 65536 || n === 196608 ? js(t) : n === 131072 ? dh(t) : n === 151552 ? mh(t) : js(t);
}
function js(t) {
  const n = new v(Jo);
  return n.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), n.toArray();
}
function dh(t) {
  const { glyphNames: n } = t, e = n.length, o = [], s = [], i = /* @__PURE__ */ new Map();
  for (const f of n) {
    const u = Lr.get(f);
    u !== void 0 ? o.push(u) : (i.has(f) || (i.set(f, s.length), s.push(f)), o.push(258 + i.get(f)));
  }
  let r = 0;
  for (const f of s)
    r += 1 + f.length;
  const a = Jo + 2 + e * 2 + r, c = new v(a);
  c.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), c.uint16(e);
  for (const f of o)
    c.uint16(f);
  for (const f of s) {
    c.uint8(f.length);
    for (let u = 0; u < f.length; u++)
      c.uint8(f.charCodeAt(u));
  }
  return c.toArray();
}
function mh(t) {
  const { glyphNames: n } = t, e = n.length, o = Jo + 2 + e, s = new v(o);
  s.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), s.uint16(e);
  for (let i = 0; i < e; i++) {
    const r = n[i], c = Lr.get(r) - i;
    s.int8(c);
  }
  return s.toArray();
}
function yh(t, n) {
  const e = new T(t), o = e.uint16(), s = e.uint16(), i = e.uint32(), r = e.array("uint32", i);
  let a = n?.maxp?.numGlyphs;
  const c = [];
  for (let f = 0; f < i; f++) {
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
      const w = e.int16(), S = e.int16(), A = e.tag(), b = _ > 8 ? t.slice(m + 8, y) : [];
      d.push({ originOffsetX: w, originOffsetY: S, graphicType: A, imageData: b });
    }
    c.push({ ppem: g, ppi: p, glyphs: d });
  }
  return { version: o, flags: s, strikes: c };
}
function xh(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, o = t.strikes ?? [], s = o.map((f) => f._raw ? f._raw : wh(f));
  let r = 8 + o.length * 4;
  const a = [];
  for (const f of s)
    a.push(r), r += f.length;
  const c = new v(r);
  c.uint16(n), c.uint16(e), c.uint32(o.length);
  for (const f of a)
    c.uint32(f);
  for (const f of s)
    c.rawBytes(f);
  return c.toArray();
}
function wh(t) {
  const n = t.glyphs ?? [], e = n.length, o = n.map((u) => {
    if (!u) return [];
    const l = u.imageData ?? [], g = new v(8 + l.length);
    return g.int16(u.originOffsetX ?? 0), g.int16(u.originOffsetY ?? 0), g.tag(u.graphicType ?? "png "), g.rawBytes(l), g.toArray();
  });
  let r = 4 + (e + 1) * 4;
  const a = [];
  for (const u of o)
    a.push(r), r += u.length;
  a.push(r);
  const c = r, f = new v(c);
  f.uint16(t.ppem ?? 0), f.uint16(t.ppi ?? 0);
  for (const u of a)
    f.uint32(u);
  for (const u of o)
    f.rawBytes(u);
  return f.toArray();
}
const Sh = 18, Rr = 20, en = 8;
function _h(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.offset32(), a = n.uint16(), c = n.offset32();
  let f;
  o >= 1 && t.length >= Rr && (f = n.uint16());
  const u = [];
  if (i > 0 && r > 0)
    for (let h = 0; h < i; h++) {
      n.seek(r + h * s);
      const d = {
        axisTag: n.tag(),
        axisNameID: n.uint16(),
        axisOrdering: n.uint16()
      };
      s > en && (d._extra = n.bytes(s - en)), u.push(d);
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
    g.push(bh(t, x, m));
  }
  const p = {
    majorVersion: e,
    minorVersion: o,
    designAxisSize: s,
    designAxes: u,
    axisValues: g
  };
  return f !== void 0 && (p.elidedFallbackNameID = f), p;
}
function bh(t, n, e) {
  const o = new T(t);
  o.seek(n);
  const s = o.uint16();
  switch (s) {
    case 1:
      return {
        format: s,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        value: o.fixed()
      };
    case 2:
      return {
        format: s,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        nominalValue: o.fixed(),
        rangeMinValue: o.fixed(),
        rangeMaxValue: o.fixed()
      };
    case 3:
      return {
        format: s,
        axisIndex: o.uint16(),
        flags: o.uint16(),
        valueNameID: o.uint16(),
        value: o.fixed(),
        linkedValue: o.fixed()
      };
    case 4: {
      const i = o.uint16(), r = o.uint16(), a = o.uint16(), c = [];
      for (let f = 0; f < i; f++)
        c.push({
          axisIndex: o.uint16(),
          value: o.fixed()
        });
      return {
        format: s,
        axisCount: i,
        flags: r,
        valueNameID: a,
        axisValues: c
      };
    }
    default:
      return {
        format: s,
        _raw: Array.from(t.slice(n, e))
      };
  }
}
function vh(t) {
  const n = t.majorVersion ?? 1;
  let e = t.minorVersion ?? 2;
  const o = t.designAxes ?? [], s = t.axisValues ?? [], i = t.designAxisSize ?? en, r = o.reduce((A, b) => {
    const D = b._extra?.length ?? 0;
    return Math.max(A, en + D);
  }, en), a = Math.max(
    i,
    r
  ), c = e >= 1 || t.elidedFallbackNameID !== void 0;
  c && e === 0 && (e = 1);
  const f = c ? Rr : Sh, u = o.length, l = s.length, g = u > 0 ? f : 0, p = u * a, h = l > 0 ? f + p : 0, d = l * 2, x = s.map(
    (A) => Ah(A)
  );
  let m = d;
  const y = x.map((A) => {
    const b = m;
    return m += A.length, b;
  }), _ = x.reduce(
    (A, b) => A + b.length,
    0
  ), w = f + p + d + _, S = new v(w);
  S.uint16(n), S.uint16(e), S.uint16(a), S.uint16(u), S.offset32(g), S.uint16(l), S.offset32(h), c && S.uint16(t.elidedFallbackNameID ?? 2);
  for (const A of o) {
    S.tag(A.axisTag), S.uint16(A.axisNameID ?? 0), S.uint16(A.axisOrdering ?? 0);
    const b = A._extra ?? [];
    S.rawBytes(b);
    const D = a - en - b.length;
    D > 0 && S.rawBytes(new Array(D).fill(0));
  }
  for (const A of y)
    S.offset16(A);
  for (const A of x)
    S.rawBytes(A);
  return S.toArray();
}
function Ah(t) {
  if (t._raw)
    return t._raw;
  switch (t.format) {
    case 1: {
      const n = new v(12);
      return n.uint16(1), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.value ?? 0), n.toArray();
    }
    case 2: {
      const n = new v(20);
      return n.uint16(2), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.nominalValue ?? 0), n.fixed(t.rangeMinValue ?? 0), n.fixed(t.rangeMaxValue ?? 0), n.toArray();
    }
    case 3: {
      const n = new v(16);
      return n.uint16(3), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.value ?? 0), n.fixed(t.linkedValue ?? 0), n.toArray();
    }
    case 4: {
      const n = t.axisValues ?? [], e = t.axisCount ?? n.length, o = new v(8 + e * 6);
      o.uint16(4), o.uint16(e), o.uint16(t.flags ?? 0), o.uint16(t.valueNameID ?? 0);
      for (let s = 0; s < e; s++) {
        const i = n[s] ?? { axisIndex: 0, value: 0 };
        o.uint16(i.axisIndex ?? 0), o.fixed(i.value ?? 0);
      }
      return o.toArray();
    }
    default:
      throw new Error(
        `Unsupported STAT axis value format: ${t.format}`
      );
  }
}
function kh(t) {
  const n = new T(t), e = n.uint16(), o = n.uint32();
  n.uint32(), n.seek(o);
  const s = n.uint16(), i = [];
  for (let u = 0; u < s; u++)
    i.push({
      startGlyphID: n.uint16(),
      endGlyphID: n.uint16(),
      svgDocOffset: n.uint32(),
      svgDocLength: n.uint32()
    });
  const r = new TextDecoder("utf-8"), a = /* @__PURE__ */ new Map(), c = [];
  for (const u of i) {
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
  for (const u of i) {
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
function Ch(t) {
  const { version: n, documents: e, entries: o } = t, s = new TextEncoder(), i = e.map((h) => h.compressed ? h.data instanceof Uint8Array ? Array.from(h.data) : h.data : Array.from(s.encode(h.text))), a = 10, c = o.length;
  let u = 2 + c * 12;
  const l = [];
  for (let h = 0; h < i.length; h++) {
    const d = i[h];
    l.push({ offset: u, length: d.length }), u += d.length;
  }
  const g = a + u, p = new v(g);
  p.uint16(n), p.uint32(a), p.uint32(0), p.uint16(c);
  for (const h of o) {
    const d = l[h.documentIndex];
    p.uint16(h.startGlyphID), p.uint16(h.endGlyphID), p.uint32(d.offset), p.uint32(d.length);
  }
  for (const h of i)
    for (const d of h)
      p.uint8(d);
  return p.toArray();
}
const Oh = 6, Ih = 4, Dh = 2, zr = 6;
function Eh(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = [];
  for (let l = 0; l < s; l++)
    i.push({
      bCharSet: n.uint8(),
      xRatio: n.uint8(),
      yStartRatio: n.uint8(),
      yEndRatio: n.uint8()
    });
  const r = [];
  for (let l = 0; l < s; l++)
    r.push(n.offset16());
  const a = [...new Set(r)].sort((l, g) => l - g), c = a.map((l) => Th(t, l)), f = new Map(
    a.map((l, g) => [l, g])
  ), u = i.map((l, g) => ({
    ...l,
    groupIndex: f.get(r[g]) ?? 0
  }));
  return {
    version: e,
    numRecs: o,
    numRatios: s,
    ratios: u,
    groups: c
  };
}
function Bh(t) {
  const n = t.version ?? 0, e = t.ratios ?? [], o = t.groups ?? [], s = o.map((u) => Mh(u)), i = t.numRecs ?? Math.max(0, ...o.map((u) => (u.entries ?? []).length)), r = e.length;
  let a = Oh + r * Ih + r * Dh;
  const c = s.map((u) => {
    const l = a;
    return a += u.length, l;
  }), f = new v(a);
  f.uint16(n), f.uint16(i), f.uint16(r);
  for (const u of e)
    f.uint8(u.bCharSet ?? 0), f.uint8(u.xRatio ?? 0), f.uint8(u.yStartRatio ?? 0), f.uint8(u.yEndRatio ?? 0);
  for (const u of e) {
    const l = u.groupIndex ?? 0, g = c[l] ?? 0;
    f.offset16(g);
  }
  for (const u of s)
    f.rawBytes(u);
  return f.toArray();
}
function Th(t, n) {
  if (!n || n >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const e = new T(t, n), o = e.uint16(), s = e.uint8(), i = e.uint8(), r = [];
  for (let a = 0; a < o && !(e.position + zr > t.length); a++)
    r.push({
      yPelHeight: e.uint16(),
      yMax: e.int16(),
      yMin: e.int16()
    });
  return { recs: o, startsz: s, endsz: i, entries: r };
}
function Mh(t) {
  const n = t.entries ?? [], e = t.recs ?? n.length, o = n.slice(0, e);
  for (; o.length < e; )
    o.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const s = new v(4 + e * zr);
  s.uint16(e), s.uint8(t.startsz ?? 0), s.uint8(t.endsz ?? 0);
  for (const i of o)
    s.uint16(i.yPelHeight ?? 0), s.int16(i.yMax ?? 0), s.int16(i.yMin ?? 0);
  return s.toArray();
}
const Lh = 36;
function Rh(t) {
  const n = new T(t);
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
function zh(t) {
  const n = new v(Lh);
  return n.uint32(t.version), n.fword(t.vertTypoAscender), n.fword(t.vertTypoDescender), n.fword(t.vertTypoLineGap), n.ufword(t.advanceHeightMax), n.fword(t.minTopSideBearing), n.fword(t.minBottomSideBearing), n.fword(t.yMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numOfLongVerMetrics), n.toArray();
}
function Fh(t, n) {
  const e = n.vhea.numOfLongVerMetrics, o = n.maxp.numGlyphs, s = new T(t), i = [];
  for (let c = 0; c < e; c++)
    i.push({
      advanceHeight: s.ufword(),
      topSideBearing: s.fword()
    });
  const r = o - e, a = s.array("fword", r);
  return { vMetrics: i, topSideBearings: a };
}
function Vh(t) {
  const { vMetrics: n, topSideBearings: e } = t, o = n.length * 4 + e.length * 2, s = new v(o);
  for (const i of n)
    s.ufword(i.advanceHeight), s.fword(i.topSideBearing);
  return s.array("fword", e), s.toArray();
}
const Ph = 24, Fr = 15, Vr = 48;
function Uh(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.offset32(), i = n.offset32(), r = n.offset32(), a = n.offset32(), c = n.offset32(), f = [
    s,
    i,
    r,
    a,
    c
  ];
  return {
    majorVersion: e,
    minorVersion: o,
    itemVariationStore: s ? fn(
      t.slice(
        s,
        Pr(
          t.length,
          s,
          f
        )
      )
    ) : null,
    advanceHeightMapping: Qn(
      t,
      i,
      f
    ),
    tsbMapping: Qn(
      t,
      r,
      f
    ),
    bsbMapping: Qn(
      t,
      a,
      f
    ),
    vOrgMapping: Qn(
      t,
      c,
      f
    )
  };
}
function Qn(t, n, e) {
  if (!n)
    return null;
  const o = Pr(t.length, n, e);
  if (o <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(n, o));
  return {
    ...Nh(s),
    _raw: s
  };
}
function Pr(t, n, e) {
  return e.filter((s) => s > n).sort((s, i) => s - i)[0] ?? t;
}
function Nh(t) {
  const n = new T(t), e = n.uint8(), o = n.uint8(), s = e === 1 ? n.uint32() : n.uint16(), i = (o & Fr) + 1, r = ((o & Vr) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = qh(n, r);
    a.push(Zh(f, i));
  }
  return {
    format: e,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function Gh(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.itemVariationStore ? Hn(t.itemVariationStore) : [], s = te(
    t.advanceHeightMapping
  ), i = te(t.tsbMapping), r = te(t.bsbMapping), a = te(t.vOrgMapping);
  let c = Ph;
  const f = o.length ? c : 0;
  c += o.length;
  const u = s.length ? c : 0;
  c += s.length;
  const l = i.length ? c : 0;
  c += i.length;
  const g = r.length ? c : 0;
  c += r.length;
  const p = a.length ? c : 0;
  c += a.length;
  const h = new v(c);
  return h.uint16(n), h.uint16(e), h.offset32(f), h.offset32(u), h.offset32(l), h.offset32(g), h.offset32(p), h.rawBytes(o), h.rawBytes(s), h.rawBytes(i), h.rawBytes(r), h.rawBytes(a), h.toArray();
}
function te(t) {
  return t ? t._raw ? t._raw : $h(t) : [];
}
function $h(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = jh(n), s = t.format ?? (e > 65535 ? 1 : 0), i = t.entryFormat ?? o.entryFormat, r = (i & Fr) + 1, a = ((i & Vr) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + e * a);
  f.uint8(s), f.uint8(i), s === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, g = Hh(l, r);
    Wh(f, g, a);
  }
  return f.toArray();
}
function Hh(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function Zh(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function jh(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < n && o < 16; )
    o++;
  const s = e << o | n;
  let i = 1;
  for (; i < 4 && s > Yh(i); )
    i++;
  return { entryFormat: i - 1 << 4 | o - 1 };
}
function Yh(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function qh(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function Wh(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const Oe = 32768, Ie = 4095, De = 32768, Ee = 16384, Be = 8192, Xh = 4095, Ur = 128, Kh = 127, Nr = 128, Gr = 64, Jh = 63;
function pe(t) {
  const n = t.uint8();
  let e;
  if (n === 0)
    return null;
  if ((n & 128) === 0)
    e = n;
  else {
    const i = t.uint8();
    e = (n & 127) << 8 | i;
  }
  const o = [];
  let s = 0;
  for (; o.length < e; ) {
    const i = t.uint8(), r = (i & Kh) + 1, a = (i & Ur) !== 0;
    for (let c = 0; c < r && o.length < e; c++) {
      const f = a ? t.uint16() : t.uint8();
      s += f, o.push(s);
    }
  }
  return o;
}
function de(t) {
  if (t === null)
    return [0];
  const n = t.length, e = [];
  n < 128 ? e.push(n) : (e.push(128 | n >> 8), e.push(n & 255));
  const o = [];
  let s = 0;
  for (const r of t)
    o.push(r - s), s = r;
  let i = 0;
  for (; i < o.length; ) {
    const r = o[i] > 255;
    let a = 1;
    const c = Math.min(128, o.length - i);
    for (; a < c && o[i + a] > 255 === r; )
      a++;
    const f = (r ? Ur : 0) | a - 1;
    e.push(f);
    for (let u = 0; u < a; u++) {
      const l = o[i + u];
      r ? e.push(l >> 8 & 255, l & 255) : e.push(l & 255);
    }
    i += a;
  }
  return e;
}
function $r(t, n) {
  const e = [];
  for (; e.length < n; ) {
    const o = t.uint8(), s = (o & Jh) + 1;
    if (o & Nr)
      for (let i = 0; i < s && e.length < n; i++)
        e.push(0);
    else if (o & Gr)
      for (let i = 0; i < s && e.length < n; i++)
        e.push(t.int16());
    else
      for (let i = 0; i < s && e.length < n; i++)
        e.push(t.int8());
  }
  return e;
}
function Hr(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; )
    if (t[e] === 0) {
      let o = 1;
      const s = Math.min(64, t.length - e);
      for (; o < s && t[e + o] === 0; )
        o++;
      n.push(Nr | o - 1), e += o;
    } else if (t[e] < -128 || t[e] > 127) {
      let o = 1;
      const s = Math.min(64, t.length - e);
      for (; o < s; ) {
        const i = t[e + o];
        if (i === 0 || i >= -128 && i <= 127) break;
        o++;
      }
      n.push(Gr | o - 1);
      for (let i = 0; i < o; i++) {
        const r = t[e + i] & 65535;
        n.push(r >> 8 & 255, r & 255);
      }
      e += o;
    } else {
      let o = 1;
      const s = Math.min(64, t.length - e);
      for (; o < s; ) {
        const i = t[e + o];
        if (i === 0 || i < -128 || i > 127) break;
        o++;
      }
      n.push(o - 1);
      for (let i = 0; i < o; i++)
        n.push(t[e + i] & 255);
      e += o;
    }
  return n;
}
function Qh(t, n, e, o) {
  if (!t || t.length === 0) return [];
  const s = new T(t), i = s.uint16(), r = s.offset16(), a = i & Ie, c = (i & Oe) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let g = 0; g < a; g++) {
    const p = s.uint16(), h = s.uint16();
    let d;
    if (h & De)
      d = s.array("f2dot14", n);
    else {
      const y = h & Xh;
      d = e[y] ?? new Array(n).fill(0);
    }
    let x = null, m = null;
    h & Ee && (x = s.array("f2dot14", n), m = s.array("f2dot14", n)), f.push({
      variationDataSize: p,
      tupleIndex: h,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (h & Be) !== 0
    });
  }
  s.seek(r);
  let u = null;
  c && (u = pe(s));
  const l = [];
  for (const g of f) {
    const h = s.position + g.variationDataSize;
    let d;
    g.hasPrivatePoints ? d = pe(s) : d = u;
    const x = d === null ? o : d.length, m = x * 2, y = $r(s, m);
    l.push({
      peakTuple: g.peakTuple,
      intermediateStartTuple: g.intermediateStartTuple,
      intermediateEndTuple: g.intermediateEndTuple,
      pointIndices: d,
      xDeltas: y.slice(0, x),
      yDeltas: y.slice(x)
    }), s.seek(h);
  }
  return l;
}
function t1(t, n) {
  if (!t || t.length === 0) return [];
  const e = t.length, s = t.every(
    (h) => JSON.stringify(h.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && e > 1, i = [];
  let r = [];
  s && (r = de(t[0].pointIndices), i.push(r));
  const a = [];
  for (const h of t) {
    const d = [];
    s || d.push(...de(h.pointIndices));
    const x = [...h.xDeltas ?? [], ...h.yDeltas ?? []];
    d.push(...Hr(x)), a.push(d.length), i.push(d);
  }
  const c = [];
  for (const h of i)
    c.push(...h);
  const f = [];
  for (let h = 0; h < e; h++) {
    const d = t[h];
    let x = De;
    s || (x |= Be), d.intermediateStartTuple && (x |= Ee);
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
  const l = (s ? Oe : 0) | e & Ie, g = 4 + u.length, p = [];
  return p.push(l >> 8 & 255), p.push(l & 255), p.push(g >> 8 & 255), p.push(g & 255), p.push(...u), p.push(...c), p;
}
function n1(t, n, e) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const o = new T(t), s = o.uint16(), i = o.uint16(), r = o.uint16(), a = o.offset16(), c = r & Ie, f = (r & Oe) !== 0;
  if (c === 0)
    return { majorVersion: s, minorVersion: i, tupleVariations: [] };
  const u = [];
  for (let p = 0; p < c; p++) {
    const h = o.uint16(), d = o.uint16();
    let x = null;
    d & De && (x = o.array("f2dot14", n));
    let m = null, y = null;
    d & Ee && (m = o.array("f2dot14", n), y = o.array("f2dot14", n)), u.push({
      variationDataSize: h,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (d & Be) !== 0
    });
  }
  o.seek(a);
  let l = null;
  f && (l = pe(o));
  const g = [];
  for (const p of u) {
    const d = o.position + p.variationDataSize;
    let x;
    p.hasPrivatePoints ? x = pe(o) : x = l;
    const m = x === null ? e : x.length, y = $r(o, m);
    g.push({
      peakTuple: p.peakTuple,
      intermediateStartTuple: p.intermediateStartTuple,
      intermediateEndTuple: p.intermediateEndTuple,
      pointIndices: x,
      deltas: y
    }), o.seek(d);
  }
  return { majorVersion: s, minorVersion: i, tupleVariations: g };
}
function e1(t, n) {
  const e = t.majorVersion ?? 1, o = t.minorVersion ?? 0, s = t.tupleVariations ?? [], i = s.length;
  if (i === 0) {
    const x = new v(8);
    return x.uint16(e), x.uint16(o), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = s.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(s[0].pointIndices)
  ) && i > 1, c = [];
  a && c.push(
    de(s[0].pointIndices)
  );
  const f = [];
  for (const x of s) {
    const m = [];
    a || m.push(...de(x.pointIndices)), m.push(...Hr(x.deltas ?? [])), f.push(m.length), c.push(m);
  }
  const u = [];
  for (const x of c)
    u.push(...x);
  const l = [];
  for (let x = 0; x < i; x++) {
    const m = s[x];
    let y = De;
    a || (y |= Be), m.intermediateStartTuple && (y |= Ee), l.push(f[x] >> 8 & 255), l.push(f[x] & 255), l.push(y >> 8 & 255), l.push(y & 255);
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
  const g = (a ? Oe : 0) | i & Ie, p = 8 + l.length, h = p + u.length, d = new v(h);
  return d.uint16(e), d.uint16(o), d.uint16(g), d.offset16(p), d.rawBytes(l), d.rawBytes(u), d.toArray();
}
function o1(t, n = {}) {
  const e = n.fvar?.axes?.length ?? 0, o = n["cvt "]?.values?.length ?? 0;
  return n1(t, e, o);
}
function s1(t) {
  const n = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return e1(t, n);
}
function i1(t) {
  const n = new T(t), e = t.length >>> 1;
  return { values: n.array("fword", e) };
}
function r1(t) {
  const n = t.values, e = new v(n.length * 2);
  return e.array("fword", n), e.toArray();
}
function a1(t) {
  return { instructions: Array.from(t) };
}
function c1(t) {
  return Array.from(t.instructions);
}
function f1(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = [];
  for (let i = 0; i < o; i++)
    s.push({
      rangeMaxPPEM: n.uint16(),
      rangeGaspBehavior: n.uint16()
    });
  return { version: e, gaspRanges: s };
}
function u1(t) {
  const { version: n, gaspRanges: e } = t, o = new v(4 + e.length * 4);
  o.uint16(n), o.uint16(e.length);
  for (const s of e)
    o.uint16(s.rangeMaxPPEM), o.uint16(s.rangeGaspBehavior);
  return o.toArray();
}
const Zr = 1, jr = 2, Yr = 4, qr = 8, me = 16, ye = 32, Wr = 64, Tn = 1, xe = 2, Xr = 4, Qo = 8, ko = 32, ts = 64, ns = 128, Mn = 256, Kr = 512, Jr = 1024, Qr = 2048, ta = 4096;
function l1(t, n) {
  const e = n.loca.offsets, o = n.maxp.numGlyphs, s = new T(t), i = [];
  for (let r = 0; r < o; r++) {
    const a = e[r], c = e[r + 1];
    if (a === c) {
      i.push(null);
      continue;
    }
    s.seek(a);
    const f = s.int16(), u = s.int16(), l = s.int16(), g = s.int16(), p = s.int16();
    f >= 0 ? i.push(
      h1(s, f, u, l, g, p)
    ) : i.push(g1(s, u, l, g, p));
  }
  return { glyphs: i };
}
function h1(t, n, e, o, s, i) {
  const r = t.array("uint16", n), a = n > 0 ? r[n - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), u = [];
  for (; u.length < a; ) {
    const y = t.uint8();
    if (u.push(y), y & qr) {
      const _ = t.uint8();
      for (let w = 0; w < _; w++)
        u.push(y);
    }
  }
  const l = new Array(a);
  let g = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & jr) {
      const w = t.uint8();
      g += _ & me ? w : -w;
    } else _ & me || (g += t.int16());
    l[y] = g;
  }
  const p = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & Yr) {
      const w = t.uint8();
      h += _ & ye ? w : -w;
    } else _ & ye || (h += t.int16());
    p[y] = h;
  }
  const d = a > 0 && (u[0] & Wr) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < n; y++) {
    const _ = r[y], w = [];
    for (; m <= _; )
      w.push({
        x: l[m],
        y: p[m],
        onCurve: (u[m] & Zr) !== 0
      }), m++;
    x.push(w);
  }
  return {
    type: "simple",
    xMin: e,
    yMin: o,
    xMax: s,
    yMax: i,
    contours: x,
    instructions: f,
    overlapSimple: d
  };
}
function g1(t, n, e, o, s) {
  const i = [];
  let r, a = !1;
  do {
    r = t.uint16();
    const f = t.uint16();
    let u, l;
    r & Tn ? r & xe ? (u = t.int16(), l = t.int16()) : (u = t.uint16(), l = t.uint16()) : r & xe ? (u = t.int8(), l = t.int8()) : (u = t.uint8(), l = t.uint8());
    const g = {
      glyphIndex: f,
      flags: p1(r),
      argument1: u,
      argument2: l
    };
    r & Qo ? g.transform = { scale: t.f2dot14() } : r & ts ? g.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : r & ns && (g.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), i.push(g), r & Mn && (a = !0);
  } while (r & ko);
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
    yMax: s,
    components: i,
    instructions: c
  };
}
function p1(t) {
  const n = {};
  return t & Tn && (n.argsAreWords = !0), t & xe && (n.argsAreXYValues = !0), t & Xr && (n.roundXYToGrid = !0), t & Qo && (n.weHaveAScale = !0), t & ts && (n.weHaveAnXAndYScale = !0), t & ns && (n.weHaveATwoByTwo = !0), t & Mn && (n.weHaveInstructions = !0), t & Kr && (n.useMyMetrics = !0), t & Jr && (n.overlapCompound = !0), t & Qr && (n.scaledComponentOffset = !0), t & ta && (n.unscaledComponentOffset = !0), n;
}
function na(t) {
  const { glyphs: n } = t, e = [];
  for (const i of n) {
    if (i === null) {
      e.push([]);
      continue;
    }
    i.type === "simple" ? e.push(m1(i)) : e.push(x1(i));
  }
  const o = [], s = [];
  for (const i of e) {
    s.push(o.length);
    for (let r = 0; r < i.length; r++)
      o.push(i[r]);
    i.length % 2 !== 0 && o.push(0);
  }
  return s.push(o.length), { bytes: o, offsets: s };
}
function d1(t) {
  return na(t).bytes;
}
function m1(t) {
  const { contours: n, instructions: e, xMin: o, yMin: s, xMax: i, yMax: r, overlapSimple: a } = t, c = n.length, f = [], u = [];
  for (const k of n) {
    for (const I of k)
      f.push(I);
    u.push(f.length - 1);
  }
  const l = f.length, g = f.map((k) => k.x), p = f.map((k) => k.y), h = new Array(l), d = new Array(l);
  for (let k = 0; k < l; k++)
    h[k] = k === 0 ? g[k] : g[k] - g[k - 1], d[k] = k === 0 ? p[k] : p[k] - p[k - 1];
  const x = [], m = [], y = [];
  for (let k = 0; k < l; k++) {
    let I = 0;
    f[k].onCurve && (I |= Zr);
    const O = h[k], E = d[k];
    O === 0 ? I |= me : O >= -255 && O <= 255 ? (I |= jr, O > 0 ? (I |= me, m.push(O)) : m.push(-O)) : m.push(O >> 8 & 255, O & 255), E === 0 ? I |= ye : E >= -255 && E <= 255 ? (I |= Yr, E > 0 ? (I |= ye, y.push(E)) : y.push(-E)) : y.push(E >> 8 & 255, E & 255), k === 0 && a && (I |= Wr), x.push(I);
  }
  const _ = y1(x), w = 10, S = c * 2, A = 2, b = e.length, D = w + S + A + b + _.length + m.length + y.length, C = new v(D);
  return C.int16(c), C.int16(o), C.int16(s), C.int16(i), C.int16(r), C.array("uint16", u), C.uint16(e.length), C.rawBytes(e), C.rawBytes(_), C.rawBytes(m), C.rawBytes(y), C.toArray();
}
function y1(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; ) {
    const o = t[e];
    let s = 0;
    for (; e + 1 + s < t.length && t[e + 1 + s] === o && s < 255; )
      s++;
    s > 0 ? (n.push(o | qr, s), e += 1 + s) : (n.push(o), e++);
  }
  return n;
}
function x1(t) {
  const { components: n, instructions: e, xMin: o, yMin: s, xMax: i, yMax: r } = t;
  let a = 10;
  for (let f = 0; f < n.length; f++) {
    const u = n[f];
    a += 4;
    const l = u.flags.argsAreWords || Ys(u.argument1, u.argument2, u.flags.argsAreXYValues);
    a += l ? 4 : 2, u.transform && ("scale" in u.transform ? a += 2 : "scale01" in u.transform ? a += 8 : "xScale" in u.transform && (a += 4));
  }
  e && e.length > 0 && (a += 2 + e.length);
  const c = new v(a);
  c.int16(-1), c.int16(o), c.int16(s), c.int16(i), c.int16(r);
  for (let f = 0; f < n.length; f++) {
    const u = n[f], l = f === n.length - 1;
    let g = w1(u.flags);
    const p = u.flags.argsAreWords || Ys(u.argument1, u.argument2, u.flags.argsAreXYValues);
    p ? g |= Tn : g &= ~Tn, l ? g &= ~ko : g |= ko, l && e && e.length > 0 ? g |= Mn : l && (g &= ~Mn), c.uint16(g), c.uint16(u.glyphIndex), p ? u.flags.argsAreXYValues ? (c.int16(u.argument1), c.int16(u.argument2)) : (c.uint16(u.argument1), c.uint16(u.argument2)) : u.flags.argsAreXYValues ? (c.int8(u.argument1), c.int8(u.argument2)) : (c.uint8(u.argument1), c.uint8(u.argument2)), u.transform && ("scale" in u.transform ? c.f2dot14(u.transform.scale) : "scale01" in u.transform ? (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.scale01), c.f2dot14(u.transform.scale10), c.f2dot14(u.transform.yScale)) : "xScale" in u.transform && (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.yScale)));
  }
  return e && e.length > 0 && (c.uint16(e.length), c.rawBytes(e)), c.toArray();
}
function Ys(t, n, e) {
  return e ? t < -128 || t > 127 || n < -128 || n > 127 : t > 255 || n > 255;
}
function w1(t) {
  let n = 0;
  return t.argsAreWords && (n |= Tn), t.argsAreXYValues && (n |= xe), t.roundXYToGrid && (n |= Xr), t.weHaveAScale && (n |= Qo), t.weHaveAnXAndYScale && (n |= ts), t.weHaveATwoByTwo && (n |= ns), t.weHaveInstructions && (n |= Mn), t.useMyMetrics && (n |= Kr), t.overlapCompound && (n |= Jr), t.scaledComponentOffset && (n |= Qr), t.unscaledComponentOffset && (n |= ta), n;
}
const S1 = 20, Co = 1;
function _1(t, n = {}) {
  const e = new T(t), o = e.uint16(), s = e.uint16(), i = e.uint16(), r = e.uint16(), a = e.offset32(), c = e.uint16(), f = e.uint16(), u = e.offset32(), l = (f & Co) !== 0, g = c + 1, p = [];
  for (let x = 0; x < g; x++)
    l ? p.push(e.uint32()) : p.push(e.uint16() * 2);
  const h = [];
  if (r > 0 && a > 0) {
    e.seek(a);
    for (let x = 0; x < r; x++) {
      const m = [];
      for (let y = 0; y < i; y++)
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
    const w = u + m, S = t.slice(w, w + _), A = b1(n, x);
    d.push(
      Qh(S, i, h, A)
    );
  }
  return {
    majorVersion: o,
    minorVersion: s,
    axisCount: i,
    flags: f,
    sharedTuples: h,
    glyphVariationData: d
  };
}
function b1(t, n) {
  const e = t.glyf?.glyphs?.[n];
  if (!e) return 0;
  if (e.type === "simple" && e.contours) {
    let o = 0;
    for (const s of e.contours)
      o += s.length;
    return o + 4;
  }
  return e.type === "composite" && e.components ? e.components.length + 4 : 0;
}
function v1(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.axisCount ?? 0, s = t.glyphVariationData ?? [], i = s.length, r = s.map((S) => Array.isArray(S) && (S.length === 0 || typeof S[0] == "number") ? S : Array.isArray(S) ? t1(S, o) : []), a = t.sharedTuples ?? A1(s, o), c = a.length, f = c * o * 2, u = [0];
  let l = 0;
  for (const S of r)
    l += S.length, u.push(l);
  const g = u.every(
    (S) => S % 2 === 0 && S / 2 <= 65535
  ), p = g ? 2 : 4, h = (i + 1) * p, d = S1 + h, x = d + f, m = x + l, y = t.flags ?? 0, _ = g ? y & ~Co : y | Co, w = new v(m);
  w.uint16(n), w.uint16(e), w.uint16(o), w.uint16(c), w.offset32(d), w.uint16(i), w.uint16(_), w.offset32(x);
  for (const S of u)
    g ? w.uint16(S / 2) : w.uint32(S);
  for (const S of a)
    for (let A = 0; A < o; A++)
      w.f2dot14(S[A] ?? 0);
  for (const S of r)
    w.rawBytes(S);
  return w.toArray();
}
function A1(t, n) {
  if (n === 0) return [];
  const e = /* @__PURE__ */ new Set(), o = [];
  for (const s of t)
    if (Array.isArray(s))
      for (const i of s) {
        if (!i || !i.peakTuple) continue;
        const r = i.peakTuple.map((a) => Math.round((a ?? 0) * 16384)).join(",");
        e.has(r) || (e.add(r), o.push(i.peakTuple));
      }
  return o;
}
function k1(t, n) {
  const e = n.head.indexToLocFormat, s = n.maxp.numGlyphs + 1, i = new T(t), r = [];
  if (e === 0)
    for (let a = 0; a < s; a++)
      r.push(i.uint16() * 2);
  else
    for (let a = 0; a < s; a++)
      r.push(i.uint32());
  return { offsets: r };
}
function ea(t) {
  const { offsets: n } = t;
  if (n.every((s) => s % 2 === 0 && s / 2 <= 65535)) {
    const s = new v(n.length * 2);
    for (const i of n)
      s.uint16(i / 2);
    return s.toArray();
  }
  const o = new v(n.length * 4);
  for (const s of n)
    o.uint32(s);
  return o.toArray();
}
function C1(t) {
  return { instructions: Array.from(t) };
}
function O1(t) {
  return Array.from(t.instructions);
}
const I1 = 4, qs = 0, Ws = 1, D1 = 2;
function pn(t) {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}
const E1 = 0, oa = 1, B1 = 2, T1 = 3, M1 = 258, es = 29, jn = 256, Ln = jn + 1 + es, sn = 30, os = 19, sa = 2 * Ln + 1, zt = 15, Ke = 16, L1 = 7, ss = 256, ia = 16, ra = 17, aa = 18, Oo = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), ue = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), R1 = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), ca = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), z1 = 512, xt = new Array((Ln + 2) * 2);
pn(xt);
const In = new Array(sn * 2);
pn(In);
const Rn = new Array(z1);
pn(Rn);
const zn = new Array(M1 - T1 + 1);
pn(zn);
const is = new Array(es);
pn(is);
const we = new Array(sn);
pn(we);
function Je(t, n, e, o, s) {
  this.static_tree = t, this.extra_bits = n, this.extra_base = e, this.elems = o, this.max_length = s, this.has_stree = t && t.length;
}
let fa, ua, la;
function Qe(t, n) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = n;
}
const ha = (t) => t < 256 ? Rn[t] : Rn[256 + (t >>> 7)], Fn = (t, n) => {
  t.pending_buf[t.pending++] = n & 255, t.pending_buf[t.pending++] = n >>> 8 & 255;
}, J = (t, n, e) => {
  t.bi_valid > Ke - e ? (t.bi_buf |= n << t.bi_valid & 65535, Fn(t, t.bi_buf), t.bi_buf = n >> Ke - t.bi_valid, t.bi_valid += e - Ke) : (t.bi_buf |= n << t.bi_valid & 65535, t.bi_valid += e);
}, ft = (t, n, e) => {
  J(
    t,
    e[n * 2],
    e[n * 2 + 1]
    /*.Len*/
  );
}, ga = (t, n) => {
  let e = 0;
  do
    e |= t & 1, t >>>= 1, e <<= 1;
  while (--n > 0);
  return e >>> 1;
}, F1 = (t) => {
  t.bi_valid === 16 ? (Fn(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, V1 = (t, n) => {
  const e = n.dyn_tree, o = n.max_code, s = n.stat_desc.static_tree, i = n.stat_desc.has_stree, r = n.stat_desc.extra_bits, a = n.stat_desc.extra_base, c = n.stat_desc.max_length;
  let f, u, l, g, p, h, d = 0;
  for (g = 0; g <= zt; g++)
    t.bl_count[g] = 0;
  for (e[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < sa; f++)
    u = t.heap[f], g = e[e[u * 2 + 1] * 2 + 1] + 1, g > c && (g = c, d++), e[u * 2 + 1] = g, !(u > o) && (t.bl_count[g]++, p = 0, u >= a && (p = r[u - a]), h = e[u * 2], t.opt_len += h * (g + p), i && (t.static_len += h * (s[u * 2 + 1] + p)));
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
}, pa = (t, n, e) => {
  const o = new Array(zt + 1);
  let s = 0, i, r;
  for (i = 1; i <= zt; i++)
    s = s + e[i - 1] << 1, o[i] = s;
  for (r = 0; r <= n; r++) {
    let a = t[r * 2 + 1];
    a !== 0 && (t[r * 2] = ga(o[a]++, a));
  }
}, P1 = () => {
  let t, n, e, o, s;
  const i = new Array(zt + 1);
  for (e = 0, o = 0; o < es - 1; o++)
    for (is[o] = e, t = 0; t < 1 << Oo[o]; t++)
      zn[e++] = o;
  for (zn[e - 1] = o, s = 0, o = 0; o < 16; o++)
    for (we[o] = s, t = 0; t < 1 << ue[o]; t++)
      Rn[s++] = o;
  for (s >>= 7; o < sn; o++)
    for (we[o] = s << 7, t = 0; t < 1 << ue[o] - 7; t++)
      Rn[256 + s++] = o;
  for (n = 0; n <= zt; n++)
    i[n] = 0;
  for (t = 0; t <= 143; )
    xt[t * 2 + 1] = 8, t++, i[8]++;
  for (; t <= 255; )
    xt[t * 2 + 1] = 9, t++, i[9]++;
  for (; t <= 279; )
    xt[t * 2 + 1] = 7, t++, i[7]++;
  for (; t <= 287; )
    xt[t * 2 + 1] = 8, t++, i[8]++;
  for (pa(xt, Ln + 1, i), t = 0; t < sn; t++)
    In[t * 2 + 1] = 5, In[t * 2] = ga(t, 5);
  fa = new Je(xt, Oo, jn + 1, Ln, zt), ua = new Je(In, ue, 0, sn, zt), la = new Je(new Array(0), R1, 0, os, L1);
}, da = (t) => {
  let n;
  for (n = 0; n < Ln; n++)
    t.dyn_ltree[n * 2] = 0;
  for (n = 0; n < sn; n++)
    t.dyn_dtree[n * 2] = 0;
  for (n = 0; n < os; n++)
    t.bl_tree[n * 2] = 0;
  t.dyn_ltree[ss * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, ma = (t) => {
  t.bi_valid > 8 ? Fn(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, Xs = (t, n, e, o) => {
  const s = n * 2, i = e * 2;
  return t[s] < t[i] || t[s] === t[i] && o[n] <= o[e];
}, to = (t, n, e) => {
  const o = t.heap[e];
  let s = e << 1;
  for (; s <= t.heap_len && (s < t.heap_len && Xs(n, t.heap[s + 1], t.heap[s], t.depth) && s++, !Xs(n, o, t.heap[s], t.depth)); )
    t.heap[e] = t.heap[s], e = s, s <<= 1;
  t.heap[e] = o;
}, Ks = (t, n, e) => {
  let o, s, i = 0, r, a;
  if (t.sym_next !== 0)
    do
      o = t.pending_buf[t.sym_buf + i++] & 255, o += (t.pending_buf[t.sym_buf + i++] & 255) << 8, s = t.pending_buf[t.sym_buf + i++], o === 0 ? ft(t, s, n) : (r = zn[s], ft(t, r + jn + 1, n), a = Oo[r], a !== 0 && (s -= is[r], J(t, s, a)), o--, r = ha(o), ft(t, r, e), a = ue[r], a !== 0 && (o -= we[r], J(t, o, a)));
    while (i < t.sym_next);
  ft(t, ss, n);
}, Io = (t, n) => {
  const e = n.dyn_tree, o = n.stat_desc.static_tree, s = n.stat_desc.has_stree, i = n.stat_desc.elems;
  let r, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = sa, r = 0; r < i; r++)
    e[r * 2] !== 0 ? (t.heap[++t.heap_len] = c = r, t.depth[r] = 0) : e[r * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, e[f * 2] = 1, t.depth[f] = 0, t.opt_len--, s && (t.static_len -= o[f * 2 + 1]);
  for (n.max_code = c, r = t.heap_len >> 1; r >= 1; r--)
    to(t, e, r);
  f = i;
  do
    r = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], to(
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
    ] = f++, to(
      t,
      e,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], V1(t, n), pa(e, c, t.bl_count);
}, Js = (t, n, e) => {
  let o, s = -1, i, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), n[(e + 1) * 2 + 1] = 65535, o = 0; o <= e; o++)
    i = r, r = n[(o + 1) * 2 + 1], !(++a < c && i === r) && (a < f ? t.bl_tree[i * 2] += a : i !== 0 ? (i !== s && t.bl_tree[i * 2]++, t.bl_tree[ia * 2]++) : a <= 10 ? t.bl_tree[ra * 2]++ : t.bl_tree[aa * 2]++, a = 0, s = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4));
}, Qs = (t, n, e) => {
  let o, s = -1, i, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), o = 0; o <= e; o++)
    if (i = r, r = n[(o + 1) * 2 + 1], !(++a < c && i === r)) {
      if (a < f)
        do
          ft(t, i, t.bl_tree);
        while (--a !== 0);
      else i !== 0 ? (i !== s && (ft(t, i, t.bl_tree), a--), ft(t, ia, t.bl_tree), J(t, a - 3, 2)) : a <= 10 ? (ft(t, ra, t.bl_tree), J(t, a - 3, 3)) : (ft(t, aa, t.bl_tree), J(t, a - 11, 7));
      a = 0, s = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, U1 = (t) => {
  let n;
  for (Js(t, t.dyn_ltree, t.l_desc.max_code), Js(t, t.dyn_dtree, t.d_desc.max_code), Io(t, t.bl_desc), n = os - 1; n >= 3 && t.bl_tree[ca[n] * 2 + 1] === 0; n--)
    ;
  return t.opt_len += 3 * (n + 1) + 5 + 5 + 4, n;
}, N1 = (t, n, e, o) => {
  let s;
  for (J(t, n - 257, 5), J(t, e - 1, 5), J(t, o - 4, 4), s = 0; s < o; s++)
    J(t, t.bl_tree[ca[s] * 2 + 1], 3);
  Qs(t, t.dyn_ltree, n - 1), Qs(t, t.dyn_dtree, e - 1);
}, G1 = (t) => {
  let n = 4093624447, e;
  for (e = 0; e <= 31; e++, n >>>= 1)
    if (n & 1 && t.dyn_ltree[e * 2] !== 0)
      return qs;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return Ws;
  for (e = 32; e < jn; e++)
    if (t.dyn_ltree[e * 2] !== 0)
      return Ws;
  return qs;
};
let ti = !1;
const $1 = (t) => {
  ti || (P1(), ti = !0), t.l_desc = new Qe(t.dyn_ltree, fa), t.d_desc = new Qe(t.dyn_dtree, ua), t.bl_desc = new Qe(t.bl_tree, la), t.bi_buf = 0, t.bi_valid = 0, da(t);
}, ya = (t, n, e, o) => {
  J(t, (E1 << 1) + (o ? 1 : 0), 3), ma(t), Fn(t, e), Fn(t, ~e), e && t.pending_buf.set(t.window.subarray(n, n + e), t.pending), t.pending += e;
}, H1 = (t) => {
  J(t, oa << 1, 3), ft(t, ss, xt), F1(t);
}, Z1 = (t, n, e, o) => {
  let s, i, r = 0;
  t.level > 0 ? (t.strm.data_type === D1 && (t.strm.data_type = G1(t)), Io(t, t.l_desc), Io(t, t.d_desc), r = U1(t), s = t.opt_len + 3 + 7 >>> 3, i = t.static_len + 3 + 7 >>> 3, i <= s && (s = i)) : s = i = e + 5, e + 4 <= s && n !== -1 ? ya(t, n, e, o) : t.strategy === I1 || i === s ? (J(t, (oa << 1) + (o ? 1 : 0), 3), Ks(t, xt, In)) : (J(t, (B1 << 1) + (o ? 1 : 0), 3), N1(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, r + 1), Ks(t, t.dyn_ltree, t.dyn_dtree)), da(t), o && ma(t);
}, j1 = (t, n, e) => (t.pending_buf[t.sym_buf + t.sym_next++] = n, t.pending_buf[t.sym_buf + t.sym_next++] = n >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = e, n === 0 ? t.dyn_ltree[e * 2]++ : (t.matches++, n--, t.dyn_ltree[(zn[e] + jn + 1) * 2]++, t.dyn_dtree[ha(n) * 2]++), t.sym_next === t.sym_end);
var Y1 = $1, q1 = ya, W1 = Z1, X1 = j1, K1 = H1, J1 = {
  _tr_init: Y1,
  _tr_stored_block: q1,
  _tr_flush_block: W1,
  _tr_tally: X1,
  _tr_align: K1
};
const Q1 = (t, n, e, o) => {
  let s = t & 65535 | 0, i = t >>> 16 & 65535 | 0, r = 0;
  for (; e !== 0; ) {
    r = e > 2e3 ? 2e3 : e, e -= r;
    do
      s = s + n[o++] | 0, i = i + s | 0;
    while (--r);
    s %= 65521, i %= 65521;
  }
  return s | i << 16 | 0;
};
var Vn = Q1;
const tg = () => {
  let t, n = [];
  for (var e = 0; e < 256; e++) {
    t = e;
    for (var o = 0; o < 8; o++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    n[e] = t;
  }
  return n;
}, ng = new Uint32Array(tg()), eg = (t, n, e, o) => {
  const s = ng, i = o + e;
  t ^= -1;
  for (let r = o; r < i; r++)
    t = t >>> 8 ^ s[(t ^ n[r]) & 255];
  return t ^ -1;
};
var H = eg, Ut = {
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
}, Te = {
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
const { _tr_init: og, _tr_stored_block: Do, _tr_flush_block: sg, _tr_tally: It, _tr_align: ig } = J1, {
  Z_NO_FLUSH: Dt,
  Z_PARTIAL_FLUSH: rg,
  Z_FULL_FLUSH: ag,
  Z_FINISH: st,
  Z_BLOCK: ni,
  Z_OK: j,
  Z_STREAM_END: ei,
  Z_STREAM_ERROR: lt,
  Z_DATA_ERROR: cg,
  Z_BUF_ERROR: no,
  Z_DEFAULT_COMPRESSION: fg,
  Z_FILTERED: ug,
  Z_HUFFMAN_ONLY: ne,
  Z_RLE: lg,
  Z_FIXED: hg,
  Z_DEFAULT_STRATEGY: gg,
  Z_UNKNOWN: pg,
  Z_DEFLATED: Me
} = Te, dg = 9, mg = 15, yg = 8, xg = 29, wg = 256, Eo = wg + 1 + xg, Sg = 30, _g = 19, bg = 2 * Eo + 1, vg = 15, R = 3, kt = 258, ht = kt + R + 1, Ag = 32, hn = 42, rs = 57, Bo = 69, To = 73, Mo = 91, Lo = 103, Ft = 113, An = 666, X = 1, dn = 2, Nt = 3, mn = 4, kg = 3, Vt = (t, n) => (t.msg = Ut[n], n), oi = (t) => t * 2 - (t > 4 ? 9 : 0), bt = (t) => {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}, Cg = (t) => {
  let n, e, o, s = t.w_size;
  n = t.hash_size, o = n;
  do
    e = t.head[--o], t.head[o] = e >= s ? e - s : 0;
  while (--n);
  n = s, o = n;
  do
    e = t.prev[--o], t.prev[o] = e >= s ? e - s : 0;
  while (--n);
};
let Og = (t, n, e) => (n << t.hash_shift ^ e) & t.hash_mask, Et = Og;
const tt = (t) => {
  const n = t.state;
  let e = n.pending;
  e > t.avail_out && (e = t.avail_out), e !== 0 && (t.output.set(n.pending_buf.subarray(n.pending_out, n.pending_out + e), t.next_out), t.next_out += e, n.pending_out += e, t.total_out += e, t.avail_out -= e, n.pending -= e, n.pending === 0 && (n.pending_out = 0));
}, nt = (t, n) => {
  sg(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, n), t.block_start = t.strstart, tt(t.strm);
}, z = (t, n) => {
  t.pending_buf[t.pending++] = n;
}, Sn = (t, n) => {
  t.pending_buf[t.pending++] = n >>> 8 & 255, t.pending_buf[t.pending++] = n & 255;
}, Ro = (t, n, e, o) => {
  let s = t.avail_in;
  return s > o && (s = o), s === 0 ? 0 : (t.avail_in -= s, n.set(t.input.subarray(t.next_in, t.next_in + s), e), t.state.wrap === 1 ? t.adler = Vn(t.adler, n, s, e) : t.state.wrap === 2 && (t.adler = H(t.adler, n, s, e)), t.next_in += s, t.total_in += s, s);
}, xa = (t, n) => {
  let e = t.max_chain_length, o = t.strstart, s, i, r = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - ht ? t.strstart - (t.w_size - ht) : 0, f = t.window, u = t.w_mask, l = t.prev, g = t.strstart + kt;
  let p = f[o + r - 1], h = f[o + r];
  t.prev_length >= t.good_match && (e >>= 2), a > t.lookahead && (a = t.lookahead);
  do
    if (s = n, !(f[s + r] !== h || f[s + r - 1] !== p || f[s] !== f[o] || f[++s] !== f[o + 1])) {
      o += 2, s++;
      do
        ;
      while (f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && o < g);
      if (i = kt - (g - o), o = g - kt, i > r) {
        if (t.match_start = n, r = i, i >= a)
          break;
        p = f[o + r - 1], h = f[o + r];
      }
    }
  while ((n = l[n & u]) > c && --e !== 0);
  return r <= t.lookahead ? r : t.lookahead;
}, gn = (t) => {
  const n = t.w_size;
  let e, o, s;
  do {
    if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= n + (n - ht) && (t.window.set(t.window.subarray(n, n + n - o), 0), t.match_start -= n, t.strstart -= n, t.block_start -= n, t.insert > t.strstart && (t.insert = t.strstart), Cg(t), o += n), t.strm.avail_in === 0)
      break;
    if (e = Ro(t.strm, t.window, t.strstart + t.lookahead, o), t.lookahead += e, t.lookahead + t.insert >= R)
      for (s = t.strstart - t.insert, t.ins_h = t.window[s], t.ins_h = Et(t, t.ins_h, t.window[s + 1]); t.insert && (t.ins_h = Et(t, t.ins_h, t.window[s + R - 1]), t.prev[s & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = s, s++, t.insert--, !(t.lookahead + t.insert < R)); )
        ;
  } while (t.lookahead < ht && t.strm.avail_in !== 0);
}, wa = (t, n) => {
  let e = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, o, s, i, r = 0, a = t.strm.avail_in;
  do {
    if (o = 65535, i = t.bi_valid + 42 >> 3, t.strm.avail_out < i || (i = t.strm.avail_out - i, s = t.strstart - t.block_start, o > s + t.strm.avail_in && (o = s + t.strm.avail_in), o > i && (o = i), o < e && (o === 0 && n !== st || n === Dt || o !== s + t.strm.avail_in)))
      break;
    r = n === st && o === s + t.strm.avail_in ? 1 : 0, Do(t, 0, 0, r), t.pending_buf[t.pending - 4] = o, t.pending_buf[t.pending - 3] = o >> 8, t.pending_buf[t.pending - 2] = ~o, t.pending_buf[t.pending - 1] = ~o >> 8, tt(t.strm), s && (s > o && (s = o), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + s), t.strm.next_out), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s, t.block_start += s, o -= s), o && (Ro(t.strm, t.strm.output, t.strm.next_out, o), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o);
  } while (r === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), r ? mn : n !== Dt && n !== st && t.strm.avail_in === 0 && t.strstart === t.block_start ? dn : (i = t.window_size - t.strstart, t.strm.avail_in > i && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, i += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), i > t.strm.avail_in && (i = t.strm.avail_in), i && (Ro(t.strm, t.window, t.strstart, i), t.strstart += i, t.insert += i > t.w_size - t.insert ? t.w_size - t.insert : i), t.high_water < t.strstart && (t.high_water = t.strstart), i = t.bi_valid + 42 >> 3, i = t.pending_buf_size - i > 65535 ? 65535 : t.pending_buf_size - i, e = i > t.w_size ? t.w_size : i, s = t.strstart - t.block_start, (s >= e || (s || n === st) && n !== Dt && t.strm.avail_in === 0 && s <= i) && (o = s > i ? i : s, r = n === st && t.strm.avail_in === 0 && o === s ? 1 : 0, Do(t, t.block_start, o, r), t.block_start += o, tt(t.strm)), r ? Nt : X);
}, eo = (t, n) => {
  let e, o;
  for (; ; ) {
    if (t.lookahead < ht) {
      if (gn(t), t.lookahead < ht && n === Dt)
        return X;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= R && (t.ins_h = Et(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), e !== 0 && t.strstart - e <= t.w_size - ht && (t.match_length = xa(t, e)), t.match_length >= R)
      if (o = It(t, t.strstart - t.match_start, t.match_length - R), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= R) {
        t.match_length--;
        do
          t.strstart++, t.ins_h = Et(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = Et(t, t.ins_h, t.window[t.strstart + 1]);
    else
      o = It(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (o && (nt(t, !1), t.strm.avail_out === 0))
      return X;
  }
  return t.insert = t.strstart < R - 1 ? t.strstart : R - 1, n === st ? (nt(t, !0), t.strm.avail_out === 0 ? Nt : mn) : t.sym_next && (nt(t, !1), t.strm.avail_out === 0) ? X : dn;
}, qt = (t, n) => {
  let e, o, s;
  for (; ; ) {
    if (t.lookahead < ht) {
      if (gn(t), t.lookahead < ht && n === Dt)
        return X;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= R && (t.ins_h = Et(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = R - 1, e !== 0 && t.prev_length < t.max_lazy_match && t.strstart - e <= t.w_size - ht && (t.match_length = xa(t, e), t.match_length <= 5 && (t.strategy === ug || t.match_length === R && t.strstart - t.match_start > 4096) && (t.match_length = R - 1)), t.prev_length >= R && t.match_length <= t.prev_length) {
      s = t.strstart + t.lookahead - R, o = It(t, t.strstart - 1 - t.prev_match, t.prev_length - R), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= s && (t.ins_h = Et(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = R - 1, t.strstart++, o && (nt(t, !1), t.strm.avail_out === 0))
        return X;
    } else if (t.match_available) {
      if (o = It(t, 0, t.window[t.strstart - 1]), o && nt(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return X;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (o = It(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < R - 1 ? t.strstart : R - 1, n === st ? (nt(t, !0), t.strm.avail_out === 0 ? Nt : mn) : t.sym_next && (nt(t, !1), t.strm.avail_out === 0) ? X : dn;
}, Ig = (t, n) => {
  let e, o, s, i;
  const r = t.window;
  for (; ; ) {
    if (t.lookahead <= kt) {
      if (gn(t), t.lookahead <= kt && n === Dt)
        return X;
      if (t.lookahead === 0)
        break;
    }
    if (t.match_length = 0, t.lookahead >= R && t.strstart > 0 && (s = t.strstart - 1, o = r[s], o === r[++s] && o === r[++s] && o === r[++s])) {
      i = t.strstart + kt;
      do
        ;
      while (o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && s < i);
      t.match_length = kt - (i - s), t.match_length > t.lookahead && (t.match_length = t.lookahead);
    }
    if (t.match_length >= R ? (e = It(t, 1, t.match_length - R), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (e = It(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), e && (nt(t, !1), t.strm.avail_out === 0))
      return X;
  }
  return t.insert = 0, n === st ? (nt(t, !0), t.strm.avail_out === 0 ? Nt : mn) : t.sym_next && (nt(t, !1), t.strm.avail_out === 0) ? X : dn;
}, Dg = (t, n) => {
  let e;
  for (; ; ) {
    if (t.lookahead === 0 && (gn(t), t.lookahead === 0)) {
      if (n === Dt)
        return X;
      break;
    }
    if (t.match_length = 0, e = It(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, e && (nt(t, !1), t.strm.avail_out === 0))
      return X;
  }
  return t.insert = 0, n === st ? (nt(t, !0), t.strm.avail_out === 0 ? Nt : mn) : t.sym_next && (nt(t, !1), t.strm.avail_out === 0) ? X : dn;
};
function at(t, n, e, o, s) {
  this.good_length = t, this.max_lazy = n, this.nice_length = e, this.max_chain = o, this.func = s;
}
const kn = [
  /*      good lazy nice chain */
  new at(0, 0, 0, 0, wa),
  /* 0 store only */
  new at(4, 4, 8, 4, eo),
  /* 1 max speed, no lazy matches */
  new at(4, 5, 16, 8, eo),
  /* 2 */
  new at(4, 6, 32, 32, eo),
  /* 3 */
  new at(4, 4, 16, 16, qt),
  /* 4 lazy matches */
  new at(8, 16, 32, 32, qt),
  /* 5 */
  new at(8, 16, 128, 128, qt),
  /* 6 */
  new at(8, 32, 128, 256, qt),
  /* 7 */
  new at(32, 128, 258, 1024, qt),
  /* 8 */
  new at(32, 258, 258, 4096, qt)
  /* 9 max compression */
], Eg = (t) => {
  t.window_size = 2 * t.w_size, bt(t.head), t.max_lazy_match = kn[t.level].max_lazy, t.good_match = kn[t.level].good_length, t.nice_match = kn[t.level].nice_length, t.max_chain_length = kn[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = R - 1, t.match_available = 0, t.ins_h = 0;
};
function Bg() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Me, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(bg * 2), this.dyn_dtree = new Uint16Array((2 * Sg + 1) * 2), this.bl_tree = new Uint16Array((2 * _g + 1) * 2), bt(this.dyn_ltree), bt(this.dyn_dtree), bt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(vg + 1), this.heap = new Uint16Array(2 * Eo + 1), bt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * Eo + 1), bt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const Yn = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.status !== hn && //#ifdef GZIP
  n.status !== rs && //#endif
  n.status !== Bo && n.status !== To && n.status !== Mo && n.status !== Lo && n.status !== Ft && n.status !== An ? 1 : 0;
}, Sa = (t) => {
  if (Yn(t))
    return Vt(t, lt);
  t.total_in = t.total_out = 0, t.data_type = pg;
  const n = t.state;
  return n.pending = 0, n.pending_out = 0, n.wrap < 0 && (n.wrap = -n.wrap), n.status = //#ifdef GZIP
  n.wrap === 2 ? rs : (
    //#endif
    n.wrap ? hn : Ft
  ), t.adler = n.wrap === 2 ? 0 : 1, n.last_flush = -2, og(n), j;
}, _a = (t) => {
  const n = Sa(t);
  return n === j && Eg(t.state), n;
}, Tg = (t, n) => Yn(t) || t.state.wrap !== 2 ? lt : (t.state.gzhead = n, j), ba = (t, n, e, o, s, i) => {
  if (!t)
    return lt;
  let r = 1;
  if (n === fg && (n = 6), o < 0 ? (r = 0, o = -o) : o > 15 && (r = 2, o -= 16), s < 1 || s > dg || e !== Me || o < 8 || o > 15 || n < 0 || n > 9 || i < 0 || i > hg || o === 8 && r !== 1)
    return Vt(t, lt);
  o === 8 && (o = 9);
  const a = new Bg();
  return t.state = a, a.strm = t, a.status = hn, a.wrap = r, a.gzhead = null, a.w_bits = o, a.w_size = 1 << a.w_bits, a.w_mask = a.w_size - 1, a.hash_bits = s + 7, a.hash_size = 1 << a.hash_bits, a.hash_mask = a.hash_size - 1, a.hash_shift = ~~((a.hash_bits + R - 1) / R), a.window = new Uint8Array(a.w_size * 2), a.head = new Uint16Array(a.hash_size), a.prev = new Uint16Array(a.w_size), a.lit_bufsize = 1 << s + 6, a.pending_buf_size = a.lit_bufsize * 4, a.pending_buf = new Uint8Array(a.pending_buf_size), a.sym_buf = a.lit_bufsize, a.sym_end = (a.lit_bufsize - 1) * 3, a.level = n, a.strategy = i, a.method = e, _a(t);
}, Mg = (t, n) => ba(t, n, Me, mg, yg, gg), Lg = (t, n) => {
  if (Yn(t) || n > ni || n < 0)
    return t ? Vt(t, lt) : lt;
  const e = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || e.status === An && n !== st)
    return Vt(t, t.avail_out === 0 ? no : lt);
  const o = e.last_flush;
  if (e.last_flush = n, e.pending !== 0) {
    if (tt(t), t.avail_out === 0)
      return e.last_flush = -1, j;
  } else if (t.avail_in === 0 && oi(n) <= oi(o) && n !== st)
    return Vt(t, no);
  if (e.status === An && t.avail_in !== 0)
    return Vt(t, no);
  if (e.status === hn && e.wrap === 0 && (e.status = Ft), e.status === hn) {
    let s = Me + (e.w_bits - 8 << 4) << 8, i = -1;
    if (e.strategy >= ne || e.level < 2 ? i = 0 : e.level < 6 ? i = 1 : e.level === 6 ? i = 2 : i = 3, s |= i << 6, e.strstart !== 0 && (s |= Ag), s += 31 - s % 31, Sn(e, s), e.strstart !== 0 && (Sn(e, t.adler >>> 16), Sn(e, t.adler & 65535)), t.adler = 1, e.status = Ft, tt(t), e.pending !== 0)
      return e.last_flush = -1, j;
  }
  if (e.status === rs) {
    if (t.adler = 0, z(e, 31), z(e, 139), z(e, 8), e.gzhead)
      z(
        e,
        (e.gzhead.text ? 1 : 0) + (e.gzhead.hcrc ? 2 : 0) + (e.gzhead.extra ? 4 : 0) + (e.gzhead.name ? 8 : 0) + (e.gzhead.comment ? 16 : 0)
      ), z(e, e.gzhead.time & 255), z(e, e.gzhead.time >> 8 & 255), z(e, e.gzhead.time >> 16 & 255), z(e, e.gzhead.time >> 24 & 255), z(e, e.level === 9 ? 2 : e.strategy >= ne || e.level < 2 ? 4 : 0), z(e, e.gzhead.os & 255), e.gzhead.extra && e.gzhead.extra.length && (z(e, e.gzhead.extra.length & 255), z(e, e.gzhead.extra.length >> 8 & 255)), e.gzhead.hcrc && (t.adler = H(t.adler, e.pending_buf, e.pending, 0)), e.gzindex = 0, e.status = Bo;
    else if (z(e, 0), z(e, 0), z(e, 0), z(e, 0), z(e, 0), z(e, e.level === 9 ? 2 : e.strategy >= ne || e.level < 2 ? 4 : 0), z(e, kg), e.status = Ft, tt(t), e.pending !== 0)
      return e.last_flush = -1, j;
  }
  if (e.status === Bo) {
    if (e.gzhead.extra) {
      let s = e.pending, i = (e.gzhead.extra.length & 65535) - e.gzindex;
      for (; e.pending + i > e.pending_buf_size; ) {
        let a = e.pending_buf_size - e.pending;
        if (e.pending_buf.set(e.gzhead.extra.subarray(e.gzindex, e.gzindex + a), e.pending), e.pending = e.pending_buf_size, e.gzhead.hcrc && e.pending > s && (t.adler = H(t.adler, e.pending_buf, e.pending - s, s)), e.gzindex += a, tt(t), e.pending !== 0)
          return e.last_flush = -1, j;
        s = 0, i -= a;
      }
      let r = new Uint8Array(e.gzhead.extra);
      e.pending_buf.set(r.subarray(e.gzindex, e.gzindex + i), e.pending), e.pending += i, e.gzhead.hcrc && e.pending > s && (t.adler = H(t.adler, e.pending_buf, e.pending - s, s)), e.gzindex = 0;
    }
    e.status = To;
  }
  if (e.status === To) {
    if (e.gzhead.name) {
      let s = e.pending, i;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > s && (t.adler = H(t.adler, e.pending_buf, e.pending - s, s)), tt(t), e.pending !== 0)
            return e.last_flush = -1, j;
          s = 0;
        }
        e.gzindex < e.gzhead.name.length ? i = e.gzhead.name.charCodeAt(e.gzindex++) & 255 : i = 0, z(e, i);
      } while (i !== 0);
      e.gzhead.hcrc && e.pending > s && (t.adler = H(t.adler, e.pending_buf, e.pending - s, s)), e.gzindex = 0;
    }
    e.status = Mo;
  }
  if (e.status === Mo) {
    if (e.gzhead.comment) {
      let s = e.pending, i;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > s && (t.adler = H(t.adler, e.pending_buf, e.pending - s, s)), tt(t), e.pending !== 0)
            return e.last_flush = -1, j;
          s = 0;
        }
        e.gzindex < e.gzhead.comment.length ? i = e.gzhead.comment.charCodeAt(e.gzindex++) & 255 : i = 0, z(e, i);
      } while (i !== 0);
      e.gzhead.hcrc && e.pending > s && (t.adler = H(t.adler, e.pending_buf, e.pending - s, s));
    }
    e.status = Lo;
  }
  if (e.status === Lo) {
    if (e.gzhead.hcrc) {
      if (e.pending + 2 > e.pending_buf_size && (tt(t), e.pending !== 0))
        return e.last_flush = -1, j;
      z(e, t.adler & 255), z(e, t.adler >> 8 & 255), t.adler = 0;
    }
    if (e.status = Ft, tt(t), e.pending !== 0)
      return e.last_flush = -1, j;
  }
  if (t.avail_in !== 0 || e.lookahead !== 0 || n !== Dt && e.status !== An) {
    let s = e.level === 0 ? wa(e, n) : e.strategy === ne ? Dg(e, n) : e.strategy === lg ? Ig(e, n) : kn[e.level].func(e, n);
    if ((s === Nt || s === mn) && (e.status = An), s === X || s === Nt)
      return t.avail_out === 0 && (e.last_flush = -1), j;
    if (s === dn && (n === rg ? ig(e) : n !== ni && (Do(e, 0, 0, !1), n === ag && (bt(e.head), e.lookahead === 0 && (e.strstart = 0, e.block_start = 0, e.insert = 0))), tt(t), t.avail_out === 0))
      return e.last_flush = -1, j;
  }
  return n !== st ? j : e.wrap <= 0 ? ei : (e.wrap === 2 ? (z(e, t.adler & 255), z(e, t.adler >> 8 & 255), z(e, t.adler >> 16 & 255), z(e, t.adler >> 24 & 255), z(e, t.total_in & 255), z(e, t.total_in >> 8 & 255), z(e, t.total_in >> 16 & 255), z(e, t.total_in >> 24 & 255)) : (Sn(e, t.adler >>> 16), Sn(e, t.adler & 65535)), tt(t), e.wrap > 0 && (e.wrap = -e.wrap), e.pending !== 0 ? j : ei);
}, Rg = (t) => {
  if (Yn(t))
    return lt;
  const n = t.state.status;
  return t.state = null, n === Ft ? Vt(t, cg) : j;
}, zg = (t, n) => {
  let e = n.length;
  if (Yn(t))
    return lt;
  const o = t.state, s = o.wrap;
  if (s === 2 || s === 1 && o.status !== hn || o.lookahead)
    return lt;
  if (s === 1 && (t.adler = Vn(t.adler, n, e, 0)), o.wrap = 0, e >= o.w_size) {
    s === 0 && (bt(o.head), o.strstart = 0, o.block_start = 0, o.insert = 0);
    let c = new Uint8Array(o.w_size);
    c.set(n.subarray(e - o.w_size, e), 0), n = c, e = o.w_size;
  }
  const i = t.avail_in, r = t.next_in, a = t.input;
  for (t.avail_in = e, t.next_in = 0, t.input = n, gn(o); o.lookahead >= R; ) {
    let c = o.strstart, f = o.lookahead - (R - 1);
    do
      o.ins_h = Et(o, o.ins_h, o.window[c + R - 1]), o.prev[c & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = c, c++;
    while (--f);
    o.strstart = c, o.lookahead = R - 1, gn(o);
  }
  return o.strstart += o.lookahead, o.block_start = o.strstart, o.insert = o.lookahead, o.lookahead = 0, o.match_length = o.prev_length = R - 1, o.match_available = 0, t.next_in = r, t.input = a, t.avail_in = i, o.wrap = s, j;
};
var Fg = Mg, Vg = ba, Pg = _a, Ug = Sa, Ng = Tg, Gg = Lg, $g = Rg, Hg = zg, Zg = "pako deflate (from Nodeca project)", Dn = {
  deflateInit: Fg,
  deflateInit2: Vg,
  deflateReset: Pg,
  deflateResetKeep: Ug,
  deflateSetHeader: Ng,
  deflate: Gg,
  deflateEnd: $g,
  deflateSetDictionary: Hg,
  deflateInfo: Zg
};
const jg = (t, n) => Object.prototype.hasOwnProperty.call(t, n);
var Yg = function(t) {
  const n = Array.prototype.slice.call(arguments, 1);
  for (; n.length; ) {
    const e = n.shift();
    if (e) {
      if (typeof e != "object")
        throw new TypeError(e + "must be non-object");
      for (const o in e)
        jg(e, o) && (t[o] = e[o]);
    }
  }
  return t;
}, qg = (t) => {
  let n = 0;
  for (let o = 0, s = t.length; o < s; o++)
    n += t[o].length;
  const e = new Uint8Array(n);
  for (let o = 0, s = 0, i = t.length; o < i; o++) {
    let r = t[o];
    e.set(r, s), s += r.length;
  }
  return e;
}, Le = {
  assign: Yg,
  flattenChunks: qg
};
let va = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  va = !1;
}
const Pn = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  Pn[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
Pn[254] = Pn[254] = 1;
var Wg = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let n, e, o, s, i, r = t.length, a = 0;
  for (s = 0; s < r; s++)
    e = t.charCodeAt(s), (e & 64512) === 55296 && s + 1 < r && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (o - 56320), s++)), a += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (n = new Uint8Array(a), i = 0, s = 0; i < a; s++)
    e = t.charCodeAt(s), (e & 64512) === 55296 && s + 1 < r && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (o - 56320), s++)), e < 128 ? n[i++] = e : e < 2048 ? (n[i++] = 192 | e >>> 6, n[i++] = 128 | e & 63) : e < 65536 ? (n[i++] = 224 | e >>> 12, n[i++] = 128 | e >>> 6 & 63, n[i++] = 128 | e & 63) : (n[i++] = 240 | e >>> 18, n[i++] = 128 | e >>> 12 & 63, n[i++] = 128 | e >>> 6 & 63, n[i++] = 128 | e & 63);
  return n;
};
const Xg = (t, n) => {
  if (n < 65534 && t.subarray && va)
    return String.fromCharCode.apply(null, t.length === n ? t : t.subarray(0, n));
  let e = "";
  for (let o = 0; o < n; o++)
    e += String.fromCharCode(t[o]);
  return e;
};
var Kg = (t, n) => {
  const e = n || t.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(t.subarray(0, n));
  let o, s;
  const i = new Array(e * 2);
  for (s = 0, o = 0; o < e; ) {
    let r = t[o++];
    if (r < 128) {
      i[s++] = r;
      continue;
    }
    let a = Pn[r];
    if (a > 4) {
      i[s++] = 65533, o += a - 1;
      continue;
    }
    for (r &= a === 2 ? 31 : a === 3 ? 15 : 7; a > 1 && o < e; )
      r = r << 6 | t[o++] & 63, a--;
    if (a > 1) {
      i[s++] = 65533;
      continue;
    }
    r < 65536 ? i[s++] = r : (r -= 65536, i[s++] = 55296 | r >> 10 & 1023, i[s++] = 56320 | r & 1023);
  }
  return Xg(i, s);
}, Jg = (t, n) => {
  n = n || t.length, n > t.length && (n = t.length);
  let e = n - 1;
  for (; e >= 0 && (t[e] & 192) === 128; )
    e--;
  return e < 0 || e === 0 ? n : e + Pn[t[e]] > n ? e : n;
}, Un = {
  string2buf: Wg,
  buf2string: Kg,
  utf8border: Jg
};
function Qg() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var Aa = Qg;
const ka = Object.prototype.toString, {
  Z_NO_FLUSH: tp,
  Z_SYNC_FLUSH: np,
  Z_FULL_FLUSH: ep,
  Z_FINISH: op,
  Z_OK: Se,
  Z_STREAM_END: sp,
  Z_DEFAULT_COMPRESSION: ip,
  Z_DEFAULT_STRATEGY: rp,
  Z_DEFLATED: ap
} = Te;
function Re(t) {
  this.options = Le.assign({
    level: ip,
    method: ap,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: rp
  }, t || {});
  let n = this.options;
  n.raw && n.windowBits > 0 ? n.windowBits = -n.windowBits : n.gzip && n.windowBits > 0 && n.windowBits < 16 && (n.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Aa(), this.strm.avail_out = 0;
  let e = Dn.deflateInit2(
    this.strm,
    n.level,
    n.method,
    n.windowBits,
    n.memLevel,
    n.strategy
  );
  if (e !== Se)
    throw new Error(Ut[e]);
  if (n.header && Dn.deflateSetHeader(this.strm, n.header), n.dictionary) {
    let o;
    if (typeof n.dictionary == "string" ? o = Un.string2buf(n.dictionary) : ka.call(n.dictionary) === "[object ArrayBuffer]" ? o = new Uint8Array(n.dictionary) : o = n.dictionary, e = Dn.deflateSetDictionary(this.strm, o), e !== Se)
      throw new Error(Ut[e]);
    this._dict_set = !0;
  }
}
Re.prototype.push = function(t, n) {
  const e = this.strm, o = this.options.chunkSize;
  let s, i;
  if (this.ended)
    return !1;
  for (n === ~~n ? i = n : i = n === !0 ? op : tp, typeof t == "string" ? e.input = Un.string2buf(t) : ka.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    if (e.avail_out === 0 && (e.output = new Uint8Array(o), e.next_out = 0, e.avail_out = o), (i === np || i === ep) && e.avail_out <= 6) {
      this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      continue;
    }
    if (s = Dn.deflate(e, i), s === sp)
      return e.next_out > 0 && this.onData(e.output.subarray(0, e.next_out)), s = Dn.deflateEnd(this.strm), this.onEnd(s), this.ended = !0, s === Se;
    if (e.avail_out === 0) {
      this.onData(e.output);
      continue;
    }
    if (i > 0 && e.next_out > 0) {
      this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      continue;
    }
    if (e.avail_in === 0) break;
  }
  return !0;
};
Re.prototype.onData = function(t) {
  this.chunks.push(t);
};
Re.prototype.onEnd = function(t) {
  t === Se && (this.result = Le.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function cp(t, n) {
  const e = new Re(n);
  if (e.push(t, !0), e.err)
    throw e.msg || Ut[e.err];
  return e.result;
}
var fp = cp, up = {
  deflate: fp
};
const ee = 16209, lp = 16191;
var hp = function(n, e) {
  let o, s, i, r, a, c, f, u, l, g, p, h, d, x, m, y, _, w, S, A, b, D, C, k;
  const I = n.state;
  o = n.next_in, C = n.input, s = o + (n.avail_in - 5), i = n.next_out, k = n.output, r = i - (e - n.avail_out), a = i + (n.avail_out - 257), c = I.dmax, f = I.wsize, u = I.whave, l = I.wnext, g = I.window, p = I.hold, h = I.bits, d = I.lencode, x = I.distcode, m = (1 << I.lenbits) - 1, y = (1 << I.distbits) - 1;
  t:
    do {
      h < 15 && (p += C[o++] << h, h += 8, p += C[o++] << h, h += 8), _ = d[p & m];
      n:
        for (; ; ) {
          if (w = _ >>> 24, p >>>= w, h -= w, w = _ >>> 16 & 255, w === 0)
            k[i++] = _ & 65535;
          else if (w & 16) {
            S = _ & 65535, w &= 15, w && (h < w && (p += C[o++] << h, h += 8), S += p & (1 << w) - 1, p >>>= w, h -= w), h < 15 && (p += C[o++] << h, h += 8, p += C[o++] << h, h += 8), _ = x[p & y];
            e:
              for (; ; ) {
                if (w = _ >>> 24, p >>>= w, h -= w, w = _ >>> 16 & 255, w & 16) {
                  if (A = _ & 65535, w &= 15, h < w && (p += C[o++] << h, h += 8, h < w && (p += C[o++] << h, h += 8)), A += p & (1 << w) - 1, A > c) {
                    n.msg = "invalid distance too far back", I.mode = ee;
                    break t;
                  }
                  if (p >>>= w, h -= w, w = i - r, A > w) {
                    if (w = A - w, w > u && I.sane) {
                      n.msg = "invalid distance too far back", I.mode = ee;
                      break t;
                    }
                    if (b = 0, D = g, l === 0) {
                      if (b += f - w, w < S) {
                        S -= w;
                        do
                          k[i++] = g[b++];
                        while (--w);
                        b = i - A, D = k;
                      }
                    } else if (l < w) {
                      if (b += f + l - w, w -= l, w < S) {
                        S -= w;
                        do
                          k[i++] = g[b++];
                        while (--w);
                        if (b = 0, l < S) {
                          w = l, S -= w;
                          do
                            k[i++] = g[b++];
                          while (--w);
                          b = i - A, D = k;
                        }
                      }
                    } else if (b += l - w, w < S) {
                      S -= w;
                      do
                        k[i++] = g[b++];
                      while (--w);
                      b = i - A, D = k;
                    }
                    for (; S > 2; )
                      k[i++] = D[b++], k[i++] = D[b++], k[i++] = D[b++], S -= 3;
                    S && (k[i++] = D[b++], S > 1 && (k[i++] = D[b++]));
                  } else {
                    b = i - A;
                    do
                      k[i++] = k[b++], k[i++] = k[b++], k[i++] = k[b++], S -= 3;
                    while (S > 2);
                    S && (k[i++] = k[b++], S > 1 && (k[i++] = k[b++]));
                  }
                } else if ((w & 64) === 0) {
                  _ = x[(_ & 65535) + (p & (1 << w) - 1)];
                  continue e;
                } else {
                  n.msg = "invalid distance code", I.mode = ee;
                  break t;
                }
                break;
              }
          } else if ((w & 64) === 0) {
            _ = d[(_ & 65535) + (p & (1 << w) - 1)];
            continue n;
          } else if (w & 32) {
            I.mode = lp;
            break t;
          } else {
            n.msg = "invalid literal/length code", I.mode = ee;
            break t;
          }
          break;
        }
    } while (o < s && i < a);
  S = h >> 3, o -= S, h -= S << 3, p &= (1 << h) - 1, n.next_in = o, n.next_out = i, n.avail_in = o < s ? 5 + (s - o) : 5 - (o - s), n.avail_out = i < a ? 257 + (a - i) : 257 - (i - a), I.hold = p, I.bits = h;
};
const Wt = 15, si = 852, ii = 592, ri = 0, oo = 1, ai = 2, gp = new Uint16Array([
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
]), pp = new Uint8Array([
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
]), dp = new Uint16Array([
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
]), mp = new Uint8Array([
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
]), yp = (t, n, e, o, s, i, r, a) => {
  const c = a.bits;
  let f = 0, u = 0, l = 0, g = 0, p = 0, h = 0, d = 0, x = 0, m = 0, y = 0, _, w, S, A, b, D = null, C;
  const k = new Uint16Array(Wt + 1), I = new Uint16Array(Wt + 1);
  let O = null, E, B, M;
  for (f = 0; f <= Wt; f++)
    k[f] = 0;
  for (u = 0; u < o; u++)
    k[n[e + u]]++;
  for (p = c, g = Wt; g >= 1 && k[g] === 0; g--)
    ;
  if (p > g && (p = g), g === 0)
    return s[i++] = 1 << 24 | 64 << 16 | 0, s[i++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (l = 1; l < g && k[l] === 0; l++)
    ;
  for (p < l && (p = l), x = 1, f = 1; f <= Wt; f++)
    if (x <<= 1, x -= k[f], x < 0)
      return -1;
  if (x > 0 && (t === ri || g !== 1))
    return -1;
  for (I[1] = 0, f = 1; f < Wt; f++)
    I[f + 1] = I[f] + k[f];
  for (u = 0; u < o; u++)
    n[e + u] !== 0 && (r[I[n[e + u]]++] = u);
  if (t === ri ? (D = O = r, C = 20) : t === oo ? (D = gp, O = pp, C = 257) : (D = dp, O = mp, C = 0), y = 0, u = 0, f = l, b = i, h = p, d = 0, S = -1, m = 1 << p, A = m - 1, t === oo && m > si || t === ai && m > ii)
    return 1;
  for (; ; ) {
    E = f - d, r[u] + 1 < C ? (B = 0, M = r[u]) : r[u] >= C ? (B = O[r[u] - C], M = D[r[u] - C]) : (B = 96, M = 0), _ = 1 << f - d, w = 1 << h, l = w;
    do
      w -= _, s[b + (y >> d) + w] = E << 24 | B << 16 | M | 0;
    while (w !== 0);
    for (_ = 1 << f - 1; y & _; )
      _ >>= 1;
    if (_ !== 0 ? (y &= _ - 1, y += _) : y = 0, u++, --k[f] === 0) {
      if (f === g)
        break;
      f = n[e + r[u]];
    }
    if (f > p && (y & A) !== S) {
      for (d === 0 && (d = p), b += l, h = f - d, x = 1 << h; h + d < g && (x -= k[h + d], !(x <= 0)); )
        h++, x <<= 1;
      if (m += 1 << h, t === oo && m > si || t === ai && m > ii)
        return 1;
      S = y & A, s[S] = p << 24 | h << 16 | b - i | 0;
    }
  }
  return y !== 0 && (s[b + y] = f - d << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var En = yp;
const xp = 0, Ca = 1, Oa = 2, {
  Z_FINISH: ci,
  Z_BLOCK: wp,
  Z_TREES: oe,
  Z_OK: Gt,
  Z_STREAM_END: Sp,
  Z_NEED_DICT: _p,
  Z_STREAM_ERROR: it,
  Z_DATA_ERROR: Ia,
  Z_MEM_ERROR: Da,
  Z_BUF_ERROR: bp,
  Z_DEFLATED: fi
} = Te, ze = 16180, ui = 16181, li = 16182, hi = 16183, gi = 16184, pi = 16185, di = 16186, mi = 16187, yi = 16188, xi = 16189, _e = 16190, mt = 16191, so = 16192, wi = 16193, io = 16194, Si = 16195, _i = 16196, bi = 16197, vi = 16198, se = 16199, ie = 16200, Ai = 16201, ki = 16202, Ci = 16203, Oi = 16204, Ii = 16205, ro = 16206, Di = 16207, Ei = 16208, G = 16209, Ea = 16210, Ba = 16211, vp = 852, Ap = 592, kp = 15, Cp = kp, Bi = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function Op() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const Ht = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.mode < ze || n.mode > Ba ? 1 : 0;
}, Ta = (t) => {
  if (Ht(t))
    return it;
  const n = t.state;
  return t.total_in = t.total_out = n.total = 0, t.msg = "", n.wrap && (t.adler = n.wrap & 1), n.mode = ze, n.last = 0, n.havedict = 0, n.flags = -1, n.dmax = 32768, n.head = null, n.hold = 0, n.bits = 0, n.lencode = n.lendyn = new Int32Array(vp), n.distcode = n.distdyn = new Int32Array(Ap), n.sane = 1, n.back = -1, Gt;
}, Ma = (t) => {
  if (Ht(t))
    return it;
  const n = t.state;
  return n.wsize = 0, n.whave = 0, n.wnext = 0, Ta(t);
}, La = (t, n) => {
  let e;
  if (Ht(t))
    return it;
  const o = t.state;
  return n < 0 ? (e = 0, n = -n) : (e = (n >> 4) + 5, n < 48 && (n &= 15)), n && (n < 8 || n > 15) ? it : (o.window !== null && o.wbits !== n && (o.window = null), o.wrap = e, o.wbits = n, Ma(t));
}, Ra = (t, n) => {
  if (!t)
    return it;
  const e = new Op();
  t.state = e, e.strm = t, e.window = null, e.mode = ze;
  const o = La(t, n);
  return o !== Gt && (t.state = null), o;
}, Ip = (t) => Ra(t, Cp);
let Ti = !0, ao, co;
const Dp = (t) => {
  if (Ti) {
    ao = new Int32Array(512), co = new Int32Array(32);
    let n = 0;
    for (; n < 144; )
      t.lens[n++] = 8;
    for (; n < 256; )
      t.lens[n++] = 9;
    for (; n < 280; )
      t.lens[n++] = 7;
    for (; n < 288; )
      t.lens[n++] = 8;
    for (En(Ca, t.lens, 0, 288, ao, 0, t.work, { bits: 9 }), n = 0; n < 32; )
      t.lens[n++] = 5;
    En(Oa, t.lens, 0, 32, co, 0, t.work, { bits: 5 }), Ti = !1;
  }
  t.lencode = ao, t.lenbits = 9, t.distcode = co, t.distbits = 5;
}, za = (t, n, e, o) => {
  let s;
  const i = t.state;
  return i.window === null && (i.wsize = 1 << i.wbits, i.wnext = 0, i.whave = 0, i.window = new Uint8Array(i.wsize)), o >= i.wsize ? (i.window.set(n.subarray(e - i.wsize, e), 0), i.wnext = 0, i.whave = i.wsize) : (s = i.wsize - i.wnext, s > o && (s = o), i.window.set(n.subarray(e - o, e - o + s), i.wnext), o -= s, o ? (i.window.set(n.subarray(e - o, e), 0), i.wnext = o, i.whave = i.wsize) : (i.wnext += s, i.wnext === i.wsize && (i.wnext = 0), i.whave < i.wsize && (i.whave += s))), 0;
}, Ep = (t, n) => {
  let e, o, s, i, r, a, c, f, u, l, g, p, h, d, x = 0, m, y, _, w, S, A, b, D;
  const C = new Uint8Array(4);
  let k, I;
  const O = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (Ht(t) || !t.output || !t.input && t.avail_in !== 0)
    return it;
  e = t.state, e.mode === mt && (e.mode = so), r = t.next_out, s = t.output, c = t.avail_out, i = t.next_in, o = t.input, a = t.avail_in, f = e.hold, u = e.bits, l = a, g = c, D = Gt;
  t:
    for (; ; )
      switch (e.mode) {
        case ze:
          if (e.wrap === 0) {
            e.mode = so;
            break;
          }
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if (e.wrap & 2 && f === 35615) {
            e.wbits === 0 && (e.wbits = 15), e.check = 0, C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = H(e.check, C, 2, 0), f = 0, u = 0, e.mode = ui;
            break;
          }
          if (e.head && (e.head.done = !1), !(e.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", e.mode = G;
            break;
          }
          if ((f & 15) !== fi) {
            t.msg = "unknown compression method", e.mode = G;
            break;
          }
          if (f >>>= 4, u -= 4, b = (f & 15) + 8, e.wbits === 0 && (e.wbits = b), b > 15 || b > e.wbits) {
            t.msg = "invalid window size", e.mode = G;
            break;
          }
          e.dmax = 1 << e.wbits, e.flags = 0, t.adler = e.check = 1, e.mode = f & 512 ? xi : mt, f = 0, u = 0;
          break;
        case ui:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if (e.flags = f, (e.flags & 255) !== fi) {
            t.msg = "unknown compression method", e.mode = G;
            break;
          }
          if (e.flags & 57344) {
            t.msg = "unknown header flags set", e.mode = G;
            break;
          }
          e.head && (e.head.text = f >> 8 & 1), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = H(e.check, C, 2, 0)), f = 0, u = 0, e.mode = li;
        /* falls through */
        case li:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          e.head && (e.head.time = f), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, C[2] = f >>> 16 & 255, C[3] = f >>> 24 & 255, e.check = H(e.check, C, 4, 0)), f = 0, u = 0, e.mode = hi;
        /* falls through */
        case hi:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          e.head && (e.head.xflags = f & 255, e.head.os = f >> 8), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = H(e.check, C, 2, 0)), f = 0, u = 0, e.mode = gi;
        /* falls through */
        case gi:
          if (e.flags & 1024) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            e.length = f, e.head && (e.head.extra_len = f), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = H(e.check, C, 2, 0)), f = 0, u = 0;
          } else e.head && (e.head.extra = null);
          e.mode = pi;
        /* falls through */
        case pi:
          if (e.flags & 1024 && (p = e.length, p > a && (p = a), p && (e.head && (b = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(
            o.subarray(
              i,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              i + p
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            b
          )), e.flags & 512 && e.wrap & 4 && (e.check = H(e.check, o, p, i)), a -= p, i += p, e.length -= p), e.length))
            break t;
          e.length = 0, e.mode = di;
        /* falls through */
        case di:
          if (e.flags & 2048) {
            if (a === 0)
              break t;
            p = 0;
            do
              b = o[i + p++], e.head && b && e.length < 65536 && (e.head.name += String.fromCharCode(b));
            while (b && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = H(e.check, o, p, i)), a -= p, i += p, b)
              break t;
          } else e.head && (e.head.name = null);
          e.length = 0, e.mode = mi;
        /* falls through */
        case mi:
          if (e.flags & 4096) {
            if (a === 0)
              break t;
            p = 0;
            do
              b = o[i + p++], e.head && b && e.length < 65536 && (e.head.comment += String.fromCharCode(b));
            while (b && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = H(e.check, o, p, i)), a -= p, i += p, b)
              break t;
          } else e.head && (e.head.comment = null);
          e.mode = yi;
        /* falls through */
        case yi:
          if (e.flags & 512) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            if (e.wrap & 4 && f !== (e.check & 65535)) {
              t.msg = "header crc mismatch", e.mode = G;
              break;
            }
            f = 0, u = 0;
          }
          e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), t.adler = e.check = 0, e.mode = mt;
          break;
        case xi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          t.adler = e.check = Bi(f), f = 0, u = 0, e.mode = _e;
        /* falls through */
        case _e:
          if (e.havedict === 0)
            return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, _p;
          t.adler = e.check = 1, e.mode = mt;
        /* falls through */
        case mt:
          if (n === wp || n === oe)
            break t;
        /* falls through */
        case so:
          if (e.last) {
            f >>>= u & 7, u -= u & 7, e.mode = ro;
            break;
          }
          for (; u < 3; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          switch (e.last = f & 1, f >>>= 1, u -= 1, f & 3) {
            case 0:
              e.mode = wi;
              break;
            case 1:
              if (Dp(e), e.mode = se, n === oe) {
                f >>>= 2, u -= 2;
                break t;
              }
              break;
            case 2:
              e.mode = _i;
              break;
            case 3:
              t.msg = "invalid block type", e.mode = G;
          }
          f >>>= 2, u -= 2;
          break;
        case wi:
          for (f >>>= u & 7, u -= u & 7; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", e.mode = G;
            break;
          }
          if (e.length = f & 65535, f = 0, u = 0, e.mode = io, n === oe)
            break t;
        /* falls through */
        case io:
          e.mode = Si;
        /* falls through */
        case Si:
          if (p = e.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            s.set(o.subarray(i, i + p), r), a -= p, i += p, c -= p, r += p, e.length -= p;
            break;
          }
          e.mode = mt;
          break;
        case _i:
          for (; u < 14; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if (e.nlen = (f & 31) + 257, f >>>= 5, u -= 5, e.ndist = (f & 31) + 1, f >>>= 5, u -= 5, e.ncode = (f & 15) + 4, f >>>= 4, u -= 4, e.nlen > 286 || e.ndist > 30) {
            t.msg = "too many length or distance symbols", e.mode = G;
            break;
          }
          e.have = 0, e.mode = bi;
        /* falls through */
        case bi:
          for (; e.have < e.ncode; ) {
            for (; u < 3; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            e.lens[O[e.have++]] = f & 7, f >>>= 3, u -= 3;
          }
          for (; e.have < 19; )
            e.lens[O[e.have++]] = 0;
          if (e.lencode = e.lendyn, e.lenbits = 7, k = { bits: e.lenbits }, D = En(xp, e.lens, 0, 19, e.lencode, 0, e.work, k), e.lenbits = k.bits, D) {
            t.msg = "invalid code lengths set", e.mode = G;
            break;
          }
          e.have = 0, e.mode = vi;
        /* falls through */
        case vi:
          for (; e.have < e.nlen + e.ndist; ) {
            for (; x = e.lencode[f & (1 << e.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            if (_ < 16)
              f >>>= m, u -= m, e.lens[e.have++] = _;
            else {
              if (_ === 16) {
                for (I = m + 2; u < I; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[i++] << u, u += 8;
                }
                if (f >>>= m, u -= m, e.have === 0) {
                  t.msg = "invalid bit length repeat", e.mode = G;
                  break;
                }
                b = e.lens[e.have - 1], p = 3 + (f & 3), f >>>= 2, u -= 2;
              } else if (_ === 17) {
                for (I = m + 3; u < I; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[i++] << u, u += 8;
                }
                f >>>= m, u -= m, b = 0, p = 3 + (f & 7), f >>>= 3, u -= 3;
              } else {
                for (I = m + 7; u < I; ) {
                  if (a === 0)
                    break t;
                  a--, f += o[i++] << u, u += 8;
                }
                f >>>= m, u -= m, b = 0, p = 11 + (f & 127), f >>>= 7, u -= 7;
              }
              if (e.have + p > e.nlen + e.ndist) {
                t.msg = "invalid bit length repeat", e.mode = G;
                break;
              }
              for (; p--; )
                e.lens[e.have++] = b;
            }
          }
          if (e.mode === G)
            break;
          if (e.lens[256] === 0) {
            t.msg = "invalid code -- missing end-of-block", e.mode = G;
            break;
          }
          if (e.lenbits = 9, k = { bits: e.lenbits }, D = En(Ca, e.lens, 0, e.nlen, e.lencode, 0, e.work, k), e.lenbits = k.bits, D) {
            t.msg = "invalid literal/lengths set", e.mode = G;
            break;
          }
          if (e.distbits = 6, e.distcode = e.distdyn, k = { bits: e.distbits }, D = En(Oa, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, k), e.distbits = k.bits, D) {
            t.msg = "invalid distances set", e.mode = G;
            break;
          }
          if (e.mode = se, n === oe)
            break t;
        /* falls through */
        case se:
          e.mode = ie;
        /* falls through */
        case ie:
          if (a >= 6 && c >= 258) {
            t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, hp(t, g), r = t.next_out, s = t.output, c = t.avail_out, i = t.next_in, o = t.input, a = t.avail_in, f = e.hold, u = e.bits, e.mode === mt && (e.back = -1);
            break;
          }
          for (e.back = 0; x = e.lencode[f & (1 << e.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if (y && (y & 240) === 0) {
            for (w = m, S = y, A = _; x = e.lencode[A + ((f & (1 << w + S) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            f >>>= w, u -= w, e.back += w;
          }
          if (f >>>= m, u -= m, e.back += m, e.length = _, y === 0) {
            e.mode = Ii;
            break;
          }
          if (y & 32) {
            e.back = -1, e.mode = mt;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", e.mode = G;
            break;
          }
          e.extra = y & 15, e.mode = Ai;
        /* falls through */
        case Ai:
          if (e.extra) {
            for (I = e.extra; u < I; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            e.length += f & (1 << e.extra) - 1, f >>>= e.extra, u -= e.extra, e.back += e.extra;
          }
          e.was = e.length, e.mode = ki;
        /* falls through */
        case ki:
          for (; x = e.distcode[f & (1 << e.distbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if ((y & 240) === 0) {
            for (w = m, S = y, A = _; x = e.distcode[A + ((f & (1 << w + S) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            f >>>= w, u -= w, e.back += w;
          }
          if (f >>>= m, u -= m, e.back += m, y & 64) {
            t.msg = "invalid distance code", e.mode = G;
            break;
          }
          e.offset = _, e.extra = y & 15, e.mode = Ci;
        /* falls through */
        case Ci:
          if (e.extra) {
            for (I = e.extra; u < I; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            e.offset += f & (1 << e.extra) - 1, f >>>= e.extra, u -= e.extra, e.back += e.extra;
          }
          if (e.offset > e.dmax) {
            t.msg = "invalid distance too far back", e.mode = G;
            break;
          }
          e.mode = Oi;
        /* falls through */
        case Oi:
          if (c === 0)
            break t;
          if (p = g - c, e.offset > p) {
            if (p = e.offset - p, p > e.whave && e.sane) {
              t.msg = "invalid distance too far back", e.mode = G;
              break;
            }
            p > e.wnext ? (p -= e.wnext, h = e.wsize - p) : h = e.wnext - p, p > e.length && (p = e.length), d = e.window;
          } else
            d = s, h = r - e.offset, p = e.length;
          p > c && (p = c), c -= p, e.length -= p;
          do
            s[r++] = d[h++];
          while (--p);
          e.length === 0 && (e.mode = ie);
          break;
        case Ii:
          if (c === 0)
            break t;
          s[r++] = e.length, c--, e.mode = ie;
          break;
        case ro:
          if (e.wrap) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f |= o[i++] << u, u += 8;
            }
            if (g -= c, t.total_out += g, e.total += g, e.wrap & 4 && g && (t.adler = e.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            e.flags ? H(e.check, s, g, r - g) : Vn(e.check, s, g, r - g)), g = c, e.wrap & 4 && (e.flags ? f : Bi(f)) !== e.check) {
              t.msg = "incorrect data check", e.mode = G;
              break;
            }
            f = 0, u = 0;
          }
          e.mode = Di;
        /* falls through */
        case Di:
          if (e.wrap && e.flags) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            if (e.wrap & 4 && f !== (e.total & 4294967295)) {
              t.msg = "incorrect length check", e.mode = G;
              break;
            }
            f = 0, u = 0;
          }
          e.mode = Ei;
        /* falls through */
        case Ei:
          D = Sp;
          break t;
        case G:
          D = Ia;
          break t;
        case Ea:
          return Da;
        case Ba:
        /* falls through */
        default:
          return it;
      }
  return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, (e.wsize || g !== t.avail_out && e.mode < G && (e.mode < ro || n !== ci)) && za(t, t.output, t.next_out, g - t.avail_out), l -= t.avail_in, g -= t.avail_out, t.total_in += l, t.total_out += g, e.total += g, e.wrap & 4 && g && (t.adler = e.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  e.flags ? H(e.check, s, g, t.next_out - g) : Vn(e.check, s, g, t.next_out - g)), t.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === mt ? 128 : 0) + (e.mode === se || e.mode === io ? 256 : 0), (l === 0 && g === 0 || n === ci) && D === Gt && (D = bp), D;
}, Bp = (t) => {
  if (Ht(t))
    return it;
  let n = t.state;
  return n.window && (n.window = null), t.state = null, Gt;
}, Tp = (t, n) => {
  if (Ht(t))
    return it;
  const e = t.state;
  return (e.wrap & 2) === 0 ? it : (e.head = n, n.done = !1, Gt);
}, Mp = (t, n) => {
  const e = n.length;
  let o, s, i;
  return Ht(t) || (o = t.state, o.wrap !== 0 && o.mode !== _e) ? it : o.mode === _e && (s = 1, s = Vn(s, n, e, 0), s !== o.check) ? Ia : (i = za(t, n, e, e), i ? (o.mode = Ea, Da) : (o.havedict = 1, Gt));
};
var Lp = Ma, Rp = La, zp = Ta, Fp = Ip, Vp = Ra, Pp = Ep, Up = Bp, Np = Tp, Gp = Mp, $p = "pako inflate (from Nodeca project)", wt = {
  inflateReset: Lp,
  inflateReset2: Rp,
  inflateResetKeep: zp,
  inflateInit: Fp,
  inflateInit2: Vp,
  inflate: Pp,
  inflateEnd: Up,
  inflateGetHeader: Np,
  inflateSetDictionary: Gp,
  inflateInfo: $p
};
function Hp() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var Zp = Hp;
const Fa = Object.prototype.toString, {
  Z_NO_FLUSH: jp,
  Z_FINISH: Yp,
  Z_OK: Nn,
  Z_STREAM_END: fo,
  Z_NEED_DICT: uo,
  Z_STREAM_ERROR: qp,
  Z_DATA_ERROR: Mi,
  Z_MEM_ERROR: Wp
} = Te;
function Fe(t) {
  this.options = Le.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const n = this.options;
  n.raw && n.windowBits >= 0 && n.windowBits < 16 && (n.windowBits = -n.windowBits, n.windowBits === 0 && (n.windowBits = -15)), n.windowBits >= 0 && n.windowBits < 16 && !(t && t.windowBits) && (n.windowBits += 32), n.windowBits > 15 && n.windowBits < 48 && (n.windowBits & 15) === 0 && (n.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Aa(), this.strm.avail_out = 0;
  let e = wt.inflateInit2(
    this.strm,
    n.windowBits
  );
  if (e !== Nn)
    throw new Error(Ut[e]);
  if (this.header = new Zp(), wt.inflateGetHeader(this.strm, this.header), n.dictionary && (typeof n.dictionary == "string" ? n.dictionary = Un.string2buf(n.dictionary) : Fa.call(n.dictionary) === "[object ArrayBuffer]" && (n.dictionary = new Uint8Array(n.dictionary)), n.raw && (e = wt.inflateSetDictionary(this.strm, n.dictionary), e !== Nn)))
    throw new Error(Ut[e]);
}
Fe.prototype.push = function(t, n) {
  const e = this.strm, o = this.options.chunkSize, s = this.options.dictionary;
  let i, r, a;
  if (this.ended) return !1;
  for (n === ~~n ? r = n : r = n === !0 ? Yp : jp, Fa.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(o), e.next_out = 0, e.avail_out = o), i = wt.inflate(e, r), i === uo && s && (i = wt.inflateSetDictionary(e, s), i === Nn ? i = wt.inflate(e, r) : i === Mi && (i = uo)); e.avail_in > 0 && i === fo && e.state.wrap > 0 && t[e.next_in] !== 0; )
      wt.inflateReset(e), i = wt.inflate(e, r);
    switch (i) {
      case qp:
      case Mi:
      case uo:
      case Wp:
        return this.onEnd(i), this.ended = !0, !1;
    }
    if (a = e.avail_out, e.next_out && (e.avail_out === 0 || i === fo))
      if (this.options.to === "string") {
        let c = Un.utf8border(e.output, e.next_out), f = e.next_out - c, u = Un.buf2string(e.output, c);
        e.next_out = f, e.avail_out = o - f, f && e.output.set(e.output.subarray(c, c + f), 0), this.onData(u);
      } else
        this.onData(e.output.length === e.next_out ? e.output : e.output.subarray(0, e.next_out));
    if (!(i === Nn && a === 0)) {
      if (i === fo)
        return i = wt.inflateEnd(this.strm), this.onEnd(i), this.ended = !0, !0;
      if (e.avail_in === 0) break;
    }
  }
  return !0;
};
Fe.prototype.onData = function(t) {
  this.chunks.push(t);
};
Fe.prototype.onEnd = function(t) {
  t === Nn && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = Le.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Xp(t, n) {
  const e = new Fe(n);
  if (e.push(t), e.err) throw e.msg || Ut[e.err];
  return e.result;
}
var Kp = Xp, Jp = {
  inflate: Kp
};
const { deflate: Qp } = up, { inflate: td } = Jp;
var Li = Qp, Ri = td;
const Va = 2001684038, zo = 44, Fo = 20, be = 12, ve = 16;
function nd(t) {
  const n = new DataView(t), e = new Uint8Array(t);
  if (n.getUint32(0) !== Va)
    throw new Error("Invalid WOFF1 signature");
  const s = n.getUint32(4), i = n.getUint16(12), r = n.getUint32(24), a = n.getUint32(28), c = n.getUint32(36), f = n.getUint32(40), u = [];
  let l = zo;
  for (let C = 0; C < i; C++)
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
    }), l += Fo;
  const g = u.map((C) => {
    const k = e.subarray(
      C.offset,
      C.offset + C.compLength
    );
    let I;
    if (C.compLength < C.origLength) {
      if (I = Ri(k), I.length !== C.origLength)
        throw new Error(
          `WOFF1 table '${C.tag}': decompressed size ${I.length} !== expected ${C.origLength}`
        );
    } else
      I = k;
    return {
      tag: C.tag,
      checksum: C.origChecksum,
      data: I,
      length: C.origLength,
      paddedLength: C.origLength + (4 - C.origLength % 4) % 4
    };
  }), p = be + i * ve;
  let h = p + (4 - p % 4) % 4;
  const { searchRange: d, entrySelector: x, rangeShift: m } = ed(i);
  let y = h;
  for (const C of g)
    y += C.paddedLength;
  const _ = new ArrayBuffer(y), w = new DataView(_), S = new Uint8Array(_);
  w.setUint32(0, s), w.setUint16(4, i), w.setUint16(6, d), w.setUint16(8, x), w.setUint16(10, m);
  const A = g.map((C, k) => ({ ...C, originalIndex: k })).sort((C, k) => C.tag < k.tag ? -1 : C.tag > k.tag ? 1 : 0);
  for (let C = 0; C < A.length; C++) {
    const k = A[C], I = be + C * ve;
    for (let O = 0; O < 4; O++)
      w.setUint8(I + O, k.tag.charCodeAt(O));
    w.setUint32(I + 4, k.checksum), w.setUint32(I + 8, h), w.setUint32(I + 12, k.length), S.set(k.data, h), h += k.paddedLength;
  }
  let b = null;
  if (r && a) {
    const C = e.subarray(r, r + a);
    b = Ri(C);
  }
  let D = null;
  return c && f && (D = e.slice(c, c + f)), { sfnt: _, metadata: b, privateData: D };
}
function Vo(t, n = null, e = null) {
  const o = new DataView(t), s = new Uint8Array(t), i = o.getUint32(0), r = o.getUint16(4), a = [];
  for (let A = 0; A < r; A++) {
    const b = be + A * ve;
    a.push({
      tag: String.fromCharCode(
        o.getUint8(b),
        o.getUint8(b + 1),
        o.getUint8(b + 2),
        o.getUint8(b + 3)
      ),
      checksum: o.getUint32(b + 4),
      offset: o.getUint32(b + 8),
      length: o.getUint32(b + 12)
    });
  }
  const c = a.map((A) => {
    const b = s.subarray(A.offset, A.offset + A.length), D = Li(b), C = D.length < A.length;
    return {
      tag: A.tag,
      origChecksum: A.checksum,
      origLength: A.length,
      data: C ? D : b,
      compLength: C ? D.length : A.length
    };
  });
  let f = null, u = 0;
  n && n.length > 0 && (u = n.length, f = Li(n));
  let g = zo + r * Fo;
  g += (4 - g % 4) % 4;
  for (const A of c)
    A.woffOffset = g, g += A.compLength, g += (4 - g % 4) % 4;
  let p = 0, h = 0;
  f && (p = g, h = f.length, g += h, g += (4 - g % 4) % 4);
  let d = 0, x = 0;
  e && e.length > 0 && (d = g, x = e.length, g += x);
  const m = g;
  let y = be + r * ve;
  for (const A of c)
    y += A.origLength + (4 - A.origLength % 4) % 4;
  const _ = new ArrayBuffer(m), w = new DataView(_), S = new Uint8Array(_);
  w.setUint32(0, Va), w.setUint32(4, i), w.setUint32(8, m), w.setUint16(12, r), w.setUint16(14, 0), w.setUint32(16, y), w.setUint16(20, 0), w.setUint16(22, 0), w.setUint32(24, p), w.setUint32(28, h), w.setUint32(32, u), w.setUint32(36, d), w.setUint32(40, x);
  for (let A = 0; A < c.length; A++) {
    const b = c[A], D = zo + A * Fo;
    for (let C = 0; C < 4; C++)
      w.setUint8(D + C, b.tag.charCodeAt(C));
    w.setUint32(D + 4, b.woffOffset), w.setUint32(D + 8, b.compLength), w.setUint32(D + 12, b.origLength), w.setUint32(D + 16, b.origChecksum);
  }
  for (const A of c)
    S.set(A.data, A.woffOffset);
  return f && S.set(f, p), e && e.length > 0 && S.set(e, d), _;
}
function ed(t) {
  let n = 1, e = 0;
  for (; n * 2 <= t; )
    n *= 2, e++;
  n *= 16;
  const o = t * 16 - n;
  return { searchRange: n, entrySelector: e, rangeShift: o };
}
let Ae = null, rn = null;
async function od() {
  if (!rn)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: n } = await import("node:zlib");
      Ae = (e) => new Uint8Array(t(e)), rn = (e) => new Uint8Array(n(e));
    } catch {
      const t = await import("brotli-wasm"), n = await (t.default || t);
      Ae = n.compress, rn = n.decompress;
    }
}
function Pa() {
  if (!rn)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const Ua = 2001684018, Po = 48, Gn = 12, $n = 16, Uo = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "OS/2",
  "post",
  // 0-7
  "cvt ",
  "fpgm",
  "glyf",
  "loca",
  "prep",
  "CFF ",
  "VORG",
  "EBDT",
  // 8-15
  "EBLC",
  "gasp",
  "hdmx",
  "kern",
  "LTSH",
  "PCLT",
  "VDMX",
  "vhea",
  // 16-23
  "vmtx",
  "BASE",
  "GDEF",
  "GPOS",
  "GSUB",
  "EBSC",
  "JSTF",
  "MATH",
  // 24-31
  "CBDT",
  "CBLC",
  "COLR",
  "CPAL",
  "SVG ",
  "sbix",
  "acnt",
  "avar",
  // 32-39
  "bdat",
  "bloc",
  "bsln",
  "cvar",
  "fdsc",
  "feat",
  "fmtx",
  "fvar",
  // 40-47
  "gvar",
  "hsty",
  "just",
  "lcar",
  "mort",
  "morx",
  "opbd",
  "prop",
  // 48-55
  "trak",
  "Zapf",
  "Silf",
  "Glat",
  "Gloc",
  "Feat",
  "Sill"
  // 56-62
], Na = /* @__PURE__ */ new Map();
for (let t = 0; t < Uo.length; t++) Na.set(Uo[t], t);
function zi(t, n) {
  let e = 0;
  for (let o = 0; o < 5; o++) {
    const s = t[n + o];
    if (o === 0 && s === 128)
      throw new Error("UIntBase128: leading zero");
    if (e & 4261412864)
      throw new Error("UIntBase128: overflow");
    if (e = e << 7 | s & 127, !(s & 128))
      return { value: e >>> 0, bytesRead: o + 1 };
  }
  throw new Error("UIntBase128: exceeds 5 bytes");
}
function sd(t) {
  const n = [];
  let e = t >>> 0;
  const o = [];
  do
    o.push(e & 127), e >>>= 7;
  while (e > 0);
  o.reverse();
  for (let s = 0; s < o.length; s++)
    n.push(s < o.length - 1 ? o[s] | 128 : o[s]);
  return n;
}
function an(t, n) {
  const e = t[n];
  return e === 253 ? { value: t[n + 1] << 8 | t[n + 2], bytesRead: 3 } : e === 255 ? { value: t[n + 1] + 253, bytesRead: 2 } : e === 254 ? { value: t[n + 1] + 506, bytesRead: 2 } : { value: e, bytesRead: 1 };
}
const id = rd();
function rd() {
  const t = [];
  for (let s = 0; s < 10; s++)
    t.push({
      xBits: 0,
      yBits: 8,
      deltaX: 0,
      deltaY: (s >> 1) * 256,
      xSign: 0,
      ySign: s & 1 ? 1 : -1
    });
  for (let s = 0; s < 10; s++)
    t.push({
      xBits: 8,
      yBits: 0,
      deltaX: (s >> 1) * 256,
      deltaY: 0,
      xSign: s & 1 ? 1 : -1,
      ySign: 0
    });
  const n = [1, 17, 33, 49], e = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const s of n)
    for (const i of n)
      for (const [r, a] of e)
        t.push({ xBits: 4, yBits: 4, deltaX: s, deltaY: i, xSign: r, ySign: a });
  const o = [1, 257, 513];
  for (const s of o)
    for (const i of o)
      for (const [r, a] of e)
        t.push({ xBits: 8, yBits: 8, deltaX: s, deltaY: i, xSign: r, ySign: a });
  for (const [s, i] of e)
    t.push({ xBits: 12, yBits: 12, deltaX: 0, deltaY: 0, xSign: s, ySign: i });
  for (const [s, i] of e)
    t.push({ xBits: 16, yBits: 16, deltaX: 0, deltaY: 0, xSign: s, ySign: i });
  return t;
}
function ad(t, n, e) {
  const o = t & 127, s = !(t & 128), i = id[o];
  let r = 0, a = 0, c = e;
  if (i.xBits === 0 && i.yBits === 8)
    a = i.ySign * (n[c++] + i.deltaY);
  else if (i.xBits === 8 && i.yBits === 0)
    r = i.xSign * (n[c++] + i.deltaX);
  else if (i.xBits === 4 && i.yBits === 4) {
    const f = n[c++];
    r = i.xSign * ((f >> 4 & 15) + i.deltaX), a = i.ySign * ((f & 15) + i.deltaY);
  } else if (i.xBits === 8 && i.yBits === 8)
    r = i.xSign * (n[c++] + i.deltaX), a = i.ySign * (n[c++] + i.deltaY);
  else if (i.xBits === 12 && i.yBits === 12) {
    const f = n[c++], u = n[c++], l = n[c++];
    r = i.xSign * ((f << 4 | u >> 4) + i.deltaX), a = i.ySign * (((u & 15) << 8 | l) + i.deltaY);
  } else i.xBits === 16 && i.yBits === 16 && (r = i.xSign * ((n[c++] << 8 | n[c++]) + i.deltaX), a = i.ySign * ((n[c++] << 8 | n[c++]) + i.deltaY));
  return { dx: r, dy: a, onCurve: s, bytesConsumed: c - e };
}
function cd(t, n, e, o, s, i, r, a, c) {
  const f = [];
  ut(f, t), ut(f, s), ut(f, i), ut(f, r), ut(f, a);
  for (const h of n) Go(f, h);
  Go(f, o.length);
  for (let h = 0; h < o.length; h++) f.push(o[h]);
  const u = [], l = [], g = [];
  for (let h = 0; h < e.length; h++) {
    const { dx: d, dy: x, onCurve: m } = e[h];
    let y = m ? 1 : 0;
    if (h === 0 && c && (y |= 64), d === 0)
      y |= 16;
    else if (d >= -255 && d <= 255)
      y |= 2, d > 0 ? (y |= 16, l.push(d)) : l.push(-d);
    else {
      const _ = d & 65535;
      l.push(_ >> 8 & 255, _ & 255);
    }
    if (x === 0)
      y |= 32;
    else if (x >= -255 && x <= 255)
      y |= 4, x > 0 ? (y |= 32, g.push(x)) : g.push(-x);
    else {
      const _ = x & 65535;
      g.push(_ >> 8 & 255, _ & 255);
    }
    u.push(y);
  }
  let p = 0;
  for (; p < u.length; ) {
    const h = u[p];
    let d = 0;
    for (; p + d + 1 < u.length && u[p + d + 1] === h && d < 255; )
      d++;
    d > 0 ? (f.push(h | 8), f.push(d), p += d + 1) : (f.push(h), p++);
  }
  for (const h of l) f.push(h);
  for (const h of g) f.push(h);
  return f;
}
function fd(t, n, e, o, s, i) {
  const r = [];
  ut(r, -1), ut(r, e), ut(r, o), ut(r, s), ut(r, i);
  for (let a = 0; a < t.length; a++) r.push(t[a]);
  if (n && n.length > 0) {
    Go(r, n.length);
    for (let a = 0; a < n.length; a++) r.push(n[a]);
  }
  return r;
}
function ud(t, n) {
  const e = t;
  let o = 0;
  const s = e[o] << 8 | e[o + 1];
  if (o += 2, s !== 0) throw new Error("WOFF2 glyf transform: reserved != 0");
  const i = e[o] << 8 | e[o + 1];
  o += 2;
  const r = e[o] << 8 | e[o + 1];
  o += 2;
  const a = e[o] << 8 | e[o + 1];
  o += 2;
  const c = yt(e, o);
  o += 4;
  const f = yt(e, o);
  o += 4;
  const u = yt(e, o);
  o += 4;
  const l = yt(e, o);
  o += 4;
  const g = yt(e, o);
  o += 4;
  const p = yt(e, o);
  o += 4;
  const h = yt(e, o);
  o += 4;
  const d = o, x = d + c, m = x + f, y = m + u, _ = y + l, w = _ + g, S = w + p, A = 4 * Math.floor((r + 31) / 32), b = w, D = b + A;
  function C(W) {
    const et = W >> 3, St = 7 - (W & 7);
    return !!(e[b + et] & 1 << St);
  }
  const k = !!(i & 1), I = S + h;
  function O(W) {
    if (!k) return !1;
    const et = W >> 3, St = 7 - (W & 7);
    return !!(e[I + et] & 1 << St);
  }
  let E = d, B = x, M = m, L = y, $ = _, U = D, Z = S;
  const Y = [], q = [0];
  let gt = 0;
  for (let W = 0; W < r; W++) {
    const et = ot(e, E);
    if (E += 2, et === 0) {
      Y.push(null), q.push(gt);
      continue;
    }
    if (et > 0) {
      const St = [];
      let jt = 0;
      for (let rt = 0; rt < et; rt++) {
        const { value: dt, bytesRead: Yt } = an(e, B);
        B += Yt, jt += dt, St.push(jt - 1);
      }
      const yn = [];
      for (let rt = 0; rt < jt; rt++) {
        const dt = e[M++], { dx: Yt, dy: Xa, onCurve: Ka, bytesConsumed: Ja } = ad(dt, e, L);
        L += Ja, yn.push({ dx: Yt, dy: Xa, onCurve: Ka });
      }
      const { value: xn, bytesRead: Ve } = an(e, L);
      L += Ve;
      const Pe = e.subarray(Z, Z + xn);
      Z += xn;
      let Bt, Tt, pt, Mt;
      if (C(W))
        Bt = ot(e, U), U += 2, Tt = ot(e, U), U += 2, pt = ot(e, U), U += 2, Mt = ot(e, U), U += 2;
      else {
        let rt = 0, dt = 0;
        Bt = 32767, Tt = 32767, pt = -32768, Mt = -32768;
        for (const Yt of yn)
          rt += Yt.dx, dt += Yt.dy, rt < Bt && (Bt = rt), rt > pt && (pt = rt), dt < Tt && (Tt = dt), dt > Mt && (Mt = dt);
      }
      const Q = cd(
        et,
        St,
        yn,
        Pe,
        Bt,
        Tt,
        pt,
        Mt,
        O(W)
      );
      Y.push(Q);
      const Ue = Q.length + (Q.length % 2 ? 1 : 0);
      gt += Ue, q.push(gt);
    } else {
      const St = $;
      let jt = !1;
      for (; ; ) {
        const Q = e[$] << 8 | e[$ + 1];
        if ($ += 2, $ += 2, Q & 1 ? $ += 4 : $ += 2, Q & 8 ? $ += 2 : Q & 64 ? $ += 4 : Q & 128 && ($ += 8), Q & 256 && (jt = !0), !(Q & 32)) break;
      }
      const yn = e.subarray(St, $);
      let xn = new Uint8Array(0);
      if (jt) {
        const { value: Q, bytesRead: Ue } = an(e, L);
        L += Ue, xn = e.subarray(Z, Z + Q), Z += Q;
      }
      const Ve = ot(e, U);
      U += 2;
      const Pe = ot(e, U);
      U += 2;
      const Bt = ot(e, U);
      U += 2;
      const Tt = ot(e, U);
      U += 2;
      const pt = fd(
        yn,
        xn,
        Ve,
        Pe,
        Bt,
        Tt
      );
      Y.push(pt);
      const Mt = pt.length + (pt.length % 2 ? 1 : 0);
      gt += Mt, q.push(gt);
    }
  }
  const Zt = new Uint8Array(gt);
  let qn = 0;
  for (const W of Y)
    if (W !== null) {
      for (let et = 0; et < W.length; et++)
        Zt[qn++] = W[et];
      W.length % 2 && qn++;
    }
  return { glyfBytes: Zt, locaOffsets: q, indexFormat: a };
}
function ld(t, n, e, o, s) {
  const i = t;
  let r = 0;
  const a = i[r++], c = !(a & 1), f = !(a & 2), u = [];
  for (let m = 0; m < n; m++)
    u.push(i[r] << 8 | i[r + 1]), r += 2;
  const l = [];
  if (c)
    for (let m = 0; m < n; m++)
      l.push(ot(i, r)), r += 2;
  else
    for (let m = 0; m < n; m++)
      l.push(Fi(o, s, m));
  const g = e - n, p = [];
  if (f)
    for (let m = 0; m < g; m++)
      p.push(ot(i, r)), r += 2;
  else
    for (let m = 0; m < g; m++)
      p.push(Fi(o, s, n + m));
  const h = n * 4 + g * 2, d = new Uint8Array(h);
  let x = 0;
  for (let m = 0; m < n; m++) {
    d[x++] = u[m] >> 8 & 255, d[x++] = u[m] & 255;
    const y = l[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  for (let m = 0; m < g; m++) {
    const y = p[m] & 65535;
    d[x++] = y >> 8 & 255, d[x++] = y & 255;
  }
  return d;
}
function Fi(t, n, e) {
  const o = n[e], s = n[e + 1];
  return o === s ? 0 : ot(t, o + 2);
}
function hd(t, n) {
  if (n === 0) {
    const o = new Uint8Array(t.length * 2);
    for (let s = 0; s < t.length; s++) {
      const i = t[s] >> 1;
      o[s * 2] = i >> 8 & 255, o[s * 2 + 1] = i & 255;
    }
    return o;
  }
  const e = new Uint8Array(t.length * 4);
  for (let o = 0; o < t.length; o++) {
    const s = t[o];
    e[o * 4] = s >> 24 & 255, e[o * 4 + 1] = s >> 16 & 255, e[o * 4 + 2] = s >> 8 & 255, e[o * 4 + 3] = s & 255;
  }
  return e;
}
function gd(t) {
  Pa();
  const n = new Uint8Array(t), e = new DataView(t);
  if (e.getUint32(0) !== Ua)
    throw new Error("Invalid WOFF2 signature");
  const s = e.getUint32(4), i = e.getUint16(12), r = e.getUint32(20), a = e.getUint32(28), c = e.getUint32(32), f = e.getUint32(40), u = e.getUint32(44);
  let l = Po;
  const g = [];
  for (let O = 0; O < i; O++) {
    const E = n[l++], B = E & 63, M = E >> 6 & 3;
    let L;
    B === 63 ? (L = String.fromCharCode(n[l], n[l + 1], n[l + 2], n[l + 3]), l += 4) : L = Uo[B];
    const { value: $, bytesRead: U } = zi(n, l);
    l += U;
    let Z = $;
    const Y = L === "glyf" || L === "loca", q = L === "hmtx";
    if (Y && M === 0 || q && M === 1 || !Y && !q && M !== 0) {
      const { value: Zt, bytesRead: qn } = zi(n, l);
      l += qn, Z = Zt;
    }
    L === "loca" && M === 0 && (Z = 0), g.push({
      tag: L,
      transformVersion: M,
      origLength: $,
      transformLength: Z,
      isTransformed: Y ? M === 0 : q ? M === 1 : M !== 0
    });
  }
  let p = null;
  if (s === 1953784678) {
    const O = yt(n, l);
    l += 4;
    const { value: E, bytesRead: B } = an(n, l);
    l += B;
    const M = [];
    for (let L = 0; L < E; L++) {
      const { value: $, bytesRead: U } = an(n, l);
      l += U;
      const Z = yt(n, l);
      l += 4;
      const Y = [];
      for (let q = 0; q < $; q++) {
        const { value: gt, bytesRead: Zt } = an(n, l);
        l += Zt, Y.push(gt);
      }
      M.push({ numTables: $, flavor: Z, tableIndices: Y });
    }
    p = { version: O, numFonts: E, fonts: M };
  }
  const h = l, d = n.subarray(h, h + r), x = rn(d);
  let m = 0;
  const y = /* @__PURE__ */ new Map();
  for (const O of g) {
    const E = O.isTransformed ? O.transformLength : O.origLength, B = x.subarray(m, m + E);
    m += E, y.set(O.tag, { data: B, entry: O });
  }
  const _ = /* @__PURE__ */ new Map();
  let w = null;
  const S = y.get("glyf"), A = y.get("loca");
  S && S.entry.isTransformed && (A && A.entry.origLength, w = ud(S.data), _.set("glyf", w.glyfBytes), _.set("loca", hd(
    w.locaOffsets,
    w.indexFormat
  )));
  const b = y.get("hmtx");
  if (b && b.entry.isTransformed && w) {
    const O = y.get("hhea"), E = y.get("maxp");
    let B = 0, M = 0;
    O && (B = O.data[34] << 8 | O.data[35]), E && (M = E.data[4] << 8 | E.data[5]), _.set("hmtx", ld(
      b.data,
      B,
      M,
      w.glyfBytes,
      w.locaOffsets
    ));
  }
  const D = [];
  for (const O of g) {
    const E = O.tag;
    let B;
    _.has(E) ? B = _.get(E) : B = y.get(E).data, D.push({ tag: E, data: B, length: B.length });
  }
  let C;
  p ? C = pd(p, D) : C = Ga(s, D);
  let k = null;
  if (a && c) {
    const O = n.subarray(a, a + c);
    k = rn(O);
  }
  let I = null;
  return f && u && (I = n.slice(f, f + u)), { sfnt: C.buffer, metadata: k, privateData: I };
}
function Ga(t, n) {
  const e = n.length, { searchRange: o, entrySelector: s, rangeShift: i } = dd(e), r = Gn + e * $n;
  let a = r + (4 - r % 4) % 4;
  const c = n.map((g, p) => ({ ...g, index: p })).sort((g, p) => g.tag < p.tag ? -1 : g.tag > p.tag ? 1 : 0);
  let f = a;
  for (const g of c)
    f += g.length + (4 - g.length % 4) % 4;
  const u = new Uint8Array(f), l = new DataView(u.buffer);
  l.setUint32(0, t), l.setUint16(4, e), l.setUint16(6, o), l.setUint16(8, s), l.setUint16(10, i);
  for (let g = 0; g < c.length; g++) {
    const p = c[g], h = Gn + g * $n;
    for (let x = 0; x < 4; x++)
      u[h + x] = p.tag.charCodeAt(x);
    const d = $a(p.data);
    l.setUint32(h + 4, d), l.setUint32(h + 8, a), l.setUint32(h + 12, p.length), u.set(p.data instanceof Uint8Array ? p.data : new Uint8Array(p.data), a), a += p.length + (4 - p.length % 4) % 4;
  }
  return md(u, c), u;
}
function pd(t, n, e) {
  const o = [];
  for (const l of t.fonts) {
    const g = l.tableIndices.map((h) => n[h]), p = Ga(l.flavor, g);
    o.push(p);
  }
  const s = o.length;
  let r = 12 + s * 4;
  r += (4 - r % 4) % 4;
  const a = [];
  let c = r;
  for (const l of o)
    a.push(c), c += l.length, c += (4 - c % 4) % 4;
  const f = new Uint8Array(c), u = new DataView(f.buffer);
  u.setUint32(0, 1953784678), u.setUint32(4, t.version), u.setUint32(8, s);
  for (let l = 0; l < s; l++)
    u.setUint32(12 + l * 4, a[l]);
  for (let l = 0; l < s; l++)
    f.set(o[l], a[l]);
  return f;
}
function No(t, n = null, e = null) {
  Pa();
  const o = new DataView(t), s = new Uint8Array(t), i = o.getUint32(0), r = o.getUint16(4), a = [];
  for (let B = 0; B < r; B++) {
    const M = Gn + B * $n, L = String.fromCharCode(
      o.getUint8(M),
      o.getUint8(M + 1),
      o.getUint8(M + 2),
      o.getUint8(M + 3)
    );
    a.push({
      tag: L,
      checksum: o.getUint32(M + 4),
      offset: o.getUint32(M + 8),
      length: o.getUint32(M + 12)
    });
  }
  const c = a.filter((B) => B.tag !== "DSIG"), f = [], u = [];
  let l = Gn + c.length * $n;
  for (const B of c) {
    const M = s.subarray(B.offset, B.offset + B.length), L = Na.get(B.tag), U = B.tag === "glyf" || B.tag === "loca" ? 3 : 0, Y = [(L !== void 0 ? L : 63) | U << 6];
    if (L === void 0)
      for (let q = 0; q < 4; q++) Y.push(B.tag.charCodeAt(q));
    Y.push(...sd(B.length)), f.push(Y), u.push(M), l += B.length + (4 - B.length % 4) % 4;
  }
  let g = 0;
  for (const B of u) g += B.length;
  const p = new Uint8Array(g);
  let h = 0;
  for (const B of u)
    p.set(B, h), h += B.length;
  const d = Ae(p);
  let x = null, m = 0;
  n && n.length > 0 && (m = n.length, x = Ae(n));
  let y = [];
  for (const B of f) y.push(...B);
  let w = Po + y.length;
  const S = w;
  w += d.length;
  let A = 0, b = 0;
  x && (w += (4 - w % 4) % 4, A = w, b = x.length, w += b);
  let D = 0, C = 0;
  e && e.length > 0 && (w += (4 - w % 4) % 4, D = w, C = e.length, w += C);
  const k = w, I = new ArrayBuffer(k), O = new DataView(I), E = new Uint8Array(I);
  O.setUint32(0, Ua), O.setUint32(4, i), O.setUint32(8, k), O.setUint16(12, c.length), O.setUint16(14, 0), O.setUint32(16, l), O.setUint32(20, d.length), O.setUint16(24, 0), O.setUint16(26, 0), O.setUint32(28, A), O.setUint32(32, b), O.setUint32(36, m), O.setUint32(40, D), O.setUint32(44, C);
  for (let B = 0; B < y.length; B++)
    E[Po + B] = y[B];
  return E.set(d instanceof Uint8Array ? d : new Uint8Array(d), S), x && E.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    A
  ), e && e.length > 0 && E.set(e, D), I;
}
function yt(t, n) {
  return (t[n] << 24 | t[n + 1] << 16 | t[n + 2] << 8 | t[n + 3]) >>> 0;
}
function ot(t, n) {
  const e = t[n] << 8 | t[n + 1];
  return e > 32767 ? e - 65536 : e;
}
function ut(t, n) {
  const e = n & 65535;
  t.push(e >> 8 & 255, e & 255);
}
function Go(t, n) {
  t.push(n >> 8 & 255, n & 255);
}
function dd(t) {
  let n = 1, e = 0;
  for (; n * 2 <= t; )
    n *= 2, e++;
  n *= 16;
  const o = t * 16 - n;
  return { searchRange: n, entrySelector: e, rangeShift: o };
}
function $a(t) {
  let n = 0;
  const e = t.length, o = e + (4 - e % 4) % 4;
  for (let s = 0; s < o; s += 4)
    n = n + ((t[s] || 0) << 24 | (t[s + 1] || 0) << 16 | (t[s + 2] || 0) << 8 | (t[s + 3] || 0)) >>> 0;
  return n;
}
function md(t, n) {
  let e = -1;
  for (const i of n)
    if (i.tag === "head") {
      const r = t[4] << 8 | t[5];
      for (let a = 0; a < r; a++) {
        const c = Gn + a * $n;
        if (String.fromCharCode(
          t[c],
          t[c + 1],
          t[c + 2],
          t[c + 3]
        ) === "head") {
          e = t[c + 8] << 24 | t[c + 9] << 16 | t[c + 10] << 8 | t[c + 11];
          break;
        }
      }
      break;
    }
  if (e < 0) return;
  t[e + 8] = 0, t[e + 9] = 0, t[e + 10] = 0, t[e + 11] = 0;
  const s = 2981146554 - $a(t) >>> 0;
  t[e + 8] = s >> 24 & 255, t[e + 9] = s >> 16 & 255, t[e + 10] = s >> 8 & 255, t[e + 11] = s & 255;
}
const yd = {
  cmap: uu,
  head: vr,
  hhea: c0,
  HVAR: p0,
  hmtx: u0,
  maxp: Y0,
  MVAR: th,
  name: ah,
  hdmx: o0,
  BASE: Tf,
  JSTF: k0,
  MATH: $0,
  MERG: W0,
  meta: J0,
  DSIG: Ku,
  LTSH: U0,
  CBLC: on,
  CBDT: jo,
  "OS/2": fh,
  kern: T0,
  PCLT: hh,
  VDMX: Bh,
  post: ph,
  STAT: vh,
  "CFF ": Pc,
  CFF2: Yc,
  VORG: Kc,
  fvar: al,
  avar: tf,
  loca: ea,
  glyf: d1,
  gvar: v1,
  GDEF: gl,
  GPOS: Il,
  GSUB: Yl,
  "cvt ": r1,
  cvar: s1,
  fpgm: c1,
  prep: O1,
  gasp: u1,
  vhea: zh,
  VVAR: Gh,
  vmtx: Vh,
  COLR: Zu,
  CPAL: Yu,
  EBDT: tl,
  EBLC: el,
  EBSC: sl,
  bloc: Wf,
  bdat: Nf,
  sbix: xh,
  ltag: V0,
  "SVG ": Ch
}, Vi = 12, Pi = 16, xd = /* @__PURE__ */ new Set(["sfnt", "woff", "woff2"]);
function wd(t) {
  const n = t._woff?.version;
  return n === 2 ? "woff2" : n === 1 ? "woff" : "sfnt";
}
function Zd(t, n = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  const e = n.format ? n.format.toLowerCase() : wd(t);
  if (!xd.has(e))
    throw new Error(
      `Unknown export format "${e}". Supported: sfnt, woff, woff2.`
    );
  if (_d(t)) {
    if (n.split)
      return Sd(t, e);
    const i = bd(t);
    return e === "woff" ? Vo(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : e === "woff2" ? No(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : i;
  }
  const o = as(t), s = ke(o, 0);
  if (e === "woff") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return Vo(s, i, r);
  }
  if (e === "woff2") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return No(s, i, r);
  }
  return s;
}
function Sd(t, n) {
  const { fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return e.map((o) => {
    const s = as(o), i = ke(s, 0);
    return n === "woff" ? Vo(i) : n === "woff2" ? No(i) : i;
  });
}
function _d(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function as(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return uc(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function ke(t, n) {
  const { header: e, tables: o } = t, s = Object.keys(o), i = s.length, r = vd(o), a = s.map((h) => {
    const d = o[h];
    let x;
    if (r.has(h))
      x = r.get(h);
    else if (d._raw)
      x = d._raw;
    else {
      const y = yd[h];
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
  }), c = Vi + i * Pi;
  let f = c + (4 - c % 4) % 4;
  for (const h of a)
    h.offset = f, f += h.paddedLength;
  const u = f, l = new ArrayBuffer(u), g = new DataView(l), p = new Uint8Array(l);
  g.setUint32(0, e.sfVersion), g.setUint16(4, i), g.setUint16(6, e.searchRange), g.setUint16(8, e.entrySelector), g.setUint16(10, e.rangeShift);
  for (let h = 0; h < a.length; h++) {
    const d = a[h], x = Vi + h * Pi;
    for (let m = 0; m < 4; m++)
      g.setUint8(x + m, d.tag.charCodeAt(m));
    g.setUint32(x + 4, d.checksum), g.setUint32(x + 8, d.offset + n), g.setUint32(x + 12, d.length);
  }
  for (const h of a)
    p.set(h.data, h.offset);
  return l;
}
function bd(t) {
  const { collection: n, fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const o = e.map((m) => as(m)), s = n.majorVersion ?? 2, i = n.minorVersion ?? 0, r = o.length, a = s >= 2, c = 12 + r * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const l = o.map(
    (m) => new Uint8Array(ke(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), g = o.map(
    (m, y) => new Uint8Array(ke(m, l[y]))
  ), p = f, h = new ArrayBuffer(p), d = new DataView(h), x = new Uint8Array(h);
  d.setUint8(0, 116), d.setUint8(1, 116), d.setUint8(2, 99), d.setUint8(3, 102), d.setUint16(4, s), d.setUint16(6, i), d.setUint32(8, r);
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
function vd(t) {
  const n = /* @__PURE__ */ new Map(), e = t.glyf && !t.glyf._raw, o = t.loca && !t.loca._raw;
  if (e && o) {
    const { bytes: u, offsets: l } = na(t.glyf);
    if (n.set("glyf", u), n.set("loca", ea({ offsets: l })), t.head && !t.head._raw) {
      const p = l.every((h) => h % 2 === 0 && h / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== p && n.set(
        "head",
        vr({ ...t.head, indexToLocFormat: p })
      );
    }
  }
  const s = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, i = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (s && i) {
    const { bytes: u, offsetInfo: l } = $e(
      t.CBDT,
      t.CBLC
    );
    n.set("CBDT", u), n.set("CBLC", on(t.CBLC, l));
  }
  const r = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, a = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (r && a) {
    const { bytes: u, offsetInfo: l } = $e(t.EBDT, t.EBLC);
    n.set("EBDT", u), n.set("EBLC", on(t.EBLC, l));
  }
  const c = t.bloc && !t.bloc._raw && t.bloc.sizes, f = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (c && f) {
    const { bytes: u, offsetInfo: l } = $e(t.bdat, t.bloc);
    n.set("bdat", u), n.set("bloc", on(t.bloc, l));
  }
  return n;
}
const Ad = {
  cmap: Xf,
  head: wo,
  hhea: a0,
  HVAR: h0,
  hmtx: f0,
  maxp: j0,
  MVAR: Q0,
  name: rh,
  hdmx: e0,
  BASE: Cf,
  JSTF: A0,
  MATH: G0,
  MERG: q0,
  meta: K0,
  DSIG: Xu,
  LTSH: P0,
  CBLC: Yo,
  CBDT: Zo,
  "OS/2": ch,
  kern: I0,
  PCLT: lh,
  VDMX: Eh,
  post: gh,
  STAT: _h,
  "CFF ": Fc,
  CFF2: jc,
  VORG: Xc,
  fvar: rl,
  avar: Qc,
  loca: k1,
  glyf: l1,
  gvar: _1,
  GDEF: cl,
  GPOS: Sl,
  GSUB: Ul,
  "cvt ": i1,
  cvar: o1,
  fpgm: a1,
  prep: C1,
  gasp: f1,
  vhea: Rh,
  VVAR: Uh,
  vmtx: Fh,
  COLR: Hu,
  CPAL: ju,
  EBLC: nl,
  EBDT: Qu,
  EBSC: ol,
  bloc: qf,
  bdat: Uf,
  sbix: yh,
  ltag: F0,
  "SVG ": kh
}, kd = [
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
function Ui(t) {
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
      const { sfnt: s, metadata: i, privateData: r } = nd(t), a = Ui(s);
      return a._woff = { version: 1 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (o === "wOF2") {
      const { sfnt: s, metadata: i, privateData: r } = gd(t), a = Ui(s);
      return a._woff = { version: 2 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (o === "ttcf")
      return Od(t);
  }
  const e = Cd(t);
  return $i(e);
}
function Cd(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const n = new T(new Uint8Array(t)), e = Ha(n), o = Za(n, e.numTables), s = ja(t, o);
  return { header: e, tables: s };
}
function Od(t) {
  const n = new T(new Uint8Array(t)), e = n.tag();
  if (e !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const o = n.uint16(), s = n.uint16(), i = n.uint32(), r = n.array("uint32", i);
  let a, c, f;
  o >= 2 && (a = n.uint32(), c = n.uint32(), f = n.uint32());
  const u = r.map((g) => {
    const p = new T(new Uint8Array(t), g), h = Ha(p), d = Za(p, h.numTables), x = Id(
      t,
      d,
      g
    ), m = ja(t, x);
    return $i({ header: h, tables: m });
  }), l = {
    tag: e,
    majorVersion: o,
    minorVersion: s,
    numFonts: i
  };
  return o >= 2 && (l.dsigTag = a, l.dsigLength = c, l.dsigOffset = f), { collection: l, fonts: u };
}
function Id(t, n, e) {
  const o = n.find((g) => g.tag === "head");
  if (!o)
    return n;
  const s = o.offset, i = e + o.offset, r = s + o.length <= t.byteLength, a = i + o.length <= t.byteLength;
  if (!r && a)
    return n.map((g) => ({
      ...g,
      offset: e + g.offset
    }));
  if (r && !a || !r && !a)
    return n;
  const c = wo(
    Array.from(new Uint8Array(t, s, o.length))
  ), f = wo(
    Array.from(new Uint8Array(t, i, o.length))
  ), u = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !u ? n.map((g) => ({
    ...g,
    offset: e + g.offset
  })) : n;
}
function Ha(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function Za(t, n) {
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
function ja(t, n) {
  const e = {}, o = new Map(n.map((a) => [a.tag, a])), s = kd.filter((a) => o.has(a)), i = n.map((a) => a.tag).filter((a) => !s.includes(a)), r = [...s, ...i];
  for (const a of r) {
    const c = o.get(a), f = c.offset, u = new Uint8Array(t, f, c.length), l = Array.from(u), g = Ad[a];
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
function jd(t) {
  if (!t || t.length === 0) return "";
  const n = [];
  for (const e of t)
    !e || e.length === 0 || (e[0].type ? n.push(Dd(e)) : n.push(Ed(e)));
  return n.join(" ");
}
function Dd(t) {
  const n = [];
  for (const e of t)
    switch (e.type) {
      case "M":
        n.push(`M${N(e.x)} ${N(e.y)}`);
        break;
      case "L":
        n.push(`L${N(e.x)} ${N(e.y)}`);
        break;
      case "C":
        n.push(
          `C${N(e.x1)} ${N(e.y1)} ${N(e.x2)} ${N(e.y2)} ${N(e.x)} ${N(e.y)}`
        );
        break;
    }
  return n.push("Z"), n.join(" ");
}
function Ed(t) {
  if (t.length === 0) return "";
  const n = [], e = t.length;
  let o = 0;
  for (let a = 0; a < e; a++)
    if (t[a].onCurve) {
      o = a;
      break;
    }
  const s = t[o];
  n.push(`M${N(s.x)} ${N(s.y)}`);
  let i = 1;
  for (; i < e; ) {
    const a = (o + i) % e, c = t[a];
    if (c.onCurve)
      n.push(`L${N(c.x)} ${N(c.y)}`), i++;
    else {
      const f = (o + i + 1) % e, u = t[f];
      if (u.onCurve)
        n.push(`Q${N(c.x)} ${N(c.y)} ${N(u.x)} ${N(u.y)}`), i += 2;
      else {
        const l = (c.x + u.x) / 2, g = (c.y + u.y) / 2;
        n.push(`Q${N(c.x)} ${N(c.y)} ${N(l)} ${N(g)}`), i++;
      }
    }
  }
  const r = t[(o + e - 1) % e];
  return r.onCurve || n.push(
    `Q${N(r.x)} ${N(r.y)} ${N(s.x)} ${N(s.y)}`
  ), n.push("Z"), n.join(" ");
}
function Yd(t, n = "cff") {
  const e = Md(t);
  if (e.length === 0) return [];
  const o = [];
  let s = null;
  for (const i of e)
    i.op === "M" ? (s && s.length > 0 && o.push(s), s = [i]) : i.op === "Z" ? (s && s.length > 0 && o.push(s), s = null) : s && s.push(i);
  return s && s.length > 0 && o.push(s), n === "truetype" ? o.map((i) => Td(i)) : o.map((i) => Bd(i));
}
function Bd(t) {
  const n = [];
  for (const e of t)
    switch (e.op) {
      case "M":
        n.push({ type: "M", x: e.x, y: e.y });
        break;
      case "L":
        n.push({ type: "L", x: e.x, y: e.y });
        break;
      case "C":
        n.push({
          type: "C",
          x1: e.x1,
          y1: e.y1,
          x2: e.x2,
          y2: e.y2,
          x: e.x,
          y: e.y
        });
        break;
      case "Q": {
        const o = n[n.length - 1], s = o ? o.x : 0, i = o ? o.y : 0, r = s + 2 / 3 * (e.x1 - s), a = i + 2 / 3 * (e.y1 - i), c = e.x + 2 / 3 * (e.x1 - e.x), f = e.y + 2 / 3 * (e.y1 - e.y);
        n.push({
          type: "C",
          x1: r,
          y1: a,
          x2: c,
          y2: f,
          x: e.x,
          y: e.y
        });
        break;
      }
    }
  return n;
}
function Td(t) {
  const n = [];
  for (const e of t)
    switch (e.op) {
      case "M":
        n.push({ x: e.x, y: e.y, onCurve: !0 });
        break;
      case "L":
        n.push({ x: e.x, y: e.y, onCurve: !0 });
        break;
      case "Q":
        n.push({ x: e.x1, y: e.y1, onCurve: !1 }), n.push({ x: e.x, y: e.y, onCurve: !0 });
        break;
      case "C": {
        const o = n[n.length - 1], s = o ? o.x : 0, i = o ? o.y : 0, r = $o(
          s,
          i,
          e.x1,
          e.y1,
          e.x2,
          e.y2,
          e.x,
          e.y
        );
        for (const a of r)
          n.push({ x: a.cx, y: a.cy, onCurve: !1 }), n.push({ x: a.x, y: a.y, onCurve: !0 });
        break;
      }
    }
  return n;
}
function Md(t) {
  const n = [], e = t.match(
    /[MmLlHhVvCcSsQqTtZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  );
  if (!e) return n;
  let o = 0, s = 0, i = 0, r = 0, a = "", c = 0, f = 0, u = 0;
  function l() {
    return parseFloat(e[u++]);
  }
  for (; u < e.length; ) {
    let g = e[u];
    /[A-Za-z]/.test(g) ? u++ : g = a;
    const p = g === g.toLowerCase();
    switch (g.toUpperCase()) {
      case "M": {
        let d = l(), x = l();
        p && (d += o, x += s), n.push({ op: "M", x: d, y: x }), o = i = d, s = r = x, a = p ? "l" : "L";
        break;
      }
      case "L": {
        let d = l(), x = l();
        p && (d += o, x += s), n.push({ op: "L", x: d, y: x }), o = d, s = x, a = g;
        break;
      }
      case "H": {
        let d = l();
        p && (d += o), n.push({ op: "L", x: d, y: s }), o = d, a = g;
        break;
      }
      case "V": {
        let d = l();
        p && (d += s), n.push({ op: "L", x: o, y: d }), s = d, a = g;
        break;
      }
      case "C": {
        let d = l(), x = l(), m = l(), y = l(), _ = l(), w = l();
        p && (d += o, x += s, m += o, y += s, _ += o, w += s), n.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: _, y: w }), c = m, f = y, o = _, s = w, a = g;
        break;
      }
      case "S": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "C" && a.toUpperCase() !== "S" && (d = o, x = s);
        let m = l(), y = l(), _ = l(), w = l();
        p && (m += o, y += s, _ += o, w += s), n.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: _, y: w }), c = m, f = y, o = _, s = w, a = g;
        break;
      }
      case "Q": {
        let d = l(), x = l(), m = l(), y = l();
        p && (d += o, x += s, m += o, y += s), n.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, o = m, s = y, a = g;
        break;
      }
      case "T": {
        let d = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "Q" && a.toUpperCase() !== "T" && (d = o, x = s);
        let m = l(), y = l();
        p && (m += o, y += s), n.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, o = m, s = y, a = g;
        break;
      }
      case "Z": {
        n.push({ op: "Z" }), o = i, s = r, a = g;
        break;
      }
      default:
        a = g;
        break;
    }
  }
  return n;
}
function $o(t, n, e, o, s, i, r, a, c = 0) {
  const f = (3 * (e + s) - t - r) / 4, u = (3 * (o + i) - n - a) / 4, l = t + 2 / 3 * (f - t), g = n + 2 / 3 * (u - n), p = r + 2 / 3 * (f - r), h = a + 2 / 3 * (u - a), d = Math.hypot(e - l, o - g), x = Math.hypot(s - p, i - h);
  if (Math.max(d, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: u, x: r, y: a }];
  const y = (t + e) / 2, _ = (n + o) / 2, w = (e + s) / 2, S = (o + i) / 2, A = (s + r) / 2, b = (i + a) / 2, D = (y + w) / 2, C = (_ + S) / 2, k = (w + A) / 2, I = (S + b) / 2, O = (D + k) / 2, E = (C + I) / 2, B = $o(
    t,
    n,
    y,
    _,
    D,
    C,
    O,
    E,
    c + 1
  ), M = $o(
    O,
    E,
    k,
    I,
    A,
    b,
    r,
    a,
    c + 1
  );
  return B.concat(M);
}
function N(t) {
  const n = Math.round(t * 100) / 100;
  return n === Math.floor(n) ? String(n) : n.toFixed(2).replace(/0+$/, "");
}
const Ld = [
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
], Rd = ["CFF ", "CFF2", "VORG"], zd = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], Fd = /* @__PURE__ */ new Set([
  ...Ld,
  ...Rd,
  ...zd
]), Vd = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
];
function $t(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function Ya(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function Xt(t) {
  return Number.isInteger(t) && t >= 0 && t <= 65535;
}
function qa(t) {
  return Array.isArray(t?._raw);
}
function F(t, n, e, o, s) {
  t.push({ severity: n, code: e, message: o, path: s });
}
function Ni(t) {
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
function Pd(t, n, e, o) {
  if (!$t(t)) {
    F(
      o,
      "error",
      "HEADER_MISSING",
      "Font header is required and must be an object.",
      e
    );
    return;
  }
  if (Ya(t.sfVersion) || F(
    o,
    "error",
    "HEADER_SFVERSION_INVALID",
    "header.sfVersion must be a uint32 number.",
    `${e}.sfVersion`
  ), t.numTables !== void 0 && (!Number.isInteger(t.numTables) || t.numTables < 0) && F(
    o,
    "error",
    "HEADER_NUMTABLES_INVALID",
    "header.numTables must be a non-negative integer when provided.",
    `${e}.numTables`
  ), Number.isInteger(t.numTables) && t.numTables !== n && F(
    o,
    "warning",
    "HEADER_NUMTABLES_MISMATCH",
    `header.numTables (${t.numTables}) does not match tables count (${n}).`,
    `${e}.numTables`
  ), (t.searchRange !== void 0 || t.entrySelector !== void 0 || t.rangeShift !== void 0) && (Xt(t.searchRange ?? -1) || F(
    o,
    "error",
    "HEADER_SEARCHRANGE_INVALID",
    "header.searchRange must be a uint16 when provided.",
    `${e}.searchRange`
  ), Xt(t.entrySelector ?? -1) || F(
    o,
    "error",
    "HEADER_ENTRYSELECTOR_INVALID",
    "header.entrySelector must be a uint16 when provided.",
    `${e}.entrySelector`
  ), Xt(t.rangeShift ?? -1) || F(
    o,
    "error",
    "HEADER_RANGESHIFT_INVALID",
    "header.rangeShift must be a uint16 when provided.",
    `${e}.rangeShift`
  ), Xt(t.searchRange) && Xt(t.entrySelector) && Xt(t.rangeShift))) {
    const i = n > 0 ? 2 ** Math.floor(Math.log2(n)) : 0, r = i * 16, a = i > 0 ? Math.floor(Math.log2(i)) : 0, c = n * 16 - r;
    (t.searchRange !== r || t.entrySelector !== a || t.rangeShift !== c) && F(
      o,
      "warning",
      "HEADER_DIRECTORY_FIELDS_MISMATCH",
      `Header directory fields differ from expected values for ${n} tables (expected searchRange=${r}, entrySelector=${a}, rangeShift=${c}).`,
      e
    );
  }
}
function Ud(t, n, e) {
  if (!Array.isArray(t)) {
    F(
      e,
      "error",
      "TABLE_RAW_INVALID_TYPE",
      "_raw must be an array of byte values.",
      n
    );
    return;
  }
  for (let o = 0; o < t.length; o++) {
    const s = t[o];
    if (!Number.isInteger(s) || s < 0 || s > 255) {
      F(
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
function Nd(t, n, e) {
  if (!$t(t))
    return F(
      e,
      "error",
      "TABLES_MISSING",
      "Font tables are required and must be an object keyed by 4-char table tag.",
      n
    ), [];
  const o = Object.keys(t);
  o.length === 0 && F(
    e,
    "error",
    "TABLES_EMPTY",
    "Font tables object is empty; at least core required tables are needed.",
    n
  );
  for (const s of o) {
    (typeof s != "string" || s.length !== 4) && F(
      e,
      "error",
      "TABLE_TAG_INVALID",
      `Table tag "${s}" must be exactly 4 characters.`,
      `${n}.${s}`
    );
    const i = t[s], r = `${n}.${s}`;
    if (!$t(i)) {
      F(
        e,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${s}" must be an object.`,
        r
      );
      continue;
    }
    i._checksum !== void 0 && !Ya(i._checksum) && F(
      e,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${s}" _checksum must be uint32 when provided.`,
      `${r}._checksum`
    ), i._raw !== void 0 && Ud(i._raw, `${r}._raw`, e);
    const a = Fd.has(s);
    !qa(i) && !a && F(
      e,
      "error",
      "TABLE_WRITER_UNSUPPORTED",
      `Table "${s}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
      r
    );
  }
  return o;
}
function Gd(t, n, e) {
  const o = (r) => t[r] !== void 0, s = (r) => o(r) && !qa(t[r]), i = (r, a, c = "requires") => {
    if (s(r))
      for (const f of a)
        o(f) || F(
          e,
          "error",
          "TABLE_DEPENDENCY_MISSING",
          `Parsed table "${r}" ${c} table "${f}".`,
          `${n}.${r}`
        );
  };
  i("hmtx", ["hhea", "maxp"]), i("loca", ["head", "maxp"]), i("glyf", ["loca", "head", "maxp"]), i("vmtx", ["vhea", "maxp"]), s("gvar") && !o("fvar") && F(
    e,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "gvar" usually expects "fvar" to describe variation axes.',
    `${n}.gvar`
  ), s("cvar") && !o("fvar") && F(
    e,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "cvar" usually expects "fvar" to describe variation axes.',
    `${n}.cvar`
  );
}
function $d(t, n, e) {
  const o = (r) => t[r] !== void 0;
  for (const r of Vd)
    o(r) || F(
      e,
      "error",
      "REQUIRED_TABLE_MISSING",
      `Required core table "${r}" is missing.`,
      n
    );
  o("OS/2") || F(
    e,
    "warning",
    "RECOMMENDED_TABLE_MISSING",
    'Recommended table "OS/2" is missing.',
    n
  );
  const s = o("glyf") || o("loca"), i = o("CFF ") || o("CFF2");
  !s && !i && F(
    e,
    "error",
    "OUTLINE_MISSING",
    "No outline tables found. Include TrueType (glyf+loca) or CFF (CFF / CFF2) outlines.",
    n
  ), s && (o("glyf") || F(
    e,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "glyf".',
    n
  ), o("loca") || F(
    e,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "loca".',
    n
  )), s && i && F(
    e,
    "warning",
    "MULTIPLE_OUTLINE_TYPES",
    "Both TrueType and CFF outline tables are present; most fonts use one outline model.",
    n
  );
}
function Wa(t, n, e) {
  if (!$t(t)) {
    F(
      e,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      n
    );
    return;
  }
  const o = Nd(t.tables, `${n}.tables`, e);
  Pd(t.header, o.length, `${n}.header`, e), $t(t.tables) && ($d(t.tables, `${n}.tables`, e), Gd(t.tables, `${n}.tables`, e));
}
function Hd(t, n, e) {
  const o = t.collection, s = t.fonts;
  if ($t(o) || F(
    e,
    "error",
    "COLLECTION_META_INVALID",
    "collection must be an object for TTC/OTC inputs.",
    `${n}.collection`
  ), !Array.isArray(s) || s.length === 0) {
    F(
      e,
      "error",
      "COLLECTION_FONTS_INVALID",
      "fonts must be a non-empty array for TTC/OTC inputs.",
      `${n}.fonts`
    );
    return;
  }
  o && o.numFonts !== void 0 && o.numFonts !== s.length && F(
    e,
    "warning",
    "COLLECTION_NUMFONTS_MISMATCH",
    `collection.numFonts (${o.numFonts}) does not match fonts.length (${s.length}).`,
    `${n}.collection.numFonts`
  );
  for (let i = 0; i < s.length; i++)
    Wa(s[i], `${n}.fonts[${i}]`, e);
}
function qd(t) {
  const n = [];
  return $t(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? Hd(t, "$", n) : Wa(t, "$", n), Ni(n)) : (F(
    n,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), Ni(n));
}
async function Wd() {
  return od();
}
export {
  uc as buildRawFromSimplified,
  $i as buildSimplified,
  jd as contoursToSVGPath,
  nc as disassembleCharString,
  Zd as exportFont,
  Ui as importFont,
  Cd as importFontTables,
  Wd as initWoff2,
  Qa as interpretCharString,
  Yd as svgPathToContours,
  qd as validateJSON
};
