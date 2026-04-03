function H(t) {
  if (!Number.isInteger(t) || t < -32768 || t > 32767)
    return Dc(t);
  if (t >= -107 && t <= 107)
    return [t + 139];
  if (t >= 108 && t <= 1131) {
    const e = t - 108;
    return [(e >> 8 & 255) + 247, e & 255];
  }
  if (t >= -1131 && t <= -108) {
    const e = -t - 108;
    return [(e >> 8 & 255) + 251, e & 255];
  }
  const n = t < 0 ? t + 65536 : t;
  return [28, n >> 8 & 255, n & 255];
}
function Dc(t) {
  const n = Math.round(t * 65536), e = n < 0 ? n + 4294967296 : n;
  return [
    255,
    e >> 24 & 255,
    e >> 16 & 255,
    e >> 8 & 255,
    e & 255
  ];
}
const po = 21, Bc = 22, Mc = 4, Lc = 5, Rc = 6, zc = 7, Fc = 8, mo = 14;
function pe(t) {
  if (!t || t.length === 0)
    return [...H(0), ...H(0), po, mo];
  const n = [];
  let e = 0, s = 0;
  for (const o of t)
    if (!(!o || o.length === 0))
      for (const i of o)
        switch (i.type) {
          case "M": {
            const r = i.x - e, a = i.y - s;
            r === 0 && a !== 0 ? n.push(...H(a), Mc) : a === 0 && r !== 0 ? n.push(...H(r), Bc) : n.push(...H(r), ...H(a), po), e = i.x, s = i.y;
            break;
          }
          case "L": {
            const r = i.x - e, a = i.y - s;
            r === 0 && a !== 0 ? n.push(...H(a), zc) : a === 0 && r !== 0 ? n.push(...H(r), Rc) : n.push(...H(r), ...H(a), Lc), e = i.x, s = i.y;
            break;
          }
          case "C": {
            const r = i.x1 - e, a = i.y1 - s, c = i.x2 - i.x1, f = i.y2 - i.y1, u = i.x - i.x2, l = i.y - i.y2;
            n.push(
              ...H(r),
              ...H(a),
              ...H(c),
              ...H(f),
              ...H(u),
              ...H(l),
              Fc
            ), e = i.x, s = i.y;
            break;
          }
        }
  return n.push(mo), n;
}
const yo = {
  hstem: [1],
  vstem: [3],
  vmoveto: [4],
  rlineto: [5],
  hlineto: [6],
  vlineto: [7],
  rrcurveto: [8],
  callsubr: [10],
  return: [11],
  endchar: [14],
  hstemhm: [18],
  hintmask: [19],
  cntrmask: [20],
  rmoveto: [21],
  hmoveto: [22],
  vstemhm: [23],
  rcurveline: [24],
  rlinecurve: [25],
  vvcurveto: [26],
  hhcurveto: [27],
  callgsubr: [29],
  vhcurveto: [30],
  hvcurveto: [31],
  // Two-byte operators (12 xx)
  dotsection: [12, 0],
  and: [12, 3],
  or: [12, 4],
  not: [12, 5],
  abs: [12, 9],
  add: [12, 10],
  sub: [12, 11],
  div: [12, 12],
  neg: [12, 14],
  eq: [12, 15],
  drop: [12, 18],
  put: [12, 20],
  get: [12, 21],
  ifelse: [12, 22],
  random: [12, 23],
  mul: [12, 24],
  sqrt: [12, 26],
  dup: [12, 27],
  exch: [12, 28],
  index: [12, 29],
  roll: [12, 30],
  hflex: [12, 34],
  flex: [12, 35],
  hflex1: [12, 36],
  flex1: [12, 37]
};
function Vc(t) {
  const n = [], e = t.split(`
`).filter((s) => s.trim().length > 0);
  for (const s of e) {
    const o = s.trim().split(/\s+/);
    if (o.length === 0) continue;
    let i = -1, r = null;
    for (let a = 0; a < o.length; a++) {
      const c = o[a].toLowerCase();
      if (yo[c] || c.startsWith("op")) {
        i = a, r = c;
        break;
      }
    }
    if (i === -1) {
      for (const a of o)
        n.push(...H(parseFloat(a)));
      continue;
    }
    for (let a = 0; a < i; a++)
      n.push(...H(parseFloat(o[a])));
    if (r.startsWith("op12.")) {
      const a = parseInt(r.slice(5), 10);
      n.push(12, a);
    } else r.startsWith("op") ? n.push(parseInt(r.slice(2), 10)) : n.push(...yo[r]);
    if (r === "hintmask" || r === "cntrmask") {
      const a = o.slice(i + 1).join("");
      if (a.length > 0)
        for (let c = 0; c < a.length; c += 8) {
          const f = a.slice(c, c + 8).padEnd(8, "0");
          n.push(parseInt(f, 2));
        }
    }
  }
  return n;
}
function rr(t, n) {
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
    const s = t[n + 1] << 8 | t[n + 2];
    return { value: s > 32767 ? s - 65536 : s, bytesConsumed: 3 };
  }
  if (e === 255) {
    const s = (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4]) >>> 0;
    return { value: (s > 2147483647 ? s - 4294967296 : s) / 65536, bytesConsumed: 5 };
  }
  return null;
}
function xo(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function ar(t, n = [], e = []) {
  const s = [], o = [];
  let i = null, r = 0, a = 0, c = null, f = !1, u = !0;
  const l = xo(n.length), g = xo(e.length);
  function p(w, _) {
    i && i.length > 0 && o.push(i), r += w, a += _, i = [{ type: "M", x: r, y: a }];
  }
  function h(w, _) {
    r += w, a += _, i && i.push({ type: "L", x: r, y: a });
  }
  function d(w, _, v, b, E, A) {
    const C = r + w, I = a + _, O = C + v, T = I + b;
    r = O + E, a = T + A, i && i.push({ type: "C", x1: C, y1: I, x2: O, y2: T, x: r, y: a });
  }
  function x() {
    u && (s.length % 2 !== 0 && (c = s.shift()), u = !1, f = !0);
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
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), s.length = 0;
        break;
      case 4:
        u && (s.length > 1 && (c = s.shift()), u = !1, f = !0), p(0, s.pop()), s.length = 0;
        break;
      case 5:
        for (let _ = 0; _ < s.length; _ += 2)
          h(s[_], s[_ + 1]);
        s.length = 0;
        break;
      case 6:
        for (let _ = 0; _ < s.length; _++)
          _ % 2 === 0 ? h(s[_], 0) : h(0, s[_]);
        s.length = 0;
        break;
      case 7:
        for (let _ = 0; _ < s.length; _++)
          _ % 2 === 0 ? h(0, s[_]) : h(s[_], 0);
        s.length = 0;
        break;
      case 8:
        for (let _ = 0; _ + 5 < s.length; _ += 6)
          d(
            s[_],
            s[_ + 1],
            s[_ + 2],
            s[_ + 3],
            s[_ + 4],
            s[_ + 5]
          );
        s.length = 0;
        break;
      case 10: {
        const _ = s.pop() + g;
        e[_] && (callStack.push(null), execute(e[_]));
        break;
      }
      case 11:
        return;
      // Return from subroutine
      case 14:
        !f && s.length > 0 && (c = s.shift(), f = !0, u = !1), i && i.length > 0 && (o.push(i), i = null), s.length = 0;
        break;
      case 19:
      // hintmask
      case 20:
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), s.length = 0;
        break;
      case 21:
        x();
        {
          const _ = s.pop(), v = s.pop();
          p(v, _);
        }
        s.length = 0;
        break;
      case 22:
        u && (s.length > 1 && (c = s.shift()), u = !1, f = !0), p(s.pop(), 0), s.length = 0;
        break;
      case 24:
        {
          const v = s.length - 2;
          let b = 0;
          for (; b < v; b += 6)
            d(
              s[b],
              s[b + 1],
              s[b + 2],
              s[b + 3],
              s[b + 4],
              s[b + 5]
            );
          h(s[b], s[b + 1]);
        }
        s.length = 0;
        break;
      case 25:
        {
          const v = s.length - 6;
          let b = 0;
          for (; b < v; b += 2)
            h(s[b], s[b + 1]);
          d(
            s[b],
            s[b + 1],
            s[b + 2],
            s[b + 3],
            s[b + 4],
            s[b + 5]
          );
        }
        s.length = 0;
        break;
      case 26:
        {
          let _ = 0, v = 0;
          for (s.length % 4 !== 0 && (v = s[_++]); _ + 3 < s.length; _ += 4)
            d(v, s[_], s[_ + 1], s[_ + 2], 0, s[_ + 3]), v = 0;
        }
        s.length = 0;
        break;
      case 27:
        {
          let _ = 0, v = 0;
          for (s.length % 4 !== 0 && (v = s[_++]); _ + 3 < s.length; _ += 4)
            d(s[_], v, s[_ + 1], s[_ + 2], s[_ + 3], 0), v = 0;
        }
        s.length = 0;
        break;
      case 29: {
        const _ = s.pop() + l;
        n[_] && (callStack.push(null), execute(n[_]));
        break;
      }
      case 30:
        {
          let _ = 0;
          for (; _ < s.length && _ + 3 < s.length; ) {
            {
              const v = s.length - _ === 5 ? s[_ + 4] : 0;
              d(
                0,
                s[_],
                s[_ + 1],
                s[_ + 2],
                s[_ + 3],
                v
              ), _ += v !== 0 ? 5 : 4;
            }
            if (_ + 3 < s.length) {
              const v = s.length - _ === 5 ? s[_ + 4] : 0;
              d(
                s[_],
                0,
                s[_ + 1],
                s[_ + 2],
                v,
                s[_ + 3]
              ), _ += v !== 0 ? 5 : 4;
            } else break;
          }
        }
        s.length = 0;
        break;
      case 31:
        {
          let _ = 0;
          for (; _ < s.length && _ + 3 < s.length; ) {
            {
              const v = s.length - _ === 5 ? s[_ + 4] : 0;
              d(
                s[_],
                0,
                s[_ + 1],
                s[_ + 2],
                v,
                s[_ + 3]
              ), _ += v !== 0 ? 5 : 4;
            }
            if (_ + 3 < s.length) {
              const v = s.length - _ === 5 ? s[_ + 4] : 0;
              d(
                0,
                s[_],
                s[_ + 1],
                s[_ + 2],
                s[_ + 3],
                v
              ), _ += v !== 0 ? 5 : 4;
            } else break;
          }
        }
        s.length = 0;
        break;
      default:
        s.length = 0;
        break;
    }
  }
  function y(w) {
    switch (w) {
      case 34:
        {
          const _ = s[0], v = 0, b = s[1], E = s[2], A = s[3], C = 0, I = s[4], O = 0, T = s[5], D = -E, M = s[6], L = 0;
          d(_, v, b, E, A, C), d(I, O, T, D, M, L);
        }
        s.length = 0;
        break;
      case 35:
        d(s[0], s[1], s[2], s[3], s[4], s[5]), d(s[6], s[7], s[8], s[9], s[10], s[11]), s.length = 0;
        break;
      case 36:
        {
          const _ = s[0], v = s[1], b = s[2], E = s[3], A = s[4], C = 0, I = s[5], O = 0, T = s[6], D = s[7], M = s[8], L = -(v + E + D);
          d(_, v, b, E, A, C), d(I, O, T, D, M, L);
        }
        s.length = 0;
        break;
      case 37:
        {
          const _ = s[0], v = s[1], b = s[2], E = s[3], A = s[4], C = s[5], I = s[6], O = s[7], T = s[8], D = s[9], M = s[10], L = _ + b + A + I + T, $ = v + E + C + O + D;
          let U, j;
          Math.abs(L) > Math.abs($) ? (U = M, j = -$) : (U = -L, j = M), d(_, v, b, E, A, C), d(I, O, T, D, U, j);
        }
        s.length = 0;
        break;
      default:
        s.length = 0;
        break;
    }
  }
  function S(w, _) {
    let v = _ || 0, b = 0;
    for (; b < w.length; ) {
      const E = w[b], A = rr(w, b);
      if (A !== null) {
        s.push(A.value), b += A.bytesConsumed;
        continue;
      }
      if (E === 12) {
        b++;
        const C = w[b];
        b++, y(C);
      } else if (E === 19 || E === 20) {
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), v += s.length >> 1, s.length = 0, b++;
        const C = Math.ceil(v / 8);
        b += C;
      } else if (E === 1 || E === 3 || E === 18 || E === 23)
        f || (s.length % 2 !== 0 && (c = s.shift()), f = !0, u = !1), v += s.length >> 1, s.length = 0, b++;
      else if (E === 10) {
        b++;
        const C = s.pop() + g;
        e[C] && S(e[C], v);
      } else if (E === 29) {
        b++;
        const C = s.pop() + l;
        n[C] && S(n[C], v);
      } else {
        if (E === 11)
          return;
        b++, m(E);
      }
    }
  }
  return S(t, 0), i && i.length > 0 && o.push(i), { contours: o, width: c };
}
const wo = {
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
}, Pc = {
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
function cr(t) {
  const n = [], e = [];
  let s = 0, o = 0;
  for (; o < t.length; ) {
    const i = t[o], r = rr(t, o);
    if (r !== null) {
      e.push(r.value), o += r.bytesConsumed;
      continue;
    }
    if (i === 12) {
      o++;
      const a = t[o];
      o++;
      const c = Pc[a] || `op12.${a}`;
      n.push(e.length ? `${e.join(" ")} ${c}` : c), e.length = 0;
    } else if (i === 19 || i === 20) {
      const a = i === 19 ? "hintmask" : "cntrmask";
      s += e.length >> 1, o++;
      const c = Math.ceil(s / 8), f = [];
      for (let l = 0; l < c && o < t.length; l++, o++)
        f.push(t[o].toString(2).padStart(8, "0"));
      const u = e.length ? `${e.join(" ")} ` : "";
      n.push(`${u}${a} ${f.join("")}`), e.length = 0;
    } else if (i === 1 || i === 3 || i === 18 || i === 23) {
      s += e.length >> 1;
      const a = wo[i];
      n.push(e.length ? `${e.join(" ")} ${a}` : a), e.length = 0, o++;
    } else {
      const a = wo[i] || `op${i}`;
      n.push(e.length ? `${e.join(" ")} ${a}` : a), e.length = 0, o++;
    }
  }
  return e.length && n.push(e.join(" ")), n.join(`
`);
}
const Uc = /* @__PURE__ */ new Set([
  "head",
  "hhea",
  "hmtx",
  "vmtx",
  "name",
  "OS/2",
  "post",
  "maxp",
  "cmap",
  "glyf",
  "loca",
  "CFF ",
  "kern",
  "fvar",
  "GPOS",
  "GSUB",
  "GDEF",
  "gasp",
  "cvt ",
  "fpgm",
  "prep"
]);
function fr(t) {
  const { header: n, tables: e } = t, s = Nc(e), o = Zc(e), i = { font: s, glyphs: o }, r = jc(e, o);
  r.length > 0 && (i.kerning = r), e.fvar && (i.axes = nf(e), i.instances = ef(e));
  const a = {};
  return e.GPOS && !e.GPOS._raw && (a.GPOS = e.GPOS), e.GSUB && !e.GSUB._raw && (a.GSUB = e.GSUB), e.GDEF && !e.GDEF._raw && (a.GDEF = e.GDEF), Object.keys(a).length > 0 && (i.features = a), e.gasp && !e.gasp._raw && e.gasp.gaspRanges && (i.gasp = e.gasp.gaspRanges.map((c) => ({
    maxPPEM: c.rangeMaxPPEM,
    behavior: c.rangeGaspBehavior
  }))), e["cvt "] && !e["cvt "]._raw && e["cvt "].values && (i.cvt = e["cvt "].values), e.fpgm && !e.fpgm._raw && e.fpgm.instructions && (i.fpgm = e.fpgm.instructions), e.prep && !e.prep._raw && e.prep.instructions && (i.prep = e.prep.instructions), i.tables = { ...e }, i._header = n, i;
}
const Gc = {
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
function de(t, n) {
  if (!t || !t.names) return;
  const e = t.names.filter((r) => r.nameID === n);
  if (e.length === 0) return;
  const s = e.find(
    (r) => r.platformID === 3 && r.encodingID === 1 && r.languageID === 1033
  );
  if (s) return s.value;
  const o = e.find((r) => r.platformID === 0);
  if (o) return o.value;
  const i = e.find(
    (r) => r.platformID === 1 && r.encodingID === 0 && r.languageID === 0
  );
  return i ? i.value : e[0].value;
}
function Nc(t) {
  const n = t.name, e = t.head, s = t.hhea, o = t["OS/2"], i = t.post, r = {};
  for (const [a, c] of Object.entries(Gc)) {
    const f = de(n, Number(a));
    f !== void 0 && f.trim() !== "" && (r[c] = f);
  }
  return e && !e._raw && (r.unitsPerEm = e.unitsPerEm, r.created = So(e.created), r.modified = So(e.modified)), s && !s._raw && (r.ascender = s.ascender, r.descender = s.descender, r.lineGap = s.lineGap), i && !i._raw && (r.italicAngle = i.italicAngle, r.underlinePosition = i.underlinePosition, r.underlineThickness = i.underlineThickness, r.isFixedPitch = i.isFixedPitch !== 0), o && !o._raw && (r.weightClass = o.usWeightClass, r.widthClass = o.usWidthClass, r.fsType = o.fsType, r.fsSelection = o.fsSelection, r.achVendID = o.achVendID, o.panose && (r.panose = o.panose)), r;
}
function $c(t) {
  const n = /* @__PURE__ */ new Map();
  if (!t || t._raw || !t.subtables) return n;
  for (const e of t.subtables)
    switch (e.format) {
      case 0:
        for (let s = 0; s < e.glyphIdArray.length; s++) {
          const o = e.glyphIdArray[s];
          o !== 0 && Sn(n, o, s);
        }
        break;
      case 4:
        for (const s of e.segments)
          for (let o = s.startCode; o <= s.endCode; o++) {
            let i;
            if (s.idRangeOffset === 0)
              i = o + s.idDelta & 65535;
            else {
              const r = s.idRangeOffset / 2 + (o - s.startCode) - (e.segments.length - e.segments.indexOf(s));
              i = e.glyphIdArray[r], i !== void 0 && i !== 0 && (i = i + s.idDelta & 65535);
            }
            i !== void 0 && i !== 0 && Sn(n, i, o);
          }
        break;
      case 6:
        for (let s = 0; s < e.glyphIdArray.length; s++) {
          const o = e.glyphIdArray[s];
          o !== 0 && Sn(n, o, e.firstCode + s);
        }
        break;
      case 12:
        for (const s of e.groups)
          for (let o = s.startCharCode; o <= s.endCharCode; o++) {
            const i = s.startGlyphID + (o - s.startCharCode);
            i !== 0 && Sn(n, i, o);
          }
        break;
      case 13:
        for (const s of e.groups)
          for (let o = s.startCharCode; o <= s.endCharCode; o++)
            s.glyphID !== 0 && Sn(n, s.glyphID, o);
        break;
    }
  return n;
}
function Sn(t, n, e) {
  t.has(n) || t.set(n, []);
  const s = t.get(n);
  s.includes(e) || s.push(e);
}
function Hc(t, n) {
  if (t.post && !t.post._raw && t.post.glyphNames && t.post.glyphNames.length > 0)
    return t.post.glyphNames;
  if (t["CFF "] && !t["CFF "]._raw) {
    const s = t["CFF "];
    if (s.fonts && s.fonts[0] && s.fonts[0].charset) {
      const o = s.fonts[0].charset, i = s.strings || [];
      return [".notdef", ...o.map((a) => {
        if (typeof a == "string") return a;
        if (typeof a == "number" && a >= 391) {
          const c = i[a - 391];
          return typeof c == "string" && c !== "" ? c : String(a);
        }
        return String(a);
      })];
    }
  }
  const e = [];
  for (let s = 0; s < n; s++)
    e.push(s === 0 ? ".notdef" : `glyph${s}`);
  return e;
}
function Zc(t) {
  const n = t.glyf && !t.glyf._raw, e = t["CFF "] && !t["CFF "]._raw, s = t.hmtx && !t.hmtx._raw ? t.hmtx : null, o = t.vmtx && !t.vmtx._raw ? t.vmtx : null, i = t.hhea && !t.hhea._raw ? t.hhea : null, r = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : n ? a = t.glyf.glyphs.length : e ? a = t["CFF "].fonts[0].charStrings.length : s && (a = s.hMetrics.length + (s.leftSideBearings?.length || 0));
  const c = i ? i.numberOfHMetrics : a, f = r ? r.numOfLongVerMetrics : 0, u = $c(t.cmap), l = Hc(t, a), g = [];
  for (let p = 0; p < a; p++) {
    const h = {};
    l[p] && (h.name = l[p]);
    const d = u.get(p) || [];
    if (d.length === 1 ? h.unicode = d[0] : d.length > 1 ? (h.unicode = d[0], h.unicodes = d) : h.unicode = null, s && (p < c ? (h.advanceWidth = s.hMetrics[p].advanceWidth, h.leftSideBearing = s.hMetrics[p].lsb) : (h.advanceWidth = s.hMetrics[c - 1].advanceWidth, h.leftSideBearing = s.leftSideBearings[p - c])), o && (p < f ? (h.advanceHeight = o.vMetrics[p].advanceHeight, h.topSideBearing = o.vMetrics[p].topSideBearing) : o.topSideBearings && (h.advanceHeight = o.vMetrics[f - 1].advanceHeight, h.topSideBearing = o.topSideBearings[p - f])), n) {
      const x = t.glyf.glyphs[p];
      x && x.type === "simple" ? (h.contours = x.contours, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions)) : x && x.type === "composite" && (h.components = x.components, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions));
    }
    if (e) {
      const x = t["CFF "], m = x.fonts[0], y = m.charStrings;
      if (y[p]) {
        h.charString = y[p], h.charStringDisassembly = cr(y[p]);
        const S = x.globalSubrs || [], w = m.localSubrs || [], _ = ar(
          y[p],
          S,
          w
        );
        _.contours.length > 0 && (h.contours = _.contours);
      }
    }
    g.push(h);
  }
  return g;
}
function jc(t, n) {
  const e = Wc(t, n), s = Xc(t, n);
  if (e.length === 0) return s;
  if (s.length === 0) return e;
  const o = /* @__PURE__ */ new Map();
  for (const i of e)
    o.set(`${i.left}\0${i.right}`, i);
  for (const i of s) {
    const r = `${i.left}\0${i.right}`;
    o.has(r) || o.set(r, i);
  }
  return Array.from(o.values());
}
function Wc(t, n) {
  const e = t.GPOS;
  if (!e || e._raw || !e.featureList || !e.lookupList) return [];
  const s = /* @__PURE__ */ new Set();
  for (const i of e.featureList.featureRecords)
    if (i.featureTag === "kern")
      for (const r of i.feature.lookupListIndices)
        s.add(r);
  if (s.size === 0) return [];
  const o = [];
  for (const i of s) {
    const r = e.lookupList.lookups[i];
    if (!(!r || r.lookupType !== 2))
      for (const a of r.subtables)
        a.format === 1 ? qc(a, n, o) : a.format === 2 && Yc(a, n, o);
  }
  return o;
}
function qc(t, n, e) {
  const s = ur(t.coverage);
  for (let o = 0; o < s.length && o < t.pairSets.length; o++) {
    const i = s[o], r = n[i]?.name || `glyph${i}`;
    for (const a of t.pairSets[o]) {
      const c = a.value1?.xAdvance;
      if (c === void 0 || c === 0) continue;
      const f = n[a.secondGlyph]?.name || `glyph${a.secondGlyph}`;
      e.push({ left: r, right: f, value: c });
    }
  }
}
function Yc(t, n, e) {
  const s = _o(t.classDef1, n.length), o = _o(t.classDef2, n.length), i = /* @__PURE__ */ new Map(), r = /* @__PURE__ */ new Map(), a = new Set(ur(t.coverage));
  for (let c = 0; c < n.length; c++) {
    if (a.has(c)) {
      const u = s.get(c) ?? 0;
      i.has(u) || i.set(u, []), i.get(u).push(c);
    }
    const f = o.get(c) ?? 0;
    r.has(f) || r.set(f, []), r.get(f).push(c);
  }
  for (let c = 0; c < t.class1Count; c++) {
    const f = i.get(c);
    if (f)
      for (let u = 0; u < t.class2Count; u++) {
        const g = t.class1Records[c]?.[u]?.value1?.xAdvance;
        if (g === void 0 || g === 0) continue;
        const p = r.get(u);
        if (p)
          for (const h of f) {
            const d = n[h]?.name || `glyph${h}`;
            for (const x of p) {
              const m = n[x]?.name || `glyph${x}`;
              e.push({ left: d, right: m, value: g });
            }
          }
      }
  }
}
function ur(t) {
  if (t.format === 1) return t.glyphs;
  if (t.format === 2) {
    const n = [];
    for (const e of t.ranges)
      for (let s = e.startGlyphID; s <= e.endGlyphID; s++)
        n.push(s);
    return n;
  }
  return [];
}
function _o(t, n) {
  const e = /* @__PURE__ */ new Map();
  if (t.format === 1)
    for (let s = 0; s < t.classValues.length; s++)
      e.set(t.startGlyphID + s, t.classValues[s]);
  else if (t.format === 2)
    for (const s of t.ranges)
      for (let o = s.startGlyphID; o <= s.endGlyphID; o++)
        e.set(o, s.class);
  return e;
}
function Xc(t, n) {
  const e = t.kern;
  if (!e || e._raw || !e.subtables) return [];
  const s = [];
  for (const o of e.subtables)
    if (!o._raw)
      if (o.format === 0 && o.pairs)
        for (const i of o.pairs) {
          const r = n[i.left]?.name || `glyph${i.left}`, a = n[i.right]?.name || `glyph${i.right}`;
          s.push({
            left: r,
            right: a,
            value: i.value
          });
        }
      else o.format === 2 && o.values ? Kc(o, n, s) : o.format === 3 && o.kernValues ? Jc(o, n, s) : o.format === 1 && o.states && Qc(o, n, s);
  return s;
}
function Kc(t, n, e) {
  const {
    leftClassTable: s,
    rightClassTable: o,
    rowWidth: i,
    kerningArrayOffset: r,
    values: a
  } = t;
  if (!a) return;
  const c = i > 0 ? i / 2 : 0, f = /* @__PURE__ */ new Map();
  for (let l = 0; l < s.nGlyphs; l++) {
    const g = s.firstGlyph + l, p = s.offsets[l] || 0, h = i > 0 ? Math.floor((p - r) / i) : 0;
    h >= 0 && h < a.length && f.set(g, h);
  }
  const u = /* @__PURE__ */ new Map();
  for (let l = 0; l < o.nGlyphs; l++) {
    const g = o.firstGlyph + l, p = o.offsets[l] || 0, h = Math.floor(p / 2);
    h >= 0 && h < c && u.set(g, h);
  }
  for (const [l, g] of f) {
    const p = a[g];
    if (!p) continue;
    const h = n[l]?.name || `glyph${l}`;
    for (const [d, x] of u) {
      const m = p[x];
      if (m === 0) continue;
      const y = n[d]?.name || `glyph${d}`;
      e.push({ left: h, right: y, value: m });
    }
  }
}
function Jc(t, n, e) {
  const {
    glyphCount: s,
    leftClassCount: o,
    rightClassCount: i,
    kernValues: r,
    leftClasses: a,
    rightClasses: c,
    kernIndices: f
  } = t, u = Math.min(s, n.length);
  for (let l = 0; l < u; l++) {
    const g = a[l];
    if (g >= o) continue;
    const p = n[l]?.name || `glyph${l}`;
    for (let h = 0; h < u; h++) {
      const d = c[h];
      if (d >= i) continue;
      const x = g * i + d, m = f[x];
      if (m === void 0 || m >= r.length) continue;
      const y = r[m];
      if (y === 0) continue;
      const S = n[h]?.name || `glyph${h}`;
      e.push({ left: p, right: S, value: y });
    }
  }
}
function Qc(t, n, e) {
  const {
    stateSize: s,
    classTable: o,
    states: i,
    entryTable: r,
    valueTable: a,
    stateArrayOffset: c
  } = t;
  if (!o || !i || !r || !a || i.length === 0 || s === 0) return;
  const f = /* @__PURE__ */ new Map();
  for (let l = 0; l < o.nGlyphs; l++) {
    const g = o.firstGlyph + l, p = o.classArray[l];
    p >= 4 && f.set(g, p);
  }
  const u = Array.from(f.keys());
  if (u.length !== 0)
    for (const l of u)
      for (const g of u) {
        const p = tf(
          l,
          g,
          f,
          i,
          r,
          a,
          s,
          c
        );
        if (p !== 0) {
          const h = n[l]?.name || `glyph${l}`, d = n[g]?.name || `glyph${g}`;
          e.push({ left: h, right: d, value: p });
        }
      }
}
function tf(t, n, e, s, o, i, r, a) {
  let c = 0, f = 0;
  const u = [], l = [t, n];
  for (const g of l) {
    const p = e.get(g) ?? 1;
    if (p >= r || c >= s.length) break;
    const h = s[c][p];
    if (h === void 0 || h >= o.length) break;
    const d = o[h], x = (d.flags & 32768) !== 0, m = d.flags & 16383;
    if (x && u.push(g), m > 0 && u.length > 0) {
      const S = Math.floor((m - (i._offset || 0)) / 2);
      for (let w = 0; w < u.length; w++) {
        const _ = S + w;
        if (_ >= 0 && _ < i.length) {
          const v = i[_], b = (v & 1) !== 0;
          if (f += b ? v & -2 : v, b) break;
        }
      }
      u.length = 0;
    }
    const y = d.newStateOffset;
    c = r > 0 ? Math.floor((y - a) / r) : 0, (c < 0 || c >= s.length) && (c = 0);
  }
  return f;
}
function nf(t) {
  const n = t.fvar;
  return !n || n._raw || !n.axes ? [] : n.axes.map((e) => ({
    tag: e.axisTag,
    name: de(t.name, e.axisNameID) || e.axisTag,
    min: e.minValue,
    default: e.defaultValue,
    max: e.maxValue,
    hidden: (e.flags & 1) !== 0
  }));
}
function ef(t) {
  const n = t.fvar;
  if (!n || n._raw || !n.instances) return [];
  const e = n.axes;
  return n.instances.map((s) => {
    const o = {};
    for (let r = 0; r < e.length; r++)
      o[e[r].axisTag] = s.coordinates[r];
    const i = {
      name: de(t.name, s.subfamilyNameID) || `Instance ${s.subfamilyNameID}`,
      coordinates: o
    };
    if (s.postScriptNameID !== void 0) {
      const r = de(t.name, s.postScriptNameID);
      r && (i.postScriptName = r);
    }
    return i;
  });
}
const lr = Date.UTC(1904, 0, 1, 0, 0, 0);
function So(t) {
  if (t == null) return;
  const n = typeof t == "bigint" ? t : BigInt(t);
  if (n === 0n) return;
  const e = Number(n) * 1e3 + lr;
  if (!(!Number.isFinite(e) || e < -864e13 || e > 864e13))
    return new Date(e).toISOString();
}
function bo(t) {
  if (!t) return 0n;
  const n = Date.parse(t);
  return isNaN(n) ? 0n : BigInt(Math.floor((n - lr) / 1e3));
}
function vo(t) {
  const { font: n, glyphs: e } = t, s = e.some((c) => c.charString), o = sf(e, n), i = {};
  i.head = rf(n, o), i.hhea = af(n, o, e.length), i.maxp = cf(e, s), i["OS/2"] = ff(n, o), i.name = uf(n), i.post = hf(n, e), i.cmap = gf(e), i.hmtx = mf(e), s ? i["CFF "] = xf(n, e) : (i.glyf = yf(e), i.loca = { offsets: [] });
  const r = t._options?.kerningFormat || "gpos";
  if (t.kerning && t.kerning.length > 0) {
    const c = r === "gpos" || r === "gpos+kern", f = r !== "gpos";
    if (c) {
      const u = t.features?.GPOS;
      u ? i.GPOS = kf(
        u,
        t.kerning,
        e
      ) : i.GPOS = vf(t.kerning, e);
    }
    if (f) {
      const u = _f(
        t.kerning,
        e,
        r
      );
      u && (i.kern = u);
    }
  }
  if (t.axes && t.axes.length > 0 && (i.fvar = Af(t, i.name)), t.gasp && (i.gasp = {
    version: 1,
    gaspRanges: t.gasp.map((c) => ({
      rangeMaxPPEM: c.maxPPEM,
      rangeGaspBehavior: c.behavior
    }))
  }), t.cvt && (i["cvt "] = { values: t.cvt }), t.fpgm && (i.fpgm = { instructions: t.fpgm }), t.prep && (i.prep = { instructions: t.prep }), t.features && (t.features.GPOS && !i.GPOS && (i.GPOS = t.features.GPOS), t.features.GSUB && (i.GSUB = t.features.GSUB), t.features.GDEF && (i.GDEF = t.features.GDEF)), t.tables)
    for (const [c, f] of Object.entries(t.tables))
      i[c] || (i[c] = f);
  let a;
  if (t._header)
    a = { ...t._header, numTables: Object.keys(i).length };
  else {
    const c = Object.keys(i).length, f = Math.floor(Math.log2(c)), u = Math.pow(2, f) * 16, l = c * 16 - u;
    a = {
      sfVersion: s ? 1330926671 : 65536,
      numTables: c,
      searchRange: u,
      entrySelector: f,
      rangeShift: l
    };
  }
  return { header: a, tables: i };
}
function sf(t, n) {
  let e = 1 / 0, s = 1 / 0, o = -1 / 0, i = -1 / 0, r = 0, a = 0, c = 1 / 0, f = 1 / 0, u = -1 / 0, l = 65535, g = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > r && (r = m);
    const y = Xs(x);
    if (y) {
      y.xMin < e && (e = y.xMin), y.yMin < s && (s = y.yMin), y.xMax > o && (o = y.xMax), y.yMax > i && (i = y.yMax);
      const w = x.leftSideBearing ?? y.xMin, _ = m - (w + (y.xMax - y.xMin)), v = w + (y.xMax - y.xMin);
      w < c && (c = w), _ < f && (f = _), v > u && (u = v);
    }
    const S = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const w of S)
      w < l && (l = w), w > g && (g = w), p.add(w);
  }
  e === 1 / 0 && (e = 0), s === 1 / 0 && (s = 0), o === -1 / 0 && (o = 0), i === -1 / 0 && (i = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), u === -1 / 0 && (u = 0), l === 65535 && (l = 0), g === 0 && (g = 0);
  const h = ko(
    t,
    "xyvw",
    n.ascender ? Math.round(n.ascender / 2) : 0
  ), d = ko(
    t,
    "HIKLEFJMNTZBDPRAGOQSUVWXY",
    i
  );
  return {
    xMin: e,
    yMin: s,
    xMax: o,
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
function Xs(t) {
  if (t.contours && t.contours.length > 0) {
    let n = 1 / 0, e = 1 / 0, s = -1 / 0, o = -1 / 0, i = !1;
    for (const r of t.contours)
      for (const a of r) {
        const c = [
          [a.x, a.y],
          [a.x1, a.y1],
          [a.x2, a.y2]
        ];
        for (const [f, u] of c)
          typeof f == "number" && typeof u == "number" && (i = !0, f < n && (n = f), u < e && (e = u), f > s && (s = f), u > o && (o = u));
      }
    if (i) return { xMin: n, yMin: e, xMax: s, yMax: o };
  }
  return null;
}
function ko(t, n, e) {
  for (const s of n) {
    const o = s.charCodeAt(0), i = t.find((r) => (r.unicodes || (r.unicode ? [r.unicode] : [])).includes(o));
    if (i) {
      const r = Xs(i);
      if (r) return r.yMax;
    }
  }
  return e || 0;
}
function of(t) {
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
  for (const [s, o, i] of e)
    for (const r of t)
      if (r >= o && r <= i) {
        const a = Math.floor(s / 32);
        n[a] |= 1 << s % 32;
        break;
      }
  return n;
}
function rf(t, n) {
  const e = (t.weightClass || 400) >= 700, s = (t.italicAngle || 0) !== 0;
  let o = 0;
  return e && (o |= 1), s && (o |= 2), {
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
    macStyle: o,
    lowestRecPPEM: 8,
    fontDirectionHint: 2,
    indexToLocFormat: 0,
    // coordinated by export.js for glyf/loca
    glyphDataFormat: 0
  };
}
function af(t, n, e) {
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
function cf(t, n) {
  if (n)
    return {
      version: 20480,
      numGlyphs: t.length
    };
  let e = 0, s = 0, o = 0, i = 0, r = 0, a = 0, c = 0;
  for (const f of t) {
    if (f.contours) {
      let u = 0;
      for (const l of f.contours)
        u += l.length;
      u > e && (e = u), f.contours.length > s && (s = f.contours.length);
    }
    f.components && (f.components.length > r && (r = f.components.length), 1 > a && (a = 1)), f.instructions && f.instructions.length > c && (c = f.instructions.length);
  }
  return {
    version: 65536,
    numGlyphs: t.length,
    maxPoints: e,
    maxContours: s,
    maxCompositePoints: o,
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
function ff(t, n) {
  const e = (t.weightClass || 400) >= 700, s = (t.italicAngle || 0) !== 0;
  let o = t.fsSelection;
  o === void 0 && (o = 0, e && (o |= 32), s && (o |= 1), !e && !s && (o |= 64));
  const i = of(n.unicodeRanges), r = n.unicodeRanges.has(32);
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
    fsSelection: o,
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
function uf(t) {
  const n = [], e = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || lf(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || hr(t),
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
  for (const [s, o] of Object.entries(e)) {
    const i = Number(s);
    o && (n.push({
      platformID: 3,
      encodingID: 1,
      languageID: 1033,
      nameID: i,
      value: o
    }), n.push({
      platformID: 1,
      encodingID: 0,
      languageID: 0,
      nameID: i,
      value: o
    }), n.push({
      platformID: 0,
      encodingID: 3,
      languageID: 0,
      nameID: i,
      value: o
    }));
  }
  return { version: 0, names: n };
}
function lf(t) {
  const n = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${n}` : n;
}
function hr(t) {
  const n = (t.familyName || "").replace(/\s/g, ""), e = t.styleName || "Regular";
  return `${n}-${e}`;
}
function hf(t, n) {
  const e = t.italicAngle || 0, s = t.underlinePosition || Math.round(-(t.unitsPerEm || 1e3) * 0.1), o = t.underlineThickness || Math.round((t.unitsPerEm || 1e3) * 0.05);
  return {
    version: 131072,
    italicAngle: e,
    underlinePosition: s,
    underlineThickness: o,
    isFixedPitch: t.isFixedPitch ? 1 : 0,
    minMemType42: 0,
    maxMemType42: 0,
    minMemType1: 0,
    maxMemType1: 0,
    glyphNames: n.map((i) => String(i.name ?? ".notdef"))
  };
}
function gf(t) {
  const n = /* @__PURE__ */ new Map();
  let e = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const u of f)
      n.has(u) || n.set(u, a), u > 65535 && (e = !0);
  }
  const s = [...n.entries()].sort((a, c) => a[0] - c[0]), o = [], i = [];
  if (e) {
    const a = pf(s);
    o.push({ format: 12, language: 0, groups: a }), i.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), i.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const r = s.filter(([a]) => a <= 65535);
  if (r.length > 0) {
    const { segments: a, glyphIdArray: c } = df(r), f = o.length;
    o.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), i.push({ platformID: 3, encodingID: 1, subtableIndex: f }), i.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: i, subtables: o };
}
function pf(t) {
  if (t.length === 0) return [];
  const n = [];
  let e = t[0][0], s = t[0][1], o = e, i = s;
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r];
    a === o + 1 && c === i + 1 ? (o = a, i = c) : (n.push({
      startCharCode: e,
      endCharCode: o,
      startGlyphID: s
    }), e = a, s = c, o = a, i = c);
  }
  return n.push({
    startCharCode: e,
    endCharCode: o,
    startGlyphID: s
  }), n;
}
function df(t) {
  const n = [], e = [];
  if (t.length === 0)
    return n.push({
      startCode: 65535,
      endCode: 65535,
      idDelta: 1,
      idRangeOffset: 0
    }), { segments: n, glyphIdArray: e };
  let s = t[0][0], o = t[0][1] - t[0][0], i = t[0][0];
  for (let r = 1; r < t.length; r++) {
    const [a, c] = t[r], f = c - a;
    a === i + 1 && f === o || (n.push({
      startCode: s,
      endCode: i,
      idDelta: o,
      idRangeOffset: 0
    }), s = a, o = f), i = a;
  }
  return n.push({
    startCode: s,
    endCode: i,
    idDelta: o,
    idRangeOffset: 0
  }), n.push({
    startCode: 65535,
    endCode: 65535,
    idDelta: 1,
    idRangeOffset: 0
  }), { segments: n, glyphIdArray: e };
}
function mf(t) {
  return { hMetrics: t.map((e) => ({
    advanceWidth: e.advanceWidth || 0,
    lsb: e.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function yf(t) {
  return { glyphs: t.map((e) => {
    if (e.contours && e.contours.length > 0) {
      const s = Xs(e);
      return {
        type: "simple",
        xMin: s ? s.xMin : 0,
        yMin: s ? s.yMin : 0,
        xMax: s ? s.xMax : 0,
        yMax: s ? s.yMax : 0,
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
function xf(t, n) {
  const e = t.postScriptName || hr(t), s = n.slice(1).map((l) => l.name || ".notdef"), o = n.map((l) => l.charString ? l.charString : l.contours && l.contours.length > 0 && l.contours[0]?.[0]?.type ? pe(l.contours) : []), i = [];
  function r(l) {
    const g = 391 + i.length;
    return i.push(l), g;
  }
  const a = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(), c = t.familyName || "", f = wf(t.weightClass), u = s.map((l) => r(l));
  return {
    majorVersion: 1,
    minorVersion: 0,
    names: [e],
    strings: i,
    globalSubrs: [],
    fonts: [
      {
        topDict: {
          FullName: r(a),
          FamilyName: r(c),
          Weight: r(f),
          FontBBox: [
            0,
            t.descender || 0,
            t.unitsPerEm || 1e3,
            t.ascender || 0
          ]
        },
        charset: u,
        encoding: [],
        charStrings: o,
        privateDict: {},
        localSubrs: []
      }
    ]
  };
}
function wf(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function Co(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (let c = 0; c < n.length; c++)
    n[c].name && e.set(n[c].name, c);
  const s = [];
  for (const c of t) {
    const f = e.get(c.left), u = e.get(c.right);
    f !== void 0 && u !== void 0 && s.push({ left: f, right: u, value: c.value });
  }
  if (s.length === 0) return null;
  const o = s.length, i = Math.floor(Math.log2(o)), r = Math.pow(2, i) * 6, a = o * 6 - r;
  return {
    formatVariant: "opentype",
    version: 0,
    nTables: 1,
    subtables: [
      {
        version: 0,
        coverage: 1,
        format: 0,
        nPairs: o,
        searchRange: r,
        entrySelector: i,
        rangeShift: a,
        pairs: s
      }
    ]
  };
}
function jn(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (let o = 0; o < n.length; o++)
    n[o].name && e.set(n[o].name, o);
  const s = [];
  for (const o of t) {
    const i = e.get(o.left), r = e.get(o.right);
    i !== void 0 && r !== void 0 && s.push({ left: i, right: r, value: o.value });
  }
  return { pairs: s, nameToIndex: e };
}
function _f(t, n, e) {
  switch (e) {
    case "kern-ot-f0":
    case "gpos+kern":
      return Co(t, n);
    case "kern-ot-f2":
      return Sf(t, n);
    case "kern-apple-f0":
      return gr(t, n);
    case "kern-apple-f3":
      return bf(t, n);
    default:
      return Co(t, n);
  }
}
function Sf(t, n) {
  const { pairs: e } = jn(t, n);
  if (e.length === 0) return null;
  const {
    leftClasses: s,
    rightClasses: o,
    valueMatrix: i,
    leftGlyphToClass: r,
    rightGlyphToClass: a
  } = pr(e), c = s.length, f = o.length, u = f * 2, l = 8, g = Array.from(r.keys()).sort((A, C) => A - C), p = Array.from(a.keys()).sort(
    (A, C) => A - C
  ), h = g.length > 0 ? g[0] : 0, d = g.length > 0 ? g[g.length - 1] - h + 1 : 0, x = p.length > 0 ? p[0] : 0, m = p.length > 0 ? p[p.length - 1] - x + 1 : 0, y = 4 + d * 2, S = 4 + m * 2, w = l, _ = w + y, v = _ + S, b = [];
  for (let A = 0; A < d; A++) {
    const C = h + A, I = r.get(C) ?? 0;
    b.push(v + I * u);
  }
  const E = [];
  for (let A = 0; A < m; A++) {
    const C = x + A, I = a.get(C) ?? 0;
    E.push(I * 2);
  }
  return {
    formatVariant: "opentype",
    version: 0,
    nTables: 1,
    subtables: [
      {
        version: 0,
        coverage: 513,
        // format 2, horizontal
        format: 2,
        rowWidth: u,
        leftOffsetTable: w,
        rightOffsetTable: _,
        kerningArrayOffset: v,
        leftClassTable: {
          firstGlyph: h,
          nGlyphs: d,
          offsets: b
        },
        rightClassTable: {
          firstGlyph: x,
          nGlyphs: m,
          offsets: E
        },
        nLeftClasses: c,
        nRightClasses: f,
        values: i
      }
    ]
  };
}
function gr(t, n) {
  const { pairs: e } = jn(t, n);
  if (e.length === 0) return null;
  const s = e.length, o = Math.floor(Math.log2(s)), i = Math.pow(2, o) * 6, r = s * 6 - i;
  return {
    formatVariant: "apple",
    version: 65536,
    nTables: 1,
    subtables: [
      {
        coverage: 0,
        // horizontal
        format: 0,
        tupleIndex: 0,
        nPairs: s,
        searchRange: i,
        entrySelector: o,
        rangeShift: r,
        pairs: e
      }
    ]
  };
}
function bf(t, n) {
  const { pairs: e } = jn(t, n);
  if (e.length === 0) return null;
  const {
    leftClasses: s,
    rightClasses: o,
    valueMatrix: i,
    leftGlyphToClass: r,
    rightGlyphToClass: a
  } = pr(e), c = s.length, f = o.length, u = /* @__PURE__ */ new Set();
  u.add(0);
  for (const m of i)
    for (const y of m)
      u.add(y);
  if (c > 255 || f > 255 || u.size > 255)
    return gr(t, n);
  const l = Array.from(u).sort((m, y) => m - y), g = /* @__PURE__ */ new Map();
  for (let m = 0; m < l.length; m++)
    g.set(l[m], m);
  const p = n.length, h = new Array(p).fill(0), d = new Array(p).fill(0);
  for (const [m, y] of r)
    m < p && (h[m] = y);
  for (const [m, y] of a)
    m < p && (d[m] = y);
  const x = [];
  for (let m = 0; m < c; m++)
    for (let y = 0; y < f; y++) {
      const S = i[m]?.[y] || 0;
      x.push(g.get(S) ?? 0);
    }
  return {
    formatVariant: "apple",
    version: 65536,
    nTables: 1,
    subtables: [
      {
        coverage: 0,
        format: 3,
        tupleIndex: 0,
        glyphCount: p,
        kernValueCount: l.length,
        leftClassCount: c,
        rightClassCount: f,
        flags: 0,
        kernValues: l,
        leftClasses: h,
        rightClasses: d,
        kernIndices: x
      }
    ]
  };
}
function pr(t) {
  const n = /* @__PURE__ */ new Map(), e = /* @__PURE__ */ new Set();
  for (const { left: m, right: y, value: S } of t)
    n.has(m) || n.set(m, /* @__PURE__ */ new Map()), n.get(m).set(y, S), e.add(y);
  const s = /* @__PURE__ */ new Map();
  for (const [m, y] of n) {
    const S = Array.from(y.entries()).sort((w, _) => w[0] - _[0]);
    s.set(m, S.map((w) => `${w[0]}:${w[1]}`).join(","));
  }
  const o = /* @__PURE__ */ new Map(), i = /* @__PURE__ */ new Map();
  let r = 1;
  for (const [m, y] of s)
    o.has(y) || o.set(y, r++), i.set(m, o.get(y));
  const a = /* @__PURE__ */ new Map();
  for (const { left: m, right: y, value: S } of t)
    a.has(y) || a.set(y, /* @__PURE__ */ new Map()), a.get(y).set(m, S);
  const c = /* @__PURE__ */ new Map();
  for (const [m, y] of a) {
    const S = Array.from(y.entries()).sort((w, _) => w[0] - _[0]);
    c.set(m, S.map((w) => `${w[0]}:${w[1]}`).join(","));
  }
  const f = /* @__PURE__ */ new Map(), u = /* @__PURE__ */ new Map();
  let l = 1;
  for (const [m, y] of c)
    f.has(y) || f.set(y, l++), u.set(m, f.get(y));
  const g = r, p = l, h = [];
  for (let m = 0; m < g; m++)
    h.push(new Array(p).fill(0));
  for (const { left: m, right: y, value: S } of t) {
    const w = i.get(m) ?? 0, _ = u.get(y) ?? 0;
    h[w][_] = S;
  }
  const d = Array.from({ length: g }, (m, y) => y), x = Array.from({ length: p }, (m, y) => y);
  return {
    leftClasses: d,
    rightClasses: x,
    valueMatrix: h,
    leftGlyphToClass: i,
    rightGlyphToClass: u
  };
}
function vf(t, n) {
  const { pairs: e } = jn(t, n);
  if (e.length === 0) return null;
  const s = dr(e);
  return {
    majorVersion: 1,
    minorVersion: 0,
    scriptList: {
      scriptRecords: [
        {
          scriptTag: "DFLT",
          script: {
            defaultLangSys: {
              lookupOrderOffset: 0,
              requiredFeatureIndex: 65535,
              featureIndices: [0]
            },
            langSysRecords: []
          }
        }
      ]
    },
    featureList: {
      featureRecords: [
        {
          featureTag: "kern",
          feature: {
            featureParamsOffset: 0,
            lookupListIndices: [0]
          }
        }
      ]
    },
    lookupList: {
      lookups: [s]
    }
  };
}
function kf(t, n, e) {
  const { pairs: s } = jn(n, e), o = JSON.parse(JSON.stringify(t));
  if (s.length === 0) return o;
  const i = dr(s), r = /* @__PURE__ */ new Set();
  for (const f of o.featureList.featureRecords)
    if (f.featureTag === "kern")
      for (const u of f.feature.lookupListIndices)
        r.add(u);
  let a;
  if (r.size > 0) {
    const f = [...r].sort((u, l) => u - l);
    a = f[0], o.lookupList.lookups[a] = i;
    for (let u = f.length - 1; u > 0; u--)
      o.lookupList.lookups.splice(f[u], 1);
    if (f.length > 1) {
      const u = f.slice(1);
      Cf(o, u);
    }
  } else
    a = o.lookupList.lookups.length, o.lookupList.lookups.push(i);
  let c = !1;
  for (const f of o.featureList.featureRecords)
    f.featureTag === "kern" && (f.feature.lookupListIndices = [a], c = !0);
  if (!c) {
    o.featureList.featureRecords.push({
      featureTag: "kern",
      feature: {
        featureParamsOffset: 0,
        lookupListIndices: [a]
      }
    });
    const f = o.featureList.featureRecords.length - 1;
    for (const u of o.scriptList.scriptRecords) {
      u.script.defaultLangSys && u.script.defaultLangSys.featureIndices.push(f);
      for (const l of u.script.langSysRecords || [])
        l.langSys.featureIndices.push(f);
    }
  }
  return o;
}
function Cf(t, n) {
  function e(s) {
    let o = 0;
    for (const i of n)
      if (i < s) o++;
      else break;
    return s - o;
  }
  for (const s of t.featureList.featureRecords)
    s.feature.lookupListIndices = s.feature.lookupListIndices.filter((o) => !n.includes(o)).map(e);
}
function dr(t) {
  const n = /* @__PURE__ */ new Map();
  for (const { left: o, right: i, value: r } of t)
    n.has(o) || n.set(o, []), n.get(o).push({ secondGlyph: i, value1: { xAdvance: r }, value2: null });
  const e = Array.from(n.keys()).sort((o, i) => o - i), s = e.map((o) => {
    const i = n.get(o);
    return i.sort((r, a) => r.secondGlyph - a.secondGlyph), i;
  });
  return {
    lookupType: 2,
    lookupFlag: 0,
    subtables: [
      {
        format: 1,
        coverage: { format: 1, glyphs: e },
        valueFormat1: 4,
        // xAdvance
        valueFormat2: 0,
        pairSets: s
      }
    ]
  };
}
function Af(t, n) {
  const { axes: e, instances: s = [] } = t;
  let o = 256;
  const i = e.map((a) => {
    const c = o++;
    return We(n, c, a.name || a.tag), {
      axisTag: a.tag,
      minValue: a.min,
      defaultValue: a.default,
      maxValue: a.max,
      flags: a.hidden ? 1 : 0,
      axisNameID: c
    };
  }), r = s.map((a) => {
    const c = o++;
    We(n, c, a.name);
    const f = e.map((l) => a.coordinates[l.tag] ?? l.default), u = {
      subfamilyNameID: c,
      flags: 0,
      coordinates: f
    };
    if (a.postScriptName) {
      const l = o++;
      We(n, l, a.postScriptName), u.postScriptNameID = l;
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
function We(t, n, e) {
  e && t.names.push(
    { platformID: 3, encodingID: 1, languageID: 1033, nameID: n, value: e },
    { platformID: 1, encodingID: 0, languageID: 0, nameID: n, value: e },
    { platformID: 0, encodingID: 3, languageID: 0, nameID: n, value: e }
  );
}
function Of(t, n, e = !0) {
  const s = t[n];
  if (s >= 32 && s <= 246)
    return { value: s - 139, bytesConsumed: 1 };
  if (s >= 247 && s <= 250) {
    const o = t[n + 1];
    return { value: (s - 247) * 256 + o + 108, bytesConsumed: 2 };
  }
  if (s >= 251 && s <= 254) {
    const o = t[n + 1];
    return { value: -(s - 251) * 256 - o - 108, bytesConsumed: 2 };
  }
  if (s === 28) {
    const o = t[n + 1] << 8 | t[n + 2];
    return { value: o > 32767 ? o - 65536 : o, bytesConsumed: 3 };
  }
  return s === 29 && e ? { value: t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0, bytesConsumed: 5 } : s === 30 && e ? If(t, n + 1) : s === 255 && !e ? { value: (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function If(t, n) {
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
  let s = "", o = n, i = !1;
  for (; !i; ) {
    const a = t[o++], c = a >> 4 & 15, f = a & 15;
    c === 15 ? i = !0 : (s += e[c], f === 15 ? i = !0 : s += e[f]);
  }
  return { value: s === "" || s === "." ? 0 : parseFloat(s), bytesConsumed: 1 + (o - n) };
}
function mr(t) {
  return Number.isInteger(t) ? Ef(t) : Tf(t);
}
function Ef(t) {
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
function Tf(t) {
  const n = [30];
  let e = t.toString();
  (e.includes("e") || e.includes("E")) && (e = t.toPrecision(10), e.includes(".") && (e = e.replace(/0+$/, "").replace(/\.$/, "")));
  const s = [];
  for (const o of e)
    switch (o) {
      case "0":
        s.push(0);
        break;
      case "1":
        s.push(1);
        break;
      case "2":
        s.push(2);
        break;
      case "3":
        s.push(3);
        break;
      case "4":
        s.push(4);
        break;
      case "5":
        s.push(5);
        break;
      case "6":
        s.push(6);
        break;
      case "7":
        s.push(7);
        break;
      case "8":
        s.push(8);
        break;
      case "9":
        s.push(9);
        break;
      case ".":
        s.push(10);
        break;
      case "E":
      case "e":
        s.push(11);
        break;
      case "-":
        s.push(14);
        break;
    }
  for (let o = 0; o < s.length - 1; o++)
    s[o] === 11 && s[o + 1] === 14 && s.splice(o, 2, 12);
  s.push(15);
  for (let o = 0; o < s.length; o += 2) {
    const i = s[o], r = o + 1 < s.length ? s[o + 1] : 15;
    n.push(i << 4 | r);
  }
  return n;
}
function Df(t) {
  return t <= 21 && t !== 28 && t !== 29 && t !== 30;
}
function zt(t, n = 0, e = t.length) {
  const s = [], o = [];
  let i = n;
  for (; i < e; ) {
    const r = t[i];
    if (Df(r)) {
      let a;
      r === 12 ? (a = 3072 | t[i + 1], i += 2) : (a = r, i += 1), s.push({ operator: a, operands: [...o] }), o.length = 0;
    } else {
      const a = Of(t, i, !0);
      a === null ? i += 1 : (o.push(a.value), i += a.bytesConsumed);
    }
  }
  return s;
}
function Ct(t, n) {
  const e = t[n] << 8 | t[n + 1];
  if (e === 0)
    return { items: [], totalBytes: 2 };
  const s = t[n + 2], o = n + 3, i = [];
  for (let f = 0; f <= e; f++) {
    let u = 0;
    const l = o + f * s;
    for (let g = 0; g < s; g++)
      u = u << 8 | t[l + g];
    i.push(u);
  }
  const r = o + (e + 1) * s, a = [];
  for (let f = 0; f < e; f++) {
    const u = r + i[f] - 1, l = r + i[f + 1] - 1;
    a.push(new Uint8Array(Array.prototype.slice.call(t, u, l)));
  }
  const c = r + i[e] - 1 - n;
  return { items: a, totalBytes: c };
}
function Jn(t, n) {
  const s = (t[n] << 24 | t[n + 1] << 16 | t[n + 2] << 8 | t[n + 3]) >>> 0;
  if (s === 0)
    return { items: [], totalBytes: 4 };
  const o = t[n + 4], i = n + 5, r = [];
  for (let u = 0; u <= s; u++) {
    let l = 0;
    const g = i + u * o;
    for (let p = 0; p < o; p++)
      l = l << 8 | t[g + p];
    r.push(l >>> 0);
  }
  const a = i + (s + 1) * o, c = [];
  for (let u = 0; u < s; u++) {
    const l = a + r[u] - 1, g = a + r[u + 1] - 1;
    c.push(new Uint8Array(Array.prototype.slice.call(t, l, g)));
  }
  const f = a + r[s] - 1 - n;
  return { items: c, totalBytes: f };
}
function vt(t) {
  const n = t.length;
  if (n === 0)
    return [0, 0];
  const e = [1];
  for (const r of t)
    e.push(e[e.length - 1] + r.length);
  const s = e[e.length - 1];
  let o;
  s <= 255 ? o = 1 : s <= 65535 ? o = 2 : s <= 16777215 ? o = 3 : o = 4;
  const i = [];
  i.push(n >> 8 & 255, n & 255), i.push(o);
  for (const r of e)
    for (let a = o - 1; a >= 0; a--)
      i.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      i.push(r[a]);
  return i;
}
function Qn(t) {
  const n = t.length;
  if (n === 0)
    return [0, 0, 0, 0];
  const e = [1];
  for (const r of t)
    e.push(e[e.length - 1] + r.length);
  const s = e[e.length - 1];
  let o;
  s <= 255 ? o = 1 : s <= 65535 ? o = 2 : s <= 16777215 ? o = 3 : o = 4;
  const i = [];
  i.push(
    n >> 24 & 255,
    n >> 16 & 255,
    n >> 8 & 255,
    n & 255
  ), i.push(o);
  for (const r of e)
    for (let a = o - 1; a >= 0; a--)
      i.push(r >> a * 8 & 255);
  for (const r of t)
    for (let a = 0; a < r.length; a++)
      i.push(r[a]);
  return i;
}
const xs = {
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
}, ft = Object.fromEntries(
  Object.entries(xs).map(([t, n]) => [n, Number(t)])
), ws = {
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
}, Ao = Object.fromEntries(
  Object.entries(ws).map(([t, n]) => [n, Number(t)])
), _s = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, Kt = Object.fromEntries(
  Object.entries(_s).map(([t, n]) => [n, Number(t)])
), yr = {
  18: "Private"
}, xr = {
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
function Ft(t, n) {
  const e = {};
  for (const { operator: s, operands: o } of t) {
    const i = n[s] || `op_${s}`;
    e[i] = o.length === 1 ? o[0] : o;
  }
  return e;
}
function un(t, n) {
  const e = [];
  for (const [s, o] of Object.entries(t)) {
    const i = n[s];
    if (i === void 0) continue;
    const r = Array.isArray(o) ? o : [o];
    e.push({ operator: i, operands: r });
  }
  return e;
}
function wr(t, n, e) {
  const s = t[n];
  if (s === 0) {
    const o = [];
    for (let i = 0; i < e; i++)
      o.push(t[n + 1 + i]);
    return o;
  }
  if (s === 3) {
    const o = t[n + 1] << 8 | t[n + 2], i = new Array(e);
    let r = n + 3;
    for (let a = 0; a < o; a++) {
      const c = t[r] << 8 | t[r + 1], f = t[r + 2];
      r += 3;
      const u = a < o - 1 ? t[r] << 8 | t[r + 1] : e;
      for (let l = c; l < u; l++)
        i[l] = f;
    }
    return i;
  }
  if (s === 4) {
    const o = (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4]) >>> 0, i = new Array(e);
    let r = n + 5;
    for (let a = 0; a < o; a++) {
      const c = (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0, f = t[r + 4] << 8 | t[r + 5];
      r += 6;
      const u = a < o - 1 ? (t[r] << 24 | t[r + 1] << 16 | t[r + 2] << 8 | t[r + 3]) >>> 0 : e;
      for (let l = c; l < u; l++)
        i[l] = f;
    }
    return i;
  }
  throw new Error(`Unsupported FDSelect format: ${s}`);
}
function _r(t) {
  const n = [0];
  for (const e of t)
    n.push(e);
  return n;
}
function Bf(t, n, e) {
  if (n === 0) return "ISOAdobe";
  if (n === 1) return "Expert";
  if (n === 2) return "ExpertSubset";
  const s = t[n], o = [];
  if (s === 0)
    for (let i = 1; i < e; i++) {
      const r = t[n + 1 + (i - 1) * 2] << 8 | t[n + 2 + (i - 1) * 2];
      o.push(r);
    }
  else if (s === 1) {
    let i = n + 1;
    for (; o.length < e - 1; ) {
      const r = t[i] << 8 | t[i + 1], a = t[i + 2];
      i += 3;
      for (let c = 0; c <= a && o.length < e - 1; c++)
        o.push(r + c);
    }
  } else if (s === 2) {
    let i = n + 1;
    for (; o.length < e - 1; ) {
      const r = t[i] << 8 | t[i + 1], a = t[i + 2] << 8 | t[i + 3];
      i += 4;
      for (let c = 0; c <= a && o.length < e - 1; c++)
        o.push(r + c);
    }
  }
  return o;
}
function Mf(t) {
  if (typeof t == "string")
    return [];
  const n = [0];
  for (const e of t)
    n.push(e >> 8 & 255, e & 255);
  return n;
}
function Lf(t, n) {
  if (n === 0) return "Standard";
  if (n === 1) return "Expert";
  const e = t[n] & 127, s = (t[n] & 128) !== 0, o = [];
  if (e === 0) {
    const i = t[n + 1];
    for (let r = 0; r < i; r++)
      o.push(t[n + 2 + r]);
  } else if (e === 1) {
    const i = t[n + 1];
    let r = n + 2;
    for (let a = 0; a < i; a++) {
      const c = t[r], f = t[r + 1];
      r += 2;
      for (let u = 0; u <= f; u++)
        o.push(c + u);
    }
  }
  return { format: e, codes: o, hasSupplement: s };
}
const Sr = /* @__PURE__ */ new Set([
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
function fe(t, n) {
  const e = [];
  for (const { operator: s, operands: o } of t) {
    const i = n.has(s);
    for (const r of o)
      i && Number.isInteger(r) ? e.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : e.push(...mr(r));
    s >= 3072 ? e.push(12, s & 255) : e.push(s);
  }
  return e;
}
function Io(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) n.push(t.charCodeAt(e));
  return n;
}
function Eo(t) {
  return String.fromCharCode(...t);
}
function Rf(t, n) {
  const e = new Uint8Array(t), s = e[0], o = e[1];
  let r = e[2];
  const a = Ct(e, r);
  r += a.totalBytes;
  const c = a.items.map(Eo), f = Ct(e, r);
  r += f.totalBytes;
  const u = Ct(e, r);
  r += u.totalBytes;
  const l = u.items.map(Eo), p = Ct(e, r).items.map((d) => Array.from(d)), h = f.items.map((d) => zf(e, d));
  return {
    majorVersion: s,
    minorVersion: o,
    names: c,
    strings: l,
    globalSubrs: p,
    fonts: h
  };
}
function zf(t, n) {
  const e = zt(n, 0, n.length), s = Ft(e, xs), o = s.CharStrings, i = s.charset ?? 0, r = s.Encoding ?? 0, a = s.Private;
  delete s.CharStrings, delete s.charset, delete s.Encoding, delete s.Private;
  const c = s.FDArray, f = s.FDSelect;
  delete s.FDArray, delete s.FDSelect;
  let u = [];
  o !== void 0 && (u = Ct(t, o).items.map((_) => Array.from(_)));
  const l = u.length, g = Bf(t, i, l), p = Lf(t, r);
  let h = {}, d = [];
  if (Array.isArray(a) && a.length === 2) {
    const [w, _] = a, v = zt(t, _, _ + w);
    h = Ft(v, ws), h.Subrs !== void 0 && (d = Ct(t, _ + h.Subrs).items.map((E) => Array.from(E)), delete h.Subrs);
  }
  const x = s.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = Ct(t, c).items.map((_) => {
    const v = zt(_, 0, _.length), b = Ft(v, xs);
    let E = {}, A = [];
    if (Array.isArray(b.Private) && b.Private.length === 2) {
      const [C, I] = b.Private, O = zt(t, I, I + C);
      E = Ft(O, ws), E.Subrs !== void 0 && (A = Ct(t, I + E.Subrs).items.map((D) => Array.from(D)), delete E.Subrs), delete b.Private;
    }
    return {
      fontDict: b,
      privateDict: E,
      localSubrs: A
    };
  })), f !== void 0 && (y = wr(t, f, l)));
  const S = {
    topDict: s,
    charset: g,
    encoding: p,
    charStrings: u,
    privateDict: h,
    localSubrs: d
  };
  return x && (S.isCIDFont = !0, m && (S.fdArray = m), y && (S.fdSelect = y)), S;
}
function Ff(t) {
  const {
    majorVersion: n = 1,
    minorVersion: e = 0,
    names: s = [],
    strings: o = [],
    globalSubrs: i = [],
    fonts: r = []
  } = t, a = [n, e, 4, 4], c = vt(s.map(Io)), f = vt(o.map(Io)), u = vt(
    i.map((S) => new Uint8Array(S))
  ), l = r.map((S) => Vf(S)), g = r.map(
    (S, w) => To(
      S,
      l[w],
      /* baseOffset */
      0
    )
  ), p = vt(g);
  let d = a.length + c.length + p.length + f.length + u.length;
  const x = r.map((S, w) => {
    const _ = To(S, l[w], d);
    return d += l[w].totalSize, _;
  }), m = vt(x);
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
  for (const S of l)
    for (const w of S.sections)
      for (let _ = 0; _ < w.length; _++) y.push(w[_]);
  return y;
}
function Vf(t) {
  const n = [], e = {};
  let s = 0;
  const o = (t.charStrings || []).map((l) => new Uint8Array(l)), i = vt(o);
  e.charStrings = s, n.push(i), s += i.length;
  const r = t.charset;
  if (typeof r == "string")
    e.charset = r === "ISOAdobe" ? 0 : r === "Expert" ? 1 : 2, e.charsetIsPredefined = !0;
  else {
    const l = Mf(r || []);
    e.charset = s, e.charsetIsPredefined = !1, n.push(l), s += l.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    e.encoding = a === "Standard" ? 0 : 1, e.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const l = Pf(a);
    e.encoding = s, e.encodingIsPredefined = !1, n.push(l), s += l.length;
  } else
    e.encoding = 0, e.encodingIsPredefined = !0;
  const c = un(
    t.privateDict || {},
    Ao
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = vt(
    t.localSubrs.map((l) => new Uint8Array(l))
  )), f) {
    const g = fe(
      c,
      Oo
    ).length + 6;
    c.push({
      operator: Ao.Subrs,
      operands: [g]
    });
  }
  const u = fe(c, Oo);
  if (e.privateOffset = s, e.privateSize = u.length, n.push(u), s += u.length, f && (n.push(f), s += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const l = _r(t.fdSelect);
      e.fdSelect = s, n.push(l), s += l.length;
    }
    if (t.fdArray) {
      const l = t.fdArray.map((p) => {
        const h = un(
          p.fontDict || {},
          ft
        );
        return fe(h, Sr);
      }), g = vt(l);
      e.fdArray = s, n.push(g), s += g.length;
    }
  }
  return { sections: n, totalSize: s, offsets: e };
}
function To(t, n, e) {
  const s = n.offsets, o = un(
    t.topDict || {},
    ft
  );
  return o.push({
    operator: ft.CharStrings,
    operands: [e + s.charStrings]
  }), s.charsetIsPredefined ? s.charset !== 0 && o.push({
    operator: ft.charset,
    operands: [s.charset]
  }) : o.push({
    operator: ft.charset,
    operands: [e + s.charset]
  }), s.encodingIsPredefined ? s.encoding !== 0 && o.push({
    operator: ft.Encoding,
    operands: [s.encoding]
  }) : o.push({
    operator: ft.Encoding,
    operands: [e + s.encoding]
  }), o.push({
    operator: ft.Private,
    operands: [s.privateSize, e + s.privateOffset]
  }), t.isCIDFont && (s.fdArray !== void 0 && o.push({
    operator: ft.FDArray,
    operands: [e + s.fdArray]
  }), s.fdSelect !== void 0 && o.push({
    operator: ft.FDSelect,
    operands: [e + s.fdSelect]
  })), fe(o, Sr);
}
function Pf(t) {
  const { format: n = 0, codes: e = [], hasSupplement: s = !1 } = t, o = [], i = n | (s ? 128 : 0);
  if (n === 0) {
    o.push(i), o.push(e.length);
    for (const r of e) o.push(r);
  } else if (n === 1) {
    const r = [];
    if (e.length > 0) {
      let a = e[0], c = 0;
      for (let f = 1; f < e.length; f++)
        e[f] === a + c + 1 ? c++ : (r.push([a, c]), a = e[f], c = 0);
      r.push([a, c]);
    }
    o.push(i), o.push(r.length);
    for (const [a, c] of r)
      o.push(a, c);
  }
  return o;
}
const Uf = Object.fromEntries(
  Object.entries(yr).map(([t, n]) => [n, Number(t)])
), Gf = Object.fromEntries(
  Object.entries(xr).map(([t, n]) => [n, Number(t)])
), Nf = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), $f = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), Do = /* @__PURE__ */ new Set([
  19
  // Subrs  (relative offset)
]);
function ue(t, n) {
  const e = [];
  for (const { operator: s, operands: o } of t) {
    const i = n.has(s);
    for (const r of o)
      i && Number.isInteger(r) ? e.push(
        29,
        r >>> 24 & 255,
        r >>> 16 & 255,
        r >>> 8 & 255,
        r & 255
      ) : e.push(...mr(r));
    s >= 3072 ? e.push(12, s & 255) : e.push(s);
  }
  return e;
}
function Hf(t, n) {
  const e = new Uint8Array(t), s = e[0], o = e[1], i = e[2], r = e[3] << 8 | e[4], a = i, c = a + r, f = zt(e, a, c), u = Ft(f, _s), l = u.CharStrings, g = u.VariationStore, p = u.FDArray, h = u.FDSelect;
  delete u.CharStrings, delete u.VariationStore, delete u.FDArray, delete u.FDSelect;
  const x = Jn(e, c).items.map((v) => Array.from(v));
  let m = [];
  l !== void 0 && (m = Jn(e, l).items.map((b) => Array.from(b)));
  const y = m.length;
  let S = [];
  p !== void 0 && (S = Jn(e, p).items.map((b) => {
    const E = zt(b, 0, b.length), A = Ft(E, {
      ...yr,
      ..._s
      // Font DICTs can also have FontMatrix
    });
    let C = {}, I = [];
    if (Array.isArray(A.Private) && A.Private.length === 2) {
      const [O, T] = A.Private, D = zt(e, T, T + O);
      C = Ft(D, xr), C.Subrs !== void 0 && (I = Jn(e, T + C.Subrs).items.map((L) => Array.from(L)), delete C.Subrs), delete A.Private;
    }
    return {
      fontDict: A,
      privateDict: C,
      localSubrs: I
    };
  }));
  let w = null;
  h !== void 0 && y > 0 && (w = wr(e, h, y));
  let _ = null;
  if (g !== void 0) {
    const v = e[g] << 8 | e[g + 1];
    _ = Array.from(
      e.slice(g, g + v)
    );
  }
  return {
    majorVersion: s,
    minorVersion: o,
    topDict: u,
    globalSubrs: x,
    charStrings: m,
    fontDicts: S,
    fdSelect: w,
    variationStore: _
  };
}
function Zf(t) {
  const {
    majorVersion: n = 2,
    minorVersion: e = 0,
    topDict: s = {},
    globalSubrs: o = [],
    charStrings: i = [],
    fontDicts: r = [],
    fdSelect: a = null,
    variationStore: c = null
  } = t, f = Qn(
    o.map((O) => new Uint8Array(O))
  ), u = Qn(i.map((O) => new Uint8Array(O))), l = a ? _r(a) : null, g = c ? new Uint8Array(c) : null, h = Bo(s, {
    charStrings: 0,
    fdArray: r.length > 0 ? 0 : void 0,
    fdSelect: a ? 0 : void 0,
    variationStore: c ? 0 : void 0
  }).length, d = 5;
  let m = d + h + f.length;
  const y = m;
  m += u.length;
  let S;
  l && (S = m, m += l.length);
  let w;
  g && (w = m, m += g.length);
  const _ = r.map((O) => {
    const T = un(
      O.privateDict || {},
      Gf
    );
    let D = null;
    if (O.localSubrs && O.localSubrs.length > 0 && (D = Qn(
      O.localSubrs.map((L) => new Uint8Array(L))
    )), D) {
      const $ = ue(
        T,
        Do
      ).length + 6;
      T.push({
        operator: 19,
        // Subrs
        operands: [$]
      });
    }
    const M = ue(T, Do);
    return {
      privBytes: M,
      localSubrBytes: D,
      totalSize: M.length + (D ? D.length : 0)
    };
  }), v = [];
  for (const O of _)
    v.push({ offset: m, size: O.privBytes.length }), m += O.totalSize;
  let b = null, E;
  if (r.length > 0) {
    const O = r.map((T, D) => {
      const M = un(T.fontDict || {}, {
        ...Uf,
        ...Kt
      });
      return M.push({
        operator: 18,
        // Private
        operands: [v[D].size, v[D].offset]
      }), ue(M, $f);
    });
    b = Qn(O), E = m, m += b.length;
  }
  const A = Bo(s, {
    charStrings: y,
    fdArray: E,
    fdSelect: S,
    variationStore: w
  });
  if (A.length !== h)
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
    ...A,
    ...f,
    ...u
  ];
  if (l)
    for (let O = 0; O < l.length; O++)
      I.push(l[O]);
  if (g)
    for (let O = 0; O < g.length; O++)
      I.push(g[O]);
  for (const O of _) {
    for (let T = 0; T < O.privBytes.length; T++) I.push(O.privBytes[T]);
    if (O.localSubrBytes)
      for (let T = 0; T < O.localSubrBytes.length; T++)
        I.push(O.localSubrBytes[T]);
  }
  if (b)
    for (let O = 0; O < b.length; O++) I.push(b[O]);
  return I;
}
function Bo(t, n) {
  const e = un(t, Kt);
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
  }), ue(e, Nf);
}
class B {
  /**
   * @param {number[]|Uint8Array} bytes - source bytes
   * @param {number} [startOffset=0]    - initial cursor position
   */
  constructor(n, e = 0) {
    const s = n instanceof Uint8Array ? n : new Uint8Array(n);
    this._view = new DataView(s.buffer, s.byteOffset, s.byteLength), this._pos = e;
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
    const s = [], o = this[n].bind(this);
    for (let i = 0; i < e; i++)
      s.push(o());
    return s;
  }
  /**
   * Read `count` raw bytes and return a plain Array of numbers.
   * @param {number} count
   * @returns {number[]}
   */
  bytes(n) {
    const e = [];
    for (let s = 0; s < n; s++)
      e.push(this._view.getUint8(this._pos + s));
    return this._pos += n, e;
  }
}
class k {
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
    const s = this[n].bind(this);
    for (const o of e)
      s(o);
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
const jf = 8, Wf = 4;
function qf(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.int16(), i = n.uint16(), r = [];
  for (let a = 0; a < i; a++)
    r.push({
      glyphIndex: n.uint16(),
      vertOriginY: n.int16()
    });
  return {
    majorVersion: e,
    minorVersion: s,
    defaultVertOriginY: o,
    numVertOriginYMetrics: i,
    vertOriginYMetrics: r
  };
}
function Yf(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.defaultVertOriginY ?? 0, o = t.vertOriginYMetrics ?? [], i = t.numVertOriginYMetrics ?? o.length, r = o.slice(0, i);
  for (; r.length < i; )
    r.push({ glyphIndex: 0, vertOriginY: s });
  const a = new k(
    jf + i * Wf
  );
  a.uint16(n), a.uint16(e), a.int16(s), a.uint16(i);
  for (const c of r)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? s);
  return a.toArray();
}
const Xf = 8;
function Kf(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = [];
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
    minorVersion: s,
    reserved: o,
    segmentMaps: r
  };
}
function Jf(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.reserved ?? 0, o = t.segmentMaps ?? [];
  let i = Xf;
  for (const a of o) {
    const c = a.axisValueMaps?.length ?? a.positionMapCount ?? 0;
    i += 2 + c * 4;
  }
  const r = new k(i);
  r.uint16(n), r.uint16(e), r.uint16(s), r.uint16(o.length);
  for (const a of o) {
    const c = a.axisValueMaps ?? [];
    r.uint16(c.length);
    for (const f of c)
      r.f2dot14(f.fromCoordinate), r.f2dot14(f.toCoordinate);
  }
  return r.toArray();
}
const Ss = 32768, bs = 32767;
function ln(t) {
  const n = new B(t), e = n.uint16(), s = n.offset32(), o = n.uint16(), i = n.array(
    "offset32",
    o
  ), r = Qf(
    n,
    s
  ), a = [];
  for (let c = 0; c < o; c++) {
    const f = i[c];
    f === 0 ? a.push(null) : a.push(tu(n, f));
  }
  return {
    format: e,
    variationRegionList: r,
    itemVariationData: a
  };
}
function Qf(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = [];
  for (let i = 0; i < s; i++) {
    const r = [];
    for (let a = 0; a < e; a++)
      r.push({
        startCoord: t.f2dot14(),
        peakCoord: t.f2dot14(),
        endCoord: t.f2dot14()
      });
    o.push({ regionAxes: r });
  }
  return { axisCount: e, regions: o };
}
function tu(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = (s & Ss) !== 0, a = s & bs, c = [];
  for (let f = 0; f < e; f++) {
    const u = [];
    for (let l = 0; l < a; l++)
      u.push(r ? t.int32() : t.int16());
    for (let l = a; l < o; l++)
      u.push(r ? t.int16() : t.int8());
    c.push(u);
  }
  return {
    itemCount: e,
    wordDeltaCount: s,
    regionIndexes: i,
    deltaSets: c
  };
}
function Wn(t) {
  const n = t.variationRegionList, e = t.itemVariationData ?? [], s = e.length, o = 8 + 4 * s, i = n.axisCount, r = n.regions.length, a = 4 + r * i * 6, c = o;
  let f = c + a;
  const u = [];
  for (let p = 0; p < s; p++) {
    const h = e[p];
    if (!h) {
      u.push(0);
      continue;
    }
    u.push(f);
    const d = h.regionIndexes.length, x = (h.wordDeltaCount & Ss) !== 0, m = h.wordDeltaCount & bs, y = 6 + 2 * d, S = x ? 4 : 2, w = x ? 2 : 1, _ = m * S + (d - m) * w, v = y + h.itemCount * _;
    f += v;
  }
  const l = f, g = new k(l);
  g.uint16(t.format ?? 1), g.offset32(c), g.uint16(s);
  for (let p = 0; p < s; p++)
    g.offset32(u[p]);
  g.uint16(i), g.uint16(r);
  for (const p of n.regions)
    for (const h of p.regionAxes)
      g.f2dot14(h.startCoord), g.f2dot14(h.peakCoord), g.f2dot14(h.endCoord);
  for (let p = 0; p < s; p++) {
    const h = e[p];
    if (!h) continue;
    const d = h.regionIndexes.length, x = (h.wordDeltaCount & Ss) !== 0, m = h.wordDeltaCount & bs;
    g.uint16(h.itemCount), g.uint16(h.wordDeltaCount), g.uint16(d), g.array("uint16", h.regionIndexes);
    for (const y of h.deltaSets) {
      for (let S = 0; S < m; S++)
        x ? g.int32(y[S] ?? 0) : g.int16(y[S] ?? 0);
      for (let S = m; S < d; S++)
        x ? g.int16(y[S] ?? 0) : g.int8(y[S] ?? 0);
    }
  }
  return g.toArray();
}
function F(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const s = t.uint16(), o = t.array("uint16", s);
    return { format: e, glyphs: o };
  }
  if (e === 2) {
    const s = t.uint16(), o = [];
    for (let i = 0; i < s; i++)
      o.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        startCoverageIndex: t.uint16()
      });
    return { format: e, ranges: o };
  }
  throw new Error(`Unknown Coverage format: ${e}`);
}
function P(t) {
  if (t.format === 1) {
    const n = 4 + t.glyphs.length * 2, e = new k(n);
    return e.uint16(1), e.uint16(t.glyphs.length), e.array("uint16", t.glyphs), e.toArray();
  }
  if (t.format === 2) {
    const n = 4 + t.ranges.length * 6, e = new k(n);
    e.uint16(2), e.uint16(t.ranges.length);
    for (const s of t.ranges)
      e.uint16(s.startGlyphID), e.uint16(s.endGlyphID), e.uint16(s.startCoverageIndex);
    return e.toArray();
  }
  throw new Error(`Unknown Coverage format: ${t.format}`);
}
function It(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o);
    return { format: e, startGlyphID: s, classValues: i };
  }
  if (e === 2) {
    const s = t.uint16(), o = [];
    for (let i = 0; i < s; i++)
      o.push({
        startGlyphID: t.uint16(),
        endGlyphID: t.uint16(),
        class: t.uint16()
      });
    return { format: e, ranges: o };
  }
  throw new Error(`Unknown ClassDef format: ${e}`);
}
function Et(t) {
  if (t.format === 1) {
    const n = 6 + t.classValues.length * 2, e = new k(n);
    return e.uint16(1), e.uint16(t.startGlyphID), e.uint16(t.classValues.length), e.array("uint16", t.classValues), e.toArray();
  }
  if (t.format === 2) {
    const n = 4 + t.ranges.length * 6, e = new k(n);
    e.uint16(2), e.uint16(t.ranges.length);
    for (const s of t.ranges)
      e.uint16(s.startGlyphID), e.uint16(s.endGlyphID), e.uint16(s.class);
    return e.toArray();
  }
  throw new Error(`Unknown ClassDef format: ${t.format}`);
}
function hn(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.uint16();
  if (o === 32768)
    return {
      format: 32768,
      deltaSetOuterIndex: e,
      deltaSetInnerIndex: s
    };
  const i = e, r = s, a = o, c = r - i + 1;
  let f, u, l;
  if (a === 1)
    f = 2, u = 3, l = 2;
  else if (a === 2)
    f = 4, u = 15, l = 8;
  else if (a === 3)
    f = 8, u = 255, l = 128;
  else
    throw new Error(
      `Unknown Device deltaFormat: ${a} at offset ${n} (words: ${e}, ${s}, ${o})`
    );
  const g = 16 / f, p = Math.ceil(c / g), h = [];
  for (let d = 0; d < p; d++) {
    const x = t.uint16(), m = Math.min(g, c - d * g);
    for (let y = 0; y < m; y++) {
      const S = 16 - f * (y + 1);
      let w = x >> S & u;
      w >= l && (w -= l * 2), h.push(w);
    }
  }
  return { format: a, startSize: i, endSize: r, deltaValues: h };
}
function me(t) {
  if (t.format === 32768) {
    const l = new k(6);
    return l.uint16(t.deltaSetOuterIndex), l.uint16(t.deltaSetInnerIndex), l.uint16(32768), l.toArray();
  }
  const { startSize: n, endSize: e, deltaFormat: s, deltaValues: o } = t;
  let i;
  if (s === 1) i = 2;
  else if (s === 2) i = 4;
  else if (s === 3) i = 8;
  else throw new Error(`Unknown Device deltaFormat: ${s}`);
  const r = 16 / i, a = Math.ceil(o.length / r), c = (1 << i) - 1, f = 6 + a * 2, u = new k(f);
  u.uint16(n), u.uint16(e), u.uint16(s);
  for (let l = 0; l < a; l++) {
    let g = 0;
    const p = Math.min(
      r,
      o.length - l * r
    );
    for (let h = 0; h < p; h++) {
      const d = 16 - i * (h + 1);
      g |= (o[l * r + h] & c) << d;
    }
    u.uint16(g);
  }
  return u.toArray();
}
function br(t, n) {
  t.seek(n);
  const e = t.uint16(), s = [];
  for (let i = 0; i < e; i++)
    s.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: s.map((i) => ({
    scriptTag: i.scriptTag,
    script: nu(t, n + i.scriptOffset)
  })) };
}
function nu(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = [];
  for (let a = 0; a < s; a++)
    o.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const i = e !== 0 ? Mo(t, n + e) : null, r = o.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: Mo(t, n + a.langSysOffset)
  }));
  return { defaultLangSys: i, langSysRecords: r };
}
function Mo(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.uint16(), i = t.array("uint16", o);
  return { lookupOrderOffset: e, requiredFeatureIndex: s, featureIndices: i };
}
function vr(t) {
  const { scriptRecords: n } = t, e = n.map((a) => eu(a.script)), s = 2 + n.length * 6, o = [];
  let i = s;
  for (const a of e)
    o.push(i), i += a.length;
  const r = new k(i);
  r.uint16(n.length);
  for (let a = 0; a < n.length; a++)
    r.tag(n[a].scriptTag), r.uint16(o[a]);
  for (let a = 0; a < e.length; a++)
    r.seek(o[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function eu(t) {
  const { defaultLangSys: n, langSysRecords: e } = t, s = e.map((u) => Lo(u.langSys)), o = n ? Lo(n) : null;
  let r = 4 + e.length * 6;
  const a = o ? r : 0;
  o && (r += o.length);
  const c = [];
  for (const u of s)
    c.push(r), r += u.length;
  const f = new k(r);
  f.uint16(a), f.uint16(e.length);
  for (let u = 0; u < e.length; u++)
    f.tag(e[u].langSysTag), f.uint16(c[u]);
  o && (f.seek(a), f.rawBytes(o));
  for (let u = 0; u < s.length; u++)
    f.seek(c[u]), f.rawBytes(s[u]);
  return f.toArray();
}
function Lo(t) {
  const n = 6 + t.featureIndices.length * 2, e = new k(n);
  return e.uint16(t.lookupOrderOffset), e.uint16(t.requiredFeatureIndex), e.uint16(t.featureIndices.length), e.array("uint16", t.featureIndices), e.toArray();
}
function kr(t, n) {
  t.seek(n);
  const e = t.uint16(), s = [];
  for (let i = 0; i < e; i++)
    s.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: s.map((i) => ({
    featureTag: i.featureTag,
    feature: Cr(t, n + i.featureOffset)
  })) };
}
function Cr(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.array("uint16", s);
  return { featureParamsOffset: e, lookupListIndices: o };
}
function Ar(t) {
  const { featureRecords: n } = t, e = n.map((a) => Or(a.feature)), s = 2 + n.length * 6, o = [];
  let i = s;
  for (const a of e)
    o.push(i), i += a.length;
  const r = new k(i);
  r.uint16(n.length);
  for (let a = 0; a < n.length; a++)
    r.tag(n[a].featureTag), r.uint16(o[a]);
  for (let a = 0; a < e.length; a++)
    r.seek(o[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function Or(t) {
  const n = 4 + t.lookupListIndices.length * 2, e = new k(n);
  return e.uint16(t.featureParamsOffset), e.uint16(t.lookupListIndices.length), e.array("uint16", t.lookupListIndices), e.toArray();
}
function Ir(t, n, e, s) {
  t.seek(n);
  const o = t.uint16();
  return { lookups: t.array("uint16", o).map(
    (a) => su(t, n + a, e, s)
  ) };
}
function su(t, n, e, s) {
  t.seek(n);
  const o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.array("uint16", r), c = i & 16 ? t.uint16() : void 0, f = a.map(
    (p) => e(t, n + p, o)
  );
  let u = o, l = f;
  s !== void 0 && o === s && f.length > 0 && (u = f[0].extensionLookupType, l = f.map((p) => p.subtable));
  const g = {
    lookupType: u,
    lookupFlag: i,
    subtables: l
  };
  return c !== void 0 && (g.markFilteringSet = c), g;
}
function Er(t, n, e) {
  const { lookups: s } = t, o = 8, i = s.map((p) => {
    const h = p.subtables.map(
      (d) => n(d, p.lookupType)
    );
    return { ...p, subtableBytes: h };
  }), r = (p) => {
    const { lookupType: h, lookupFlag: d, subtableBytes: x, markFilteringSet: m } = p, y = m !== void 0;
    let w = 6 + x.length * 2 + (y ? 2 : 0);
    const _ = x.map((b) => {
      const E = w;
      return w += b.length, E;
    }), v = new k(w);
    v.uint16(h), v.uint16(d), v.uint16(x.length), v.array("uint16", _), y && v.uint16(m);
    for (let b = 0; b < x.length; b++)
      v.seek(_[b]), v.rawBytes(x[b]);
    return v.toArray();
  };
  let a = i.map(r);
  const c = 2 + s.length * 2;
  if (((p) => {
    let h = c;
    for (const d of p) {
      if (h > 65535) return !0;
      h += d.length;
    }
    return !1;
  })(a) && e !== void 0) {
    const p = i.map((y) => {
      const { lookupType: S, lookupFlag: w, subtableBytes: _, markFilteringSet: v } = y, b = v !== void 0;
      let A = 6 + _.length * 2 + (b ? 2 : 0);
      const C = _.map(() => {
        const O = A;
        return A += o, O;
      }), I = new k(A);
      I.uint16(e), I.uint16(w), I.uint16(_.length), I.array("uint16", C), b && I.uint16(v);
      for (let O = 0; O < _.length; O++)
        I.seek(C[O]), I.uint16(1), I.uint16(S), I.uint32(0);
      return {
        compactBytes: I.toArray(),
        subtableOffsets: C,
        innerDataBytes: _
      };
    });
    let h = c;
    const d = p.map((y) => {
      const S = h;
      return h += y.compactBytes.length, S;
    }), x = p.map(
      (y) => y.innerDataBytes.map((S) => {
        const w = h;
        return h += S.length, w;
      })
    ), m = new k(h);
    m.uint16(s.length), m.array("uint16", d);
    for (let y = 0; y < p.length; y++)
      m.seek(d[y]), m.rawBytes(p[y].compactBytes);
    for (let y = 0; y < p.length; y++) {
      const S = p[y];
      for (let w = 0; w < S.innerDataBytes.length; w++) {
        const _ = d[y] + S.subtableOffsets[w], v = x[y][w], b = v - _;
        m.seek(_ + 4), m.uint32(b), m.seek(v), m.rawBytes(S.innerDataBytes[w]);
      }
    }
    return m.toArray();
  }
  let u = c;
  const l = a.map((p) => {
    const h = u;
    return u += p.length, h;
  }), g = new k(u);
  g.uint16(s.length), g.array("uint16", l);
  for (let p = 0; p < a.length; p++)
    g.seek(l[p]), g.rawBytes(a[p]);
  return g.toArray();
}
function Tr(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const s = t.uint16(), o = t.uint16(), i = [];
    for (let c = 0; c < o; c++)
      i.push(t.uint16());
    const r = F(t, n + s), a = i.map(
      (c) => c === 0 ? null : ou(t, n + c)
    );
    return { format: e, coverage: r, seqRuleSets: a };
  }
  if (e === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = [];
    for (let u = 0; u < i; u++)
      r.push(t.uint16());
    const a = F(t, n + s), c = It(t, n + o), f = r.map(
      (u) => u === 0 ? null : iu(t, n + u)
    );
    return { format: e, coverage: a, classDef: c, classSeqRuleSets: f };
  }
  if (e === 3) {
    const s = t.uint16(), o = t.uint16(), i = t.array("uint16", s), r = qn(t, o), a = i.map(
      (c) => F(t, n + c)
    );
    return { format: e, coverages: a, seqLookupRecords: r };
  }
  throw new Error(`Unknown SequenceContext format: ${e}`);
}
function ou(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((o) => {
    t.seek(n + o);
    const i = t.uint16(), r = t.uint16(), a = t.array("uint16", i - 1), c = qn(t, r);
    return { glyphCount: i, inputSequence: a, seqLookupRecords: c };
  });
}
function iu(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((o) => {
    t.seek(n + o);
    const i = t.uint16(), r = t.uint16(), a = t.array("uint16", i - 1), c = qn(t, r);
    return { glyphCount: i, inputSequence: a, seqLookupRecords: c };
  });
}
function qn(t, n) {
  const e = [];
  for (let s = 0; s < n; s++)
    e.push({
      sequenceIndex: t.uint16(),
      lookupListIndex: t.uint16()
    });
  return e;
}
function Dr(t) {
  if (t.format === 1) return ru(t);
  if (t.format === 2) return au(t);
  if (t.format === 3) return cu(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function ru(t) {
  const { coverage: n, seqRuleSets: e } = t, s = P(n), o = e.map(
    (u) => u === null ? null : Br(u)
  );
  let r = 6 + e.length * 2;
  const a = r;
  r += s.length;
  const c = o.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new k(r);
  f.uint16(1), f.uint16(a), f.uint16(e.length), f.array("uint16", c), f.seek(a), f.rawBytes(s);
  for (let u = 0; u < o.length; u++)
    o[u] && (f.seek(c[u]), f.rawBytes(o[u]));
  return f.toArray();
}
function au(t) {
  const { coverage: n, classDef: e, classSeqRuleSets: s } = t, o = P(n), i = Et(e), r = s.map(
    (p) => p === null ? null : Br(p)
  );
  let c = 8 + s.length * 2;
  const f = c;
  c += o.length;
  const u = c;
  c += i.length;
  const l = r.map((p) => {
    if (p === null) return 0;
    const h = c;
    return c += p.length, h;
  }), g = new k(c);
  g.uint16(2), g.uint16(f), g.uint16(u), g.uint16(s.length), g.array("uint16", l), g.seek(f), g.rawBytes(o), g.seek(u), g.rawBytes(i);
  for (let p = 0; p < r.length; p++)
    r[p] && (g.seek(l[p]), g.rawBytes(r[p]));
  return g.toArray();
}
function cu(t) {
  const { coverages: n, seqLookupRecords: e } = t, s = n.map(P);
  let i = 6 + n.length * 2 + e.length * 4;
  const r = s.map((c) => {
    const f = i;
    return i += c.length, f;
  }), a = new k(i);
  a.uint16(3), a.uint16(n.length), a.uint16(e.length), a.array("uint16", r), Be(a, e);
  for (let c = 0; c < s.length; c++)
    a.seek(r[c]), a.rawBytes(s[c]);
  return a.toArray();
}
function Br(t) {
  const n = t.map(fu);
  let s = 2 + t.length * 2;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < n.length; r++)
    i.seek(o[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function fu(t) {
  const { glyphCount: n, inputSequence: e, seqLookupRecords: s } = t, o = 4 + (n - 1) * 2 + s.length * 4, i = new k(o);
  return i.uint16(n), i.uint16(s.length), i.array("uint16", e), Be(i, s), i.toArray();
}
function Be(t, n) {
  for (const e of n)
    t.uint16(e.sequenceIndex), t.uint16(e.lookupListIndex);
}
function Mr(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const s = t.uint16(), o = t.uint16(), i = [];
    for (let c = 0; c < o; c++)
      i.push(t.uint16());
    const r = F(t, n + s), a = i.map(
      (c) => c === 0 ? null : uu(t, n + c)
    );
    return { format: e, coverage: r, chainedSeqRuleSets: a };
  }
  if (e === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = [];
    for (let h = 0; h < a; h++)
      c.push(t.uint16());
    const f = F(t, n + s), u = It(
      t,
      n + o
    ), l = It(
      t,
      n + i
    ), g = It(
      t,
      n + r
    ), p = c.map(
      (h) => h === 0 ? null : lu(t, n + h)
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
    const s = t.uint16(), o = t.array(
      "uint16",
      s
    ), i = t.uint16(), r = t.array("uint16", i), a = t.uint16(), c = t.array(
      "uint16",
      a
    ), f = t.uint16(), u = qn(t, f), l = o.map(
      (h) => F(t, n + h)
    ), g = r.map(
      (h) => F(t, n + h)
    ), p = c.map(
      (h) => F(t, n + h)
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
function uu(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((o) => Lr(t, n + o));
}
function Lr(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.array("uint16", e), o = t.uint16(), i = t.array("uint16", o - 1), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = qn(t, c);
  return {
    backtrackSequence: s,
    inputGlyphCount: o,
    inputSequence: i,
    lookaheadSequence: a,
    seqLookupRecords: f
  };
}
function lu(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((o) => Lr(t, n + o));
}
function Rr(t) {
  if (t.format === 1) return hu(t);
  if (t.format === 2) return gu(t);
  if (t.format === 3) return pu(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function hu(t) {
  const { coverage: n, chainedSeqRuleSets: e } = t, s = P(n), o = e.map(
    (u) => u === null ? null : zr(u)
  );
  let r = 6 + e.length * 2;
  const a = r;
  r += s.length;
  const c = o.map((u) => {
    if (u === null) return 0;
    const l = r;
    return r += u.length, l;
  }), f = new k(r);
  f.uint16(1), f.uint16(a), f.uint16(e.length), f.array("uint16", c), f.seek(a), f.rawBytes(s);
  for (let u = 0; u < o.length; u++)
    o[u] && (f.seek(c[u]), f.rawBytes(o[u]));
  return f.toArray();
}
function gu(t) {
  const {
    coverage: n,
    backtrackClassDef: e,
    inputClassDef: s,
    lookaheadClassDef: o,
    chainedClassSeqRuleSets: i
  } = t, r = P(n), a = Et(e), c = Et(s), f = Et(o), u = i.map(
    (S) => S === null ? null : zr(S)
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
  const m = u.map((S) => {
    if (S === null) return 0;
    const w = g;
    return g += S.length, w;
  }), y = new k(g);
  y.uint16(2), y.uint16(p), y.uint16(h), y.uint16(d), y.uint16(x), y.uint16(i.length), y.array("uint16", m), y.seek(p), y.rawBytes(r), y.seek(h), y.rawBytes(a), y.seek(d), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let S = 0; S < u.length; S++)
    u[S] && (y.seek(m[S]), y.rawBytes(u[S]));
  return y.toArray();
}
function pu(t) {
  const {
    backtrackCoverages: n,
    inputCoverages: e,
    lookaheadCoverages: s,
    seqLookupRecords: o
  } = t, i = n.map(P), r = e.map(P), a = s.map(P);
  let f = 4 + n.length * 2 + 2 + e.length * 2 + 2 + s.length * 2 + 2 + o.length * 4;
  const u = i.map((h) => {
    const d = f;
    return f += h.length, d;
  }), l = r.map((h) => {
    const d = f;
    return f += h.length, d;
  }), g = a.map((h) => {
    const d = f;
    return f += h.length, d;
  }), p = new k(f);
  p.uint16(3), p.uint16(n.length), p.array("uint16", u), p.uint16(e.length), p.array("uint16", l), p.uint16(s.length), p.array("uint16", g), p.uint16(o.length), Be(p, o);
  for (let h = 0; h < i.length; h++)
    p.seek(u[h]), p.rawBytes(i[h]);
  for (let h = 0; h < r.length; h++)
    p.seek(l[h]), p.rawBytes(r[h]);
  for (let h = 0; h < a.length; h++)
    p.seek(g[h]), p.rawBytes(a[h]);
  return p.toArray();
}
function zr(t) {
  const n = t.map(du);
  let s = 2 + t.length * 2;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < n.length; r++)
    i.seek(o[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function du(t) {
  const {
    backtrackSequence: n,
    inputGlyphCount: e,
    inputSequence: s,
    lookaheadSequence: o,
    seqLookupRecords: i
  } = t, r = 2 + n.length * 2 + 2 + s.length * 2 + 2 + o.length * 2 + 2 + i.length * 4, a = new k(r);
  return a.uint16(n.length), a.array("uint16", n), a.uint16(e), a.array("uint16", s), a.uint16(o.length), a.array("uint16", o), a.uint16(i.length), Be(a, i), a.toArray();
}
function Fr(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.uint32(), i = [];
  for (let a = 0; a < o; a++)
    i.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const r = i.map((a) => {
    const c = a.conditionSetOffset !== 0 ? mu(t, n + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? yu(
      t,
      n + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: e, minorVersion: s, featureVariationRecords: r };
}
function mu(t, n) {
  t.seek(n);
  const e = t.uint16(), s = [];
  for (let i = 0; i < e; i++)
    s.push(t.uint32());
  return { conditions: s.map((i) => {
    t.seek(n + i);
    const r = t.uint16();
    if (r === 1) {
      const a = t.uint16(), c = t.int16(), f = t.int16();
      return { format: r, axisIndex: a, filterRangeMinValue: c, filterRangeMaxValue: f };
    }
    return { format: r, _raw: !0 };
  }) };
}
function yu(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++) {
    const a = t.uint16(), c = t.uint32(), f = Cr(t, n + c);
    i.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: e, minorVersion: s, substitutions: i };
}
function Vr(t) {
  const { majorVersion: n, minorVersion: e, featureVariationRecords: s } = t, o = s.map((f) => ({
    csBytes: f.conditionSet ? xu(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? _u(f.featureTableSubstitution) : null
  }));
  let r = 8 + s.length * 8;
  const a = o.map((f) => {
    const u = f.csBytes ? r : 0;
    f.csBytes && (r += f.csBytes.length);
    const l = f.ftsBytes ? r : 0;
    return f.ftsBytes && (r += f.ftsBytes.length), { csOff: u, ftsOff: l };
  }), c = new k(r);
  c.uint16(n), c.uint16(e), c.uint32(s.length);
  for (const f of a)
    c.uint32(f.csOff), c.uint32(f.ftsOff);
  for (let f = 0; f < o.length; f++) {
    const u = o[f];
    u.csBytes && (c.seek(a[f].csOff), c.rawBytes(u.csBytes)), u.ftsBytes && (c.seek(a[f].ftsOff), c.rawBytes(u.ftsBytes));
  }
  return c.toArray();
}
function xu(t) {
  const n = t.conditions.map(wu);
  let s = 2 + t.conditions.length * 4;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.conditions.length);
  for (const r of o) i.uint32(r);
  for (let r = 0; r < n.length; r++)
    i.seek(o[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function wu(t) {
  if (t.format === 1) {
    const n = new k(8);
    return n.uint16(1), n.uint16(t.axisIndex), n.int16(t.filterRangeMinValue), n.int16(t.filterRangeMaxValue), n.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function _u(t) {
  const n = t.substitutions.map(
    (r) => Or(r.feature)
  );
  let s = 6 + t.substitutions.length * 6;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.majorVersion), i.uint16(t.minorVersion), i.uint16(t.substitutions.length);
  for (let r = 0; r < t.substitutions.length; r++)
    i.uint16(t.substitutions[r].featureIndex), i.uint32(o[r]);
  for (let r = 0; r < n.length; r++)
    i.seek(o[r]), i.rawBytes(n[r]);
  return i.toArray();
}
const Su = 8, bu = 12;
function vu(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.offset16(), i = n.offset16(), r = e > 1 || e === 1 && s >= 1 ? n.offset32() : 0, a = [o, i, r].filter(
    (c) => c > 0
  );
  return {
    majorVersion: e,
    minorVersion: s,
    horizAxis: o ? Ro(t, o) : null,
    vertAxis: i ? Ro(t, i) : null,
    itemVariationStore: r ? ln(
      t.slice(
        r,
        ku(t.length, r, a)
      )
    ) : null
  };
}
function ku(t, n, e) {
  return e.filter((o) => o > n).sort((o, i) => o - i)[0] ?? t;
}
function Ro(t, n) {
  if (n + 4 > t.length) return null;
  const e = new B(t);
  e.seek(n);
  const s = e.offset16(), o = e.offset16(), i = s ? Cu(e, n + s) : null, r = o ? Au(e, n + o) : [];
  return { baseTagList: i, baseScriptList: r };
}
function Cu(t, n) {
  t.seek(n);
  const e = t.uint16(), s = [];
  for (let o = 0; o < e; o++)
    s.push(t.tag());
  return s;
}
function Au(t, n) {
  t.seek(n);
  const e = t.uint16(), s = [];
  for (let o = 0; o < e; o++)
    s.push({ tag: t.tag(), off: t.offset16() });
  return s.map((o) => ({
    tag: o.tag,
    ...Ou(t, n + o.off)
  }));
}
function Ou(t, n) {
  t.seek(n);
  const e = t.offset16(), s = t.offset16(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++)
    i.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: e ? Iu(t, n + e) : null,
    defaultMinMax: s ? zo(t, n + s) : null,
    langSystems: i.map((r) => ({
      tag: r.tag,
      minMax: zo(t, n + r.off)
    }))
  };
}
function Iu(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = [];
  for (let i = 0; i < s; i++)
    o.push(t.offset16());
  return {
    defaultBaselineIndex: e,
    baseCoords: o.map(
      (i) => i ? vn(t, n + i) : null
    )
  };
}
function zo(t, n) {
  t.seek(n);
  const e = t.offset16(), s = t.offset16(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++)
    i.push({
      tag: t.tag(),
      minOff: t.offset16(),
      maxOff: t.offset16()
    });
  return {
    minCoord: e ? vn(t, n + e) : null,
    maxCoord: s ? vn(t, n + s) : null,
    featMinMax: i.map((r) => ({
      tag: r.tag,
      minCoord: r.minOff ? vn(t, n + r.minOff) : null,
      maxCoord: r.maxOff ? vn(t, n + r.maxOff) : null
    }))
  };
}
function vn(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.int16();
  if (e === 1) return { format: e, coordinate: s };
  if (e === 2)
    return {
      format: e,
      coordinate: s,
      referenceGlyph: t.uint16(),
      baseCoordPoint: t.uint16()
    };
  if (e === 3) {
    const o = t.offset16();
    return {
      format: e,
      coordinate: s,
      device: o ? hn(t, n + o) : null
    };
  }
  return { format: e, coordinate: s };
}
function Eu(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = n > 1 || n === 1 && e >= 1, o = Fo(t.horizAxis), i = Fo(t.vertAxis), r = s && t.itemVariationStore ? Wn(t.itemVariationStore) : [];
  let c = s ? bu : Su;
  const f = o.length ? c : 0;
  c += o.length;
  const u = i.length ? c : 0;
  c += i.length;
  const l = r.length ? c : 0;
  c += r.length;
  const g = new k(c);
  return g.uint16(n), g.uint16(e), g.offset16(f), g.offset16(u), s && g.offset32(l), g.rawBytes(o), g.rawBytes(i), g.rawBytes(r), g.toArray();
}
function Fo(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const n = t.baseTagList ? Tu(t.baseTagList) : [], e = Du(t.baseScriptList ?? []);
  let o = 4;
  const i = n.length ? o : 0;
  o += n.length;
  const r = e.length ? o : 0;
  o += e.length;
  const a = new k(o);
  return a.offset16(i), a.offset16(r), a.rawBytes(n), a.rawBytes(e), a.toArray();
}
function Tu(t) {
  const n = 2 + 4 * t.length, e = new k(n);
  e.uint16(t.length);
  for (const s of t)
    e.tag(s);
  return e.toArray();
}
function Du(t) {
  const n = 2 + 6 * t.length, e = t.map((r) => Bu(r));
  let s = n;
  const o = e.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    i.tag(t[r].tag), i.offset16(o[r]);
  for (const r of e)
    i.rawBytes(r);
  return i.toArray();
}
function Bu(t) {
  const n = Mu(t.baseValues), e = Vo(t.defaultMinMax), s = t.langSystems ?? [], o = s.map((l) => Vo(l.minMax));
  let r = 6 + 6 * s.length;
  const a = n.length ? r : 0;
  r += n.length;
  const c = e.length ? r : 0;
  r += e.length;
  const f = o.map((l) => {
    const g = l.length ? r : 0;
    return r += l.length, g;
  }), u = new k(r);
  u.offset16(a), u.offset16(c), u.uint16(s.length);
  for (let l = 0; l < s.length; l++)
    u.tag(s[l].tag), u.offset16(f[l]);
  u.rawBytes(n), u.rawBytes(e);
  for (const l of o)
    u.rawBytes(l);
  return u.toArray();
}
function Mu(t) {
  if (!t) return [];
  const n = t.baseCoords ?? [], e = 4 + 2 * n.length, s = n.map((a) => kn(a));
  let o = e;
  const i = s.map((a) => {
    const c = a.length ? o : 0;
    return o += a.length, c;
  }), r = new k(o);
  r.uint16(t.defaultBaselineIndex ?? 0), r.uint16(n.length);
  for (const a of i)
    r.offset16(a);
  for (const a of s)
    r.rawBytes(a);
  return r.toArray();
}
function Vo(t) {
  if (!t) return [];
  const n = t.featMinMax ?? [], e = 6 + 8 * n.length, s = kn(t.minCoord), o = kn(t.maxCoord), i = n.map((l) => ({
    tag: l.tag,
    min: kn(l.minCoord),
    max: kn(l.maxCoord)
  }));
  let r = e;
  const a = s.length ? r : 0;
  r += s.length;
  const c = o.length ? r : 0;
  r += o.length;
  const f = i.map((l) => {
    const g = l.min.length ? r : 0;
    r += l.min.length;
    const p = l.max.length ? r : 0;
    return r += l.max.length, { minOff: g, maxOff: p };
  }), u = new k(r);
  u.offset16(a), u.offset16(c), u.uint16(n.length);
  for (let l = 0; l < n.length; l++)
    u.tag(n[l].tag), u.offset16(f[l].minOff), u.offset16(f[l].maxOff);
  u.rawBytes(s), u.rawBytes(o);
  for (const l of i)
    u.rawBytes(l.min), u.rawBytes(l.max);
  return u.toArray();
}
function kn(t) {
  if (!t) return [];
  if (t.format === 1) {
    const n = new k(4);
    return n.uint16(1), n.int16(t.coordinate), n.toArray();
  }
  if (t.format === 2) {
    const n = new k(8);
    return n.uint16(2), n.int16(t.coordinate), n.uint16(t.referenceGlyph ?? 0), n.uint16(t.baseCoordPoint ?? 0), n.toArray();
  }
  if (t.format === 3) {
    const n = t.device ? me(t.device) : [], e = n.length ? 6 : 0, s = new k(6 + n.length);
    return s.uint16(3), s.int16(t.coordinate), s.offset16(e), s.rawBytes(n), s.toArray();
  }
  return [];
}
const In = 5, Gt = 8;
function te(t) {
  return {
    height: t.uint8(),
    width: t.uint8(),
    bearingX: t.int8(),
    bearingY: t.int8(),
    advance: t.uint8()
  };
}
function qe(t, n) {
  t.uint8(n.height ?? 0), t.uint8(n.width ?? 0), t.int8(n.bearingX ?? 0), t.int8(n.bearingY ?? 0), t.uint8(n.advance ?? 0);
}
function Qt(t) {
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
function En(t, n) {
  t.uint8(n.height ?? 0), t.uint8(n.width ?? 0), t.int8(n.horiBearingX ?? 0), t.int8(n.horiBearingY ?? 0), t.uint8(n.horiAdvance ?? 0), t.int8(n.vertBearingX ?? 0), t.int8(n.vertBearingY ?? 0), t.uint8(n.vertAdvance ?? 0);
}
function Ks(t, n) {
  const e = new B(t), s = e.uint32(), o = n?.CBLC;
  if (!o?.sizes)
    return { version: s, data: Array.from(t.slice(4)) };
  const i = [];
  for (const r of o.sizes) {
    const a = [];
    for (const c of r.indexSubTables ?? [])
      a.push(Lu(t, e, c));
    i.push(a);
  }
  return { version: s, bitmapData: i };
}
function Js(t) {
  const n = t.version ?? 196608;
  if (t.data) {
    const s = t.data, o = new k(4 + s.length);
    return o.uint32(n), o.rawBytes(s), o.toArray();
  }
  const e = new k(4);
  return e.uint32(n), e.toArray();
}
function Ye(t, n) {
  const e = t.version ?? 196608, s = t.bitmapData ?? [], o = n.sizes ?? [], i = [], r = [];
  let a = 4;
  for (let u = 0; u < o.length; u++) {
    const l = o[u].indexSubTables ?? [], g = s[u] ?? [], p = [];
    for (let h = 0; h < l.length; h++) {
      const d = l[h], x = g[h] ?? [], { bytes: m, info: y } = Ru(
        x,
        d,
        a
      );
      p.push(y), i.push(m), a += m.length;
    }
    r.push(p);
  }
  const c = a, f = new k(c);
  f.uint32(e);
  for (const u of i)
    f.rawBytes(u);
  return { bytes: f.toArray(), offsetInfo: r };
}
function Lu(t, n, e) {
  const { indexFormat: s, imageFormat: o, imageDataOffset: i } = e, r = [];
  switch (s) {
    case 1:
    case 3: {
      const a = e.sbitOffsets;
      for (let c = 0; c < a.length - 1; c++) {
        const f = i + a[c], l = i + a[c + 1] - f;
        l <= 0 ? r.push(null) : r.push(
          ne(
            t,
            n,
            f,
            o,
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
          ne(
            t,
            n,
            u,
            o,
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
          ne(
            t,
            n,
            f,
            o,
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
          ne(
            t,
            n,
            u,
            o,
            c
          )
        );
      }
      break;
    }
  }
  return r;
}
function ne(t, n, e, s, o) {
  if (o <= 0) return null;
  n.seek(e);
  const i = (r, a) => t.slice(r, r + a);
  switch (s) {
    case 1: {
      const r = te(n), a = i(
        n.position,
        o - In
      );
      return { smallMetrics: r, imageData: a };
    }
    case 2: {
      const r = te(n), a = i(
        n.position,
        o - In
      );
      return { smallMetrics: r, imageData: a };
    }
    case 5:
      return { imageData: i(e, o) };
    case 6: {
      const r = Qt(n), a = i(
        n.position,
        o - Gt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 7: {
      const r = Qt(n), a = i(
        n.position,
        o - Gt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 8: {
      const r = te(n);
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
      const r = Qt(n), a = n.uint16(), c = [];
      for (let f = 0; f < a; f++)
        c.push({
          glyphID: n.uint16(),
          xOffset: n.int8(),
          yOffset: n.int8()
        });
      return { bigMetrics: r, components: c };
    }
    case 17: {
      const r = te(n), a = n.uint32(), c = i(n.position, a);
      return { smallMetrics: r, imageData: c };
    }
    case 18: {
      const r = Qt(n), a = n.uint32(), c = i(n.position, a);
      return { bigMetrics: r, imageData: c };
    }
    case 19: {
      const r = n.uint32();
      return { imageData: i(n.position, r) };
    }
    default:
      return { imageData: i(e, o) };
  }
}
function Ru(t, n, e) {
  const { indexFormat: s, imageFormat: o } = n, i = { imageDataOffset: e }, r = t.map(
    (f) => f ? zu(f, o) : []
  );
  switch (s) {
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
  const a = r.reduce((f, u) => f + u.length, 0), c = new k(a);
  for (const f of r)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: i };
}
function zu(t, n) {
  switch (n) {
    case 1:
    case 2: {
      const e = t.imageData ?? [], s = new k(In + e.length);
      return qe(s, t.smallMetrics ?? {}), s.rawBytes(e), s.toArray();
    }
    case 5: {
      const e = t.imageData ?? [];
      return Array.from(e);
    }
    case 6:
    case 7: {
      const e = t.imageData ?? [], s = new k(Gt + e.length);
      return En(s, t.bigMetrics ?? {}), s.rawBytes(e), s.toArray();
    }
    case 8: {
      const e = t.components ?? [], s = new k(
        In + 1 + 2 + e.length * 4
      );
      qe(s, t.smallMetrics ?? {}), s.uint8(0), s.uint16(e.length);
      for (const o of e)
        s.uint16(o.glyphID ?? 0), s.int8(o.xOffset ?? 0), s.int8(o.yOffset ?? 0);
      return s.toArray();
    }
    case 9: {
      const e = t.components ?? [], s = new k(
        Gt + 2 + e.length * 4
      );
      En(s, t.bigMetrics ?? {}), s.uint16(e.length);
      for (const o of e)
        s.uint16(o.glyphID ?? 0), s.int8(o.xOffset ?? 0), s.int8(o.yOffset ?? 0);
      return s.toArray();
    }
    case 17: {
      const e = t.imageData ?? [], s = new k(In + 4 + e.length);
      return qe(s, t.smallMetrics ?? {}), s.uint32(e.length), s.rawBytes(e), s.toArray();
    }
    case 18: {
      const e = t.imageData ?? [], s = new k(Gt + 4 + e.length);
      return En(s, t.bigMetrics ?? {}), s.uint32(e.length), s.rawBytes(e), s.toArray();
    }
    case 19: {
      const e = t.imageData ?? [], s = new k(4 + e.length);
      return s.uint32(e.length), s.rawBytes(e), s.toArray();
    }
    default:
      return Array.from(t.imageData ?? []);
  }
}
function Fu(t, n) {
  return Ks(t, n?.bloc ? { CBLC: n.bloc } : n);
}
function Vu(t) {
  return Js(t);
}
const Pr = 48;
function Qs(t) {
  return Pu(t);
}
function rn(t, n) {
  return n ? Gu(t, n) : Hu(t);
}
function Pu(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint32(), i = [], r = [];
  for (let a = 0; a < o; a++) {
    const c = n.uint32();
    n.uint32();
    const f = n.uint32(), u = n.uint32(), l = Po(n), g = Po(n), p = n.uint16(), h = n.uint16(), d = n.uint8(), x = n.uint8(), m = n.uint8(), y = n.int8();
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
  for (let a = 0; a < o; a++) {
    const { indexSubTableArrayOffset: c, numberOfIndexSubTables: f } = r[a];
    f !== 0 && (i[a].indexSubTables = Uu(
      n,
      c,
      f
    ));
  }
  return { majorVersion: e, minorVersion: s, sizes: i };
}
function Uu(t, n, e) {
  t.seek(n);
  const s = [];
  for (let i = 0; i < e; i++)
    s.push({
      firstGlyphIndex: t.uint16(),
      lastGlyphIndex: t.uint16(),
      indexSubtableOffset: t.uint32()
    });
  const o = [];
  for (const i of s) {
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
        u.imageSize = t.uint32(), u.bigMetrics = Qt(t);
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
        u.imageSize = t.uint32(), u.bigMetrics = Qt(t);
        const g = t.uint32();
        u.glyphIdArray = t.array("uint16", g);
        break;
      }
    }
    o.push(u);
  }
  return o;
}
function Gu(t, n) {
  const e = t.majorVersion ?? 2, s = t.minorVersion ?? 0, o = t.sizes ?? [], i = o.map(
    (u, l) => Nu(u.indexSubTables ?? [], n[l] ?? [])
  );
  let a = 8 + o.length * Pr;
  const c = [];
  for (const u of i)
    c.push(a), a += u.length;
  const f = new k(a);
  f.uint16(e), f.uint16(s), f.uint32(o.length);
  for (let u = 0; u < o.length; u++) {
    const l = o[u], g = l.indexSubTables ?? [];
    f.uint32(c[u]), f.uint32(i[u].length), f.uint32(g.length), f.uint32(l.colorRef ?? 0), ye(f, l.hori ?? {}), ye(f, l.vert ?? {}), f.uint16(l.startGlyphIndex ?? 0), f.uint16(l.endGlyphIndex ?? 0), f.uint8(l.ppemX ?? 0), f.uint8(l.ppemY ?? 0), f.uint8(l.bitDepth ?? 0), f.int8(l.flags ?? 0);
  }
  for (const u of i)
    f.rawBytes(u);
  return f.toArray();
}
function Nu(t, n) {
  const e = t.map(
    (a, c) => $u(a, n[c] ?? {})
  );
  let o = t.length * 8;
  const i = [];
  for (const a of e)
    i.push(o), o += a.length;
  const r = new k(o);
  for (let a = 0; a < t.length; a++)
    r.uint16(t[a].firstGlyphIndex), r.uint16(t[a].lastGlyphIndex), r.uint32(i[a]);
  for (const a of e)
    r.rawBytes(a);
  return r.toArray();
}
function $u(t, n) {
  const e = t.indexFormat, s = t.imageFormat, o = n.imageDataOffset ?? 0, i = 8;
  switch (e) {
    case 1: {
      const r = n.sbitOffsets ?? [], a = new k(i + r.length * 4);
      a.uint16(e), a.uint16(s), a.uint32(o);
      for (const c of r) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const r = new k(i + 4 + Gt);
      return r.uint16(e), r.uint16(s), r.uint32(o), r.uint32(t.imageSize ?? n.imageSize ?? 0), En(r, t.bigMetrics ?? {}), r.toArray();
    }
    case 3: {
      const r = n.sbitOffsets ?? [];
      let a = i + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new k(a);
      c.uint16(e), c.uint16(s), c.uint32(o);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    case 4: {
      const r = n.glyphArray ?? [], a = r.length > 0 ? r.length - 1 : 0, c = new k(i + 4 + r.length * 4);
      c.uint16(e), c.uint16(s), c.uint32(o), c.uint32(a);
      for (const f of r)
        c.uint16(f.glyphID), c.uint16(f.sbitOffset);
      return c.toArray();
    }
    case 5: {
      const r = t.glyphIdArray ?? [];
      let a = i + 4 + Gt + 4 + r.length * 2;
      r.length % 2 !== 0 && (a += 2);
      const c = new k(a);
      c.uint16(e), c.uint16(s), c.uint32(o), c.uint32(t.imageSize ?? n.imageSize ?? 0), En(c, t.bigMetrics ?? {}), c.uint32(r.length);
      for (const f of r) c.uint16(f);
      return c.toArray();
    }
    default:
      throw new Error(`Unsupported index format: ${e}`);
  }
}
function Hu(t) {
  const n = t.majorVersion ?? 2, e = t.minorVersion ?? 0, s = t.sizes ?? [], o = t.data ?? [], i = 8 + s.length * Pr + o.length, r = new k(i);
  r.uint16(n), r.uint16(e), r.uint32(s.length);
  for (const a of s)
    r.uint32(a.indexSubTableArrayOffset ?? 0), r.uint32(a.indexTablesSize ?? 0), r.uint32(a.numberOfIndexSubTables ?? 0), r.uint32(a.colorRef ?? 0), ye(r, a.hori ?? {}), ye(r, a.vert ?? {}), r.uint16(a.startGlyphIndex ?? 0), r.uint16(a.endGlyphIndex ?? 0), r.uint8(a.ppemX ?? 0), r.uint8(a.ppemY ?? 0), r.uint8(a.bitDepth ?? 0), r.int8(a.flags ?? 0);
  return r.rawBytes(o), r.toArray();
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
function ye(t, n) {
  t.int8(n.ascender ?? 0), t.int8(n.descender ?? 0), t.uint8(n.widthMax ?? 0), t.int8(n.caretSlopeNumerator ?? 0), t.int8(n.caretSlopeDenominator ?? 0), t.int8(n.caretOffset ?? 0), t.int8(n.minOriginSB ?? 0), t.int8(n.minAdvanceSB ?? 0), t.int8(n.maxBeforeBL ?? 0), t.int8(n.minAfterBL ?? 0), t.int8(n.pad1 ?? 0), t.int8(n.pad2 ?? 0);
}
function Zu(t) {
  return Qs(t);
}
function ju(t) {
  return rn(t);
}
function Wu(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = [], i = /* @__PURE__ */ new Set();
  for (let u = 0; u < s; u++) {
    const l = n.uint16(), g = n.uint16(), p = n.offset32();
    i.add(p), o.push({ platformID: l, encodingID: g, subtableOffset: p });
  }
  const r = [...i].sort((u, l) => u - l), a = r.map((u) => qu(n, u)), c = new Map(r.map((u, l) => [u, l])), f = o.map((u) => ({
    platformID: u.platformID,
    encodingID: u.encodingID,
    subtableIndex: c.get(u.subtableOffset)
  }));
  return { version: e, encodingRecords: f, subtables: a };
}
function qu(t, n) {
  t.seek(n);
  const e = t.uint16();
  switch (e) {
    case 0:
      return Yu(t);
    case 2:
      return Xu(t, n);
    case 4:
      return Ku(t, n);
    case 6:
      return Ju(t);
    case 8:
      return ol(t);
    case 10:
      return il(t);
    case 12:
      return Qu(t);
    case 13:
      return tl(t);
    case 14:
      return nl(t, n);
    default:
      return rl(t, n, e);
  }
}
function Yu(t) {
  t.skip(2);
  const n = t.uint16(), e = t.array("uint8", 256);
  return { format: 0, language: n, glyphIdArray: e };
}
function Xu(t, n) {
  const e = t.uint16(), s = t.uint16(), o = t.array("uint16", 256);
  let i = 0;
  for (let g = 0; g < 256; g++)
    o[g] > i && (i = o[g]);
  const r = i / 8 + 1, a = [];
  for (let g = 0; g < r; g++)
    a.push({
      firstCode: t.uint16(),
      entryCount: t.uint16(),
      idDelta: t.int16(),
      idRangeOffset: t.uint16()
    });
  const c = t.position, u = (n + e - c) / 2, l = t.array("uint16", u);
  return { format: 2, language: s, subHeaderKeys: o, subHeaders: a, glyphIdArray: l };
}
function Ku(t, n) {
  const e = t.uint16(), s = t.uint16(), i = t.uint16() / 2;
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
  return { format: 4, language: s, segments: p, glyphIdArray: g };
}
function Ju(t) {
  t.skip(2);
  const n = t.uint16(), e = t.uint16(), s = t.uint16(), o = t.array("uint16", s);
  return { format: 6, language: n, firstCode: e, glyphIdArray: o };
}
function Qu(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), s = [];
  for (let o = 0; o < e; o++)
    s.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 12, language: n, groups: s };
}
function tl(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), s = [];
  for (let o = 0; o < e; o++)
    s.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      glyphID: t.uint32()
    });
  return { format: 13, language: n, groups: s };
}
function nl(t, n) {
  t.skip(4);
  const e = t.uint32(), s = [];
  for (let o = 0; o < e; o++) {
    const i = t.uint24(), r = t.offset32(), a = t.offset32();
    let c = null;
    if (r !== 0) {
      const u = t.position;
      c = el(t, n + r), t.seek(u);
    }
    let f = null;
    if (a !== 0) {
      const u = t.position;
      f = sl(
        t,
        n + a
      ), t.seek(u);
    }
    s.push({ varSelector: i, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: s };
}
function el(t, n) {
  t.seek(n);
  const e = t.uint32(), s = [];
  for (let o = 0; o < e; o++)
    s.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return s;
}
function sl(t, n) {
  t.seek(n);
  const e = t.uint32(), s = [];
  for (let o = 0; o < e; o++)
    s.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return s;
}
function ol(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.bytes(8192), s = t.uint32(), o = [];
  for (let i = 0; i < s; i++)
    o.push({
      startCharCode: t.uint32(),
      endCharCode: t.uint32(),
      startGlyphID: t.uint32()
    });
  return { format: 8, language: n, is32: e, groups: o };
}
function il(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), s = t.uint32(), o = t.array("uint16", s);
  return { format: 10, language: n, startCharCode: e, glyphIdArray: o };
}
function rl(t, n, e) {
  let s;
  e >= 8 ? (t.skip(2), s = t.uint32()) : s = t.uint16(), t.seek(n);
  const o = t.bytes(s);
  return { format: e, _raw: o };
}
function al(t) {
  const { version: n, encodingRecords: e, subtables: s } = t, o = s.map(cl), i = 4 + e.length * 8, r = [];
  let a = i;
  for (const u of o)
    r.push(a), a += u.length;
  const c = a, f = new k(c);
  f.uint16(n), f.uint16(e.length);
  for (const u of e)
    f.uint16(u.platformID), f.uint16(u.encodingID), f.offset32(r[u.subtableIndex]);
  for (let u = 0; u < o.length; u++)
    f.seek(r[u]), f.rawBytes(o[u]);
  return f.toArray();
}
function cl(t) {
  switch (t.format) {
    case 0:
      return fl(t);
    case 2:
      return ul(t);
    case 4:
      return ll(t);
    case 6:
      return hl(t);
    case 8:
      return gl(t);
    case 10:
      return pl(t);
    case 12:
      return dl(t);
    case 13:
      return ml(t);
    case 14:
      return yl(t);
    default:
      return t._raw;
  }
}
function fl(t) {
  const e = new k(262);
  return e.uint16(0), e.uint16(262), e.uint16(t.language), e.array("uint8", t.glyphIdArray), e.toArray();
}
function ul(t) {
  const { language: n, subHeaderKeys: e, subHeaders: s, glyphIdArray: o } = t, i = 518 + s.length * 8 + o.length * 2, r = new k(i);
  r.uint16(2), r.uint16(i), r.uint16(n), r.array("uint16", e);
  for (const a of s)
    r.uint16(a.firstCode), r.uint16(a.entryCount), r.int16(a.idDelta), r.uint16(a.idRangeOffset);
  return r.array("uint16", o), r.toArray();
}
function ll(t) {
  const { language: n, segments: e, glyphIdArray: s } = t, o = e.length, i = o * 2, r = Math.floor(Math.log2(o)), a = Math.pow(2, r) * 2, c = i - a, f = 14 + o * 8 + 2 + s.length * 2, u = new k(f);
  u.uint16(4), u.uint16(f), u.uint16(n), u.uint16(i), u.uint16(a), u.uint16(r), u.uint16(c);
  for (const l of e) u.uint16(l.endCode);
  u.uint16(0);
  for (const l of e) u.uint16(l.startCode);
  for (const l of e) u.int16(l.idDelta);
  for (const l of e) u.uint16(l.idRangeOffset);
  return u.array("uint16", s), u.toArray();
}
function hl(t) {
  const { language: n, firstCode: e, glyphIdArray: s } = t, o = s.length, i = 10 + o * 2, r = new k(i);
  return r.uint16(6), r.uint16(i), r.uint16(n), r.uint16(e), r.uint16(o), r.array("uint16", s), r.toArray();
}
function gl(t) {
  const { language: n, is32: e, groups: s } = t, o = 8208 + s.length * 12, i = new k(o);
  i.uint16(8), i.uint16(0), i.uint32(o), i.uint32(n), i.rawBytes(e), i.uint32(s.length);
  for (const r of s)
    i.uint32(r.startCharCode), i.uint32(r.endCharCode), i.uint32(r.startGlyphID);
  return i.toArray();
}
function pl(t) {
  const { language: n, startCharCode: e, glyphIdArray: s } = t, o = 20 + s.length * 2, i = new k(o);
  return i.uint16(10), i.uint16(0), i.uint32(o), i.uint32(n), i.uint32(e), i.uint32(s.length), i.array("uint16", s), i.toArray();
}
function dl(t) {
  const n = t.groups.length, e = 16 + n * 12, s = new k(e);
  s.uint16(12), s.uint16(0), s.uint32(e), s.uint32(t.language), s.uint32(n);
  for (const o of t.groups)
    s.uint32(o.startCharCode), s.uint32(o.endCharCode), s.uint32(o.startGlyphID);
  return s.toArray();
}
function ml(t) {
  const n = t.groups.length, e = 16 + n * 12, s = new k(e);
  s.uint16(13), s.uint16(0), s.uint32(e), s.uint32(t.language), s.uint32(n);
  for (const o of t.groups)
    s.uint32(o.startCharCode), s.uint32(o.endCharCode), s.uint32(o.glyphID);
  return s.toArray();
}
function yl(t) {
  const { varSelectorRecords: n } = t, e = n.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? xl(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? wl(c.nonDefaultUVS) : null
  }));
  let o = 10 + n.length * 11;
  const i = e.map((c) => {
    let f = 0;
    c.defaultUVSBytes && (f = o, o += c.defaultUVSBytes.length);
    let u = 0;
    return c.nonDefaultUVSBytes && (u = o, o += c.nonDefaultUVSBytes.length), { defaultUVSOffset: f, nonDefaultUVSOffset: u };
  }), r = o, a = new k(r);
  a.uint16(14), a.uint32(r), a.uint32(n.length);
  for (let c = 0; c < n.length; c++)
    a.uint24(n[c].varSelector), a.uint32(i[c].defaultUVSOffset), a.uint32(i[c].nonDefaultUVSOffset);
  for (let c = 0; c < e.length; c++)
    e[c].defaultUVSBytes && a.rawBytes(e[c].defaultUVSBytes), e[c].nonDefaultUVSBytes && a.rawBytes(e[c].nonDefaultUVSBytes);
  return a.toArray();
}
function xl(t) {
  const n = 4 + t.length * 4, e = new k(n);
  e.uint32(t.length);
  for (const s of t)
    e.uint24(s.startUnicodeValue), e.uint8(s.additionalCount);
  return e.toArray();
}
function wl(t) {
  const n = 4 + t.length * 5, e = new k(n);
  e.uint32(t.length);
  for (const s of t)
    e.uint24(s.unicodeValue), e.uint16(s.glyphID);
  return e.toArray();
}
const Cn = [
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
], Ur = 15, Gr = 48;
function _l(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function Sl(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
function bl(t, n) {
  t.seek(n);
  const e = t.uint8(), s = t.uint8(), o = e === 1 ? t.uint32() : t.uint16(), i = (s & Ur) + 1, r = ((s & Gr) >> 4) + 1, a = [];
  for (let c = 0; c < o; c++) {
    const f = _l(t, r), u = (1 << i) - 1;
    a.push({
      outerIndex: f >> i,
      innerIndex: f & u
    });
  }
  return { format: e, entryFormat: s, mapCount: o, entries: a };
}
function vl(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, s = t.format ?? (e > 65535 ? 1 : 0);
  let o = 0, i = 0;
  for (const h of n)
    o = Math.max(o, h.innerIndex ?? 0), i = Math.max(i, h.outerIndex ?? 0);
  let r = 1;
  for (; (1 << r) - 1 < o && r < 16; )
    r++;
  const a = i << r | o;
  let c = 1;
  for (; c < 4 && a > (c === 1 ? 255 : c === 2 ? 65535 : 16777215); )
    c++;
  const f = t.entryFormat ?? c - 1 << 4 | r - 1, u = s === 1 ? 6 : 4, l = (f & Ur) + 1, g = ((f & Gr) >> 4) + 1, p = new k(u + e * g);
  p.uint8(s), p.uint8(f), s === 1 ? p.uint32(e) : p.uint16(e);
  for (let h = 0; h < e; h++) {
    const d = n[h] ?? { outerIndex: 0, innerIndex: 0 }, x = (d.outerIndex ?? 0) << l | (d.innerIndex ?? 0) & (1 << l) - 1;
    Sl(p, x, g);
  }
  return p.toArray();
}
function kl(t, n) {
  const e = /* @__PURE__ */ new Map(), s = Cl(
    t,
    n.baseGlyphListOffset,
    e
  ), o = n.layerListOffset ? Al(t, n.layerListOffset, e) : null, i = n.clipListOffset ? Ol(t, n.clipListOffset) : null, r = n.varIndexMapOffset ? bl(t, n.varIndexMapOffset) : null;
  n.itemVariationStoreOffset && ln(
    t.bytes(0).length ? [] : []
    // unused — we re-read below
  );
  let a = null;
  if (n.itemVariationStoreOffset) {
    t.seek(n.itemVariationStoreOffset);
    const c = [];
    for (; t.position < t.length; )
      c.push(t.uint8());
    a = ln(c);
  }
  return {
    baseGlyphPaintRecords: s,
    layerPaints: o,
    clipList: i,
    varIndexMap: r,
    itemVariationStore: a
  };
}
function Cl(t, n, e) {
  t.seek(n);
  const s = t.uint32(), o = [], i = [];
  for (let r = 0; r < s; r++)
    i.push({
      glyphID: t.uint16(),
      paintOffset: t.uint32()
    });
  for (const r of i)
    o.push({
      glyphID: r.glyphID,
      paint: J(t, n + r.paintOffset, e)
    });
  return o;
}
function Al(t, n, e) {
  t.seek(n);
  const s = t.uint32(), o = [];
  for (let r = 0; r < s; r++)
    o.push(t.uint32());
  const i = [];
  for (const r of o)
    i.push(J(t, n + r, e));
  return i;
}
function Ol(t, n) {
  t.seek(n);
  const e = t.uint8(), s = t.uint32(), o = [];
  for (let r = 0; r < s; r++)
    o.push({
      startGlyphID: t.uint16(),
      endGlyphID: t.uint16(),
      clipBoxOffset: t.uint24()
    });
  const i = o.map((r) => ({
    startGlyphID: r.startGlyphID,
    endGlyphID: r.endGlyphID,
    clipBox: Il(t, n + r.clipBoxOffset)
  }));
  return { format: e, clips: i };
}
function Il(t, n) {
  t.seek(n);
  const e = t.uint8(), s = t.fword(), o = t.fword(), i = t.fword(), r = t.fword(), a = { format: e, xMin: s, yMin: o, xMax: i, yMax: r };
  return e === 2 && (a.varIndexBase = t.uint32()), a;
}
function to(t, n, e) {
  t.seek(n);
  const s = t.uint8(), o = t.uint16(), i = [];
  for (let r = 0; r < o; r++) {
    const a = {
      stopOffset: t.f2dot14(),
      paletteIndex: t.uint16(),
      alpha: t.f2dot14()
    };
    e && (a.varIndexBase = t.uint32()), i.push(a);
  }
  return { extend: s, colorStops: i };
}
function El(t, n, e) {
  t.seek(n);
  const s = {
    xx: t.fixed(),
    yx: t.fixed(),
    xy: t.fixed(),
    yy: t.fixed(),
    dx: t.fixed(),
    dy: t.fixed()
  };
  return e && (s.varIndexBase = t.uint32()), s;
}
function J(t, n, e) {
  if (e.has(n)) return e.get(n);
  t.seek(n);
  const s = t.uint8();
  let o;
  switch (s) {
    case 1:
      o = Tl(t);
      break;
    case 2:
      o = Uo(t, !1);
      break;
    case 3:
      o = Uo(t, !0);
      break;
    case 4:
      o = Go(t, n, !1);
      break;
    case 5:
      o = Go(t, n, !0);
      break;
    case 6:
      o = No(t, n, !1);
      break;
    case 7:
      o = No(t, n, !0);
      break;
    case 8:
      o = $o(t, n, !1);
      break;
    case 9:
      o = $o(t, n, !0);
      break;
    case 10:
      o = Dl(t, n, e);
      break;
    case 11:
      o = Bl(t);
      break;
    case 12:
      o = Ho(t, n, e, !1);
      break;
    case 13:
      o = Ho(t, n, e, !0);
      break;
    case 14:
      o = Zo(t, n, e, !1);
      break;
    case 15:
      o = Zo(t, n, e, !0);
      break;
    case 16:
      o = jo(t, n, e, !1);
      break;
    case 17:
      o = jo(t, n, e, !0);
      break;
    case 18:
      o = Wo(t, n, e, !1);
      break;
    case 19:
      o = Wo(t, n, e, !0);
      break;
    case 20:
      o = qo(t, n, e, !1);
      break;
    case 21:
      o = qo(t, n, e, !0);
      break;
    case 22:
      o = Yo(t, n, e, !1);
      break;
    case 23:
      o = Yo(t, n, e, !0);
      break;
    case 24:
      o = Xo(t, n, e, !1);
      break;
    case 25:
      o = Xo(t, n, e, !0);
      break;
    case 26:
      o = Ko(t, n, e, !1);
      break;
    case 27:
      o = Ko(t, n, e, !0);
      break;
    case 28:
      o = Jo(t, n, e, !1);
      break;
    case 29:
      o = Jo(t, n, e, !0);
      break;
    case 30:
      o = Qo(t, n, e, !1);
      break;
    case 31:
      o = Qo(t, n, e, !0);
      break;
    case 32:
      o = Ml(t, n, e);
      break;
    default:
      return o = { format: s, _unknown: !0 }, e.set(n, o), o;
  }
  return o.format = s, e.set(n, o), o;
}
function Tl(t) {
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
function Go(t, n, e) {
  const s = t.uint24(), o = {
    x0: t.fword(),
    y0: t.fword(),
    x1: t.fword(),
    y1: t.fword(),
    x2: t.fword(),
    y2: t.fword()
  };
  return e && (o.varIndexBase = t.uint32()), o.colorLine = to(t, n + s, e), o;
}
function No(t, n, e) {
  const s = t.uint24(), o = {
    x0: t.fword(),
    y0: t.fword(),
    radius0: t.ufword(),
    x1: t.fword(),
    y1: t.fword(),
    radius1: t.ufword()
  };
  return e && (o.varIndexBase = t.uint32()), o.colorLine = to(t, n + s, e), o;
}
function $o(t, n, e) {
  const s = t.uint24(), o = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return e && (o.varIndexBase = t.uint32()), o.colorLine = to(t, n + s, e), o;
}
function Dl(t, n, e) {
  const s = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: J(t, n + s, e)
  };
}
function Bl(t) {
  return { glyphID: t.uint16() };
}
function Ho(t, n, e, s) {
  const o = t.uint24(), i = t.uint24();
  return {
    paint: J(t, n + o, e),
    transform: El(t, n + i, s)
  };
}
function Zo(t, n, e, s) {
  const o = t.uint24(), i = {
    dx: t.fword(),
    dy: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function jo(t, n, e, s) {
  const o = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function Wo(t, n, e, s) {
  const o = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function qo(t, n, e, s) {
  const o = t.uint24(), i = { scale: t.f2dot14() };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function Yo(t, n, e, s) {
  const o = t.uint24(), i = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function Xo(t, n, e, s) {
  const o = t.uint24(), i = { angle: t.f2dot14() };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function Ko(t, n, e, s) {
  const o = t.uint24(), i = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function Jo(t, n, e, s) {
  const o = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function Qo(t, n, e, s) {
  const o = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return s && (i.varIndexBase = t.uint32()), i.paint = J(t, n + o, e), i;
}
function Ml(t, n, e) {
  const s = t.uint24(), o = t.uint8(), i = t.uint24();
  return {
    sourcePaint: J(t, n + s, e),
    compositeMode: o,
    backdropPaint: J(t, n + i, e)
  };
}
function Ll(t) {
  const {
    baseGlyphPaintRecords: n,
    layerPaints: e,
    clipList: s,
    varIndexMap: o,
    itemVariationStore: i
  } = t, r = /* @__PURE__ */ new Map(), a = [];
  function c(T) {
    if (!(!T || r.has(T))) {
      r.set(T, a.length), a.push(T);
      for (const D of vs(T))
        c(D);
    }
  }
  if (n)
    for (const T of n)
      c(T.paint);
  if (e)
    for (const T of e)
      c(T);
  const f = Rl(a), u = /* @__PURE__ */ new Map();
  for (const T of f)
    u.set(T, zl(T));
  const l = /* @__PURE__ */ new Map();
  let g = 0;
  for (const T of f)
    l.set(T, g), g += u.get(T);
  const p = g, h = n ? n.length : 0, d = 4 + h * 6, x = e ? e.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = s ? Pl(s) : [], S = o ? vl(o) : [], w = i ? Wn(i) : [], _ = d + m + p + y.length + S.length + w.length, v = 0, b = d, E = d + m, A = E + p, C = A + y.length, I = C + S.length, O = new k(_);
  O.uint32(h);
  for (const T of n || [])
    O.uint16(T.glyphID), O.uint32(E - v + l.get(T.paint));
  if (x > 0) {
    O.uint32(x);
    for (const T of e)
      O.uint32(E - b + l.get(T));
  }
  for (const T of f)
    Fl(
      O,
      T,
      E + l.get(T),
      l,
      E
    );
  return O.rawBytes(y), O.rawBytes(S), O.rawBytes(w), {
    bodyBytes: O.toArray(),
    bglBodyOffset: v,
    llBodyOffset: x > 0 ? b : 0,
    clipBodyOffset: y.length > 0 ? A : 0,
    dimBodyOffset: S.length > 0 ? C : 0,
    ivsBodyOffset: w.length > 0 ? I : 0
  };
}
function vs(t) {
  if (!t) return [];
  const n = [];
  return t.paint && n.push(t.paint), t.sourcePaint && n.push(t.sourcePaint), t.backdropPaint && n.push(t.backdropPaint), n;
}
function Rl(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (const a of t) e.set(a, 0);
  for (const a of t)
    for (const c of vs(a))
      e.has(c) && e.set(c, e.get(c) + 1);
  const s = [];
  let o = 0;
  for (const a of t)
    e.get(a) === 0 && s.push(a);
  const i = [], r = /* @__PURE__ */ new Set();
  for (; o < s.length; ) {
    const a = s[o++];
    i.push(a), r.add(a);
    for (const c of vs(a)) {
      if (!e.has(c)) continue;
      const f = e.get(c) - 1;
      e.set(c, f), f === 0 && s.push(c);
    }
  }
  for (const a of t)
    r.has(a) || i.push(a);
  return i;
}
function zl(t) {
  const n = Cn[t.format] || 0, e = t.format;
  return e === 4 || e === 6 || e === 8 ? n + ti(t.colorLine, !1) : e === 5 || e === 7 || e === 9 ? n + ti(t.colorLine, !0) : e === 12 ? n + 24 : e === 13 ? n + 28 : n;
}
function ti(t, n) {
  if (!t) return 0;
  const e = n ? 10 : 6;
  return 3 + t.colorStops.length * e;
}
function Fl(t, n, e, s, o) {
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
      const r = Cn[i];
      t.uint24(r), t.fword(n.x0), t.fword(n.y0), t.fword(n.x1), t.fword(n.y1), t.fword(n.x2), t.fword(n.y2), i === 5 && t.uint32(n.varIndexBase), Xe(t, n.colorLine, i === 5);
      break;
    }
    case 6:
    // PaintRadialGradient
    case 7: {
      const r = Cn[i];
      t.uint24(r), t.fword(n.x0), t.fword(n.y0), t.ufword(n.radius0), t.fword(n.x1), t.fword(n.y1), t.ufword(n.radius1), i === 7 && t.uint32(n.varIndexBase), Xe(t, n.colorLine, i === 7);
      break;
    }
    case 8:
    // PaintSweepGradient
    case 9: {
      const r = Cn[i];
      t.uint24(r), t.fword(n.centerX), t.fword(n.centerY), t.f2dot14(n.startAngle), t.f2dot14(n.endAngle), i === 9 && t.uint32(n.varIndexBase), Xe(t, n.colorLine, i === 9);
      break;
    }
    case 10: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.uint16(n.glyphID);
      break;
    }
    case 11:
      t.uint16(n.glyphID);
      break;
    case 12:
    // PaintTransform
    case 13: {
      const r = o + s.get(n.paint), a = Cn[i];
      t.uint24(r - e), t.uint24(a), Vl(t, n.transform, i === 13);
      break;
    }
    case 14:
    // PaintTranslate
    case 15: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.fword(n.dx), t.fword(n.dy), i === 15 && t.uint32(n.varIndexBase);
      break;
    }
    case 16:
    // PaintScale
    case 17: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scaleX), t.f2dot14(n.scaleY), i === 17 && t.uint32(n.varIndexBase);
      break;
    }
    case 18:
    // PaintScaleAroundCenter
    case 19: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scaleX), t.f2dot14(n.scaleY), t.fword(n.centerX), t.fword(n.centerY), i === 19 && t.uint32(n.varIndexBase);
      break;
    }
    case 20:
    // PaintScaleUniform
    case 21: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scale), i === 21 && t.uint32(n.varIndexBase);
      break;
    }
    case 22:
    // PaintScaleUniformAroundCenter
    case 23: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.scale), t.fword(n.centerX), t.fword(n.centerY), i === 23 && t.uint32(n.varIndexBase);
      break;
    }
    case 24:
    // PaintRotate
    case 25: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.angle), i === 25 && t.uint32(n.varIndexBase);
      break;
    }
    case 26:
    // PaintRotateAroundCenter
    case 27: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.angle), t.fword(n.centerX), t.fword(n.centerY), i === 27 && t.uint32(n.varIndexBase);
      break;
    }
    case 28:
    // PaintSkew
    case 29: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.xSkewAngle), t.f2dot14(n.ySkewAngle), i === 29 && t.uint32(n.varIndexBase);
      break;
    }
    case 30:
    // PaintSkewAroundCenter
    case 31: {
      const r = o + s.get(n.paint);
      t.uint24(r - e), t.f2dot14(n.xSkewAngle), t.f2dot14(n.ySkewAngle), t.fword(n.centerX), t.fword(n.centerY), i === 31 && t.uint32(n.varIndexBase);
      break;
    }
    case 32: {
      const r = o + s.get(n.sourcePaint), a = o + s.get(n.backdropPaint);
      t.uint24(r - e), t.uint8(n.compositeMode), t.uint24(a - e);
      break;
    }
  }
}
function Xe(t, n, e) {
  t.uint8(n.extend), t.uint16(n.colorStops.length);
  for (const s of n.colorStops)
    t.f2dot14(s.stopOffset), t.uint16(s.paletteIndex), t.f2dot14(s.alpha), e && t.uint32(s.varIndexBase);
}
function Vl(t, n, e) {
  t.fixed(n.xx), t.fixed(n.yx), t.fixed(n.xy), t.fixed(n.yy), t.fixed(n.dx), t.fixed(n.dy), e && t.uint32(n.varIndexBase);
}
function Pl(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const n = [];
  for (const a of t.clips)
    n.push(Ul(a.clipBox));
  let s = 5 + t.clips.length * 7;
  const o = [];
  for (const a of n)
    o.push(s), s += a.length;
  const i = s, r = new k(i);
  r.uint8(t.format || 1), r.uint32(t.clips.length);
  for (let a = 0; a < t.clips.length; a++)
    r.uint16(t.clips[a].startGlyphID), r.uint16(t.clips[a].endGlyphID), r.uint24(o[a]);
  for (const a of n)
    r.rawBytes(a);
  return r.toArray();
}
function Ul(t) {
  const n = t.format === 2 ? 13 : 9, e = new k(n);
  return e.uint8(t.format), e.fword(t.xMin), e.fword(t.yMin), e.fword(t.xMax), e.fword(t.yMax), t.format === 2 && e.uint32(t.varIndexBase), e.toArray();
}
function Gl(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint32(), i = n.uint32(), r = n.uint16(), a = [];
  if (s > 0 && o > 0) {
    n.seek(o);
    for (let u = 0; u < s; u++)
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
    const u = n.uint32(), l = n.uint32(), g = n.uint32(), p = n.uint32(), h = n.uint32(), x = kl(n, {
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
function Nl(t) {
  const { baseGlyphRecords: n, layerRecords: e } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const l = n.length * 6, g = e.length * 4, d = 14 + 20, x = l + g, m = d + x, y = Ll({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), S = y.bodyBytes, w = m + y.bglBodyOffset, _ = y.llBodyOffset ? m + y.llBodyOffset : 0, v = y.clipBodyOffset ? m + y.clipBodyOffset : 0, b = y.dimBodyOffset ? m + y.dimBodyOffset : 0, E = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, A = m + S.length, C = new k(A);
    C.uint16(t.version), C.uint16(n.length), C.uint32(n.length > 0 ? d : 0), C.uint32(e.length > 0 ? d + l : 0), C.uint16(e.length), C.uint32(w), C.uint32(_), C.uint32(v), C.uint32(b), C.uint32(E);
    for (const I of n)
      C.uint16(I.glyphID), C.uint16(I.firstLayerIndex), C.uint16(I.numLayers);
    for (const I of e)
      C.uint16(I.glyphID), C.uint16(I.paletteIndex);
    return C.rawBytes(S), C.toArray();
  }
  const s = 14, o = n.length > 0 ? s : 0, i = n.length * 6, r = e.length > 0 ? s + i : 0, a = e.length * 4, c = s + i + a, f = new k(c);
  f.uint16(t.version), f.uint16(n.length), f.uint32(o), f.uint32(r), f.uint16(e.length);
  for (const u of n)
    f.uint16(u.glyphID), f.uint16(u.firstLayerIndex), f.uint16(u.numLayers);
  for (const u of e)
    f.uint16(u.glyphID), f.uint16(u.paletteIndex);
  return f.toArray();
}
function $l(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.uint32(), a = [];
  for (let h = 0; h < o; h++)
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
  for (let h = 0; h < o; h++) {
    const d = a[h], x = [];
    for (let m = 0; m < s; m++)
      x.push({ ...l[d + m] });
    g.push(x);
  }
  const p = {
    version: e,
    numPaletteEntries: s,
    palettes: g
  };
  if (e >= 1 && c !== 0) {
    n.seek(c), p.paletteTypes = [];
    for (let h = 0; h < o; h++)
      p.paletteTypes.push(n.uint32());
  }
  if (e >= 1 && f !== 0) {
    n.seek(f), p.paletteLabels = [];
    for (let h = 0; h < o; h++)
      p.paletteLabels.push(n.uint16());
  }
  if (e >= 1 && u !== 0) {
    n.seek(u), p.paletteEntryLabels = [];
    for (let h = 0; h < s; h++)
      p.paletteEntryLabels.push(n.uint16());
  }
  return p;
}
function Hl(t) {
  const { version: n, numPaletteEntries: e, palettes: s } = t, o = s.length, i = [], r = [];
  for (let y = 0; y < o; y++) {
    i.push(r.length);
    for (let S = 0; S < e; S++)
      r.push(s[y][S]);
  }
  const a = r.length, c = 12 + o * 2, f = n >= 1 ? 12 : 0, u = c + f, l = a * 4;
  let g = u + l, p = 0, h = 0, d = 0;
  n >= 1 && t.paletteTypes && (p = g, g += o * 4), n >= 1 && t.paletteLabels && (h = g, g += o * 2), n >= 1 && t.paletteEntryLabels && (d = g, g += e * 2);
  const x = g, m = new k(x);
  m.uint16(n), m.uint16(e), m.uint16(o), m.uint16(a), m.uint32(u);
  for (let y = 0; y < o; y++)
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
const Zl = 8, jl = 12;
function Wl(t) {
  const n = new B(t), e = n.uint32(), s = n.uint16(), o = n.uint16(), i = [];
  for (let a = 0; a < s; a++)
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
    flags: o,
    signatures: r
  };
}
function ql(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, o = (t.signatures ?? []).map((c) => {
    const f = Yl(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let i = Zl + o.length * jl;
  const r = o.map((c) => {
    const f = {
      format: c.format,
      length: c.bytes.length,
      offset: c.bytes.length ? i : 0
    };
    return i += c.bytes.length, f;
  }), a = new k(i);
  a.uint32(n), a.uint16(o.length), a.uint16(e);
  for (const c of r)
    a.uint32(c.format), a.uint32(c.length), a.offset32(c.offset);
  for (const c of o)
    a.rawBytes(c.bytes);
  return a.toArray();
}
function Yl(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function Xl(t, n) {
  return Ks(t, n?.EBLC ? { CBLC: n.EBLC } : n);
}
function Kl(t) {
  return Js(t);
}
function Jl(t) {
  return Qs(t);
}
function Ql(t) {
  return rn(t);
}
const ks = 28;
function th(t) {
  const n = new B(t), e = n.uint32(), s = n.uint32(), o = [];
  for (let i = 0; i < s; i++) {
    const r = n.position;
    o.push({
      hori: ni(n),
      vert: ni(n),
      substitutePpemX: n.uint8(),
      substitutePpemY: n.uint8(),
      originalPpemX: n.uint8(),
      originalPpemY: n.uint8(),
      _raw: Array.from(t.slice(r, r + ks))
    });
  }
  return { version: e, scales: o };
}
function nh(t) {
  const n = t.version ?? 131072, e = t.scales ?? [], s = new k(8 + e.length * ks);
  s.uint32(n), s.uint32(e.length);
  for (const o of e) {
    if (o._raw && o._raw.length === ks) {
      s.rawBytes(o._raw);
      continue;
    }
    ei(s, o.hori ?? {}), ei(s, o.vert ?? {}), s.uint8(o.substitutePpemX ?? 0), s.uint8(o.substitutePpemY ?? 0), s.uint8(o.originalPpemX ?? 0), s.uint8(o.originalPpemY ?? 0);
  }
  return s.toArray();
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
const si = 16, eh = 20;
function sh(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.offset16(), i = n.uint16(), r = n.uint16(), a = n.uint16(), c = n.uint16(), f = n.uint16(), u = [];
  for (let d = 0; d < r; d++)
    n.seek(o + d * a), u.push({
      axisTag: n.tag(),
      minValue: n.fixed(),
      defaultValue: n.fixed(),
      maxValue: n.fixed(),
      flags: n.uint16(),
      axisNameID: n.uint16()
    });
  const l = [], g = o + r * a, p = 4 + r * 4, h = f >= p + 2;
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
    minorVersion: s,
    reserved: i,
    axisSize: a,
    instanceSize: f,
    axes: u,
    instances: l
  };
}
function oh(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.reserved ?? 2, o = t.axes ?? [], i = t.instances ?? [], r = o.length, a = eh, c = 4 + r * 4, f = i.some(
    (d) => d.postScriptNameID !== void 0
  ), u = f ? c + 2 : c, l = i.length, g = si, p = si + r * a + l * u, h = new k(p);
  h.uint16(n), h.uint16(e), h.offset16(g), h.uint16(s), h.uint16(r), h.uint16(a), h.uint16(l), h.uint16(u);
  for (const d of o)
    h.tag(d.axisTag), h.fixed(d.minValue), h.fixed(d.defaultValue), h.fixed(d.maxValue), h.uint16(d.flags ?? 0), h.uint16(d.axisNameID ?? 0);
  for (const d of i) {
    h.uint16(d.subfamilyNameID ?? 0), h.uint16(d.flags ?? 0);
    for (let x = 0; x < r; x++)
      h.fixed(d.coordinates?.[x] ?? 0);
    f && h.uint16(d.postScriptNameID ?? 65535);
  }
  return h.toArray();
}
function ih(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.uint16(), a = n.uint16();
  let c = 0;
  s >= 2 && (c = n.uint16());
  let f = 0;
  s >= 3 && (f = n.uint32());
  const u = { majorVersion: e, minorVersion: s };
  return o !== 0 && (u.glyphClassDef = It(n, o)), i !== 0 && (u.attachList = rh(n, i)), r !== 0 && (u.ligCaretList = ah(n, r)), a !== 0 && (u.markAttachClassDef = It(n, a)), c !== 0 && (u.markGlyphSetsDef = fh(
    n,
    c
  )), f !== 0 && (u.itemVarStoreOffset = f, u.itemVarStoreRaw = Array.from(
    new Uint8Array(
      new B(t).view.buffer,
      new B(t).view.byteOffset + f,
      t.length - f
    )
  )), u;
}
function rh(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.array("uint16", s), i = F(t, n + e), r = o.map((a) => {
    t.seek(n + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: i, attachPoints: r };
}
function ah(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = t.array("uint16", s), i = F(t, n + e), r = o.map(
    (a) => ch(t, n + a)
  );
  return { coverage: i, ligGlyphs: r };
}
function ch(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((o) => {
    const i = n + o;
    t.seek(i);
    const r = t.uint16();
    if (r === 1)
      return { format: r, coordinate: t.int16() };
    if (r === 2)
      return { format: r, caretValuePointIndex: t.uint16() };
    if (r === 3) {
      const a = t.int16(), c = t.uint16(), f = c !== 0 ? hn(t, i + c) : null;
      return { format: r, coordinate: a, device: f };
    }
    throw new Error(`Unknown CaretValue format: ${r}`);
  });
}
function fh(t, n) {
  t.seek(n);
  const e = t.uint16(), s = t.uint16(), o = [];
  for (let r = 0; r < s; r++)
    o.push(t.uint32());
  const i = o.map(
    (r) => F(t, n + r)
  );
  return { format: e, coverages: i };
}
function uh(t) {
  const { majorVersion: n, minorVersion: e } = t, s = t.glyphClassDef ? Et(t.glyphClassDef) : null, o = t.attachList ? lh(t.attachList) : null, i = t.ligCaretList ? gh(t.ligCaretList) : null, r = t.markAttachClassDef ? Et(t.markAttachClassDef) : null, a = e >= 2 && t.markGlyphSetsDef ? mh(t.markGlyphSetsDef) : null, c = e >= 3 && t.itemVarStoreRaw ? t.itemVarStoreRaw : null;
  let f = 12;
  e >= 2 && (f += 2), e >= 3 && (f += 4);
  let u = f;
  const l = s ? u : 0;
  s && (u += s.length);
  const g = o ? u : 0;
  o && (u += o.length);
  const p = i ? u : 0;
  i && (u += i.length);
  const h = r ? u : 0;
  r && (u += r.length);
  const d = a ? u : 0;
  a && (u += a.length);
  const x = c ? u : 0;
  c && (u += c.length);
  const m = new k(u);
  return m.uint16(n), m.uint16(e), m.uint16(l), m.uint16(g), m.uint16(p), m.uint16(h), e >= 2 && m.uint16(d), e >= 3 && m.uint32(x), s && (m.seek(l), m.rawBytes(s)), o && (m.seek(g), m.rawBytes(o)), i && (m.seek(p), m.rawBytes(i)), r && (m.seek(h), m.rawBytes(r)), a && (m.seek(d), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function lh(t) {
  const n = P(t.coverage), e = t.attachPoints.map(hh);
  let o = 4 + t.attachPoints.length * 2;
  const i = o;
  o += n.length;
  const r = e.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(i), a.uint16(t.attachPoints.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function hh(t) {
  const n = 2 + t.length * 2, e = new k(n);
  return e.uint16(t.length), e.array("uint16", t), e.toArray();
}
function gh(t) {
  const n = P(t.coverage), e = t.ligGlyphs.map(ph);
  let o = 4 + t.ligGlyphs.length * 2;
  const i = o;
  o += n.length;
  const r = e.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(i), a.uint16(t.ligGlyphs.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function ph(t) {
  const n = t.map(dh);
  let s = 2 + t.length * 2;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < n.length; r++)
    i.seek(o[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function dh(t) {
  if (t.format === 1) {
    const n = new k(4);
    return n.uint16(1), n.int16(t.coordinate), n.toArray();
  }
  if (t.format === 2) {
    const n = new k(4);
    return n.uint16(2), n.uint16(t.caretValuePointIndex), n.toArray();
  }
  if (t.format === 3) {
    const n = t.device ? me(t.device) : null, e = 6 + (n ? n.length : 0), s = new k(e);
    return s.uint16(3), s.int16(t.coordinate), s.uint16(n ? 6 : 0), n && s.rawBytes(n), s.toArray();
  }
  throw new Error(`Unknown CaretValue format: ${t.format}`);
}
function mh(t) {
  const n = t.coverages.map(P);
  let s = 4 + t.coverages.length * 4;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.format), i.uint16(t.coverages.length);
  for (const r of o) i.uint32(r);
  for (let r = 0; r < n.length; r++)
    i.seek(o[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function At(t) {
  let n = 0, e = t;
  for (; e; )
    n += e & 1, e >>>= 1;
  return n * 2;
}
function tn(t, n, e) {
  if (n === 0) return null;
  const s = t.position, o = {};
  n & 1 && (o.xPlacement = t.int16()), n & 2 && (o.yPlacement = t.int16()), n & 4 && (o.xAdvance = t.int16()), n & 8 && (o.yAdvance = t.int16());
  const i = n & 16 ? t.uint16() : 0, r = n & 32 ? t.uint16() : 0, a = n & 64 ? t.uint16() : 0, c = n & 128 ? t.uint16() : 0, f = t.position, u = (l, g) => {
    const p = e + l, h = s + l;
    try {
      return hn(t, p);
    } catch (d) {
      if (h !== p)
        try {
          return hn(t, h);
        } catch {
        }
      const x = d instanceof Error ? d.message : String(d);
      throw new Error(
        `${x}; ValueRecord context: valueFormat=${n}, subtableOffset=${e}, valueRecordStart=${s}, offsets={xPla:${i},yPla:${r},xAdv:${a},yAdv:${c}}, field=${g}`
      );
    }
  };
  return i && (o.xPlaDevice = u(i, "xPlaDevice"), t.seek(f)), r && (o.yPlaDevice = u(r, "yPlaDevice"), t.seek(f)), a && (o.xAdvDevice = u(a, "xAdvDevice"), t.seek(f)), c && (o.yAdvDevice = u(c, "yAdvDevice"), t.seek(f)), o;
}
function gn(t, n) {
  if (n === 0) return null;
  t.seek(n);
  const e = t.uint16(), s = t.int16(), o = t.int16(), i = { format: e, xCoordinate: s, yCoordinate: o };
  if (e === 2)
    i.anchorPoint = t.uint16();
  else if (e === 3) {
    const r = t.uint16(), a = t.uint16();
    r && (i.xDevice = hn(t, n + r)), a && (i.yDevice = hn(t, n + a));
  }
  return i;
}
function no(t, n) {
  t.seek(n);
  const e = t.uint16(), s = [];
  for (let o = 0; o < e; o++) {
    const i = t.uint16(), r = t.uint16();
    s.push({ markClass: i, anchorOffset: r });
  }
  return s.map((o) => ({
    markClass: o.markClass,
    markAnchor: gn(t, n + o.anchorOffset)
  }));
}
function yh(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.uint16();
  let a = 0;
  s >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: s,
    scriptList: br(n, o),
    featureList: kr(n, i),
    lookupList: Ir(n, r, Nr, 9)
  };
  return a !== 0 && (c.featureVariations = Fr(
    n,
    a
  )), c;
}
function Nr(t, n, e) {
  switch (e) {
    case 1:
      return xh(t, n);
    case 2:
      return wh(t, n);
    case 3:
      return _h(t, n);
    case 4:
      return Sh(t, n);
    case 5:
      return bh(t, n);
    case 6:
      return vh(t, n);
    case 7:
      return Tr(t, n);
    case 8:
      return Mr(t, n);
    case 9:
      return kh(t, n);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function xh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const s = t.uint16(), o = t.uint16(), i = tn(t, o, n), r = F(t, n + s);
    return { format: e, coverage: r, valueFormat: o, valueRecord: i };
  }
  if (e === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = [];
    for (let c = 0; c < i; c++)
      r.push(tn(t, o, n));
    const a = F(t, n + s);
    return { format: e, coverage: a, valueFormat: o, valueCount: i, valueRecords: r };
  }
  throw new Error(`Unknown SinglePos format: ${e}`);
}
function wh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), c = t.array("uint16", r).map((u) => {
      const l = n + u;
      t.seek(l);
      const g = t.uint16(), p = [];
      for (let h = 0; h < g; h++) {
        const d = t.uint16(), x = tn(t, o, l), m = tn(t, i, l);
        p.push({ secondGlyph: d, value1: x, value2: m });
      }
      return p;
    }), f = F(t, n + s);
    return {
      format: e,
      coverage: f,
      valueFormat1: o,
      valueFormat2: i,
      pairSets: c
    };
  }
  if (e === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = t.uint16(), f = t.uint16(), u = [];
    for (let h = 0; h < c; h++) {
      const d = [];
      for (let x = 0; x < f; x++) {
        const m = tn(t, o, n), y = tn(t, i, n);
        d.push({ value1: m, value2: y });
      }
      u.push(d);
    }
    const l = F(t, n + s), g = It(t, n + r), p = It(t, n + a);
    return {
      format: e,
      coverage: l,
      valueFormat1: o,
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
function _h(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown CursivePos format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = [];
  for (let c = 0; c < o; c++) {
    const f = t.uint16(), u = t.uint16();
    i.push({ entryAnchorOff: f, exitAnchorOff: u });
  }
  const r = F(t, n + s), a = i.map((c) => ({
    entryAnchor: c.entryAnchorOff ? gn(t, n + c.entryAnchorOff) : null,
    exitAnchor: c.exitAnchorOff ? gn(t, n + c.exitAnchorOff) : null
  }));
  return { format: e, coverage: r, entryExitRecords: a };
}
function Sh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkBasePos format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = F(t, n + s), f = F(t, n + o), u = no(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), g = [];
  for (let h = 0; h < l; h++) {
    const d = t.array("uint16", i);
    g.push(d);
  }
  const p = g.map(
    (h) => h.map(
      (d) => d ? gn(t, n + a + d) : null
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
function bh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkLigPos format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = F(t, n + s), f = F(t, n + o), u = no(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), p = t.array("uint16", l).map((h) => {
    const d = n + a + h;
    t.seek(d);
    const x = t.uint16(), m = [];
    for (let y = 0; y < x; y++) {
      const S = t.array("uint16", i);
      m.push(S);
    }
    return m.map(
      (y) => y.map((S) => S ? gn(t, d + S) : null)
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
function vh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkMarkPos format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = F(t, n + s), f = F(t, n + o), u = no(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), g = [];
  for (let h = 0; h < l; h++) {
    const d = t.array("uint16", i);
    g.push(d);
  }
  const p = g.map(
    (h) => h.map(
      (d) => d ? gn(t, n + a + d) : null
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
function kh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionPos format: ${e}`);
  const s = t.uint16(), o = t.uint32(), i = Nr(
    t,
    n + o,
    s
  );
  return { format: e, extensionLookupType: s, extensionOffset: o, subtable: i };
}
function nn(t, n, e) {
  if (!n) return [];
  const s = new k(At(n));
  return n & 1 && s.int16(t ? t.xPlacement ?? 0 : 0), n & 2 && s.int16(t ? t.yPlacement ?? 0 : 0), n & 4 && s.int16(t ? t.xAdvance ?? 0 : 0), n & 8 && s.int16(t ? t.yAdvance ?? 0 : 0), n & 16 && (t?.xPlaDevice && e.push({ field: s.position, device: t.xPlaDevice }), s.uint16(0)), n & 32 && (t?.yPlaDevice && e.push({ field: s.position, device: t.yPlaDevice }), s.uint16(0)), n & 64 && (t?.xAdvDevice && e.push({ field: s.position, device: t.xAdvDevice }), s.uint16(0)), n & 128 && (t?.yAdvDevice && e.push({ field: s.position, device: t.yAdvDevice }), s.uint16(0)), s.toArray();
}
function Mn(t) {
  if (!t) return [];
  const { format: n, xCoordinate: e, yCoordinate: s } = t;
  if (n === 1) {
    const o = new k(6);
    return o.uint16(1), o.int16(e), o.int16(s), o.toArray();
  }
  if (n === 2) {
    const o = new k(8);
    return o.uint16(2), o.int16(e), o.int16(s), o.uint16(t.anchorPoint), o.toArray();
  }
  if (n === 3) {
    const o = t.xDevice ? me(t.xDevice) : null, i = t.yDevice ? me(t.yDevice) : null;
    let a = 10;
    const c = o ? a : 0;
    o && (a += o.length);
    const f = i ? a : 0;
    i && (a += i.length);
    const u = new k(a);
    return u.uint16(3), u.int16(e), u.int16(s), u.uint16(c), u.uint16(f), o && (u.seek(c), u.rawBytes(o)), i && (u.seek(f), u.rawBytes(i)), u.toArray();
  }
  throw new Error(`Unknown Anchor format: ${n}`);
}
function eo(t) {
  const n = t.map((r) => Mn(r.markAnchor));
  let s = 2 + t.length * 4;
  const o = n.map((r) => {
    if (!r.length) return 0;
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length);
  for (let r = 0; r < t.length; r++)
    i.uint16(t[r].markClass), i.uint16(o[r]);
  for (let r = 0; r < n.length; r++)
    n[r].length && (i.seek(o[r]), i.rawBytes(n[r]));
  return i.toArray();
}
function Ch(t) {
  const { majorVersion: n, minorVersion: e } = t, s = Ah(t), o = vr(s.scriptList), i = Ar(s.featureList), r = Er(
    s.lookupList,
    $r,
    9
  ), a = s.featureVariations ? Vr(s.featureVariations) : null;
  let c = 10;
  e >= 1 && (c += 4);
  let f = c;
  const u = f;
  f += o.length;
  const l = f;
  f += i.length;
  const g = f;
  f += r.length;
  const p = a ? f : 0;
  a && (f += a.length);
  const h = new k(f);
  return h.uint16(n), h.uint16(e), h.uint16(u), h.uint16(l), h.uint16(g), e >= 1 && h.uint32(p), h.seek(u), h.rawBytes(o), h.seek(l), h.rawBytes(i), h.seek(g), h.rawBytes(r), a && (h.seek(p), h.rawBytes(a)), h.toArray();
}
function Ah(t) {
  const n = t.lookupList.lookups.map((e) => {
    if (e.lookupType !== 2 || !Array.isArray(e.subtables))
      return e;
    const s = e.subtables.flatMap((o) => o?.format !== 1 || !Array.isArray(o.pairSets) ? [o] : Oh(o));
    return {
      ...e,
      subtables: s
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
function Oh(t) {
  const n = Ih(t.coverage);
  if (n.length !== t.pairSets.length)
    return [t];
  const e = At(t.valueFormat1) + At(t.valueFormat2), s = t.pairSets.map(
    (c) => 2 + c.length * (2 + e)
  ), o = s.reduce((c, f) => c + f, 0);
  if (oi(
    t.pairSets.length,
    o
  ) <= 65535)
    return [t];
  const r = [];
  let a = 0;
  for (; a < t.pairSets.length; ) {
    let c = a, f = 0, u = !1;
    for (; c < t.pairSets.length; ) {
      const l = f + s[c], g = c - a + 1;
      if (oi(
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
function oi(t, n) {
  const e = 10 + t * 2, s = 4 + t * 2;
  return e + s + n;
}
function Ih(t) {
  if (!t)
    return [];
  if (t.format === 1)
    return t.glyphs;
  if (t.format === 2) {
    const n = [];
    for (const e of t.ranges)
      for (let s = e.startGlyphID; s <= e.endGlyphID; s++)
        n.push(s);
    return n;
  }
  return [];
}
function $r(t, n) {
  switch (n) {
    case 1:
      return Eh(t);
    case 2:
      return Th(t);
    case 3:
      return Dh(t);
    case 4:
      return Bh(t);
    case 5:
      return Mh(t);
    case 6:
      return Rh(t);
    case 7:
      return Dr(t);
    case 8:
      return Rr(t);
    case 9:
      return zh(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function Eh(t) {
  const n = P(t.coverage), e = [];
  if (t.format === 1) {
    const s = nn(
      t.valueRecord,
      t.valueFormat,
      e
    ), i = 6 + s.length, r = i + n.length, a = new k(r);
    return a.uint16(1), a.uint16(i), a.uint16(t.valueFormat), a.rawBytes(s), a.seek(i), a.rawBytes(n), a.toArray();
  }
  if (t.format === 2) {
    const s = At(t.valueFormat), o = t.valueRecords.map(
      (f) => nn(f, t.valueFormat, e)
    ), r = 8 + o.length * s, a = r + n.length, c = new k(a);
    c.uint16(2), c.uint16(r), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of o) c.rawBytes(f);
    return c.seek(r), c.rawBytes(n), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function Th(t) {
  const n = P(t.coverage), e = [];
  if (t.format === 1) {
    const s = t.pairSets.map((f) => {
      const u = At(t.valueFormat1), l = At(t.valueFormat2), g = 2 + u + l, p = new k(2 + f.length * g);
      p.uint16(f.length);
      for (const h of f)
        p.uint16(h.secondGlyph), p.rawBytes(
          nn(h.value1, t.valueFormat1, e)
        ), p.rawBytes(
          nn(h.value2, t.valueFormat2, e)
        );
      return p.toArray();
    });
    let i = 10 + t.pairSets.length * 2;
    const r = i;
    i += n.length;
    const a = s.map((f) => {
      const u = i;
      return i += f.length, u;
    }), c = new k(i);
    c.uint16(1), c.uint16(r), c.uint16(t.valueFormat1), c.uint16(t.valueFormat2), c.uint16(t.pairSets.length), c.array("uint16", a), c.seek(r), c.rawBytes(n);
    for (let f = 0; f < s.length; f++)
      c.seek(a[f]), c.rawBytes(s[f]);
    return c.toArray();
  }
  if (t.format === 2) {
    const s = Et(t.classDef1), o = Et(t.classDef2), i = At(t.valueFormat1), r = At(t.valueFormat2), a = i + r;
    let u = 16 + t.class1Count * t.class2Count * a;
    const l = u;
    u += n.length;
    const g = u;
    u += s.length;
    const p = u;
    u += o.length;
    const h = new k(u);
    h.uint16(2), h.uint16(l), h.uint16(t.valueFormat1), h.uint16(t.valueFormat2), h.uint16(g), h.uint16(p), h.uint16(t.class1Count), h.uint16(t.class2Count);
    for (const d of t.class1Records)
      for (const x of d)
        h.rawBytes(
          nn(x.value1, t.valueFormat1, e)
        ), h.rawBytes(
          nn(x.value2, t.valueFormat2, e)
        );
    return h.seek(l), h.rawBytes(n), h.seek(g), h.rawBytes(s), h.seek(p), h.rawBytes(o), h.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function Dh(t) {
  const n = P(t.coverage), e = t.entryExitRecords.map((c) => ({
    entry: c.entryAnchor ? Mn(c.entryAnchor) : null,
    exit: c.exitAnchor ? Mn(c.exitAnchor) : null
  }));
  let o = 6 + t.entryExitRecords.length * 4;
  const i = o;
  o += n.length;
  const r = e.map((c) => {
    const f = c.entry ? o : 0;
    c.entry && (o += c.entry.length);
    const u = c.exit ? o : 0;
    return c.exit && (o += c.exit.length), { entryOff: f, exitOff: u };
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.entryExitRecords.length);
  for (const c of r)
    a.uint16(c.entryOff), a.uint16(c.exitOff);
  a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    e[c].entry && (a.seek(r[c].entryOff), a.rawBytes(e[c].entry)), e[c].exit && (a.seek(r[c].exitOff), a.rawBytes(e[c].exit));
  return a.toArray();
}
function Bh(t) {
  const n = P(t.markCoverage), e = P(t.baseCoverage), s = eo(t.markArray), o = Hr(t.baseArray);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += s.length;
  const u = r;
  r += o.length;
  const l = new k(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(s), l.seek(u), l.rawBytes(o), l.toArray();
}
function Hr(t) {
  const n = t.length > 0 ? t[0].length : 0, e = t.map((a) => a.map(Mn));
  let o = 2 + t.length * n * 2;
  const i = e.map(
    (a) => a.map((c) => {
      if (!c.length) return 0;
      const f = o;
      return o += c.length, f;
    })
  ), r = new k(o);
  r.uint16(t.length);
  for (let a = 0; a < t.length; a++)
    for (let c = 0; c < n; c++)
      r.uint16(i[a][c]);
  for (let a = 0; a < e.length; a++)
    for (let c = 0; c < n; c++)
      e[a][c].length && (r.seek(i[a][c]), r.rawBytes(e[a][c]));
  return r.toArray();
}
function Mh(t) {
  const n = P(t.markCoverage), e = P(t.ligatureCoverage), s = eo(t.markArray), o = Lh(t.ligatureArray, t.markClassCount);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += s.length;
  const u = r;
  r += o.length;
  const l = new k(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(s), l.seek(u), l.rawBytes(o), l.toArray();
}
function Lh(t, n) {
  const e = t.map((a) => {
    const c = a.map((p) => p.map(Mn));
    let u = 2 + a.length * n * 2;
    const l = c.map(
      (p) => p.map((h) => {
        if (!h.length) return 0;
        const d = u;
        return u += h.length, d;
      })
    ), g = new k(u);
    g.uint16(a.length);
    for (let p = 0; p < a.length; p++)
      for (let h = 0; h < n; h++)
        g.uint16(l[p][h]);
    for (let p = 0; p < c.length; p++)
      for (let h = 0; h < n; h++)
        c[p][h].length && (g.seek(l[p][h]), g.rawBytes(c[p][h]));
    return g.toArray();
  });
  let o = 2 + t.length * 2;
  const i = e.map((a) => {
    const c = o;
    return o += a.length, c;
  }), r = new k(o);
  r.uint16(t.length), r.array("uint16", i);
  for (let a = 0; a < e.length; a++)
    r.seek(i[a]), r.rawBytes(e[a]);
  return r.toArray();
}
function Rh(t) {
  const n = P(t.mark1Coverage), e = P(t.mark2Coverage), s = eo(t.mark1Array), o = Hr(t.mark2Array);
  let r = 12;
  const a = r;
  r += n.length;
  const c = r;
  r += e.length;
  const f = r;
  r += s.length;
  const u = r;
  r += o.length;
  const l = new k(r);
  return l.uint16(1), l.uint16(a), l.uint16(c), l.uint16(t.markClassCount), l.uint16(f), l.uint16(u), l.seek(a), l.rawBytes(n), l.seek(c), l.rawBytes(e), l.seek(f), l.rawBytes(s), l.seek(u), l.rawBytes(o), l.toArray();
}
function zh(t) {
  const n = $r(t.subtable, t.extensionLookupType), e = 8, s = new k(e + n.length);
  return s.uint16(1), s.uint16(t.extensionLookupType), s.uint32(e), s.rawBytes(n), s.toArray();
}
function Fh(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.uint16();
  let a = 0;
  s >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: s,
    scriptList: br(n, o),
    featureList: kr(n, i),
    lookupList: Ir(n, r, Zr, 7)
  };
  return a !== 0 && (c.featureVariations = Fr(
    n,
    a
  )), c;
}
function Zr(t, n, e) {
  switch (e) {
    case 1:
      return Vh(t, n);
    case 2:
      return Ph(t, n);
    case 3:
      return Uh(t, n);
    case 4:
      return Gh(t, n);
    case 5:
      return Tr(t, n);
    case 6:
      return Mr(t, n);
    case 7:
      return Nh(t, n);
    case 8:
      return $h(t, n);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function Vh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const s = t.uint16(), o = t.int16(), i = F(t, n + s);
    return { format: e, coverage: i, deltaGlyphID: o };
  }
  if (e === 2) {
    const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = F(t, n + s);
    return { format: e, coverage: r, substituteGlyphIDs: i };
  }
  throw new Error(`Unknown SingleSubst format: ${e}`);
}
function Ph(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MultipleSubst format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = F(t, n + s), a = i.map((c) => {
    t.seek(n + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: e, coverage: r, sequences: a };
}
function Uh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown AlternateSubst format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = F(t, n + s), a = i.map((c) => {
    t.seek(n + c);
    const f = t.uint16();
    return t.array("uint16", f);
  });
  return { format: e, coverage: r, alternateSets: a };
}
function Gh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown LigatureSubst format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = F(t, n + s), a = i.map((c) => {
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
function Nh(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionSubst format: ${e}`);
  const s = t.uint16(), o = t.uint32(), i = Zr(
    t,
    n + o,
    s
  );
  return { format: e, extensionLookupType: s, extensionOffset: o, subtable: i };
}
function $h(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1)
    throw new Error(`Unknown ReverseChainSingleSubst format: ${e}`);
  const s = t.uint16(), o = t.uint16(), i = t.array("uint16", o), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = t.array("uint16", c), u = F(t, n + s), l = i.map(
    (p) => F(t, n + p)
  ), g = a.map(
    (p) => F(t, n + p)
  );
  return {
    format: e,
    coverage: u,
    backtrackCoverages: l,
    lookaheadCoverages: g,
    substituteGlyphIDs: f
  };
}
function Hh(t) {
  const { majorVersion: n, minorVersion: e } = t, s = vr(t.scriptList), o = Ar(t.featureList), i = Er(
    t.lookupList,
    jr,
    7
  ), r = t.featureVariations ? Vr(t.featureVariations) : null;
  let a = 10;
  e >= 1 && (a += 4);
  let c = a;
  const f = c;
  c += s.length;
  const u = c;
  c += o.length;
  const l = c;
  c += i.length;
  const g = r ? c : 0;
  r && (c += r.length);
  const p = new k(c);
  return p.uint16(n), p.uint16(e), p.uint16(f), p.uint16(u), p.uint16(l), e >= 1 && p.uint32(g), p.seek(f), p.rawBytes(s), p.seek(u), p.rawBytes(o), p.seek(l), p.rawBytes(i), r && (p.seek(g), p.rawBytes(r)), p.toArray();
}
function jr(t, n) {
  switch (n) {
    case 1:
      return Zh(t);
    case 2:
      return jh(t);
    case 3:
      return Wh(t);
    case 4:
      return qh(t);
    case 5:
      return Dr(t);
    case 6:
      return Rr(t);
    case 7:
      return Xh(t);
    case 8:
      return Kh(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function Zh(t) {
  const n = P(t.coverage);
  if (t.format === 1) {
    const o = new k(6 + n.length);
    return o.uint16(1), o.uint16(6), o.int16(t.deltaGlyphID), o.seek(6), o.rawBytes(n), o.toArray();
  }
  if (t.format === 2) {
    const e = 6 + t.substituteGlyphIDs.length * 2, s = e, o = new k(e + n.length);
    return o.uint16(2), o.uint16(s), o.uint16(t.substituteGlyphIDs.length), o.array("uint16", t.substituteGlyphIDs), o.seek(s), o.rawBytes(n), o.toArray();
  }
  throw new Error(`Unknown SingleSubst format: ${t.format}`);
}
function jh(t) {
  const n = P(t.coverage), e = t.sequences.map((c) => {
    const f = new k(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let o = 6 + t.sequences.length * 2;
  const i = o;
  o += n.length;
  const r = e.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.sequences.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Wh(t) {
  const n = P(t.coverage), e = t.alternateSets.map((c) => {
    const f = new k(2 + c.length * 2);
    return f.uint16(c.length), f.array("uint16", c), f.toArray();
  });
  let o = 6 + t.alternateSets.length * 2;
  const i = o;
  o += n.length;
  const r = e.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.alternateSets.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function qh(t) {
  const n = P(t.coverage), e = t.ligatureSets.map(Yh);
  let o = 6 + t.ligatureSets.length * 2;
  const i = o;
  o += n.length;
  const r = e.map((c) => {
    const f = o;
    return o += c.length, f;
  }), a = new k(o);
  a.uint16(1), a.uint16(i), a.uint16(t.ligatureSets.length), a.array("uint16", r), a.seek(i), a.rawBytes(n);
  for (let c = 0; c < e.length; c++)
    a.seek(r[c]), a.rawBytes(e[c]);
  return a.toArray();
}
function Yh(t) {
  const n = t.map((r) => {
    const a = 4 + (r.componentCount - 1) * 2, c = new k(a);
    return c.uint16(r.ligatureGlyph), c.uint16(r.componentCount), c.array("uint16", r.componentGlyphIDs), c.toArray();
  });
  let s = 2 + t.length * 2;
  const o = n.map((r) => {
    const a = s;
    return s += r.length, a;
  }), i = new k(s);
  i.uint16(t.length), i.array("uint16", o);
  for (let r = 0; r < n.length; r++)
    i.seek(o[r]), i.rawBytes(n[r]);
  return i.toArray();
}
function Xh(t) {
  const n = jr(t.subtable, t.extensionLookupType), e = 8, s = new k(e + n.length);
  return s.uint16(1), s.uint16(t.extensionLookupType), s.uint32(e), s.rawBytes(n), s.toArray();
}
function Kh(t) {
  const n = P(t.coverage), e = t.backtrackCoverages.map(P), s = t.lookaheadCoverages.map(P);
  let i = 6 + t.backtrackCoverages.length * 2 + 2 + t.lookaheadCoverages.length * 2 + 2 + t.substituteGlyphIDs.length * 2;
  const r = i;
  i += n.length;
  const a = e.map((u) => {
    const l = i;
    return i += u.length, l;
  }), c = s.map((u) => {
    const l = i;
    return i += u.length, l;
  }), f = new k(i);
  f.uint16(1), f.uint16(r), f.uint16(t.backtrackCoverages.length), f.array("uint16", a), f.uint16(t.lookaheadCoverages.length), f.array("uint16", c), f.uint16(t.substituteGlyphIDs.length), f.array("uint16", t.substituteGlyphIDs), f.seek(r), f.rawBytes(n);
  for (let u = 0; u < e.length; u++)
    f.seek(a[u]), f.rawBytes(e[u]);
  for (let u = 0; u < s.length; u++)
    f.seek(c[u]), f.rawBytes(s[u]);
  return f.toArray();
}
const Jh = 8;
function Qh(t, n) {
  const e = new B(t), s = e.uint16(), o = e.uint16(), i = e.uint32(), r = n?.maxp?.numGlyphs, a = [];
  for (let c = 0; c < o && !(e.position + i > t.length || i < 2); c++) {
    const u = e.uint8(), l = e.uint8(), g = i - 2, p = typeof r == "number" ? Math.min(r, g) : g, h = e.bytes(p), d = g - p, x = d > 0 ? e.bytes(d) : [];
    a.push({
      pixelSize: u,
      maxWidth: l,
      widths: h,
      padding: x
    });
  }
  return {
    version: s,
    numRecords: o,
    sizeDeviceRecord: i,
    records: a
  };
}
function t0(t) {
  const n = t.version ?? 0, e = t.records ?? [], s = Math.max(
    0,
    ...e.map((f) => (f.widths ?? []).length)
  ), o = n0(2 + s), i = t.sizeDeviceRecord ?? o, r = Math.max(2, i), a = Jh + r * e.length, c = new k(a);
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
function n0(t) {
  return t + (4 - t % 4) % 4;
}
const e0 = 54;
function Cs(t) {
  const n = new B(t);
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
function Wr(t) {
  const n = new k(e0);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fixed(t.fontRevision), n.uint32(t.checksumAdjustment), n.uint32(t.magicNumber), n.uint16(t.flags), n.uint16(t.unitsPerEm), n.longDateTime(t.created), n.longDateTime(t.modified), n.int16(t.xMin), n.int16(t.yMin), n.int16(t.xMax), n.int16(t.yMax), n.uint16(t.macStyle), n.uint16(t.lowestRecPPEM), n.int16(t.fontDirectionHint), n.int16(t.indexToLocFormat), n.int16(t.glyphDataFormat), n.toArray();
}
const s0 = 36;
function o0(t) {
  const n = new B(t);
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
function i0(t) {
  const n = new k(s0);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fword(t.ascender), n.fword(t.descender), n.fword(t.lineGap), n.ufword(t.advanceWidthMax), n.fword(t.minLeftSideBearing), n.fword(t.minRightSideBearing), n.fword(t.xMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numberOfHMetrics), n.toArray();
}
function r0(t, n) {
  const e = n.hhea.numberOfHMetrics, s = n.maxp.numGlyphs, o = new B(t), i = [];
  for (let c = 0; c < e; c++)
    i.push({
      advanceWidth: o.ufword(),
      lsb: o.fword()
    });
  const r = s - e, a = o.array("fword", r);
  return { hMetrics: i, leftSideBearings: a };
}
function a0(t) {
  const { hMetrics: n, leftSideBearings: e } = t, s = n.length * 4 + e.length * 2, o = new k(s);
  for (const i of n)
    o.ufword(i.advanceWidth), o.fword(i.lsb);
  return o.array("fword", e), o.toArray();
}
const c0 = 20, qr = 15, Yr = 48;
function f0(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.offset32(), i = n.offset32(), r = n.offset32(), a = n.offset32();
  return {
    majorVersion: e,
    minorVersion: s,
    itemVariationStore: o ? ln(
      t.slice(
        o,
        Xr(t.length, o, [
          i,
          r,
          a
        ])
      )
    ) : null,
    advanceWidthMapping: Ke(
      t,
      i,
      [o, r, a]
    ),
    lsbMapping: Ke(t, r, [
      o,
      i,
      a
    ]),
    rsbMapping: Ke(t, a, [
      o,
      i,
      r
    ])
  };
}
function Ke(t, n, e) {
  if (!n)
    return null;
  const s = Xr(t.length, n, e);
  if (s <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const o = Array.from(t.slice(n, s));
  return {
    ...u0(o),
    _raw: o
  };
}
function Xr(t, n, e) {
  return e.filter((o) => o > n).sort((o, i) => o - i)[0] ?? t;
}
function u0(t) {
  const n = new B(t), e = n.uint8(), s = n.uint8(), o = e === 1 ? n.uint32() : n.uint16(), i = (s & qr) + 1, r = ((s & Yr) >> 4) + 1, a = [];
  for (let c = 0; c < o; c++) {
    const f = y0(n, r);
    a.push(p0(f, i));
  }
  return {
    format: e,
    entryFormat: s,
    mapCount: o,
    entries: a
  };
}
function l0(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.itemVariationStore ? Wn(t.itemVariationStore) : [], o = Je(
    t.advanceWidthMapping
  ), i = Je(t.lsbMapping), r = Je(t.rsbMapping);
  let a = c0;
  const c = s.length ? a : 0;
  a += s.length;
  const f = o.length ? a : 0;
  a += o.length;
  const u = i.length ? a : 0;
  a += i.length;
  const l = r.length ? a : 0;
  a += r.length;
  const g = new k(a);
  return g.uint16(n), g.uint16(e), g.offset32(c), g.offset32(f), g.offset32(u), g.offset32(l), g.rawBytes(s), g.rawBytes(o), g.rawBytes(i), g.rawBytes(r), g.toArray();
}
function Je(t) {
  return t ? t._raw ? t._raw : h0(t) : [];
}
function h0(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, s = d0(n), o = t.format ?? (e > 65535 ? 1 : 0), i = t.entryFormat ?? s.entryFormat, r = (i & qr) + 1, a = ((i & Yr) >> 4) + 1, c = o === 1 ? 6 : 4, f = new k(c + e * a);
  f.uint8(o), f.uint8(i), o === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, g = g0(l, r);
    x0(f, g, a);
  }
  return f.toArray();
}
function g0(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function p0(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function d0(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let s = 1;
  for (; (1 << s) - 1 < n && s < 16; )
    s++;
  const o = e << s | n;
  let i = 1;
  for (; i < 4 && o > m0(i); )
    i++;
  return { entryFormat: i - 1 << 4 | s - 1 };
}
function m0(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function y0(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function x0(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const w0 = 6, _0 = 6;
function S0(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = [];
  for (let c = 0; c < o; c++)
    i.push({
      tag: n.tag(),
      offset: n.offset16()
    });
  const r = i.map((c) => c.offset).filter((c) => c > 0), a = i.map((c) => ({
    ...c,
    table: v0(t, c.offset, r)
  }));
  return {
    majorVersion: e,
    minorVersion: s,
    scripts: a
  };
}
function b0(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.scripts ?? [], o = s.map((c) => k0(c.table));
  let i = w0 + s.length * _0;
  const r = o.map((c) => {
    if (!c.length)
      return 0;
    const f = i;
    return i += c.length, f;
  }), a = new k(i);
  a.uint16(n), a.uint16(e), a.uint16(s.length);
  for (let c = 0; c < s.length; c++) {
    const u = (s[c].tag ?? "    ").slice(0, 4).padEnd(4, " ");
    a.tag(u), a.offset16(r[c]);
  }
  for (const c of o)
    a.rawBytes(c);
  return a.toArray();
}
function v0(t, n, e) {
  if (!n)
    return null;
  const o = e.filter((i) => i > n).sort((i, r) => i - r)[0] ?? t.length;
  return o <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, o)) };
}
function k0(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Kr = 4, le = 6, Jr = 8, he = 8;
function C0(t) {
  const n = new B(t);
  return (t.length >= 4 ? n.uint32() : 0) === 65536 ? T0(t) : A0(t);
}
function A0(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = [];
  let i = Kr;
  for (let r = 0; r < s && !(i + le > t.length); r++) {
    n.seek(i);
    const a = n.uint16(), c = n.uint16(), f = n.uint16(), u = f >> 8 & 255, l = Math.min(
      t.length,
      i + Math.max(c, le)
    ), g = i + le, p = Array.from(t.slice(g, l)), h = {
      version: a,
      coverage: f,
      format: u
    };
    u === 0 ? Object.assign(h, Qr(p)) : u === 2 ? Object.assign(h, ta(p)) : h._raw = p, o.push(h), i = l;
  }
  return {
    formatVariant: "opentype",
    version: e,
    nTables: s,
    subtables: o
  };
}
function Qr(t) {
  const n = new B(t);
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
  const s = [];
  for (let c = 0; c < e && !(n.position + 6 > t.length); c++)
    s.push({
      left: n.uint16(),
      right: n.uint16(),
      value: n.int16()
    });
  const o = s.length, i = Math.floor(
    Math.log2(Math.max(1, o))
  ), r = Math.pow(2, i) * 6, a = o * 6 - r;
  return {
    nPairs: o,
    searchRange: r,
    entrySelector: i,
    rangeShift: a,
    pairs: s
  };
}
function O0(t) {
  return Qr(t);
}
function ta(t) {
  const n = new B(t);
  if (t.length < 8) return { _raw: t };
  const e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = ii(n, t, s), a = ii(
    n,
    t,
    o
  ), c = e > 0 ? e / 2 : 0, f = e > 0 && r.maxOffset >= i ? Math.floor((r.maxOffset - i) / e) + 1 : 1, u = [];
  for (let l = 0; l < f; l++) {
    const g = [], p = i + l * e;
    for (let h = 0; h < c; h++) {
      const d = p + h * 2;
      d + 2 <= t.length ? (n.seek(d), g.push(n.int16())) : g.push(0);
    }
    u.push(g);
  }
  return {
    rowWidth: e,
    leftOffsetTable: s,
    rightOffsetTable: o,
    kerningArrayOffset: i,
    leftClassTable: r,
    rightClassTable: a,
    nLeftClasses: f,
    nRightClasses: c,
    values: u
  };
}
function ii(t, n, e) {
  if (e + 4 > n.length)
    return {
      firstGlyph: 0,
      nGlyphs: 0,
      offsets: [],
      maxOffset: 0
    };
  t.seek(e);
  const s = t.uint16(), o = t.uint16(), i = [];
  let r = 0;
  for (let a = 0; a < o; a++)
    if (t.position + 2 <= n.length) {
      const c = t.uint16();
      i.push(c), c > r && (r = c);
    } else
      i.push(0);
  return { firstGlyph: s, nGlyphs: o, offsets: i, maxOffset: r };
}
function I0(t) {
  const n = new B(t);
  if (t.length < 8) return { _raw: t };
  const e = n.uint16(), s = n.uint8(), o = n.uint8(), i = n.uint8(), r = n.uint8(), a = [];
  for (let g = 0; g < s; g++)
    n.position + 2 <= t.length ? a.push(n.int16()) : a.push(0);
  const c = [];
  for (let g = 0; g < e; g++)
    n.position < t.length ? c.push(n.uint8()) : c.push(0);
  const f = [];
  for (let g = 0; g < e; g++)
    n.position < t.length ? f.push(n.uint8()) : f.push(0);
  const u = [], l = o * i;
  for (let g = 0; g < l; g++)
    n.position < t.length ? u.push(n.uint8()) : u.push(0);
  return {
    glyphCount: e,
    kernValueCount: s,
    leftClassCount: o,
    rightClassCount: i,
    flags: r,
    kernValues: a,
    leftClasses: c,
    rightClasses: f,
    kernIndices: u
  };
}
function E0(t) {
  const n = new B(t);
  if (t.length < 12) return { _raw: t };
  const e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.uint16();
  let a = 0, c = 0, f = [];
  if (s + 4 <= t.length) {
    n.seek(s), a = n.uint16(), c = n.uint16(), f = [];
    for (let m = 0; m < c; m++)
      n.position < t.length ? f.push(n.uint8()) : f.push(1);
  }
  const u = Math.min(i, t.length), l = e > 0 ? Math.floor((u - o) / e) : 0, g = [];
  for (let m = 0; m < l; m++) {
    const y = o + m * e;
    n.seek(y);
    const S = [];
    for (let w = 0; w < e; w++)
      n.position < t.length ? S.push(n.uint8()) : S.push(0);
    g.push(S);
  }
  const p = Math.min(
    r > i ? r : t.length,
    t.length
  ), h = Math.floor((p - i) / 4), d = [];
  n.seek(i);
  for (let m = 0; m < h; m++)
    if (n.position + 4 <= t.length) {
      const y = n.uint16(), S = n.uint16();
      d.push({ newStateOffset: y, flags: S });
    }
  const x = [];
  if (r < t.length)
    for (n.seek(r); n.position + 2 <= t.length; )
      x.push(n.int16());
  return {
    stateSize: e,
    classTableOffset: s,
    stateArrayOffset: o,
    entryTableOffset: i,
    valueTableOffset: r,
    classTable: {
      firstGlyph: a,
      nGlyphs: c,
      classArray: f
    },
    states: g,
    entryTable: d,
    valueTable: x
  };
}
function T0(t) {
  const n = new B(t), e = n.uint32(), s = n.uint32(), o = [];
  let i = Jr;
  for (let r = 0; r < s && !(i + he > t.length); r++) {
    n.seek(i);
    const a = n.uint32(), c = n.uint8(), f = n.uint8(), u = n.uint16(), l = Math.min(
      t.length,
      i + Math.max(a, he)
    ), g = Array.from(
      t.slice(i + he, l)
    ), p = {
      coverage: c,
      format: f,
      tupleIndex: u
    };
    f === 0 ? Object.assign(p, O0(g)) : f === 1 ? Object.assign(p, E0(g)) : f === 2 ? Object.assign(p, ta(g)) : f === 3 ? Object.assign(p, I0(g)) : p._raw = g, o.push(p), i = l;
  }
  return {
    formatVariant: "apple",
    version: e,
    nTables: s,
    subtables: o
  };
}
function D0(t) {
  return t.formatVariant === "apple" ? L0(t) : B0(t);
}
function B0(t) {
  const n = t.version ?? 0, e = t.subtables ?? [], s = e.map(
    (a) => M0(a)
  ), o = e.length, i = Kr + s.reduce((a, c) => a + c.length, 0), r = new k(i);
  r.uint16(n), r.uint16(o);
  for (const a of s)
    r.rawBytes(a);
  return r.toArray();
}
function M0(t) {
  const n = t._raw ? t._raw : t.format === 0 ? na(t) : t.format === 2 ? ea(t) : [], e = le + n.length, s = t.coverage ?? (t.format ?? 0) << 8, o = new k(e);
  return o.uint16(t.version ?? 0), o.uint16(e), o.uint16(s), o.rawBytes(n), o.toArray();
}
function na(t) {
  const n = t.pairs ?? [], e = n.length, s = Math.floor(Math.log2(Math.max(1, e))), o = Math.pow(2, s) * 6, i = e * 6 - o, r = new k(8 + e * 6);
  r.uint16(e), r.uint16(t.searchRange ?? o), r.uint16(t.entrySelector ?? s), r.uint16(t.rangeShift ?? i);
  for (const a of n)
    r.uint16(a.left), r.uint16(a.right), r.int16(a.value);
  return r.toArray();
}
function L0(t) {
  const n = t.version ?? 65536, e = t.subtables ?? [], s = e.map((a) => {
    const c = R0(a), f = he + c.length, u = new k(f);
    return u.uint32(f), u.uint8(a.coverage ?? 0), u.uint8(a.format ?? 0), u.uint16(a.tupleIndex ?? 0), u.rawBytes(c), u.toArray();
  }), o = e.length, i = Jr + s.reduce((a, c) => a + c.length, 0), r = new k(i);
  r.uint32(n), r.uint32(o);
  for (const a of s)
    r.rawBytes(a);
  return r.toArray();
}
function R0(t) {
  if (t._raw) return t._raw;
  switch (t.format) {
    case 0:
      return na(t);
    case 1:
      return F0(t);
    case 2:
      return ea(t);
    case 3:
      return z0(t);
    default:
      return [];
  }
}
function ea(t) {
  const {
    rowWidth: n,
    leftOffsetTable: e,
    rightOffsetTable: s,
    kerningArrayOffset: o,
    leftClassTable: i,
    rightClassTable: r,
    nLeftClasses: a,
    nRightClasses: c,
    values: f
  } = t, u = ri(i), l = ri(r), g = a * c * 2, p = Math.max(
    o + g,
    e + u.length,
    s + l.length,
    8
    // header
  ), h = new k(p);
  h.uint16(n), h.uint16(e), h.uint16(s), h.uint16(o), h.seek(e), h.rawBytes(u), h.seek(s), h.rawBytes(l), h.seek(o);
  for (let d = 0; d < a; d++) {
    const x = f[d] || [];
    for (let m = 0; m < c; m++)
      h.int16(x[m] || 0);
  }
  return h.toArray();
}
function ri(t) {
  const { firstGlyph: n, nGlyphs: e, offsets: s } = t, o = new k(4 + e * 2);
  o.uint16(n), o.uint16(e);
  for (let i = 0; i < e; i++)
    o.uint16(s[i] || 0);
  return o.toArray();
}
function z0(t) {
  const {
    glyphCount: n,
    kernValueCount: e,
    leftClassCount: s,
    rightClassCount: o,
    flags: i,
    kernValues: r,
    leftClasses: a,
    rightClasses: c,
    kernIndices: f
  } = t, u = s * o, l = 6 + // header: uint16 + 4×uint8
  e * 2 + // int16 values
  n + // left class uint8
  n + // right class uint8
  u, g = new k(l);
  g.uint16(n), g.uint8(e), g.uint8(s), g.uint8(o), g.uint8(i ?? 0);
  for (let p = 0; p < e; p++)
    g.int16(r[p] || 0);
  for (let p = 0; p < n; p++)
    g.uint8(a[p] || 0);
  for (let p = 0; p < n; p++)
    g.uint8(c[p] || 0);
  for (let p = 0; p < u; p++)
    g.uint8(f[p] || 0);
  return g.toArray();
}
function F0(t) {
  const {
    stateSize: n,
    classTableOffset: e,
    stateArrayOffset: s,
    entryTableOffset: o,
    valueTableOffset: i,
    classTable: r,
    states: a,
    entryTable: c,
    valueTable: f
  } = t, u = 4 + (r?.nGlyphs || 0), l = (a?.length || 0) * n, g = (c?.length || 0) * 4, p = (f?.length || 0) * 2, h = Math.max(
    10,
    // header: 5 × uint16
    e + u,
    s + l,
    o + g,
    i + p
  ), d = new k(h);
  if (d.uint16(n), d.uint16(e), d.uint16(s), d.uint16(o), d.uint16(i), d.seek(e), d.uint16(r?.firstGlyph || 0), d.uint16(r?.nGlyphs || 0), r?.classArray)
    for (const x of r.classArray)
      d.uint8(x);
  if (d.seek(s), a)
    for (const x of a)
      for (const m of x)
        d.uint8(m);
  if (d.seek(o), c)
    for (const x of c)
      d.uint16(x.newStateOffset), d.uint16(x.flags);
  if (d.seek(i), f)
    for (const x of f)
      d.int16(x);
  return d.toArray();
}
function V0(t) {
  const n = new B(t), e = n.uint32(), s = n.uint32(), o = n.uint32(), i = [], r = [];
  for (let a = 0; a < o; a++)
    r.push({ offset: n.uint16(), length: n.uint16() });
  for (const a of r) {
    const c = t.slice(a.offset, a.offset + a.length);
    i.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: e, flags: s, tags: i };
}
function P0(t) {
  const { version: n, flags: e, tags: s } = t, o = new TextEncoder(), i = s.map((u) => o.encode(u)), r = 12 + s.length * 4, a = r + i.reduce((u, l) => u + l.length, 0), c = new k(a);
  c.uint32(n), c.uint32(e), c.uint32(s.length);
  let f = r;
  for (const u of i)
    c.uint16(f), c.uint16(u.length), f += u.length;
  for (const u of i)
    c.rawBytes(u);
  return c.toArray();
}
function U0(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.bytes(s);
  return {
    version: e,
    numGlyphs: s,
    yPels: o
  };
}
function G0(t) {
  const n = t.version ?? 0, e = t.yPels ?? [], s = t.numGlyphs ?? e.length, o = e.slice(0, s);
  for (; o.length < s; )
    o.push(0);
  const i = new k(4 + s);
  return i.uint16(n), i.uint16(s), i.rawBytes(o), i.toArray();
}
const N0 = 10;
function $0(t) {
  const n = new B(t), e = n.uint32(), s = n.offset16(), o = n.offset16(), i = n.offset16(), r = [
    s,
    o,
    i
  ].filter((a) => a > 0);
  return {
    version: e,
    mathConstants: Qe(t, s, r),
    mathGlyphInfo: Qe(t, o, r),
    mathVariants: Qe(t, i, r)
  };
}
function H0(t) {
  const n = t.version ?? 65536, e = ts(t.mathConstants), s = ts(t.mathGlyphInfo), o = ts(t.mathVariants);
  let i = N0;
  const r = e.length ? i : 0;
  i += e.length;
  const a = s.length ? i : 0;
  i += s.length;
  const c = o.length ? i : 0;
  i += o.length;
  const f = new k(i);
  return f.uint32(n), f.offset16(r), f.offset16(a), f.offset16(c), f.rawBytes(e), f.rawBytes(s), f.rawBytes(o), f.toArray();
}
function Qe(t, n, e) {
  if (!n)
    return null;
  const o = e.filter((i) => i > n).sort((i, r) => i - r)[0] ?? t.length;
  return o <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, o)) };
}
function ts(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Z0 = 6, j0 = 32;
function W0(t) {
  const n = new B(t), e = n.uint32(), s = n.uint16(), o = { version: e, numGlyphs: s };
  return e === 65536 && (o.maxPoints = n.uint16(), o.maxContours = n.uint16(), o.maxCompositePoints = n.uint16(), o.maxCompositeContours = n.uint16(), o.maxZones = n.uint16(), o.maxTwilightPoints = n.uint16(), o.maxStorage = n.uint16(), o.maxFunctionDefs = n.uint16(), o.maxInstructionDefs = n.uint16(), o.maxStackElements = n.uint16(), o.maxSizeOfInstructions = n.uint16(), o.maxComponentElements = n.uint16(), o.maxComponentDepth = n.uint16()), o;
}
function q0(t) {
  const n = t.version === 65536, e = n ? j0 : Z0, s = new k(e);
  return s.uint32(t.version), s.uint16(t.numGlyphs), n && (s.uint16(t.maxPoints), s.uint16(t.maxContours), s.uint16(t.maxCompositePoints), s.uint16(t.maxCompositeContours), s.uint16(t.maxZones), s.uint16(t.maxTwilightPoints), s.uint16(t.maxStorage), s.uint16(t.maxFunctionDefs), s.uint16(t.maxInstructionDefs), s.uint16(t.maxStackElements), s.uint16(t.maxSizeOfInstructions), s.uint16(t.maxComponentElements), s.uint16(t.maxComponentDepth)), s.toArray();
}
function Y0(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const n = new B(t), e = t.length >= 2 ? n.uint16() : 0, s = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: e,
    data: s
  };
}
function X0(t) {
  const n = t.version ?? 0, e = t.data ?? [], s = new k(2 + e.length);
  return s.uint16(n), s.rawBytes(e), s.toArray();
}
const sa = 16, K0 = 12;
function J0(t) {
  const n = new B(t), e = n.uint32(), s = n.uint32(), o = n.uint32(), i = n.uint32(), r = [];
  for (let a = 0; a < i; a++) {
    const c = n.tag(), f = n.uint32(), u = n.uint32(), l = f, g = Math.min(t.length, l + u), p = l < sa || l >= t.length || g < l ? [] : Array.from(t.slice(l, g));
    r.push({ tag: c, dataOffset: f, dataLength: u, data: p });
  }
  return {
    version: e,
    flags: s,
    reserved: o,
    dataMaps: r
  };
}
function Q0(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, s = t.reserved ?? 0, i = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let r = sa + i.length * K0;
  const a = i.map((f) => {
    const u = r, l = f.data.length;
    return r += l, {
      tag: f.tag,
      dataOffset: u,
      dataLength: l,
      data: f.data
    };
  }), c = new k(r);
  c.uint32(n), c.uint32(e), c.uint32(s), c.uint32(a.length);
  for (const f of a)
    c.tag(f.tag), c.uint32(f.dataOffset), c.uint32(f.dataLength);
  for (const f of a)
    c.rawBytes(f.data);
  return c.toArray();
}
const As = 12, en = 8;
function tg(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.uint16(), a = n.offset16(), c = [];
  for (let u = 0; u < r; u++) {
    const l = As + u * i;
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
    i > en && (g._extra = n.bytes(i - en)), c.push(g);
  }
  const f = a > 0 && a < t.length ? ln(t.slice(a)) : null;
  return {
    majorVersion: e,
    minorVersion: s,
    reserved: o,
    valueRecordSize: i,
    valueRecords: c,
    itemVariationStore: f
  };
}
function ng(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.reserved ?? 0, o = [...t.valueRecords ?? []].sort(
    (p, h) => eg(p.valueTag, h.valueTag)
  ), i = t.valueRecordSize ?? en, r = o.reduce((p, h) => {
    const d = h._extra?.length ?? 0;
    return Math.max(p, en + d);
  }, en), a = Math.max(
    i,
    r
  ), c = o.length, f = t.itemVariationStore ? Wn(t.itemVariationStore) : [], u = f.length > 0 || c > 0 ? As + c * a : 0, l = u > 0 ? u + f.length : As, g = new k(l);
  g.uint16(n), g.uint16(e), g.uint16(s), g.uint16(a), g.uint16(c), g.offset16(u);
  for (const p of o) {
    g.tag(p.valueTag ?? "    "), g.uint16(p.deltaSetOuterIndex ?? 0), g.uint16(p.deltaSetInnerIndex ?? 0);
    const h = p._extra ?? [];
    g.rawBytes(h);
    const d = a - en - h.length;
    d > 0 && g.rawBytes(new Array(d).fill(0));
  }
  return g.rawBytes(f), g.toArray();
}
function eg(t, n) {
  const e = t ?? "    ", s = n ?? "    ";
  for (let o = 0; o < 4; o++) {
    const i = e.charCodeAt(o) - s.charCodeAt(o);
    if (i !== 0)
      return i;
  }
  return 0;
}
const Os = [
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
], so = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  so.set(t, t);
for (let t = 0; t < Os.length; t++)
  so.set(Os[t], 128 + t);
function sg(t, n, e) {
  return n === 0 || n === 3 ? Is(t) : n === 1 && e === 0 ? ig(t) : t.length % 2 === 0 ? Is(t) : "0x:" + t.map((s) => s.toString(16).padStart(2, "0")).join("");
}
function og(t, n, e) {
  if (t.startsWith("0x:")) {
    const s = t.slice(3), o = [];
    for (let i = 0; i < s.length; i += 2)
      o.push(parseInt(s.slice(i, i + 2), 16));
    return o;
  }
  return n === 0 || n === 3 ? Es(t) : n === 1 && e === 0 ? rg(t) : Es(t);
}
function Is(t) {
  const n = [];
  for (let e = 0; e + 1 < t.length; e += 2) {
    const s = t[e] << 8 | t[e + 1];
    n.push(s);
  }
  return String.fromCharCode(...n);
}
function Es(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const s = t.charCodeAt(e);
    n.push(s >> 8 & 255, s & 255);
  }
  return n;
}
function ig(t) {
  return t.map((n) => n < 128 ? String.fromCharCode(n) : String.fromCharCode(Os[n - 128])).join("");
}
function rg(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const s = t.charCodeAt(e), o = so.get(s);
    n.push(o !== void 0 ? o : 63);
  }
  return n;
}
function ag(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = [];
  for (let f = 0; f < s; f++)
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
        o + g,
        o + g + l
      );
      r.push({
        tag: Is(p)
      });
    }
  }
  const a = i.map((f) => {
    const u = t.slice(
      o + f.stringOffset,
      o + f.stringOffset + f.length
    );
    return {
      platformID: f.platformID,
      encodingID: f.encodingID,
      languageID: f.languageID,
      nameID: f.nameID,
      value: sg(u, f.platformID, f.encodingID)
    };
  }), c = { version: e, names: a };
  return e === 1 && r.length > 0 && (c.langTagRecords = r), c;
}
function cg(t) {
  const { version: n, names: e, langTagRecords: s = [] } = t, o = e.map((w) => ({
    platformID: w.platformID,
    encodingID: w.encodingID,
    languageID: w.languageID,
    nameID: w.nameID,
    bytes: og(w.value, w.platformID, w.encodingID)
  })), i = s.map((w) => Es(w.tag)), r = 6, a = 12, u = n === 1 ? (n === 1 ? 2 : 0) + s.length * 4 : 0, l = r + o.length * a + u, g = [];
  let p = 0;
  const h = /* @__PURE__ */ new Map();
  function d(w) {
    const _ = w.join(",");
    if (h.has(_))
      return h.get(_);
    const v = p;
    return h.set(_, v), g.push(w), p += w.length, v;
  }
  const x = o.map((w) => ({
    ...w,
    stringOffset: d(w.bytes),
    stringLength: w.bytes.length
  })), m = i.map((w) => ({
    stringOffset: d(w),
    stringLength: w.length
  })), y = l + p, S = new k(y);
  S.uint16(n), S.uint16(o.length), S.uint16(l);
  for (const w of x)
    S.uint16(w.platformID).uint16(w.encodingID).uint16(w.languageID).uint16(w.nameID).uint16(w.stringLength).uint16(w.stringOffset);
  if (n === 1) {
    S.uint16(m.length);
    for (const w of m)
      S.uint16(w.stringLength).uint16(w.stringOffset);
  }
  for (const w of g)
    S.rawBytes(w);
  return S.toArray();
}
const oa = 78, ia = 86, ra = 96, aa = 100;
function fg(t) {
  const n = new B(t), e = t.length, s = {};
  return s.version = n.uint16(), s.xAvgCharWidth = n.fword(), s.usWeightClass = n.uint16(), s.usWidthClass = n.uint16(), s.fsType = n.uint16(), s.ySubscriptXSize = n.fword(), s.ySubscriptYSize = n.fword(), s.ySubscriptXOffset = n.fword(), s.ySubscriptYOffset = n.fword(), s.ySuperscriptXSize = n.fword(), s.ySuperscriptYSize = n.fword(), s.ySuperscriptXOffset = n.fword(), s.ySuperscriptYOffset = n.fword(), s.yStrikeoutSize = n.fword(), s.yStrikeoutPosition = n.fword(), s.sFamilyClass = n.int16(), s.panose = n.bytes(10), s.ulUnicodeRange1 = n.uint32(), s.ulUnicodeRange2 = n.uint32(), s.ulUnicodeRange3 = n.uint32(), s.ulUnicodeRange4 = n.uint32(), s.achVendID = n.tag(), s.fsSelection = n.uint16(), s.usFirstCharIndex = n.uint16(), s.usLastCharIndex = n.uint16(), e < oa || (s.sTypoAscender = n.fword(), s.sTypoDescender = n.fword(), s.sTypoLineGap = n.fword(), s.usWinAscent = n.ufword(), s.usWinDescent = n.ufword(), s.version < 1 || e < ia) || (s.ulCodePageRange1 = n.uint32(), s.ulCodePageRange2 = n.uint32(), s.version < 2 || e < ra) || (s.sxHeight = n.fword(), s.sCapHeight = n.fword(), s.usDefaultChar = n.uint16(), s.usBreakChar = n.uint16(), s.usMaxContext = n.uint16(), s.version < 5 || e < aa) || (s.usLowerOpticalPointSize = n.uint16(), s.usUpperOpticalPointSize = n.uint16()), s;
}
function ug(t) {
  const n = t.version;
  let e;
  n >= 5 ? e = aa : n >= 2 ? e = ra : n >= 1 ? e = ia : e = t.sTypoAscender !== void 0 ? oa : 68;
  const s = new k(e);
  return s.uint16(n).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), e <= 68 || (s.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), n < 1) || (s.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), n < 2) || (s.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), n < 5) || s.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), s.toArray();
}
const lg = 54;
function hg(t) {
  const n = new B(t);
  return {
    version: n.uint32(),
    fontNumber: n.uint32(),
    pitch: n.uint16(),
    xHeight: n.uint16(),
    style: n.uint16(),
    typeFamily: n.uint16(),
    capHeight: n.uint16(),
    symbolSet: n.uint16(),
    typeface: ns(n.bytes(16)),
    characterComplement: ns(n.bytes(8)),
    fileName: ns(n.bytes(6)),
    strokeWeight: n.int8(),
    widthType: n.int8(),
    serifStyle: n.uint8(),
    reserved: n.uint8()
  };
}
function gg(t) {
  const n = new k(lg);
  return n.uint32(t.version ?? 65536), n.uint32(t.fontNumber ?? 0), n.uint16(t.pitch ?? 0), n.uint16(t.xHeight ?? 0), n.uint16(t.style ?? 0), n.uint16(t.typeFamily ?? 0), n.uint16(t.capHeight ?? 0), n.uint16(t.symbolSet ?? 0), n.rawBytes(es(t.typeface ?? "", 16)), n.rawBytes(es(t.characterComplement ?? "", 8)), n.rawBytes(es(t.fileName ?? "", 6)), n.int8(t.strokeWeight ?? 0), n.int8(t.widthType ?? 0), n.uint8(t.serifStyle ?? 0), n.uint8(t.reserved ?? 0), n.toArray();
}
function ns(t) {
  return String.fromCharCode(...t).replace(/\0+$/g, "");
}
function es(t, n) {
  const e = new Array(n).fill(0);
  for (let s = 0; s < n && s < t.length; s++) {
    const o = t.charCodeAt(s);
    e[s] = o >= 0 && o <= 127 ? o : 63;
  }
  return e;
}
const oo = 32, Ts = [
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
], ca = new Map(
  Ts.map((t, n) => [t, n])
);
function pg(t) {
  const n = new B(t), e = n.uint32(), s = n.fixed(), o = n.fword(), i = n.fword(), r = n.uint32(), a = n.uint32(), c = n.uint32(), f = n.uint32(), u = n.uint32(), l = {
    version: e,
    italicAngle: s,
    underlinePosition: o,
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
      const S = n.uint8(), w = n.bytes(S);
      x.push(String.fromCharCode(...w));
    }
    const m = p.map((y) => y < 258 ? Ts[y] : x[y - 258]);
    return l.glyphNames = m, l;
  }
  if (e === 151552) {
    const g = n.uint16(), h = n.array("int8", g).map(
      (d, x) => Ts[x + d]
    );
    return l.glyphNames = h, l;
  }
  return l;
}
function dg(t) {
  const { version: n } = t;
  return n === 65536 || n === 196608 ? ai(t) : n === 131072 ? mg(t) : n === 151552 ? yg(t) : ai(t);
}
function ai(t) {
  const n = new k(oo);
  return n.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), n.toArray();
}
function mg(t) {
  const { glyphNames: n } = t, e = n.length, s = [], o = [], i = /* @__PURE__ */ new Map();
  for (const f of n) {
    const u = ca.get(f);
    u !== void 0 ? s.push(u) : (i.has(f) || (i.set(f, o.length), o.push(f)), s.push(258 + i.get(f)));
  }
  let r = 0;
  for (const f of o)
    r += 1 + f.length;
  const a = oo + 2 + e * 2 + r, c = new k(a);
  c.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), c.uint16(e);
  for (const f of s)
    c.uint16(f);
  for (const f of o) {
    c.uint8(f.length);
    for (let u = 0; u < f.length; u++)
      c.uint8(f.charCodeAt(u));
  }
  return c.toArray();
}
function yg(t) {
  const { glyphNames: n } = t, e = n.length, s = oo + 2 + e, o = new k(s);
  o.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), o.uint16(e);
  for (let i = 0; i < e; i++) {
    const r = n[i], c = ca.get(r) - i;
    o.int8(c);
  }
  return o.toArray();
}
function xg(t, n) {
  const e = new B(t), s = e.uint16(), o = e.uint16(), i = e.uint32(), r = e.array("uint32", i);
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
      const m = u + h[x], y = u + h[x + 1], S = y - m;
      if (S <= 0) {
        d.push(null);
        continue;
      }
      e.seek(m);
      const w = e.int16(), _ = e.int16(), v = e.tag(), b = S > 8 ? t.slice(m + 8, y) : [];
      d.push({ originOffsetX: w, originOffsetY: _, graphicType: v, imageData: b });
    }
    c.push({ ppem: g, ppi: p, glyphs: d });
  }
  return { version: s, flags: o, strikes: c };
}
function wg(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, s = t.strikes ?? [], o = s.map((f) => f._raw ? f._raw : _g(f));
  let r = 8 + s.length * 4;
  const a = [];
  for (const f of o)
    a.push(r), r += f.length;
  const c = new k(r);
  c.uint16(n), c.uint16(e), c.uint32(s.length);
  for (const f of a)
    c.uint32(f);
  for (const f of o)
    c.rawBytes(f);
  return c.toArray();
}
function _g(t) {
  const n = t.glyphs ?? [], e = n.length, s = n.map((u) => {
    if (!u) return [];
    const l = u.imageData ?? [], g = new k(8 + l.length);
    return g.int16(u.originOffsetX ?? 0), g.int16(u.originOffsetY ?? 0), g.tag(u.graphicType ?? "png "), g.rawBytes(l), g.toArray();
  });
  let r = 4 + (e + 1) * 4;
  const a = [];
  for (const u of s)
    a.push(r), r += u.length;
  a.push(r);
  const c = r, f = new k(c);
  f.uint16(t.ppem ?? 0), f.uint16(t.ppi ?? 0);
  for (const u of a)
    f.uint32(u);
  for (const u of s)
    f.rawBytes(u);
  return f.toArray();
}
const Sg = 18, fa = 20, sn = 8;
function bg(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = n.uint16(), r = n.offset32(), a = n.uint16(), c = n.offset32();
  let f;
  s >= 1 && t.length >= fa && (f = n.uint16());
  const u = [];
  if (i > 0 && r > 0)
    for (let h = 0; h < i; h++) {
      n.seek(r + h * o);
      const d = {
        axisTag: n.tag(),
        axisNameID: n.uint16(),
        axisOrdering: n.uint16()
      };
      o > sn && (d._extra = n.bytes(o - sn)), u.push(d);
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
    g.push(vg(t, x, m));
  }
  const p = {
    majorVersion: e,
    minorVersion: s,
    designAxisSize: o,
    designAxes: u,
    axisValues: g
  };
  return f !== void 0 && (p.elidedFallbackNameID = f), p;
}
function vg(t, n, e) {
  const s = new B(t);
  s.seek(n);
  const o = s.uint16();
  switch (o) {
    case 1:
      return {
        format: o,
        axisIndex: s.uint16(),
        flags: s.uint16(),
        valueNameID: s.uint16(),
        value: s.fixed()
      };
    case 2:
      return {
        format: o,
        axisIndex: s.uint16(),
        flags: s.uint16(),
        valueNameID: s.uint16(),
        nominalValue: s.fixed(),
        rangeMinValue: s.fixed(),
        rangeMaxValue: s.fixed()
      };
    case 3:
      return {
        format: o,
        axisIndex: s.uint16(),
        flags: s.uint16(),
        valueNameID: s.uint16(),
        value: s.fixed(),
        linkedValue: s.fixed()
      };
    case 4: {
      const i = s.uint16(), r = s.uint16(), a = s.uint16(), c = [];
      for (let f = 0; f < i; f++)
        c.push({
          axisIndex: s.uint16(),
          value: s.fixed()
        });
      return {
        format: o,
        axisCount: i,
        flags: r,
        valueNameID: a,
        axisValues: c
      };
    }
    default:
      return {
        format: o,
        _raw: Array.from(t.slice(n, e))
      };
  }
}
function kg(t) {
  const n = t.majorVersion ?? 1;
  let e = t.minorVersion ?? 2;
  const s = t.designAxes ?? [], o = t.axisValues ?? [], i = t.designAxisSize ?? sn, r = s.reduce((v, b) => {
    const E = b._extra?.length ?? 0;
    return Math.max(v, sn + E);
  }, sn), a = Math.max(
    i,
    r
  ), c = e >= 1 || t.elidedFallbackNameID !== void 0;
  c && e === 0 && (e = 1);
  const f = c ? fa : Sg, u = s.length, l = o.length, g = u > 0 ? f : 0, p = u * a, h = l > 0 ? f + p : 0, d = l * 2, x = o.map(
    (v) => Cg(v)
  );
  let m = d;
  const y = x.map((v) => {
    const b = m;
    return m += v.length, b;
  }), S = x.reduce(
    (v, b) => v + b.length,
    0
  ), w = f + p + d + S, _ = new k(w);
  _.uint16(n), _.uint16(e), _.uint16(a), _.uint16(u), _.offset32(g), _.uint16(l), _.offset32(h), c && _.uint16(t.elidedFallbackNameID ?? 2);
  for (const v of s) {
    _.tag(v.axisTag), _.uint16(v.axisNameID ?? 0), _.uint16(v.axisOrdering ?? 0);
    const b = v._extra ?? [];
    _.rawBytes(b);
    const E = a - sn - b.length;
    E > 0 && _.rawBytes(new Array(E).fill(0));
  }
  for (const v of y)
    _.offset16(v);
  for (const v of x)
    _.rawBytes(v);
  return _.toArray();
}
function Cg(t) {
  if (t._raw)
    return t._raw;
  switch (t.format) {
    case 1: {
      const n = new k(12);
      return n.uint16(1), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.value ?? 0), n.toArray();
    }
    case 2: {
      const n = new k(20);
      return n.uint16(2), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.nominalValue ?? 0), n.fixed(t.rangeMinValue ?? 0), n.fixed(t.rangeMaxValue ?? 0), n.toArray();
    }
    case 3: {
      const n = new k(16);
      return n.uint16(3), n.uint16(t.axisIndex ?? 0), n.uint16(t.flags ?? 0), n.uint16(t.valueNameID ?? 0), n.fixed(t.value ?? 0), n.fixed(t.linkedValue ?? 0), n.toArray();
    }
    case 4: {
      const n = t.axisValues ?? [], e = t.axisCount ?? n.length, s = new k(8 + e * 6);
      s.uint16(4), s.uint16(e), s.uint16(t.flags ?? 0), s.uint16(t.valueNameID ?? 0);
      for (let o = 0; o < e; o++) {
        const i = n[o] ?? { axisIndex: 0, value: 0 };
        s.uint16(i.axisIndex ?? 0), s.fixed(i.value ?? 0);
      }
      return s.toArray();
    }
    default:
      throw new Error(
        `Unsupported STAT axis value format: ${t.format}`
      );
  }
}
function Ag(t) {
  const n = new B(t), e = n.uint16(), s = n.uint32();
  n.uint32(), n.seek(s);
  const o = n.uint16(), i = [];
  for (let u = 0; u < o; u++)
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
      const g = s + u.svgDocOffset, p = t.slice(g, g + u.svgDocLength), h = p.length >= 3 && p[0] === 31 && p[1] === 139 && p[2] === 8, d = c.length;
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
function Og(t) {
  const { version: n, documents: e, entries: s } = t, o = new TextEncoder(), i = e.map((h) => h.compressed ? h.data instanceof Uint8Array ? Array.from(h.data) : h.data : Array.from(o.encode(h.text))), a = 10, c = s.length;
  let u = 2 + c * 12;
  const l = [];
  for (let h = 0; h < i.length; h++) {
    const d = i[h];
    l.push({ offset: u, length: d.length }), u += d.length;
  }
  const g = a + u, p = new k(g);
  p.uint16(n), p.uint32(a), p.uint32(0), p.uint16(c);
  for (const h of s) {
    const d = l[h.documentIndex];
    p.uint16(h.startGlyphID), p.uint16(h.endGlyphID), p.uint32(d.offset), p.uint32(d.length);
  }
  for (const h of i)
    for (const d of h)
      p.uint8(d);
  return p.toArray();
}
const Ig = 6, Eg = 4, Tg = 2, ua = 6;
function Dg(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.uint16(), i = [];
  for (let l = 0; l < o; l++)
    i.push({
      bCharSet: n.uint8(),
      xRatio: n.uint8(),
      yStartRatio: n.uint8(),
      yEndRatio: n.uint8()
    });
  const r = [];
  for (let l = 0; l < o; l++)
    r.push(n.offset16());
  const a = [...new Set(r)].sort((l, g) => l - g), c = a.map((l) => Mg(t, l)), f = new Map(
    a.map((l, g) => [l, g])
  ), u = i.map((l, g) => ({
    ...l,
    groupIndex: f.get(r[g]) ?? 0
  }));
  return {
    version: e,
    numRecs: s,
    numRatios: o,
    ratios: u,
    groups: c
  };
}
function Bg(t) {
  const n = t.version ?? 0, e = t.ratios ?? [], s = t.groups ?? [], o = s.map((u) => Lg(u)), i = t.numRecs ?? Math.max(0, ...s.map((u) => (u.entries ?? []).length)), r = e.length;
  let a = Ig + r * Eg + r * Tg;
  const c = o.map((u) => {
    const l = a;
    return a += u.length, l;
  }), f = new k(a);
  f.uint16(n), f.uint16(i), f.uint16(r);
  for (const u of e)
    f.uint8(u.bCharSet ?? 0), f.uint8(u.xRatio ?? 0), f.uint8(u.yStartRatio ?? 0), f.uint8(u.yEndRatio ?? 0);
  for (const u of e) {
    const l = u.groupIndex ?? 0, g = c[l] ?? 0;
    f.offset16(g);
  }
  for (const u of o)
    f.rawBytes(u);
  return f.toArray();
}
function Mg(t, n) {
  if (!n || n >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const e = new B(t, n), s = e.uint16(), o = e.uint8(), i = e.uint8(), r = [];
  for (let a = 0; a < s && !(e.position + ua > t.length); a++)
    r.push({
      yPelHeight: e.uint16(),
      yMax: e.int16(),
      yMin: e.int16()
    });
  return { recs: s, startsz: o, endsz: i, entries: r };
}
function Lg(t) {
  const n = t.entries ?? [], e = t.recs ?? n.length, s = n.slice(0, e);
  for (; s.length < e; )
    s.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const o = new k(4 + e * ua);
  o.uint16(e), o.uint8(t.startsz ?? 0), o.uint8(t.endsz ?? 0);
  for (const i of s)
    o.uint16(i.yPelHeight ?? 0), o.int16(i.yMax ?? 0), o.int16(i.yMin ?? 0);
  return o.toArray();
}
const Rg = 36;
function zg(t) {
  const n = new B(t);
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
function Fg(t) {
  const n = new k(Rg);
  return n.uint32(t.version), n.fword(t.vertTypoAscender), n.fword(t.vertTypoDescender), n.fword(t.vertTypoLineGap), n.ufword(t.advanceHeightMax), n.fword(t.minTopSideBearing), n.fword(t.minBottomSideBearing), n.fword(t.yMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numOfLongVerMetrics), n.toArray();
}
function Vg(t, n) {
  const e = n.vhea.numOfLongVerMetrics, s = n.maxp.numGlyphs, o = new B(t), i = [];
  for (let c = 0; c < e; c++)
    i.push({
      advanceHeight: o.ufword(),
      topSideBearing: o.fword()
    });
  const r = s - e, a = o.array("fword", r);
  return { vMetrics: i, topSideBearings: a };
}
function Pg(t) {
  const { vMetrics: n, topSideBearings: e } = t, s = n.length * 4 + e.length * 2, o = new k(s);
  for (const i of n)
    o.ufword(i.advanceHeight), o.fword(i.topSideBearing);
  return o.array("fword", e), o.toArray();
}
const Ug = 24, la = 15, ha = 48;
function Gg(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = n.offset32(), i = n.offset32(), r = n.offset32(), a = n.offset32(), c = n.offset32(), f = [
    o,
    i,
    r,
    a,
    c
  ];
  return {
    majorVersion: e,
    minorVersion: s,
    itemVariationStore: o ? ln(
      t.slice(
        o,
        ga(
          t.length,
          o,
          f
        )
      )
    ) : null,
    advanceHeightMapping: ee(
      t,
      i,
      f
    ),
    tsbMapping: ee(
      t,
      r,
      f
    ),
    bsbMapping: ee(
      t,
      a,
      f
    ),
    vOrgMapping: ee(
      t,
      c,
      f
    )
  };
}
function ee(t, n, e) {
  if (!n)
    return null;
  const s = ga(t.length, n, e);
  if (s <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const o = Array.from(t.slice(n, s));
  return {
    ...Ng(o),
    _raw: o
  };
}
function ga(t, n, e) {
  return e.filter((o) => o > n).sort((o, i) => o - i)[0] ?? t;
}
function Ng(t) {
  const n = new B(t), e = n.uint8(), s = n.uint8(), o = e === 1 ? n.uint32() : n.uint16(), i = (s & la) + 1, r = ((s & ha) >> 4) + 1, a = [];
  for (let c = 0; c < o; c++) {
    const f = Yg(n, r);
    a.push(jg(f, i));
  }
  return {
    format: e,
    entryFormat: s,
    mapCount: o,
    entries: a
  };
}
function $g(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.itemVariationStore ? Wn(t.itemVariationStore) : [], o = se(
    t.advanceHeightMapping
  ), i = se(t.tsbMapping), r = se(t.bsbMapping), a = se(t.vOrgMapping);
  let c = Ug;
  const f = s.length ? c : 0;
  c += s.length;
  const u = o.length ? c : 0;
  c += o.length;
  const l = i.length ? c : 0;
  c += i.length;
  const g = r.length ? c : 0;
  c += r.length;
  const p = a.length ? c : 0;
  c += a.length;
  const h = new k(c);
  return h.uint16(n), h.uint16(e), h.offset32(f), h.offset32(u), h.offset32(l), h.offset32(g), h.offset32(p), h.rawBytes(s), h.rawBytes(o), h.rawBytes(i), h.rawBytes(r), h.rawBytes(a), h.toArray();
}
function se(t) {
  return t ? t._raw ? t._raw : Hg(t) : [];
}
function Hg(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, s = Wg(n), o = t.format ?? (e > 65535 ? 1 : 0), i = t.entryFormat ?? s.entryFormat, r = (i & la) + 1, a = ((i & ha) >> 4) + 1, c = o === 1 ? 6 : 4, f = new k(c + e * a);
  f.uint8(o), f.uint8(i), o === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, g = Zg(l, r);
    Xg(f, g, a);
  }
  return f.toArray();
}
function Zg(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function jg(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function Wg(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let s = 1;
  for (; (1 << s) - 1 < n && s < 16; )
    s++;
  const o = e << s | n;
  let i = 1;
  for (; i < 4 && o > qg(i); )
    i++;
  return { entryFormat: i - 1 << 4 | s - 1 };
}
function qg(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function Yg(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function Xg(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const Me = 32768, Le = 4095, Re = 32768, ze = 16384, Fe = 8192, Kg = 4095, pa = 128, Jg = 127, da = 128, ma = 64, Qg = 63;
function xe(t) {
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
  const s = [];
  let o = 0;
  for (; s.length < e; ) {
    const i = t.uint8(), r = (i & Jg) + 1, a = (i & pa) !== 0;
    for (let c = 0; c < r && s.length < e; c++) {
      const f = a ? t.uint16() : t.uint8();
      o += f, s.push(o);
    }
  }
  return s;
}
function we(t) {
  if (t === null)
    return [0];
  const n = t.length, e = [];
  n < 128 ? e.push(n) : (e.push(128 | n >> 8), e.push(n & 255));
  const s = [];
  let o = 0;
  for (const r of t)
    s.push(r - o), o = r;
  let i = 0;
  for (; i < s.length; ) {
    const r = s[i] > 255;
    let a = 1;
    const c = Math.min(128, s.length - i);
    for (; a < c && s[i + a] > 255 === r; )
      a++;
    const f = (r ? pa : 0) | a - 1;
    e.push(f);
    for (let u = 0; u < a; u++) {
      const l = s[i + u];
      r ? e.push(l >> 8 & 255, l & 255) : e.push(l & 255);
    }
    i += a;
  }
  return e;
}
function ya(t, n) {
  const e = [];
  for (; e.length < n; ) {
    const s = t.uint8(), o = (s & Qg) + 1;
    if (s & da)
      for (let i = 0; i < o && e.length < n; i++)
        e.push(0);
    else if (s & ma)
      for (let i = 0; i < o && e.length < n; i++)
        e.push(t.int16());
    else
      for (let i = 0; i < o && e.length < n; i++)
        e.push(t.int8());
  }
  return e;
}
function xa(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; )
    if (t[e] === 0) {
      let s = 1;
      const o = Math.min(64, t.length - e);
      for (; s < o && t[e + s] === 0; )
        s++;
      n.push(da | s - 1), e += s;
    } else if (t[e] < -128 || t[e] > 127) {
      let s = 1;
      const o = Math.min(64, t.length - e);
      for (; s < o; ) {
        const i = t[e + s];
        if (i === 0 || i >= -128 && i <= 127) break;
        s++;
      }
      n.push(ma | s - 1);
      for (let i = 0; i < s; i++) {
        const r = t[e + i] & 65535;
        n.push(r >> 8 & 255, r & 255);
      }
      e += s;
    } else {
      let s = 1;
      const o = Math.min(64, t.length - e);
      for (; s < o; ) {
        const i = t[e + s];
        if (i === 0 || i < -128 || i > 127) break;
        s++;
      }
      n.push(s - 1);
      for (let i = 0; i < s; i++)
        n.push(t[e + i] & 255);
      e += s;
    }
  return n;
}
function tp(t, n, e, s) {
  if (!t || t.length === 0) return [];
  const o = new B(t), i = o.uint16(), r = o.offset16(), a = i & Le, c = (i & Me) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let g = 0; g < a; g++) {
    const p = o.uint16(), h = o.uint16();
    let d;
    if (h & Re)
      d = o.array("f2dot14", n);
    else {
      const y = h & Kg;
      d = e[y] ?? new Array(n).fill(0);
    }
    let x = null, m = null;
    h & ze && (x = o.array("f2dot14", n), m = o.array("f2dot14", n)), f.push({
      variationDataSize: p,
      tupleIndex: h,
      peakTuple: d,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (h & Fe) !== 0
    });
  }
  o.seek(r);
  let u = null;
  c && (u = xe(o));
  const l = [];
  for (const g of f) {
    const h = o.position + g.variationDataSize;
    let d;
    g.hasPrivatePoints ? d = xe(o) : d = u;
    const x = d === null ? s : d.length, m = x * 2, y = ya(o, m);
    l.push({
      peakTuple: g.peakTuple,
      intermediateStartTuple: g.intermediateStartTuple,
      intermediateEndTuple: g.intermediateEndTuple,
      pointIndices: d,
      xDeltas: y.slice(0, x),
      yDeltas: y.slice(x)
    }), o.seek(h);
  }
  return l;
}
function np(t, n) {
  if (!t || t.length === 0) return [];
  const e = t.length, o = t.every(
    (h) => JSON.stringify(h.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && e > 1, i = [];
  let r = [];
  o && (r = we(t[0].pointIndices), i.push(r));
  const a = [];
  for (const h of t) {
    const d = [];
    o || d.push(...we(h.pointIndices));
    const x = [...h.xDeltas ?? [], ...h.yDeltas ?? []];
    d.push(...xa(x)), a.push(d.length), i.push(d);
  }
  const c = [];
  for (const h of i)
    c.push(...h);
  const f = [];
  for (let h = 0; h < e; h++) {
    const d = t[h];
    let x = Re;
    o || (x |= Fe), d.intermediateStartTuple && (x |= ze);
    const m = [];
    m.push(a[h] >> 8 & 255), m.push(a[h] & 255), m.push(x >> 8 & 255), m.push(x & 255);
    for (let y = 0; y < n; y++) {
      const S = Math.round((d.peakTuple[y] ?? 0) * 16384) & 65535;
      m.push(S >> 8 & 255, S & 255);
    }
    if (d.intermediateStartTuple) {
      for (let y = 0; y < n; y++) {
        const S = Math.round((d.intermediateStartTuple[y] ?? 0) * 16384) & 65535;
        m.push(S >> 8 & 255, S & 255);
      }
      for (let y = 0; y < n; y++) {
        const S = Math.round((d.intermediateEndTuple[y] ?? 0) * 16384) & 65535;
        m.push(S >> 8 & 255, S & 255);
      }
    }
    f.push(m);
  }
  const u = [];
  for (const h of f)
    u.push(...h);
  const l = (o ? Me : 0) | e & Le, g = 4 + u.length, p = [];
  return p.push(l >> 8 & 255), p.push(l & 255), p.push(g >> 8 & 255), p.push(g & 255), p.push(...u), p.push(...c), p;
}
function ep(t, n, e) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const s = new B(t), o = s.uint16(), i = s.uint16(), r = s.uint16(), a = s.offset16(), c = r & Le, f = (r & Me) !== 0;
  if (c === 0)
    return { majorVersion: o, minorVersion: i, tupleVariations: [] };
  const u = [];
  for (let p = 0; p < c; p++) {
    const h = s.uint16(), d = s.uint16();
    let x = null;
    d & Re && (x = s.array("f2dot14", n));
    let m = null, y = null;
    d & ze && (m = s.array("f2dot14", n), y = s.array("f2dot14", n)), u.push({
      variationDataSize: h,
      tupleIndex: d,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (d & Fe) !== 0
    });
  }
  s.seek(a);
  let l = null;
  f && (l = xe(s));
  const g = [];
  for (const p of u) {
    const d = s.position + p.variationDataSize;
    let x;
    p.hasPrivatePoints ? x = xe(s) : x = l;
    const m = x === null ? e : x.length, y = ya(s, m);
    g.push({
      peakTuple: p.peakTuple,
      intermediateStartTuple: p.intermediateStartTuple,
      intermediateEndTuple: p.intermediateEndTuple,
      pointIndices: x,
      deltas: y
    }), s.seek(d);
  }
  return { majorVersion: o, minorVersion: i, tupleVariations: g };
}
function sp(t, n) {
  const e = t.majorVersion ?? 1, s = t.minorVersion ?? 0, o = t.tupleVariations ?? [], i = o.length;
  if (i === 0) {
    const x = new k(8);
    return x.uint16(e), x.uint16(s), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = o.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(o[0].pointIndices)
  ) && i > 1, c = [];
  a && c.push(
    we(o[0].pointIndices)
  );
  const f = [];
  for (const x of o) {
    const m = [];
    a || m.push(...we(x.pointIndices)), m.push(...xa(x.deltas ?? [])), f.push(m.length), c.push(m);
  }
  const u = [];
  for (const x of c)
    u.push(...x);
  const l = [];
  for (let x = 0; x < i; x++) {
    const m = o[x];
    let y = Re;
    a || (y |= Fe), m.intermediateStartTuple && (y |= ze), l.push(f[x] >> 8 & 255), l.push(f[x] & 255), l.push(y >> 8 & 255), l.push(y & 255);
    for (let S = 0; S < n; S++) {
      const w = Math.round((m.peakTuple[S] ?? 0) * 16384) & 65535;
      l.push(w >> 8 & 255, w & 255);
    }
    if (m.intermediateStartTuple) {
      for (let S = 0; S < n; S++) {
        const w = Math.round((m.intermediateStartTuple[S] ?? 0) * 16384) & 65535;
        l.push(w >> 8 & 255, w & 255);
      }
      for (let S = 0; S < n; S++) {
        const w = Math.round((m.intermediateEndTuple[S] ?? 0) * 16384) & 65535;
        l.push(w >> 8 & 255, w & 255);
      }
    }
  }
  const g = (a ? Me : 0) | i & Le, p = 8 + l.length, h = p + u.length, d = new k(h);
  return d.uint16(e), d.uint16(s), d.uint16(g), d.offset16(p), d.rawBytes(l), d.rawBytes(u), d.toArray();
}
function op(t, n = {}) {
  const e = n.fvar?.axes?.length ?? 0, s = n["cvt "]?.values?.length ?? 0;
  return ep(t, e, s);
}
function ip(t) {
  const n = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return sp(t, n);
}
function rp(t) {
  const n = new B(t), e = t.length >>> 1;
  return { values: n.array("fword", e) };
}
function ap(t) {
  const n = t.values, e = new k(n.length * 2);
  return e.array("fword", n), e.toArray();
}
function cp(t) {
  return { instructions: Array.from(t) };
}
function fp(t) {
  return Array.from(t.instructions);
}
function up(t) {
  const n = new B(t), e = n.uint16(), s = n.uint16(), o = [];
  for (let i = 0; i < s; i++)
    o.push({
      rangeMaxPPEM: n.uint16(),
      rangeGaspBehavior: n.uint16()
    });
  return { version: e, gaspRanges: o };
}
function lp(t) {
  const { version: n, gaspRanges: e } = t, s = new k(4 + e.length * 4);
  s.uint16(n), s.uint16(e.length);
  for (const o of e)
    s.uint16(o.rangeMaxPPEM), s.uint16(o.rangeGaspBehavior);
  return s.toArray();
}
const wa = 1, _a = 2, Sa = 4, ba = 8, _e = 16, Se = 32, va = 64, Ln = 1, be = 2, ka = 4, io = 8, Ds = 32, ro = 64, ao = 128, Rn = 256, Ca = 512, Aa = 1024, Oa = 2048, Ia = 4096;
function hp(t, n) {
  const e = n.loca.offsets, s = n.maxp.numGlyphs, o = new B(t), i = [];
  for (let r = 0; r < s; r++) {
    const a = e[r], c = e[r + 1];
    if (a === c) {
      i.push(null);
      continue;
    }
    o.seek(a);
    const f = o.int16(), u = o.int16(), l = o.int16(), g = o.int16(), p = o.int16();
    f >= 0 ? i.push(
      gp(o, f, u, l, g, p)
    ) : i.push(pp(o, u, l, g, p));
  }
  return { glyphs: i };
}
function gp(t, n, e, s, o, i) {
  const r = t.array("uint16", n), a = n > 0 ? r[n - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), u = [];
  for (; u.length < a; ) {
    const y = t.uint8();
    if (u.push(y), y & ba) {
      const S = t.uint8();
      for (let w = 0; w < S; w++)
        u.push(y);
    }
  }
  const l = new Array(a);
  let g = 0;
  for (let y = 0; y < a; y++) {
    const S = u[y];
    if (S & _a) {
      const w = t.uint8();
      g += S & _e ? w : -w;
    } else S & _e || (g += t.int16());
    l[y] = g;
  }
  const p = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const S = u[y];
    if (S & Sa) {
      const w = t.uint8();
      h += S & Se ? w : -w;
    } else S & Se || (h += t.int16());
    p[y] = h;
  }
  const d = a > 0 && (u[0] & va) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < n; y++) {
    const S = r[y], w = [];
    for (; m <= S; )
      w.push({
        x: l[m],
        y: p[m],
        onCurve: (u[m] & wa) !== 0
      }), m++;
    x.push(w);
  }
  return {
    type: "simple",
    xMin: e,
    yMin: s,
    xMax: o,
    yMax: i,
    contours: x,
    instructions: f,
    overlapSimple: d
  };
}
function pp(t, n, e, s, o) {
  const i = [];
  let r, a = !1;
  do {
    r = t.uint16();
    const f = t.uint16();
    let u, l;
    r & Ln ? r & be ? (u = t.int16(), l = t.int16()) : (u = t.uint16(), l = t.uint16()) : r & be ? (u = t.int8(), l = t.int8()) : (u = t.uint8(), l = t.uint8());
    const g = {
      glyphIndex: f,
      flags: dp(r),
      argument1: u,
      argument2: l
    };
    r & io ? g.transform = { scale: t.f2dot14() } : r & ro ? g.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : r & ao && (g.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), i.push(g), r & Rn && (a = !0);
  } while (r & Ds);
  let c = [];
  if (a) {
    const f = t.uint16();
    c = t.bytes(f);
  }
  return {
    type: "composite",
    xMin: n,
    yMin: e,
    xMax: s,
    yMax: o,
    components: i,
    instructions: c
  };
}
function dp(t) {
  const n = {};
  return t & Ln && (n.argsAreWords = !0), t & be && (n.argsAreXYValues = !0), t & ka && (n.roundXYToGrid = !0), t & io && (n.weHaveAScale = !0), t & ro && (n.weHaveAnXAndYScale = !0), t & ao && (n.weHaveATwoByTwo = !0), t & Rn && (n.weHaveInstructions = !0), t & Ca && (n.useMyMetrics = !0), t & Aa && (n.overlapCompound = !0), t & Oa && (n.scaledComponentOffset = !0), t & Ia && (n.unscaledComponentOffset = !0), n;
}
function Ea(t) {
  const { glyphs: n } = t, e = [];
  for (const i of n) {
    if (i === null) {
      e.push([]);
      continue;
    }
    i.type === "simple" ? e.push(yp(i)) : e.push(wp(i));
  }
  const s = [], o = [];
  for (const i of e) {
    o.push(s.length);
    for (let r = 0; r < i.length; r++)
      s.push(i[r]);
    i.length % 2 !== 0 && s.push(0);
  }
  return o.push(s.length), { bytes: s, offsets: o };
}
function mp(t) {
  return Ea(t).bytes;
}
function yp(t) {
  const { contours: n, instructions: e, xMin: s, yMin: o, xMax: i, yMax: r, overlapSimple: a } = t, c = n.length, f = [], u = [];
  for (const C of n) {
    for (const I of C)
      f.push(I);
    u.push(f.length - 1);
  }
  const l = f.length, g = f.map((C) => C.x), p = f.map((C) => C.y), h = new Array(l), d = new Array(l);
  for (let C = 0; C < l; C++)
    h[C] = C === 0 ? g[C] : g[C] - g[C - 1], d[C] = C === 0 ? p[C] : p[C] - p[C - 1];
  const x = [], m = [], y = [];
  for (let C = 0; C < l; C++) {
    let I = 0;
    f[C].onCurve && (I |= wa);
    const O = h[C], T = d[C];
    O === 0 ? I |= _e : O >= -255 && O <= 255 ? (I |= _a, O > 0 ? (I |= _e, m.push(O)) : m.push(-O)) : m.push(O >> 8 & 255, O & 255), T === 0 ? I |= Se : T >= -255 && T <= 255 ? (I |= Sa, T > 0 ? (I |= Se, y.push(T)) : y.push(-T)) : y.push(T >> 8 & 255, T & 255), C === 0 && a && (I |= va), x.push(I);
  }
  const S = xp(x), w = 10, _ = c * 2, v = 2, b = e.length, E = w + _ + v + b + S.length + m.length + y.length, A = new k(E);
  return A.int16(c), A.int16(s), A.int16(o), A.int16(i), A.int16(r), A.array("uint16", u), A.uint16(e.length), A.rawBytes(e), A.rawBytes(S), A.rawBytes(m), A.rawBytes(y), A.toArray();
}
function xp(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; ) {
    const s = t[e];
    let o = 0;
    for (; e + 1 + o < t.length && t[e + 1 + o] === s && o < 255; )
      o++;
    o > 0 ? (n.push(s | ba, o), e += 1 + o) : (n.push(s), e++);
  }
  return n;
}
function wp(t) {
  const { components: n, instructions: e, xMin: s, yMin: o, xMax: i, yMax: r } = t;
  let a = 10;
  for (let f = 0; f < n.length; f++) {
    const u = n[f];
    a += 4;
    const l = u.flags.argsAreWords || ci(u.argument1, u.argument2, u.flags.argsAreXYValues);
    a += l ? 4 : 2, u.transform && ("scale" in u.transform ? a += 2 : "scale01" in u.transform ? a += 8 : "xScale" in u.transform && (a += 4));
  }
  e && e.length > 0 && (a += 2 + e.length);
  const c = new k(a);
  c.int16(-1), c.int16(s), c.int16(o), c.int16(i), c.int16(r);
  for (let f = 0; f < n.length; f++) {
    const u = n[f], l = f === n.length - 1;
    let g = _p(u.flags);
    const p = u.flags.argsAreWords || ci(u.argument1, u.argument2, u.flags.argsAreXYValues);
    p ? g |= Ln : g &= ~Ln, l ? g &= ~Ds : g |= Ds, l && e && e.length > 0 ? g |= Rn : l && (g &= ~Rn), c.uint16(g), c.uint16(u.glyphIndex), p ? u.flags.argsAreXYValues ? (c.int16(u.argument1), c.int16(u.argument2)) : (c.uint16(u.argument1), c.uint16(u.argument2)) : u.flags.argsAreXYValues ? (c.int8(u.argument1), c.int8(u.argument2)) : (c.uint8(u.argument1), c.uint8(u.argument2)), u.transform && ("scale" in u.transform ? c.f2dot14(u.transform.scale) : "scale01" in u.transform ? (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.scale01), c.f2dot14(u.transform.scale10), c.f2dot14(u.transform.yScale)) : "xScale" in u.transform && (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.yScale)));
  }
  return e && e.length > 0 && (c.uint16(e.length), c.rawBytes(e)), c.toArray();
}
function ci(t, n, e) {
  return e ? t < -128 || t > 127 || n < -128 || n > 127 : t > 255 || n > 255;
}
function _p(t) {
  let n = 0;
  return t.argsAreWords && (n |= Ln), t.argsAreXYValues && (n |= be), t.roundXYToGrid && (n |= ka), t.weHaveAScale && (n |= io), t.weHaveAnXAndYScale && (n |= ro), t.weHaveATwoByTwo && (n |= ao), t.weHaveInstructions && (n |= Rn), t.useMyMetrics && (n |= Ca), t.overlapCompound && (n |= Aa), t.scaledComponentOffset && (n |= Oa), t.unscaledComponentOffset && (n |= Ia), n;
}
const Sp = 20, Bs = 1;
function bp(t, n = {}) {
  const e = new B(t), s = e.uint16(), o = e.uint16(), i = e.uint16(), r = e.uint16(), a = e.offset32(), c = e.uint16(), f = e.uint16(), u = e.offset32(), l = (f & Bs) !== 0, g = c + 1, p = [];
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
    const m = p[x], y = p[x + 1], S = Math.max(0, y - m);
    if (S === 0) {
      d.push([]);
      continue;
    }
    const w = u + m, _ = t.slice(w, w + S), v = vp(n, x);
    d.push(
      tp(_, i, h, v)
    );
  }
  return {
    majorVersion: s,
    minorVersion: o,
    axisCount: i,
    flags: f,
    sharedTuples: h,
    glyphVariationData: d
  };
}
function vp(t, n) {
  const e = t.glyf?.glyphs?.[n];
  if (!e) return 0;
  if (e.type === "simple" && e.contours) {
    let s = 0;
    for (const o of e.contours)
      s += o.length;
    return s + 4;
  }
  return e.type === "composite" && e.components ? e.components.length + 4 : 0;
}
function kp(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, s = t.axisCount ?? 0, o = t.glyphVariationData ?? [], i = o.length, r = o.map((_) => Array.isArray(_) && (_.length === 0 || typeof _[0] == "number") ? _ : Array.isArray(_) ? np(_, s) : []), a = t.sharedTuples ?? Cp(o, s), c = a.length, f = c * s * 2, u = [0];
  let l = 0;
  for (const _ of r)
    l += _.length, u.push(l);
  const g = u.every(
    (_) => _ % 2 === 0 && _ / 2 <= 65535
  ), p = g ? 2 : 4, h = (i + 1) * p, d = Sp + h, x = d + f, m = x + l, y = t.flags ?? 0, S = g ? y & ~Bs : y | Bs, w = new k(m);
  w.uint16(n), w.uint16(e), w.uint16(s), w.uint16(c), w.offset32(d), w.uint16(i), w.uint16(S), w.offset32(x);
  for (const _ of u)
    g ? w.uint16(_ / 2) : w.uint32(_);
  for (const _ of a)
    for (let v = 0; v < s; v++)
      w.f2dot14(_[v] ?? 0);
  for (const _ of r)
    w.rawBytes(_);
  return w.toArray();
}
function Cp(t, n) {
  if (n === 0) return [];
  const e = /* @__PURE__ */ new Set(), s = [];
  for (const o of t)
    if (Array.isArray(o))
      for (const i of o) {
        if (!i || !i.peakTuple) continue;
        const r = i.peakTuple.map((a) => Math.round((a ?? 0) * 16384)).join(",");
        e.has(r) || (e.add(r), s.push(i.peakTuple));
      }
  return s;
}
function Ap(t, n) {
  const e = n.head.indexToLocFormat, o = n.maxp.numGlyphs + 1, i = new B(t), r = [];
  if (e === 0)
    for (let a = 0; a < o; a++)
      r.push(i.uint16() * 2);
  else
    for (let a = 0; a < o; a++)
      r.push(i.uint32());
  return { offsets: r };
}
function Ta(t) {
  const { offsets: n } = t;
  if (n.every((o) => o % 2 === 0 && o / 2 <= 65535)) {
    const o = new k(n.length * 2);
    for (const i of n)
      o.uint16(i / 2);
    return o.toArray();
  }
  const s = new k(n.length * 4);
  for (const o of n)
    s.uint32(o);
  return s.toArray();
}
function Op(t) {
  return { instructions: Array.from(t) };
}
function Ip(t) {
  return Array.from(t.instructions);
}
const Ep = 4, fi = 0, ui = 1, Tp = 2;
function mn(t) {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}
const Dp = 0, Da = 1, Bp = 2, Mp = 3, Lp = 258, co = 29, Yn = 256, zn = Yn + 1 + co, an = 30, fo = 19, Ba = 2 * zn + 1, Vt = 15, ss = 16, Rp = 7, uo = 256, Ma = 16, La = 17, Ra = 18, Ms = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), ge = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), zp = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), za = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), Fp = 512, _t = new Array((zn + 2) * 2);
mn(_t);
const Tn = new Array(an * 2);
mn(Tn);
const Fn = new Array(Fp);
mn(Fn);
const Vn = new Array(Lp - Mp + 1);
mn(Vn);
const lo = new Array(co);
mn(lo);
const ve = new Array(an);
mn(ve);
function os(t, n, e, s, o) {
  this.static_tree = t, this.extra_bits = n, this.extra_base = e, this.elems = s, this.max_length = o, this.has_stree = t && t.length;
}
let Fa, Va, Pa;
function is(t, n) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = n;
}
const Ua = (t) => t < 256 ? Fn[t] : Fn[256 + (t >>> 7)], Pn = (t, n) => {
  t.pending_buf[t.pending++] = n & 255, t.pending_buf[t.pending++] = n >>> 8 & 255;
}, Q = (t, n, e) => {
  t.bi_valid > ss - e ? (t.bi_buf |= n << t.bi_valid & 65535, Pn(t, t.bi_buf), t.bi_buf = n >> ss - t.bi_valid, t.bi_valid += e - ss) : (t.bi_buf |= n << t.bi_valid & 65535, t.bi_valid += e);
}, ut = (t, n, e) => {
  Q(
    t,
    e[n * 2],
    e[n * 2 + 1]
    /*.Len*/
  );
}, Ga = (t, n) => {
  let e = 0;
  do
    e |= t & 1, t >>>= 1, e <<= 1;
  while (--n > 0);
  return e >>> 1;
}, Vp = (t) => {
  t.bi_valid === 16 ? (Pn(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, Pp = (t, n) => {
  const e = n.dyn_tree, s = n.max_code, o = n.stat_desc.static_tree, i = n.stat_desc.has_stree, r = n.stat_desc.extra_bits, a = n.stat_desc.extra_base, c = n.stat_desc.max_length;
  let f, u, l, g, p, h, d = 0;
  for (g = 0; g <= Vt; g++)
    t.bl_count[g] = 0;
  for (e[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < Ba; f++)
    u = t.heap[f], g = e[e[u * 2 + 1] * 2 + 1] + 1, g > c && (g = c, d++), e[u * 2 + 1] = g, !(u > s) && (t.bl_count[g]++, p = 0, u >= a && (p = r[u - a]), h = e[u * 2], t.opt_len += h * (g + p), i && (t.static_len += h * (o[u * 2 + 1] + p)));
  if (d !== 0) {
    do {
      for (g = c - 1; t.bl_count[g] === 0; )
        g--;
      t.bl_count[g]--, t.bl_count[g + 1] += 2, t.bl_count[c]--, d -= 2;
    } while (d > 0);
    for (g = c; g !== 0; g--)
      for (u = t.bl_count[g]; u !== 0; )
        l = t.heap[--f], !(l > s) && (e[l * 2 + 1] !== g && (t.opt_len += (g - e[l * 2 + 1]) * e[l * 2], e[l * 2 + 1] = g), u--);
  }
}, Na = (t, n, e) => {
  const s = new Array(Vt + 1);
  let o = 0, i, r;
  for (i = 1; i <= Vt; i++)
    o = o + e[i - 1] << 1, s[i] = o;
  for (r = 0; r <= n; r++) {
    let a = t[r * 2 + 1];
    a !== 0 && (t[r * 2] = Ga(s[a]++, a));
  }
}, Up = () => {
  let t, n, e, s, o;
  const i = new Array(Vt + 1);
  for (e = 0, s = 0; s < co - 1; s++)
    for (lo[s] = e, t = 0; t < 1 << Ms[s]; t++)
      Vn[e++] = s;
  for (Vn[e - 1] = s, o = 0, s = 0; s < 16; s++)
    for (ve[s] = o, t = 0; t < 1 << ge[s]; t++)
      Fn[o++] = s;
  for (o >>= 7; s < an; s++)
    for (ve[s] = o << 7, t = 0; t < 1 << ge[s] - 7; t++)
      Fn[256 + o++] = s;
  for (n = 0; n <= Vt; n++)
    i[n] = 0;
  for (t = 0; t <= 143; )
    _t[t * 2 + 1] = 8, t++, i[8]++;
  for (; t <= 255; )
    _t[t * 2 + 1] = 9, t++, i[9]++;
  for (; t <= 279; )
    _t[t * 2 + 1] = 7, t++, i[7]++;
  for (; t <= 287; )
    _t[t * 2 + 1] = 8, t++, i[8]++;
  for (Na(_t, zn + 1, i), t = 0; t < an; t++)
    Tn[t * 2 + 1] = 5, Tn[t * 2] = Ga(t, 5);
  Fa = new os(_t, Ms, Yn + 1, zn, Vt), Va = new os(Tn, ge, 0, an, Vt), Pa = new os(new Array(0), zp, 0, fo, Rp);
}, $a = (t) => {
  let n;
  for (n = 0; n < zn; n++)
    t.dyn_ltree[n * 2] = 0;
  for (n = 0; n < an; n++)
    t.dyn_dtree[n * 2] = 0;
  for (n = 0; n < fo; n++)
    t.bl_tree[n * 2] = 0;
  t.dyn_ltree[uo * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, Ha = (t) => {
  t.bi_valid > 8 ? Pn(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, li = (t, n, e, s) => {
  const o = n * 2, i = e * 2;
  return t[o] < t[i] || t[o] === t[i] && s[n] <= s[e];
}, rs = (t, n, e) => {
  const s = t.heap[e];
  let o = e << 1;
  for (; o <= t.heap_len && (o < t.heap_len && li(n, t.heap[o + 1], t.heap[o], t.depth) && o++, !li(n, s, t.heap[o], t.depth)); )
    t.heap[e] = t.heap[o], e = o, o <<= 1;
  t.heap[e] = s;
}, hi = (t, n, e) => {
  let s, o, i = 0, r, a;
  if (t.sym_next !== 0)
    do
      s = t.pending_buf[t.sym_buf + i++] & 255, s += (t.pending_buf[t.sym_buf + i++] & 255) << 8, o = t.pending_buf[t.sym_buf + i++], s === 0 ? ut(t, o, n) : (r = Vn[o], ut(t, r + Yn + 1, n), a = Ms[r], a !== 0 && (o -= lo[r], Q(t, o, a)), s--, r = Ua(s), ut(t, r, e), a = ge[r], a !== 0 && (s -= ve[r], Q(t, s, a)));
    while (i < t.sym_next);
  ut(t, uo, n);
}, Ls = (t, n) => {
  const e = n.dyn_tree, s = n.stat_desc.static_tree, o = n.stat_desc.has_stree, i = n.stat_desc.elems;
  let r, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = Ba, r = 0; r < i; r++)
    e[r * 2] !== 0 ? (t.heap[++t.heap_len] = c = r, t.depth[r] = 0) : e[r * 2 + 1] = 0;
  for (; t.heap_len < 2; )
    f = t.heap[++t.heap_len] = c < 2 ? ++c : 0, e[f * 2] = 1, t.depth[f] = 0, t.opt_len--, o && (t.static_len -= s[f * 2 + 1]);
  for (n.max_code = c, r = t.heap_len >> 1; r >= 1; r--)
    rs(t, e, r);
  f = i;
  do
    r = t.heap[
      1
      /*SMALLEST*/
    ], t.heap[
      1
      /*SMALLEST*/
    ] = t.heap[t.heap_len--], rs(
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
    ] = f++, rs(
      t,
      e,
      1
      /*SMALLEST*/
    );
  while (t.heap_len >= 2);
  t.heap[--t.heap_max] = t.heap[
    1
    /*SMALLEST*/
  ], Pp(t, n), Na(e, c, t.bl_count);
}, gi = (t, n, e) => {
  let s, o = -1, i, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), n[(e + 1) * 2 + 1] = 65535, s = 0; s <= e; s++)
    i = r, r = n[(s + 1) * 2 + 1], !(++a < c && i === r) && (a < f ? t.bl_tree[i * 2] += a : i !== 0 ? (i !== o && t.bl_tree[i * 2]++, t.bl_tree[Ma * 2]++) : a <= 10 ? t.bl_tree[La * 2]++ : t.bl_tree[Ra * 2]++, a = 0, o = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4));
}, pi = (t, n, e) => {
  let s, o = -1, i, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), s = 0; s <= e; s++)
    if (i = r, r = n[(s + 1) * 2 + 1], !(++a < c && i === r)) {
      if (a < f)
        do
          ut(t, i, t.bl_tree);
        while (--a !== 0);
      else i !== 0 ? (i !== o && (ut(t, i, t.bl_tree), a--), ut(t, Ma, t.bl_tree), Q(t, a - 3, 2)) : a <= 10 ? (ut(t, La, t.bl_tree), Q(t, a - 3, 3)) : (ut(t, Ra, t.bl_tree), Q(t, a - 11, 7));
      a = 0, o = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, Gp = (t) => {
  let n;
  for (gi(t, t.dyn_ltree, t.l_desc.max_code), gi(t, t.dyn_dtree, t.d_desc.max_code), Ls(t, t.bl_desc), n = fo - 1; n >= 3 && t.bl_tree[za[n] * 2 + 1] === 0; n--)
    ;
  return t.opt_len += 3 * (n + 1) + 5 + 5 + 4, n;
}, Np = (t, n, e, s) => {
  let o;
  for (Q(t, n - 257, 5), Q(t, e - 1, 5), Q(t, s - 4, 4), o = 0; o < s; o++)
    Q(t, t.bl_tree[za[o] * 2 + 1], 3);
  pi(t, t.dyn_ltree, n - 1), pi(t, t.dyn_dtree, e - 1);
}, $p = (t) => {
  let n = 4093624447, e;
  for (e = 0; e <= 31; e++, n >>>= 1)
    if (n & 1 && t.dyn_ltree[e * 2] !== 0)
      return fi;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return ui;
  for (e = 32; e < Yn; e++)
    if (t.dyn_ltree[e * 2] !== 0)
      return ui;
  return fi;
};
let di = !1;
const Hp = (t) => {
  di || (Up(), di = !0), t.l_desc = new is(t.dyn_ltree, Fa), t.d_desc = new is(t.dyn_dtree, Va), t.bl_desc = new is(t.bl_tree, Pa), t.bi_buf = 0, t.bi_valid = 0, $a(t);
}, Za = (t, n, e, s) => {
  Q(t, (Dp << 1) + (s ? 1 : 0), 3), Ha(t), Pn(t, e), Pn(t, ~e), e && t.pending_buf.set(t.window.subarray(n, n + e), t.pending), t.pending += e;
}, Zp = (t) => {
  Q(t, Da << 1, 3), ut(t, uo, _t), Vp(t);
}, jp = (t, n, e, s) => {
  let o, i, r = 0;
  t.level > 0 ? (t.strm.data_type === Tp && (t.strm.data_type = $p(t)), Ls(t, t.l_desc), Ls(t, t.d_desc), r = Gp(t), o = t.opt_len + 3 + 7 >>> 3, i = t.static_len + 3 + 7 >>> 3, i <= o && (o = i)) : o = i = e + 5, e + 4 <= o && n !== -1 ? Za(t, n, e, s) : t.strategy === Ep || i === o ? (Q(t, (Da << 1) + (s ? 1 : 0), 3), hi(t, _t, Tn)) : (Q(t, (Bp << 1) + (s ? 1 : 0), 3), Np(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, r + 1), hi(t, t.dyn_ltree, t.dyn_dtree)), $a(t), s && Ha(t);
}, Wp = (t, n, e) => (t.pending_buf[t.sym_buf + t.sym_next++] = n, t.pending_buf[t.sym_buf + t.sym_next++] = n >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = e, n === 0 ? t.dyn_ltree[e * 2]++ : (t.matches++, n--, t.dyn_ltree[(Vn[e] + Yn + 1) * 2]++, t.dyn_dtree[Ua(n) * 2]++), t.sym_next === t.sym_end);
var qp = Hp, Yp = Za, Xp = jp, Kp = Wp, Jp = Zp, Qp = {
  _tr_init: qp,
  _tr_stored_block: Yp,
  _tr_flush_block: Xp,
  _tr_tally: Kp,
  _tr_align: Jp
};
const td = (t, n, e, s) => {
  let o = t & 65535 | 0, i = t >>> 16 & 65535 | 0, r = 0;
  for (; e !== 0; ) {
    r = e > 2e3 ? 2e3 : e, e -= r;
    do
      o = o + n[s++] | 0, i = i + o | 0;
    while (--r);
    o %= 65521, i %= 65521;
  }
  return o | i << 16 | 0;
};
var Un = td;
const nd = () => {
  let t, n = [];
  for (var e = 0; e < 256; e++) {
    t = e;
    for (var s = 0; s < 8; s++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    n[e] = t;
  }
  return n;
}, ed = new Uint32Array(nd()), sd = (t, n, e, s) => {
  const o = ed, i = s + e;
  t ^= -1;
  for (let r = s; r < i; r++)
    t = t >>> 8 ^ o[(t ^ n[r]) & 255];
  return t ^ -1;
};
var Z = sd, Nt = {
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
}, Ve = {
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
const { _tr_init: od, _tr_stored_block: Rs, _tr_flush_block: id, _tr_tally: Tt, _tr_align: rd } = Qp, {
  Z_NO_FLUSH: Dt,
  Z_PARTIAL_FLUSH: ad,
  Z_FULL_FLUSH: cd,
  Z_FINISH: it,
  Z_BLOCK: mi,
  Z_OK: W,
  Z_STREAM_END: yi,
  Z_STREAM_ERROR: ht,
  Z_DATA_ERROR: fd,
  Z_BUF_ERROR: as,
  Z_DEFAULT_COMPRESSION: ud,
  Z_FILTERED: ld,
  Z_HUFFMAN_ONLY: oe,
  Z_RLE: hd,
  Z_FIXED: gd,
  Z_DEFAULT_STRATEGY: pd,
  Z_UNKNOWN: dd,
  Z_DEFLATED: Pe
} = Ve, md = 9, yd = 15, xd = 8, wd = 29, _d = 256, zs = _d + 1 + wd, Sd = 30, bd = 19, vd = 2 * zs + 1, kd = 15, R = 3, Ot = 258, gt = Ot + R + 1, Cd = 32, pn = 42, ho = 57, Fs = 69, Vs = 73, Ps = 91, Us = 103, Pt = 113, An = 666, K = 1, yn = 2, $t = 3, xn = 4, Ad = 3, Ut = (t, n) => (t.msg = Nt[n], n), xi = (t) => t * 2 - (t > 4 ? 9 : 0), kt = (t) => {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}, Od = (t) => {
  let n, e, s, o = t.w_size;
  n = t.hash_size, s = n;
  do
    e = t.head[--s], t.head[s] = e >= o ? e - o : 0;
  while (--n);
  n = o, s = n;
  do
    e = t.prev[--s], t.prev[s] = e >= o ? e - o : 0;
  while (--n);
};
let Id = (t, n, e) => (n << t.hash_shift ^ e) & t.hash_mask, Bt = Id;
const nt = (t) => {
  const n = t.state;
  let e = n.pending;
  e > t.avail_out && (e = t.avail_out), e !== 0 && (t.output.set(n.pending_buf.subarray(n.pending_out, n.pending_out + e), t.next_out), t.next_out += e, n.pending_out += e, t.total_out += e, t.avail_out -= e, n.pending -= e, n.pending === 0 && (n.pending_out = 0));
}, et = (t, n) => {
  id(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, n), t.block_start = t.strstart, nt(t.strm);
}, z = (t, n) => {
  t.pending_buf[t.pending++] = n;
}, bn = (t, n) => {
  t.pending_buf[t.pending++] = n >>> 8 & 255, t.pending_buf[t.pending++] = n & 255;
}, Gs = (t, n, e, s) => {
  let o = t.avail_in;
  return o > s && (o = s), o === 0 ? 0 : (t.avail_in -= o, n.set(t.input.subarray(t.next_in, t.next_in + o), e), t.state.wrap === 1 ? t.adler = Un(t.adler, n, o, e) : t.state.wrap === 2 && (t.adler = Z(t.adler, n, o, e)), t.next_in += o, t.total_in += o, o);
}, ja = (t, n) => {
  let e = t.max_chain_length, s = t.strstart, o, i, r = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - gt ? t.strstart - (t.w_size - gt) : 0, f = t.window, u = t.w_mask, l = t.prev, g = t.strstart + Ot;
  let p = f[s + r - 1], h = f[s + r];
  t.prev_length >= t.good_match && (e >>= 2), a > t.lookahead && (a = t.lookahead);
  do
    if (o = n, !(f[o + r] !== h || f[o + r - 1] !== p || f[o] !== f[s] || f[++o] !== f[s + 1])) {
      s += 2, o++;
      do
        ;
      while (f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && f[++s] === f[++o] && s < g);
      if (i = Ot - (g - s), s = g - Ot, i > r) {
        if (t.match_start = n, r = i, i >= a)
          break;
        p = f[s + r - 1], h = f[s + r];
      }
    }
  while ((n = l[n & u]) > c && --e !== 0);
  return r <= t.lookahead ? r : t.lookahead;
}, dn = (t) => {
  const n = t.w_size;
  let e, s, o;
  do {
    if (s = t.window_size - t.lookahead - t.strstart, t.strstart >= n + (n - gt) && (t.window.set(t.window.subarray(n, n + n - s), 0), t.match_start -= n, t.strstart -= n, t.block_start -= n, t.insert > t.strstart && (t.insert = t.strstart), Od(t), s += n), t.strm.avail_in === 0)
      break;
    if (e = Gs(t.strm, t.window, t.strstart + t.lookahead, s), t.lookahead += e, t.lookahead + t.insert >= R)
      for (o = t.strstart - t.insert, t.ins_h = t.window[o], t.ins_h = Bt(t, t.ins_h, t.window[o + 1]); t.insert && (t.ins_h = Bt(t, t.ins_h, t.window[o + R - 1]), t.prev[o & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = o, o++, t.insert--, !(t.lookahead + t.insert < R)); )
        ;
  } while (t.lookahead < gt && t.strm.avail_in !== 0);
}, Wa = (t, n) => {
  let e = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, s, o, i, r = 0, a = t.strm.avail_in;
  do {
    if (s = 65535, i = t.bi_valid + 42 >> 3, t.strm.avail_out < i || (i = t.strm.avail_out - i, o = t.strstart - t.block_start, s > o + t.strm.avail_in && (s = o + t.strm.avail_in), s > i && (s = i), s < e && (s === 0 && n !== it || n === Dt || s !== o + t.strm.avail_in)))
      break;
    r = n === it && s === o + t.strm.avail_in ? 1 : 0, Rs(t, 0, 0, r), t.pending_buf[t.pending - 4] = s, t.pending_buf[t.pending - 3] = s >> 8, t.pending_buf[t.pending - 2] = ~s, t.pending_buf[t.pending - 1] = ~s >> 8, nt(t.strm), o && (o > s && (o = s), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + o), t.strm.next_out), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o, t.block_start += o, s -= o), s && (Gs(t.strm, t.strm.output, t.strm.next_out, s), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s);
  } while (r === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), r ? xn : n !== Dt && n !== it && t.strm.avail_in === 0 && t.strstart === t.block_start ? yn : (i = t.window_size - t.strstart, t.strm.avail_in > i && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, i += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), i > t.strm.avail_in && (i = t.strm.avail_in), i && (Gs(t.strm, t.window, t.strstart, i), t.strstart += i, t.insert += i > t.w_size - t.insert ? t.w_size - t.insert : i), t.high_water < t.strstart && (t.high_water = t.strstart), i = t.bi_valid + 42 >> 3, i = t.pending_buf_size - i > 65535 ? 65535 : t.pending_buf_size - i, e = i > t.w_size ? t.w_size : i, o = t.strstart - t.block_start, (o >= e || (o || n === it) && n !== Dt && t.strm.avail_in === 0 && o <= i) && (s = o > i ? i : o, r = n === it && t.strm.avail_in === 0 && s === o ? 1 : 0, Rs(t, t.block_start, s, r), t.block_start += s, nt(t.strm)), r ? $t : K);
}, cs = (t, n) => {
  let e, s;
  for (; ; ) {
    if (t.lookahead < gt) {
      if (dn(t), t.lookahead < gt && n === Dt)
        return K;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= R && (t.ins_h = Bt(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), e !== 0 && t.strstart - e <= t.w_size - gt && (t.match_length = ja(t, e)), t.match_length >= R)
      if (s = Tt(t, t.strstart - t.match_start, t.match_length - R), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= R) {
        t.match_length--;
        do
          t.strstart++, t.ins_h = Bt(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = Bt(t, t.ins_h, t.window[t.strstart + 1]);
    else
      s = Tt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (s && (et(t, !1), t.strm.avail_out === 0))
      return K;
  }
  return t.insert = t.strstart < R - 1 ? t.strstart : R - 1, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : xn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : yn;
}, Yt = (t, n) => {
  let e, s, o;
  for (; ; ) {
    if (t.lookahead < gt) {
      if (dn(t), t.lookahead < gt && n === Dt)
        return K;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= R && (t.ins_h = Bt(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = R - 1, e !== 0 && t.prev_length < t.max_lazy_match && t.strstart - e <= t.w_size - gt && (t.match_length = ja(t, e), t.match_length <= 5 && (t.strategy === ld || t.match_length === R && t.strstart - t.match_start > 4096) && (t.match_length = R - 1)), t.prev_length >= R && t.match_length <= t.prev_length) {
      o = t.strstart + t.lookahead - R, s = Tt(t, t.strstart - 1 - t.prev_match, t.prev_length - R), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= o && (t.ins_h = Bt(t, t.ins_h, t.window[t.strstart + R - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = R - 1, t.strstart++, s && (et(t, !1), t.strm.avail_out === 0))
        return K;
    } else if (t.match_available) {
      if (s = Tt(t, 0, t.window[t.strstart - 1]), s && et(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return K;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (s = Tt(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < R - 1 ? t.strstart : R - 1, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : xn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : yn;
}, Ed = (t, n) => {
  let e, s, o, i;
  const r = t.window;
  for (; ; ) {
    if (t.lookahead <= Ot) {
      if (dn(t), t.lookahead <= Ot && n === Dt)
        return K;
      if (t.lookahead === 0)
        break;
    }
    if (t.match_length = 0, t.lookahead >= R && t.strstart > 0 && (o = t.strstart - 1, s = r[o], s === r[++o] && s === r[++o] && s === r[++o])) {
      i = t.strstart + Ot;
      do
        ;
      while (s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && s === r[++o] && o < i);
      t.match_length = Ot - (i - o), t.match_length > t.lookahead && (t.match_length = t.lookahead);
    }
    if (t.match_length >= R ? (e = Tt(t, 1, t.match_length - R), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (e = Tt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), e && (et(t, !1), t.strm.avail_out === 0))
      return K;
  }
  return t.insert = 0, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : xn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : yn;
}, Td = (t, n) => {
  let e;
  for (; ; ) {
    if (t.lookahead === 0 && (dn(t), t.lookahead === 0)) {
      if (n === Dt)
        return K;
      break;
    }
    if (t.match_length = 0, e = Tt(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, e && (et(t, !1), t.strm.avail_out === 0))
      return K;
  }
  return t.insert = 0, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : xn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : yn;
};
function ct(t, n, e, s, o) {
  this.good_length = t, this.max_lazy = n, this.nice_length = e, this.max_chain = s, this.func = o;
}
const On = [
  /*      good lazy nice chain */
  new ct(0, 0, 0, 0, Wa),
  /* 0 store only */
  new ct(4, 4, 8, 4, cs),
  /* 1 max speed, no lazy matches */
  new ct(4, 5, 16, 8, cs),
  /* 2 */
  new ct(4, 6, 32, 32, cs),
  /* 3 */
  new ct(4, 4, 16, 16, Yt),
  /* 4 lazy matches */
  new ct(8, 16, 32, 32, Yt),
  /* 5 */
  new ct(8, 16, 128, 128, Yt),
  /* 6 */
  new ct(8, 32, 128, 256, Yt),
  /* 7 */
  new ct(32, 128, 258, 1024, Yt),
  /* 8 */
  new ct(32, 258, 258, 4096, Yt)
  /* 9 max compression */
], Dd = (t) => {
  t.window_size = 2 * t.w_size, kt(t.head), t.max_lazy_match = On[t.level].max_lazy, t.good_match = On[t.level].good_length, t.nice_match = On[t.level].nice_length, t.max_chain_length = On[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = R - 1, t.match_available = 0, t.ins_h = 0;
};
function Bd() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Pe, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(vd * 2), this.dyn_dtree = new Uint16Array((2 * Sd + 1) * 2), this.bl_tree = new Uint16Array((2 * bd + 1) * 2), kt(this.dyn_ltree), kt(this.dyn_dtree), kt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(kd + 1), this.heap = new Uint16Array(2 * zs + 1), kt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * zs + 1), kt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const Xn = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.status !== pn && //#ifdef GZIP
  n.status !== ho && //#endif
  n.status !== Fs && n.status !== Vs && n.status !== Ps && n.status !== Us && n.status !== Pt && n.status !== An ? 1 : 0;
}, qa = (t) => {
  if (Xn(t))
    return Ut(t, ht);
  t.total_in = t.total_out = 0, t.data_type = dd;
  const n = t.state;
  return n.pending = 0, n.pending_out = 0, n.wrap < 0 && (n.wrap = -n.wrap), n.status = //#ifdef GZIP
  n.wrap === 2 ? ho : (
    //#endif
    n.wrap ? pn : Pt
  ), t.adler = n.wrap === 2 ? 0 : 1, n.last_flush = -2, od(n), W;
}, Ya = (t) => {
  const n = qa(t);
  return n === W && Dd(t.state), n;
}, Md = (t, n) => Xn(t) || t.state.wrap !== 2 ? ht : (t.state.gzhead = n, W), Xa = (t, n, e, s, o, i) => {
  if (!t)
    return ht;
  let r = 1;
  if (n === ud && (n = 6), s < 0 ? (r = 0, s = -s) : s > 15 && (r = 2, s -= 16), o < 1 || o > md || e !== Pe || s < 8 || s > 15 || n < 0 || n > 9 || i < 0 || i > gd || s === 8 && r !== 1)
    return Ut(t, ht);
  s === 8 && (s = 9);
  const a = new Bd();
  return t.state = a, a.strm = t, a.status = pn, a.wrap = r, a.gzhead = null, a.w_bits = s, a.w_size = 1 << a.w_bits, a.w_mask = a.w_size - 1, a.hash_bits = o + 7, a.hash_size = 1 << a.hash_bits, a.hash_mask = a.hash_size - 1, a.hash_shift = ~~((a.hash_bits + R - 1) / R), a.window = new Uint8Array(a.w_size * 2), a.head = new Uint16Array(a.hash_size), a.prev = new Uint16Array(a.w_size), a.lit_bufsize = 1 << o + 6, a.pending_buf_size = a.lit_bufsize * 4, a.pending_buf = new Uint8Array(a.pending_buf_size), a.sym_buf = a.lit_bufsize, a.sym_end = (a.lit_bufsize - 1) * 3, a.level = n, a.strategy = i, a.method = e, Ya(t);
}, Ld = (t, n) => Xa(t, n, Pe, yd, xd, pd), Rd = (t, n) => {
  if (Xn(t) || n > mi || n < 0)
    return t ? Ut(t, ht) : ht;
  const e = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || e.status === An && n !== it)
    return Ut(t, t.avail_out === 0 ? as : ht);
  const s = e.last_flush;
  if (e.last_flush = n, e.pending !== 0) {
    if (nt(t), t.avail_out === 0)
      return e.last_flush = -1, W;
  } else if (t.avail_in === 0 && xi(n) <= xi(s) && n !== it)
    return Ut(t, as);
  if (e.status === An && t.avail_in !== 0)
    return Ut(t, as);
  if (e.status === pn && e.wrap === 0 && (e.status = Pt), e.status === pn) {
    let o = Pe + (e.w_bits - 8 << 4) << 8, i = -1;
    if (e.strategy >= oe || e.level < 2 ? i = 0 : e.level < 6 ? i = 1 : e.level === 6 ? i = 2 : i = 3, o |= i << 6, e.strstart !== 0 && (o |= Cd), o += 31 - o % 31, bn(e, o), e.strstart !== 0 && (bn(e, t.adler >>> 16), bn(e, t.adler & 65535)), t.adler = 1, e.status = Pt, nt(t), e.pending !== 0)
      return e.last_flush = -1, W;
  }
  if (e.status === ho) {
    if (t.adler = 0, z(e, 31), z(e, 139), z(e, 8), e.gzhead)
      z(
        e,
        (e.gzhead.text ? 1 : 0) + (e.gzhead.hcrc ? 2 : 0) + (e.gzhead.extra ? 4 : 0) + (e.gzhead.name ? 8 : 0) + (e.gzhead.comment ? 16 : 0)
      ), z(e, e.gzhead.time & 255), z(e, e.gzhead.time >> 8 & 255), z(e, e.gzhead.time >> 16 & 255), z(e, e.gzhead.time >> 24 & 255), z(e, e.level === 9 ? 2 : e.strategy >= oe || e.level < 2 ? 4 : 0), z(e, e.gzhead.os & 255), e.gzhead.extra && e.gzhead.extra.length && (z(e, e.gzhead.extra.length & 255), z(e, e.gzhead.extra.length >> 8 & 255)), e.gzhead.hcrc && (t.adler = Z(t.adler, e.pending_buf, e.pending, 0)), e.gzindex = 0, e.status = Fs;
    else if (z(e, 0), z(e, 0), z(e, 0), z(e, 0), z(e, 0), z(e, e.level === 9 ? 2 : e.strategy >= oe || e.level < 2 ? 4 : 0), z(e, Ad), e.status = Pt, nt(t), e.pending !== 0)
      return e.last_flush = -1, W;
  }
  if (e.status === Fs) {
    if (e.gzhead.extra) {
      let o = e.pending, i = (e.gzhead.extra.length & 65535) - e.gzindex;
      for (; e.pending + i > e.pending_buf_size; ) {
        let a = e.pending_buf_size - e.pending;
        if (e.pending_buf.set(e.gzhead.extra.subarray(e.gzindex, e.gzindex + a), e.pending), e.pending = e.pending_buf_size, e.gzhead.hcrc && e.pending > o && (t.adler = Z(t.adler, e.pending_buf, e.pending - o, o)), e.gzindex += a, nt(t), e.pending !== 0)
          return e.last_flush = -1, W;
        o = 0, i -= a;
      }
      let r = new Uint8Array(e.gzhead.extra);
      e.pending_buf.set(r.subarray(e.gzindex, e.gzindex + i), e.pending), e.pending += i, e.gzhead.hcrc && e.pending > o && (t.adler = Z(t.adler, e.pending_buf, e.pending - o, o)), e.gzindex = 0;
    }
    e.status = Vs;
  }
  if (e.status === Vs) {
    if (e.gzhead.name) {
      let o = e.pending, i;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > o && (t.adler = Z(t.adler, e.pending_buf, e.pending - o, o)), nt(t), e.pending !== 0)
            return e.last_flush = -1, W;
          o = 0;
        }
        e.gzindex < e.gzhead.name.length ? i = e.gzhead.name.charCodeAt(e.gzindex++) & 255 : i = 0, z(e, i);
      } while (i !== 0);
      e.gzhead.hcrc && e.pending > o && (t.adler = Z(t.adler, e.pending_buf, e.pending - o, o)), e.gzindex = 0;
    }
    e.status = Ps;
  }
  if (e.status === Ps) {
    if (e.gzhead.comment) {
      let o = e.pending, i;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > o && (t.adler = Z(t.adler, e.pending_buf, e.pending - o, o)), nt(t), e.pending !== 0)
            return e.last_flush = -1, W;
          o = 0;
        }
        e.gzindex < e.gzhead.comment.length ? i = e.gzhead.comment.charCodeAt(e.gzindex++) & 255 : i = 0, z(e, i);
      } while (i !== 0);
      e.gzhead.hcrc && e.pending > o && (t.adler = Z(t.adler, e.pending_buf, e.pending - o, o));
    }
    e.status = Us;
  }
  if (e.status === Us) {
    if (e.gzhead.hcrc) {
      if (e.pending + 2 > e.pending_buf_size && (nt(t), e.pending !== 0))
        return e.last_flush = -1, W;
      z(e, t.adler & 255), z(e, t.adler >> 8 & 255), t.adler = 0;
    }
    if (e.status = Pt, nt(t), e.pending !== 0)
      return e.last_flush = -1, W;
  }
  if (t.avail_in !== 0 || e.lookahead !== 0 || n !== Dt && e.status !== An) {
    let o = e.level === 0 ? Wa(e, n) : e.strategy === oe ? Td(e, n) : e.strategy === hd ? Ed(e, n) : On[e.level].func(e, n);
    if ((o === $t || o === xn) && (e.status = An), o === K || o === $t)
      return t.avail_out === 0 && (e.last_flush = -1), W;
    if (o === yn && (n === ad ? rd(e) : n !== mi && (Rs(e, 0, 0, !1), n === cd && (kt(e.head), e.lookahead === 0 && (e.strstart = 0, e.block_start = 0, e.insert = 0))), nt(t), t.avail_out === 0))
      return e.last_flush = -1, W;
  }
  return n !== it ? W : e.wrap <= 0 ? yi : (e.wrap === 2 ? (z(e, t.adler & 255), z(e, t.adler >> 8 & 255), z(e, t.adler >> 16 & 255), z(e, t.adler >> 24 & 255), z(e, t.total_in & 255), z(e, t.total_in >> 8 & 255), z(e, t.total_in >> 16 & 255), z(e, t.total_in >> 24 & 255)) : (bn(e, t.adler >>> 16), bn(e, t.adler & 65535)), nt(t), e.wrap > 0 && (e.wrap = -e.wrap), e.pending !== 0 ? W : yi);
}, zd = (t) => {
  if (Xn(t))
    return ht;
  const n = t.state.status;
  return t.state = null, n === Pt ? Ut(t, fd) : W;
}, Fd = (t, n) => {
  let e = n.length;
  if (Xn(t))
    return ht;
  const s = t.state, o = s.wrap;
  if (o === 2 || o === 1 && s.status !== pn || s.lookahead)
    return ht;
  if (o === 1 && (t.adler = Un(t.adler, n, e, 0)), s.wrap = 0, e >= s.w_size) {
    o === 0 && (kt(s.head), s.strstart = 0, s.block_start = 0, s.insert = 0);
    let c = new Uint8Array(s.w_size);
    c.set(n.subarray(e - s.w_size, e), 0), n = c, e = s.w_size;
  }
  const i = t.avail_in, r = t.next_in, a = t.input;
  for (t.avail_in = e, t.next_in = 0, t.input = n, dn(s); s.lookahead >= R; ) {
    let c = s.strstart, f = s.lookahead - (R - 1);
    do
      s.ins_h = Bt(s, s.ins_h, s.window[c + R - 1]), s.prev[c & s.w_mask] = s.head[s.ins_h], s.head[s.ins_h] = c, c++;
    while (--f);
    s.strstart = c, s.lookahead = R - 1, dn(s);
  }
  return s.strstart += s.lookahead, s.block_start = s.strstart, s.insert = s.lookahead, s.lookahead = 0, s.match_length = s.prev_length = R - 1, s.match_available = 0, t.next_in = r, t.input = a, t.avail_in = i, s.wrap = o, W;
};
var Vd = Ld, Pd = Xa, Ud = Ya, Gd = qa, Nd = Md, $d = Rd, Hd = zd, Zd = Fd, jd = "pako deflate (from Nodeca project)", Dn = {
  deflateInit: Vd,
  deflateInit2: Pd,
  deflateReset: Ud,
  deflateResetKeep: Gd,
  deflateSetHeader: Nd,
  deflate: $d,
  deflateEnd: Hd,
  deflateSetDictionary: Zd,
  deflateInfo: jd
};
const Wd = (t, n) => Object.prototype.hasOwnProperty.call(t, n);
var qd = function(t) {
  const n = Array.prototype.slice.call(arguments, 1);
  for (; n.length; ) {
    const e = n.shift();
    if (e) {
      if (typeof e != "object")
        throw new TypeError(e + "must be non-object");
      for (const s in e)
        Wd(e, s) && (t[s] = e[s]);
    }
  }
  return t;
}, Yd = (t) => {
  let n = 0;
  for (let s = 0, o = t.length; s < o; s++)
    n += t[s].length;
  const e = new Uint8Array(n);
  for (let s = 0, o = 0, i = t.length; s < i; s++) {
    let r = t[s];
    e.set(r, o), o += r.length;
  }
  return e;
}, Ue = {
  assign: qd,
  flattenChunks: Yd
};
let Ka = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Ka = !1;
}
const Gn = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  Gn[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
Gn[254] = Gn[254] = 1;
var Xd = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let n, e, s, o, i, r = t.length, a = 0;
  for (o = 0; o < r; o++)
    e = t.charCodeAt(o), (e & 64512) === 55296 && o + 1 < r && (s = t.charCodeAt(o + 1), (s & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (s - 56320), o++)), a += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (n = new Uint8Array(a), i = 0, o = 0; i < a; o++)
    e = t.charCodeAt(o), (e & 64512) === 55296 && o + 1 < r && (s = t.charCodeAt(o + 1), (s & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (s - 56320), o++)), e < 128 ? n[i++] = e : e < 2048 ? (n[i++] = 192 | e >>> 6, n[i++] = 128 | e & 63) : e < 65536 ? (n[i++] = 224 | e >>> 12, n[i++] = 128 | e >>> 6 & 63, n[i++] = 128 | e & 63) : (n[i++] = 240 | e >>> 18, n[i++] = 128 | e >>> 12 & 63, n[i++] = 128 | e >>> 6 & 63, n[i++] = 128 | e & 63);
  return n;
};
const Kd = (t, n) => {
  if (n < 65534 && t.subarray && Ka)
    return String.fromCharCode.apply(null, t.length === n ? t : t.subarray(0, n));
  let e = "";
  for (let s = 0; s < n; s++)
    e += String.fromCharCode(t[s]);
  return e;
};
var Jd = (t, n) => {
  const e = n || t.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(t.subarray(0, n));
  let s, o;
  const i = new Array(e * 2);
  for (o = 0, s = 0; s < e; ) {
    let r = t[s++];
    if (r < 128) {
      i[o++] = r;
      continue;
    }
    let a = Gn[r];
    if (a > 4) {
      i[o++] = 65533, s += a - 1;
      continue;
    }
    for (r &= a === 2 ? 31 : a === 3 ? 15 : 7; a > 1 && s < e; )
      r = r << 6 | t[s++] & 63, a--;
    if (a > 1) {
      i[o++] = 65533;
      continue;
    }
    r < 65536 ? i[o++] = r : (r -= 65536, i[o++] = 55296 | r >> 10 & 1023, i[o++] = 56320 | r & 1023);
  }
  return Kd(i, o);
}, Qd = (t, n) => {
  n = n || t.length, n > t.length && (n = t.length);
  let e = n - 1;
  for (; e >= 0 && (t[e] & 192) === 128; )
    e--;
  return e < 0 || e === 0 ? n : e + Gn[t[e]] > n ? e : n;
}, Nn = {
  string2buf: Xd,
  buf2string: Jd,
  utf8border: Qd
};
function t1() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var Ja = t1;
const Qa = Object.prototype.toString, {
  Z_NO_FLUSH: n1,
  Z_SYNC_FLUSH: e1,
  Z_FULL_FLUSH: s1,
  Z_FINISH: o1,
  Z_OK: ke,
  Z_STREAM_END: i1,
  Z_DEFAULT_COMPRESSION: r1,
  Z_DEFAULT_STRATEGY: a1,
  Z_DEFLATED: c1
} = Ve;
function Ge(t) {
  this.options = Ue.assign({
    level: r1,
    method: c1,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: a1
  }, t || {});
  let n = this.options;
  n.raw && n.windowBits > 0 ? n.windowBits = -n.windowBits : n.gzip && n.windowBits > 0 && n.windowBits < 16 && (n.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ja(), this.strm.avail_out = 0;
  let e = Dn.deflateInit2(
    this.strm,
    n.level,
    n.method,
    n.windowBits,
    n.memLevel,
    n.strategy
  );
  if (e !== ke)
    throw new Error(Nt[e]);
  if (n.header && Dn.deflateSetHeader(this.strm, n.header), n.dictionary) {
    let s;
    if (typeof n.dictionary == "string" ? s = Nn.string2buf(n.dictionary) : Qa.call(n.dictionary) === "[object ArrayBuffer]" ? s = new Uint8Array(n.dictionary) : s = n.dictionary, e = Dn.deflateSetDictionary(this.strm, s), e !== ke)
      throw new Error(Nt[e]);
    this._dict_set = !0;
  }
}
Ge.prototype.push = function(t, n) {
  const e = this.strm, s = this.options.chunkSize;
  let o, i;
  if (this.ended)
    return !1;
  for (n === ~~n ? i = n : i = n === !0 ? o1 : n1, typeof t == "string" ? e.input = Nn.string2buf(t) : Qa.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    if (e.avail_out === 0 && (e.output = new Uint8Array(s), e.next_out = 0, e.avail_out = s), (i === e1 || i === s1) && e.avail_out <= 6) {
      this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      continue;
    }
    if (o = Dn.deflate(e, i), o === i1)
      return e.next_out > 0 && this.onData(e.output.subarray(0, e.next_out)), o = Dn.deflateEnd(this.strm), this.onEnd(o), this.ended = !0, o === ke;
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
Ge.prototype.onData = function(t) {
  this.chunks.push(t);
};
Ge.prototype.onEnd = function(t) {
  t === ke && (this.result = Ue.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function f1(t, n) {
  const e = new Ge(n);
  if (e.push(t, !0), e.err)
    throw e.msg || Nt[e.err];
  return e.result;
}
var u1 = f1, l1 = {
  deflate: u1
};
const ie = 16209, h1 = 16191;
var g1 = function(n, e) {
  let s, o, i, r, a, c, f, u, l, g, p, h, d, x, m, y, S, w, _, v, b, E, A, C;
  const I = n.state;
  s = n.next_in, A = n.input, o = s + (n.avail_in - 5), i = n.next_out, C = n.output, r = i - (e - n.avail_out), a = i + (n.avail_out - 257), c = I.dmax, f = I.wsize, u = I.whave, l = I.wnext, g = I.window, p = I.hold, h = I.bits, d = I.lencode, x = I.distcode, m = (1 << I.lenbits) - 1, y = (1 << I.distbits) - 1;
  t:
    do {
      h < 15 && (p += A[s++] << h, h += 8, p += A[s++] << h, h += 8), S = d[p & m];
      n:
        for (; ; ) {
          if (w = S >>> 24, p >>>= w, h -= w, w = S >>> 16 & 255, w === 0)
            C[i++] = S & 65535;
          else if (w & 16) {
            _ = S & 65535, w &= 15, w && (h < w && (p += A[s++] << h, h += 8), _ += p & (1 << w) - 1, p >>>= w, h -= w), h < 15 && (p += A[s++] << h, h += 8, p += A[s++] << h, h += 8), S = x[p & y];
            e:
              for (; ; ) {
                if (w = S >>> 24, p >>>= w, h -= w, w = S >>> 16 & 255, w & 16) {
                  if (v = S & 65535, w &= 15, h < w && (p += A[s++] << h, h += 8, h < w && (p += A[s++] << h, h += 8)), v += p & (1 << w) - 1, v > c) {
                    n.msg = "invalid distance too far back", I.mode = ie;
                    break t;
                  }
                  if (p >>>= w, h -= w, w = i - r, v > w) {
                    if (w = v - w, w > u && I.sane) {
                      n.msg = "invalid distance too far back", I.mode = ie;
                      break t;
                    }
                    if (b = 0, E = g, l === 0) {
                      if (b += f - w, w < _) {
                        _ -= w;
                        do
                          C[i++] = g[b++];
                        while (--w);
                        b = i - v, E = C;
                      }
                    } else if (l < w) {
                      if (b += f + l - w, w -= l, w < _) {
                        _ -= w;
                        do
                          C[i++] = g[b++];
                        while (--w);
                        if (b = 0, l < _) {
                          w = l, _ -= w;
                          do
                            C[i++] = g[b++];
                          while (--w);
                          b = i - v, E = C;
                        }
                      }
                    } else if (b += l - w, w < _) {
                      _ -= w;
                      do
                        C[i++] = g[b++];
                      while (--w);
                      b = i - v, E = C;
                    }
                    for (; _ > 2; )
                      C[i++] = E[b++], C[i++] = E[b++], C[i++] = E[b++], _ -= 3;
                    _ && (C[i++] = E[b++], _ > 1 && (C[i++] = E[b++]));
                  } else {
                    b = i - v;
                    do
                      C[i++] = C[b++], C[i++] = C[b++], C[i++] = C[b++], _ -= 3;
                    while (_ > 2);
                    _ && (C[i++] = C[b++], _ > 1 && (C[i++] = C[b++]));
                  }
                } else if ((w & 64) === 0) {
                  S = x[(S & 65535) + (p & (1 << w) - 1)];
                  continue e;
                } else {
                  n.msg = "invalid distance code", I.mode = ie;
                  break t;
                }
                break;
              }
          } else if ((w & 64) === 0) {
            S = d[(S & 65535) + (p & (1 << w) - 1)];
            continue n;
          } else if (w & 32) {
            I.mode = h1;
            break t;
          } else {
            n.msg = "invalid literal/length code", I.mode = ie;
            break t;
          }
          break;
        }
    } while (s < o && i < a);
  _ = h >> 3, s -= _, h -= _ << 3, p &= (1 << h) - 1, n.next_in = s, n.next_out = i, n.avail_in = s < o ? 5 + (o - s) : 5 - (s - o), n.avail_out = i < a ? 257 + (a - i) : 257 - (i - a), I.hold = p, I.bits = h;
};
const Xt = 15, wi = 852, _i = 592, Si = 0, fs = 1, bi = 2, p1 = new Uint16Array([
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
]), d1 = new Uint8Array([
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
]), m1 = new Uint16Array([
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
]), y1 = new Uint8Array([
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
]), x1 = (t, n, e, s, o, i, r, a) => {
  const c = a.bits;
  let f = 0, u = 0, l = 0, g = 0, p = 0, h = 0, d = 0, x = 0, m = 0, y = 0, S, w, _, v, b, E = null, A;
  const C = new Uint16Array(Xt + 1), I = new Uint16Array(Xt + 1);
  let O = null, T, D, M;
  for (f = 0; f <= Xt; f++)
    C[f] = 0;
  for (u = 0; u < s; u++)
    C[n[e + u]]++;
  for (p = c, g = Xt; g >= 1 && C[g] === 0; g--)
    ;
  if (p > g && (p = g), g === 0)
    return o[i++] = 1 << 24 | 64 << 16 | 0, o[i++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (l = 1; l < g && C[l] === 0; l++)
    ;
  for (p < l && (p = l), x = 1, f = 1; f <= Xt; f++)
    if (x <<= 1, x -= C[f], x < 0)
      return -1;
  if (x > 0 && (t === Si || g !== 1))
    return -1;
  for (I[1] = 0, f = 1; f < Xt; f++)
    I[f + 1] = I[f] + C[f];
  for (u = 0; u < s; u++)
    n[e + u] !== 0 && (r[I[n[e + u]]++] = u);
  if (t === Si ? (E = O = r, A = 20) : t === fs ? (E = p1, O = d1, A = 257) : (E = m1, O = y1, A = 0), y = 0, u = 0, f = l, b = i, h = p, d = 0, _ = -1, m = 1 << p, v = m - 1, t === fs && m > wi || t === bi && m > _i)
    return 1;
  for (; ; ) {
    T = f - d, r[u] + 1 < A ? (D = 0, M = r[u]) : r[u] >= A ? (D = O[r[u] - A], M = E[r[u] - A]) : (D = 96, M = 0), S = 1 << f - d, w = 1 << h, l = w;
    do
      w -= S, o[b + (y >> d) + w] = T << 24 | D << 16 | M | 0;
    while (w !== 0);
    for (S = 1 << f - 1; y & S; )
      S >>= 1;
    if (S !== 0 ? (y &= S - 1, y += S) : y = 0, u++, --C[f] === 0) {
      if (f === g)
        break;
      f = n[e + r[u]];
    }
    if (f > p && (y & v) !== _) {
      for (d === 0 && (d = p), b += l, h = f - d, x = 1 << h; h + d < g && (x -= C[h + d], !(x <= 0)); )
        h++, x <<= 1;
      if (m += 1 << h, t === fs && m > wi || t === bi && m > _i)
        return 1;
      _ = y & v, o[_] = p << 24 | h << 16 | b - i | 0;
    }
  }
  return y !== 0 && (o[b + y] = f - d << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var Bn = x1;
const w1 = 0, tc = 1, nc = 2, {
  Z_FINISH: vi,
  Z_BLOCK: _1,
  Z_TREES: re,
  Z_OK: Ht,
  Z_STREAM_END: S1,
  Z_NEED_DICT: b1,
  Z_STREAM_ERROR: rt,
  Z_DATA_ERROR: ec,
  Z_MEM_ERROR: sc,
  Z_BUF_ERROR: v1,
  Z_DEFLATED: ki
} = Ve, Ne = 16180, Ci = 16181, Ai = 16182, Oi = 16183, Ii = 16184, Ei = 16185, Ti = 16186, Di = 16187, Bi = 16188, Mi = 16189, Ce = 16190, xt = 16191, us = 16192, Li = 16193, ls = 16194, Ri = 16195, zi = 16196, Fi = 16197, Vi = 16198, ae = 16199, ce = 16200, Pi = 16201, Ui = 16202, Gi = 16203, Ni = 16204, $i = 16205, hs = 16206, Hi = 16207, Zi = 16208, N = 16209, oc = 16210, ic = 16211, k1 = 852, C1 = 592, A1 = 15, O1 = A1, ji = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function I1() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const Zt = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.mode < Ne || n.mode > ic ? 1 : 0;
}, rc = (t) => {
  if (Zt(t))
    return rt;
  const n = t.state;
  return t.total_in = t.total_out = n.total = 0, t.msg = "", n.wrap && (t.adler = n.wrap & 1), n.mode = Ne, n.last = 0, n.havedict = 0, n.flags = -1, n.dmax = 32768, n.head = null, n.hold = 0, n.bits = 0, n.lencode = n.lendyn = new Int32Array(k1), n.distcode = n.distdyn = new Int32Array(C1), n.sane = 1, n.back = -1, Ht;
}, ac = (t) => {
  if (Zt(t))
    return rt;
  const n = t.state;
  return n.wsize = 0, n.whave = 0, n.wnext = 0, rc(t);
}, cc = (t, n) => {
  let e;
  if (Zt(t))
    return rt;
  const s = t.state;
  return n < 0 ? (e = 0, n = -n) : (e = (n >> 4) + 5, n < 48 && (n &= 15)), n && (n < 8 || n > 15) ? rt : (s.window !== null && s.wbits !== n && (s.window = null), s.wrap = e, s.wbits = n, ac(t));
}, fc = (t, n) => {
  if (!t)
    return rt;
  const e = new I1();
  t.state = e, e.strm = t, e.window = null, e.mode = Ne;
  const s = cc(t, n);
  return s !== Ht && (t.state = null), s;
}, E1 = (t) => fc(t, O1);
let Wi = !0, gs, ps;
const T1 = (t) => {
  if (Wi) {
    gs = new Int32Array(512), ps = new Int32Array(32);
    let n = 0;
    for (; n < 144; )
      t.lens[n++] = 8;
    for (; n < 256; )
      t.lens[n++] = 9;
    for (; n < 280; )
      t.lens[n++] = 7;
    for (; n < 288; )
      t.lens[n++] = 8;
    for (Bn(tc, t.lens, 0, 288, gs, 0, t.work, { bits: 9 }), n = 0; n < 32; )
      t.lens[n++] = 5;
    Bn(nc, t.lens, 0, 32, ps, 0, t.work, { bits: 5 }), Wi = !1;
  }
  t.lencode = gs, t.lenbits = 9, t.distcode = ps, t.distbits = 5;
}, uc = (t, n, e, s) => {
  let o;
  const i = t.state;
  return i.window === null && (i.wsize = 1 << i.wbits, i.wnext = 0, i.whave = 0, i.window = new Uint8Array(i.wsize)), s >= i.wsize ? (i.window.set(n.subarray(e - i.wsize, e), 0), i.wnext = 0, i.whave = i.wsize) : (o = i.wsize - i.wnext, o > s && (o = s), i.window.set(n.subarray(e - s, e - s + o), i.wnext), s -= o, s ? (i.window.set(n.subarray(e - s, e), 0), i.wnext = s, i.whave = i.wsize) : (i.wnext += o, i.wnext === i.wsize && (i.wnext = 0), i.whave < i.wsize && (i.whave += o))), 0;
}, D1 = (t, n) => {
  let e, s, o, i, r, a, c, f, u, l, g, p, h, d, x = 0, m, y, S, w, _, v, b, E;
  const A = new Uint8Array(4);
  let C, I;
  const O = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (Zt(t) || !t.output || !t.input && t.avail_in !== 0)
    return rt;
  e = t.state, e.mode === xt && (e.mode = us), r = t.next_out, o = t.output, c = t.avail_out, i = t.next_in, s = t.input, a = t.avail_in, f = e.hold, u = e.bits, l = a, g = c, E = Ht;
  t:
    for (; ; )
      switch (e.mode) {
        case Ne:
          if (e.wrap === 0) {
            e.mode = us;
            break;
          }
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (e.wrap & 2 && f === 35615) {
            e.wbits === 0 && (e.wbits = 15), e.check = 0, A[0] = f & 255, A[1] = f >>> 8 & 255, e.check = Z(e.check, A, 2, 0), f = 0, u = 0, e.mode = Ci;
            break;
          }
          if (e.head && (e.head.done = !1), !(e.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", e.mode = N;
            break;
          }
          if ((f & 15) !== ki) {
            t.msg = "unknown compression method", e.mode = N;
            break;
          }
          if (f >>>= 4, u -= 4, b = (f & 15) + 8, e.wbits === 0 && (e.wbits = b), b > 15 || b > e.wbits) {
            t.msg = "invalid window size", e.mode = N;
            break;
          }
          e.dmax = 1 << e.wbits, e.flags = 0, t.adler = e.check = 1, e.mode = f & 512 ? Mi : xt, f = 0, u = 0;
          break;
        case Ci:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (e.flags = f, (e.flags & 255) !== ki) {
            t.msg = "unknown compression method", e.mode = N;
            break;
          }
          if (e.flags & 57344) {
            t.msg = "unknown header flags set", e.mode = N;
            break;
          }
          e.head && (e.head.text = f >> 8 & 1), e.flags & 512 && e.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, e.check = Z(e.check, A, 2, 0)), f = 0, u = 0, e.mode = Ai;
        /* falls through */
        case Ai:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          e.head && (e.head.time = f), e.flags & 512 && e.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, A[2] = f >>> 16 & 255, A[3] = f >>> 24 & 255, e.check = Z(e.check, A, 4, 0)), f = 0, u = 0, e.mode = Oi;
        /* falls through */
        case Oi:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          e.head && (e.head.xflags = f & 255, e.head.os = f >> 8), e.flags & 512 && e.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, e.check = Z(e.check, A, 2, 0)), f = 0, u = 0, e.mode = Ii;
        /* falls through */
        case Ii:
          if (e.flags & 1024) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            e.length = f, e.head && (e.head.extra_len = f), e.flags & 512 && e.wrap & 4 && (A[0] = f & 255, A[1] = f >>> 8 & 255, e.check = Z(e.check, A, 2, 0)), f = 0, u = 0;
          } else e.head && (e.head.extra = null);
          e.mode = Ei;
        /* falls through */
        case Ei:
          if (e.flags & 1024 && (p = e.length, p > a && (p = a), p && (e.head && (b = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(
            s.subarray(
              i,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              i + p
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            b
          )), e.flags & 512 && e.wrap & 4 && (e.check = Z(e.check, s, p, i)), a -= p, i += p, e.length -= p), e.length))
            break t;
          e.length = 0, e.mode = Ti;
        /* falls through */
        case Ti:
          if (e.flags & 2048) {
            if (a === 0)
              break t;
            p = 0;
            do
              b = s[i + p++], e.head && b && e.length < 65536 && (e.head.name += String.fromCharCode(b));
            while (b && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = Z(e.check, s, p, i)), a -= p, i += p, b)
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
              b = s[i + p++], e.head && b && e.length < 65536 && (e.head.comment += String.fromCharCode(b));
            while (b && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = Z(e.check, s, p, i)), a -= p, i += p, b)
              break t;
          } else e.head && (e.head.comment = null);
          e.mode = Bi;
        /* falls through */
        case Bi:
          if (e.flags & 512) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            if (e.wrap & 4 && f !== (e.check & 65535)) {
              t.msg = "header crc mismatch", e.mode = N;
              break;
            }
            f = 0, u = 0;
          }
          e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), t.adler = e.check = 0, e.mode = xt;
          break;
        case Mi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          t.adler = e.check = ji(f), f = 0, u = 0, e.mode = Ce;
        /* falls through */
        case Ce:
          if (e.havedict === 0)
            return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, b1;
          t.adler = e.check = 1, e.mode = xt;
        /* falls through */
        case xt:
          if (n === _1 || n === re)
            break t;
        /* falls through */
        case us:
          if (e.last) {
            f >>>= u & 7, u -= u & 7, e.mode = hs;
            break;
          }
          for (; u < 3; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          switch (e.last = f & 1, f >>>= 1, u -= 1, f & 3) {
            case 0:
              e.mode = Li;
              break;
            case 1:
              if (T1(e), e.mode = ae, n === re) {
                f >>>= 2, u -= 2;
                break t;
              }
              break;
            case 2:
              e.mode = zi;
              break;
            case 3:
              t.msg = "invalid block type", e.mode = N;
          }
          f >>>= 2, u -= 2;
          break;
        case Li:
          for (f >>>= u & 7, u -= u & 7; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if ((f & 65535) !== (f >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", e.mode = N;
            break;
          }
          if (e.length = f & 65535, f = 0, u = 0, e.mode = ls, n === re)
            break t;
        /* falls through */
        case ls:
          e.mode = Ri;
        /* falls through */
        case Ri:
          if (p = e.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            o.set(s.subarray(i, i + p), r), a -= p, i += p, c -= p, r += p, e.length -= p;
            break;
          }
          e.mode = xt;
          break;
        case zi:
          for (; u < 14; ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (e.nlen = (f & 31) + 257, f >>>= 5, u -= 5, e.ndist = (f & 31) + 1, f >>>= 5, u -= 5, e.ncode = (f & 15) + 4, f >>>= 4, u -= 4, e.nlen > 286 || e.ndist > 30) {
            t.msg = "too many length or distance symbols", e.mode = N;
            break;
          }
          e.have = 0, e.mode = Fi;
        /* falls through */
        case Fi:
          for (; e.have < e.ncode; ) {
            for (; u < 3; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            e.lens[O[e.have++]] = f & 7, f >>>= 3, u -= 3;
          }
          for (; e.have < 19; )
            e.lens[O[e.have++]] = 0;
          if (e.lencode = e.lendyn, e.lenbits = 7, C = { bits: e.lenbits }, E = Bn(w1, e.lens, 0, 19, e.lencode, 0, e.work, C), e.lenbits = C.bits, E) {
            t.msg = "invalid code lengths set", e.mode = N;
            break;
          }
          e.have = 0, e.mode = Vi;
        /* falls through */
        case Vi:
          for (; e.have < e.nlen + e.ndist; ) {
            for (; x = e.lencode[f & (1 << e.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, S = x & 65535, !(m <= u); ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            if (S < 16)
              f >>>= m, u -= m, e.lens[e.have++] = S;
            else {
              if (S === 16) {
                for (I = m + 2; u < I; ) {
                  if (a === 0)
                    break t;
                  a--, f += s[i++] << u, u += 8;
                }
                if (f >>>= m, u -= m, e.have === 0) {
                  t.msg = "invalid bit length repeat", e.mode = N;
                  break;
                }
                b = e.lens[e.have - 1], p = 3 + (f & 3), f >>>= 2, u -= 2;
              } else if (S === 17) {
                for (I = m + 3; u < I; ) {
                  if (a === 0)
                    break t;
                  a--, f += s[i++] << u, u += 8;
                }
                f >>>= m, u -= m, b = 0, p = 3 + (f & 7), f >>>= 3, u -= 3;
              } else {
                for (I = m + 7; u < I; ) {
                  if (a === 0)
                    break t;
                  a--, f += s[i++] << u, u += 8;
                }
                f >>>= m, u -= m, b = 0, p = 11 + (f & 127), f >>>= 7, u -= 7;
              }
              if (e.have + p > e.nlen + e.ndist) {
                t.msg = "invalid bit length repeat", e.mode = N;
                break;
              }
              for (; p--; )
                e.lens[e.have++] = b;
            }
          }
          if (e.mode === N)
            break;
          if (e.lens[256] === 0) {
            t.msg = "invalid code -- missing end-of-block", e.mode = N;
            break;
          }
          if (e.lenbits = 9, C = { bits: e.lenbits }, E = Bn(tc, e.lens, 0, e.nlen, e.lencode, 0, e.work, C), e.lenbits = C.bits, E) {
            t.msg = "invalid literal/lengths set", e.mode = N;
            break;
          }
          if (e.distbits = 6, e.distcode = e.distdyn, C = { bits: e.distbits }, E = Bn(nc, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, C), e.distbits = C.bits, E) {
            t.msg = "invalid distances set", e.mode = N;
            break;
          }
          if (e.mode = ae, n === re)
            break t;
        /* falls through */
        case ae:
          e.mode = ce;
        /* falls through */
        case ce:
          if (a >= 6 && c >= 258) {
            t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, g1(t, g), r = t.next_out, o = t.output, c = t.avail_out, i = t.next_in, s = t.input, a = t.avail_in, f = e.hold, u = e.bits, e.mode === xt && (e.back = -1);
            break;
          }
          for (e.back = 0; x = e.lencode[f & (1 << e.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, S = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if (y && (y & 240) === 0) {
            for (w = m, _ = y, v = S; x = e.lencode[v + ((f & (1 << w + _) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, S = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            f >>>= w, u -= w, e.back += w;
          }
          if (f >>>= m, u -= m, e.back += m, e.length = S, y === 0) {
            e.mode = $i;
            break;
          }
          if (y & 32) {
            e.back = -1, e.mode = xt;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", e.mode = N;
            break;
          }
          e.extra = y & 15, e.mode = Pi;
        /* falls through */
        case Pi:
          if (e.extra) {
            for (I = e.extra; u < I; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            e.length += f & (1 << e.extra) - 1, f >>>= e.extra, u -= e.extra, e.back += e.extra;
          }
          e.was = e.length, e.mode = Ui;
        /* falls through */
        case Ui:
          for (; x = e.distcode[f & (1 << e.distbits) - 1], m = x >>> 24, y = x >>> 16 & 255, S = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += s[i++] << u, u += 8;
          }
          if ((y & 240) === 0) {
            for (w = m, _ = y, v = S; x = e.distcode[v + ((f & (1 << w + _) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, S = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            f >>>= w, u -= w, e.back += w;
          }
          if (f >>>= m, u -= m, e.back += m, y & 64) {
            t.msg = "invalid distance code", e.mode = N;
            break;
          }
          e.offset = S, e.extra = y & 15, e.mode = Gi;
        /* falls through */
        case Gi:
          if (e.extra) {
            for (I = e.extra; u < I; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            e.offset += f & (1 << e.extra) - 1, f >>>= e.extra, u -= e.extra, e.back += e.extra;
          }
          if (e.offset > e.dmax) {
            t.msg = "invalid distance too far back", e.mode = N;
            break;
          }
          e.mode = Ni;
        /* falls through */
        case Ni:
          if (c === 0)
            break t;
          if (p = g - c, e.offset > p) {
            if (p = e.offset - p, p > e.whave && e.sane) {
              t.msg = "invalid distance too far back", e.mode = N;
              break;
            }
            p > e.wnext ? (p -= e.wnext, h = e.wsize - p) : h = e.wnext - p, p > e.length && (p = e.length), d = e.window;
          } else
            d = o, h = r - e.offset, p = e.length;
          p > c && (p = c), c -= p, e.length -= p;
          do
            o[r++] = d[h++];
          while (--p);
          e.length === 0 && (e.mode = ce);
          break;
        case $i:
          if (c === 0)
            break t;
          o[r++] = e.length, c--, e.mode = ce;
          break;
        case hs:
          if (e.wrap) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f |= s[i++] << u, u += 8;
            }
            if (g -= c, t.total_out += g, e.total += g, e.wrap & 4 && g && (t.adler = e.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            e.flags ? Z(e.check, o, g, r - g) : Un(e.check, o, g, r - g)), g = c, e.wrap & 4 && (e.flags ? f : ji(f)) !== e.check) {
              t.msg = "incorrect data check", e.mode = N;
              break;
            }
            f = 0, u = 0;
          }
          e.mode = Hi;
        /* falls through */
        case Hi:
          if (e.wrap && e.flags) {
            for (; u < 32; ) {
              if (a === 0)
                break t;
              a--, f += s[i++] << u, u += 8;
            }
            if (e.wrap & 4 && f !== (e.total & 4294967295)) {
              t.msg = "incorrect length check", e.mode = N;
              break;
            }
            f = 0, u = 0;
          }
          e.mode = Zi;
        /* falls through */
        case Zi:
          E = S1;
          break t;
        case N:
          E = ec;
          break t;
        case oc:
          return sc;
        case ic:
        /* falls through */
        default:
          return rt;
      }
  return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, (e.wsize || g !== t.avail_out && e.mode < N && (e.mode < hs || n !== vi)) && uc(t, t.output, t.next_out, g - t.avail_out), l -= t.avail_in, g -= t.avail_out, t.total_in += l, t.total_out += g, e.total += g, e.wrap & 4 && g && (t.adler = e.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  e.flags ? Z(e.check, o, g, t.next_out - g) : Un(e.check, o, g, t.next_out - g)), t.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === xt ? 128 : 0) + (e.mode === ae || e.mode === ls ? 256 : 0), (l === 0 && g === 0 || n === vi) && E === Ht && (E = v1), E;
}, B1 = (t) => {
  if (Zt(t))
    return rt;
  let n = t.state;
  return n.window && (n.window = null), t.state = null, Ht;
}, M1 = (t, n) => {
  if (Zt(t))
    return rt;
  const e = t.state;
  return (e.wrap & 2) === 0 ? rt : (e.head = n, n.done = !1, Ht);
}, L1 = (t, n) => {
  const e = n.length;
  let s, o, i;
  return Zt(t) || (s = t.state, s.wrap !== 0 && s.mode !== Ce) ? rt : s.mode === Ce && (o = 1, o = Un(o, n, e, 0), o !== s.check) ? ec : (i = uc(t, n, e, e), i ? (s.mode = oc, sc) : (s.havedict = 1, Ht));
};
var R1 = ac, z1 = cc, F1 = rc, V1 = E1, P1 = fc, U1 = D1, G1 = B1, N1 = M1, $1 = L1, H1 = "pako inflate (from Nodeca project)", St = {
  inflateReset: R1,
  inflateReset2: z1,
  inflateResetKeep: F1,
  inflateInit: V1,
  inflateInit2: P1,
  inflate: U1,
  inflateEnd: G1,
  inflateGetHeader: N1,
  inflateSetDictionary: $1,
  inflateInfo: H1
};
function Z1() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var j1 = Z1;
const lc = Object.prototype.toString, {
  Z_NO_FLUSH: W1,
  Z_FINISH: q1,
  Z_OK: $n,
  Z_STREAM_END: ds,
  Z_NEED_DICT: ms,
  Z_STREAM_ERROR: Y1,
  Z_DATA_ERROR: qi,
  Z_MEM_ERROR: X1
} = Ve;
function $e(t) {
  this.options = Ue.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const n = this.options;
  n.raw && n.windowBits >= 0 && n.windowBits < 16 && (n.windowBits = -n.windowBits, n.windowBits === 0 && (n.windowBits = -15)), n.windowBits >= 0 && n.windowBits < 16 && !(t && t.windowBits) && (n.windowBits += 32), n.windowBits > 15 && n.windowBits < 48 && (n.windowBits & 15) === 0 && (n.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ja(), this.strm.avail_out = 0;
  let e = St.inflateInit2(
    this.strm,
    n.windowBits
  );
  if (e !== $n)
    throw new Error(Nt[e]);
  if (this.header = new j1(), St.inflateGetHeader(this.strm, this.header), n.dictionary && (typeof n.dictionary == "string" ? n.dictionary = Nn.string2buf(n.dictionary) : lc.call(n.dictionary) === "[object ArrayBuffer]" && (n.dictionary = new Uint8Array(n.dictionary)), n.raw && (e = St.inflateSetDictionary(this.strm, n.dictionary), e !== $n)))
    throw new Error(Nt[e]);
}
$e.prototype.push = function(t, n) {
  const e = this.strm, s = this.options.chunkSize, o = this.options.dictionary;
  let i, r, a;
  if (this.ended) return !1;
  for (n === ~~n ? r = n : r = n === !0 ? q1 : W1, lc.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(s), e.next_out = 0, e.avail_out = s), i = St.inflate(e, r), i === ms && o && (i = St.inflateSetDictionary(e, o), i === $n ? i = St.inflate(e, r) : i === qi && (i = ms)); e.avail_in > 0 && i === ds && e.state.wrap > 0 && t[e.next_in] !== 0; )
      St.inflateReset(e), i = St.inflate(e, r);
    switch (i) {
      case Y1:
      case qi:
      case ms:
      case X1:
        return this.onEnd(i), this.ended = !0, !1;
    }
    if (a = e.avail_out, e.next_out && (e.avail_out === 0 || i === ds))
      if (this.options.to === "string") {
        let c = Nn.utf8border(e.output, e.next_out), f = e.next_out - c, u = Nn.buf2string(e.output, c);
        e.next_out = f, e.avail_out = s - f, f && e.output.set(e.output.subarray(c, c + f), 0), this.onData(u);
      } else
        this.onData(e.output.length === e.next_out ? e.output : e.output.subarray(0, e.next_out));
    if (!(i === $n && a === 0)) {
      if (i === ds)
        return i = St.inflateEnd(this.strm), this.onEnd(i), this.ended = !0, !0;
      if (e.avail_in === 0) break;
    }
  }
  return !0;
};
$e.prototype.onData = function(t) {
  this.chunks.push(t);
};
$e.prototype.onEnd = function(t) {
  t === $n && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = Ue.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function K1(t, n) {
  const e = new $e(n);
  if (e.push(t), e.err) throw e.msg || Nt[e.err];
  return e.result;
}
var J1 = K1, Q1 = {
  inflate: J1
};
const { deflate: tm } = l1, { inflate: nm } = Q1;
var Yi = tm, Xi = nm;
const hc = 2001684038, Ns = 44, $s = 20, Ae = 12, Oe = 16;
function em(t) {
  const n = new DataView(t), e = new Uint8Array(t);
  if (n.getUint32(0) !== hc)
    throw new Error("Invalid WOFF1 signature");
  const o = n.getUint32(4), i = n.getUint16(12), r = n.getUint32(24), a = n.getUint32(28), c = n.getUint32(36), f = n.getUint32(40), u = [];
  let l = Ns;
  for (let A = 0; A < i; A++)
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
    }), l += $s;
  const g = u.map((A) => {
    const C = e.subarray(
      A.offset,
      A.offset + A.compLength
    );
    let I;
    if (A.compLength < A.origLength) {
      if (I = Xi(C), I.length !== A.origLength)
        throw new Error(
          `WOFF1 table '${A.tag}': decompressed size ${I.length} !== expected ${A.origLength}`
        );
    } else
      I = C;
    return {
      tag: A.tag,
      checksum: A.origChecksum,
      data: I,
      length: A.origLength,
      paddedLength: A.origLength + (4 - A.origLength % 4) % 4
    };
  }), p = Ae + i * Oe;
  let h = p + (4 - p % 4) % 4;
  const { searchRange: d, entrySelector: x, rangeShift: m } = sm(i);
  let y = h;
  for (const A of g)
    y += A.paddedLength;
  const S = new ArrayBuffer(y), w = new DataView(S), _ = new Uint8Array(S);
  w.setUint32(0, o), w.setUint16(4, i), w.setUint16(6, d), w.setUint16(8, x), w.setUint16(10, m);
  const v = g.map((A, C) => ({ ...A, originalIndex: C })).sort((A, C) => A.tag < C.tag ? -1 : A.tag > C.tag ? 1 : 0);
  for (let A = 0; A < v.length; A++) {
    const C = v[A], I = Ae + A * Oe;
    for (let O = 0; O < 4; O++)
      w.setUint8(I + O, C.tag.charCodeAt(O));
    w.setUint32(I + 4, C.checksum), w.setUint32(I + 8, h), w.setUint32(I + 12, C.length), _.set(C.data, h), h += C.paddedLength;
  }
  let b = null;
  if (r && a) {
    const A = e.subarray(r, r + a);
    b = Xi(A);
  }
  let E = null;
  return c && f && (E = e.slice(c, c + f)), { sfnt: S, metadata: b, privateData: E };
}
function Hs(t, n = null, e = null) {
  const s = new DataView(t), o = new Uint8Array(t), i = s.getUint32(0), r = s.getUint16(4), a = [];
  for (let v = 0; v < r; v++) {
    const b = Ae + v * Oe;
    a.push({
      tag: String.fromCharCode(
        s.getUint8(b),
        s.getUint8(b + 1),
        s.getUint8(b + 2),
        s.getUint8(b + 3)
      ),
      checksum: s.getUint32(b + 4),
      offset: s.getUint32(b + 8),
      length: s.getUint32(b + 12)
    });
  }
  const c = a.map((v) => {
    const b = o.subarray(v.offset, v.offset + v.length), E = Yi(b), A = E.length < v.length;
    return {
      tag: v.tag,
      origChecksum: v.checksum,
      origLength: v.length,
      data: A ? E : b,
      compLength: A ? E.length : v.length
    };
  });
  let f = null, u = 0;
  n && n.length > 0 && (u = n.length, f = Yi(n));
  let g = Ns + r * $s;
  g += (4 - g % 4) % 4;
  for (const v of c)
    v.woffOffset = g, g += v.compLength, g += (4 - g % 4) % 4;
  let p = 0, h = 0;
  f && (p = g, h = f.length, g += h, g += (4 - g % 4) % 4);
  let d = 0, x = 0;
  e && e.length > 0 && (d = g, x = e.length, g += x);
  const m = g;
  let y = Ae + r * Oe;
  for (const v of c)
    y += v.origLength + (4 - v.origLength % 4) % 4;
  const S = new ArrayBuffer(m), w = new DataView(S), _ = new Uint8Array(S);
  w.setUint32(0, hc), w.setUint32(4, i), w.setUint32(8, m), w.setUint16(12, r), w.setUint16(14, 0), w.setUint32(16, y), w.setUint16(20, 0), w.setUint16(22, 0), w.setUint32(24, p), w.setUint32(28, h), w.setUint32(32, u), w.setUint32(36, d), w.setUint32(40, x);
  for (let v = 0; v < c.length; v++) {
    const b = c[v], E = Ns + v * $s;
    for (let A = 0; A < 4; A++)
      w.setUint8(E + A, b.tag.charCodeAt(A));
    w.setUint32(E + 4, b.woffOffset), w.setUint32(E + 8, b.compLength), w.setUint32(E + 12, b.origLength), w.setUint32(E + 16, b.origChecksum);
  }
  for (const v of c)
    _.set(v.data, v.woffOffset);
  return f && _.set(f, p), e && e.length > 0 && _.set(e, d), S;
}
function sm(t) {
  let n = 1, e = 0;
  for (; n * 2 <= t; )
    n *= 2, e++;
  n *= 16;
  const s = t * 16 - n;
  return { searchRange: n, entrySelector: e, rangeShift: s };
}
let Ie = null, cn = null;
async function gc() {
  if (!cn)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: n } = await import("node:zlib");
      Ie = (e) => new Uint8Array(t(e)), cn = (e) => new Uint8Array(n(e));
    } catch {
      const t = await import("brotli-wasm"), n = await (t.default || t);
      Ie = n.compress, cn = n.decompress;
    }
}
function pc() {
  if (!cn)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const dc = 2001684018, Zs = 48, Hn = 12, Zn = 16, js = [
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
], mc = /* @__PURE__ */ new Map();
for (let t = 0; t < js.length; t++) mc.set(js[t], t);
function Ki(t, n) {
  let e = 0;
  for (let s = 0; s < 5; s++) {
    const o = t[n + s];
    if (s === 0 && o === 128)
      throw new Error("UIntBase128: leading zero");
    if (e & 4261412864)
      throw new Error("UIntBase128: overflow");
    if (e = e << 7 | o & 127, !(o & 128))
      return { value: e >>> 0, bytesRead: s + 1 };
  }
  throw new Error("UIntBase128: exceeds 5 bytes");
}
function om(t) {
  const n = [];
  let e = t >>> 0;
  const s = [];
  do
    s.push(e & 127), e >>>= 7;
  while (e > 0);
  s.reverse();
  for (let o = 0; o < s.length; o++)
    n.push(o < s.length - 1 ? s[o] | 128 : s[o]);
  return n;
}
function fn(t, n) {
  const e = t[n];
  return e === 253 ? { value: t[n + 1] << 8 | t[n + 2], bytesRead: 3 } : e === 255 ? { value: t[n + 1] + 253, bytesRead: 2 } : e === 254 ? { value: t[n + 1] + 506, bytesRead: 2 } : { value: e, bytesRead: 1 };
}
const im = rm();
function rm() {
  const t = [];
  for (let o = 0; o < 10; o++)
    t.push({
      xBits: 0,
      yBits: 8,
      deltaX: 0,
      deltaY: (o >> 1) * 256,
      xSign: 0,
      ySign: o & 1 ? 1 : -1
    });
  for (let o = 0; o < 10; o++)
    t.push({
      xBits: 8,
      yBits: 0,
      deltaX: (o >> 1) * 256,
      deltaY: 0,
      xSign: o & 1 ? 1 : -1,
      ySign: 0
    });
  const n = [1, 17, 33, 49], e = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
  for (const o of n)
    for (const i of n)
      for (const [r, a] of e)
        t.push({ xBits: 4, yBits: 4, deltaX: o, deltaY: i, xSign: r, ySign: a });
  const s = [1, 257, 513];
  for (const o of s)
    for (const i of s)
      for (const [r, a] of e)
        t.push({ xBits: 8, yBits: 8, deltaX: o, deltaY: i, xSign: r, ySign: a });
  for (const [o, i] of e)
    t.push({ xBits: 12, yBits: 12, deltaX: 0, deltaY: 0, xSign: o, ySign: i });
  for (const [o, i] of e)
    t.push({ xBits: 16, yBits: 16, deltaX: 0, deltaY: 0, xSign: o, ySign: i });
  return t;
}
function am(t, n, e) {
  const s = t & 127, o = !(t & 128), i = im[s];
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
  return { dx: r, dy: a, onCurve: o, bytesConsumed: c - e };
}
function cm(t, n, e, s, o, i, r, a, c) {
  const f = [];
  lt(f, t), lt(f, o), lt(f, i), lt(f, r), lt(f, a);
  for (const h of n) qs(f, h);
  qs(f, s.length);
  for (let h = 0; h < s.length; h++) f.push(s[h]);
  const u = [], l = [], g = [];
  for (let h = 0; h < e.length; h++) {
    const { dx: d, dy: x, onCurve: m } = e[h];
    let y = m ? 1 : 0;
    if (h === 0 && c && (y |= 64), d === 0)
      y |= 16;
    else if (d >= -255 && d <= 255)
      y |= 2, d > 0 ? (y |= 16, l.push(d)) : l.push(-d);
    else {
      const S = d & 65535;
      l.push(S >> 8 & 255, S & 255);
    }
    if (x === 0)
      y |= 32;
    else if (x >= -255 && x <= 255)
      y |= 4, x > 0 ? (y |= 32, g.push(x)) : g.push(-x);
    else {
      const S = x & 65535;
      g.push(S >> 8 & 255, S & 255);
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
function fm(t, n, e, s, o, i) {
  const r = [];
  lt(r, -1), lt(r, e), lt(r, s), lt(r, o), lt(r, i);
  for (let a = 0; a < t.length; a++) r.push(t[a]);
  if (n && n.length > 0) {
    qs(r, n.length);
    for (let a = 0; a < n.length; a++) r.push(n[a]);
  }
  return r;
}
function um(t, n) {
  const e = t;
  let s = 0;
  const o = e[s] << 8 | e[s + 1];
  if (s += 2, o !== 0) throw new Error("WOFF2 glyf transform: reserved != 0");
  const i = e[s] << 8 | e[s + 1];
  s += 2;
  const r = e[s] << 8 | e[s + 1];
  s += 2;
  const a = e[s] << 8 | e[s + 1];
  s += 2;
  const c = wt(e, s);
  s += 4;
  const f = wt(e, s);
  s += 4;
  const u = wt(e, s);
  s += 4;
  const l = wt(e, s);
  s += 4;
  const g = wt(e, s);
  s += 4;
  const p = wt(e, s);
  s += 4;
  const h = wt(e, s);
  s += 4;
  const d = s, x = d + c, m = x + f, y = m + u, S = y + l, w = S + g, _ = w + p, v = 4 * Math.floor((r + 31) / 32), b = w, E = b + v;
  function A(X) {
    const st = X >> 3, bt = 7 - (X & 7);
    return !!(e[b + st] & 1 << bt);
  }
  const C = !!(i & 1), I = _ + h;
  function O(X) {
    if (!C) return !1;
    const st = X >> 3, bt = 7 - (X & 7);
    return !!(e[I + st] & 1 << bt);
  }
  let T = d, D = x, M = m, L = y, $ = S, U = E, j = _;
  const q = [], Y = [0];
  let dt = 0;
  for (let X = 0; X < r; X++) {
    const st = ot(e, T);
    if (T += 2, st === 0) {
      q.push(null), Y.push(dt);
      continue;
    }
    if (st > 0) {
      const bt = [];
      let Wt = 0;
      for (let at = 0; at < st; at++) {
        const { value: yt, bytesRead: qt } = fn(e, D);
        D += qt, Wt += yt, bt.push(Wt - 1);
      }
      const wn = [];
      for (let at = 0; at < Wt; at++) {
        const yt = e[M++], { dx: qt, dy: Ic, onCurve: Ec, bytesConsumed: Tc } = am(yt, e, L);
        L += Tc, wn.push({ dx: qt, dy: Ic, onCurve: Ec });
      }
      const { value: _n, bytesRead: He } = fn(e, L);
      L += He;
      const Ze = e.subarray(j, j + _n);
      j += _n;
      let Mt, Lt, mt, Rt;
      if (A(X))
        Mt = ot(e, U), U += 2, Lt = ot(e, U), U += 2, mt = ot(e, U), U += 2, Rt = ot(e, U), U += 2;
      else {
        let at = 0, yt = 0;
        Mt = 32767, Lt = 32767, mt = -32768, Rt = -32768;
        for (const qt of wn)
          at += qt.dx, yt += qt.dy, at < Mt && (Mt = at), at > mt && (mt = at), yt < Lt && (Lt = yt), yt > Rt && (Rt = yt);
      }
      const tt = cm(
        st,
        bt,
        wn,
        Ze,
        Mt,
        Lt,
        mt,
        Rt,
        O(X)
      );
      q.push(tt);
      const je = tt.length + (tt.length % 2 ? 1 : 0);
      dt += je, Y.push(dt);
    } else {
      const bt = $;
      let Wt = !1;
      for (; ; ) {
        const tt = e[$] << 8 | e[$ + 1];
        if ($ += 2, $ += 2, tt & 1 ? $ += 4 : $ += 2, tt & 8 ? $ += 2 : tt & 64 ? $ += 4 : tt & 128 && ($ += 8), tt & 256 && (Wt = !0), !(tt & 32)) break;
      }
      const wn = e.subarray(bt, $);
      let _n = new Uint8Array(0);
      if (Wt) {
        const { value: tt, bytesRead: je } = fn(e, L);
        L += je, _n = e.subarray(j, j + tt), j += tt;
      }
      const He = ot(e, U);
      U += 2;
      const Ze = ot(e, U);
      U += 2;
      const Mt = ot(e, U);
      U += 2;
      const Lt = ot(e, U);
      U += 2;
      const mt = fm(
        wn,
        _n,
        He,
        Ze,
        Mt,
        Lt
      );
      q.push(mt);
      const Rt = mt.length + (mt.length % 2 ? 1 : 0);
      dt += Rt, Y.push(dt);
    }
  }
  const jt = new Uint8Array(dt);
  let Kn = 0;
  for (const X of q)
    if (X !== null) {
      for (let st = 0; st < X.length; st++)
        jt[Kn++] = X[st];
      X.length % 2 && Kn++;
    }
  return { glyfBytes: jt, locaOffsets: Y, indexFormat: a };
}
function lm(t, n, e, s, o) {
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
      l.push(Ji(s, o, m));
  const g = e - n, p = [];
  if (f)
    for (let m = 0; m < g; m++)
      p.push(ot(i, r)), r += 2;
  else
    for (let m = 0; m < g; m++)
      p.push(Ji(s, o, n + m));
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
function Ji(t, n, e) {
  const s = n[e], o = n[e + 1];
  return s === o ? 0 : ot(t, s + 2);
}
function hm(t, n) {
  if (n === 0) {
    const s = new Uint8Array(t.length * 2);
    for (let o = 0; o < t.length; o++) {
      const i = t[o] >> 1;
      s[o * 2] = i >> 8 & 255, s[o * 2 + 1] = i & 255;
    }
    return s;
  }
  const e = new Uint8Array(t.length * 4);
  for (let s = 0; s < t.length; s++) {
    const o = t[s];
    e[s * 4] = o >> 24 & 255, e[s * 4 + 1] = o >> 16 & 255, e[s * 4 + 2] = o >> 8 & 255, e[s * 4 + 3] = o & 255;
  }
  return e;
}
function gm(t) {
  pc();
  const n = new Uint8Array(t), e = new DataView(t);
  if (e.getUint32(0) !== dc)
    throw new Error("Invalid WOFF2 signature");
  const o = e.getUint32(4), i = e.getUint16(12), r = e.getUint32(20), a = e.getUint32(28), c = e.getUint32(32), f = e.getUint32(40), u = e.getUint32(44);
  let l = Zs;
  const g = [];
  for (let O = 0; O < i; O++) {
    const T = n[l++], D = T & 63, M = T >> 6 & 3;
    let L;
    D === 63 ? (L = String.fromCharCode(n[l], n[l + 1], n[l + 2], n[l + 3]), l += 4) : L = js[D];
    const { value: $, bytesRead: U } = Ki(n, l);
    l += U;
    let j = $;
    const q = L === "glyf" || L === "loca", Y = L === "hmtx";
    if (q && M === 0 || Y && M === 1 || !q && !Y && M !== 0) {
      const { value: jt, bytesRead: Kn } = Ki(n, l);
      l += Kn, j = jt;
    }
    L === "loca" && M === 0 && (j = 0), g.push({
      tag: L,
      transformVersion: M,
      origLength: $,
      transformLength: j,
      isTransformed: q ? M === 0 : Y ? M === 1 : M !== 0
    });
  }
  let p = null;
  if (o === 1953784678) {
    const O = wt(n, l);
    l += 4;
    const { value: T, bytesRead: D } = fn(n, l);
    l += D;
    const M = [];
    for (let L = 0; L < T; L++) {
      const { value: $, bytesRead: U } = fn(n, l);
      l += U;
      const j = wt(n, l);
      l += 4;
      const q = [];
      for (let Y = 0; Y < $; Y++) {
        const { value: dt, bytesRead: jt } = fn(n, l);
        l += jt, q.push(dt);
      }
      M.push({ numTables: $, flavor: j, tableIndices: q });
    }
    p = { version: O, numFonts: T, fonts: M };
  }
  const h = l, d = n.subarray(h, h + r), x = cn(d);
  let m = 0;
  const y = /* @__PURE__ */ new Map();
  for (const O of g) {
    const T = O.isTransformed ? O.transformLength : O.origLength, D = x.subarray(m, m + T);
    m += T, y.set(O.tag, { data: D, entry: O });
  }
  const S = /* @__PURE__ */ new Map();
  let w = null;
  const _ = y.get("glyf"), v = y.get("loca");
  _ && _.entry.isTransformed && (v && v.entry.origLength, w = um(_.data), S.set("glyf", w.glyfBytes), S.set("loca", hm(
    w.locaOffsets,
    w.indexFormat
  )));
  const b = y.get("hmtx");
  if (b && b.entry.isTransformed && w) {
    const O = y.get("hhea"), T = y.get("maxp");
    let D = 0, M = 0;
    O && (D = O.data[34] << 8 | O.data[35]), T && (M = T.data[4] << 8 | T.data[5]), S.set("hmtx", lm(
      b.data,
      D,
      M,
      w.glyfBytes,
      w.locaOffsets
    ));
  }
  const E = [];
  for (const O of g) {
    const T = O.tag;
    let D;
    S.has(T) ? D = S.get(T) : D = y.get(T).data, E.push({ tag: T, data: D, length: D.length });
  }
  let A;
  p ? A = pm(p, E) : A = yc(o, E);
  let C = null;
  if (a && c) {
    const O = n.subarray(a, a + c);
    C = cn(O);
  }
  let I = null;
  return f && u && (I = n.slice(f, f + u)), { sfnt: A.buffer, metadata: C, privateData: I };
}
function yc(t, n) {
  const e = n.length, { searchRange: s, entrySelector: o, rangeShift: i } = dm(e), r = Hn + e * Zn;
  let a = r + (4 - r % 4) % 4;
  const c = n.map((g, p) => ({ ...g, index: p })).sort((g, p) => g.tag < p.tag ? -1 : g.tag > p.tag ? 1 : 0);
  let f = a;
  for (const g of c)
    f += g.length + (4 - g.length % 4) % 4;
  const u = new Uint8Array(f), l = new DataView(u.buffer);
  l.setUint32(0, t), l.setUint16(4, e), l.setUint16(6, s), l.setUint16(8, o), l.setUint16(10, i);
  for (let g = 0; g < c.length; g++) {
    const p = c[g], h = Hn + g * Zn;
    for (let x = 0; x < 4; x++)
      u[h + x] = p.tag.charCodeAt(x);
    const d = xc(p.data);
    l.setUint32(h + 4, d), l.setUint32(h + 8, a), l.setUint32(h + 12, p.length), u.set(p.data instanceof Uint8Array ? p.data : new Uint8Array(p.data), a), a += p.length + (4 - p.length % 4) % 4;
  }
  return mm(u, c), u;
}
function pm(t, n, e) {
  const s = [];
  for (const l of t.fonts) {
    const g = l.tableIndices.map((h) => n[h]), p = yc(l.flavor, g);
    s.push(p);
  }
  const o = s.length;
  let r = 12 + o * 4;
  r += (4 - r % 4) % 4;
  const a = [];
  let c = r;
  for (const l of s)
    a.push(c), c += l.length, c += (4 - c % 4) % 4;
  const f = new Uint8Array(c), u = new DataView(f.buffer);
  u.setUint32(0, 1953784678), u.setUint32(4, t.version), u.setUint32(8, o);
  for (let l = 0; l < o; l++)
    u.setUint32(12 + l * 4, a[l]);
  for (let l = 0; l < o; l++)
    f.set(s[l], a[l]);
  return f;
}
function Ws(t, n = null, e = null) {
  pc();
  const s = new DataView(t), o = new Uint8Array(t), i = s.getUint32(0), r = s.getUint16(4), a = [];
  for (let D = 0; D < r; D++) {
    const M = Hn + D * Zn, L = String.fromCharCode(
      s.getUint8(M),
      s.getUint8(M + 1),
      s.getUint8(M + 2),
      s.getUint8(M + 3)
    );
    a.push({
      tag: L,
      checksum: s.getUint32(M + 4),
      offset: s.getUint32(M + 8),
      length: s.getUint32(M + 12)
    });
  }
  const c = a.filter((D) => D.tag !== "DSIG"), f = [], u = [];
  let l = Hn + c.length * Zn;
  for (const D of c) {
    const M = o.subarray(D.offset, D.offset + D.length), L = mc.get(D.tag), U = D.tag === "glyf" || D.tag === "loca" ? 3 : 0, q = [(L !== void 0 ? L : 63) | U << 6];
    if (L === void 0)
      for (let Y = 0; Y < 4; Y++) q.push(D.tag.charCodeAt(Y));
    q.push(...om(D.length)), f.push(q), u.push(M), l += D.length + (4 - D.length % 4) % 4;
  }
  let g = 0;
  for (const D of u) g += D.length;
  const p = new Uint8Array(g);
  let h = 0;
  for (const D of u)
    p.set(D, h), h += D.length;
  const d = Ie(p);
  let x = null, m = 0;
  n && n.length > 0 && (m = n.length, x = Ie(n));
  let y = [];
  for (const D of f) y.push(...D);
  let w = Zs + y.length;
  const _ = w;
  w += d.length;
  let v = 0, b = 0;
  x && (w += (4 - w % 4) % 4, v = w, b = x.length, w += b);
  let E = 0, A = 0;
  e && e.length > 0 && (w += (4 - w % 4) % 4, E = w, A = e.length, w += A);
  const C = w, I = new ArrayBuffer(C), O = new DataView(I), T = new Uint8Array(I);
  O.setUint32(0, dc), O.setUint32(4, i), O.setUint32(8, C), O.setUint16(12, c.length), O.setUint16(14, 0), O.setUint32(16, l), O.setUint32(20, d.length), O.setUint16(24, 0), O.setUint16(26, 0), O.setUint32(28, v), O.setUint32(32, b), O.setUint32(36, m), O.setUint32(40, E), O.setUint32(44, A);
  for (let D = 0; D < y.length; D++)
    T[Zs + D] = y[D];
  return T.set(d instanceof Uint8Array ? d : new Uint8Array(d), _), x && T.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    v
  ), e && e.length > 0 && T.set(e, E), I;
}
function wt(t, n) {
  return (t[n] << 24 | t[n + 1] << 16 | t[n + 2] << 8 | t[n + 3]) >>> 0;
}
function ot(t, n) {
  const e = t[n] << 8 | t[n + 1];
  return e > 32767 ? e - 65536 : e;
}
function lt(t, n) {
  const e = n & 65535;
  t.push(e >> 8 & 255, e & 255);
}
function qs(t, n) {
  t.push(n >> 8 & 255, n & 255);
}
function dm(t) {
  let n = 1, e = 0;
  for (; n * 2 <= t; )
    n *= 2, e++;
  n *= 16;
  const s = t * 16 - n;
  return { searchRange: n, entrySelector: e, rangeShift: s };
}
function xc(t) {
  let n = 0;
  const e = t.length, s = e + (4 - e % 4) % 4;
  for (let o = 0; o < s; o += 4)
    n = n + ((t[o] || 0) << 24 | (t[o + 1] || 0) << 16 | (t[o + 2] || 0) << 8 | (t[o + 3] || 0)) >>> 0;
  return n;
}
function mm(t, n) {
  let e = -1;
  for (const i of n)
    if (i.tag === "head") {
      const r = t[4] << 8 | t[5];
      for (let a = 0; a < r; a++) {
        const c = Hn + a * Zn;
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
  const o = 2981146554 - xc(t) >>> 0;
  t[e + 8] = o >> 24 & 255, t[e + 9] = o >> 16 & 255, t[e + 10] = o >> 8 & 255, t[e + 11] = o & 255;
}
const ym = {
  cmap: al,
  head: Wr,
  hhea: i0,
  HVAR: l0,
  hmtx: a0,
  maxp: q0,
  MVAR: ng,
  name: cg,
  hdmx: t0,
  BASE: Eu,
  JSTF: b0,
  MATH: H0,
  MERG: X0,
  meta: Q0,
  DSIG: ql,
  LTSH: G0,
  CBLC: rn,
  CBDT: Js,
  "OS/2": ug,
  kern: D0,
  PCLT: gg,
  VDMX: Bg,
  post: dg,
  STAT: kg,
  "CFF ": Ff,
  CFF2: Zf,
  VORG: Yf,
  fvar: oh,
  avar: Jf,
  loca: Ta,
  glyf: mp,
  gvar: kp,
  GDEF: uh,
  GPOS: Ch,
  GSUB: Hh,
  "cvt ": ap,
  cvar: ip,
  fpgm: fp,
  prep: Ip,
  gasp: lp,
  vhea: Fg,
  VVAR: $g,
  vmtx: Pg,
  COLR: Nl,
  CPAL: Hl,
  EBDT: Kl,
  EBLC: Ql,
  EBSC: nh,
  bloc: ju,
  bdat: Vu,
  sbix: wg,
  ltag: P0,
  "SVG ": Og
}, Qi = 12, tr = 16, xm = /* @__PURE__ */ new Set(["sfnt", "woff", "woff2"]);
function wm(t) {
  const n = t._woff?.version;
  return n === 2 ? "woff2" : n === 1 ? "woff" : "sfnt";
}
function nr(t, n = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  const e = n.format ? n.format.toLowerCase() : wm(t);
  if (!xm.has(e))
    throw new Error(
      `Unknown export format "${e}". Supported: sfnt, woff, woff2.`
    );
  if (Sm(t)) {
    if (n.split)
      return _m(t, e);
    const i = bm(t);
    return e === "woff" ? Hs(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : e === "woff2" ? Ws(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : i;
  }
  const s = go(t), o = Ee(s, 0);
  if (e === "woff") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return Hs(o, i, r);
  }
  if (e === "woff2") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return Ws(o, i, r);
  }
  return o;
}
function _m(t, n) {
  const { fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return e.map((s) => {
    const o = go(s), i = Ee(o, 0);
    return n === "woff" ? Hs(i) : n === "woff2" ? Ws(i) : i;
  });
}
function Sm(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function go(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables && t.font && t.glyphs) {
    const n = vo(t);
    for (const [e, s] of Object.entries(t.tables))
      !Uc.has(e) && !n.tables[e] && (n.tables[e] = s);
    return t.tables["CFF "] && n.tables["CFF "] && (n.tables["CFF "] = t.tables["CFF "]), t.tables.CFF2 && n.tables.CFF2 && (n.tables.CFF2 = t.tables.CFF2), n;
  }
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return vo(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function Ee(t, n) {
  const { header: e, tables: s } = t, o = Object.keys(s), i = o.length, r = vm(s), a = o.map((h) => {
    const d = s[h];
    let x;
    if (r.has(h))
      x = r.get(h);
    else if (d._raw)
      x = d._raw;
    else {
      const y = ym[h];
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
  }), c = Qi + i * tr;
  let f = c + (4 - c % 4) % 4;
  for (const h of a)
    h.offset = f, f += h.paddedLength;
  const u = f, l = new ArrayBuffer(u), g = new DataView(l), p = new Uint8Array(l);
  g.setUint32(0, e.sfVersion), g.setUint16(4, i), g.setUint16(6, e.searchRange), g.setUint16(8, e.entrySelector), g.setUint16(10, e.rangeShift);
  for (let h = 0; h < a.length; h++) {
    const d = a[h], x = Qi + h * tr;
    for (let m = 0; m < 4; m++)
      g.setUint8(x + m, d.tag.charCodeAt(m));
    g.setUint32(x + 4, d.checksum), g.setUint32(x + 8, d.offset + n), g.setUint32(x + 12, d.length);
  }
  for (const h of a)
    p.set(h.data, h.offset);
  return l;
}
function bm(t) {
  const { collection: n, fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const s = e.map((m) => go(m)), o = n.majorVersion ?? 2, i = n.minorVersion ?? 0, r = s.length, a = o >= 2, c = 12 + r * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const l = s.map(
    (m) => new Uint8Array(Ee(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), g = s.map(
    (m, y) => new Uint8Array(Ee(m, l[y]))
  ), p = f, h = new ArrayBuffer(p), d = new DataView(h), x = new Uint8Array(h);
  d.setUint8(0, 116), d.setUint8(1, 116), d.setUint8(2, 99), d.setUint8(3, 102), d.setUint16(4, o), d.setUint16(6, i), d.setUint32(8, r);
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
function vm(t) {
  const n = /* @__PURE__ */ new Map(), e = t.glyf && !t.glyf._raw, s = t.loca && !t.loca._raw;
  if (e && s) {
    const { bytes: u, offsets: l } = Ea(t.glyf);
    if (n.set("glyf", u), n.set("loca", Ta({ offsets: l })), t.head && !t.head._raw) {
      const p = l.every((h) => h % 2 === 0 && h / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== p && n.set(
        "head",
        Wr({ ...t.head, indexToLocFormat: p })
      );
    }
  }
  const o = t.CBLC && !t.CBLC._raw && t.CBLC.sizes, i = t.CBDT && !t.CBDT._raw && t.CBDT.bitmapData;
  if (o && i) {
    const { bytes: u, offsetInfo: l } = Ye(
      t.CBDT,
      t.CBLC
    );
    n.set("CBDT", u), n.set("CBLC", rn(t.CBLC, l));
  }
  const r = t.EBLC && !t.EBLC._raw && t.EBLC.sizes, a = t.EBDT && !t.EBDT._raw && t.EBDT.bitmapData;
  if (r && a) {
    const { bytes: u, offsetInfo: l } = Ye(t.EBDT, t.EBLC);
    n.set("EBDT", u), n.set("EBLC", rn(t.EBLC, l));
  }
  const c = t.bloc && !t.bloc._raw && t.bloc.sizes, f = t.bdat && !t.bdat._raw && t.bdat.bitmapData;
  if (c && f) {
    const { bytes: u, offsetInfo: l } = Ye(t.bdat, t.bloc);
    n.set("bdat", u), n.set("bloc", rn(t.bloc, l));
  }
  return n;
}
function km(t) {
  if (!t || t.length === 0) return "";
  const n = [];
  for (const e of t)
    !e || e.length === 0 || (e[0].type ? n.push(Cm(e)) : n.push(Am(e)));
  return n.join(" ");
}
function Cm(t) {
  const n = [];
  for (const e of t)
    switch (e.type) {
      case "M":
        n.push(`M${G(e.x)} ${G(e.y)}`);
        break;
      case "L":
        n.push(`L${G(e.x)} ${G(e.y)}`);
        break;
      case "C":
        n.push(
          `C${G(e.x1)} ${G(e.y1)} ${G(e.x2)} ${G(e.y2)} ${G(e.x)} ${G(e.y)}`
        );
        break;
    }
  return n.push("Z"), n.join(" ");
}
function Am(t) {
  if (t.length === 0) return "";
  const n = [], e = t.length;
  let s = 0;
  for (let a = 0; a < e; a++)
    if (t[a].onCurve) {
      s = a;
      break;
    }
  const o = t[s];
  n.push(`M${G(o.x)} ${G(o.y)}`);
  let i = 1;
  for (; i < e; ) {
    const a = (s + i) % e, c = t[a];
    if (c.onCurve)
      n.push(`L${G(c.x)} ${G(c.y)}`), i++;
    else {
      const f = (s + i + 1) % e, u = t[f];
      if (u.onCurve)
        n.push(`Q${G(c.x)} ${G(c.y)} ${G(u.x)} ${G(u.y)}`), i += 2;
      else {
        const l = (c.x + u.x) / 2, g = (c.y + u.y) / 2;
        n.push(`Q${G(c.x)} ${G(c.y)} ${G(l)} ${G(g)}`), i++;
      }
    }
  }
  const r = t[(s + e - 1) % e];
  return r.onCurve || n.push(
    `Q${G(r.x)} ${G(r.y)} ${G(o.x)} ${G(o.y)}`
  ), n.push("Z"), n.join(" ");
}
function wc(t, n = "cff") {
  const e = Em(t);
  if (e.length === 0) return [];
  const s = [];
  let o = null;
  for (const i of e)
    i.op === "M" ? (o && o.length > 0 && s.push(o), o = [i]) : i.op === "Z" ? (o && o.length > 0 && s.push(o), o = null) : o && o.push(i);
  return o && o.length > 0 && s.push(o), n === "truetype" ? s.map((i) => Im(i)) : s.map((i) => Om(i));
}
function Om(t) {
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
        const s = n[n.length - 1], o = s ? s.x : 0, i = s ? s.y : 0, r = o + 2 / 3 * (e.x1 - o), a = i + 2 / 3 * (e.y1 - i), c = e.x + 2 / 3 * (e.x1 - e.x), f = e.y + 2 / 3 * (e.y1 - e.y);
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
function Im(t) {
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
        const s = n[n.length - 1], o = s ? s.x : 0, i = s ? s.y : 0, r = Ys(
          o,
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
function Em(t) {
  const n = [], e = t.match(
    /[MmLlHhVvCcSsQqTtZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  );
  if (!e) return n;
  let s = 0, o = 0, i = 0, r = 0, a = "", c = 0, f = 0, u = 0;
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
        p && (d += s, x += o), n.push({ op: "M", x: d, y: x }), s = i = d, o = r = x, a = p ? "l" : "L";
        break;
      }
      case "L": {
        let d = l(), x = l();
        p && (d += s, x += o), n.push({ op: "L", x: d, y: x }), s = d, o = x, a = g;
        break;
      }
      case "H": {
        let d = l();
        p && (d += s), n.push({ op: "L", x: d, y: o }), s = d, a = g;
        break;
      }
      case "V": {
        let d = l();
        p && (d += o), n.push({ op: "L", x: s, y: d }), o = d, a = g;
        break;
      }
      case "C": {
        let d = l(), x = l(), m = l(), y = l(), S = l(), w = l();
        p && (d += s, x += o, m += s, y += o, S += s, w += o), n.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: S, y: w }), c = m, f = y, s = S, o = w, a = g;
        break;
      }
      case "S": {
        let d = 2 * s - c, x = 2 * o - f;
        a.toUpperCase() !== "C" && a.toUpperCase() !== "S" && (d = s, x = o);
        let m = l(), y = l(), S = l(), w = l();
        p && (m += s, y += o, S += s, w += o), n.push({ op: "C", x1: d, y1: x, x2: m, y2: y, x: S, y: w }), c = m, f = y, s = S, o = w, a = g;
        break;
      }
      case "Q": {
        let d = l(), x = l(), m = l(), y = l();
        p && (d += s, x += o, m += s, y += o), n.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, s = m, o = y, a = g;
        break;
      }
      case "T": {
        let d = 2 * s - c, x = 2 * o - f;
        a.toUpperCase() !== "Q" && a.toUpperCase() !== "T" && (d = s, x = o);
        let m = l(), y = l();
        p && (m += s, y += o), n.push({ op: "Q", x1: d, y1: x, x: m, y }), c = d, f = x, s = m, o = y, a = g;
        break;
      }
      case "Z": {
        n.push({ op: "Z" }), s = i, o = r, a = g;
        break;
      }
      default:
        a = g;
        break;
    }
  }
  return n;
}
function Ys(t, n, e, s, o, i, r, a, c = 0) {
  const f = (3 * (e + o) - t - r) / 4, u = (3 * (s + i) - n - a) / 4, l = t + 2 / 3 * (f - t), g = n + 2 / 3 * (u - n), p = r + 2 / 3 * (f - r), h = a + 2 / 3 * (u - a), d = Math.hypot(e - l, s - g), x = Math.hypot(o - p, i - h);
  if (Math.max(d, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: u, x: r, y: a }];
  const y = (t + e) / 2, S = (n + s) / 2, w = (e + o) / 2, _ = (s + i) / 2, v = (o + r) / 2, b = (i + a) / 2, E = (y + w) / 2, A = (S + _) / 2, C = (w + v) / 2, I = (_ + b) / 2, O = (E + C) / 2, T = (A + I) / 2, D = Ys(
    t,
    n,
    y,
    S,
    E,
    A,
    O,
    T,
    c + 1
  ), M = Ys(
    O,
    T,
    C,
    I,
    v,
    b,
    r,
    a,
    c + 1
  );
  return D.concat(M);
}
function G(t) {
  const n = Math.round(t * 100) / 100;
  return n === Math.floor(n) ? String(n) : n.toFixed(2).replace(/0+$/, "");
}
function Tm(t) {
  if (!t || typeof t != "object")
    throw new Error("createGlyph: options object is required");
  const {
    name: n,
    unicode: e,
    unicodes: s,
    advanceWidth: o,
    leftSideBearing: i,
    advanceHeight: r,
    topSideBearing: a,
    path: c,
    contours: f,
    charString: u,
    components: l,
    instructions: g,
    format: p = "cff"
  } = t;
  if (n == null)
    throw new Error("createGlyph: name is required");
  if (o == null)
    throw new Error("createGlyph: advanceWidth is required");
  const h = {
    name: n,
    advanceWidth: o
  };
  if (s && s.length > 0 ? h.unicodes = s : e != null && (h.unicode = e), i !== void 0 && (h.leftSideBearing = i), r !== void 0 && (h.advanceHeight = r), a !== void 0 && (h.topSideBearing = a), g && (h.instructions = g), u)
    h.charString = u;
  else if (c) {
    const d = wc(c, p);
    h.contours = d, p === "cff" && (h.charString = pe(d));
  } else f ? (h.contours = f, f.length > 0 && f[0] && f[0].length > 0 && f[0][0].type && (h.charString = pe(f))) : l && (h.components = l);
  return h;
}
function ys(t, n) {
  const e = t?.glyphs;
  if (!e || !Array.isArray(e)) return;
  const s = _c(n);
  if (s !== void 0)
    return Sc(e, s);
  if (typeof n == "string")
    return e.find((o) => o.name === n);
}
function Te(t, n) {
  const e = _c(n);
  if (e !== void 0)
    return Sc(t, e)?.name;
  if (typeof n == "string")
    return n;
}
function _c(t) {
  if (typeof t == "number") return t;
  if (typeof t == "string") {
    const n = t.match(/^(?:U\+|0x)([0-9A-Fa-f]+)$/i);
    if (n) return parseInt(n[1], 16);
  }
}
function Sc(t, n) {
  for (const e of t)
    if (e.unicode === n || e.unicodes && e.unicodes.includes(n) || e.codePoint === n) return e;
}
const Dm = {
  cmap: Wu,
  head: Cs,
  hhea: o0,
  HVAR: f0,
  hmtx: r0,
  maxp: W0,
  MVAR: tg,
  name: ag,
  hdmx: Qh,
  BASE: vu,
  JSTF: S0,
  MATH: $0,
  MERG: Y0,
  meta: J0,
  DSIG: Wl,
  LTSH: U0,
  CBLC: Qs,
  CBDT: Ks,
  "OS/2": fg,
  kern: C0,
  PCLT: hg,
  VDMX: Dg,
  post: pg,
  STAT: bg,
  "CFF ": Rf,
  CFF2: Hf,
  VORG: qf,
  fvar: sh,
  avar: Kf,
  loca: Ap,
  glyf: hp,
  gvar: bp,
  GDEF: ih,
  GPOS: yh,
  GSUB: Fh,
  "cvt ": rp,
  cvar: op,
  fpgm: cp,
  prep: Op,
  gasp: up,
  vhea: zg,
  VVAR: Gg,
  vmtx: Vg,
  COLR: Gl,
  CPAL: $l,
  EBLC: Jl,
  EBDT: Xl,
  EBSC: th,
  bloc: Zu,
  bdat: Fu,
  sbix: xg,
  ltag: V0,
  "SVG ": Ag
}, Bm = [
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
function De(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFont expects an ArrayBuffer");
  const n = new Uint8Array(t);
  if (n.length >= 4) {
    const s = String.fromCharCode(
      n[0],
      n[1],
      n[2],
      n[3]
    );
    if (s === "wOFF") {
      const { sfnt: o, metadata: i, privateData: r } = em(t), a = De(o);
      return a._woff = { version: 1 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (s === "wOF2") {
      const { sfnt: o, metadata: i, privateData: r } = gm(t), a = De(o);
      return a._woff = { version: 2 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (s === "ttcf")
      return Lm(t);
  }
  const e = Mm(t);
  return fr(e);
}
function Mm(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const n = new B(new Uint8Array(t)), e = bc(n), s = vc(n, e.numTables), o = kc(t, s);
  return { header: e, tables: o };
}
function Lm(t) {
  const n = new B(new Uint8Array(t)), e = n.tag();
  if (e !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const s = n.uint16(), o = n.uint16(), i = n.uint32(), r = n.array("uint32", i);
  let a, c, f;
  s >= 2 && (a = n.uint32(), c = n.uint32(), f = n.uint32());
  const u = r.map((g) => {
    const p = new B(new Uint8Array(t), g), h = bc(p), d = vc(p, h.numTables), x = Rm(
      t,
      d,
      g
    ), m = kc(t, x);
    return fr({ header: h, tables: m });
  }), l = {
    tag: e,
    majorVersion: s,
    minorVersion: o,
    numFonts: i
  };
  return s >= 2 && (l.dsigTag = a, l.dsigLength = c, l.dsigOffset = f), { collection: l, fonts: u };
}
function Rm(t, n, e) {
  const s = n.find((g) => g.tag === "head");
  if (!s)
    return n;
  const o = s.offset, i = e + s.offset, r = o + s.length <= t.byteLength, a = i + s.length <= t.byteLength;
  if (!r && a)
    return n.map((g) => ({
      ...g,
      offset: e + g.offset
    }));
  if (r && !a || !r && !a)
    return n;
  const c = Cs(
    Array.from(new Uint8Array(t, o, s.length))
  ), f = Cs(
    Array.from(new Uint8Array(t, i, s.length))
  ), u = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !u ? n.map((g) => ({
    ...g,
    offset: e + g.offset
  })) : n;
}
function bc(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function vc(t, n) {
  const e = [];
  for (let s = 0; s < n; s++)
    e.push({
      tag: t.tag(),
      checksum: t.uint32(),
      offset: t.offset32(),
      length: t.uint32()
    });
  return e;
}
function kc(t, n) {
  const e = {}, s = new Map(n.map((a) => [a.tag, a])), o = Bm.filter((a) => s.has(a)), i = n.map((a) => a.tag).filter((a) => !o.includes(a)), r = [...o, ...i];
  for (const a of r) {
    const c = s.get(a), f = c.offset, u = new Uint8Array(t, f, c.length), l = Array.from(u), g = Dm[a];
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
const zm = /* @__PURE__ */ new Set([
  "_dirty",
  "_fileName",
  "_originalBuffer",
  "_collection",
  "_collectionFonts",
  "_woff"
]);
function Fm(t, n = 2) {
  return JSON.stringify(
    t,
    function(e, s) {
      if (!(this === t && zm.has(e)))
        return typeof s == "bigint" ? Number(s) : ArrayBuffer.isView(s) && !(s instanceof DataView) ? Array.from(s) : s;
    },
    n
  );
}
function Vm(t) {
  return JSON.parse(t);
}
function Pm(t) {
  if (!t || typeof t != "object")
    throw new Error("createKerning: input is required (object or array)");
  const n = Array.isArray(t) ? t : [t], e = {}, s = [];
  for (const i of n)
    if (i.classes)
      for (const [r, a] of Object.entries(i.classes)) {
        if (!Array.isArray(a))
          throw new Error(
            `createKerning: class "${r}" must be an array of glyph names`
          );
        e[r] = a;
      }
  for (const i of n)
    if (i.left !== void 0 && i.right !== void 0 && i.value !== void 0)
      er(i.left, i.right, i.value, e, s);
    else if (i.left !== void 0 && i.pairs) {
      const r = on(i.left, e);
      for (const [a, c] of Object.entries(i.pairs)) {
        const f = on(a, e);
        for (const u of r)
          for (const l of f)
            s.push({ left: u, right: l, value: c });
      }
    } else if (i.groups)
      for (const [r, a] of Object.entries(i.groups)) {
        const c = on(r, e);
        for (const [f, u] of Object.entries(a)) {
          const l = on(f, e);
          for (const g of c)
            for (const p of l)
              s.push({ left: g, right: p, value: u });
        }
      }
    else if (i.classes && i.pairs)
      for (const r of i.pairs)
        er(r.left, r.right, r.value, e, s);
  const o = /* @__PURE__ */ new Map();
  for (const i of s)
    o.set(`${i.left}\0${i.right}`, i);
  return [...o.values()];
}
function er(t, n, e, s, o) {
  const i = on(t, s), r = on(n, s);
  for (const a of i)
    for (const c of r)
      o.push({ left: a, right: c, value: e });
}
function Um(t, n, e) {
  const s = t?.kerning;
  if (!s || !Array.isArray(s) || s.length === 0)
    return;
  const o = t.glyphs, i = Te(o, n), r = Te(o, e);
  if (!(i === void 0 || r === void 0))
    for (let a = s.length - 1; a >= 0; a--) {
      const c = s[a];
      if (c.left === i && c.right === r) return c.value;
    }
}
function on(t, n) {
  if (typeof t == "string" && t.startsWith("@")) {
    const e = t.slice(1), s = n[e];
    if (!s)
      throw new Error(`createKerning: unknown class "@${e}"`);
    return s;
  }
  return [t];
}
const Gm = [
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
], Nm = ["CFF ", "CFF2", "VORG"], $m = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], Hm = /* @__PURE__ */ new Set([
  ...Gm,
  ...Nm,
  ...$m
]), Zm = [
  "cmap",
  "head",
  "hhea",
  "hmtx",
  "maxp",
  "name",
  "post"
];
function pt(t) {
  return t !== null && typeof t == "object" && !Array.isArray(t);
}
function Cc(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function Ac(t) {
  return Array.isArray(t?._raw);
}
function V(t, n, e, s, o) {
  t.push({ severity: n, code: e, message: s, path: o });
}
function sr(t) {
  const n = t > 0 ? 2 ** Math.floor(Math.log2(t)) : 0, e = n * 16, s = n > 0 ? Math.floor(Math.log2(n)) : 0, o = t * 16 - e;
  return { searchRange: e, entrySelector: s, rangeShift: o };
}
function or(t) {
  return pt(t) && (t["CFF "] || t.CFF2) ? 1330926671 : 65536;
}
function ir(t) {
  const n = t.filter((o) => o.severity === "error"), e = t.filter((o) => o.severity === "warning"), s = t.filter((o) => o.severity === "info");
  return {
    valid: n.length === 0,
    errors: n,
    warnings: e,
    infos: s,
    issues: t,
    summary: {
      errorCount: n.length,
      warningCount: e.length,
      infoCount: s.length,
      issueCount: t.length
    }
  };
}
function jm(t, n, e, s) {
  let o = t.header;
  if (!pt(o))
    if (pt(t._header))
      t.header = { ...t._header }, o = t.header, V(
        s,
        "info",
        "HEADER_PROMOTED",
        'No "header" found; promoted "_header" for export compatibility.',
        e
      );
    else {
      const a = or(t.tables), c = sr(n);
      t.header = {
        sfVersion: a,
        numTables: n,
        ...c
      }, o = t.header, V(
        s,
        "info",
        "HEADER_SYNTHESIZED",
        `No header found; synthesized one (sfVersion=0x${a.toString(16).toUpperCase().padStart(8, "0")}, ${n} tables).`,
        e
      );
      return;
    }
  if (!Cc(o.sfVersion)) {
    const a = or(t.tables);
    o.sfVersion = a, V(
      s,
      "info",
      "HEADER_SFVERSION_INFERRED",
      `header.sfVersion was missing or invalid; set to 0x${a.toString(16).toUpperCase().padStart(8, "0")} based on outline tables.`,
      `${e}.sfVersion`
    );
  }
  if (o.numTables !== void 0 && (!Number.isInteger(o.numTables) || o.numTables < 0) && V(
    s,
    "error",
    "HEADER_NUMTABLES_INVALID",
    "header.numTables must be a non-negative integer when provided.",
    `${e}.numTables`
  ), o.numTables !== n) {
    const a = o.numTables;
    o.numTables = n, V(
      s,
      "info",
      "HEADER_NUMTABLES_CORRECTED",
      a === void 0 ? `header.numTables was missing; set to ${n}.` : `header.numTables corrected from ${a} to ${n}.`,
      `${e}.numTables`
    );
  }
  const i = sr(n);
  (o.searchRange !== i.searchRange || o.entrySelector !== i.entrySelector || o.rangeShift !== i.rangeShift) && (o.searchRange = i.searchRange, o.entrySelector = i.entrySelector, o.rangeShift = i.rangeShift, V(
    s,
    "info",
    "HEADER_FIELDS_CORRECTED",
    `Header directory fields auto-corrected for ${n} tables (searchRange=${i.searchRange}, entrySelector=${i.entrySelector}, rangeShift=${i.rangeShift}).`,
    e
  ));
}
function Wm(t, n, e) {
  if (!Array.isArray(t)) {
    V(
      e,
      "error",
      "TABLE_RAW_INVALID_TYPE",
      "_raw must be an array of byte values.",
      n
    );
    return;
  }
  for (let s = 0; s < t.length; s++) {
    const o = t[s];
    if (!Number.isInteger(o) || o < 0 || o > 255) {
      V(
        e,
        "error",
        "TABLE_RAW_INVALID_BYTE",
        `_raw[${s}] must be an integer byte (0-255).`,
        `${n}[${s}]`
      );
      break;
    }
  }
}
function qm(t, n, e) {
  if (!pt(t))
    return V(
      e,
      "error",
      "TABLES_MISSING",
      "Font tables are required and must be an object keyed by 4-char table tag.",
      n
    ), [];
  const s = Object.keys(t);
  s.length === 0 && V(
    e,
    "error",
    "TABLES_EMPTY",
    "Font tables object is empty; at least core required tables are needed.",
    n
  );
  for (const o of s) {
    (typeof o != "string" || o.length !== 4) && V(
      e,
      "error",
      "TABLE_TAG_INVALID",
      `Table tag "${o}" must be exactly 4 characters.`,
      `${n}.${o}`
    );
    const i = t[o], r = `${n}.${o}`;
    if (!pt(i)) {
      V(
        e,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${o}" must be an object.`,
        r
      );
      continue;
    }
    i._checksum !== void 0 && !Cc(i._checksum) && V(
      e,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${o}" _checksum must be uint32 when provided.`,
      `${r}._checksum`
    ), i._raw !== void 0 && Wm(i._raw, `${r}._raw`, e);
    const a = Hm.has(o), c = Ac(i);
    !c && !a ? V(
      e,
      "error",
      "TABLE_WRITER_UNSUPPORTED",
      `Table "${o}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
      r
    ) : c && !a && V(
      e,
      "info",
      "TABLE_UNRECOGNIZED_RAW",
      `Table "${o}" is not a recognized OpenType table; preserved via _raw bytes.`,
      r
    );
  }
  return s;
}
function Ym(t, n, e) {
  const s = (r) => t[r] !== void 0, o = (r) => s(r) && !Ac(t[r]), i = (r, a, c = "requires") => {
    if (o(r))
      for (const f of a)
        s(f) || V(
          e,
          "error",
          "TABLE_DEPENDENCY_MISSING",
          `Parsed table "${r}" ${c} table "${f}".`,
          `${n}.${r}`
        );
  };
  i("hmtx", ["hhea", "maxp"]), i("loca", ["head", "maxp"]), i("glyf", ["loca", "head", "maxp"]), i("vmtx", ["vhea", "maxp"]), o("gvar") && !s("fvar") && V(
    e,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "gvar" usually expects "fvar" to describe variation axes.',
    `${n}.gvar`
  ), o("cvar") && !s("fvar") && V(
    e,
    "warning",
    "VARIABLE_TABLE_DEPENDENCY",
    'Parsed table "cvar" usually expects "fvar" to describe variation axes.',
    `${n}.cvar`
  );
}
function Xm(t, n, e) {
  const s = (r) => t[r] !== void 0;
  for (const r of Zm)
    s(r) || V(
      e,
      "error",
      "REQUIRED_TABLE_MISSING",
      `Required core table "${r}" is missing.`,
      n
    );
  s("OS/2") || V(
    e,
    "warning",
    "RECOMMENDED_TABLE_MISSING",
    'Recommended table "OS/2" is missing.',
    n
  );
  const o = s("glyf") || s("loca"), i = s("CFF ") || s("CFF2");
  !o && !i && V(
    e,
    "error",
    "OUTLINE_MISSING",
    "No outline tables found. Include TrueType (glyf+loca) or CFF (CFF / CFF2) outlines.",
    n
  ), o && (s("glyf") || V(
    e,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "glyf".',
    n
  ), s("loca") || V(
    e,
    "error",
    "TRUETYPE_OUTLINE_INCOMPLETE",
    'TrueType outline requires table "loca".',
    n
  )), o && i && V(
    e,
    "warning",
    "MULTIPLE_OUTLINE_TYPES",
    "Both TrueType and CFF outline tables are present; most fonts use one outline model.",
    n
  );
}
function Oc(t, n, e) {
  if (!pt(t)) {
    V(
      e,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      n
    );
    return;
  }
  const s = qm(t.tables, `${n}.tables`, e);
  jm(t, s.length, `${n}.header`, e), pt(t.tables) && (Xm(t.tables, `${n}.tables`, e), Ym(t.tables, `${n}.tables`, e));
}
function Km(t, n, e) {
  const s = t.collection, o = t.fonts;
  if (pt(s) || V(
    e,
    "error",
    "COLLECTION_META_INVALID",
    "collection must be an object for TTC/OTC inputs.",
    `${n}.collection`
  ), !Array.isArray(o) || o.length === 0) {
    V(
      e,
      "error",
      "COLLECTION_FONTS_INVALID",
      "fonts must be a non-empty array for TTC/OTC inputs.",
      `${n}.fonts`
    );
    return;
  }
  pt(s) && s.numFonts !== void 0 && s.numFonts !== o.length && (s.numFonts = o.length, V(
    e,
    "info",
    "COLLECTION_NUMFONTS_CORRECTED",
    `collection.numFonts corrected to ${o.length} to match fonts array.`,
    `${n}.collection.numFonts`
  ));
  for (let i = 0; i < o.length; i++)
    Oc(o[i], `${n}.fonts[${i}]`, e);
}
function Jm(t) {
  const n = [];
  return pt(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? Km(t, "$", n) : Oc(t, "$", n), ir(n)) : (V(
    n,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), ir(n));
}
const Qm = {
  name: ".notdef",
  advanceWidth: 500,
  contours: [
    [
      { x: 50, y: 0, onCurve: !0 },
      { x: 50, y: 700, onCurve: !0 },
      { x: 450, y: 700, onCurve: !0 },
      { x: 450, y: 0, onCurve: !0 }
    ]
  ]
};
class Jt {
  /**
   * @private — use FontFlux.open(), FontFlux.create(), or FontFlux.fromJSON().
   * @param {object} data - The internal simplified font data object.
   */
  constructor(n) {
    this._data = n;
  }
  // ========================================================================
  //  STATIC FACTORY METHODS
  // ========================================================================
  /**
   * Create a new font from scratch (Scenario 2).
   *
   * Returns a FontFlux instance with .notdef and space glyphs, ready for
   * addGlyph() calls and immediate export.
   *
   * @param {object} [options]
   * @param {string} options.family - Font family name (required)
   * @param {string} [options.style='Regular'] - Style name
   * @param {number} [options.unitsPerEm=1000] - Units per em
   * @param {number} [options.ascender=800] - Ascender
   * @param {number} [options.descender=-200] - Descender
   * @returns {FontFlux}
   */
  static create(n = {}) {
    const {
      family: e = "Untitled",
      style: s = "Regular",
      unitsPerEm: o = 1e3,
      ascender: i = 800,
      descender: r = -200
    } = n, a = {
      font: {
        familyName: e,
        styleName: s,
        unitsPerEm: o,
        ascender: i,
        descender: r,
        lineGap: 0
      },
      glyphs: [
        { ...Qm },
        {
          name: "space",
          unicode: 32,
          advanceWidth: Math.round(o / 4)
        }
      ],
      kerning: []
    };
    return new Jt(a);
  }
  /**
   * Open an existing font from binary data (Scenario 1).
   *
   * @param {ArrayBuffer} buffer - Binary font data (TTF/OTF/WOFF/WOFF2/TTC/OTC).
   * @returns {FontFlux} Single-font instance. For collections, use openAll().
   * @throws {Error} If buffer is a collection (TTC/OTC) — use openAll() instead.
   */
  static open(n) {
    const e = De(n);
    if (e.collection && e.fonts)
      throw new Error(
        "FontFlux.open() received a font collection (TTC/OTC). Use FontFlux.openAll() for collections."
      );
    return new Jt(e);
  }
  /**
   * Open all fonts from a binary file. Works for both single fonts and collections.
   *
   * @param {ArrayBuffer} buffer - Binary font data.
   * @returns {FontFlux[]} Array of FontFlux instances (one per face).
   */
  static openAll(n) {
    const e = De(n);
    return e.collection && e.fonts ? e.fonts.map((s) => new Jt(s)) : [new Jt(e)];
  }
  /**
   * Restore a font from a JSON string.
   *
   * @param {string} jsonString - JSON produced by font.toJSON().
   * @returns {FontFlux}
   */
  static fromJSON(n) {
    const e = Vm(n);
    return new Jt(e);
  }
  /**
   * Initialize WOFF2 support. Must be called (and awaited) once before
   * opening or exporting WOFF2 files.
   *
   * @returns {Promise<void>}
   */
  static async initWoff2() {
    return gc();
  }
  /**
   * Export a collection of FontFlux instances as a TTC/OTC file.
   *
   * @param {FontFlux[]} fonts - Array of FontFlux instances.
   * @param {object} [options] - Export options.
   * @param {string} [options.format='sfnt'] - Output format: 'sfnt', 'woff', 'woff2'.
   * @returns {ArrayBuffer}
   */
  static exportCollection(n, e = {}) {
    if (!Array.isArray(n) || n.length === 0)
      throw new Error(
        "exportCollection requires a non-empty array of FontFlux instances"
      );
    const s = {
      collection: {
        tag: "ttcf",
        majorVersion: 2,
        minorVersion: 0,
        numFonts: n.length
      },
      fonts: n.map((o) => o._data)
    };
    return nr(s, e);
  }
  // ========================================================================
  //  STATIC UTILITIES (font-independent)
  // ========================================================================
  /** Convert an SVG path `d` string to font contours. */
  static svgToContours(n, e) {
    return wc(n, e);
  }
  /** Convert font contours to an SVG path `d` string. */
  static contoursToSVG(n) {
    return km(n);
  }
  /** Compile CFF contours to Type 2 charstring bytecode. */
  static compileCharString(n) {
    return pe(n);
  }
  /** Assemble charstring assembly text to Type 2 bytecode. */
  static assembleCharString(n) {
    return Vc(n);
  }
  /** Interpret Type 2 charstring bytecode to CFF contours. */
  static interpretCharString(n, e, s) {
    return ar(n, e, s);
  }
  /** Disassemble Type 2 charstring bytecode to assembly text. */
  static disassembleCharString(n) {
    return cr(n);
  }
  // ========================================================================
  //  DIRECT DATA ACCESS (live references — zero friction reads)
  // ========================================================================
  /** Font metadata object. */
  get info() {
    return this._data.font;
  }
  /** Glyphs array. */
  get glyphs() {
    return this._data.glyphs;
  }
  /** Kerning pairs array. */
  get kerning() {
    return this._data.kerning || (this._data.kerning = []), this._data.kerning;
  }
  /** Variable font axes, or undefined. */
  get axes() {
    return this._data.axes;
  }
  /** Named instances, or undefined. */
  get instances() {
    return this._data.instances;
  }
  /** OpenType features { GPOS, GSUB, GDEF }, or undefined. */
  get features() {
    return this._data.features;
  }
  /** Original stored raw tables (Scenario 1 imports), or undefined. */
  get tables() {
    return this._data.tables;
  }
  /** Number of glyphs. */
  get glyphCount() {
    return this._data.glyphs.length;
  }
  /** Detected outline format: 'truetype', 'cff', or 'cff2'. */
  get format() {
    return this._data._header?.sfVersion === 1330926671 || this._data.glyphs.some((e) => e.charString) ? "cff" : "truetype";
  }
  // ========================================================================
  //  FONT INFO
  // ========================================================================
  /**
   * Get font metadata as a plain object.
   * @returns {object}
   */
  getInfo() {
    return this._data.font;
  }
  /**
   * Update font metadata by merging partial values.
   * @param {object} partial - Fields to update (e.g. { familyName: 'New' }).
   */
  setInfo(n) {
    Object.assign(this._data.font, n);
  }
  // ========================================================================
  //  GLYPHS
  // ========================================================================
  /**
   * List all glyphs (lightweight summary).
   * @returns {Array<{name: string, unicode: number|null, index: number}>}
   */
  listGlyphs() {
    return this._data.glyphs.map((n, e) => ({
      name: n.name,
      unicode: n.unicode ?? null,
      index: e
    }));
  }
  /**
   * Get a glyph by name, Unicode code point, or hex string.
   * Returns the live internal glyph object (direct mutation works).
   *
   * @param {string|number} id - Glyph name, code point, or hex string.
   * @returns {object|undefined}
   */
  getGlyph(n) {
    return ys(this._data, n);
  }
  /**
   * Check if a glyph exists.
   * @param {string|number} id
   * @returns {boolean}
   */
  hasGlyph(n) {
    return ys(this._data, n) !== void 0;
  }
  /**
   * Add or replace a glyph. If raw options are provided (not a glyph object),
   * they are passed through createGlyph() automatically.
   *
   * @param {object} glyphOrOptions - A glyph object or createGlyph() options.
   */
  addGlyph(n) {
    let e = n;
    (e.path || e.name && e.advanceWidth && !e._created) && (e = Tm(e));
    const s = this._data.glyphs, o = s.findIndex((i) => i.name === e.name);
    if (o >= 0) {
      s[o] = e;
      return;
    }
    if (e.unicode != null) {
      const i = s.findIndex((r) => r.unicode === e.unicode);
      if (i >= 0) {
        s[i] = e;
        return;
      }
    }
    s.push(e);
  }
  /**
   * Remove a glyph by name, Unicode code point, or hex string.
   * Also removes any kerning pairs referencing the removed glyph.
   *
   * @param {string|number} id
   * @returns {boolean} True if a glyph was removed.
   */
  removeGlyph(n) {
    const e = this._data.glyphs, s = ys(this._data, n);
    if (!s) return !1;
    const o = e.indexOf(s);
    return o < 0 ? !1 : (e.splice(o, 1), this._data.kerning && s.name && (this._data.kerning = this._data.kerning.filter(
      (i) => i.left !== s.name && i.right !== s.name
    )), !0);
  }
  // ========================================================================
  //  KERNING
  // ========================================================================
  /**
   * Get the kerning value for a pair of glyphs.
   *
   * @param {string|number} left - Glyph name, code point, or hex string.
   * @param {string|number} right - Glyph name, code point, or hex string.
   * @returns {number|undefined}
   */
  getKerning(n, e) {
    return Um(this._data, n, e);
  }
  /**
   * Add kerning pairs. Accepts all createKerning() input formats.
   * Duplicate pairs are resolved with last-write-wins.
   *
   * @param {object|object[]} pairsOrInput - Kerning data in any supported format.
   */
  addKerning(n) {
    const e = Pm(n);
    this._data.kerning || (this._data.kerning = []);
    for (const s of e) {
      const o = this._data.kerning.findIndex(
        (i) => i.left === s.left && i.right === s.right
      );
      o >= 0 ? this._data.kerning[o] = s : this._data.kerning.push(s);
    }
  }
  /**
   * Remove a specific kerning pair.
   *
   * @param {string|number} left
   * @param {string|number} right
   * @returns {boolean} True if a pair was removed.
   */
  removeKerning(n, e) {
    if (!this._data.kerning) return !1;
    const s = this._data.glyphs, o = Te(s, n), i = Te(s, e);
    if (!o || !i) return !1;
    const r = this._data.kerning.findIndex(
      (a) => a.left === o && a.right === i
    );
    return r < 0 ? !1 : (this._data.kerning.splice(r, 1), !0);
  }
  /**
   * List all kerning pairs.
   * @returns {Array<{left: string, right: string, value: number}>}
   */
  listKerning() {
    return this._data.kerning || [];
  }
  /**
   * Remove all kerning.
   */
  clearKerning() {
    this._data.kerning = [];
  }
  // ========================================================================
  //  VARIABLE FONT AXES
  // ========================================================================
  /**
   * List variable font axes.
   * @returns {Array<{tag: string, name: string, min: number, default: number, max: number}>}
   */
  listAxes() {
    return this._data.axes || [];
  }
  /**
   * Get a specific axis by tag.
   * @param {string} tag - 4-character axis tag (e.g. 'wght', 'wdth').
   * @returns {object|undefined}
   */
  getAxis(n) {
    return this._data.axes?.find((e) => e.tag === n);
  }
  /**
   * Add a new variable font axis.
   * @param {object} axis - { tag, name, min, default, max, hidden? }
   */
  addAxis(n) {
    this._data.axes || (this._data.axes = []);
    const e = this._data.axes.findIndex((s) => s.tag === n.tag);
    e >= 0 ? this._data.axes[e] = n : this._data.axes.push(n);
  }
  /**
   * Remove an axis by tag. Also removes instances referencing it.
   * @param {string} tag
   * @returns {boolean}
   */
  removeAxis(n) {
    if (!this._data.axes) return !1;
    const e = this._data.axes.findIndex((s) => s.tag === n);
    return e < 0 ? !1 : (this._data.axes.splice(e, 1), this._data.instances && (this._data.instances = this._data.instances.filter(
      (s) => !s.coordinates || !(n in s.coordinates)
    )), this._data.axes.length === 0 && (delete this._data.axes, delete this._data.instances), !0);
  }
  /**
   * Update an axis's properties.
   * @param {string} tag
   * @param {object} partial - Fields to update.
   * @returns {boolean}
   */
  setAxis(n, e) {
    const s = this._data.axes?.find((o) => o.tag === n);
    return s ? (Object.assign(s, e), !0) : !1;
  }
  // ========================================================================
  //  NAMED INSTANCES
  // ========================================================================
  /**
   * List named instances.
   * @returns {Array<{name: string, coordinates: object}>}
   */
  listInstances() {
    return this._data.instances || [];
  }
  /**
   * Add a named instance.
   * @param {object} instance - { name, coordinates: { wght: 700, ... } }
   */
  addInstance(n) {
    this._data.instances || (this._data.instances = []);
    const e = this._data.instances.findIndex(
      (s) => s.name === n.name
    );
    e >= 0 ? this._data.instances[e] = n : this._data.instances.push(n);
  }
  /**
   * Remove a named instance by name.
   * @param {string} name
   * @returns {boolean}
   */
  removeInstance(n) {
    if (!this._data.instances) return !1;
    const e = this._data.instances.findIndex((s) => s.name === n);
    return e < 0 ? !1 : (this._data.instances.splice(e, 1), !0);
  }
  // ========================================================================
  //  FEATURES & HINTING
  // ========================================================================
  /**
   * Get OpenType features (GPOS, GSUB, GDEF) as raw parsed objects.
   * @returns {object}
   */
  getFeatures() {
    return this._data.features || {};
  }
  /**
   * Replace or update feature tables.
   * @param {object} partial - { GPOS?, GSUB?, GDEF? }
   */
  setFeatures(n) {
    this._data.features || (this._data.features = {}), Object.assign(this._data.features, n);
  }
  /**
   * Get TrueType hinting tables.
   * @returns {object} { gasp?, cvt?, fpgm?, prep? }
   */
  getHinting() {
    return {
      gasp: this._data.gasp,
      cvt: this._data.cvt,
      fpgm: this._data.fpgm,
      prep: this._data.prep
    };
  }
  /**
   * Update TrueType hinting tables.
   * @param {object} partial - { gasp?, cvt?, fpgm?, prep? }
   */
  setHinting(n) {
    n.gasp !== void 0 && (this._data.gasp = n.gasp), n.cvt !== void 0 && (this._data.cvt = n.cvt), n.fpgm !== void 0 && (this._data.fpgm = n.fpgm), n.prep !== void 0 && (this._data.prep = n.prep);
  }
  // ========================================================================
  //  EXPORT & SERIALIZATION
  // ========================================================================
  /**
   * Export the font to binary data.
   *
   * @param {object} [options]
   * @param {string} [options.format] - 'sfnt', 'woff', or 'woff2'.
   * @returns {ArrayBuffer}
   */
  export(n) {
    return nr(this._data, n);
  }
  /**
   * Serialize the font to a JSON string.
   *
   * @param {number} [indent=2] - Indentation level.
   * @returns {string}
   */
  toJSON(n) {
    return Fm(this._data, n);
  }
  /**
   * Validate the font data.
   *
   * @returns {object} { valid, errors, warnings, infos }
   */
  validate() {
    return Jm(this._data);
  }
  /**
   * Strip stored tables and header, converting to a pure hand-authored shape.
   * Non-decomposed tables (COLR, gvar, bitmap data, etc.) are lost.
   *
   * @returns {FontFlux} Returns `this` for chaining.
   */
  detach() {
    return delete this._data._header, delete this._data.tables, delete this._data._woff, this;
  }
}
async function ty() {
  return gc();
}
export {
  Jt as FontFlux,
  ty as initWoff2
};
