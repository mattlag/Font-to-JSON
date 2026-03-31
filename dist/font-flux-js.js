function H(t) {
  if (!Number.isInteger(t) || t < -32768 || t > 32767)
    return ic(t);
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
function ic(t) {
  const n = Math.round(t * 65536), e = n < 0 ? n + 4294967296 : n;
  return [
    255,
    e >> 24 & 255,
    e >> 16 & 255,
    e >> 8 & 255,
    e & 255
  ];
}
const fs = 21, rc = 22, ac = 4, cc = 5, fc = 6, uc = 7, lc = 8, us = 14;
function lo(t) {
  if (!t || t.length === 0)
    return [...H(0), ...H(0), fs, us];
  const n = [];
  let e = 0, o = 0;
  for (const s of t)
    if (!(!s || s.length === 0))
      for (const i of s)
        switch (i.type) {
          case "M": {
            const r = i.x - e, a = i.y - o;
            r === 0 && a !== 0 ? n.push(...H(a), ac) : a === 0 && r !== 0 ? n.push(...H(r), rc) : n.push(...H(r), ...H(a), fs), e = i.x, o = i.y;
            break;
          }
          case "L": {
            const r = i.x - e, a = i.y - o;
            r === 0 && a !== 0 ? n.push(...H(a), uc) : a === 0 && r !== 0 ? n.push(...H(r), fc) : n.push(...H(r), ...H(a), cc), e = i.x, o = i.y;
            break;
          }
          case "C": {
            const r = i.x1 - e, a = i.y1 - o, c = i.x2 - i.x1, f = i.y2 - i.y1, u = i.x - i.x2, l = i.y - i.y2;
            n.push(
              ...H(r),
              ...H(a),
              ...H(c),
              ...H(f),
              ...H(u),
              ...H(l),
              lc
            ), e = i.x, o = i.y;
            break;
          }
        }
  return n.push(us), n;
}
const ls = {
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
function rm(t) {
  const n = [], e = t.split(`
`).filter((o) => o.trim().length > 0);
  for (const o of e) {
    const s = o.trim().split(/\s+/);
    if (s.length === 0) continue;
    let i = -1, r = null;
    for (let a = 0; a < s.length; a++) {
      const c = s[a].toLowerCase();
      if (ls[c] || c.startsWith("op")) {
        i = a, r = c;
        break;
      }
    }
    if (i === -1) {
      for (const a of s)
        n.push(...H(parseFloat(a)));
      continue;
    }
    for (let a = 0; a < i; a++)
      n.push(...H(parseFloat(s[a])));
    if (r.startsWith("op12.")) {
      const a = parseInt(r.slice(5), 10);
      n.push(12, a);
    } else r.startsWith("op") ? n.push(parseInt(r.slice(2), 10)) : n.push(...ls[r]);
    if (r === "hintmask" || r === "cntrmask") {
      const a = s.slice(i + 1).join("");
      if (a.length > 0)
        for (let c = 0; c < a.length; c += 8) {
          const f = a.slice(c, c + 8).padEnd(8, "0");
          n.push(parseInt(f, 2));
        }
    }
  }
  return n;
}
function Yi(t, n) {
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
function hs(t) {
  return t < 1240 ? 107 : t < 33900 ? 1131 : 32768;
}
function hc(t, n = [], e = []) {
  const o = [], s = [];
  let i = null, r = 0, a = 0, c = null, f = !1, u = !0;
  const l = hs(n.length), d = hs(e.length);
  function p(w, S) {
    i && i.length > 0 && s.push(i), r += w, a += S, i = [{ type: "M", x: r, y: a }];
  }
  function h(w, S) {
    r += w, a += S, i && i.push({ type: "L", x: r, y: a });
  }
  function g(w, S, k, b, D, C) {
    const A = r + w, I = a + S, O = A + k, E = I + b;
    r = O + D, a = E + C, i && i.push({ type: "C", x1: A, y1: I, x2: O, y2: E, x: r, y: a });
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
          g(
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
        const S = o.pop() + d;
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
          const S = o.pop(), k = o.pop();
          p(k, S);
        }
        o.length = 0;
        break;
      case 22:
        u && (o.length > 1 && (c = o.shift()), u = !1, f = !0), p(o.pop(), 0), o.length = 0;
        break;
      case 24:
        {
          const k = o.length - 2;
          let b = 0;
          for (; b < k; b += 6)
            g(
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
          const k = o.length - 6;
          let b = 0;
          for (; b < k; b += 2)
            h(o[b], o[b + 1]);
          g(
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
          let S = 0, k = 0;
          for (o.length % 4 !== 0 && (k = o[S++]); S + 3 < o.length; S += 4)
            g(k, o[S], o[S + 1], o[S + 2], 0, o[S + 3]), k = 0;
        }
        o.length = 0;
        break;
      case 27:
        {
          let S = 0, k = 0;
          for (o.length % 4 !== 0 && (k = o[S++]); S + 3 < o.length; S += 4)
            g(o[S], k, o[S + 1], o[S + 2], o[S + 3], 0), k = 0;
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
              const k = o.length - S === 5 ? o[S + 4] : 0;
              g(
                0,
                o[S],
                o[S + 1],
                o[S + 2],
                o[S + 3],
                k
              ), S += k !== 0 ? 5 : 4;
            }
            if (S + 3 < o.length) {
              const k = o.length - S === 5 ? o[S + 4] : 0;
              g(
                o[S],
                0,
                o[S + 1],
                o[S + 2],
                k,
                o[S + 3]
              ), S += k !== 0 ? 5 : 4;
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
              const k = o.length - S === 5 ? o[S + 4] : 0;
              g(
                o[S],
                0,
                o[S + 1],
                o[S + 2],
                k,
                o[S + 3]
              ), S += k !== 0 ? 5 : 4;
            }
            if (S + 3 < o.length) {
              const k = o.length - S === 5 ? o[S + 4] : 0;
              g(
                0,
                o[S],
                o[S + 1],
                o[S + 2],
                o[S + 3],
                k
              ), S += k !== 0 ? 5 : 4;
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
          const S = o[0], k = 0, b = o[1], D = o[2], C = o[3], A = 0, I = o[4], O = 0, E = o[5], B = -D, R = o[6], M = 0;
          g(S, k, b, D, C, A), g(I, O, E, B, R, M);
        }
        o.length = 0;
        break;
      case 35:
        g(o[0], o[1], o[2], o[3], o[4], o[5]), g(o[6], o[7], o[8], o[9], o[10], o[11]), o.length = 0;
        break;
      case 36:
        {
          const S = o[0], k = o[1], b = o[2], D = o[3], C = o[4], A = 0, I = o[5], O = 0, E = o[6], B = o[7], R = o[8], M = -(k + D + B);
          g(S, k, b, D, C, A), g(I, O, E, B, R, M);
        }
        o.length = 0;
        break;
      case 37:
        {
          const S = o[0], k = o[1], b = o[2], D = o[3], C = o[4], A = o[5], I = o[6], O = o[7], E = o[8], B = o[9], R = o[10], M = S + b + C + I + E, $ = k + D + A + O + B;
          let U, j;
          Math.abs(M) > Math.abs($) ? (U = R, j = -$) : (U = -M, j = R), g(S, k, b, D, C, A), g(I, O, E, B, U, j);
        }
        o.length = 0;
        break;
      default:
        o.length = 0;
        break;
    }
  }
  function _(w, S) {
    let k = S || 0, b = 0;
    for (; b < w.length; ) {
      const D = w[b], C = Yi(w, b);
      if (C !== null) {
        o.push(C.value), b += C.bytesConsumed;
        continue;
      }
      if (D === 12) {
        b++;
        const A = w[b];
        b++, y(A);
      } else if (D === 19 || D === 20) {
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), k += o.length >> 1, o.length = 0, b++;
        const A = Math.ceil(k / 8);
        b += A;
      } else if (D === 1 || D === 3 || D === 18 || D === 23)
        f || (o.length % 2 !== 0 && (c = o.shift()), f = !0, u = !1), k += o.length >> 1, o.length = 0, b++;
      else if (D === 10) {
        b++;
        const A = o.pop() + d;
        e[A] && _(e[A], k);
      } else if (D === 29) {
        b++;
        const A = o.pop() + l;
        n[A] && _(n[A], k);
      } else {
        if (D === 11)
          return;
        b++, m(D);
      }
    }
  }
  return _(t, 0), i && i.length > 0 && s.push(i), { contours: s, width: c };
}
const ds = {
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
}, dc = {
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
function pc(t) {
  const n = [], e = [];
  let o = 0, s = 0;
  for (; s < t.length; ) {
    const i = t[s], r = Yi(t, s);
    if (r !== null) {
      e.push(r.value), s += r.bytesConsumed;
      continue;
    }
    if (i === 12) {
      s++;
      const a = t[s];
      s++;
      const c = dc[a] || `op12.${a}`;
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
      const a = ds[i];
      n.push(e.length ? `${e.join(" ")} ${a}` : a), e.length = 0, s++;
    } else {
      const a = ds[i] || `op${i}`;
      n.push(e.length ? `${e.join(" ")} ${a}` : a), e.length = 0, s++;
    }
  }
  return e.length && n.push(e.join(" ")), n.join(`
`);
}
function qi(t) {
  const { header: n, tables: e } = t, o = mc(e), s = wc(e), i = { font: o, glyphs: s }, r = Sc(e, s);
  r.length > 0 && (i.kerning = r), e.fvar && (i.axes = _c(e), i.instances = bc(e));
  const a = {};
  return e.GPOS && !e.GPOS._raw && (a.GPOS = e.GPOS), e.GSUB && !e.GSUB._raw && (a.GSUB = e.GSUB), e.GDEF && !e.GDEF._raw && (a.GDEF = e.GDEF), Object.keys(a).length > 0 && (i.features = a), e.gasp && !e.gasp._raw && e.gasp.gaspRanges && (i.gasp = e.gasp.gaspRanges.map((c) => ({
    maxPPEM: c.rangeMaxPPEM,
    behavior: c.rangeGaspBehavior
  }))), e["cvt "] && !e["cvt "]._raw && e["cvt "].values && (i.cvt = e["cvt "].values), e.fpgm && !e.fpgm._raw && e.fpgm.instructions && (i.fpgm = e.fpgm.instructions), e.prep && !e.prep._raw && e.prep.instructions && (i.prep = e.prep.instructions), i.tables = { ...e }, i._header = n, i;
}
const gc = {
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
function mc(t) {
  const n = t.name, e = t.head, o = t.hhea, s = t["OS/2"], i = t.post, r = {};
  for (const [a, c] of Object.entries(gc)) {
    const f = le(n, Number(a));
    f !== void 0 && f.trim() !== "" && (r[c] = f);
  }
  return e && !e._raw && (r.unitsPerEm = e.unitsPerEm, r.created = ps(e.created), r.modified = ps(e.modified)), o && !o._raw && (r.ascender = o.ascender, r.descender = o.descender, r.lineGap = o.lineGap), i && !i._raw && (r.italicAngle = i.italicAngle, r.underlinePosition = i.underlinePosition, r.underlineThickness = i.underlineThickness, r.isFixedPitch = i.isFixedPitch !== 0), s && !s._raw && (r.weightClass = s.usWeightClass, r.widthClass = s.usWidthClass, r.fsType = s.fsType, r.fsSelection = s.fsSelection, r.achVendID = s.achVendID, s.panose && (r.panose = s.panose)), r;
}
function yc(t) {
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
function xc(t, n) {
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
function wc(t) {
  const n = t.glyf && !t.glyf._raw, e = t["CFF "] && !t["CFF "]._raw, o = t.hmtx && !t.hmtx._raw ? t.hmtx : null, s = t.vmtx && !t.vmtx._raw ? t.vmtx : null, i = t.hhea && !t.hhea._raw ? t.hhea : null, r = t.vhea && !t.vhea._raw ? t.vhea : null;
  let a = 0;
  t.maxp && !t.maxp._raw ? a = t.maxp.numGlyphs : n ? a = t.glyf.glyphs.length : e ? a = t["CFF "].fonts[0].charStrings.length : o && (a = o.hMetrics.length + (o.leftSideBearings?.length || 0));
  const c = i ? i.numberOfHMetrics : a, f = r ? r.numOfLongVerMetrics : 0, u = yc(t.cmap), l = xc(t, a), d = [];
  for (let p = 0; p < a; p++) {
    const h = {};
    l[p] && (h.name = l[p]);
    const g = u.get(p) || [];
    if (g.length === 1 ? h.unicode = g[0] : g.length > 1 ? (h.unicode = g[0], h.unicodes = g) : h.unicode = null, o && (p < c ? (h.advanceWidth = o.hMetrics[p].advanceWidth, h.leftSideBearing = o.hMetrics[p].lsb) : (h.advanceWidth = o.hMetrics[c - 1].advanceWidth, h.leftSideBearing = o.leftSideBearings[p - c])), s && (p < f ? (h.advanceHeight = s.vMetrics[p].advanceHeight, h.topSideBearing = s.vMetrics[p].topSideBearing) : s.topSideBearings && (h.advanceHeight = s.vMetrics[f - 1].advanceHeight, h.topSideBearing = s.topSideBearings[p - f])), n) {
      const x = t.glyf.glyphs[p];
      x && x.type === "simple" ? (h.contours = x.contours, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions)) : x && x.type === "composite" && (h.components = x.components, x.instructions && x.instructions.length > 0 && (h.instructions = x.instructions));
    }
    if (e) {
      const x = t["CFF "], m = x.fonts[0], y = m.charStrings;
      if (y[p]) {
        h.charString = y[p], h.charStringDisassembly = pc(y[p]);
        const _ = x.globalSubrs || [], w = m.localSubrs || [], S = hc(
          y[p],
          _,
          w
        );
        S.contours.length > 0 && (h.contours = S.contours);
      }
    }
    d.push(h);
  }
  return d;
}
function Sc(t, n) {
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
function _c(t) {
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
function bc(t) {
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
const Xi = Date.UTC(1904, 0, 1, 0, 0, 0);
function ps(t) {
  if (t == null) return;
  const n = typeof t == "bigint" ? t : BigInt(t);
  if (n === 0n) return;
  const e = Number(n) * 1e3 + Xi;
  if (!(!Number.isFinite(e) || e < -864e13 || e > 864e13))
    return new Date(e).toISOString();
}
function gs(t) {
  if (!t) return 0n;
  const n = Date.parse(t);
  return isNaN(n) ? 0n : BigInt(Math.floor((n - Xi) / 1e3));
}
function vc(t) {
  const { font: n, glyphs: e } = t, o = e.some((a) => a.charString), s = kc(e, n), i = {};
  if (i.head = Cc(n, s), i.hhea = Oc(n, s, e.length), i.maxp = Ic(e, o), i["OS/2"] = Dc(n, s), i.name = Ec(n), i.post = Tc(n, e), i.cmap = Rc(e), i.hmtx = zc(e), o ? i["CFF "] = Fc(n, e) : (i.glyf = Vc(e), i.loca = { offsets: [] }), t.kerning && t.kerning.length > 0 && (i.kern = Uc(t.kerning, e)), t.axes && t.axes.length > 0 && (i.fvar = Nc(t, i.name)), t.gasp && (i.gasp = {
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
function kc(t, n) {
  let e = 1 / 0, o = 1 / 0, s = -1 / 0, i = -1 / 0, r = 0, a = 0, c = 1 / 0, f = 1 / 0, u = -1 / 0, l = 65535, d = 0;
  const p = /* @__PURE__ */ new Set();
  for (const x of t) {
    const m = x.advanceWidth || 0;
    a += m, m > r && (r = m);
    const y = Zo(x);
    if (y) {
      y.xMin < e && (e = y.xMin), y.yMin < o && (o = y.yMin), y.xMax > s && (s = y.xMax), y.yMax > i && (i = y.yMax);
      const w = x.leftSideBearing ?? y.xMin, S = m - (w + (y.xMax - y.xMin)), k = w + (y.xMax - y.xMin);
      w < c && (c = w), S < f && (f = S), k > u && (u = k);
    }
    const _ = x.unicodes || (x.unicode ? [x.unicode] : []);
    for (const w of _)
      w < l && (l = w), w > d && (d = w), p.add(w);
  }
  e === 1 / 0 && (e = 0), o === 1 / 0 && (o = 0), s === -1 / 0 && (s = 0), i === -1 / 0 && (i = 0), c === 1 / 0 && (c = 0), f === 1 / 0 && (f = 0), u === -1 / 0 && (u = 0), l === 65535 && (l = 0), d === 0 && (d = 0);
  const h = ms(
    t,
    "xyvw",
    n.ascender ? Math.round(n.ascender / 2) : 0
  ), g = ms(
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
    lastCharIndex: Math.min(d, 65535),
    sxHeight: h,
    sCapHeight: g,
    unicodeRanges: p
  };
}
function Zo(t) {
  if (t.contours && t.contours.length > 0) {
    let n = 1 / 0, e = 1 / 0, o = -1 / 0, s = -1 / 0;
    for (const i of t.contours)
      for (const r of i)
        r.x < n && (n = r.x), r.y < e && (e = r.y), r.x > o && (o = r.x), r.y > s && (s = r.y);
    return { xMin: n, yMin: e, xMax: o, yMax: s };
  }
  return null;
}
function ms(t, n, e) {
  for (const o of n) {
    const s = o.charCodeAt(0), i = t.find((r) => (r.unicodes || (r.unicode ? [r.unicode] : [])).includes(s));
    if (i) {
      const r = Zo(i);
      if (r) return r.yMax;
    }
  }
  return e || 0;
}
function Ac(t) {
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
function Cc(t, n) {
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
    created: gs(t.created),
    modified: gs(t.modified),
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
function Oc(t, n, e) {
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
function Ic(t, n) {
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
function Dc(t, n) {
  const e = (t.weightClass || 400) >= 700, o = (t.italicAngle || 0) !== 0;
  let s = t.fsSelection;
  s === void 0 && (s = 0, e && (s |= 32), o && (s |= 1), !e && !o && (s |= 64));
  const i = Ac(n.unicodeRanges), r = n.unicodeRanges.has(32);
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
function Ec(t) {
  const n = [], e = {
    0: t.copyright || "",
    1: t.familyName || "",
    2: t.styleName || "",
    3: t.uniqueID || Bc(t),
    4: t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(),
    5: t.version || "Version 1.000",
    6: t.postScriptName || Ki(t),
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
function Bc(t) {
  const n = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim();
  return t.manufacturer ? `${t.manufacturer}: ${n}` : n;
}
function Ki(t) {
  const n = (t.familyName || "").replace(/\s/g, ""), e = t.styleName || "Regular";
  return `${n}-${e}`;
}
function Tc(t, n) {
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
function Rc(t) {
  const n = /* @__PURE__ */ new Map();
  let e = !1;
  for (let a = 0; a < t.length; a++) {
    const c = t[a], f = c.unicodes || (c.unicode != null ? [c.unicode] : []);
    for (const u of f)
      n.has(u) || n.set(u, a), u > 65535 && (e = !0);
  }
  const o = [...n.entries()].sort((a, c) => a[0] - c[0]), s = [], i = [];
  if (e) {
    const a = Mc(o);
    s.push({ format: 12, language: 0, groups: a }), i.push({ platformID: 3, encodingID: 10, subtableIndex: 0 }), i.push({ platformID: 0, encodingID: 4, subtableIndex: 0 });
  }
  const r = o.filter(([a]) => a <= 65535);
  if (r.length > 0) {
    const { segments: a, glyphIdArray: c } = Lc(r), f = s.length;
    s.push({ format: 4, language: 0, segments: a, glyphIdArray: c }), i.push({ platformID: 3, encodingID: 1, subtableIndex: f }), i.push({ platformID: 0, encodingID: 3, subtableIndex: f });
  }
  return { version: 0, encodingRecords: i, subtables: s };
}
function Mc(t) {
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
function Lc(t) {
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
function zc(t) {
  return { hMetrics: t.map((e) => ({
    advanceWidth: e.advanceWidth || 0,
    lsb: e.leftSideBearing ?? 0
  })), leftSideBearings: [] };
}
function Vc(t) {
  return { glyphs: t.map((e) => {
    if (e.contours && e.contours.length > 0) {
      const o = Zo(e);
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
function Fc(t, n) {
  const e = t.postScriptName || Ki(t), o = n.slice(1).map((l) => l.name || ".notdef"), s = n.map((l) => l.charString ? l.charString : l.contours && l.contours.length > 0 && l.contours[0]?.[0]?.type ? lo(l.contours) : []), i = [];
  function r(l) {
    const d = 391 + i.length;
    return i.push(l), d;
  }
  const a = t.fullName || `${t.familyName || ""} ${t.styleName || ""}`.trim(), c = t.familyName || "", f = Pc(t.weightClass), u = o.map((l) => r(l));
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
        charStrings: s,
        privateDict: {},
        localSubrs: []
      }
    ]
  };
}
function Pc(t) {
  return !t || t <= 400 ? "Regular" : t <= 500 ? "Medium" : t <= 600 ? "SemiBold" : t <= 700 ? "Bold" : t <= 800 ? "ExtraBold" : "Black";
}
function Uc(t, n) {
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
function Nc(t, n) {
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
function Gc(t, n, e = !0) {
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
  return o === 29 && e ? { value: t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0, bytesConsumed: 5 } : o === 30 && e ? $c(t, n + 1) : o === 255 && !e ? { value: (t[n + 1] << 24 | t[n + 2] << 16 | t[n + 3] << 8 | t[n + 4] | 0) / 65536, bytesConsumed: 5 } : null;
}
function $c(t, n) {
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
function Ji(t) {
  return Number.isInteger(t) ? Hc(t) : Zc(t);
}
function Hc(t) {
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
function Zc(t) {
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
function jc(t) {
  return t <= 21 && t !== 28 && t !== 29 && t !== 30;
}
function zt(t, n = 0, e = t.length) {
  const o = [], s = [];
  let i = n;
  for (; i < e; ) {
    const r = t[i];
    if (jc(r)) {
      let a;
      r === 12 ? (a = 3072 | t[i + 1], i += 2) : (a = r, i += 1), o.push({ operator: a, operands: [...s] }), s.length = 0;
    } else {
      const a = Gc(t, i, !0);
      a === null ? i += 1 : (s.push(a.value), i += a.bytesConsumed);
    }
  }
  return o;
}
function At(t, n) {
  const e = t[n] << 8 | t[n + 1];
  if (e === 0)
    return { items: [], totalBytes: 2 };
  const o = t[n + 2], s = n + 3, i = [];
  for (let f = 0; f <= e; f++) {
    let u = 0;
    const l = s + f * o;
    for (let d = 0; d < o; d++)
      u = u << 8 | t[l + d];
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
function qn(t, n) {
  const o = (t[n] << 24 | t[n + 1] << 16 | t[n + 2] << 8 | t[n + 3]) >>> 0;
  if (o === 0)
    return { items: [], totalBytes: 4 };
  const s = t[n + 4], i = n + 5, r = [];
  for (let u = 0; u <= o; u++) {
    let l = 0;
    const d = i + u * s;
    for (let p = 0; p < s; p++)
      l = l << 8 | t[d + p];
    r.push(l >>> 0);
  }
  const a = i + (o + 1) * s, c = [];
  for (let u = 0; u < o; u++) {
    const l = a + r[u] - 1, d = a + r[u + 1] - 1;
    c.push(new Uint8Array(Array.prototype.slice.call(t, l, d)));
  }
  const f = a + r[o] - 1 - n;
  return { items: c, totalBytes: f };
}
function vt(t) {
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
const ho = {
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
  Object.entries(ho).map(([t, n]) => [n, Number(t)])
), po = {
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
}, ys = Object.fromEntries(
  Object.entries(po).map(([t, n]) => [n, Number(t)])
), go = {
  17: "CharStrings",
  24: "VariationStore",
  3079: "FontMatrix",
  3108: "FDArray",
  3109: "FDSelect"
}, Kt = Object.fromEntries(
  Object.entries(go).map(([t, n]) => [n, Number(t)])
), Qi = {
  18: "Private"
}, tr = {
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
function Vt(t, n) {
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
function nr(t, n, e) {
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
function er(t) {
  const n = [0];
  for (const e of t)
    n.push(e);
  return n;
}
function Wc(t, n, e) {
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
function Yc(t) {
  if (typeof t == "string")
    return [];
  const n = [0];
  for (const e of t)
    n.push(e >> 8 & 255, e & 255);
  return n;
}
function qc(t, n) {
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
const or = /* @__PURE__ */ new Set([
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
]), xs = /* @__PURE__ */ new Set([
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
      ) : e.push(...Ji(r));
    o >= 3072 ? e.push(12, o & 255) : e.push(o);
  }
  return e;
}
function ws(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) n.push(t.charCodeAt(e));
  return n;
}
function Ss(t) {
  return String.fromCharCode(...t);
}
function Xc(t, n) {
  const e = new Uint8Array(t), o = e[0], s = e[1];
  let r = e[2];
  const a = At(e, r);
  r += a.totalBytes;
  const c = a.items.map(Ss), f = At(e, r);
  r += f.totalBytes;
  const u = At(e, r);
  r += u.totalBytes;
  const l = u.items.map(Ss), p = At(e, r).items.map((g) => Array.from(g)), h = f.items.map((g) => Kc(e, g));
  return {
    majorVersion: o,
    minorVersion: s,
    names: c,
    strings: l,
    globalSubrs: p,
    fonts: h
  };
}
function Kc(t, n) {
  const e = zt(n, 0, n.length), o = Vt(e, ho), s = o.CharStrings, i = o.charset ?? 0, r = o.Encoding ?? 0, a = o.Private;
  delete o.CharStrings, delete o.charset, delete o.Encoding, delete o.Private;
  const c = o.FDArray, f = o.FDSelect;
  delete o.FDArray, delete o.FDSelect;
  let u = [];
  s !== void 0 && (u = At(t, s).items.map((S) => Array.from(S)));
  const l = u.length, d = Wc(t, i, l), p = qc(t, r);
  let h = {}, g = [];
  if (Array.isArray(a) && a.length === 2) {
    const [w, S] = a, k = zt(t, S, S + w);
    h = Vt(k, po), h.Subrs !== void 0 && (g = At(t, S + h.Subrs).items.map((D) => Array.from(D)), delete h.Subrs);
  }
  const x = o.ROS !== void 0;
  let m, y;
  x && (c !== void 0 && (m = At(t, c).items.map((S) => {
    const k = zt(S, 0, S.length), b = Vt(k, ho);
    let D = {}, C = [];
    if (Array.isArray(b.Private) && b.Private.length === 2) {
      const [A, I] = b.Private, O = zt(t, I, I + A);
      D = Vt(O, po), D.Subrs !== void 0 && (C = At(t, I + D.Subrs).items.map((B) => Array.from(B)), delete D.Subrs), delete b.Private;
    }
    return {
      fontDict: b,
      privateDict: D,
      localSubrs: C
    };
  })), f !== void 0 && (y = nr(t, f, l)));
  const _ = {
    topDict: o,
    charset: d,
    encoding: p,
    charStrings: u,
    privateDict: h,
    localSubrs: g
  };
  return x && (_.isCIDFont = !0, m && (_.fdArray = m), y && (_.fdSelect = y)), _;
}
function Jc(t) {
  const {
    majorVersion: n = 1,
    minorVersion: e = 0,
    names: o = [],
    strings: s = [],
    globalSubrs: i = [],
    fonts: r = []
  } = t, a = [n, e, 4, 4], c = vt(o.map(ws)), f = vt(s.map(ws)), u = vt(
    i.map((_) => new Uint8Array(_))
  ), l = r.map((_) => Qc(_)), d = r.map(
    (_, w) => _s(
      _,
      l[w],
      /* baseOffset */
      0
    )
  ), p = vt(d);
  let g = a.length + c.length + p.length + f.length + u.length;
  const x = r.map((_, w) => {
    const S = _s(_, l[w], g);
    return g += l[w].totalSize, S;
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
  for (const _ of l)
    for (const w of _.sections)
      for (let S = 0; S < w.length; S++) y.push(w[S]);
  return y;
}
function Qc(t) {
  const n = [], e = {};
  let o = 0;
  const s = (t.charStrings || []).map((l) => new Uint8Array(l)), i = vt(s);
  e.charStrings = o, n.push(i), o += i.length;
  const r = t.charset;
  if (typeof r == "string")
    e.charset = r === "ISOAdobe" ? 0 : r === "Expert" ? 1 : 2, e.charsetIsPredefined = !0;
  else {
    const l = Yc(r || []);
    e.charset = o, e.charsetIsPredefined = !1, n.push(l), o += l.length;
  }
  const a = t.encoding;
  if (typeof a == "string")
    e.encoding = a === "Standard" ? 0 : 1, e.encodingIsPredefined = !0;
  else if (a && typeof a == "object") {
    const l = tf(a);
    e.encoding = o, e.encodingIsPredefined = !1, n.push(l), o += l.length;
  } else
    e.encoding = 0, e.encodingIsPredefined = !0;
  const c = cn(
    t.privateDict || {},
    ys
  );
  let f = null;
  if (t.localSubrs && t.localSubrs.length > 0 && (f = vt(
    t.localSubrs.map((l) => new Uint8Array(l))
  )), f) {
    const d = re(
      c,
      xs
    ).length + 6;
    c.push({
      operator: ys.Subrs,
      operands: [d]
    });
  }
  const u = re(c, xs);
  if (e.privateOffset = o, e.privateSize = u.length, n.push(u), o += u.length, f && (n.push(f), o += f.length), t.isCIDFont) {
    if (t.fdSelect) {
      const l = er(t.fdSelect);
      e.fdSelect = o, n.push(l), o += l.length;
    }
    if (t.fdArray) {
      const l = t.fdArray.map((p) => {
        const h = cn(
          p.fontDict || {},
          ft
        );
        return re(h, or);
      }), d = vt(l);
      e.fdArray = o, n.push(d), o += d.length;
    }
  }
  return { sections: n, totalSize: o, offsets: e };
}
function _s(t, n, e) {
  const o = n.offsets, s = cn(
    t.topDict || {},
    ft
  );
  return s.push({
    operator: ft.CharStrings,
    operands: [e + o.charStrings]
  }), o.charsetIsPredefined ? o.charset !== 0 && s.push({
    operator: ft.charset,
    operands: [o.charset]
  }) : s.push({
    operator: ft.charset,
    operands: [e + o.charset]
  }), o.encodingIsPredefined ? o.encoding !== 0 && s.push({
    operator: ft.Encoding,
    operands: [o.encoding]
  }) : s.push({
    operator: ft.Encoding,
    operands: [e + o.encoding]
  }), s.push({
    operator: ft.Private,
    operands: [o.privateSize, e + o.privateOffset]
  }), t.isCIDFont && (o.fdArray !== void 0 && s.push({
    operator: ft.FDArray,
    operands: [e + o.fdArray]
  }), o.fdSelect !== void 0 && s.push({
    operator: ft.FDSelect,
    operands: [e + o.fdSelect]
  })), re(s, or);
}
function tf(t) {
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
const nf = Object.fromEntries(
  Object.entries(Qi).map(([t, n]) => [n, Number(t)])
), ef = Object.fromEntries(
  Object.entries(tr).map(([t, n]) => [n, Number(t)])
), of = /* @__PURE__ */ new Set([
  17,
  // CharStrings
  24,
  // VariationStore
  3108,
  // FDArray
  3109
  // FDSelect
]), sf = /* @__PURE__ */ new Set([
  18
  // Private  (size + offset)
]), bs = /* @__PURE__ */ new Set([
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
      ) : e.push(...Ji(r));
    o >= 3072 ? e.push(12, o & 255) : e.push(o);
  }
  return e;
}
function rf(t, n) {
  const e = new Uint8Array(t), o = e[0], s = e[1], i = e[2], r = e[3] << 8 | e[4], a = i, c = a + r, f = zt(e, a, c), u = Vt(f, go), l = u.CharStrings, d = u.VariationStore, p = u.FDArray, h = u.FDSelect;
  delete u.CharStrings, delete u.VariationStore, delete u.FDArray, delete u.FDSelect;
  const x = qn(e, c).items.map((k) => Array.from(k));
  let m = [];
  l !== void 0 && (m = qn(e, l).items.map((b) => Array.from(b)));
  const y = m.length;
  let _ = [];
  p !== void 0 && (_ = qn(e, p).items.map((b) => {
    const D = zt(b, 0, b.length), C = Vt(D, {
      ...Qi,
      ...go
      // Font DICTs can also have FontMatrix
    });
    let A = {}, I = [];
    if (Array.isArray(C.Private) && C.Private.length === 2) {
      const [O, E] = C.Private, B = zt(e, E, E + O);
      A = Vt(B, tr), A.Subrs !== void 0 && (I = qn(e, E + A.Subrs).items.map((M) => Array.from(M)), delete A.Subrs), delete C.Private;
    }
    return {
      fontDict: C,
      privateDict: A,
      localSubrs: I
    };
  }));
  let w = null;
  h !== void 0 && y > 0 && (w = nr(e, h, y));
  let S = null;
  if (d !== void 0) {
    const k = e[d] << 8 | e[d + 1];
    S = Array.from(
      e.slice(d, d + k)
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
function af(t) {
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
  ), u = Xn(i.map((O) => new Uint8Array(O))), l = a ? er(a) : null, d = c ? new Uint8Array(c) : null, h = vs(o, {
    charStrings: 0,
    fdArray: r.length > 0 ? 0 : void 0,
    fdSelect: a ? 0 : void 0,
    variationStore: c ? 0 : void 0
  }).length, g = 5;
  let m = g + h + f.length;
  const y = m;
  m += u.length;
  let _;
  l && (_ = m, m += l.length);
  let w;
  d && (w = m, m += d.length);
  const S = r.map((O) => {
    const E = cn(
      O.privateDict || {},
      ef
    );
    let B = null;
    if (O.localSubrs && O.localSubrs.length > 0 && (B = Xn(
      O.localSubrs.map((M) => new Uint8Array(M))
    )), B) {
      const $ = ae(
        E,
        bs
      ).length + 6;
      E.push({
        operator: 19,
        // Subrs
        operands: [$]
      });
    }
    const R = ae(E, bs);
    return {
      privBytes: R,
      localSubrBytes: B,
      totalSize: R.length + (B ? B.length : 0)
    };
  }), k = [];
  for (const O of S)
    k.push({ offset: m, size: O.privBytes.length }), m += O.totalSize;
  let b = null, D;
  if (r.length > 0) {
    const O = r.map((E, B) => {
      const R = cn(E.fontDict || {}, {
        ...nf,
        ...Kt
      });
      return R.push({
        operator: 18,
        // Private
        operands: [k[B].size, k[B].offset]
      }), ae(R, sf);
    });
    b = Xn(O), D = m, m += b.length;
  }
  const C = vs(o, {
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
      g,
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
  if (d)
    for (let O = 0; O < d.length; O++)
      I.push(d[O]);
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
function vs(t, n) {
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
  }), ae(e, of);
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
const cf = 8, ff = 4;
function uf(t) {
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
function lf(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.defaultVertOriginY ?? 0, s = t.vertOriginYMetrics ?? [], i = t.numVertOriginYMetrics ?? s.length, r = s.slice(0, i);
  for (; r.length < i; )
    r.push({ glyphIndex: 0, vertOriginY: o });
  const a = new v(
    cf + i * ff
  );
  a.uint16(n), a.uint16(e), a.int16(o), a.uint16(i);
  for (const c of r)
    a.uint16(c.glyphIndex ?? 0), a.int16(c.vertOriginY ?? o);
  return a.toArray();
}
const hf = 8;
function df(t) {
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
function pf(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 0, s = t.segmentMaps ?? [];
  let i = hf;
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
const mo = 32768, yo = 32767;
function fn(t) {
  const n = new T(t), e = n.uint16(), o = n.offset32(), s = n.uint16(), i = n.array(
    "offset32",
    s
  ), r = gf(
    n,
    o
  ), a = [];
  for (let c = 0; c < s; c++) {
    const f = i[c];
    f === 0 ? a.push(null) : a.push(mf(n, f));
  }
  return {
    format: e,
    variationRegionList: r,
    itemVariationData: a
  };
}
function gf(t, n) {
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
function mf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = (o & mo) !== 0, a = o & yo, c = [];
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
    const g = h.regionIndexes.length, x = (h.wordDeltaCount & mo) !== 0, m = h.wordDeltaCount & yo, y = 6 + 2 * g, _ = x ? 4 : 2, w = x ? 2 : 1, S = m * _ + (g - m) * w, k = y + h.itemCount * S;
    f += k;
  }
  const l = f, d = new v(l);
  d.uint16(t.format ?? 1), d.offset32(c), d.uint16(o);
  for (let p = 0; p < o; p++)
    d.offset32(u[p]);
  d.uint16(i), d.uint16(r);
  for (const p of n.regions)
    for (const h of p.regionAxes)
      d.f2dot14(h.startCoord), d.f2dot14(h.peakCoord), d.f2dot14(h.endCoord);
  for (let p = 0; p < o; p++) {
    const h = e[p];
    if (!h) continue;
    const g = h.regionIndexes.length, x = (h.wordDeltaCount & mo) !== 0, m = h.wordDeltaCount & yo;
    d.uint16(h.itemCount), d.uint16(h.wordDeltaCount), d.uint16(g), d.array("uint16", h.regionIndexes);
    for (const y of h.deltaSets) {
      for (let _ = 0; _ < m; _++)
        x ? d.int32(y[_] ?? 0) : d.int16(y[_] ?? 0);
      for (let _ = m; _ < g; _++)
        x ? d.int16(y[_] ?? 0) : d.int8(y[_] ?? 0);
    }
  }
  return d.toArray();
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
function It(t, n) {
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
function Dt(t) {
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
  const d = 16 / f, p = Math.ceil(c / d), h = [];
  for (let g = 0; g < p; g++) {
    const x = t.uint16(), m = Math.min(d, c - g * d);
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
    let d = 0;
    const p = Math.min(
      r,
      s.length - l * r
    );
    for (let h = 0; h < p; h++) {
      const g = 16 - i * (h + 1);
      d |= (s[l * r + h] & c) << g;
    }
    u.uint16(d);
  }
  return u.toArray();
}
function sr(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      scriptTag: t.tag(),
      scriptOffset: t.uint16()
    });
  return { scriptRecords: o.map((i) => ({
    scriptTag: i.scriptTag,
    script: yf(t, n + i.scriptOffset)
  })) };
}
function yf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = [];
  for (let a = 0; a < o; a++)
    s.push({
      langSysTag: t.tag(),
      langSysOffset: t.uint16()
    });
  const i = e !== 0 ? ks(t, n + e) : null, r = s.map((a) => ({
    langSysTag: a.langSysTag,
    langSys: ks(t, n + a.langSysOffset)
  }));
  return { defaultLangSys: i, langSysRecords: r };
}
function ks(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint16(), i = t.array("uint16", s);
  return { lookupOrderOffset: e, requiredFeatureIndex: o, featureIndices: i };
}
function ir(t) {
  const { scriptRecords: n } = t, e = n.map((a) => xf(a.script)), o = 2 + n.length * 6, s = [];
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
function xf(t) {
  const { defaultLangSys: n, langSysRecords: e } = t, o = e.map((u) => As(u.langSys)), s = n ? As(n) : null;
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
function As(t) {
  const n = 6 + t.featureIndices.length * 2, e = new v(n);
  return e.uint16(t.lookupOrderOffset), e.uint16(t.requiredFeatureIndex), e.uint16(t.featureIndices.length), e.array("uint16", t.featureIndices), e.toArray();
}
function rr(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let i = 0; i < e; i++)
    o.push({
      featureTag: t.tag(),
      featureOffset: t.uint16()
    });
  return { featureRecords: o.map((i) => ({
    featureTag: i.featureTag,
    feature: ar(t, n + i.featureOffset)
  })) };
}
function ar(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { featureParamsOffset: e, lookupListIndices: s };
}
function cr(t) {
  const { featureRecords: n } = t, e = n.map((a) => fr(a.feature)), o = 2 + n.length * 6, s = [];
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
function fr(t) {
  const n = 4 + t.lookupListIndices.length * 2, e = new v(n);
  return e.uint16(t.featureParamsOffset), e.uint16(t.lookupListIndices.length), e.array("uint16", t.lookupListIndices), e.toArray();
}
function ur(t, n, e, o) {
  t.seek(n);
  const s = t.uint16();
  return { lookups: t.array("uint16", s).map(
    (a) => wf(t, n + a, e, o)
  ) };
}
function wf(t, n, e, o) {
  t.seek(n);
  const s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.array("uint16", r), c = i & 16 ? t.uint16() : void 0, f = a.map(
    (p) => e(t, n + p, s)
  );
  let u = s, l = f;
  o !== void 0 && s === o && f.length > 0 && (u = f[0].extensionLookupType, l = f.map((p) => p.subtable));
  const d = {
    lookupType: u,
    lookupFlag: i,
    subtables: l
  };
  return c !== void 0 && (d.markFilteringSet = c), d;
}
function lr(t, n, e) {
  const { lookups: o } = t, s = 8, i = o.map((p) => {
    const h = p.subtables.map(
      (g) => n(g, p.lookupType)
    );
    return { ...p, subtableBytes: h };
  }), r = (p) => {
    const { lookupType: h, lookupFlag: g, subtableBytes: x, markFilteringSet: m } = p, y = m !== void 0;
    let w = 6 + x.length * 2 + (y ? 2 : 0);
    const S = x.map((b) => {
      const D = w;
      return w += b.length, D;
    }), k = new v(w);
    k.uint16(h), k.uint16(g), k.uint16(x.length), k.array("uint16", S), y && k.uint16(m);
    for (let b = 0; b < x.length; b++)
      k.seek(S[b]), k.rawBytes(x[b]);
    return k.toArray();
  };
  let a = i.map(r);
  const c = 2 + o.length * 2;
  if (((p) => {
    let h = c;
    for (const g of p) {
      if (h > 65535) return !0;
      h += g.length;
    }
    return !1;
  })(a) && e !== void 0) {
    const p = i.map((y) => {
      const { lookupType: _, lookupFlag: w, subtableBytes: S, markFilteringSet: k } = y, b = k !== void 0;
      let C = 6 + S.length * 2 + (b ? 2 : 0);
      const A = S.map(() => {
        const O = C;
        return C += s, O;
      }), I = new v(C);
      I.uint16(e), I.uint16(w), I.uint16(S.length), I.array("uint16", A), b && I.uint16(k);
      for (let O = 0; O < S.length; O++)
        I.seek(A[O]), I.uint16(1), I.uint16(_), I.uint32(0);
      return {
        compactBytes: I.toArray(),
        subtableOffsets: A,
        innerDataBytes: S
      };
    });
    let h = c;
    const g = p.map((y) => {
      const _ = h;
      return h += y.compactBytes.length, _;
    }), x = p.map(
      (y) => y.innerDataBytes.map((_) => {
        const w = h;
        return h += _.length, w;
      })
    ), m = new v(h);
    m.uint16(o.length), m.array("uint16", g);
    for (let y = 0; y < p.length; y++)
      m.seek(g[y]), m.rawBytes(p[y].compactBytes);
    for (let y = 0; y < p.length; y++) {
      const _ = p[y];
      for (let w = 0; w < _.innerDataBytes.length; w++) {
        const S = g[y] + _.subtableOffsets[w], k = x[y][w], b = k - S;
        m.seek(S + 4), m.uint32(b), m.seek(k), m.rawBytes(_.innerDataBytes[w]);
      }
    }
    return m.toArray();
  }
  let u = c;
  const l = a.map((p) => {
    const h = u;
    return u += p.length, h;
  }), d = new v(u);
  d.uint16(o.length), d.array("uint16", l);
  for (let p = 0; p < a.length; p++)
    d.seek(l[p]), d.rawBytes(a[p]);
  return d.toArray();
}
function hr(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = [];
    for (let c = 0; c < s; c++)
      i.push(t.uint16());
    const r = V(t, n + o), a = i.map(
      (c) => c === 0 ? null : Sf(t, n + c)
    );
    return { format: e, coverage: r, seqRuleSets: a };
  }
  if (e === 2) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = [];
    for (let u = 0; u < i; u++)
      r.push(t.uint16());
    const a = V(t, n + o), c = It(t, n + s), f = r.map(
      (u) => u === 0 ? null : _f(t, n + u)
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
function Sf(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => {
    t.seek(n + s);
    const i = t.uint16(), r = t.uint16(), a = t.array("uint16", i - 1), c = Zn(t, r);
    return { glyphCount: i, inputSequence: a, seqLookupRecords: c };
  });
}
function _f(t, n) {
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
function dr(t) {
  if (t.format === 1) return bf(t);
  if (t.format === 2) return vf(t);
  if (t.format === 3) return kf(t);
  throw new Error(`Unknown SequenceContext format: ${t.format}`);
}
function bf(t) {
  const { coverage: n, seqRuleSets: e } = t, o = P(n), s = e.map(
    (u) => u === null ? null : pr(u)
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
function vf(t) {
  const { coverage: n, classDef: e, classSeqRuleSets: o } = t, s = P(n), i = Dt(e), r = o.map(
    (p) => p === null ? null : pr(p)
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
  }), d = new v(c);
  d.uint16(2), d.uint16(f), d.uint16(u), d.uint16(o.length), d.array("uint16", l), d.seek(f), d.rawBytes(s), d.seek(u), d.rawBytes(i);
  for (let p = 0; p < r.length; p++)
    r[p] && (d.seek(l[p]), d.rawBytes(r[p]));
  return d.toArray();
}
function kf(t) {
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
function pr(t) {
  const n = t.map(Af);
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
function Af(t) {
  const { glyphCount: n, inputSequence: e, seqLookupRecords: o } = t, s = 4 + (n - 1) * 2 + o.length * 4, i = new v(s);
  return i.uint16(n), i.uint16(o.length), i.array("uint16", e), Ce(i, o), i.toArray();
}
function Ce(t, n) {
  for (const e of n)
    t.uint16(e.sequenceIndex), t.uint16(e.lookupListIndex);
}
function gr(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = [];
    for (let c = 0; c < s; c++)
      i.push(t.uint16());
    const r = V(t, n + o), a = i.map(
      (c) => c === 0 ? null : Cf(t, n + c)
    );
    return { format: e, coverage: r, chainedSeqRuleSets: a };
  }
  if (e === 2) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = [];
    for (let h = 0; h < a; h++)
      c.push(t.uint16());
    const f = V(t, n + o), u = It(
      t,
      n + s
    ), l = It(
      t,
      n + i
    ), d = It(
      t,
      n + r
    ), p = c.map(
      (h) => h === 0 ? null : Of(t, n + h)
    );
    return {
      format: e,
      coverage: f,
      backtrackClassDef: u,
      inputClassDef: l,
      lookaheadClassDef: d,
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
    ), d = r.map(
      (h) => V(t, n + h)
    ), p = c.map(
      (h) => V(t, n + h)
    );
    return {
      format: e,
      backtrackCoverages: l,
      inputCoverages: d,
      lookaheadCoverages: p,
      seqLookupRecords: u
    };
  }
  throw new Error(`Unknown ChainedSequenceContext format: ${e}`);
}
function Cf(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => mr(t, n + s));
}
function mr(t, n) {
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
function Of(t, n) {
  t.seek(n);
  const e = t.uint16();
  return t.array("uint16", e).map((s) => mr(t, n + s));
}
function yr(t) {
  if (t.format === 1) return If(t);
  if (t.format === 2) return Df(t);
  if (t.format === 3) return Ef(t);
  throw new Error(`Unknown ChainedSequenceContext format: ${t.format}`);
}
function If(t) {
  const { coverage: n, chainedSeqRuleSets: e } = t, o = P(n), s = e.map(
    (u) => u === null ? null : xr(u)
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
function Df(t) {
  const {
    coverage: n,
    backtrackClassDef: e,
    inputClassDef: o,
    lookaheadClassDef: s,
    chainedClassSeqRuleSets: i
  } = t, r = P(n), a = Dt(e), c = Dt(o), f = Dt(s), u = i.map(
    (_) => _ === null ? null : xr(_)
  );
  let d = 12 + i.length * 2;
  const p = d;
  d += r.length;
  const h = d;
  d += a.length;
  const g = d;
  d += c.length;
  const x = d;
  d += f.length;
  const m = u.map((_) => {
    if (_ === null) return 0;
    const w = d;
    return d += _.length, w;
  }), y = new v(d);
  y.uint16(2), y.uint16(p), y.uint16(h), y.uint16(g), y.uint16(x), y.uint16(i.length), y.array("uint16", m), y.seek(p), y.rawBytes(r), y.seek(h), y.rawBytes(a), y.seek(g), y.rawBytes(c), y.seek(x), y.rawBytes(f);
  for (let _ = 0; _ < u.length; _++)
    u[_] && (y.seek(m[_]), y.rawBytes(u[_]));
  return y.toArray();
}
function Ef(t) {
  const {
    backtrackCoverages: n,
    inputCoverages: e,
    lookaheadCoverages: o,
    seqLookupRecords: s
  } = t, i = n.map(P), r = e.map(P), a = o.map(P);
  let f = 4 + n.length * 2 + 2 + e.length * 2 + 2 + o.length * 2 + 2 + s.length * 4;
  const u = i.map((h) => {
    const g = f;
    return f += h.length, g;
  }), l = r.map((h) => {
    const g = f;
    return f += h.length, g;
  }), d = a.map((h) => {
    const g = f;
    return f += h.length, g;
  }), p = new v(f);
  p.uint16(3), p.uint16(n.length), p.array("uint16", u), p.uint16(e.length), p.array("uint16", l), p.uint16(o.length), p.array("uint16", d), p.uint16(s.length), Ce(p, s);
  for (let h = 0; h < i.length; h++)
    p.seek(u[h]), p.rawBytes(i[h]);
  for (let h = 0; h < r.length; h++)
    p.seek(l[h]), p.rawBytes(r[h]);
  for (let h = 0; h < a.length; h++)
    p.seek(d[h]), p.rawBytes(a[h]);
  return p.toArray();
}
function xr(t) {
  const n = t.map(Bf);
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
function Bf(t) {
  const {
    backtrackSequence: n,
    inputGlyphCount: e,
    inputSequence: o,
    lookaheadSequence: s,
    seqLookupRecords: i
  } = t, r = 2 + n.length * 2 + 2 + o.length * 2 + 2 + s.length * 2 + 2 + i.length * 4, a = new v(r);
  return a.uint16(n.length), a.array("uint16", n), a.uint16(e), a.array("uint16", o), a.uint16(s.length), a.array("uint16", s), a.uint16(i.length), Ce(a, i), a.toArray();
}
function wr(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint32(), i = [];
  for (let a = 0; a < s; a++)
    i.push({
      conditionSetOffset: t.uint32(),
      featureTableSubstitutionOffset: t.uint32()
    });
  const r = i.map((a) => {
    const c = a.conditionSetOffset !== 0 ? Tf(t, n + a.conditionSetOffset) : null, f = a.featureTableSubstitutionOffset !== 0 ? Rf(
      t,
      n + a.featureTableSubstitutionOffset
    ) : null;
    return { conditionSet: c, featureTableSubstitution: f };
  });
  return { majorVersion: e, minorVersion: o, featureVariationRecords: r };
}
function Tf(t, n) {
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
function Rf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.uint16(), i = [];
  for (let r = 0; r < s; r++) {
    const a = t.uint16(), c = t.uint32(), f = ar(t, n + c);
    i.push({ featureIndex: a, feature: f });
  }
  return { majorVersion: e, minorVersion: o, substitutions: i };
}
function Sr(t) {
  const { majorVersion: n, minorVersion: e, featureVariationRecords: o } = t, s = o.map((f) => ({
    csBytes: f.conditionSet ? Mf(f.conditionSet) : null,
    ftsBytes: f.featureTableSubstitution ? zf(f.featureTableSubstitution) : null
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
function Mf(t) {
  const n = t.conditions.map(Lf);
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
function Lf(t) {
  if (t.format === 1) {
    const n = new v(8);
    return n.uint16(1), n.uint16(t.axisIndex), n.int16(t.filterRangeMinValue), n.int16(t.filterRangeMaxValue), n.toArray();
  }
  throw new Error(`Unknown Condition format: ${t.format}`);
}
function zf(t) {
  const n = t.substitutions.map(
    (r) => fr(r.feature)
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
const Vf = 8, Ff = 12;
function Pf(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.offset16(), i = n.offset16(), r = e > 1 || e === 1 && o >= 1 ? n.offset32() : 0, a = [s, i, r].filter(
    (c) => c > 0
  );
  return {
    majorVersion: e,
    minorVersion: o,
    horizAxis: s ? Cs(t, s) : null,
    vertAxis: i ? Cs(t, i) : null,
    itemVariationStore: r ? fn(
      t.slice(
        r,
        Uf(t.length, r, a)
      )
    ) : null
  };
}
function Uf(t, n, e) {
  return e.filter((s) => s > n).sort((s, i) => s - i)[0] ?? t;
}
function Cs(t, n) {
  if (n + 4 > t.length) return null;
  const e = new T(t);
  e.seek(n);
  const o = e.offset16(), s = e.offset16(), i = o ? Nf(e, n + o) : null, r = s ? Gf(e, n + s) : [];
  return { baseTagList: i, baseScriptList: r };
}
function Nf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++)
    o.push(t.tag());
  return o;
}
function Gf(t, n) {
  t.seek(n);
  const e = t.uint16(), o = [];
  for (let s = 0; s < e; s++)
    o.push({ tag: t.tag(), off: t.offset16() });
  return o.map((s) => ({
    tag: s.tag,
    ...$f(t, n + s.off)
  }));
}
function $f(t, n) {
  t.seek(n);
  const e = t.offset16(), o = t.offset16(), s = t.uint16(), i = [];
  for (let r = 0; r < s; r++)
    i.push({ tag: t.tag(), off: t.offset16() });
  return {
    baseValues: e ? Hf(t, n + e) : null,
    defaultMinMax: o ? Os(t, n + o) : null,
    langSystems: i.map((r) => ({
      tag: r.tag,
      minMax: Os(t, n + r.off)
    }))
  };
}
function Hf(t, n) {
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
function Os(t, n) {
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
function Zf(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = n > 1 || n === 1 && e >= 1, s = Is(t.horizAxis), i = Is(t.vertAxis), r = o && t.itemVariationStore ? Hn(t.itemVariationStore) : [];
  let c = o ? Ff : Vf;
  const f = s.length ? c : 0;
  c += s.length;
  const u = i.length ? c : 0;
  c += i.length;
  const l = r.length ? c : 0;
  c += r.length;
  const d = new v(c);
  return d.uint16(n), d.uint16(e), d.offset16(f), d.offset16(u), o && d.offset32(l), d.rawBytes(s), d.rawBytes(i), d.rawBytes(r), d.toArray();
}
function Is(t) {
  if (!t) return [];
  if (t._raw) return t._raw;
  const n = t.baseTagList ? jf(t.baseTagList) : [], e = Wf(t.baseScriptList ?? []);
  let s = 4;
  const i = n.length ? s : 0;
  s += n.length;
  const r = e.length ? s : 0;
  s += e.length;
  const a = new v(s);
  return a.offset16(i), a.offset16(r), a.rawBytes(n), a.rawBytes(e), a.toArray();
}
function jf(t) {
  const n = 2 + 4 * t.length, e = new v(n);
  e.uint16(t.length);
  for (const o of t)
    e.tag(o);
  return e.toArray();
}
function Wf(t) {
  const n = 2 + 6 * t.length, e = t.map((r) => Yf(r));
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
function Yf(t) {
  const n = qf(t.baseValues), e = Ds(t.defaultMinMax), o = t.langSystems ?? [], s = o.map((l) => Ds(l.minMax));
  let r = 6 + 6 * o.length;
  const a = n.length ? r : 0;
  r += n.length;
  const c = e.length ? r : 0;
  r += e.length;
  const f = s.map((l) => {
    const d = l.length ? r : 0;
    return r += l.length, d;
  }), u = new v(r);
  u.offset16(a), u.offset16(c), u.uint16(o.length);
  for (let l = 0; l < o.length; l++)
    u.tag(o[l].tag), u.offset16(f[l]);
  u.rawBytes(n), u.rawBytes(e);
  for (const l of s)
    u.rawBytes(l);
  return u.toArray();
}
function qf(t) {
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
function Ds(t) {
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
    const d = l.min.length ? r : 0;
    r += l.min.length;
    const p = l.max.length ? r : 0;
    return r += l.max.length, { minOff: d, maxOff: p };
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
const Cn = 5, Nt = 8;
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
function jo(t, n) {
  const e = new T(t), o = e.uint32(), s = n?.CBLC;
  if (!s?.sizes)
    return { version: o, data: Array.from(t.slice(4)) };
  const i = [];
  for (const r of s.sizes) {
    const a = [];
    for (const c of r.indexSubTables ?? [])
      a.push(Xf(t, e, c));
    i.push(a);
  }
  return { version: o, bitmapData: i };
}
function Wo(t) {
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
    const l = s[u].indexSubTables ?? [], d = o[u] ?? [], p = [];
    for (let h = 0; h < l.length; h++) {
      const g = l[h], x = d[h] ?? [], { bytes: m, info: y } = Kf(
        x,
        g,
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
function Xf(t, n, e) {
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
        s - Nt
      );
      return { bigMetrics: r, imageData: a };
    }
    case 7: {
      const r = Jt(n), a = i(
        n.position,
        s - Nt
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
function Kf(t, n, e) {
  const { indexFormat: o, imageFormat: s } = n, i = { imageDataOffset: e }, r = t.map(
    (f) => f ? Jf(f, s) : []
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
      for (let d = 0; d < r.length; d++)
        u.push({
          glyphID: f[d] ?? 0,
          sbitOffset: l
        }), l += r[d].length;
      u.push({ glyphID: 0, sbitOffset: l }), i.glyphArray = u;
      break;
    }
  }
  const a = r.reduce((f, u) => f + u.length, 0), c = new v(a);
  for (const f of r)
    c.rawBytes(f);
  return { bytes: c.toArray(), info: i };
}
function Jf(t, n) {
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
      const e = t.imageData ?? [], o = new v(Nt + e.length);
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
        Nt + 2 + e.length * 4
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
      const e = t.imageData ?? [], o = new v(Nt + 4 + e.length);
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
function Qf(t, n) {
  return jo(t, n?.bloc ? { CBLC: n.bloc } : n);
}
function tu(t) {
  return Wo(t);
}
const _r = 48;
function Yo(t) {
  return nu(t);
}
function on(t, n) {
  return n ? ou(t, n) : ru(t);
}
function nu(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint32(), i = [], r = [];
  for (let a = 0; a < s; a++) {
    const c = n.uint32();
    n.uint32();
    const f = n.uint32(), u = n.uint32(), l = Es(n), d = Es(n), p = n.uint16(), h = n.uint16(), g = n.uint8(), x = n.uint8(), m = n.uint8(), y = n.int8();
    i.push({
      colorRef: u,
      hori: l,
      vert: d,
      startGlyphIndex: p,
      endGlyphIndex: h,
      ppemX: g,
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
    f !== 0 && (i[a].indexSubTables = eu(
      n,
      c,
      f
    ));
  }
  return { majorVersion: e, minorVersion: o, sizes: i };
}
function eu(t, n, e) {
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
        const d = t.uint32();
        u.glyphArray = [];
        for (let p = 0; p <= d; p++)
          u.glyphArray.push({
            glyphID: t.uint16(),
            sbitOffset: t.uint16()
          });
        break;
      }
      case 5: {
        u.imageSize = t.uint32(), u.bigMetrics = Jt(t);
        const d = t.uint32();
        u.glyphIdArray = t.array("uint16", d);
        break;
      }
    }
    s.push(u);
  }
  return s;
}
function ou(t, n) {
  const e = t.majorVersion ?? 2, o = t.minorVersion ?? 0, s = t.sizes ?? [], i = s.map(
    (u, l) => su(u.indexSubTables ?? [], n[l] ?? [])
  );
  let a = 8 + s.length * _r;
  const c = [];
  for (const u of i)
    c.push(a), a += u.length;
  const f = new v(a);
  f.uint16(e), f.uint16(o), f.uint32(s.length);
  for (let u = 0; u < s.length; u++) {
    const l = s[u], d = l.indexSubTables ?? [];
    f.uint32(c[u]), f.uint32(i[u].length), f.uint32(d.length), f.uint32(l.colorRef ?? 0), de(f, l.hori ?? {}), de(f, l.vert ?? {}), f.uint16(l.startGlyphIndex ?? 0), f.uint16(l.endGlyphIndex ?? 0), f.uint8(l.ppemX ?? 0), f.uint8(l.ppemY ?? 0), f.uint8(l.bitDepth ?? 0), f.int8(l.flags ?? 0);
  }
  for (const u of i)
    f.rawBytes(u);
  return f.toArray();
}
function su(t, n) {
  const e = t.map(
    (a, c) => iu(a, n[c] ?? {})
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
function iu(t, n) {
  const e = t.indexFormat, o = t.imageFormat, s = n.imageDataOffset ?? 0, i = 8;
  switch (e) {
    case 1: {
      const r = n.sbitOffsets ?? [], a = new v(i + r.length * 4);
      a.uint16(e), a.uint16(o), a.uint32(s);
      for (const c of r) a.uint32(c);
      return a.toArray();
    }
    case 2: {
      const r = new v(i + 4 + Nt);
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
      let a = i + 4 + Nt + 4 + r.length * 2;
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
function ru(t) {
  const n = t.majorVersion ?? 2, e = t.minorVersion ?? 0, o = t.sizes ?? [], s = t.data ?? [], i = 8 + o.length * _r + s.length, r = new v(i);
  r.uint16(n), r.uint16(e), r.uint32(o.length);
  for (const a of o)
    r.uint32(a.indexSubTableArrayOffset ?? 0), r.uint32(a.indexTablesSize ?? 0), r.uint32(a.numberOfIndexSubTables ?? 0), r.uint32(a.colorRef ?? 0), de(r, a.hori ?? {}), de(r, a.vert ?? {}), r.uint16(a.startGlyphIndex ?? 0), r.uint16(a.endGlyphIndex ?? 0), r.uint8(a.ppemX ?? 0), r.uint8(a.ppemY ?? 0), r.uint8(a.bitDepth ?? 0), r.int8(a.flags ?? 0);
  return r.rawBytes(s), r.toArray();
}
function Es(t) {
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
function de(t, n) {
  t.int8(n.ascender ?? 0), t.int8(n.descender ?? 0), t.uint8(n.widthMax ?? 0), t.int8(n.caretSlopeNumerator ?? 0), t.int8(n.caretSlopeDenominator ?? 0), t.int8(n.caretOffset ?? 0), t.int8(n.minOriginSB ?? 0), t.int8(n.minAdvanceSB ?? 0), t.int8(n.maxBeforeBL ?? 0), t.int8(n.minAfterBL ?? 0), t.int8(n.pad1 ?? 0), t.int8(n.pad2 ?? 0);
}
function au(t) {
  return Yo(t);
}
function cu(t) {
  return on(t);
}
function fu(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = [], i = /* @__PURE__ */ new Set();
  for (let u = 0; u < o; u++) {
    const l = n.uint16(), d = n.uint16(), p = n.offset32();
    i.add(p), s.push({ platformID: l, encodingID: d, subtableOffset: p });
  }
  const r = [...i].sort((u, l) => u - l), a = r.map((u) => uu(n, u)), c = new Map(r.map((u, l) => [u, l])), f = s.map((u) => ({
    platformID: u.platformID,
    encodingID: u.encodingID,
    subtableIndex: c.get(u.subtableOffset)
  }));
  return { version: e, encodingRecords: f, subtables: a };
}
function uu(t, n) {
  t.seek(n);
  const e = t.uint16();
  switch (e) {
    case 0:
      return lu(t);
    case 2:
      return hu(t, n);
    case 4:
      return du(t, n);
    case 6:
      return pu(t);
    case 8:
      return Su(t);
    case 10:
      return _u(t);
    case 12:
      return gu(t);
    case 13:
      return mu(t);
    case 14:
      return yu(t, n);
    default:
      return bu(t, n, e);
  }
}
function lu(t) {
  t.skip(2);
  const n = t.uint16(), e = t.array("uint8", 256);
  return { format: 0, language: n, glyphIdArray: e };
}
function hu(t, n) {
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", 256);
  let i = 0;
  for (let d = 0; d < 256; d++)
    s[d] > i && (i = s[d]);
  const r = i / 8 + 1, a = [];
  for (let d = 0; d < r; d++)
    a.push({
      firstCode: t.uint16(),
      entryCount: t.uint16(),
      idDelta: t.int16(),
      idRangeOffset: t.uint16()
    });
  const c = t.position, u = (n + e - c) / 2, l = t.array("uint16", u);
  return { format: 2, language: o, subHeaderKeys: s, subHeaders: a, glyphIdArray: l };
}
function du(t, n) {
  const e = t.uint16(), o = t.uint16(), i = t.uint16() / 2;
  t.skip(6);
  const r = t.array("uint16", i);
  t.skip(2);
  const a = t.array("uint16", i), c = t.array("int16", i), f = t.array("uint16", i), u = t.position, l = (e - (u - n)) / 2, d = t.array("uint16", l), p = [];
  for (let h = 0; h < i; h++)
    p.push({
      endCode: r[h],
      startCode: a[h],
      idDelta: c[h],
      idRangeOffset: f[h]
    });
  return { format: 4, language: o, segments: p, glyphIdArray: d };
}
function pu(t) {
  t.skip(2);
  const n = t.uint16(), e = t.uint16(), o = t.uint16(), s = t.array("uint16", o);
  return { format: 6, language: n, firstCode: e, glyphIdArray: s };
}
function gu(t) {
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
function mu(t) {
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
function yu(t, n) {
  t.skip(4);
  const e = t.uint32(), o = [];
  for (let s = 0; s < e; s++) {
    const i = t.uint24(), r = t.offset32(), a = t.offset32();
    let c = null;
    if (r !== 0) {
      const u = t.position;
      c = xu(t, n + r), t.seek(u);
    }
    let f = null;
    if (a !== 0) {
      const u = t.position;
      f = wu(
        t,
        n + a
      ), t.seek(u);
    }
    o.push({ varSelector: i, defaultUVS: c, nonDefaultUVS: f });
  }
  return { format: 14, varSelectorRecords: o };
}
function xu(t, n) {
  t.seek(n);
  const e = t.uint32(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      startUnicodeValue: t.uint24(),
      additionalCount: t.uint8()
    });
  return o;
}
function wu(t, n) {
  t.seek(n);
  const e = t.uint32(), o = [];
  for (let s = 0; s < e; s++)
    o.push({
      unicodeValue: t.uint24(),
      glyphID: t.uint16()
    });
  return o;
}
function Su(t) {
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
function _u(t) {
  t.skip(2), t.skip(4);
  const n = t.uint32(), e = t.uint32(), o = t.uint32(), s = t.array("uint16", o);
  return { format: 10, language: n, startCharCode: e, glyphIdArray: s };
}
function bu(t, n, e) {
  let o;
  e >= 8 ? (t.skip(2), o = t.uint32()) : o = t.uint16(), t.seek(n);
  const s = t.bytes(o);
  return { format: e, _raw: s };
}
function vu(t) {
  const { version: n, encodingRecords: e, subtables: o } = t, s = o.map(ku), i = 4 + e.length * 8, r = [];
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
function ku(t) {
  switch (t.format) {
    case 0:
      return Au(t);
    case 2:
      return Cu(t);
    case 4:
      return Ou(t);
    case 6:
      return Iu(t);
    case 8:
      return Du(t);
    case 10:
      return Eu(t);
    case 12:
      return Bu(t);
    case 13:
      return Tu(t);
    case 14:
      return Ru(t);
    default:
      return t._raw;
  }
}
function Au(t) {
  const e = new v(262);
  return e.uint16(0), e.uint16(262), e.uint16(t.language), e.array("uint8", t.glyphIdArray), e.toArray();
}
function Cu(t) {
  const { language: n, subHeaderKeys: e, subHeaders: o, glyphIdArray: s } = t, i = 518 + o.length * 8 + s.length * 2, r = new v(i);
  r.uint16(2), r.uint16(i), r.uint16(n), r.array("uint16", e);
  for (const a of o)
    r.uint16(a.firstCode), r.uint16(a.entryCount), r.int16(a.idDelta), r.uint16(a.idRangeOffset);
  return r.array("uint16", s), r.toArray();
}
function Ou(t) {
  const { language: n, segments: e, glyphIdArray: o } = t, s = e.length, i = s * 2, r = Math.floor(Math.log2(s)), a = Math.pow(2, r) * 2, c = i - a, f = 14 + s * 8 + 2 + o.length * 2, u = new v(f);
  u.uint16(4), u.uint16(f), u.uint16(n), u.uint16(i), u.uint16(a), u.uint16(r), u.uint16(c);
  for (const l of e) u.uint16(l.endCode);
  u.uint16(0);
  for (const l of e) u.uint16(l.startCode);
  for (const l of e) u.int16(l.idDelta);
  for (const l of e) u.uint16(l.idRangeOffset);
  return u.array("uint16", o), u.toArray();
}
function Iu(t) {
  const { language: n, firstCode: e, glyphIdArray: o } = t, s = o.length, i = 10 + s * 2, r = new v(i);
  return r.uint16(6), r.uint16(i), r.uint16(n), r.uint16(e), r.uint16(s), r.array("uint16", o), r.toArray();
}
function Du(t) {
  const { language: n, is32: e, groups: o } = t, s = 8208 + o.length * 12, i = new v(s);
  i.uint16(8), i.uint16(0), i.uint32(s), i.uint32(n), i.rawBytes(e), i.uint32(o.length);
  for (const r of o)
    i.uint32(r.startCharCode), i.uint32(r.endCharCode), i.uint32(r.startGlyphID);
  return i.toArray();
}
function Eu(t) {
  const { language: n, startCharCode: e, glyphIdArray: o } = t, s = 20 + o.length * 2, i = new v(s);
  return i.uint16(10), i.uint16(0), i.uint32(s), i.uint32(n), i.uint32(e), i.uint32(o.length), i.array("uint16", o), i.toArray();
}
function Bu(t) {
  const n = t.groups.length, e = 16 + n * 12, o = new v(e);
  o.uint16(12), o.uint16(0), o.uint32(e), o.uint32(t.language), o.uint32(n);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.startGlyphID);
  return o.toArray();
}
function Tu(t) {
  const n = t.groups.length, e = 16 + n * 12, o = new v(e);
  o.uint16(13), o.uint16(0), o.uint32(e), o.uint32(t.language), o.uint32(n);
  for (const s of t.groups)
    o.uint32(s.startCharCode), o.uint32(s.endCharCode), o.uint32(s.glyphID);
  return o.toArray();
}
function Ru(t) {
  const { varSelectorRecords: n } = t, e = n.map((c) => ({
    defaultUVSBytes: c.defaultUVS ? Mu(c.defaultUVS) : null,
    nonDefaultUVSBytes: c.nonDefaultUVS ? Lu(c.nonDefaultUVS) : null
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
function Mu(t) {
  const n = 4 + t.length * 4, e = new v(n);
  e.uint32(t.length);
  for (const o of t)
    e.uint24(o.startUnicodeValue), e.uint8(o.additionalCount);
  return e.toArray();
}
function Lu(t) {
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
], br = 15, vr = 48;
function zu(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function Vu(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
function Fu(t, n) {
  t.seek(n);
  const e = t.uint8(), o = t.uint8(), s = e === 1 ? t.uint32() : t.uint16(), i = (o & br) + 1, r = ((o & vr) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = zu(t, r), u = (1 << i) - 1;
    a.push({
      outerIndex: f >> i,
      innerIndex: f & u
    });
  }
  return { format: e, entryFormat: o, mapCount: s, entries: a };
}
function Pu(t) {
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
  const f = t.entryFormat ?? c - 1 << 4 | r - 1, u = o === 1 ? 6 : 4, l = (f & br) + 1, d = ((f & vr) >> 4) + 1, p = new v(u + e * d);
  p.uint8(o), p.uint8(f), o === 1 ? p.uint32(e) : p.uint16(e);
  for (let h = 0; h < e; h++) {
    const g = n[h] ?? { outerIndex: 0, innerIndex: 0 }, x = (g.outerIndex ?? 0) << l | (g.innerIndex ?? 0) & (1 << l) - 1;
    Vu(p, x, d);
  }
  return p.toArray();
}
function Uu(t, n) {
  const e = /* @__PURE__ */ new Map(), o = Nu(
    t,
    n.baseGlyphListOffset,
    e
  ), s = n.layerListOffset ? Gu(t, n.layerListOffset, e) : null, i = n.clipListOffset ? $u(t, n.clipListOffset) : null, r = n.varIndexMapOffset ? Fu(t, n.varIndexMapOffset) : null;
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
function Nu(t, n, e) {
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
      paint: J(t, n + r.paintOffset, e)
    });
  return s;
}
function Gu(t, n, e) {
  t.seek(n);
  const o = t.uint32(), s = [];
  for (let r = 0; r < o; r++)
    s.push(t.uint32());
  const i = [];
  for (const r of s)
    i.push(J(t, n + r, e));
  return i;
}
function $u(t, n) {
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
    clipBox: Hu(t, n + r.clipBoxOffset)
  }));
  return { format: e, clips: i };
}
function Hu(t, n) {
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
function Zu(t, n, e) {
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
function J(t, n, e) {
  if (e.has(n)) return e.get(n);
  t.seek(n);
  const o = t.uint8();
  let s;
  switch (o) {
    case 1:
      s = ju(t);
      break;
    case 2:
      s = Bs(t, !1);
      break;
    case 3:
      s = Bs(t, !0);
      break;
    case 4:
      s = Ts(t, n, !1);
      break;
    case 5:
      s = Ts(t, n, !0);
      break;
    case 6:
      s = Rs(t, n, !1);
      break;
    case 7:
      s = Rs(t, n, !0);
      break;
    case 8:
      s = Ms(t, n, !1);
      break;
    case 9:
      s = Ms(t, n, !0);
      break;
    case 10:
      s = Wu(t, n, e);
      break;
    case 11:
      s = Yu(t);
      break;
    case 12:
      s = Ls(t, n, e, !1);
      break;
    case 13:
      s = Ls(t, n, e, !0);
      break;
    case 14:
      s = zs(t, n, e, !1);
      break;
    case 15:
      s = zs(t, n, e, !0);
      break;
    case 16:
      s = Vs(t, n, e, !1);
      break;
    case 17:
      s = Vs(t, n, e, !0);
      break;
    case 18:
      s = Fs(t, n, e, !1);
      break;
    case 19:
      s = Fs(t, n, e, !0);
      break;
    case 20:
      s = Ps(t, n, e, !1);
      break;
    case 21:
      s = Ps(t, n, e, !0);
      break;
    case 22:
      s = Us(t, n, e, !1);
      break;
    case 23:
      s = Us(t, n, e, !0);
      break;
    case 24:
      s = Ns(t, n, e, !1);
      break;
    case 25:
      s = Ns(t, n, e, !0);
      break;
    case 26:
      s = Gs(t, n, e, !1);
      break;
    case 27:
      s = Gs(t, n, e, !0);
      break;
    case 28:
      s = $s(t, n, e, !1);
      break;
    case 29:
      s = $s(t, n, e, !0);
      break;
    case 30:
      s = Hs(t, n, e, !1);
      break;
    case 31:
      s = Hs(t, n, e, !0);
      break;
    case 32:
      s = qu(t, n, e);
      break;
    default:
      return s = { format: o, _unknown: !0 }, e.set(n, s), s;
  }
  return s.format = o, e.set(n, s), s;
}
function ju(t) {
  return {
    numLayers: t.uint8(),
    firstLayerIndex: t.uint32()
  };
}
function Bs(t, n) {
  const e = {
    paletteIndex: t.uint16(),
    alpha: t.f2dot14()
  };
  return n && (e.varIndexBase = t.uint32()), e;
}
function Ts(t, n, e) {
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
function Rs(t, n, e) {
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
function Ms(t, n, e) {
  const o = t.uint24(), s = {
    centerX: t.fword(),
    centerY: t.fword(),
    startAngle: t.f2dot14(),
    endAngle: t.f2dot14()
  };
  return e && (s.varIndexBase = t.uint32()), s.colorLine = qo(t, n + o, e), s;
}
function Wu(t, n, e) {
  const o = t.uint24();
  return {
    glyphID: t.uint16(),
    paint: J(t, n + o, e)
  };
}
function Yu(t) {
  return { glyphID: t.uint16() };
}
function Ls(t, n, e, o) {
  const s = t.uint24(), i = t.uint24();
  return {
    paint: J(t, n + s, e),
    transform: Zu(t, n + i, o)
  };
}
function zs(t, n, e, o) {
  const s = t.uint24(), i = {
    dx: t.fword(),
    dy: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function Vs(t, n, e, o) {
  const s = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function Fs(t, n, e, o) {
  const s = t.uint24(), i = {
    scaleX: t.f2dot14(),
    scaleY: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function Ps(t, n, e, o) {
  const s = t.uint24(), i = { scale: t.f2dot14() };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function Us(t, n, e, o) {
  const s = t.uint24(), i = {
    scale: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function Ns(t, n, e, o) {
  const s = t.uint24(), i = { angle: t.f2dot14() };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function Gs(t, n, e, o) {
  const s = t.uint24(), i = {
    angle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function $s(t, n, e, o) {
  const s = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function Hs(t, n, e, o) {
  const s = t.uint24(), i = {
    xSkewAngle: t.f2dot14(),
    ySkewAngle: t.f2dot14(),
    centerX: t.fword(),
    centerY: t.fword()
  };
  return o && (i.varIndexBase = t.uint32()), i.paint = J(t, n + s, e), i;
}
function qu(t, n, e) {
  const o = t.uint24(), s = t.uint8(), i = t.uint24();
  return {
    sourcePaint: J(t, n + o, e),
    compositeMode: s,
    backdropPaint: J(t, n + i, e)
  };
}
function Xu(t) {
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
      for (const B of xo(E))
        c(B);
    }
  }
  if (n)
    for (const E of n)
      c(E.paint);
  if (e)
    for (const E of e)
      c(E);
  const f = Ku(a), u = /* @__PURE__ */ new Map();
  for (const E of f)
    u.set(E, Ju(E));
  const l = /* @__PURE__ */ new Map();
  let d = 0;
  for (const E of f)
    l.set(E, d), d += u.get(E);
  const p = d, h = n ? n.length : 0, g = 4 + h * 6, x = e ? e.length : 0, m = x > 0 ? 4 + x * 4 : 0, y = o ? nl(o) : [], _ = s ? Pu(s) : [], w = i ? Hn(i) : [], S = g + m + p + y.length + _.length + w.length, k = 0, b = g, D = g + m, C = D + p, A = C + y.length, I = A + _.length, O = new v(S);
  O.uint32(h);
  for (const E of n || [])
    O.uint16(E.glyphID), O.uint32(D - k + l.get(E.paint));
  if (x > 0) {
    O.uint32(x);
    for (const E of e)
      O.uint32(D - b + l.get(E));
  }
  for (const E of f)
    Qu(
      O,
      E,
      D + l.get(E),
      l,
      D
    );
  return O.rawBytes(y), O.rawBytes(_), O.rawBytes(w), {
    bodyBytes: O.toArray(),
    bglBodyOffset: k,
    llBodyOffset: x > 0 ? b : 0,
    clipBodyOffset: y.length > 0 ? C : 0,
    dimBodyOffset: _.length > 0 ? A : 0,
    ivsBodyOffset: w.length > 0 ? I : 0
  };
}
function xo(t) {
  if (!t) return [];
  const n = [];
  return t.paint && n.push(t.paint), t.sourcePaint && n.push(t.sourcePaint), t.backdropPaint && n.push(t.backdropPaint), n;
}
function Ku(t, n) {
  const e = /* @__PURE__ */ new Map();
  for (const a of t) e.set(a, 0);
  for (const a of t)
    for (const c of xo(a))
      e.has(c) && e.set(c, e.get(c) + 1);
  const o = [];
  let s = 0;
  for (const a of t)
    e.get(a) === 0 && o.push(a);
  const i = [], r = /* @__PURE__ */ new Set();
  for (; s < o.length; ) {
    const a = o[s++];
    i.push(a), r.add(a);
    for (const c of xo(a)) {
      if (!e.has(c)) continue;
      const f = e.get(c) - 1;
      e.set(c, f), f === 0 && o.push(c);
    }
  }
  for (const a of t)
    r.has(a) || i.push(a);
  return i;
}
function Ju(t) {
  const n = vn[t.format] || 0, e = t.format;
  return e === 4 || e === 6 || e === 8 ? n + Zs(t.colorLine, !1) : e === 5 || e === 7 || e === 9 ? n + Zs(t.colorLine, !0) : e === 12 ? n + 24 : e === 13 ? n + 28 : n;
}
function Zs(t, n) {
  if (!t) return 0;
  const e = n ? 10 : 6;
  return 3 + t.colorStops.length * e;
}
function Qu(t, n, e, o, s) {
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
      t.uint24(r - e), t.uint24(a), tl(t, n.transform, i === 13);
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
function tl(t, n, e) {
  t.fixed(n.xx), t.fixed(n.yx), t.fixed(n.xy), t.fixed(n.yy), t.fixed(n.dx), t.fixed(n.dy), e && t.uint32(n.varIndexBase);
}
function nl(t) {
  if (!t || !t.clips || t.clips.length === 0) return [];
  const n = [];
  for (const a of t.clips)
    n.push(el(a.clipBox));
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
function el(t) {
  const n = t.format === 2 ? 13 : 9, e = new v(n);
  return e.uint8(t.format), e.fword(t.xMin), e.fword(t.yMin), e.fword(t.xMax), e.fword(t.yMax), t.format === 2 && e.uint32(t.varIndexBase), e.toArray();
}
function ol(t) {
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
    const u = n.uint32(), l = n.uint32(), d = n.uint32(), p = n.uint32(), h = n.uint32(), x = Uu(n, {
      baseGlyphListOffset: u,
      layerListOffset: l,
      clipListOffset: d,
      varIndexMapOffset: p,
      itemVariationStoreOffset: h
    });
    f.baseGlyphPaintRecords = x.baseGlyphPaintRecords, f.layerPaints = x.layerPaints, f.clipList = x.clipList, f.varIndexMap = x.varIndexMap, f.itemVariationStore = x.itemVariationStore;
  }
  return f;
}
function sl(t) {
  const { baseGlyphRecords: n, layerRecords: e } = t;
  if (t.version >= 1 && t.baseGlyphPaintRecords) {
    const l = n.length * 6, d = e.length * 4, g = 14 + 20, x = l + d, m = g + x, y = Xu({
      baseGlyphPaintRecords: t.baseGlyphPaintRecords,
      layerPaints: t.layerPaints,
      clipList: t.clipList,
      varIndexMap: t.varIndexMap,
      itemVariationStore: t.itemVariationStore
    }), _ = y.bodyBytes, w = m + y.bglBodyOffset, S = y.llBodyOffset ? m + y.llBodyOffset : 0, k = y.clipBodyOffset ? m + y.clipBodyOffset : 0, b = y.dimBodyOffset ? m + y.dimBodyOffset : 0, D = y.ivsBodyOffset ? m + y.ivsBodyOffset : 0, C = m + _.length, A = new v(C);
    A.uint16(t.version), A.uint16(n.length), A.uint32(n.length > 0 ? g : 0), A.uint32(e.length > 0 ? g + l : 0), A.uint16(e.length), A.uint32(w), A.uint32(S), A.uint32(k), A.uint32(b), A.uint32(D);
    for (const I of n)
      A.uint16(I.glyphID), A.uint16(I.firstLayerIndex), A.uint16(I.numLayers);
    for (const I of e)
      A.uint16(I.glyphID), A.uint16(I.paletteIndex);
    return A.rawBytes(_), A.toArray();
  }
  const o = 14, s = n.length > 0 ? o : 0, i = n.length * 6, r = e.length > 0 ? o + i : 0, a = e.length * 4, c = o + i + a, f = new v(c);
  f.uint16(t.version), f.uint16(n.length), f.uint32(s), f.uint32(r), f.uint16(e.length);
  for (const u of n)
    f.uint16(u.glyphID), f.uint16(u.firstLayerIndex), f.uint16(u.numLayers);
  for (const u of e)
    f.uint16(u.glyphID), f.uint16(u.paletteIndex);
  return f.toArray();
}
function il(t) {
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
  const d = [];
  for (let h = 0; h < s; h++) {
    const g = a[h], x = [];
    for (let m = 0; m < o; m++)
      x.push({ ...l[g + m] });
    d.push(x);
  }
  const p = {
    version: e,
    numPaletteEntries: o,
    palettes: d
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
function rl(t) {
  const { version: n, numPaletteEntries: e, palettes: o } = t, s = o.length, i = [], r = [];
  for (let y = 0; y < s; y++) {
    i.push(r.length);
    for (let _ = 0; _ < e; _++)
      r.push(o[y][_]);
  }
  const a = r.length, c = 12 + s * 2, f = n >= 1 ? 12 : 0, u = c + f, l = a * 4;
  let d = u + l, p = 0, h = 0, g = 0;
  n >= 1 && t.paletteTypes && (p = d, d += s * 4), n >= 1 && t.paletteLabels && (h = d, d += s * 2), n >= 1 && t.paletteEntryLabels && (g = d, d += e * 2);
  const x = d, m = new v(x);
  m.uint16(n), m.uint16(e), m.uint16(s), m.uint16(a), m.uint32(u);
  for (let y = 0; y < s; y++)
    m.uint16(i[y]);
  n >= 1 && (m.uint32(p), m.uint32(h), m.uint32(g));
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
const al = 8, cl = 12;
function fl(t) {
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
function ul(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, s = (t.signatures ?? []).map((c) => {
    const f = ll(c);
    return {
      format: c.format ?? 1,
      bytes: f
    };
  });
  let i = al + s.length * cl;
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
function ll(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
function hl(t, n) {
  return jo(t, n?.EBLC ? { CBLC: n.EBLC } : n);
}
function dl(t) {
  return Wo(t);
}
function pl(t) {
  return Yo(t);
}
function gl(t) {
  return on(t);
}
const wo = 28;
function ml(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = [];
  for (let i = 0; i < o; i++) {
    const r = n.position;
    s.push({
      hori: js(n),
      vert: js(n),
      substitutePpemX: n.uint8(),
      substitutePpemY: n.uint8(),
      originalPpemX: n.uint8(),
      originalPpemY: n.uint8(),
      _raw: Array.from(t.slice(r, r + wo))
    });
  }
  return { version: e, scales: s };
}
function yl(t) {
  const n = t.version ?? 131072, e = t.scales ?? [], o = new v(8 + e.length * wo);
  o.uint32(n), o.uint32(e.length);
  for (const s of e) {
    if (s._raw && s._raw.length === wo) {
      o.rawBytes(s._raw);
      continue;
    }
    Ws(o, s.hori ?? {}), Ws(o, s.vert ?? {}), o.uint8(s.substitutePpemX ?? 0), o.uint8(s.substitutePpemY ?? 0), o.uint8(s.originalPpemX ?? 0), o.uint8(s.originalPpemY ?? 0);
  }
  return o.toArray();
}
function js(t) {
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
function Ws(t, n) {
  t.int8(n.ascender ?? 0), t.int8(n.descender ?? 0), t.uint8(n.widthMax ?? 0), t.int8(n.caretSlopeNumerator ?? 0), t.int8(n.caretSlopeDenominator ?? 0), t.int8(n.caretOffset ?? 0), t.int8(n.minOriginSB ?? 0), t.int8(n.minAdvanceSB ?? 0), t.int8(n.maxBeforeBL ?? 0), t.int8(n.minAfterBL ?? 0), t.int8(n.pad1 ?? 0), t.int8(n.pad2 ?? 0);
}
const Ys = 16, xl = 20;
function wl(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.offset16(), i = n.uint16(), r = n.uint16(), a = n.uint16(), c = n.uint16(), f = n.uint16(), u = [];
  for (let g = 0; g < r; g++)
    n.seek(s + g * a), u.push({
      axisTag: n.tag(),
      minValue: n.fixed(),
      defaultValue: n.fixed(),
      maxValue: n.fixed(),
      flags: n.uint16(),
      axisNameID: n.uint16()
    });
  const l = [], d = s + r * a, p = 4 + r * 4, h = f >= p + 2;
  for (let g = 0; g < c; g++) {
    n.seek(d + g * f);
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
function Sl(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 2, s = t.axes ?? [], i = t.instances ?? [], r = s.length, a = xl, c = 4 + r * 4, f = i.some(
    (g) => g.postScriptNameID !== void 0
  ), u = f ? c + 2 : c, l = i.length, d = Ys, p = Ys + r * a + l * u, h = new v(p);
  h.uint16(n), h.uint16(e), h.offset16(d), h.uint16(o), h.uint16(r), h.uint16(a), h.uint16(l), h.uint16(u);
  for (const g of s)
    h.tag(g.axisTag), h.fixed(g.minValue), h.fixed(g.defaultValue), h.fixed(g.maxValue), h.uint16(g.flags ?? 0), h.uint16(g.axisNameID ?? 0);
  for (const g of i) {
    h.uint16(g.subfamilyNameID ?? 0), h.uint16(g.flags ?? 0);
    for (let x = 0; x < r; x++)
      h.fixed(g.coordinates?.[x] ?? 0);
    f && h.uint16(g.postScriptNameID ?? 65535);
  }
  return h.toArray();
}
function _l(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16(), a = n.uint16();
  let c = 0;
  o >= 2 && (c = n.uint16());
  let f = 0;
  o >= 3 && (f = n.uint32());
  const u = { majorVersion: e, minorVersion: o };
  return s !== 0 && (u.glyphClassDef = It(n, s)), i !== 0 && (u.attachList = bl(n, i)), r !== 0 && (u.ligCaretList = vl(n, r)), a !== 0 && (u.markAttachClassDef = It(n, a)), c !== 0 && (u.markGlyphSetsDef = Al(
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
function bl(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", o), i = V(t, n + e), r = s.map((a) => {
    t.seek(n + a);
    const c = t.uint16();
    return t.array("uint16", c);
  });
  return { coverage: i, attachPoints: r };
}
function vl(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = t.array("uint16", o), i = V(t, n + e), r = s.map(
    (a) => kl(t, n + a)
  );
  return { coverage: i, ligGlyphs: r };
}
function kl(t, n) {
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
function Al(t, n) {
  t.seek(n);
  const e = t.uint16(), o = t.uint16(), s = [];
  for (let r = 0; r < o; r++)
    s.push(t.uint32());
  const i = s.map(
    (r) => V(t, n + r)
  );
  return { format: e, coverages: i };
}
function Cl(t) {
  const { majorVersion: n, minorVersion: e } = t, o = t.glyphClassDef ? Dt(t.glyphClassDef) : null, s = t.attachList ? Ol(t.attachList) : null, i = t.ligCaretList ? Dl(t.ligCaretList) : null, r = t.markAttachClassDef ? Dt(t.markAttachClassDef) : null, a = e >= 2 && t.markGlyphSetsDef ? Tl(t.markGlyphSetsDef) : null, c = e >= 3 && t.itemVarStoreRaw ? t.itemVarStoreRaw : null;
  let f = 12;
  e >= 2 && (f += 2), e >= 3 && (f += 4);
  let u = f;
  const l = o ? u : 0;
  o && (u += o.length);
  const d = s ? u : 0;
  s && (u += s.length);
  const p = i ? u : 0;
  i && (u += i.length);
  const h = r ? u : 0;
  r && (u += r.length);
  const g = a ? u : 0;
  a && (u += a.length);
  const x = c ? u : 0;
  c && (u += c.length);
  const m = new v(u);
  return m.uint16(n), m.uint16(e), m.uint16(l), m.uint16(d), m.uint16(p), m.uint16(h), e >= 2 && m.uint16(g), e >= 3 && m.uint32(x), o && (m.seek(l), m.rawBytes(o)), s && (m.seek(d), m.rawBytes(s)), i && (m.seek(p), m.rawBytes(i)), r && (m.seek(h), m.rawBytes(r)), a && (m.seek(g), m.rawBytes(a)), c && (m.seek(x), m.rawBytes(c)), m.toArray();
}
function Ol(t) {
  const n = P(t.coverage), e = t.attachPoints.map(Il);
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
function Il(t) {
  const n = 2 + t.length * 2, e = new v(n);
  return e.uint16(t.length), e.array("uint16", t), e.toArray();
}
function Dl(t) {
  const n = P(t.coverage), e = t.ligGlyphs.map(El);
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
function El(t) {
  const n = t.map(Bl);
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
function Bl(t) {
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
function Tl(t) {
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
function Ct(t) {
  let n = 0, e = t;
  for (; e; )
    n += e & 1, e >>>= 1;
  return n * 2;
}
function Qt(t, n, e) {
  if (n === 0) return null;
  const o = t.position, s = {};
  n & 1 && (s.xPlacement = t.int16()), n & 2 && (s.yPlacement = t.int16()), n & 4 && (s.xAdvance = t.int16()), n & 8 && (s.yAdvance = t.int16());
  const i = n & 16 ? t.uint16() : 0, r = n & 32 ? t.uint16() : 0, a = n & 64 ? t.uint16() : 0, c = n & 128 ? t.uint16() : 0, f = t.position, u = (l, d) => {
    const p = e + l, h = o + l;
    try {
      return un(t, p);
    } catch (g) {
      if (h !== p)
        try {
          return un(t, h);
        } catch {
        }
      const x = g instanceof Error ? g.message : String(g);
      throw new Error(
        `${x}; ValueRecord context: valueFormat=${n}, subtableOffset=${e}, valueRecordStart=${o}, offsets={xPla:${i},yPla:${r},xAdv:${a},yAdv:${c}}, field=${d}`
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
function Xo(t, n) {
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
function Rl(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16();
  let a = 0;
  o >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: o,
    scriptList: sr(n, s),
    featureList: rr(n, i),
    lookupList: ur(n, r, kr, 9)
  };
  return a !== 0 && (c.featureVariations = wr(
    n,
    a
  )), c;
}
function kr(t, n, e) {
  switch (e) {
    case 1:
      return Ml(t, n);
    case 2:
      return Ll(t, n);
    case 3:
      return zl(t, n);
    case 4:
      return Vl(t, n);
    case 5:
      return Fl(t, n);
    case 6:
      return Pl(t, n);
    case 7:
      return hr(t, n);
    case 8:
      return gr(t, n);
    case 9:
      return Ul(t, n);
    default:
      throw new Error(`Unknown GPOS lookup type: ${e}`);
  }
}
function Ml(t, n) {
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
function Ll(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e === 1) {
    const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), c = t.array("uint16", r).map((u) => {
      const l = n + u;
      t.seek(l);
      const d = t.uint16(), p = [];
      for (let h = 0; h < d; h++) {
        const g = t.uint16(), x = Qt(t, s, l), m = Qt(t, i, l);
        p.push({ secondGlyph: g, value1: x, value2: m });
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
      const g = [];
      for (let x = 0; x < f; x++) {
        const m = Qt(t, s, n), y = Qt(t, i, n);
        g.push({ value1: m, value2: y });
      }
      u.push(g);
    }
    const l = V(t, n + o), d = It(t, n + r), p = It(t, n + a);
    return {
      format: e,
      coverage: l,
      valueFormat1: s,
      valueFormat2: i,
      classDef1: d,
      classDef2: p,
      class1Count: c,
      class2Count: f,
      class1Records: u
    };
  }
  throw new Error(`Unknown PairPos format: ${e}`);
}
function zl(t, n) {
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
function Vl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkBasePos format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = V(t, n + o), f = V(t, n + s), u = Xo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), d = [];
  for (let h = 0; h < l; h++) {
    const g = t.array("uint16", i);
    d.push(g);
  }
  const p = d.map(
    (h) => h.map(
      (g) => g ? ln(t, n + a + g) : null
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
function Fl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkLigPos format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = V(t, n + o), f = V(t, n + s), u = Xo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), p = t.array("uint16", l).map((h) => {
    const g = n + a + h;
    t.seek(g);
    const x = t.uint16(), m = [];
    for (let y = 0; y < x; y++) {
      const _ = t.array("uint16", i);
      m.push(_);
    }
    return m.map(
      (y) => y.map((_) => _ ? ln(t, g + _) : null)
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
function Pl(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown MarkMarkPos format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.uint16(), r = t.uint16(), a = t.uint16(), c = V(t, n + o), f = V(t, n + s), u = Xo(t, n + r);
  t.seek(n + a);
  const l = t.uint16(), d = [];
  for (let h = 0; h < l; h++) {
    const g = t.array("uint16", i);
    d.push(g);
  }
  const p = d.map(
    (h) => h.map(
      (g) => g ? ln(t, n + a + g) : null
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
function Ul(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionPos format: ${e}`);
  const o = t.uint16(), s = t.uint32(), i = kr(
    t,
    n + s,
    o
  );
  return { format: e, extensionLookupType: o, extensionOffset: s, subtable: i };
}
function tn(t, n, e) {
  if (!n) return [];
  const o = new v(Ct(n));
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
function Ko(t) {
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
function Nl(t) {
  const { majorVersion: n, minorVersion: e } = t, o = Gl(t), s = ir(o.scriptList), i = cr(o.featureList), r = lr(
    o.lookupList,
    Ar,
    9
  ), a = o.featureVariations ? Sr(o.featureVariations) : null;
  let c = 10;
  e >= 1 && (c += 4);
  let f = c;
  const u = f;
  f += s.length;
  const l = f;
  f += i.length;
  const d = f;
  f += r.length;
  const p = a ? f : 0;
  a && (f += a.length);
  const h = new v(f);
  return h.uint16(n), h.uint16(e), h.uint16(u), h.uint16(l), h.uint16(d), e >= 1 && h.uint32(p), h.seek(u), h.rawBytes(s), h.seek(l), h.rawBytes(i), h.seek(d), h.rawBytes(r), a && (h.seek(p), h.rawBytes(a)), h.toArray();
}
function Gl(t) {
  const n = t.lookupList.lookups.map((e) => {
    if (e.lookupType !== 2 || !Array.isArray(e.subtables))
      return e;
    const o = e.subtables.flatMap((s) => s?.format !== 1 || !Array.isArray(s.pairSets) ? [s] : $l(s));
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
function $l(t) {
  const n = Hl(t.coverage);
  if (n.length !== t.pairSets.length)
    return [t];
  const e = Ct(t.valueFormat1) + Ct(t.valueFormat2), o = t.pairSets.map(
    (c) => 2 + c.length * (2 + e)
  ), s = o.reduce((c, f) => c + f, 0);
  if (qs(
    t.pairSets.length,
    s
  ) <= 65535)
    return [t];
  const r = [];
  let a = 0;
  for (; a < t.pairSets.length; ) {
    let c = a, f = 0, u = !1;
    for (; c < t.pairSets.length; ) {
      const l = f + o[c], d = c - a + 1;
      if (qs(
        d,
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
function qs(t, n) {
  const e = 10 + t * 2, o = 4 + t * 2;
  return e + o + n;
}
function Hl(t) {
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
function Ar(t, n) {
  switch (n) {
    case 1:
      return Zl(t);
    case 2:
      return jl(t);
    case 3:
      return Wl(t);
    case 4:
      return Yl(t);
    case 5:
      return ql(t);
    case 6:
      return Kl(t);
    case 7:
      return dr(t);
    case 8:
      return yr(t);
    case 9:
      return Jl(t);
    default:
      throw new Error(`Unknown GPOS lookup type: ${n}`);
  }
}
function Zl(t) {
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
    const o = Ct(t.valueFormat), s = t.valueRecords.map(
      (f) => tn(f, t.valueFormat, e)
    ), r = 8 + s.length * o, a = r + n.length, c = new v(a);
    c.uint16(2), c.uint16(r), c.uint16(t.valueFormat), c.uint16(t.valueCount);
    for (const f of s) c.rawBytes(f);
    return c.seek(r), c.rawBytes(n), c.toArray();
  }
  throw new Error(`Unknown SinglePos format: ${t.format}`);
}
function jl(t) {
  const n = P(t.coverage), e = [];
  if (t.format === 1) {
    const o = t.pairSets.map((f) => {
      const u = Ct(t.valueFormat1), l = Ct(t.valueFormat2), d = 2 + u + l, p = new v(2 + f.length * d);
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
    const o = Dt(t.classDef1), s = Dt(t.classDef2), i = Ct(t.valueFormat1), r = Ct(t.valueFormat2), a = i + r;
    let u = 16 + t.class1Count * t.class2Count * a;
    const l = u;
    u += n.length;
    const d = u;
    u += o.length;
    const p = u;
    u += s.length;
    const h = new v(u);
    h.uint16(2), h.uint16(l), h.uint16(t.valueFormat1), h.uint16(t.valueFormat2), h.uint16(d), h.uint16(p), h.uint16(t.class1Count), h.uint16(t.class2Count);
    for (const g of t.class1Records)
      for (const x of g)
        h.rawBytes(
          tn(x.value1, t.valueFormat1, e)
        ), h.rawBytes(
          tn(x.value2, t.valueFormat2, e)
        );
    return h.seek(l), h.rawBytes(n), h.seek(d), h.rawBytes(o), h.seek(p), h.rawBytes(s), h.toArray();
  }
  throw new Error(`Unknown PairPos format: ${t.format}`);
}
function Wl(t) {
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
function Yl(t) {
  const n = P(t.markCoverage), e = P(t.baseCoverage), o = Ko(t.markArray), s = Cr(t.baseArray);
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
function Cr(t) {
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
function ql(t) {
  const n = P(t.markCoverage), e = P(t.ligatureCoverage), o = Ko(t.markArray), s = Xl(t.ligatureArray, t.markClassCount);
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
function Xl(t, n) {
  const e = t.map((a) => {
    const c = a.map((p) => p.map(Bn));
    let u = 2 + a.length * n * 2;
    const l = c.map(
      (p) => p.map((h) => {
        if (!h.length) return 0;
        const g = u;
        return u += h.length, g;
      })
    ), d = new v(u);
    d.uint16(a.length);
    for (let p = 0; p < a.length; p++)
      for (let h = 0; h < n; h++)
        d.uint16(l[p][h]);
    for (let p = 0; p < c.length; p++)
      for (let h = 0; h < n; h++)
        c[p][h].length && (d.seek(l[p][h]), d.rawBytes(c[p][h]));
    return d.toArray();
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
function Kl(t) {
  const n = P(t.mark1Coverage), e = P(t.mark2Coverage), o = Ko(t.mark1Array), s = Cr(t.mark2Array);
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
function Jl(t) {
  const n = Ar(t.subtable, t.extensionLookupType), e = 8, o = new v(e + n.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(e), o.rawBytes(n), o.toArray();
}
function Ql(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16();
  let a = 0;
  o >= 1 && (a = n.uint32());
  const c = {
    majorVersion: e,
    minorVersion: o,
    scriptList: sr(n, s),
    featureList: rr(n, i),
    lookupList: ur(n, r, Or, 7)
  };
  return a !== 0 && (c.featureVariations = wr(
    n,
    a
  )), c;
}
function Or(t, n, e) {
  switch (e) {
    case 1:
      return t0(t, n);
    case 2:
      return n0(t, n);
    case 3:
      return e0(t, n);
    case 4:
      return o0(t, n);
    case 5:
      return hr(t, n);
    case 6:
      return gr(t, n);
    case 7:
      return s0(t, n);
    case 8:
      return i0(t, n);
    default:
      throw new Error(`Unknown GSUB lookup type: ${e}`);
  }
}
function t0(t, n) {
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
function n0(t, n) {
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
function e0(t, n) {
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
function o0(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown LigatureSubst format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = V(t, n + o), a = i.map((c) => {
    const f = n + c;
    t.seek(f);
    const u = t.uint16();
    return t.array("uint16", u).map((d) => {
      t.seek(f + d);
      const p = t.uint16(), h = t.uint16(), g = t.array("uint16", h - 1);
      return { ligatureGlyph: p, componentCount: h, componentGlyphIDs: g };
    });
  });
  return { format: e, coverage: r, ligatureSets: a };
}
function s0(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1) throw new Error(`Unknown ExtensionSubst format: ${e}`);
  const o = t.uint16(), s = t.uint32(), i = Or(
    t,
    n + s,
    o
  );
  return { format: e, extensionLookupType: o, extensionOffset: s, subtable: i };
}
function i0(t, n) {
  t.seek(n);
  const e = t.uint16();
  if (e !== 1)
    throw new Error(`Unknown ReverseChainSingleSubst format: ${e}`);
  const o = t.uint16(), s = t.uint16(), i = t.array("uint16", s), r = t.uint16(), a = t.array("uint16", r), c = t.uint16(), f = t.array("uint16", c), u = V(t, n + o), l = i.map(
    (p) => V(t, n + p)
  ), d = a.map(
    (p) => V(t, n + p)
  );
  return {
    format: e,
    coverage: u,
    backtrackCoverages: l,
    lookaheadCoverages: d,
    substituteGlyphIDs: f
  };
}
function r0(t) {
  const { majorVersion: n, minorVersion: e } = t, o = ir(t.scriptList), s = cr(t.featureList), i = lr(
    t.lookupList,
    Ir,
    7
  ), r = t.featureVariations ? Sr(t.featureVariations) : null;
  let a = 10;
  e >= 1 && (a += 4);
  let c = a;
  const f = c;
  c += o.length;
  const u = c;
  c += s.length;
  const l = c;
  c += i.length;
  const d = r ? c : 0;
  r && (c += r.length);
  const p = new v(c);
  return p.uint16(n), p.uint16(e), p.uint16(f), p.uint16(u), p.uint16(l), e >= 1 && p.uint32(d), p.seek(f), p.rawBytes(o), p.seek(u), p.rawBytes(s), p.seek(l), p.rawBytes(i), r && (p.seek(d), p.rawBytes(r)), p.toArray();
}
function Ir(t, n) {
  switch (n) {
    case 1:
      return a0(t);
    case 2:
      return c0(t);
    case 3:
      return f0(t);
    case 4:
      return u0(t);
    case 5:
      return dr(t);
    case 6:
      return yr(t);
    case 7:
      return h0(t);
    case 8:
      return d0(t);
    default:
      throw new Error(`Unknown GSUB lookup type: ${n}`);
  }
}
function a0(t) {
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
function c0(t) {
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
function f0(t) {
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
function u0(t) {
  const n = P(t.coverage), e = t.ligatureSets.map(l0);
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
function l0(t) {
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
function h0(t) {
  const n = Ir(t.subtable, t.extensionLookupType), e = 8, o = new v(e + n.length);
  return o.uint16(1), o.uint16(t.extensionLookupType), o.uint32(e), o.rawBytes(n), o.toArray();
}
function d0(t) {
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
const p0 = 8;
function g0(t, n) {
  const e = new T(t), o = e.uint16(), s = e.uint16(), i = e.uint32(), r = n?.maxp?.numGlyphs, a = [];
  for (let c = 0; c < s && !(e.position + i > t.length || i < 2); c++) {
    const u = e.uint8(), l = e.uint8(), d = i - 2, p = typeof r == "number" ? Math.min(r, d) : d, h = e.bytes(p), g = d - p, x = g > 0 ? e.bytes(g) : [];
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
function m0(t) {
  const n = t.version ?? 0, e = t.records ?? [], o = Math.max(
    0,
    ...e.map((f) => (f.widths ?? []).length)
  ), s = y0(2 + o), i = t.sizeDeviceRecord ?? s, r = Math.max(2, i), a = p0 + r * e.length, c = new v(a);
  c.uint16(n), c.uint16(e.length), c.uint32(r);
  for (const f of e) {
    c.uint8(f.pixelSize ?? 0), c.uint8(f.maxWidth ?? 0);
    const u = r - 2, l = (f.widths ?? []).slice(0, u), d = f.padding ?? [], p = l.concat(d).slice(0, u);
    for (; p.length < u; )
      p.push(0);
    c.rawBytes(p);
  }
  return c.toArray();
}
function y0(t) {
  return t + (4 - t % 4) % 4;
}
const x0 = 54;
function So(t) {
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
function Dr(t) {
  const n = new v(x0);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fixed(t.fontRevision), n.uint32(t.checksumAdjustment), n.uint32(t.magicNumber), n.uint16(t.flags), n.uint16(t.unitsPerEm), n.longDateTime(t.created), n.longDateTime(t.modified), n.int16(t.xMin), n.int16(t.yMin), n.int16(t.xMax), n.int16(t.yMax), n.uint16(t.macStyle), n.uint16(t.lowestRecPPEM), n.int16(t.fontDirectionHint), n.int16(t.indexToLocFormat), n.int16(t.glyphDataFormat), n.toArray();
}
const w0 = 36;
function S0(t) {
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
function _0(t) {
  const n = new v(w0);
  return n.uint16(t.majorVersion), n.uint16(t.minorVersion), n.fword(t.ascender), n.fword(t.descender), n.fword(t.lineGap), n.ufword(t.advanceWidthMax), n.fword(t.minLeftSideBearing), n.fword(t.minRightSideBearing), n.fword(t.xMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numberOfHMetrics), n.toArray();
}
function b0(t, n) {
  const e = n.hhea.numberOfHMetrics, o = n.maxp.numGlyphs, s = new T(t), i = [];
  for (let c = 0; c < e; c++)
    i.push({
      advanceWidth: s.ufword(),
      lsb: s.fword()
    });
  const r = o - e, a = s.array("fword", r);
  return { hMetrics: i, leftSideBearings: a };
}
function v0(t) {
  const { hMetrics: n, leftSideBearings: e } = t, o = n.length * 4 + e.length * 2, s = new v(o);
  for (const i of n)
    s.ufword(i.advanceWidth), s.fword(i.lsb);
  return s.array("fword", e), s.toArray();
}
const k0 = 20, Er = 15, Br = 48;
function A0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.offset32(), i = n.offset32(), r = n.offset32(), a = n.offset32();
  return {
    majorVersion: e,
    minorVersion: o,
    itemVariationStore: s ? fn(
      t.slice(
        s,
        Tr(t.length, s, [
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
  const o = Tr(t.length, n, e);
  if (o <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(n, o));
  return {
    ...C0(s),
    _raw: s
  };
}
function Tr(t, n, e) {
  return e.filter((s) => s > n).sort((s, i) => s - i)[0] ?? t;
}
function C0(t) {
  const n = new T(t), e = n.uint8(), o = n.uint8(), s = e === 1 ? n.uint32() : n.uint16(), i = (o & Er) + 1, r = ((o & Br) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = R0(n, r);
    a.push(E0(f, i));
  }
  return {
    format: e,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function O0(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.itemVariationStore ? Hn(t.itemVariationStore) : [], s = je(
    t.advanceWidthMapping
  ), i = je(t.lsbMapping), r = je(t.rsbMapping);
  let a = k0;
  const c = o.length ? a : 0;
  a += o.length;
  const f = s.length ? a : 0;
  a += s.length;
  const u = i.length ? a : 0;
  a += i.length;
  const l = r.length ? a : 0;
  a += r.length;
  const d = new v(a);
  return d.uint16(n), d.uint16(e), d.offset32(c), d.offset32(f), d.offset32(u), d.offset32(l), d.rawBytes(o), d.rawBytes(s), d.rawBytes(i), d.rawBytes(r), d.toArray();
}
function je(t) {
  return t ? t._raw ? t._raw : I0(t) : [];
}
function I0(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = B0(n), s = t.format ?? (e > 65535 ? 1 : 0), i = t.entryFormat ?? o.entryFormat, r = (i & Er) + 1, a = ((i & Br) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + e * a);
  f.uint8(s), f.uint8(i), s === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, d = D0(l, r);
    M0(f, d, a);
  }
  return f.toArray();
}
function D0(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function E0(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function B0(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < n && o < 16; )
    o++;
  const s = e << o | n;
  let i = 1;
  for (; i < 4 && s > T0(i); )
    i++;
  return { entryFormat: i - 1 << 4 | o - 1 };
}
function T0(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function R0(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function M0(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const L0 = 6, z0 = 6;
function V0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = [];
  for (let c = 0; c < s; c++)
    i.push({
      tag: n.tag(),
      offset: n.offset16()
    });
  const r = i.map((c) => c.offset).filter((c) => c > 0), a = i.map((c) => ({
    ...c,
    table: P0(t, c.offset, r)
  }));
  return {
    majorVersion: e,
    minorVersion: o,
    scripts: a
  };
}
function F0(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.scripts ?? [], s = o.map((c) => U0(c.table));
  let i = L0 + o.length * z0;
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
function P0(t, n, e) {
  if (!n)
    return null;
  const s = e.filter((i) => i > n).sort((i, r) => i - r)[0] ?? t.length;
  return s <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, s)) };
}
function U0(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const Rr = 4, ce = 6, Mr = 8, fe = 8;
function N0(t) {
  const n = new T(t);
  return (t.length >= 4 ? n.uint32() : 0) === 65536 ? H0(t) : G0(t);
}
function G0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = [];
  let i = Rr;
  for (let r = 0; r < o && !(i + ce > t.length); r++) {
    n.seek(i);
    const a = n.uint16(), c = n.uint16(), f = n.uint16(), u = f >> 8 & 255, l = Math.min(
      t.length,
      i + Math.max(c, ce)
    ), d = i + ce, p = Array.from(t.slice(d, l)), h = {
      version: a,
      coverage: f,
      format: u
    };
    u === 0 ? Object.assign(h, $0(p)) : h._raw = p, s.push(h), i = l;
  }
  return {
    formatVariant: "opentype",
    version: e,
    nTables: o,
    subtables: s
  };
}
function $0(t) {
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
function H0(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = [];
  let i = Mr;
  for (let r = 0; r < o && !(i + fe > t.length); r++) {
    n.seek(i);
    const a = n.uint32(), c = n.uint8(), f = n.uint8(), u = n.uint16(), l = Math.min(
      t.length,
      i + Math.max(a, fe)
    ), d = Array.from(
      t.slice(i + fe, l)
    );
    s.push({
      coverage: c,
      format: f,
      tupleIndex: u,
      _raw: d
    }), i = l;
  }
  return {
    formatVariant: "apple",
    version: e,
    nTables: o,
    subtables: s
  };
}
function Z0(t) {
  return t.formatVariant === "apple" ? q0(t) : j0(t);
}
function j0(t) {
  const n = t.version ?? 0, e = t.subtables ?? [], o = e.map(
    (a) => W0(a)
  ), s = e.length, i = Rr + o.reduce((a, c) => a + c.length, 0), r = new v(i);
  r.uint16(n), r.uint16(s);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function W0(t) {
  const n = t._raw ? t._raw : t.format === 0 ? Y0(t) : [], e = ce + n.length, o = t.coverage ?? (t.format ?? 0) << 8, s = new v(e);
  return s.uint16(t.version ?? 0), s.uint16(e), s.uint16(o), s.rawBytes(n), s.toArray();
}
function Y0(t) {
  const n = t.pairs ?? [], e = n.length, o = Math.floor(Math.log2(Math.max(1, e))), s = Math.pow(2, o) * 6, i = e * 6 - s, r = new v(8 + e * 6);
  r.uint16(e), r.uint16(t.searchRange ?? s), r.uint16(t.entrySelector ?? o), r.uint16(t.rangeShift ?? i);
  for (const a of n)
    r.uint16(a.left), r.uint16(a.right), r.int16(a.value);
  return r.toArray();
}
function q0(t) {
  const n = t.version ?? 65536, e = t.subtables ?? [], o = e.map((a) => {
    const c = a._raw ?? [], f = fe + c.length, u = new v(f);
    return u.uint32(f), u.uint8(a.coverage ?? 0), u.uint8(a.format ?? 0), u.uint16(a.tupleIndex ?? 0), u.rawBytes(c), u.toArray();
  }), s = e.length, i = Mr + o.reduce((a, c) => a + c.length, 0), r = new v(i);
  r.uint32(n), r.uint32(s);
  for (const a of o)
    r.rawBytes(a);
  return r.toArray();
}
function X0(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = n.uint32(), i = [], r = [];
  for (let a = 0; a < s; a++)
    r.push({ offset: n.uint16(), length: n.uint16() });
  for (const a of r) {
    const c = t.slice(a.offset, a.offset + a.length);
    i.push(new TextDecoder("utf-8").decode(new Uint8Array(c)));
  }
  return { version: e, flags: o, tags: i };
}
function K0(t) {
  const { version: n, flags: e, tags: o } = t, s = new TextEncoder(), i = o.map((u) => s.encode(u)), r = 12 + o.length * 4, a = r + i.reduce((u, l) => u + l.length, 0), c = new v(a);
  c.uint32(n), c.uint32(e), c.uint32(o.length);
  let f = r;
  for (const u of i)
    c.uint16(f), c.uint16(u.length), f += u.length;
  for (const u of i)
    c.rawBytes(u);
  return c.toArray();
}
function J0(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.bytes(o);
  return {
    version: e,
    numGlyphs: o,
    yPels: s
  };
}
function Q0(t) {
  const n = t.version ?? 0, e = t.yPels ?? [], o = t.numGlyphs ?? e.length, s = e.slice(0, o);
  for (; s.length < o; )
    s.push(0);
  const i = new v(4 + o);
  return i.uint16(n), i.uint16(o), i.rawBytes(s), i.toArray();
}
const th = 10;
function nh(t) {
  const n = new T(t), e = n.uint32(), o = n.offset16(), s = n.offset16(), i = n.offset16(), r = [
    o,
    s,
    i
  ].filter((a) => a > 0);
  return {
    version: e,
    mathConstants: We(t, o, r),
    mathGlyphInfo: We(t, s, r),
    mathVariants: We(t, i, r)
  };
}
function eh(t) {
  const n = t.version ?? 65536, e = Ye(t.mathConstants), o = Ye(t.mathGlyphInfo), s = Ye(t.mathVariants);
  let i = th;
  const r = e.length ? i : 0;
  i += e.length;
  const a = o.length ? i : 0;
  i += o.length;
  const c = s.length ? i : 0;
  i += s.length;
  const f = new v(i);
  return f.uint32(n), f.offset16(r), f.offset16(a), f.offset16(c), f.rawBytes(e), f.rawBytes(o), f.rawBytes(s), f.toArray();
}
function We(t, n, e) {
  if (!n)
    return null;
  const s = e.filter((i) => i > n).sort((i, r) => i - r)[0] ?? t.length;
  return s <= n || n >= t.length ? { _raw: [] } : { _raw: Array.from(t.slice(n, s)) };
}
function Ye(t) {
  return t ? Array.isArray(t) ? t : t._raw ?? [] : [];
}
const oh = 6, sh = 32;
function ih(t) {
  const n = new T(t), e = n.uint32(), o = n.uint16(), s = { version: e, numGlyphs: o };
  return e === 65536 && (s.maxPoints = n.uint16(), s.maxContours = n.uint16(), s.maxCompositePoints = n.uint16(), s.maxCompositeContours = n.uint16(), s.maxZones = n.uint16(), s.maxTwilightPoints = n.uint16(), s.maxStorage = n.uint16(), s.maxFunctionDefs = n.uint16(), s.maxInstructionDefs = n.uint16(), s.maxStackElements = n.uint16(), s.maxSizeOfInstructions = n.uint16(), s.maxComponentElements = n.uint16(), s.maxComponentDepth = n.uint16()), s;
}
function rh(t) {
  const n = t.version === 65536, e = n ? sh : oh, o = new v(e);
  return o.uint32(t.version), o.uint16(t.numGlyphs), n && (o.uint16(t.maxPoints), o.uint16(t.maxContours), o.uint16(t.maxCompositePoints), o.uint16(t.maxCompositeContours), o.uint16(t.maxZones), o.uint16(t.maxTwilightPoints), o.uint16(t.maxStorage), o.uint16(t.maxFunctionDefs), o.uint16(t.maxInstructionDefs), o.uint16(t.maxStackElements), o.uint16(t.maxSizeOfInstructions), o.uint16(t.maxComponentElements), o.uint16(t.maxComponentDepth)), o.toArray();
}
function ah(t) {
  if (!t.length)
    return { version: 0, data: [] };
  const n = new T(t), e = t.length >= 2 ? n.uint16() : 0, o = t.length >= 2 ? Array.from(t.slice(2)) : [];
  return {
    version: e,
    data: o
  };
}
function ch(t) {
  const n = t.version ?? 0, e = t.data ?? [], o = new v(2 + e.length);
  return o.uint16(n), o.rawBytes(e), o.toArray();
}
const Lr = 16, fh = 12;
function uh(t) {
  const n = new T(t), e = n.uint32(), o = n.uint32(), s = n.uint32(), i = n.uint32(), r = [];
  for (let a = 0; a < i; a++) {
    const c = n.tag(), f = n.uint32(), u = n.uint32(), l = f, d = Math.min(t.length, l + u), p = l < Lr || l >= t.length || d < l ? [] : Array.from(t.slice(l, d));
    r.push({ tag: c, dataOffset: f, dataLength: u, data: p });
  }
  return {
    version: e,
    flags: o,
    reserved: s,
    dataMaps: r
  };
}
function lh(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, o = t.reserved ?? 0, i = (t.dataMaps ?? []).map((f) => ({
    tag: (f.tag ?? "    ").slice(0, 4).padEnd(4, " "),
    data: f.data ?? []
  }));
  let r = Lr + i.length * fh;
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
const _o = 12, nn = 8;
function hh(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.uint16(), a = n.offset16(), c = [];
  for (let u = 0; u < r; u++) {
    const l = _o + u * i;
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
    const d = {
      valueTag: n.tag(),
      deltaSetOuterIndex: n.uint16(),
      deltaSetInnerIndex: n.uint16()
    };
    i > nn && (d._extra = n.bytes(i - nn)), c.push(d);
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
function dh(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.reserved ?? 0, s = [...t.valueRecords ?? []].sort(
    (p, h) => ph(p.valueTag, h.valueTag)
  ), i = t.valueRecordSize ?? nn, r = s.reduce((p, h) => {
    const g = h._extra?.length ?? 0;
    return Math.max(p, nn + g);
  }, nn), a = Math.max(
    i,
    r
  ), c = s.length, f = t.itemVariationStore ? Hn(t.itemVariationStore) : [], u = f.length > 0 || c > 0 ? _o + c * a : 0, l = u > 0 ? u + f.length : _o, d = new v(l);
  d.uint16(n), d.uint16(e), d.uint16(o), d.uint16(a), d.uint16(c), d.offset16(u);
  for (const p of s) {
    d.tag(p.valueTag ?? "    "), d.uint16(p.deltaSetOuterIndex ?? 0), d.uint16(p.deltaSetInnerIndex ?? 0);
    const h = p._extra ?? [];
    d.rawBytes(h);
    const g = a - nn - h.length;
    g > 0 && d.rawBytes(new Array(g).fill(0));
  }
  return d.rawBytes(f), d.toArray();
}
function ph(t, n) {
  const e = t ?? "    ", o = n ?? "    ";
  for (let s = 0; s < 4; s++) {
    const i = e.charCodeAt(s) - o.charCodeAt(s);
    if (i !== 0)
      return i;
  }
  return 0;
}
const bo = [
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
], Jo = /* @__PURE__ */ new Map();
for (let t = 0; t < 128; t++)
  Jo.set(t, t);
for (let t = 0; t < bo.length; t++)
  Jo.set(bo[t], 128 + t);
function gh(t, n, e) {
  return n === 0 || n === 3 ? vo(t) : n === 1 && e === 0 ? yh(t) : t.length % 2 === 0 ? vo(t) : "0x:" + t.map((o) => o.toString(16).padStart(2, "0")).join("");
}
function mh(t, n, e) {
  if (t.startsWith("0x:")) {
    const o = t.slice(3), s = [];
    for (let i = 0; i < o.length; i += 2)
      s.push(parseInt(o.slice(i, i + 2), 16));
    return s;
  }
  return n === 0 || n === 3 ? ko(t) : n === 1 && e === 0 ? xh(t) : ko(t);
}
function vo(t) {
  const n = [];
  for (let e = 0; e + 1 < t.length; e += 2) {
    const o = t[e] << 8 | t[e + 1];
    n.push(o);
  }
  return String.fromCharCode(...n);
}
function ko(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const o = t.charCodeAt(e);
    n.push(o >> 8 & 255, o & 255);
  }
  return n;
}
function yh(t) {
  return t.map((n) => n < 128 ? String.fromCharCode(n) : String.fromCharCode(bo[n - 128])).join("");
}
function xh(t) {
  const n = [];
  for (let e = 0; e < t.length; e++) {
    const o = t.charCodeAt(e), s = Jo.get(o);
    n.push(s !== void 0 ? s : 63);
  }
  return n;
}
function wh(t) {
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
      const l = n.uint16(), d = n.uint16(), p = t.slice(
        s + d,
        s + d + l
      );
      r.push({
        tag: vo(p)
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
      value: gh(u, f.platformID, f.encodingID)
    };
  }), c = { version: e, names: a };
  return e === 1 && r.length > 0 && (c.langTagRecords = r), c;
}
function Sh(t) {
  const { version: n, names: e, langTagRecords: o = [] } = t, s = e.map((w) => ({
    platformID: w.platformID,
    encodingID: w.encodingID,
    languageID: w.languageID,
    nameID: w.nameID,
    bytes: mh(w.value, w.platformID, w.encodingID)
  })), i = o.map((w) => ko(w.tag)), r = 6, a = 12, u = n === 1 ? (n === 1 ? 2 : 0) + o.length * 4 : 0, l = r + s.length * a + u, d = [];
  let p = 0;
  const h = /* @__PURE__ */ new Map();
  function g(w) {
    const S = w.join(",");
    if (h.has(S))
      return h.get(S);
    const k = p;
    return h.set(S, k), d.push(w), p += w.length, k;
  }
  const x = s.map((w) => ({
    ...w,
    stringOffset: g(w.bytes),
    stringLength: w.bytes.length
  })), m = i.map((w) => ({
    stringOffset: g(w),
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
  for (const w of d)
    _.rawBytes(w);
  return _.toArray();
}
const zr = 78, Vr = 86, Fr = 96, Pr = 100;
function _h(t) {
  const n = new T(t), e = t.length, o = {};
  return o.version = n.uint16(), o.xAvgCharWidth = n.fword(), o.usWeightClass = n.uint16(), o.usWidthClass = n.uint16(), o.fsType = n.uint16(), o.ySubscriptXSize = n.fword(), o.ySubscriptYSize = n.fword(), o.ySubscriptXOffset = n.fword(), o.ySubscriptYOffset = n.fword(), o.ySuperscriptXSize = n.fword(), o.ySuperscriptYSize = n.fword(), o.ySuperscriptXOffset = n.fword(), o.ySuperscriptYOffset = n.fword(), o.yStrikeoutSize = n.fword(), o.yStrikeoutPosition = n.fword(), o.sFamilyClass = n.int16(), o.panose = n.bytes(10), o.ulUnicodeRange1 = n.uint32(), o.ulUnicodeRange2 = n.uint32(), o.ulUnicodeRange3 = n.uint32(), o.ulUnicodeRange4 = n.uint32(), o.achVendID = n.tag(), o.fsSelection = n.uint16(), o.usFirstCharIndex = n.uint16(), o.usLastCharIndex = n.uint16(), e < zr || (o.sTypoAscender = n.fword(), o.sTypoDescender = n.fword(), o.sTypoLineGap = n.fword(), o.usWinAscent = n.ufword(), o.usWinDescent = n.ufword(), o.version < 1 || e < Vr) || (o.ulCodePageRange1 = n.uint32(), o.ulCodePageRange2 = n.uint32(), o.version < 2 || e < Fr) || (o.sxHeight = n.fword(), o.sCapHeight = n.fword(), o.usDefaultChar = n.uint16(), o.usBreakChar = n.uint16(), o.usMaxContext = n.uint16(), o.version < 5 || e < Pr) || (o.usLowerOpticalPointSize = n.uint16(), o.usUpperOpticalPointSize = n.uint16()), o;
}
function bh(t) {
  const n = t.version;
  let e;
  n >= 5 ? e = Pr : n >= 2 ? e = Fr : n >= 1 ? e = Vr : e = t.sTypoAscender !== void 0 ? zr : 68;
  const o = new v(e);
  return o.uint16(n).fword(t.xAvgCharWidth).uint16(t.usWeightClass).uint16(t.usWidthClass).uint16(t.fsType).fword(t.ySubscriptXSize).fword(t.ySubscriptYSize).fword(t.ySubscriptXOffset).fword(t.ySubscriptYOffset).fword(t.ySuperscriptXSize).fword(t.ySuperscriptYSize).fword(t.ySuperscriptXOffset).fword(t.ySuperscriptYOffset).fword(t.yStrikeoutSize).fword(t.yStrikeoutPosition).int16(t.sFamilyClass).rawBytes(t.panose).uint32(t.ulUnicodeRange1).uint32(t.ulUnicodeRange2).uint32(t.ulUnicodeRange3).uint32(t.ulUnicodeRange4).tag(t.achVendID).uint16(t.fsSelection).uint16(t.usFirstCharIndex).uint16(t.usLastCharIndex), e <= 68 || (o.fword(t.sTypoAscender).fword(t.sTypoDescender).fword(t.sTypoLineGap).ufword(t.usWinAscent).ufword(t.usWinDescent), n < 1) || (o.uint32(t.ulCodePageRange1).uint32(t.ulCodePageRange2), n < 2) || (o.fword(t.sxHeight).fword(t.sCapHeight).uint16(t.usDefaultChar).uint16(t.usBreakChar).uint16(t.usMaxContext), n < 5) || o.uint16(t.usLowerOpticalPointSize).uint16(t.usUpperOpticalPointSize), o.toArray();
}
const vh = 54;
function kh(t) {
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
    typeface: qe(n.bytes(16)),
    characterComplement: qe(n.bytes(8)),
    fileName: qe(n.bytes(6)),
    strokeWeight: n.int8(),
    widthType: n.int8(),
    serifStyle: n.uint8(),
    reserved: n.uint8()
  };
}
function Ah(t) {
  const n = new v(vh);
  return n.uint32(t.version ?? 65536), n.uint32(t.fontNumber ?? 0), n.uint16(t.pitch ?? 0), n.uint16(t.xHeight ?? 0), n.uint16(t.style ?? 0), n.uint16(t.typeFamily ?? 0), n.uint16(t.capHeight ?? 0), n.uint16(t.symbolSet ?? 0), n.rawBytes(Xe(t.typeface ?? "", 16)), n.rawBytes(Xe(t.characterComplement ?? "", 8)), n.rawBytes(Xe(t.fileName ?? "", 6)), n.int8(t.strokeWeight ?? 0), n.int8(t.widthType ?? 0), n.uint8(t.serifStyle ?? 0), n.uint8(t.reserved ?? 0), n.toArray();
}
function qe(t) {
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
const Qo = 32, Ao = [
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
], Ur = new Map(
  Ao.map((t, n) => [t, n])
);
function Ch(t) {
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
    const d = n.uint16(), p = n.array("uint16", d);
    let h = -1;
    for (const y of p)
      y > h && (h = y);
    const g = h >= 258 ? h - 258 + 1 : 0, x = [];
    for (let y = 0; y < g; y++) {
      const _ = n.uint8(), w = n.bytes(_);
      x.push(String.fromCharCode(...w));
    }
    const m = p.map((y) => y < 258 ? Ao[y] : x[y - 258]);
    return l.glyphNames = m, l;
  }
  if (e === 151552) {
    const d = n.uint16(), h = n.array("int8", d).map(
      (g, x) => Ao[x + g]
    );
    return l.glyphNames = h, l;
  }
  return l;
}
function Oh(t) {
  const { version: n } = t;
  return n === 65536 || n === 196608 ? Xs(t) : n === 131072 ? Ih(t) : n === 151552 ? Dh(t) : Xs(t);
}
function Xs(t) {
  const n = new v(Qo);
  return n.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), n.toArray();
}
function Ih(t) {
  const { glyphNames: n } = t, e = n.length, o = [], s = [], i = /* @__PURE__ */ new Map();
  for (const f of n) {
    const u = Ur.get(f);
    u !== void 0 ? o.push(u) : (i.has(f) || (i.set(f, s.length), s.push(f)), o.push(258 + i.get(f)));
  }
  let r = 0;
  for (const f of s)
    r += 1 + f.length;
  const a = Qo + 2 + e * 2 + r, c = new v(a);
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
function Dh(t) {
  const { glyphNames: n } = t, e = n.length, o = Qo + 2 + e, s = new v(o);
  s.uint32(t.version).fixed(t.italicAngle).fword(t.underlinePosition).fword(t.underlineThickness).uint32(t.isFixedPitch).uint32(t.minMemType42).uint32(t.maxMemType42).uint32(t.minMemType1).uint32(t.maxMemType1), s.uint16(e);
  for (let i = 0; i < e; i++) {
    const r = n[i], c = Ur.get(r) - i;
    s.int8(c);
  }
  return s.toArray();
}
function Eh(t, n) {
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
    const d = e.uint16(), p = e.uint16();
    a == null && (a = (e.uint32() - 4) / 4 - 1, e.seek(u + 4));
    const h = e.array("uint32", a + 1), g = [];
    for (let x = 0; x < a; x++) {
      const m = u + h[x], y = u + h[x + 1], _ = y - m;
      if (_ <= 0) {
        g.push(null);
        continue;
      }
      e.seek(m);
      const w = e.int16(), S = e.int16(), k = e.tag(), b = _ > 8 ? t.slice(m + 8, y) : [];
      g.push({ originOffsetX: w, originOffsetY: S, graphicType: k, imageData: b });
    }
    c.push({ ppem: d, ppi: p, glyphs: g });
  }
  return { version: o, flags: s, strikes: c };
}
function Bh(t) {
  const n = t.version ?? 1, e = t.flags ?? 0, o = t.strikes ?? [], s = o.map((f) => f._raw ? f._raw : Th(f));
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
function Th(t) {
  const n = t.glyphs ?? [], e = n.length, o = n.map((u) => {
    if (!u) return [];
    const l = u.imageData ?? [], d = new v(8 + l.length);
    return d.int16(u.originOffsetX ?? 0), d.int16(u.originOffsetY ?? 0), d.tag(u.graphicType ?? "png "), d.rawBytes(l), d.toArray();
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
const Rh = 18, Nr = 20, en = 8;
function Mh(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = n.uint16(), i = n.uint16(), r = n.offset32(), a = n.uint16(), c = n.offset32();
  let f;
  o >= 1 && t.length >= Nr && (f = n.uint16());
  const u = [];
  if (i > 0 && r > 0)
    for (let h = 0; h < i; h++) {
      n.seek(r + h * s);
      const g = {
        axisTag: n.tag(),
        axisNameID: n.uint16(),
        axisOrdering: n.uint16()
      };
      s > en && (g._extra = n.bytes(s - en)), u.push(g);
    }
  const l = [];
  if (a > 0 && c > 0) {
    n.seek(c);
    for (let h = 0; h < a; h++)
      l.push(n.offset16());
  }
  const d = [];
  for (let h = 0; h < l.length; h++) {
    const g = l[h], x = c + g, m = h < l.length - 1 ? c + l[h + 1] : t.length;
    if (x >= t.length || m < x) {
      d.push({ format: 0, _raw: [] });
      continue;
    }
    d.push(Lh(t, x, m));
  }
  const p = {
    majorVersion: e,
    minorVersion: o,
    designAxisSize: s,
    designAxes: u,
    axisValues: d
  };
  return f !== void 0 && (p.elidedFallbackNameID = f), p;
}
function Lh(t, n, e) {
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
function zh(t) {
  const n = t.majorVersion ?? 1;
  let e = t.minorVersion ?? 2;
  const o = t.designAxes ?? [], s = t.axisValues ?? [], i = t.designAxisSize ?? en, r = o.reduce((k, b) => {
    const D = b._extra?.length ?? 0;
    return Math.max(k, en + D);
  }, en), a = Math.max(
    i,
    r
  ), c = e >= 1 || t.elidedFallbackNameID !== void 0;
  c && e === 0 && (e = 1);
  const f = c ? Nr : Rh, u = o.length, l = s.length, d = u > 0 ? f : 0, p = u * a, h = l > 0 ? f + p : 0, g = l * 2, x = s.map(
    (k) => Vh(k)
  );
  let m = g;
  const y = x.map((k) => {
    const b = m;
    return m += k.length, b;
  }), _ = x.reduce(
    (k, b) => k + b.length,
    0
  ), w = f + p + g + _, S = new v(w);
  S.uint16(n), S.uint16(e), S.uint16(a), S.uint16(u), S.offset32(d), S.uint16(l), S.offset32(h), c && S.uint16(t.elidedFallbackNameID ?? 2);
  for (const k of o) {
    S.tag(k.axisTag), S.uint16(k.axisNameID ?? 0), S.uint16(k.axisOrdering ?? 0);
    const b = k._extra ?? [];
    S.rawBytes(b);
    const D = a - en - b.length;
    D > 0 && S.rawBytes(new Array(D).fill(0));
  }
  for (const k of y)
    S.offset16(k);
  for (const k of x)
    S.rawBytes(k);
  return S.toArray();
}
function Vh(t) {
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
function Fh(t) {
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
      const d = o + u.svgDocOffset, p = t.slice(d, d + u.svgDocLength), h = p.length >= 3 && p[0] === 31 && p[1] === 139 && p[2] === 8, g = c.length;
      if (h)
        c.push({ compressed: !0, data: p });
      else {
        const x = r.decode(new Uint8Array(p));
        c.push({ compressed: !1, text: x });
      }
      a.set(l, g);
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
function Ph(t) {
  const { version: n, documents: e, entries: o } = t, s = new TextEncoder(), i = e.map((h) => h.compressed ? h.data instanceof Uint8Array ? Array.from(h.data) : h.data : Array.from(s.encode(h.text))), a = 10, c = o.length;
  let u = 2 + c * 12;
  const l = [];
  for (let h = 0; h < i.length; h++) {
    const g = i[h];
    l.push({ offset: u, length: g.length }), u += g.length;
  }
  const d = a + u, p = new v(d);
  p.uint16(n), p.uint32(a), p.uint32(0), p.uint16(c);
  for (const h of o) {
    const g = l[h.documentIndex];
    p.uint16(h.startGlyphID), p.uint16(h.endGlyphID), p.uint32(g.offset), p.uint32(g.length);
  }
  for (const h of i)
    for (const g of h)
      p.uint8(g);
  return p.toArray();
}
const Uh = 6, Nh = 4, Gh = 2, Gr = 6;
function $h(t) {
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
  const a = [...new Set(r)].sort((l, d) => l - d), c = a.map((l) => Zh(t, l)), f = new Map(
    a.map((l, d) => [l, d])
  ), u = i.map((l, d) => ({
    ...l,
    groupIndex: f.get(r[d]) ?? 0
  }));
  return {
    version: e,
    numRecs: o,
    numRatios: s,
    ratios: u,
    groups: c
  };
}
function Hh(t) {
  const n = t.version ?? 0, e = t.ratios ?? [], o = t.groups ?? [], s = o.map((u) => jh(u)), i = t.numRecs ?? Math.max(0, ...o.map((u) => (u.entries ?? []).length)), r = e.length;
  let a = Uh + r * Nh + r * Gh;
  const c = s.map((u) => {
    const l = a;
    return a += u.length, l;
  }), f = new v(a);
  f.uint16(n), f.uint16(i), f.uint16(r);
  for (const u of e)
    f.uint8(u.bCharSet ?? 0), f.uint8(u.xRatio ?? 0), f.uint8(u.yStartRatio ?? 0), f.uint8(u.yEndRatio ?? 0);
  for (const u of e) {
    const l = u.groupIndex ?? 0, d = c[l] ?? 0;
    f.offset16(d);
  }
  for (const u of s)
    f.rawBytes(u);
  return f.toArray();
}
function Zh(t, n) {
  if (!n || n >= t.length)
    return { recs: 0, startsz: 0, endsz: 0, entries: [] };
  const e = new T(t, n), o = e.uint16(), s = e.uint8(), i = e.uint8(), r = [];
  for (let a = 0; a < o && !(e.position + Gr > t.length); a++)
    r.push({
      yPelHeight: e.uint16(),
      yMax: e.int16(),
      yMin: e.int16()
    });
  return { recs: o, startsz: s, endsz: i, entries: r };
}
function jh(t) {
  const n = t.entries ?? [], e = t.recs ?? n.length, o = n.slice(0, e);
  for (; o.length < e; )
    o.push({ yPelHeight: 0, yMax: 0, yMin: 0 });
  const s = new v(4 + e * Gr);
  s.uint16(e), s.uint8(t.startsz ?? 0), s.uint8(t.endsz ?? 0);
  for (const i of o)
    s.uint16(i.yPelHeight ?? 0), s.int16(i.yMax ?? 0), s.int16(i.yMin ?? 0);
  return s.toArray();
}
const Wh = 36;
function Yh(t) {
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
function qh(t) {
  const n = new v(Wh);
  return n.uint32(t.version), n.fword(t.vertTypoAscender), n.fword(t.vertTypoDescender), n.fword(t.vertTypoLineGap), n.ufword(t.advanceHeightMax), n.fword(t.minTopSideBearing), n.fword(t.minBottomSideBearing), n.fword(t.yMaxExtent), n.int16(t.caretSlopeRise), n.int16(t.caretSlopeRun), n.int16(t.caretOffset), n.int16(t.reserved1), n.int16(t.reserved2), n.int16(t.reserved3), n.int16(t.reserved4), n.int16(t.metricDataFormat), n.uint16(t.numOfLongVerMetrics), n.toArray();
}
function Xh(t, n) {
  const e = n.vhea.numOfLongVerMetrics, o = n.maxp.numGlyphs, s = new T(t), i = [];
  for (let c = 0; c < e; c++)
    i.push({
      advanceHeight: s.ufword(),
      topSideBearing: s.fword()
    });
  const r = o - e, a = s.array("fword", r);
  return { vMetrics: i, topSideBearings: a };
}
function Kh(t) {
  const { vMetrics: n, topSideBearings: e } = t, o = n.length * 4 + e.length * 2, s = new v(o);
  for (const i of n)
    s.ufword(i.advanceHeight), s.fword(i.topSideBearing);
  return s.array("fword", e), s.toArray();
}
const Jh = 24, $r = 15, Hr = 48;
function Qh(t) {
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
        Zr(
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
  const o = Zr(t.length, n, e);
  if (o <= n || n >= t.length)
    return { format: 0, entryFormat: 0, mapCount: 0, entries: [], _raw: [] };
  const s = Array.from(t.slice(n, o));
  return {
    ...t1(s),
    _raw: s
  };
}
function Zr(t, n, e) {
  return e.filter((s) => s > n).sort((s, i) => s - i)[0] ?? t;
}
function t1(t) {
  const n = new T(t), e = n.uint8(), o = n.uint8(), s = e === 1 ? n.uint32() : n.uint16(), i = (o & $r) + 1, r = ((o & Hr) >> 4) + 1, a = [];
  for (let c = 0; c < s; c++) {
    const f = a1(n, r);
    a.push(s1(f, i));
  }
  return {
    format: e,
    entryFormat: o,
    mapCount: s,
    entries: a
  };
}
function n1(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.itemVariationStore ? Hn(t.itemVariationStore) : [], s = te(
    t.advanceHeightMapping
  ), i = te(t.tsbMapping), r = te(t.bsbMapping), a = te(t.vOrgMapping);
  let c = Jh;
  const f = o.length ? c : 0;
  c += o.length;
  const u = s.length ? c : 0;
  c += s.length;
  const l = i.length ? c : 0;
  c += i.length;
  const d = r.length ? c : 0;
  c += r.length;
  const p = a.length ? c : 0;
  c += a.length;
  const h = new v(c);
  return h.uint16(n), h.uint16(e), h.offset32(f), h.offset32(u), h.offset32(l), h.offset32(d), h.offset32(p), h.rawBytes(o), h.rawBytes(s), h.rawBytes(i), h.rawBytes(r), h.rawBytes(a), h.toArray();
}
function te(t) {
  return t ? t._raw ? t._raw : e1(t) : [];
}
function e1(t) {
  const n = t.entries ?? [], e = t.mapCount ?? n.length, o = i1(n), s = t.format ?? (e > 65535 ? 1 : 0), i = t.entryFormat ?? o.entryFormat, r = (i & $r) + 1, a = ((i & Hr) >> 4) + 1, c = s === 1 ? 6 : 4, f = new v(c + e * a);
  f.uint8(s), f.uint8(i), s === 1 ? f.uint32(e) : f.uint16(e);
  for (let u = 0; u < e; u++) {
    const l = n[u] ?? { outerIndex: 0, innerIndex: 0 }, d = o1(l, r);
    c1(f, d, a);
  }
  return f.toArray();
}
function o1(t, n) {
  const e = (1 << n) - 1;
  return (t.outerIndex ?? 0) << n | (t.innerIndex ?? 0) & e;
}
function s1(t, n) {
  const e = (1 << n) - 1;
  return {
    outerIndex: t >> n,
    innerIndex: t & e
  };
}
function i1(t) {
  let n = 0, e = 0;
  for (const a of t)
    n = Math.max(n, a.innerIndex ?? 0), e = Math.max(e, a.outerIndex ?? 0);
  let o = 1;
  for (; (1 << o) - 1 < n && o < 16; )
    o++;
  const s = e << o | n;
  let i = 1;
  for (; i < 4 && s > r1(i); )
    i++;
  return { entryFormat: i - 1 << 4 | o - 1 };
}
function r1(t) {
  return t === 1 ? 255 : t === 2 ? 65535 : t === 3 ? 16777215 : 4294967295;
}
function a1(t, n) {
  return n === 1 ? t.uint8() : n === 2 ? t.uint16() : n === 3 ? t.uint24() : t.uint32();
}
function c1(t, n, e) {
  e === 1 ? t.uint8(n) : e === 2 ? t.uint16(n) : e === 3 ? t.uint24(n) : t.uint32(n >>> 0);
}
const Oe = 32768, Ie = 4095, De = 32768, Ee = 16384, Be = 8192, f1 = 4095, jr = 128, u1 = 127, Wr = 128, Yr = 64, l1 = 63;
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
    const i = t.uint8(), r = (i & u1) + 1, a = (i & jr) !== 0;
    for (let c = 0; c < r && o.length < e; c++) {
      const f = a ? t.uint16() : t.uint8();
      s += f, o.push(s);
    }
  }
  return o;
}
function ge(t) {
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
    const f = (r ? jr : 0) | a - 1;
    e.push(f);
    for (let u = 0; u < a; u++) {
      const l = o[i + u];
      r ? e.push(l >> 8 & 255, l & 255) : e.push(l & 255);
    }
    i += a;
  }
  return e;
}
function qr(t, n) {
  const e = [];
  for (; e.length < n; ) {
    const o = t.uint8(), s = (o & l1) + 1;
    if (o & Wr)
      for (let i = 0; i < s && e.length < n; i++)
        e.push(0);
    else if (o & Yr)
      for (let i = 0; i < s && e.length < n; i++)
        e.push(t.int16());
    else
      for (let i = 0; i < s && e.length < n; i++)
        e.push(t.int8());
  }
  return e;
}
function Xr(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; )
    if (t[e] === 0) {
      let o = 1;
      const s = Math.min(64, t.length - e);
      for (; o < s && t[e + o] === 0; )
        o++;
      n.push(Wr | o - 1), e += o;
    } else if (t[e] < -128 || t[e] > 127) {
      let o = 1;
      const s = Math.min(64, t.length - e);
      for (; o < s; ) {
        const i = t[e + o];
        if (i === 0 || i >= -128 && i <= 127) break;
        o++;
      }
      n.push(Yr | o - 1);
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
function h1(t, n, e, o) {
  if (!t || t.length === 0) return [];
  const s = new T(t), i = s.uint16(), r = s.offset16(), a = i & Ie, c = (i & Oe) !== 0;
  if (a === 0) return [];
  const f = [];
  for (let d = 0; d < a; d++) {
    const p = s.uint16(), h = s.uint16();
    let g;
    if (h & De)
      g = s.array("f2dot14", n);
    else {
      const y = h & f1;
      g = e[y] ?? new Array(n).fill(0);
    }
    let x = null, m = null;
    h & Ee && (x = s.array("f2dot14", n), m = s.array("f2dot14", n)), f.push({
      variationDataSize: p,
      tupleIndex: h,
      peakTuple: g,
      intermediateStartTuple: x,
      intermediateEndTuple: m,
      hasPrivatePoints: (h & Be) !== 0
    });
  }
  s.seek(r);
  let u = null;
  c && (u = pe(s));
  const l = [];
  for (const d of f) {
    const h = s.position + d.variationDataSize;
    let g;
    d.hasPrivatePoints ? g = pe(s) : g = u;
    const x = g === null ? o : g.length, m = x * 2, y = qr(s, m);
    l.push({
      peakTuple: d.peakTuple,
      intermediateStartTuple: d.intermediateStartTuple,
      intermediateEndTuple: d.intermediateEndTuple,
      pointIndices: g,
      xDeltas: y.slice(0, x),
      yDeltas: y.slice(x)
    }), s.seek(h);
  }
  return l;
}
function d1(t, n) {
  if (!t || t.length === 0) return [];
  const e = t.length, s = t.every(
    (h) => JSON.stringify(h.pointIndices) === JSON.stringify(t[0].pointIndices)
  ) && e > 1, i = [];
  let r = [];
  s && (r = ge(t[0].pointIndices), i.push(r));
  const a = [];
  for (const h of t) {
    const g = [];
    s || g.push(...ge(h.pointIndices));
    const x = [...h.xDeltas ?? [], ...h.yDeltas ?? []];
    g.push(...Xr(x)), a.push(g.length), i.push(g);
  }
  const c = [];
  for (const h of i)
    c.push(...h);
  const f = [];
  for (let h = 0; h < e; h++) {
    const g = t[h];
    let x = De;
    s || (x |= Be), g.intermediateStartTuple && (x |= Ee);
    const m = [];
    m.push(a[h] >> 8 & 255), m.push(a[h] & 255), m.push(x >> 8 & 255), m.push(x & 255);
    for (let y = 0; y < n; y++) {
      const _ = Math.round((g.peakTuple[y] ?? 0) * 16384) & 65535;
      m.push(_ >> 8 & 255, _ & 255);
    }
    if (g.intermediateStartTuple) {
      for (let y = 0; y < n; y++) {
        const _ = Math.round((g.intermediateStartTuple[y] ?? 0) * 16384) & 65535;
        m.push(_ >> 8 & 255, _ & 255);
      }
      for (let y = 0; y < n; y++) {
        const _ = Math.round((g.intermediateEndTuple[y] ?? 0) * 16384) & 65535;
        m.push(_ >> 8 & 255, _ & 255);
      }
    }
    f.push(m);
  }
  const u = [];
  for (const h of f)
    u.push(...h);
  const l = (s ? Oe : 0) | e & Ie, d = 4 + u.length, p = [];
  return p.push(l >> 8 & 255), p.push(l & 255), p.push(d >> 8 & 255), p.push(d & 255), p.push(...u), p.push(...c), p;
}
function p1(t, n, e) {
  if (!t || t.length < 8)
    return { majorVersion: 1, minorVersion: 0, tupleVariations: [] };
  const o = new T(t), s = o.uint16(), i = o.uint16(), r = o.uint16(), a = o.offset16(), c = r & Ie, f = (r & Oe) !== 0;
  if (c === 0)
    return { majorVersion: s, minorVersion: i, tupleVariations: [] };
  const u = [];
  for (let p = 0; p < c; p++) {
    const h = o.uint16(), g = o.uint16();
    let x = null;
    g & De && (x = o.array("f2dot14", n));
    let m = null, y = null;
    g & Ee && (m = o.array("f2dot14", n), y = o.array("f2dot14", n)), u.push({
      variationDataSize: h,
      tupleIndex: g,
      peakTuple: x,
      intermediateStartTuple: m,
      intermediateEndTuple: y,
      hasPrivatePoints: (g & Be) !== 0
    });
  }
  o.seek(a);
  let l = null;
  f && (l = pe(o));
  const d = [];
  for (const p of u) {
    const g = o.position + p.variationDataSize;
    let x;
    p.hasPrivatePoints ? x = pe(o) : x = l;
    const m = x === null ? e : x.length, y = qr(o, m);
    d.push({
      peakTuple: p.peakTuple,
      intermediateStartTuple: p.intermediateStartTuple,
      intermediateEndTuple: p.intermediateEndTuple,
      pointIndices: x,
      deltas: y
    }), o.seek(g);
  }
  return { majorVersion: s, minorVersion: i, tupleVariations: d };
}
function g1(t, n) {
  const e = t.majorVersion ?? 1, o = t.minorVersion ?? 0, s = t.tupleVariations ?? [], i = s.length;
  if (i === 0) {
    const x = new v(8);
    return x.uint16(e), x.uint16(o), x.uint16(0), x.offset16(8), x.toArray();
  }
  const a = s.every(
    (x) => JSON.stringify(x.pointIndices) === JSON.stringify(s[0].pointIndices)
  ) && i > 1, c = [];
  a && c.push(
    ge(s[0].pointIndices)
  );
  const f = [];
  for (const x of s) {
    const m = [];
    a || m.push(...ge(x.pointIndices)), m.push(...Xr(x.deltas ?? [])), f.push(m.length), c.push(m);
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
  const d = (a ? Oe : 0) | i & Ie, p = 8 + l.length, h = p + u.length, g = new v(h);
  return g.uint16(e), g.uint16(o), g.uint16(d), g.offset16(p), g.rawBytes(l), g.rawBytes(u), g.toArray();
}
function m1(t, n = {}) {
  const e = n.fvar?.axes?.length ?? 0, o = n["cvt "]?.values?.length ?? 0;
  return p1(t, e, o);
}
function y1(t) {
  const n = t.tupleVariations?.[0]?.peakTuple?.length ?? 0;
  return g1(t, n);
}
function x1(t) {
  const n = new T(t), e = t.length >>> 1;
  return { values: n.array("fword", e) };
}
function w1(t) {
  const n = t.values, e = new v(n.length * 2);
  return e.array("fword", n), e.toArray();
}
function S1(t) {
  return { instructions: Array.from(t) };
}
function _1(t) {
  return Array.from(t.instructions);
}
function b1(t) {
  const n = new T(t), e = n.uint16(), o = n.uint16(), s = [];
  for (let i = 0; i < o; i++)
    s.push({
      rangeMaxPPEM: n.uint16(),
      rangeGaspBehavior: n.uint16()
    });
  return { version: e, gaspRanges: s };
}
function v1(t) {
  const { version: n, gaspRanges: e } = t, o = new v(4 + e.length * 4);
  o.uint16(n), o.uint16(e.length);
  for (const s of e)
    o.uint16(s.rangeMaxPPEM), o.uint16(s.rangeGaspBehavior);
  return o.toArray();
}
const Kr = 1, Jr = 2, Qr = 4, ta = 8, me = 16, ye = 32, na = 64, Tn = 1, xe = 2, ea = 4, ts = 8, Co = 32, ns = 64, es = 128, Rn = 256, oa = 512, sa = 1024, ia = 2048, ra = 4096;
function k1(t, n) {
  const e = n.loca.offsets, o = n.maxp.numGlyphs, s = new T(t), i = [];
  for (let r = 0; r < o; r++) {
    const a = e[r], c = e[r + 1];
    if (a === c) {
      i.push(null);
      continue;
    }
    s.seek(a);
    const f = s.int16(), u = s.int16(), l = s.int16(), d = s.int16(), p = s.int16();
    f >= 0 ? i.push(
      A1(s, f, u, l, d, p)
    ) : i.push(C1(s, u, l, d, p));
  }
  return { glyphs: i };
}
function A1(t, n, e, o, s, i) {
  const r = t.array("uint16", n), a = n > 0 ? r[n - 1] + 1 : 0, c = t.uint16(), f = t.bytes(c), u = [];
  for (; u.length < a; ) {
    const y = t.uint8();
    if (u.push(y), y & ta) {
      const _ = t.uint8();
      for (let w = 0; w < _; w++)
        u.push(y);
    }
  }
  const l = new Array(a);
  let d = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & Jr) {
      const w = t.uint8();
      d += _ & me ? w : -w;
    } else _ & me || (d += t.int16());
    l[y] = d;
  }
  const p = new Array(a);
  let h = 0;
  for (let y = 0; y < a; y++) {
    const _ = u[y];
    if (_ & Qr) {
      const w = t.uint8();
      h += _ & ye ? w : -w;
    } else _ & ye || (h += t.int16());
    p[y] = h;
  }
  const g = a > 0 && (u[0] & na) !== 0, x = [];
  let m = 0;
  for (let y = 0; y < n; y++) {
    const _ = r[y], w = [];
    for (; m <= _; )
      w.push({
        x: l[m],
        y: p[m],
        onCurve: (u[m] & Kr) !== 0
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
    overlapSimple: g
  };
}
function C1(t, n, e, o, s) {
  const i = [];
  let r, a = !1;
  do {
    r = t.uint16();
    const f = t.uint16();
    let u, l;
    r & Tn ? r & xe ? (u = t.int16(), l = t.int16()) : (u = t.uint16(), l = t.uint16()) : r & xe ? (u = t.int8(), l = t.int8()) : (u = t.uint8(), l = t.uint8());
    const d = {
      glyphIndex: f,
      flags: O1(r),
      argument1: u,
      argument2: l
    };
    r & ts ? d.transform = { scale: t.f2dot14() } : r & ns ? d.transform = {
      xScale: t.f2dot14(),
      yScale: t.f2dot14()
    } : r & es && (d.transform = {
      xScale: t.f2dot14(),
      scale01: t.f2dot14(),
      scale10: t.f2dot14(),
      yScale: t.f2dot14()
    }), i.push(d), r & Rn && (a = !0);
  } while (r & Co);
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
function O1(t) {
  const n = {};
  return t & Tn && (n.argsAreWords = !0), t & xe && (n.argsAreXYValues = !0), t & ea && (n.roundXYToGrid = !0), t & ts && (n.weHaveAScale = !0), t & ns && (n.weHaveAnXAndYScale = !0), t & es && (n.weHaveATwoByTwo = !0), t & Rn && (n.weHaveInstructions = !0), t & oa && (n.useMyMetrics = !0), t & sa && (n.overlapCompound = !0), t & ia && (n.scaledComponentOffset = !0), t & ra && (n.unscaledComponentOffset = !0), n;
}
function aa(t) {
  const { glyphs: n } = t, e = [];
  for (const i of n) {
    if (i === null) {
      e.push([]);
      continue;
    }
    i.type === "simple" ? e.push(D1(i)) : e.push(B1(i));
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
function I1(t) {
  return aa(t).bytes;
}
function D1(t) {
  const { contours: n, instructions: e, xMin: o, yMin: s, xMax: i, yMax: r, overlapSimple: a } = t, c = n.length, f = [], u = [];
  for (const A of n) {
    for (const I of A)
      f.push(I);
    u.push(f.length - 1);
  }
  const l = f.length, d = f.map((A) => A.x), p = f.map((A) => A.y), h = new Array(l), g = new Array(l);
  for (let A = 0; A < l; A++)
    h[A] = A === 0 ? d[A] : d[A] - d[A - 1], g[A] = A === 0 ? p[A] : p[A] - p[A - 1];
  const x = [], m = [], y = [];
  for (let A = 0; A < l; A++) {
    let I = 0;
    f[A].onCurve && (I |= Kr);
    const O = h[A], E = g[A];
    O === 0 ? I |= me : O >= -255 && O <= 255 ? (I |= Jr, O > 0 ? (I |= me, m.push(O)) : m.push(-O)) : m.push(O >> 8 & 255, O & 255), E === 0 ? I |= ye : E >= -255 && E <= 255 ? (I |= Qr, E > 0 ? (I |= ye, y.push(E)) : y.push(-E)) : y.push(E >> 8 & 255, E & 255), A === 0 && a && (I |= na), x.push(I);
  }
  const _ = E1(x), w = 10, S = c * 2, k = 2, b = e.length, D = w + S + k + b + _.length + m.length + y.length, C = new v(D);
  return C.int16(c), C.int16(o), C.int16(s), C.int16(i), C.int16(r), C.array("uint16", u), C.uint16(e.length), C.rawBytes(e), C.rawBytes(_), C.rawBytes(m), C.rawBytes(y), C.toArray();
}
function E1(t) {
  const n = [];
  let e = 0;
  for (; e < t.length; ) {
    const o = t[e];
    let s = 0;
    for (; e + 1 + s < t.length && t[e + 1 + s] === o && s < 255; )
      s++;
    s > 0 ? (n.push(o | ta, s), e += 1 + s) : (n.push(o), e++);
  }
  return n;
}
function B1(t) {
  const { components: n, instructions: e, xMin: o, yMin: s, xMax: i, yMax: r } = t;
  let a = 10;
  for (let f = 0; f < n.length; f++) {
    const u = n[f];
    a += 4;
    const l = u.flags.argsAreWords || Ks(u.argument1, u.argument2, u.flags.argsAreXYValues);
    a += l ? 4 : 2, u.transform && ("scale" in u.transform ? a += 2 : "scale01" in u.transform ? a += 8 : "xScale" in u.transform && (a += 4));
  }
  e && e.length > 0 && (a += 2 + e.length);
  const c = new v(a);
  c.int16(-1), c.int16(o), c.int16(s), c.int16(i), c.int16(r);
  for (let f = 0; f < n.length; f++) {
    const u = n[f], l = f === n.length - 1;
    let d = T1(u.flags);
    const p = u.flags.argsAreWords || Ks(u.argument1, u.argument2, u.flags.argsAreXYValues);
    p ? d |= Tn : d &= ~Tn, l ? d &= ~Co : d |= Co, l && e && e.length > 0 ? d |= Rn : l && (d &= ~Rn), c.uint16(d), c.uint16(u.glyphIndex), p ? u.flags.argsAreXYValues ? (c.int16(u.argument1), c.int16(u.argument2)) : (c.uint16(u.argument1), c.uint16(u.argument2)) : u.flags.argsAreXYValues ? (c.int8(u.argument1), c.int8(u.argument2)) : (c.uint8(u.argument1), c.uint8(u.argument2)), u.transform && ("scale" in u.transform ? c.f2dot14(u.transform.scale) : "scale01" in u.transform ? (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.scale01), c.f2dot14(u.transform.scale10), c.f2dot14(u.transform.yScale)) : "xScale" in u.transform && (c.f2dot14(u.transform.xScale), c.f2dot14(u.transform.yScale)));
  }
  return e && e.length > 0 && (c.uint16(e.length), c.rawBytes(e)), c.toArray();
}
function Ks(t, n, e) {
  return e ? t < -128 || t > 127 || n < -128 || n > 127 : t > 255 || n > 255;
}
function T1(t) {
  let n = 0;
  return t.argsAreWords && (n |= Tn), t.argsAreXYValues && (n |= xe), t.roundXYToGrid && (n |= ea), t.weHaveAScale && (n |= ts), t.weHaveAnXAndYScale && (n |= ns), t.weHaveATwoByTwo && (n |= es), t.weHaveInstructions && (n |= Rn), t.useMyMetrics && (n |= oa), t.overlapCompound && (n |= sa), t.scaledComponentOffset && (n |= ia), t.unscaledComponentOffset && (n |= ra), n;
}
const R1 = 20, Oo = 1;
function M1(t, n = {}) {
  const e = new T(t), o = e.uint16(), s = e.uint16(), i = e.uint16(), r = e.uint16(), a = e.offset32(), c = e.uint16(), f = e.uint16(), u = e.offset32(), l = (f & Oo) !== 0, d = c + 1, p = [];
  for (let x = 0; x < d; x++)
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
  const g = [];
  for (let x = 0; x < c; x++) {
    const m = p[x], y = p[x + 1], _ = Math.max(0, y - m);
    if (_ === 0) {
      g.push([]);
      continue;
    }
    const w = u + m, S = t.slice(w, w + _), k = L1(n, x);
    g.push(
      h1(S, i, h, k)
    );
  }
  return {
    majorVersion: o,
    minorVersion: s,
    axisCount: i,
    flags: f,
    sharedTuples: h,
    glyphVariationData: g
  };
}
function L1(t, n) {
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
function z1(t) {
  const n = t.majorVersion ?? 1, e = t.minorVersion ?? 0, o = t.axisCount ?? 0, s = t.glyphVariationData ?? [], i = s.length, r = s.map((S) => Array.isArray(S) && (S.length === 0 || typeof S[0] == "number") ? S : Array.isArray(S) ? d1(S, o) : []), a = t.sharedTuples ?? V1(s, o), c = a.length, f = c * o * 2, u = [0];
  let l = 0;
  for (const S of r)
    l += S.length, u.push(l);
  const d = u.every(
    (S) => S % 2 === 0 && S / 2 <= 65535
  ), p = d ? 2 : 4, h = (i + 1) * p, g = R1 + h, x = g + f, m = x + l, y = t.flags ?? 0, _ = d ? y & ~Oo : y | Oo, w = new v(m);
  w.uint16(n), w.uint16(e), w.uint16(o), w.uint16(c), w.offset32(g), w.uint16(i), w.uint16(_), w.offset32(x);
  for (const S of u)
    d ? w.uint16(S / 2) : w.uint32(S);
  for (const S of a)
    for (let k = 0; k < o; k++)
      w.f2dot14(S[k] ?? 0);
  for (const S of r)
    w.rawBytes(S);
  return w.toArray();
}
function V1(t, n) {
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
function F1(t, n) {
  const e = n.head.indexToLocFormat, s = n.maxp.numGlyphs + 1, i = new T(t), r = [];
  if (e === 0)
    for (let a = 0; a < s; a++)
      r.push(i.uint16() * 2);
  else
    for (let a = 0; a < s; a++)
      r.push(i.uint32());
  return { offsets: r };
}
function ca(t) {
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
function P1(t) {
  return { instructions: Array.from(t) };
}
function U1(t) {
  return Array.from(t.instructions);
}
const N1 = 4, Js = 0, Qs = 1, G1 = 2;
function pn(t) {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}
const $1 = 0, fa = 1, H1 = 2, Z1 = 3, j1 = 258, os = 29, jn = 256, Mn = jn + 1 + os, sn = 30, ss = 19, ua = 2 * Mn + 1, Ft = 15, Ke = 16, W1 = 7, is = 256, la = 16, ha = 17, da = 18, Io = (
  /* extra bits for each length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 4, 5, 5, 5, 5, 0])
), ue = (
  /* extra bits for each distance code */
  new Uint8Array([0, 0, 0, 0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 7, 8, 8, 9, 9, 10, 10, 11, 11, 12, 12, 13, 13])
), Y1 = (
  /* extra bits for each bit length code */
  new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 3, 7])
), pa = new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15]), q1 = 512, St = new Array((Mn + 2) * 2);
pn(St);
const In = new Array(sn * 2);
pn(In);
const Ln = new Array(q1);
pn(Ln);
const zn = new Array(j1 - Z1 + 1);
pn(zn);
const rs = new Array(os);
pn(rs);
const we = new Array(sn);
pn(we);
function Je(t, n, e, o, s) {
  this.static_tree = t, this.extra_bits = n, this.extra_base = e, this.elems = o, this.max_length = s, this.has_stree = t && t.length;
}
let ga, ma, ya;
function Qe(t, n) {
  this.dyn_tree = t, this.max_code = 0, this.stat_desc = n;
}
const xa = (t) => t < 256 ? Ln[t] : Ln[256 + (t >>> 7)], Vn = (t, n) => {
  t.pending_buf[t.pending++] = n & 255, t.pending_buf[t.pending++] = n >>> 8 & 255;
}, Q = (t, n, e) => {
  t.bi_valid > Ke - e ? (t.bi_buf |= n << t.bi_valid & 65535, Vn(t, t.bi_buf), t.bi_buf = n >> Ke - t.bi_valid, t.bi_valid += e - Ke) : (t.bi_buf |= n << t.bi_valid & 65535, t.bi_valid += e);
}, ut = (t, n, e) => {
  Q(
    t,
    e[n * 2],
    e[n * 2 + 1]
    /*.Len*/
  );
}, wa = (t, n) => {
  let e = 0;
  do
    e |= t & 1, t >>>= 1, e <<= 1;
  while (--n > 0);
  return e >>> 1;
}, X1 = (t) => {
  t.bi_valid === 16 ? (Vn(t, t.bi_buf), t.bi_buf = 0, t.bi_valid = 0) : t.bi_valid >= 8 && (t.pending_buf[t.pending++] = t.bi_buf & 255, t.bi_buf >>= 8, t.bi_valid -= 8);
}, K1 = (t, n) => {
  const e = n.dyn_tree, o = n.max_code, s = n.stat_desc.static_tree, i = n.stat_desc.has_stree, r = n.stat_desc.extra_bits, a = n.stat_desc.extra_base, c = n.stat_desc.max_length;
  let f, u, l, d, p, h, g = 0;
  for (d = 0; d <= Ft; d++)
    t.bl_count[d] = 0;
  for (e[t.heap[t.heap_max] * 2 + 1] = 0, f = t.heap_max + 1; f < ua; f++)
    u = t.heap[f], d = e[e[u * 2 + 1] * 2 + 1] + 1, d > c && (d = c, g++), e[u * 2 + 1] = d, !(u > o) && (t.bl_count[d]++, p = 0, u >= a && (p = r[u - a]), h = e[u * 2], t.opt_len += h * (d + p), i && (t.static_len += h * (s[u * 2 + 1] + p)));
  if (g !== 0) {
    do {
      for (d = c - 1; t.bl_count[d] === 0; )
        d--;
      t.bl_count[d]--, t.bl_count[d + 1] += 2, t.bl_count[c]--, g -= 2;
    } while (g > 0);
    for (d = c; d !== 0; d--)
      for (u = t.bl_count[d]; u !== 0; )
        l = t.heap[--f], !(l > o) && (e[l * 2 + 1] !== d && (t.opt_len += (d - e[l * 2 + 1]) * e[l * 2], e[l * 2 + 1] = d), u--);
  }
}, Sa = (t, n, e) => {
  const o = new Array(Ft + 1);
  let s = 0, i, r;
  for (i = 1; i <= Ft; i++)
    s = s + e[i - 1] << 1, o[i] = s;
  for (r = 0; r <= n; r++) {
    let a = t[r * 2 + 1];
    a !== 0 && (t[r * 2] = wa(o[a]++, a));
  }
}, J1 = () => {
  let t, n, e, o, s;
  const i = new Array(Ft + 1);
  for (e = 0, o = 0; o < os - 1; o++)
    for (rs[o] = e, t = 0; t < 1 << Io[o]; t++)
      zn[e++] = o;
  for (zn[e - 1] = o, s = 0, o = 0; o < 16; o++)
    for (we[o] = s, t = 0; t < 1 << ue[o]; t++)
      Ln[s++] = o;
  for (s >>= 7; o < sn; o++)
    for (we[o] = s << 7, t = 0; t < 1 << ue[o] - 7; t++)
      Ln[256 + s++] = o;
  for (n = 0; n <= Ft; n++)
    i[n] = 0;
  for (t = 0; t <= 143; )
    St[t * 2 + 1] = 8, t++, i[8]++;
  for (; t <= 255; )
    St[t * 2 + 1] = 9, t++, i[9]++;
  for (; t <= 279; )
    St[t * 2 + 1] = 7, t++, i[7]++;
  for (; t <= 287; )
    St[t * 2 + 1] = 8, t++, i[8]++;
  for (Sa(St, Mn + 1, i), t = 0; t < sn; t++)
    In[t * 2 + 1] = 5, In[t * 2] = wa(t, 5);
  ga = new Je(St, Io, jn + 1, Mn, Ft), ma = new Je(In, ue, 0, sn, Ft), ya = new Je(new Array(0), Y1, 0, ss, W1);
}, _a = (t) => {
  let n;
  for (n = 0; n < Mn; n++)
    t.dyn_ltree[n * 2] = 0;
  for (n = 0; n < sn; n++)
    t.dyn_dtree[n * 2] = 0;
  for (n = 0; n < ss; n++)
    t.bl_tree[n * 2] = 0;
  t.dyn_ltree[is * 2] = 1, t.opt_len = t.static_len = 0, t.sym_next = t.matches = 0;
}, ba = (t) => {
  t.bi_valid > 8 ? Vn(t, t.bi_buf) : t.bi_valid > 0 && (t.pending_buf[t.pending++] = t.bi_buf), t.bi_buf = 0, t.bi_valid = 0;
}, ti = (t, n, e, o) => {
  const s = n * 2, i = e * 2;
  return t[s] < t[i] || t[s] === t[i] && o[n] <= o[e];
}, to = (t, n, e) => {
  const o = t.heap[e];
  let s = e << 1;
  for (; s <= t.heap_len && (s < t.heap_len && ti(n, t.heap[s + 1], t.heap[s], t.depth) && s++, !ti(n, o, t.heap[s], t.depth)); )
    t.heap[e] = t.heap[s], e = s, s <<= 1;
  t.heap[e] = o;
}, ni = (t, n, e) => {
  let o, s, i = 0, r, a;
  if (t.sym_next !== 0)
    do
      o = t.pending_buf[t.sym_buf + i++] & 255, o += (t.pending_buf[t.sym_buf + i++] & 255) << 8, s = t.pending_buf[t.sym_buf + i++], o === 0 ? ut(t, s, n) : (r = zn[s], ut(t, r + jn + 1, n), a = Io[r], a !== 0 && (s -= rs[r], Q(t, s, a)), o--, r = xa(o), ut(t, r, e), a = ue[r], a !== 0 && (o -= we[r], Q(t, o, a)));
    while (i < t.sym_next);
  ut(t, is, n);
}, Do = (t, n) => {
  const e = n.dyn_tree, o = n.stat_desc.static_tree, s = n.stat_desc.has_stree, i = n.stat_desc.elems;
  let r, a, c = -1, f;
  for (t.heap_len = 0, t.heap_max = ua, r = 0; r < i; r++)
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
  ], K1(t, n), Sa(e, c, t.bl_count);
}, ei = (t, n, e) => {
  let o, s = -1, i, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), n[(e + 1) * 2 + 1] = 65535, o = 0; o <= e; o++)
    i = r, r = n[(o + 1) * 2 + 1], !(++a < c && i === r) && (a < f ? t.bl_tree[i * 2] += a : i !== 0 ? (i !== s && t.bl_tree[i * 2]++, t.bl_tree[la * 2]++) : a <= 10 ? t.bl_tree[ha * 2]++ : t.bl_tree[da * 2]++, a = 0, s = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4));
}, oi = (t, n, e) => {
  let o, s = -1, i, r = n[1], a = 0, c = 7, f = 4;
  for (r === 0 && (c = 138, f = 3), o = 0; o <= e; o++)
    if (i = r, r = n[(o + 1) * 2 + 1], !(++a < c && i === r)) {
      if (a < f)
        do
          ut(t, i, t.bl_tree);
        while (--a !== 0);
      else i !== 0 ? (i !== s && (ut(t, i, t.bl_tree), a--), ut(t, la, t.bl_tree), Q(t, a - 3, 2)) : a <= 10 ? (ut(t, ha, t.bl_tree), Q(t, a - 3, 3)) : (ut(t, da, t.bl_tree), Q(t, a - 11, 7));
      a = 0, s = i, r === 0 ? (c = 138, f = 3) : i === r ? (c = 6, f = 3) : (c = 7, f = 4);
    }
}, Q1 = (t) => {
  let n;
  for (ei(t, t.dyn_ltree, t.l_desc.max_code), ei(t, t.dyn_dtree, t.d_desc.max_code), Do(t, t.bl_desc), n = ss - 1; n >= 3 && t.bl_tree[pa[n] * 2 + 1] === 0; n--)
    ;
  return t.opt_len += 3 * (n + 1) + 5 + 5 + 4, n;
}, td = (t, n, e, o) => {
  let s;
  for (Q(t, n - 257, 5), Q(t, e - 1, 5), Q(t, o - 4, 4), s = 0; s < o; s++)
    Q(t, t.bl_tree[pa[s] * 2 + 1], 3);
  oi(t, t.dyn_ltree, n - 1), oi(t, t.dyn_dtree, e - 1);
}, nd = (t) => {
  let n = 4093624447, e;
  for (e = 0; e <= 31; e++, n >>>= 1)
    if (n & 1 && t.dyn_ltree[e * 2] !== 0)
      return Js;
  if (t.dyn_ltree[18] !== 0 || t.dyn_ltree[20] !== 0 || t.dyn_ltree[26] !== 0)
    return Qs;
  for (e = 32; e < jn; e++)
    if (t.dyn_ltree[e * 2] !== 0)
      return Qs;
  return Js;
};
let si = !1;
const ed = (t) => {
  si || (J1(), si = !0), t.l_desc = new Qe(t.dyn_ltree, ga), t.d_desc = new Qe(t.dyn_dtree, ma), t.bl_desc = new Qe(t.bl_tree, ya), t.bi_buf = 0, t.bi_valid = 0, _a(t);
}, va = (t, n, e, o) => {
  Q(t, ($1 << 1) + (o ? 1 : 0), 3), ba(t), Vn(t, e), Vn(t, ~e), e && t.pending_buf.set(t.window.subarray(n, n + e), t.pending), t.pending += e;
}, od = (t) => {
  Q(t, fa << 1, 3), ut(t, is, St), X1(t);
}, sd = (t, n, e, o) => {
  let s, i, r = 0;
  t.level > 0 ? (t.strm.data_type === G1 && (t.strm.data_type = nd(t)), Do(t, t.l_desc), Do(t, t.d_desc), r = Q1(t), s = t.opt_len + 3 + 7 >>> 3, i = t.static_len + 3 + 7 >>> 3, i <= s && (s = i)) : s = i = e + 5, e + 4 <= s && n !== -1 ? va(t, n, e, o) : t.strategy === N1 || i === s ? (Q(t, (fa << 1) + (o ? 1 : 0), 3), ni(t, St, In)) : (Q(t, (H1 << 1) + (o ? 1 : 0), 3), td(t, t.l_desc.max_code + 1, t.d_desc.max_code + 1, r + 1), ni(t, t.dyn_ltree, t.dyn_dtree)), _a(t), o && ba(t);
}, id = (t, n, e) => (t.pending_buf[t.sym_buf + t.sym_next++] = n, t.pending_buf[t.sym_buf + t.sym_next++] = n >> 8, t.pending_buf[t.sym_buf + t.sym_next++] = e, n === 0 ? t.dyn_ltree[e * 2]++ : (t.matches++, n--, t.dyn_ltree[(zn[e] + jn + 1) * 2]++, t.dyn_dtree[xa(n) * 2]++), t.sym_next === t.sym_end);
var rd = ed, ad = va, cd = sd, fd = id, ud = od, ld = {
  _tr_init: rd,
  _tr_stored_block: ad,
  _tr_flush_block: cd,
  _tr_tally: fd,
  _tr_align: ud
};
const hd = (t, n, e, o) => {
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
var Fn = hd;
const dd = () => {
  let t, n = [];
  for (var e = 0; e < 256; e++) {
    t = e;
    for (var o = 0; o < 8; o++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    n[e] = t;
  }
  return n;
}, pd = new Uint32Array(dd()), gd = (t, n, e, o) => {
  const s = pd, i = o + e;
  t ^= -1;
  for (let r = o; r < i; r++)
    t = t >>> 8 ^ s[(t ^ n[r]) & 255];
  return t ^ -1;
};
var Z = gd, Gt = {
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
const { _tr_init: md, _tr_stored_block: Eo, _tr_flush_block: yd, _tr_tally: Et, _tr_align: xd } = ld, {
  Z_NO_FLUSH: Bt,
  Z_PARTIAL_FLUSH: wd,
  Z_FULL_FLUSH: Sd,
  Z_FINISH: it,
  Z_BLOCK: ii,
  Z_OK: W,
  Z_STREAM_END: ri,
  Z_STREAM_ERROR: ht,
  Z_DATA_ERROR: _d,
  Z_BUF_ERROR: no,
  Z_DEFAULT_COMPRESSION: bd,
  Z_FILTERED: vd,
  Z_HUFFMAN_ONLY: ne,
  Z_RLE: kd,
  Z_FIXED: Ad,
  Z_DEFAULT_STRATEGY: Cd,
  Z_UNKNOWN: Od,
  Z_DEFLATED: Re
} = Te, Id = 9, Dd = 15, Ed = 8, Bd = 29, Td = 256, Bo = Td + 1 + Bd, Rd = 30, Md = 19, Ld = 2 * Bo + 1, zd = 15, L = 3, Ot = 258, dt = Ot + L + 1, Vd = 32, hn = 42, as = 57, To = 69, Ro = 73, Mo = 91, Lo = 103, Pt = 113, kn = 666, K = 1, gn = 2, $t = 3, mn = 4, Fd = 3, Ut = (t, n) => (t.msg = Gt[n], n), ai = (t) => t * 2 - (t > 4 ? 9 : 0), kt = (t) => {
  let n = t.length;
  for (; --n >= 0; )
    t[n] = 0;
}, Pd = (t) => {
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
let Ud = (t, n, e) => (n << t.hash_shift ^ e) & t.hash_mask, Tt = Ud;
const nt = (t) => {
  const n = t.state;
  let e = n.pending;
  e > t.avail_out && (e = t.avail_out), e !== 0 && (t.output.set(n.pending_buf.subarray(n.pending_out, n.pending_out + e), t.next_out), t.next_out += e, n.pending_out += e, t.total_out += e, t.avail_out -= e, n.pending -= e, n.pending === 0 && (n.pending_out = 0));
}, et = (t, n) => {
  yd(t, t.block_start >= 0 ? t.block_start : -1, t.strstart - t.block_start, n), t.block_start = t.strstart, nt(t.strm);
}, z = (t, n) => {
  t.pending_buf[t.pending++] = n;
}, Sn = (t, n) => {
  t.pending_buf[t.pending++] = n >>> 8 & 255, t.pending_buf[t.pending++] = n & 255;
}, zo = (t, n, e, o) => {
  let s = t.avail_in;
  return s > o && (s = o), s === 0 ? 0 : (t.avail_in -= s, n.set(t.input.subarray(t.next_in, t.next_in + s), e), t.state.wrap === 1 ? t.adler = Fn(t.adler, n, s, e) : t.state.wrap === 2 && (t.adler = Z(t.adler, n, s, e)), t.next_in += s, t.total_in += s, s);
}, ka = (t, n) => {
  let e = t.max_chain_length, o = t.strstart, s, i, r = t.prev_length, a = t.nice_match;
  const c = t.strstart > t.w_size - dt ? t.strstart - (t.w_size - dt) : 0, f = t.window, u = t.w_mask, l = t.prev, d = t.strstart + Ot;
  let p = f[o + r - 1], h = f[o + r];
  t.prev_length >= t.good_match && (e >>= 2), a > t.lookahead && (a = t.lookahead);
  do
    if (s = n, !(f[s + r] !== h || f[s + r - 1] !== p || f[s] !== f[o] || f[++s] !== f[o + 1])) {
      o += 2, s++;
      do
        ;
      while (f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && f[++o] === f[++s] && o < d);
      if (i = Ot - (d - o), o = d - Ot, i > r) {
        if (t.match_start = n, r = i, i >= a)
          break;
        p = f[o + r - 1], h = f[o + r];
      }
    }
  while ((n = l[n & u]) > c && --e !== 0);
  return r <= t.lookahead ? r : t.lookahead;
}, dn = (t) => {
  const n = t.w_size;
  let e, o, s;
  do {
    if (o = t.window_size - t.lookahead - t.strstart, t.strstart >= n + (n - dt) && (t.window.set(t.window.subarray(n, n + n - o), 0), t.match_start -= n, t.strstart -= n, t.block_start -= n, t.insert > t.strstart && (t.insert = t.strstart), Pd(t), o += n), t.strm.avail_in === 0)
      break;
    if (e = zo(t.strm, t.window, t.strstart + t.lookahead, o), t.lookahead += e, t.lookahead + t.insert >= L)
      for (s = t.strstart - t.insert, t.ins_h = t.window[s], t.ins_h = Tt(t, t.ins_h, t.window[s + 1]); t.insert && (t.ins_h = Tt(t, t.ins_h, t.window[s + L - 1]), t.prev[s & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = s, s++, t.insert--, !(t.lookahead + t.insert < L)); )
        ;
  } while (t.lookahead < dt && t.strm.avail_in !== 0);
}, Aa = (t, n) => {
  let e = t.pending_buf_size - 5 > t.w_size ? t.w_size : t.pending_buf_size - 5, o, s, i, r = 0, a = t.strm.avail_in;
  do {
    if (o = 65535, i = t.bi_valid + 42 >> 3, t.strm.avail_out < i || (i = t.strm.avail_out - i, s = t.strstart - t.block_start, o > s + t.strm.avail_in && (o = s + t.strm.avail_in), o > i && (o = i), o < e && (o === 0 && n !== it || n === Bt || o !== s + t.strm.avail_in)))
      break;
    r = n === it && o === s + t.strm.avail_in ? 1 : 0, Eo(t, 0, 0, r), t.pending_buf[t.pending - 4] = o, t.pending_buf[t.pending - 3] = o >> 8, t.pending_buf[t.pending - 2] = ~o, t.pending_buf[t.pending - 1] = ~o >> 8, nt(t.strm), s && (s > o && (s = o), t.strm.output.set(t.window.subarray(t.block_start, t.block_start + s), t.strm.next_out), t.strm.next_out += s, t.strm.avail_out -= s, t.strm.total_out += s, t.block_start += s, o -= s), o && (zo(t.strm, t.strm.output, t.strm.next_out, o), t.strm.next_out += o, t.strm.avail_out -= o, t.strm.total_out += o);
  } while (r === 0);
  return a -= t.strm.avail_in, a && (a >= t.w_size ? (t.matches = 2, t.window.set(t.strm.input.subarray(t.strm.next_in - t.w_size, t.strm.next_in), 0), t.strstart = t.w_size, t.insert = t.strstart) : (t.window_size - t.strstart <= a && (t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, t.insert > t.strstart && (t.insert = t.strstart)), t.window.set(t.strm.input.subarray(t.strm.next_in - a, t.strm.next_in), t.strstart), t.strstart += a, t.insert += a > t.w_size - t.insert ? t.w_size - t.insert : a), t.block_start = t.strstart), t.high_water < t.strstart && (t.high_water = t.strstart), r ? mn : n !== Bt && n !== it && t.strm.avail_in === 0 && t.strstart === t.block_start ? gn : (i = t.window_size - t.strstart, t.strm.avail_in > i && t.block_start >= t.w_size && (t.block_start -= t.w_size, t.strstart -= t.w_size, t.window.set(t.window.subarray(t.w_size, t.w_size + t.strstart), 0), t.matches < 2 && t.matches++, i += t.w_size, t.insert > t.strstart && (t.insert = t.strstart)), i > t.strm.avail_in && (i = t.strm.avail_in), i && (zo(t.strm, t.window, t.strstart, i), t.strstart += i, t.insert += i > t.w_size - t.insert ? t.w_size - t.insert : i), t.high_water < t.strstart && (t.high_water = t.strstart), i = t.bi_valid + 42 >> 3, i = t.pending_buf_size - i > 65535 ? 65535 : t.pending_buf_size - i, e = i > t.w_size ? t.w_size : i, s = t.strstart - t.block_start, (s >= e || (s || n === it) && n !== Bt && t.strm.avail_in === 0 && s <= i) && (o = s > i ? i : s, r = n === it && t.strm.avail_in === 0 && o === s ? 1 : 0, Eo(t, t.block_start, o, r), t.block_start += o, nt(t.strm)), r ? $t : K);
}, eo = (t, n) => {
  let e, o;
  for (; ; ) {
    if (t.lookahead < dt) {
      if (dn(t), t.lookahead < dt && n === Bt)
        return K;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= L && (t.ins_h = Tt(t, t.ins_h, t.window[t.strstart + L - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), e !== 0 && t.strstart - e <= t.w_size - dt && (t.match_length = ka(t, e)), t.match_length >= L)
      if (o = Et(t, t.strstart - t.match_start, t.match_length - L), t.lookahead -= t.match_length, t.match_length <= t.max_lazy_match && t.lookahead >= L) {
        t.match_length--;
        do
          t.strstart++, t.ins_h = Tt(t, t.ins_h, t.window[t.strstart + L - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart;
        while (--t.match_length !== 0);
        t.strstart++;
      } else
        t.strstart += t.match_length, t.match_length = 0, t.ins_h = t.window[t.strstart], t.ins_h = Tt(t, t.ins_h, t.window[t.strstart + 1]);
    else
      o = Et(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++;
    if (o && (et(t, !1), t.strm.avail_out === 0))
      return K;
  }
  return t.insert = t.strstart < L - 1 ? t.strstart : L - 1, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : mn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : gn;
}, qt = (t, n) => {
  let e, o, s;
  for (; ; ) {
    if (t.lookahead < dt) {
      if (dn(t), t.lookahead < dt && n === Bt)
        return K;
      if (t.lookahead === 0)
        break;
    }
    if (e = 0, t.lookahead >= L && (t.ins_h = Tt(t, t.ins_h, t.window[t.strstart + L - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart), t.prev_length = t.match_length, t.prev_match = t.match_start, t.match_length = L - 1, e !== 0 && t.prev_length < t.max_lazy_match && t.strstart - e <= t.w_size - dt && (t.match_length = ka(t, e), t.match_length <= 5 && (t.strategy === vd || t.match_length === L && t.strstart - t.match_start > 4096) && (t.match_length = L - 1)), t.prev_length >= L && t.match_length <= t.prev_length) {
      s = t.strstart + t.lookahead - L, o = Et(t, t.strstart - 1 - t.prev_match, t.prev_length - L), t.lookahead -= t.prev_length - 1, t.prev_length -= 2;
      do
        ++t.strstart <= s && (t.ins_h = Tt(t, t.ins_h, t.window[t.strstart + L - 1]), e = t.prev[t.strstart & t.w_mask] = t.head[t.ins_h], t.head[t.ins_h] = t.strstart);
      while (--t.prev_length !== 0);
      if (t.match_available = 0, t.match_length = L - 1, t.strstart++, o && (et(t, !1), t.strm.avail_out === 0))
        return K;
    } else if (t.match_available) {
      if (o = Et(t, 0, t.window[t.strstart - 1]), o && et(t, !1), t.strstart++, t.lookahead--, t.strm.avail_out === 0)
        return K;
    } else
      t.match_available = 1, t.strstart++, t.lookahead--;
  }
  return t.match_available && (o = Et(t, 0, t.window[t.strstart - 1]), t.match_available = 0), t.insert = t.strstart < L - 1 ? t.strstart : L - 1, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : mn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : gn;
}, Nd = (t, n) => {
  let e, o, s, i;
  const r = t.window;
  for (; ; ) {
    if (t.lookahead <= Ot) {
      if (dn(t), t.lookahead <= Ot && n === Bt)
        return K;
      if (t.lookahead === 0)
        break;
    }
    if (t.match_length = 0, t.lookahead >= L && t.strstart > 0 && (s = t.strstart - 1, o = r[s], o === r[++s] && o === r[++s] && o === r[++s])) {
      i = t.strstart + Ot;
      do
        ;
      while (o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && o === r[++s] && s < i);
      t.match_length = Ot - (i - s), t.match_length > t.lookahead && (t.match_length = t.lookahead);
    }
    if (t.match_length >= L ? (e = Et(t, 1, t.match_length - L), t.lookahead -= t.match_length, t.strstart += t.match_length, t.match_length = 0) : (e = Et(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++), e && (et(t, !1), t.strm.avail_out === 0))
      return K;
  }
  return t.insert = 0, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : mn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : gn;
}, Gd = (t, n) => {
  let e;
  for (; ; ) {
    if (t.lookahead === 0 && (dn(t), t.lookahead === 0)) {
      if (n === Bt)
        return K;
      break;
    }
    if (t.match_length = 0, e = Et(t, 0, t.window[t.strstart]), t.lookahead--, t.strstart++, e && (et(t, !1), t.strm.avail_out === 0))
      return K;
  }
  return t.insert = 0, n === it ? (et(t, !0), t.strm.avail_out === 0 ? $t : mn) : t.sym_next && (et(t, !1), t.strm.avail_out === 0) ? K : gn;
};
function ct(t, n, e, o, s) {
  this.good_length = t, this.max_lazy = n, this.nice_length = e, this.max_chain = o, this.func = s;
}
const An = [
  /*      good lazy nice chain */
  new ct(0, 0, 0, 0, Aa),
  /* 0 store only */
  new ct(4, 4, 8, 4, eo),
  /* 1 max speed, no lazy matches */
  new ct(4, 5, 16, 8, eo),
  /* 2 */
  new ct(4, 6, 32, 32, eo),
  /* 3 */
  new ct(4, 4, 16, 16, qt),
  /* 4 lazy matches */
  new ct(8, 16, 32, 32, qt),
  /* 5 */
  new ct(8, 16, 128, 128, qt),
  /* 6 */
  new ct(8, 32, 128, 256, qt),
  /* 7 */
  new ct(32, 128, 258, 1024, qt),
  /* 8 */
  new ct(32, 258, 258, 4096, qt)
  /* 9 max compression */
], $d = (t) => {
  t.window_size = 2 * t.w_size, kt(t.head), t.max_lazy_match = An[t.level].max_lazy, t.good_match = An[t.level].good_length, t.nice_match = An[t.level].nice_length, t.max_chain_length = An[t.level].max_chain, t.strstart = 0, t.block_start = 0, t.lookahead = 0, t.insert = 0, t.match_length = t.prev_length = L - 1, t.match_available = 0, t.ins_h = 0;
};
function Hd() {
  this.strm = null, this.status = 0, this.pending_buf = null, this.pending_buf_size = 0, this.pending_out = 0, this.pending = 0, this.wrap = 0, this.gzhead = null, this.gzindex = 0, this.method = Re, this.last_flush = -1, this.w_size = 0, this.w_bits = 0, this.w_mask = 0, this.window = null, this.window_size = 0, this.prev = null, this.head = null, this.ins_h = 0, this.hash_size = 0, this.hash_bits = 0, this.hash_mask = 0, this.hash_shift = 0, this.block_start = 0, this.match_length = 0, this.prev_match = 0, this.match_available = 0, this.strstart = 0, this.match_start = 0, this.lookahead = 0, this.prev_length = 0, this.max_chain_length = 0, this.max_lazy_match = 0, this.level = 0, this.strategy = 0, this.good_match = 0, this.nice_match = 0, this.dyn_ltree = new Uint16Array(Ld * 2), this.dyn_dtree = new Uint16Array((2 * Rd + 1) * 2), this.bl_tree = new Uint16Array((2 * Md + 1) * 2), kt(this.dyn_ltree), kt(this.dyn_dtree), kt(this.bl_tree), this.l_desc = null, this.d_desc = null, this.bl_desc = null, this.bl_count = new Uint16Array(zd + 1), this.heap = new Uint16Array(2 * Bo + 1), kt(this.heap), this.heap_len = 0, this.heap_max = 0, this.depth = new Uint16Array(2 * Bo + 1), kt(this.depth), this.sym_buf = 0, this.lit_bufsize = 0, this.sym_next = 0, this.sym_end = 0, this.opt_len = 0, this.static_len = 0, this.matches = 0, this.insert = 0, this.bi_buf = 0, this.bi_valid = 0;
}
const Wn = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.status !== hn && //#ifdef GZIP
  n.status !== as && //#endif
  n.status !== To && n.status !== Ro && n.status !== Mo && n.status !== Lo && n.status !== Pt && n.status !== kn ? 1 : 0;
}, Ca = (t) => {
  if (Wn(t))
    return Ut(t, ht);
  t.total_in = t.total_out = 0, t.data_type = Od;
  const n = t.state;
  return n.pending = 0, n.pending_out = 0, n.wrap < 0 && (n.wrap = -n.wrap), n.status = //#ifdef GZIP
  n.wrap === 2 ? as : (
    //#endif
    n.wrap ? hn : Pt
  ), t.adler = n.wrap === 2 ? 0 : 1, n.last_flush = -2, md(n), W;
}, Oa = (t) => {
  const n = Ca(t);
  return n === W && $d(t.state), n;
}, Zd = (t, n) => Wn(t) || t.state.wrap !== 2 ? ht : (t.state.gzhead = n, W), Ia = (t, n, e, o, s, i) => {
  if (!t)
    return ht;
  let r = 1;
  if (n === bd && (n = 6), o < 0 ? (r = 0, o = -o) : o > 15 && (r = 2, o -= 16), s < 1 || s > Id || e !== Re || o < 8 || o > 15 || n < 0 || n > 9 || i < 0 || i > Ad || o === 8 && r !== 1)
    return Ut(t, ht);
  o === 8 && (o = 9);
  const a = new Hd();
  return t.state = a, a.strm = t, a.status = hn, a.wrap = r, a.gzhead = null, a.w_bits = o, a.w_size = 1 << a.w_bits, a.w_mask = a.w_size - 1, a.hash_bits = s + 7, a.hash_size = 1 << a.hash_bits, a.hash_mask = a.hash_size - 1, a.hash_shift = ~~((a.hash_bits + L - 1) / L), a.window = new Uint8Array(a.w_size * 2), a.head = new Uint16Array(a.hash_size), a.prev = new Uint16Array(a.w_size), a.lit_bufsize = 1 << s + 6, a.pending_buf_size = a.lit_bufsize * 4, a.pending_buf = new Uint8Array(a.pending_buf_size), a.sym_buf = a.lit_bufsize, a.sym_end = (a.lit_bufsize - 1) * 3, a.level = n, a.strategy = i, a.method = e, Oa(t);
}, jd = (t, n) => Ia(t, n, Re, Dd, Ed, Cd), Wd = (t, n) => {
  if (Wn(t) || n > ii || n < 0)
    return t ? Ut(t, ht) : ht;
  const e = t.state;
  if (!t.output || t.avail_in !== 0 && !t.input || e.status === kn && n !== it)
    return Ut(t, t.avail_out === 0 ? no : ht);
  const o = e.last_flush;
  if (e.last_flush = n, e.pending !== 0) {
    if (nt(t), t.avail_out === 0)
      return e.last_flush = -1, W;
  } else if (t.avail_in === 0 && ai(n) <= ai(o) && n !== it)
    return Ut(t, no);
  if (e.status === kn && t.avail_in !== 0)
    return Ut(t, no);
  if (e.status === hn && e.wrap === 0 && (e.status = Pt), e.status === hn) {
    let s = Re + (e.w_bits - 8 << 4) << 8, i = -1;
    if (e.strategy >= ne || e.level < 2 ? i = 0 : e.level < 6 ? i = 1 : e.level === 6 ? i = 2 : i = 3, s |= i << 6, e.strstart !== 0 && (s |= Vd), s += 31 - s % 31, Sn(e, s), e.strstart !== 0 && (Sn(e, t.adler >>> 16), Sn(e, t.adler & 65535)), t.adler = 1, e.status = Pt, nt(t), e.pending !== 0)
      return e.last_flush = -1, W;
  }
  if (e.status === as) {
    if (t.adler = 0, z(e, 31), z(e, 139), z(e, 8), e.gzhead)
      z(
        e,
        (e.gzhead.text ? 1 : 0) + (e.gzhead.hcrc ? 2 : 0) + (e.gzhead.extra ? 4 : 0) + (e.gzhead.name ? 8 : 0) + (e.gzhead.comment ? 16 : 0)
      ), z(e, e.gzhead.time & 255), z(e, e.gzhead.time >> 8 & 255), z(e, e.gzhead.time >> 16 & 255), z(e, e.gzhead.time >> 24 & 255), z(e, e.level === 9 ? 2 : e.strategy >= ne || e.level < 2 ? 4 : 0), z(e, e.gzhead.os & 255), e.gzhead.extra && e.gzhead.extra.length && (z(e, e.gzhead.extra.length & 255), z(e, e.gzhead.extra.length >> 8 & 255)), e.gzhead.hcrc && (t.adler = Z(t.adler, e.pending_buf, e.pending, 0)), e.gzindex = 0, e.status = To;
    else if (z(e, 0), z(e, 0), z(e, 0), z(e, 0), z(e, 0), z(e, e.level === 9 ? 2 : e.strategy >= ne || e.level < 2 ? 4 : 0), z(e, Fd), e.status = Pt, nt(t), e.pending !== 0)
      return e.last_flush = -1, W;
  }
  if (e.status === To) {
    if (e.gzhead.extra) {
      let s = e.pending, i = (e.gzhead.extra.length & 65535) - e.gzindex;
      for (; e.pending + i > e.pending_buf_size; ) {
        let a = e.pending_buf_size - e.pending;
        if (e.pending_buf.set(e.gzhead.extra.subarray(e.gzindex, e.gzindex + a), e.pending), e.pending = e.pending_buf_size, e.gzhead.hcrc && e.pending > s && (t.adler = Z(t.adler, e.pending_buf, e.pending - s, s)), e.gzindex += a, nt(t), e.pending !== 0)
          return e.last_flush = -1, W;
        s = 0, i -= a;
      }
      let r = new Uint8Array(e.gzhead.extra);
      e.pending_buf.set(r.subarray(e.gzindex, e.gzindex + i), e.pending), e.pending += i, e.gzhead.hcrc && e.pending > s && (t.adler = Z(t.adler, e.pending_buf, e.pending - s, s)), e.gzindex = 0;
    }
    e.status = Ro;
  }
  if (e.status === Ro) {
    if (e.gzhead.name) {
      let s = e.pending, i;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > s && (t.adler = Z(t.adler, e.pending_buf, e.pending - s, s)), nt(t), e.pending !== 0)
            return e.last_flush = -1, W;
          s = 0;
        }
        e.gzindex < e.gzhead.name.length ? i = e.gzhead.name.charCodeAt(e.gzindex++) & 255 : i = 0, z(e, i);
      } while (i !== 0);
      e.gzhead.hcrc && e.pending > s && (t.adler = Z(t.adler, e.pending_buf, e.pending - s, s)), e.gzindex = 0;
    }
    e.status = Mo;
  }
  if (e.status === Mo) {
    if (e.gzhead.comment) {
      let s = e.pending, i;
      do {
        if (e.pending === e.pending_buf_size) {
          if (e.gzhead.hcrc && e.pending > s && (t.adler = Z(t.adler, e.pending_buf, e.pending - s, s)), nt(t), e.pending !== 0)
            return e.last_flush = -1, W;
          s = 0;
        }
        e.gzindex < e.gzhead.comment.length ? i = e.gzhead.comment.charCodeAt(e.gzindex++) & 255 : i = 0, z(e, i);
      } while (i !== 0);
      e.gzhead.hcrc && e.pending > s && (t.adler = Z(t.adler, e.pending_buf, e.pending - s, s));
    }
    e.status = Lo;
  }
  if (e.status === Lo) {
    if (e.gzhead.hcrc) {
      if (e.pending + 2 > e.pending_buf_size && (nt(t), e.pending !== 0))
        return e.last_flush = -1, W;
      z(e, t.adler & 255), z(e, t.adler >> 8 & 255), t.adler = 0;
    }
    if (e.status = Pt, nt(t), e.pending !== 0)
      return e.last_flush = -1, W;
  }
  if (t.avail_in !== 0 || e.lookahead !== 0 || n !== Bt && e.status !== kn) {
    let s = e.level === 0 ? Aa(e, n) : e.strategy === ne ? Gd(e, n) : e.strategy === kd ? Nd(e, n) : An[e.level].func(e, n);
    if ((s === $t || s === mn) && (e.status = kn), s === K || s === $t)
      return t.avail_out === 0 && (e.last_flush = -1), W;
    if (s === gn && (n === wd ? xd(e) : n !== ii && (Eo(e, 0, 0, !1), n === Sd && (kt(e.head), e.lookahead === 0 && (e.strstart = 0, e.block_start = 0, e.insert = 0))), nt(t), t.avail_out === 0))
      return e.last_flush = -1, W;
  }
  return n !== it ? W : e.wrap <= 0 ? ri : (e.wrap === 2 ? (z(e, t.adler & 255), z(e, t.adler >> 8 & 255), z(e, t.adler >> 16 & 255), z(e, t.adler >> 24 & 255), z(e, t.total_in & 255), z(e, t.total_in >> 8 & 255), z(e, t.total_in >> 16 & 255), z(e, t.total_in >> 24 & 255)) : (Sn(e, t.adler >>> 16), Sn(e, t.adler & 65535)), nt(t), e.wrap > 0 && (e.wrap = -e.wrap), e.pending !== 0 ? W : ri);
}, Yd = (t) => {
  if (Wn(t))
    return ht;
  const n = t.state.status;
  return t.state = null, n === Pt ? Ut(t, _d) : W;
}, qd = (t, n) => {
  let e = n.length;
  if (Wn(t))
    return ht;
  const o = t.state, s = o.wrap;
  if (s === 2 || s === 1 && o.status !== hn || o.lookahead)
    return ht;
  if (s === 1 && (t.adler = Fn(t.adler, n, e, 0)), o.wrap = 0, e >= o.w_size) {
    s === 0 && (kt(o.head), o.strstart = 0, o.block_start = 0, o.insert = 0);
    let c = new Uint8Array(o.w_size);
    c.set(n.subarray(e - o.w_size, e), 0), n = c, e = o.w_size;
  }
  const i = t.avail_in, r = t.next_in, a = t.input;
  for (t.avail_in = e, t.next_in = 0, t.input = n, dn(o); o.lookahead >= L; ) {
    let c = o.strstart, f = o.lookahead - (L - 1);
    do
      o.ins_h = Tt(o, o.ins_h, o.window[c + L - 1]), o.prev[c & o.w_mask] = o.head[o.ins_h], o.head[o.ins_h] = c, c++;
    while (--f);
    o.strstart = c, o.lookahead = L - 1, dn(o);
  }
  return o.strstart += o.lookahead, o.block_start = o.strstart, o.insert = o.lookahead, o.lookahead = 0, o.match_length = o.prev_length = L - 1, o.match_available = 0, t.next_in = r, t.input = a, t.avail_in = i, o.wrap = s, W;
};
var Xd = jd, Kd = Ia, Jd = Oa, Qd = Ca, tp = Zd, np = Wd, ep = Yd, op = qd, sp = "pako deflate (from Nodeca project)", Dn = {
  deflateInit: Xd,
  deflateInit2: Kd,
  deflateReset: Jd,
  deflateResetKeep: Qd,
  deflateSetHeader: tp,
  deflate: np,
  deflateEnd: ep,
  deflateSetDictionary: op,
  deflateInfo: sp
};
const ip = (t, n) => Object.prototype.hasOwnProperty.call(t, n);
var rp = function(t) {
  const n = Array.prototype.slice.call(arguments, 1);
  for (; n.length; ) {
    const e = n.shift();
    if (e) {
      if (typeof e != "object")
        throw new TypeError(e + "must be non-object");
      for (const o in e)
        ip(e, o) && (t[o] = e[o]);
    }
  }
  return t;
}, ap = (t) => {
  let n = 0;
  for (let o = 0, s = t.length; o < s; o++)
    n += t[o].length;
  const e = new Uint8Array(n);
  for (let o = 0, s = 0, i = t.length; o < i; o++) {
    let r = t[o];
    e.set(r, s), s += r.length;
  }
  return e;
}, Me = {
  assign: rp,
  flattenChunks: ap
};
let Da = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Da = !1;
}
const Pn = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  Pn[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
Pn[254] = Pn[254] = 1;
var cp = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let n, e, o, s, i, r = t.length, a = 0;
  for (s = 0; s < r; s++)
    e = t.charCodeAt(s), (e & 64512) === 55296 && s + 1 < r && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (o - 56320), s++)), a += e < 128 ? 1 : e < 2048 ? 2 : e < 65536 ? 3 : 4;
  for (n = new Uint8Array(a), i = 0, s = 0; i < a; s++)
    e = t.charCodeAt(s), (e & 64512) === 55296 && s + 1 < r && (o = t.charCodeAt(s + 1), (o & 64512) === 56320 && (e = 65536 + (e - 55296 << 10) + (o - 56320), s++)), e < 128 ? n[i++] = e : e < 2048 ? (n[i++] = 192 | e >>> 6, n[i++] = 128 | e & 63) : e < 65536 ? (n[i++] = 224 | e >>> 12, n[i++] = 128 | e >>> 6 & 63, n[i++] = 128 | e & 63) : (n[i++] = 240 | e >>> 18, n[i++] = 128 | e >>> 12 & 63, n[i++] = 128 | e >>> 6 & 63, n[i++] = 128 | e & 63);
  return n;
};
const fp = (t, n) => {
  if (n < 65534 && t.subarray && Da)
    return String.fromCharCode.apply(null, t.length === n ? t : t.subarray(0, n));
  let e = "";
  for (let o = 0; o < n; o++)
    e += String.fromCharCode(t[o]);
  return e;
};
var up = (t, n) => {
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
  return fp(i, s);
}, lp = (t, n) => {
  n = n || t.length, n > t.length && (n = t.length);
  let e = n - 1;
  for (; e >= 0 && (t[e] & 192) === 128; )
    e--;
  return e < 0 || e === 0 ? n : e + Pn[t[e]] > n ? e : n;
}, Un = {
  string2buf: cp,
  buf2string: up,
  utf8border: lp
};
function hp() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var Ea = hp;
const Ba = Object.prototype.toString, {
  Z_NO_FLUSH: dp,
  Z_SYNC_FLUSH: pp,
  Z_FULL_FLUSH: gp,
  Z_FINISH: mp,
  Z_OK: Se,
  Z_STREAM_END: yp,
  Z_DEFAULT_COMPRESSION: xp,
  Z_DEFAULT_STRATEGY: wp,
  Z_DEFLATED: Sp
} = Te;
function Le(t) {
  this.options = Me.assign({
    level: xp,
    method: Sp,
    chunkSize: 16384,
    windowBits: 15,
    memLevel: 8,
    strategy: wp
  }, t || {});
  let n = this.options;
  n.raw && n.windowBits > 0 ? n.windowBits = -n.windowBits : n.gzip && n.windowBits > 0 && n.windowBits < 16 && (n.windowBits += 16), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ea(), this.strm.avail_out = 0;
  let e = Dn.deflateInit2(
    this.strm,
    n.level,
    n.method,
    n.windowBits,
    n.memLevel,
    n.strategy
  );
  if (e !== Se)
    throw new Error(Gt[e]);
  if (n.header && Dn.deflateSetHeader(this.strm, n.header), n.dictionary) {
    let o;
    if (typeof n.dictionary == "string" ? o = Un.string2buf(n.dictionary) : Ba.call(n.dictionary) === "[object ArrayBuffer]" ? o = new Uint8Array(n.dictionary) : o = n.dictionary, e = Dn.deflateSetDictionary(this.strm, o), e !== Se)
      throw new Error(Gt[e]);
    this._dict_set = !0;
  }
}
Le.prototype.push = function(t, n) {
  const e = this.strm, o = this.options.chunkSize;
  let s, i;
  if (this.ended)
    return !1;
  for (n === ~~n ? i = n : i = n === !0 ? mp : dp, typeof t == "string" ? e.input = Un.string2buf(t) : Ba.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    if (e.avail_out === 0 && (e.output = new Uint8Array(o), e.next_out = 0, e.avail_out = o), (i === pp || i === gp) && e.avail_out <= 6) {
      this.onData(e.output.subarray(0, e.next_out)), e.avail_out = 0;
      continue;
    }
    if (s = Dn.deflate(e, i), s === yp)
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
Le.prototype.onData = function(t) {
  this.chunks.push(t);
};
Le.prototype.onEnd = function(t) {
  t === Se && (this.result = Me.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function _p(t, n) {
  const e = new Le(n);
  if (e.push(t, !0), e.err)
    throw e.msg || Gt[e.err];
  return e.result;
}
var bp = _p, vp = {
  deflate: bp
};
const ee = 16209, kp = 16191;
var Ap = function(n, e) {
  let o, s, i, r, a, c, f, u, l, d, p, h, g, x, m, y, _, w, S, k, b, D, C, A;
  const I = n.state;
  o = n.next_in, C = n.input, s = o + (n.avail_in - 5), i = n.next_out, A = n.output, r = i - (e - n.avail_out), a = i + (n.avail_out - 257), c = I.dmax, f = I.wsize, u = I.whave, l = I.wnext, d = I.window, p = I.hold, h = I.bits, g = I.lencode, x = I.distcode, m = (1 << I.lenbits) - 1, y = (1 << I.distbits) - 1;
  t:
    do {
      h < 15 && (p += C[o++] << h, h += 8, p += C[o++] << h, h += 8), _ = g[p & m];
      n:
        for (; ; ) {
          if (w = _ >>> 24, p >>>= w, h -= w, w = _ >>> 16 & 255, w === 0)
            A[i++] = _ & 65535;
          else if (w & 16) {
            S = _ & 65535, w &= 15, w && (h < w && (p += C[o++] << h, h += 8), S += p & (1 << w) - 1, p >>>= w, h -= w), h < 15 && (p += C[o++] << h, h += 8, p += C[o++] << h, h += 8), _ = x[p & y];
            e:
              for (; ; ) {
                if (w = _ >>> 24, p >>>= w, h -= w, w = _ >>> 16 & 255, w & 16) {
                  if (k = _ & 65535, w &= 15, h < w && (p += C[o++] << h, h += 8, h < w && (p += C[o++] << h, h += 8)), k += p & (1 << w) - 1, k > c) {
                    n.msg = "invalid distance too far back", I.mode = ee;
                    break t;
                  }
                  if (p >>>= w, h -= w, w = i - r, k > w) {
                    if (w = k - w, w > u && I.sane) {
                      n.msg = "invalid distance too far back", I.mode = ee;
                      break t;
                    }
                    if (b = 0, D = d, l === 0) {
                      if (b += f - w, w < S) {
                        S -= w;
                        do
                          A[i++] = d[b++];
                        while (--w);
                        b = i - k, D = A;
                      }
                    } else if (l < w) {
                      if (b += f + l - w, w -= l, w < S) {
                        S -= w;
                        do
                          A[i++] = d[b++];
                        while (--w);
                        if (b = 0, l < S) {
                          w = l, S -= w;
                          do
                            A[i++] = d[b++];
                          while (--w);
                          b = i - k, D = A;
                        }
                      }
                    } else if (b += l - w, w < S) {
                      S -= w;
                      do
                        A[i++] = d[b++];
                      while (--w);
                      b = i - k, D = A;
                    }
                    for (; S > 2; )
                      A[i++] = D[b++], A[i++] = D[b++], A[i++] = D[b++], S -= 3;
                    S && (A[i++] = D[b++], S > 1 && (A[i++] = D[b++]));
                  } else {
                    b = i - k;
                    do
                      A[i++] = A[b++], A[i++] = A[b++], A[i++] = A[b++], S -= 3;
                    while (S > 2);
                    S && (A[i++] = A[b++], S > 1 && (A[i++] = A[b++]));
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
            _ = g[(_ & 65535) + (p & (1 << w) - 1)];
            continue n;
          } else if (w & 32) {
            I.mode = kp;
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
const Xt = 15, ci = 852, fi = 592, ui = 0, oo = 1, li = 2, Cp = new Uint16Array([
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
]), Op = new Uint8Array([
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
]), Ip = new Uint16Array([
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
]), Dp = new Uint8Array([
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
]), Ep = (t, n, e, o, s, i, r, a) => {
  const c = a.bits;
  let f = 0, u = 0, l = 0, d = 0, p = 0, h = 0, g = 0, x = 0, m = 0, y = 0, _, w, S, k, b, D = null, C;
  const A = new Uint16Array(Xt + 1), I = new Uint16Array(Xt + 1);
  let O = null, E, B, R;
  for (f = 0; f <= Xt; f++)
    A[f] = 0;
  for (u = 0; u < o; u++)
    A[n[e + u]]++;
  for (p = c, d = Xt; d >= 1 && A[d] === 0; d--)
    ;
  if (p > d && (p = d), d === 0)
    return s[i++] = 1 << 24 | 64 << 16 | 0, s[i++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (l = 1; l < d && A[l] === 0; l++)
    ;
  for (p < l && (p = l), x = 1, f = 1; f <= Xt; f++)
    if (x <<= 1, x -= A[f], x < 0)
      return -1;
  if (x > 0 && (t === ui || d !== 1))
    return -1;
  for (I[1] = 0, f = 1; f < Xt; f++)
    I[f + 1] = I[f] + A[f];
  for (u = 0; u < o; u++)
    n[e + u] !== 0 && (r[I[n[e + u]]++] = u);
  if (t === ui ? (D = O = r, C = 20) : t === oo ? (D = Cp, O = Op, C = 257) : (D = Ip, O = Dp, C = 0), y = 0, u = 0, f = l, b = i, h = p, g = 0, S = -1, m = 1 << p, k = m - 1, t === oo && m > ci || t === li && m > fi)
    return 1;
  for (; ; ) {
    E = f - g, r[u] + 1 < C ? (B = 0, R = r[u]) : r[u] >= C ? (B = O[r[u] - C], R = D[r[u] - C]) : (B = 96, R = 0), _ = 1 << f - g, w = 1 << h, l = w;
    do
      w -= _, s[b + (y >> g) + w] = E << 24 | B << 16 | R | 0;
    while (w !== 0);
    for (_ = 1 << f - 1; y & _; )
      _ >>= 1;
    if (_ !== 0 ? (y &= _ - 1, y += _) : y = 0, u++, --A[f] === 0) {
      if (f === d)
        break;
      f = n[e + r[u]];
    }
    if (f > p && (y & k) !== S) {
      for (g === 0 && (g = p), b += l, h = f - g, x = 1 << h; h + g < d && (x -= A[h + g], !(x <= 0)); )
        h++, x <<= 1;
      if (m += 1 << h, t === oo && m > ci || t === li && m > fi)
        return 1;
      S = y & k, s[S] = p << 24 | h << 16 | b - i | 0;
    }
  }
  return y !== 0 && (s[b + y] = f - g << 24 | 64 << 16 | 0), a.bits = p, 0;
};
var En = Ep;
const Bp = 0, Ta = 1, Ra = 2, {
  Z_FINISH: hi,
  Z_BLOCK: Tp,
  Z_TREES: oe,
  Z_OK: Ht,
  Z_STREAM_END: Rp,
  Z_NEED_DICT: Mp,
  Z_STREAM_ERROR: rt,
  Z_DATA_ERROR: Ma,
  Z_MEM_ERROR: La,
  Z_BUF_ERROR: Lp,
  Z_DEFLATED: di
} = Te, ze = 16180, pi = 16181, gi = 16182, mi = 16183, yi = 16184, xi = 16185, wi = 16186, Si = 16187, _i = 16188, bi = 16189, _e = 16190, xt = 16191, so = 16192, vi = 16193, io = 16194, ki = 16195, Ai = 16196, Ci = 16197, Oi = 16198, se = 16199, ie = 16200, Ii = 16201, Di = 16202, Ei = 16203, Bi = 16204, Ti = 16205, ro = 16206, Ri = 16207, Mi = 16208, G = 16209, za = 16210, Va = 16211, zp = 852, Vp = 592, Fp = 15, Pp = Fp, Li = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function Up() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const Zt = (t) => {
  if (!t)
    return 1;
  const n = t.state;
  return !n || n.strm !== t || n.mode < ze || n.mode > Va ? 1 : 0;
}, Fa = (t) => {
  if (Zt(t))
    return rt;
  const n = t.state;
  return t.total_in = t.total_out = n.total = 0, t.msg = "", n.wrap && (t.adler = n.wrap & 1), n.mode = ze, n.last = 0, n.havedict = 0, n.flags = -1, n.dmax = 32768, n.head = null, n.hold = 0, n.bits = 0, n.lencode = n.lendyn = new Int32Array(zp), n.distcode = n.distdyn = new Int32Array(Vp), n.sane = 1, n.back = -1, Ht;
}, Pa = (t) => {
  if (Zt(t))
    return rt;
  const n = t.state;
  return n.wsize = 0, n.whave = 0, n.wnext = 0, Fa(t);
}, Ua = (t, n) => {
  let e;
  if (Zt(t))
    return rt;
  const o = t.state;
  return n < 0 ? (e = 0, n = -n) : (e = (n >> 4) + 5, n < 48 && (n &= 15)), n && (n < 8 || n > 15) ? rt : (o.window !== null && o.wbits !== n && (o.window = null), o.wrap = e, o.wbits = n, Pa(t));
}, Na = (t, n) => {
  if (!t)
    return rt;
  const e = new Up();
  t.state = e, e.strm = t, e.window = null, e.mode = ze;
  const o = Ua(t, n);
  return o !== Ht && (t.state = null), o;
}, Np = (t) => Na(t, Pp);
let zi = !0, ao, co;
const Gp = (t) => {
  if (zi) {
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
    for (En(Ta, t.lens, 0, 288, ao, 0, t.work, { bits: 9 }), n = 0; n < 32; )
      t.lens[n++] = 5;
    En(Ra, t.lens, 0, 32, co, 0, t.work, { bits: 5 }), zi = !1;
  }
  t.lencode = ao, t.lenbits = 9, t.distcode = co, t.distbits = 5;
}, Ga = (t, n, e, o) => {
  let s;
  const i = t.state;
  return i.window === null && (i.wsize = 1 << i.wbits, i.wnext = 0, i.whave = 0, i.window = new Uint8Array(i.wsize)), o >= i.wsize ? (i.window.set(n.subarray(e - i.wsize, e), 0), i.wnext = 0, i.whave = i.wsize) : (s = i.wsize - i.wnext, s > o && (s = o), i.window.set(n.subarray(e - o, e - o + s), i.wnext), o -= s, o ? (i.window.set(n.subarray(e - o, e), 0), i.wnext = o, i.whave = i.wsize) : (i.wnext += s, i.wnext === i.wsize && (i.wnext = 0), i.whave < i.wsize && (i.whave += s))), 0;
}, $p = (t, n) => {
  let e, o, s, i, r, a, c, f, u, l, d, p, h, g, x = 0, m, y, _, w, S, k, b, D;
  const C = new Uint8Array(4);
  let A, I;
  const O = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (Zt(t) || !t.output || !t.input && t.avail_in !== 0)
    return rt;
  e = t.state, e.mode === xt && (e.mode = so), r = t.next_out, s = t.output, c = t.avail_out, i = t.next_in, o = t.input, a = t.avail_in, f = e.hold, u = e.bits, l = a, d = c, D = Ht;
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
            e.wbits === 0 && (e.wbits = 15), e.check = 0, C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = Z(e.check, C, 2, 0), f = 0, u = 0, e.mode = pi;
            break;
          }
          if (e.head && (e.head.done = !1), !(e.wrap & 1) || /* check if zlib header allowed */
          (((f & 255) << 8) + (f >> 8)) % 31) {
            t.msg = "incorrect header check", e.mode = G;
            break;
          }
          if ((f & 15) !== di) {
            t.msg = "unknown compression method", e.mode = G;
            break;
          }
          if (f >>>= 4, u -= 4, b = (f & 15) + 8, e.wbits === 0 && (e.wbits = b), b > 15 || b > e.wbits) {
            t.msg = "invalid window size", e.mode = G;
            break;
          }
          e.dmax = 1 << e.wbits, e.flags = 0, t.adler = e.check = 1, e.mode = f & 512 ? bi : xt, f = 0, u = 0;
          break;
        case pi:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if (e.flags = f, (e.flags & 255) !== di) {
            t.msg = "unknown compression method", e.mode = G;
            break;
          }
          if (e.flags & 57344) {
            t.msg = "unknown header flags set", e.mode = G;
            break;
          }
          e.head && (e.head.text = f >> 8 & 1), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = Z(e.check, C, 2, 0)), f = 0, u = 0, e.mode = gi;
        /* falls through */
        case gi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          e.head && (e.head.time = f), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, C[2] = f >>> 16 & 255, C[3] = f >>> 24 & 255, e.check = Z(e.check, C, 4, 0)), f = 0, u = 0, e.mode = mi;
        /* falls through */
        case mi:
          for (; u < 16; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          e.head && (e.head.xflags = f & 255, e.head.os = f >> 8), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = Z(e.check, C, 2, 0)), f = 0, u = 0, e.mode = yi;
        /* falls through */
        case yi:
          if (e.flags & 1024) {
            for (; u < 16; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            e.length = f, e.head && (e.head.extra_len = f), e.flags & 512 && e.wrap & 4 && (C[0] = f & 255, C[1] = f >>> 8 & 255, e.check = Z(e.check, C, 2, 0)), f = 0, u = 0;
          } else e.head && (e.head.extra = null);
          e.mode = xi;
        /* falls through */
        case xi:
          if (e.flags & 1024 && (p = e.length, p > a && (p = a), p && (e.head && (b = e.head.extra_len - e.length, e.head.extra || (e.head.extra = new Uint8Array(e.head.extra_len)), e.head.extra.set(
            o.subarray(
              i,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              i + p
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            b
          )), e.flags & 512 && e.wrap & 4 && (e.check = Z(e.check, o, p, i)), a -= p, i += p, e.length -= p), e.length))
            break t;
          e.length = 0, e.mode = wi;
        /* falls through */
        case wi:
          if (e.flags & 2048) {
            if (a === 0)
              break t;
            p = 0;
            do
              b = o[i + p++], e.head && b && e.length < 65536 && (e.head.name += String.fromCharCode(b));
            while (b && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = Z(e.check, o, p, i)), a -= p, i += p, b)
              break t;
          } else e.head && (e.head.name = null);
          e.length = 0, e.mode = Si;
        /* falls through */
        case Si:
          if (e.flags & 4096) {
            if (a === 0)
              break t;
            p = 0;
            do
              b = o[i + p++], e.head && b && e.length < 65536 && (e.head.comment += String.fromCharCode(b));
            while (b && p < a);
            if (e.flags & 512 && e.wrap & 4 && (e.check = Z(e.check, o, p, i)), a -= p, i += p, b)
              break t;
          } else e.head && (e.head.comment = null);
          e.mode = _i;
        /* falls through */
        case _i:
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
          e.head && (e.head.hcrc = e.flags >> 9 & 1, e.head.done = !0), t.adler = e.check = 0, e.mode = xt;
          break;
        case bi:
          for (; u < 32; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          t.adler = e.check = Li(f), f = 0, u = 0, e.mode = _e;
        /* falls through */
        case _e:
          if (e.havedict === 0)
            return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, Mp;
          t.adler = e.check = 1, e.mode = xt;
        /* falls through */
        case xt:
          if (n === Tp || n === oe)
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
              e.mode = vi;
              break;
            case 1:
              if (Gp(e), e.mode = se, n === oe) {
                f >>>= 2, u -= 2;
                break t;
              }
              break;
            case 2:
              e.mode = Ai;
              break;
            case 3:
              t.msg = "invalid block type", e.mode = G;
          }
          f >>>= 2, u -= 2;
          break;
        case vi:
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
          e.mode = ki;
        /* falls through */
        case ki:
          if (p = e.length, p) {
            if (p > a && (p = a), p > c && (p = c), p === 0)
              break t;
            s.set(o.subarray(i, i + p), r), a -= p, i += p, c -= p, r += p, e.length -= p;
            break;
          }
          e.mode = xt;
          break;
        case Ai:
          for (; u < 14; ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if (e.nlen = (f & 31) + 257, f >>>= 5, u -= 5, e.ndist = (f & 31) + 1, f >>>= 5, u -= 5, e.ncode = (f & 15) + 4, f >>>= 4, u -= 4, e.nlen > 286 || e.ndist > 30) {
            t.msg = "too many length or distance symbols", e.mode = G;
            break;
          }
          e.have = 0, e.mode = Ci;
        /* falls through */
        case Ci:
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
          if (e.lencode = e.lendyn, e.lenbits = 7, A = { bits: e.lenbits }, D = En(Bp, e.lens, 0, 19, e.lencode, 0, e.work, A), e.lenbits = A.bits, D) {
            t.msg = "invalid code lengths set", e.mode = G;
            break;
          }
          e.have = 0, e.mode = Oi;
        /* falls through */
        case Oi:
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
          if (e.lenbits = 9, A = { bits: e.lenbits }, D = En(Ta, e.lens, 0, e.nlen, e.lencode, 0, e.work, A), e.lenbits = A.bits, D) {
            t.msg = "invalid literal/lengths set", e.mode = G;
            break;
          }
          if (e.distbits = 6, e.distcode = e.distdyn, A = { bits: e.distbits }, D = En(Ra, e.lens, e.nlen, e.ndist, e.distcode, 0, e.work, A), e.distbits = A.bits, D) {
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
            t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, Ap(t, d), r = t.next_out, s = t.output, c = t.avail_out, i = t.next_in, o = t.input, a = t.avail_in, f = e.hold, u = e.bits, e.mode === xt && (e.back = -1);
            break;
          }
          for (e.back = 0; x = e.lencode[f & (1 << e.lenbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if (y && (y & 240) === 0) {
            for (w = m, S = y, k = _; x = e.lencode[k + ((f & (1 << w + S) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            f >>>= w, u -= w, e.back += w;
          }
          if (f >>>= m, u -= m, e.back += m, e.length = _, y === 0) {
            e.mode = Ti;
            break;
          }
          if (y & 32) {
            e.back = -1, e.mode = xt;
            break;
          }
          if (y & 64) {
            t.msg = "invalid literal/length code", e.mode = G;
            break;
          }
          e.extra = y & 15, e.mode = Ii;
        /* falls through */
        case Ii:
          if (e.extra) {
            for (I = e.extra; u < I; ) {
              if (a === 0)
                break t;
              a--, f += o[i++] << u, u += 8;
            }
            e.length += f & (1 << e.extra) - 1, f >>>= e.extra, u -= e.extra, e.back += e.extra;
          }
          e.was = e.length, e.mode = Di;
        /* falls through */
        case Di:
          for (; x = e.distcode[f & (1 << e.distbits) - 1], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(m <= u); ) {
            if (a === 0)
              break t;
            a--, f += o[i++] << u, u += 8;
          }
          if ((y & 240) === 0) {
            for (w = m, S = y, k = _; x = e.distcode[k + ((f & (1 << w + S) - 1) >> w)], m = x >>> 24, y = x >>> 16 & 255, _ = x & 65535, !(w + m <= u); ) {
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
          e.offset = _, e.extra = y & 15, e.mode = Ei;
        /* falls through */
        case Ei:
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
          e.mode = Bi;
        /* falls through */
        case Bi:
          if (c === 0)
            break t;
          if (p = d - c, e.offset > p) {
            if (p = e.offset - p, p > e.whave && e.sane) {
              t.msg = "invalid distance too far back", e.mode = G;
              break;
            }
            p > e.wnext ? (p -= e.wnext, h = e.wsize - p) : h = e.wnext - p, p > e.length && (p = e.length), g = e.window;
          } else
            g = s, h = r - e.offset, p = e.length;
          p > c && (p = c), c -= p, e.length -= p;
          do
            s[r++] = g[h++];
          while (--p);
          e.length === 0 && (e.mode = ie);
          break;
        case Ti:
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
            if (d -= c, t.total_out += d, e.total += d, e.wrap & 4 && d && (t.adler = e.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            e.flags ? Z(e.check, s, d, r - d) : Fn(e.check, s, d, r - d)), d = c, e.wrap & 4 && (e.flags ? f : Li(f)) !== e.check) {
              t.msg = "incorrect data check", e.mode = G;
              break;
            }
            f = 0, u = 0;
          }
          e.mode = Ri;
        /* falls through */
        case Ri:
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
          e.mode = Mi;
        /* falls through */
        case Mi:
          D = Rp;
          break t;
        case G:
          D = Ma;
          break t;
        case za:
          return La;
        case Va:
        /* falls through */
        default:
          return rt;
      }
  return t.next_out = r, t.avail_out = c, t.next_in = i, t.avail_in = a, e.hold = f, e.bits = u, (e.wsize || d !== t.avail_out && e.mode < G && (e.mode < ro || n !== hi)) && Ga(t, t.output, t.next_out, d - t.avail_out), l -= t.avail_in, d -= t.avail_out, t.total_in += l, t.total_out += d, e.total += d, e.wrap & 4 && d && (t.adler = e.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  e.flags ? Z(e.check, s, d, t.next_out - d) : Fn(e.check, s, d, t.next_out - d)), t.data_type = e.bits + (e.last ? 64 : 0) + (e.mode === xt ? 128 : 0) + (e.mode === se || e.mode === io ? 256 : 0), (l === 0 && d === 0 || n === hi) && D === Ht && (D = Lp), D;
}, Hp = (t) => {
  if (Zt(t))
    return rt;
  let n = t.state;
  return n.window && (n.window = null), t.state = null, Ht;
}, Zp = (t, n) => {
  if (Zt(t))
    return rt;
  const e = t.state;
  return (e.wrap & 2) === 0 ? rt : (e.head = n, n.done = !1, Ht);
}, jp = (t, n) => {
  const e = n.length;
  let o, s, i;
  return Zt(t) || (o = t.state, o.wrap !== 0 && o.mode !== _e) ? rt : o.mode === _e && (s = 1, s = Fn(s, n, e, 0), s !== o.check) ? Ma : (i = Ga(t, n, e, e), i ? (o.mode = za, La) : (o.havedict = 1, Ht));
};
var Wp = Pa, Yp = Ua, qp = Fa, Xp = Np, Kp = Na, Jp = $p, Qp = Hp, tg = Zp, ng = jp, eg = "pako inflate (from Nodeca project)", _t = {
  inflateReset: Wp,
  inflateReset2: Yp,
  inflateResetKeep: qp,
  inflateInit: Xp,
  inflateInit2: Kp,
  inflate: Jp,
  inflateEnd: Qp,
  inflateGetHeader: tg,
  inflateSetDictionary: ng,
  inflateInfo: eg
};
function og() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var sg = og;
const $a = Object.prototype.toString, {
  Z_NO_FLUSH: ig,
  Z_FINISH: rg,
  Z_OK: Nn,
  Z_STREAM_END: fo,
  Z_NEED_DICT: uo,
  Z_STREAM_ERROR: ag,
  Z_DATA_ERROR: Vi,
  Z_MEM_ERROR: cg
} = Te;
function Ve(t) {
  this.options = Me.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const n = this.options;
  n.raw && n.windowBits >= 0 && n.windowBits < 16 && (n.windowBits = -n.windowBits, n.windowBits === 0 && (n.windowBits = -15)), n.windowBits >= 0 && n.windowBits < 16 && !(t && t.windowBits) && (n.windowBits += 32), n.windowBits > 15 && n.windowBits < 48 && (n.windowBits & 15) === 0 && (n.windowBits |= 15), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new Ea(), this.strm.avail_out = 0;
  let e = _t.inflateInit2(
    this.strm,
    n.windowBits
  );
  if (e !== Nn)
    throw new Error(Gt[e]);
  if (this.header = new sg(), _t.inflateGetHeader(this.strm, this.header), n.dictionary && (typeof n.dictionary == "string" ? n.dictionary = Un.string2buf(n.dictionary) : $a.call(n.dictionary) === "[object ArrayBuffer]" && (n.dictionary = new Uint8Array(n.dictionary)), n.raw && (e = _t.inflateSetDictionary(this.strm, n.dictionary), e !== Nn)))
    throw new Error(Gt[e]);
}
Ve.prototype.push = function(t, n) {
  const e = this.strm, o = this.options.chunkSize, s = this.options.dictionary;
  let i, r, a;
  if (this.ended) return !1;
  for (n === ~~n ? r = n : r = n === !0 ? rg : ig, $a.call(t) === "[object ArrayBuffer]" ? e.input = new Uint8Array(t) : e.input = t, e.next_in = 0, e.avail_in = e.input.length; ; ) {
    for (e.avail_out === 0 && (e.output = new Uint8Array(o), e.next_out = 0, e.avail_out = o), i = _t.inflate(e, r), i === uo && s && (i = _t.inflateSetDictionary(e, s), i === Nn ? i = _t.inflate(e, r) : i === Vi && (i = uo)); e.avail_in > 0 && i === fo && e.state.wrap > 0 && t[e.next_in] !== 0; )
      _t.inflateReset(e), i = _t.inflate(e, r);
    switch (i) {
      case ag:
      case Vi:
      case uo:
      case cg:
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
        return i = _t.inflateEnd(this.strm), this.onEnd(i), this.ended = !0, !0;
      if (e.avail_in === 0) break;
    }
  }
  return !0;
};
Ve.prototype.onData = function(t) {
  this.chunks.push(t);
};
Ve.prototype.onEnd = function(t) {
  t === Nn && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = Me.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function fg(t, n) {
  const e = new Ve(n);
  if (e.push(t), e.err) throw e.msg || Gt[e.err];
  return e.result;
}
var ug = fg, lg = {
  inflate: ug
};
const { deflate: hg } = vp, { inflate: dg } = lg;
var Fi = hg, Pi = dg;
const Ha = 2001684038, Vo = 44, Fo = 20, be = 12, ve = 16;
function pg(t) {
  const n = new DataView(t), e = new Uint8Array(t);
  if (n.getUint32(0) !== Ha)
    throw new Error("Invalid WOFF1 signature");
  const s = n.getUint32(4), i = n.getUint16(12), r = n.getUint32(24), a = n.getUint32(28), c = n.getUint32(36), f = n.getUint32(40), u = [];
  let l = Vo;
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
  const d = u.map((C) => {
    const A = e.subarray(
      C.offset,
      C.offset + C.compLength
    );
    let I;
    if (C.compLength < C.origLength) {
      if (I = Pi(A), I.length !== C.origLength)
        throw new Error(
          `WOFF1 table '${C.tag}': decompressed size ${I.length} !== expected ${C.origLength}`
        );
    } else
      I = A;
    return {
      tag: C.tag,
      checksum: C.origChecksum,
      data: I,
      length: C.origLength,
      paddedLength: C.origLength + (4 - C.origLength % 4) % 4
    };
  }), p = be + i * ve;
  let h = p + (4 - p % 4) % 4;
  const { searchRange: g, entrySelector: x, rangeShift: m } = gg(i);
  let y = h;
  for (const C of d)
    y += C.paddedLength;
  const _ = new ArrayBuffer(y), w = new DataView(_), S = new Uint8Array(_);
  w.setUint32(0, s), w.setUint16(4, i), w.setUint16(6, g), w.setUint16(8, x), w.setUint16(10, m);
  const k = d.map((C, A) => ({ ...C, originalIndex: A })).sort((C, A) => C.tag < A.tag ? -1 : C.tag > A.tag ? 1 : 0);
  for (let C = 0; C < k.length; C++) {
    const A = k[C], I = be + C * ve;
    for (let O = 0; O < 4; O++)
      w.setUint8(I + O, A.tag.charCodeAt(O));
    w.setUint32(I + 4, A.checksum), w.setUint32(I + 8, h), w.setUint32(I + 12, A.length), S.set(A.data, h), h += A.paddedLength;
  }
  let b = null;
  if (r && a) {
    const C = e.subarray(r, r + a);
    b = Pi(C);
  }
  let D = null;
  return c && f && (D = e.slice(c, c + f)), { sfnt: _, metadata: b, privateData: D };
}
function Po(t, n = null, e = null) {
  const o = new DataView(t), s = new Uint8Array(t), i = o.getUint32(0), r = o.getUint16(4), a = [];
  for (let k = 0; k < r; k++) {
    const b = be + k * ve;
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
  const c = a.map((k) => {
    const b = s.subarray(k.offset, k.offset + k.length), D = Fi(b), C = D.length < k.length;
    return {
      tag: k.tag,
      origChecksum: k.checksum,
      origLength: k.length,
      data: C ? D : b,
      compLength: C ? D.length : k.length
    };
  });
  let f = null, u = 0;
  n && n.length > 0 && (u = n.length, f = Fi(n));
  let d = Vo + r * Fo;
  d += (4 - d % 4) % 4;
  for (const k of c)
    k.woffOffset = d, d += k.compLength, d += (4 - d % 4) % 4;
  let p = 0, h = 0;
  f && (p = d, h = f.length, d += h, d += (4 - d % 4) % 4);
  let g = 0, x = 0;
  e && e.length > 0 && (g = d, x = e.length, d += x);
  const m = d;
  let y = be + r * ve;
  for (const k of c)
    y += k.origLength + (4 - k.origLength % 4) % 4;
  const _ = new ArrayBuffer(m), w = new DataView(_), S = new Uint8Array(_);
  w.setUint32(0, Ha), w.setUint32(4, i), w.setUint32(8, m), w.setUint16(12, r), w.setUint16(14, 0), w.setUint32(16, y), w.setUint16(20, 0), w.setUint16(22, 0), w.setUint32(24, p), w.setUint32(28, h), w.setUint32(32, u), w.setUint32(36, g), w.setUint32(40, x);
  for (let k = 0; k < c.length; k++) {
    const b = c[k], D = Vo + k * Fo;
    for (let C = 0; C < 4; C++)
      w.setUint8(D + C, b.tag.charCodeAt(C));
    w.setUint32(D + 4, b.woffOffset), w.setUint32(D + 8, b.compLength), w.setUint32(D + 12, b.origLength), w.setUint32(D + 16, b.origChecksum);
  }
  for (const k of c)
    S.set(k.data, k.woffOffset);
  return f && S.set(f, p), e && e.length > 0 && S.set(e, g), _;
}
function gg(t) {
  let n = 1, e = 0;
  for (; n * 2 <= t; )
    n *= 2, e++;
  n *= 16;
  const o = t * 16 - n;
  return { searchRange: n, entrySelector: e, rangeShift: o };
}
let ke = null, rn = null;
async function mg() {
  if (!rn)
    try {
      const { brotliCompressSync: t, brotliDecompressSync: n } = await import("node:zlib");
      ke = (e) => new Uint8Array(t(e)), rn = (e) => new Uint8Array(n(e));
    } catch {
      const t = await import("brotli-wasm"), n = await (t.default || t);
      ke = n.compress, rn = n.decompress;
    }
}
function Za() {
  if (!rn)
    throw new Error(
      "WOFF2 support requires initialization. Call `await initWoff2()` before importing or exporting WOFF2 files."
    );
}
const ja = 2001684018, Uo = 48, Gn = 12, $n = 16, No = [
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
], Wa = /* @__PURE__ */ new Map();
for (let t = 0; t < No.length; t++) Wa.set(No[t], t);
function Ui(t, n) {
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
function yg(t) {
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
const xg = wg();
function wg() {
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
function Sg(t, n, e) {
  const o = t & 127, s = !(t & 128), i = xg[o];
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
function _g(t, n, e, o, s, i, r, a, c) {
  const f = [];
  lt(f, t), lt(f, s), lt(f, i), lt(f, r), lt(f, a);
  for (const h of n) $o(f, h);
  $o(f, o.length);
  for (let h = 0; h < o.length; h++) f.push(o[h]);
  const u = [], l = [], d = [];
  for (let h = 0; h < e.length; h++) {
    const { dx: g, dy: x, onCurve: m } = e[h];
    let y = m ? 1 : 0;
    if (h === 0 && c && (y |= 64), g === 0)
      y |= 16;
    else if (g >= -255 && g <= 255)
      y |= 2, g > 0 ? (y |= 16, l.push(g)) : l.push(-g);
    else {
      const _ = g & 65535;
      l.push(_ >> 8 & 255, _ & 255);
    }
    if (x === 0)
      y |= 32;
    else if (x >= -255 && x <= 255)
      y |= 4, x > 0 ? (y |= 32, d.push(x)) : d.push(-x);
    else {
      const _ = x & 65535;
      d.push(_ >> 8 & 255, _ & 255);
    }
    u.push(y);
  }
  let p = 0;
  for (; p < u.length; ) {
    const h = u[p];
    let g = 0;
    for (; p + g + 1 < u.length && u[p + g + 1] === h && g < 255; )
      g++;
    g > 0 ? (f.push(h | 8), f.push(g), p += g + 1) : (f.push(h), p++);
  }
  for (const h of l) f.push(h);
  for (const h of d) f.push(h);
  return f;
}
function bg(t, n, e, o, s, i) {
  const r = [];
  lt(r, -1), lt(r, e), lt(r, o), lt(r, s), lt(r, i);
  for (let a = 0; a < t.length; a++) r.push(t[a]);
  if (n && n.length > 0) {
    $o(r, n.length);
    for (let a = 0; a < n.length; a++) r.push(n[a]);
  }
  return r;
}
function vg(t, n) {
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
  const c = wt(e, o);
  o += 4;
  const f = wt(e, o);
  o += 4;
  const u = wt(e, o);
  o += 4;
  const l = wt(e, o);
  o += 4;
  const d = wt(e, o);
  o += 4;
  const p = wt(e, o);
  o += 4;
  const h = wt(e, o);
  o += 4;
  const g = o, x = g + c, m = x + f, y = m + u, _ = y + l, w = _ + d, S = w + p, k = 4 * Math.floor((r + 31) / 32), b = w, D = b + k;
  function C(X) {
    const ot = X >> 3, bt = 7 - (X & 7);
    return !!(e[b + ot] & 1 << bt);
  }
  const A = !!(i & 1), I = S + h;
  function O(X) {
    if (!A) return !1;
    const ot = X >> 3, bt = 7 - (X & 7);
    return !!(e[I + ot] & 1 << bt);
  }
  let E = g, B = x, R = m, M = y, $ = _, U = D, j = S;
  const Y = [], q = [0];
  let gt = 0;
  for (let X = 0; X < r; X++) {
    const ot = st(e, E);
    if (E += 2, ot === 0) {
      Y.push(null), q.push(gt);
      continue;
    }
    if (ot > 0) {
      const bt = [];
      let Wt = 0;
      for (let at = 0; at < ot; at++) {
        const { value: yt, bytesRead: Yt } = an(e, B);
        B += Yt, Wt += yt, bt.push(Wt - 1);
      }
      const yn = [];
      for (let at = 0; at < Wt; at++) {
        const yt = e[R++], { dx: Yt, dy: ec, onCurve: oc, bytesConsumed: sc } = Sg(yt, e, M);
        M += sc, yn.push({ dx: Yt, dy: ec, onCurve: oc });
      }
      const { value: xn, bytesRead: Fe } = an(e, M);
      M += Fe;
      const Pe = e.subarray(j, j + xn);
      j += xn;
      let Rt, Mt, mt, Lt;
      if (C(X))
        Rt = st(e, U), U += 2, Mt = st(e, U), U += 2, mt = st(e, U), U += 2, Lt = st(e, U), U += 2;
      else {
        let at = 0, yt = 0;
        Rt = 32767, Mt = 32767, mt = -32768, Lt = -32768;
        for (const Yt of yn)
          at += Yt.dx, yt += Yt.dy, at < Rt && (Rt = at), at > mt && (mt = at), yt < Mt && (Mt = yt), yt > Lt && (Lt = yt);
      }
      const tt = _g(
        ot,
        bt,
        yn,
        Pe,
        Rt,
        Mt,
        mt,
        Lt,
        O(X)
      );
      Y.push(tt);
      const Ue = tt.length + (tt.length % 2 ? 1 : 0);
      gt += Ue, q.push(gt);
    } else {
      const bt = $;
      let Wt = !1;
      for (; ; ) {
        const tt = e[$] << 8 | e[$ + 1];
        if ($ += 2, $ += 2, tt & 1 ? $ += 4 : $ += 2, tt & 8 ? $ += 2 : tt & 64 ? $ += 4 : tt & 128 && ($ += 8), tt & 256 && (Wt = !0), !(tt & 32)) break;
      }
      const yn = e.subarray(bt, $);
      let xn = new Uint8Array(0);
      if (Wt) {
        const { value: tt, bytesRead: Ue } = an(e, M);
        M += Ue, xn = e.subarray(j, j + tt), j += tt;
      }
      const Fe = st(e, U);
      U += 2;
      const Pe = st(e, U);
      U += 2;
      const Rt = st(e, U);
      U += 2;
      const Mt = st(e, U);
      U += 2;
      const mt = bg(
        yn,
        xn,
        Fe,
        Pe,
        Rt,
        Mt
      );
      Y.push(mt);
      const Lt = mt.length + (mt.length % 2 ? 1 : 0);
      gt += Lt, q.push(gt);
    }
  }
  const jt = new Uint8Array(gt);
  let Yn = 0;
  for (const X of Y)
    if (X !== null) {
      for (let ot = 0; ot < X.length; ot++)
        jt[Yn++] = X[ot];
      X.length % 2 && Yn++;
    }
  return { glyfBytes: jt, locaOffsets: q, indexFormat: a };
}
function kg(t, n, e, o, s) {
  const i = t;
  let r = 0;
  const a = i[r++], c = !(a & 1), f = !(a & 2), u = [];
  for (let m = 0; m < n; m++)
    u.push(i[r] << 8 | i[r + 1]), r += 2;
  const l = [];
  if (c)
    for (let m = 0; m < n; m++)
      l.push(st(i, r)), r += 2;
  else
    for (let m = 0; m < n; m++)
      l.push(Ni(o, s, m));
  const d = e - n, p = [];
  if (f)
    for (let m = 0; m < d; m++)
      p.push(st(i, r)), r += 2;
  else
    for (let m = 0; m < d; m++)
      p.push(Ni(o, s, n + m));
  const h = n * 4 + d * 2, g = new Uint8Array(h);
  let x = 0;
  for (let m = 0; m < n; m++) {
    g[x++] = u[m] >> 8 & 255, g[x++] = u[m] & 255;
    const y = l[m] & 65535;
    g[x++] = y >> 8 & 255, g[x++] = y & 255;
  }
  for (let m = 0; m < d; m++) {
    const y = p[m] & 65535;
    g[x++] = y >> 8 & 255, g[x++] = y & 255;
  }
  return g;
}
function Ni(t, n, e) {
  const o = n[e], s = n[e + 1];
  return o === s ? 0 : st(t, o + 2);
}
function Ag(t, n) {
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
function Cg(t) {
  Za();
  const n = new Uint8Array(t), e = new DataView(t);
  if (e.getUint32(0) !== ja)
    throw new Error("Invalid WOFF2 signature");
  const s = e.getUint32(4), i = e.getUint16(12), r = e.getUint32(20), a = e.getUint32(28), c = e.getUint32(32), f = e.getUint32(40), u = e.getUint32(44);
  let l = Uo;
  const d = [];
  for (let O = 0; O < i; O++) {
    const E = n[l++], B = E & 63, R = E >> 6 & 3;
    let M;
    B === 63 ? (M = String.fromCharCode(n[l], n[l + 1], n[l + 2], n[l + 3]), l += 4) : M = No[B];
    const { value: $, bytesRead: U } = Ui(n, l);
    l += U;
    let j = $;
    const Y = M === "glyf" || M === "loca", q = M === "hmtx";
    if (Y && R === 0 || q && R === 1 || !Y && !q && R !== 0) {
      const { value: jt, bytesRead: Yn } = Ui(n, l);
      l += Yn, j = jt;
    }
    M === "loca" && R === 0 && (j = 0), d.push({
      tag: M,
      transformVersion: R,
      origLength: $,
      transformLength: j,
      isTransformed: Y ? R === 0 : q ? R === 1 : R !== 0
    });
  }
  let p = null;
  if (s === 1953784678) {
    const O = wt(n, l);
    l += 4;
    const { value: E, bytesRead: B } = an(n, l);
    l += B;
    const R = [];
    for (let M = 0; M < E; M++) {
      const { value: $, bytesRead: U } = an(n, l);
      l += U;
      const j = wt(n, l);
      l += 4;
      const Y = [];
      for (let q = 0; q < $; q++) {
        const { value: gt, bytesRead: jt } = an(n, l);
        l += jt, Y.push(gt);
      }
      R.push({ numTables: $, flavor: j, tableIndices: Y });
    }
    p = { version: O, numFonts: E, fonts: R };
  }
  const h = l, g = n.subarray(h, h + r), x = rn(g);
  let m = 0;
  const y = /* @__PURE__ */ new Map();
  for (const O of d) {
    const E = O.isTransformed ? O.transformLength : O.origLength, B = x.subarray(m, m + E);
    m += E, y.set(O.tag, { data: B, entry: O });
  }
  const _ = /* @__PURE__ */ new Map();
  let w = null;
  const S = y.get("glyf"), k = y.get("loca");
  S && S.entry.isTransformed && (k && k.entry.origLength, w = vg(S.data), _.set("glyf", w.glyfBytes), _.set("loca", Ag(
    w.locaOffsets,
    w.indexFormat
  )));
  const b = y.get("hmtx");
  if (b && b.entry.isTransformed && w) {
    const O = y.get("hhea"), E = y.get("maxp");
    let B = 0, R = 0;
    O && (B = O.data[34] << 8 | O.data[35]), E && (R = E.data[4] << 8 | E.data[5]), _.set("hmtx", kg(
      b.data,
      B,
      R,
      w.glyfBytes,
      w.locaOffsets
    ));
  }
  const D = [];
  for (const O of d) {
    const E = O.tag;
    let B;
    _.has(E) ? B = _.get(E) : B = y.get(E).data, D.push({ tag: E, data: B, length: B.length });
  }
  let C;
  p ? C = Og(p, D) : C = Ya(s, D);
  let A = null;
  if (a && c) {
    const O = n.subarray(a, a + c);
    A = rn(O);
  }
  let I = null;
  return f && u && (I = n.slice(f, f + u)), { sfnt: C.buffer, metadata: A, privateData: I };
}
function Ya(t, n) {
  const e = n.length, { searchRange: o, entrySelector: s, rangeShift: i } = Ig(e), r = Gn + e * $n;
  let a = r + (4 - r % 4) % 4;
  const c = n.map((d, p) => ({ ...d, index: p })).sort((d, p) => d.tag < p.tag ? -1 : d.tag > p.tag ? 1 : 0);
  let f = a;
  for (const d of c)
    f += d.length + (4 - d.length % 4) % 4;
  const u = new Uint8Array(f), l = new DataView(u.buffer);
  l.setUint32(0, t), l.setUint16(4, e), l.setUint16(6, o), l.setUint16(8, s), l.setUint16(10, i);
  for (let d = 0; d < c.length; d++) {
    const p = c[d], h = Gn + d * $n;
    for (let x = 0; x < 4; x++)
      u[h + x] = p.tag.charCodeAt(x);
    const g = qa(p.data);
    l.setUint32(h + 4, g), l.setUint32(h + 8, a), l.setUint32(h + 12, p.length), u.set(p.data instanceof Uint8Array ? p.data : new Uint8Array(p.data), a), a += p.length + (4 - p.length % 4) % 4;
  }
  return Dg(u, c), u;
}
function Og(t, n, e) {
  const o = [];
  for (const l of t.fonts) {
    const d = l.tableIndices.map((h) => n[h]), p = Ya(l.flavor, d);
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
function Go(t, n = null, e = null) {
  Za();
  const o = new DataView(t), s = new Uint8Array(t), i = o.getUint32(0), r = o.getUint16(4), a = [];
  for (let B = 0; B < r; B++) {
    const R = Gn + B * $n, M = String.fromCharCode(
      o.getUint8(R),
      o.getUint8(R + 1),
      o.getUint8(R + 2),
      o.getUint8(R + 3)
    );
    a.push({
      tag: M,
      checksum: o.getUint32(R + 4),
      offset: o.getUint32(R + 8),
      length: o.getUint32(R + 12)
    });
  }
  const c = a.filter((B) => B.tag !== "DSIG"), f = [], u = [];
  let l = Gn + c.length * $n;
  for (const B of c) {
    const R = s.subarray(B.offset, B.offset + B.length), M = Wa.get(B.tag), U = B.tag === "glyf" || B.tag === "loca" ? 3 : 0, Y = [(M !== void 0 ? M : 63) | U << 6];
    if (M === void 0)
      for (let q = 0; q < 4; q++) Y.push(B.tag.charCodeAt(q));
    Y.push(...yg(B.length)), f.push(Y), u.push(R), l += B.length + (4 - B.length % 4) % 4;
  }
  let d = 0;
  for (const B of u) d += B.length;
  const p = new Uint8Array(d);
  let h = 0;
  for (const B of u)
    p.set(B, h), h += B.length;
  const g = ke(p);
  let x = null, m = 0;
  n && n.length > 0 && (m = n.length, x = ke(n));
  let y = [];
  for (const B of f) y.push(...B);
  let w = Uo + y.length;
  const S = w;
  w += g.length;
  let k = 0, b = 0;
  x && (w += (4 - w % 4) % 4, k = w, b = x.length, w += b);
  let D = 0, C = 0;
  e && e.length > 0 && (w += (4 - w % 4) % 4, D = w, C = e.length, w += C);
  const A = w, I = new ArrayBuffer(A), O = new DataView(I), E = new Uint8Array(I);
  O.setUint32(0, ja), O.setUint32(4, i), O.setUint32(8, A), O.setUint16(12, c.length), O.setUint16(14, 0), O.setUint32(16, l), O.setUint32(20, g.length), O.setUint16(24, 0), O.setUint16(26, 0), O.setUint32(28, k), O.setUint32(32, b), O.setUint32(36, m), O.setUint32(40, D), O.setUint32(44, C);
  for (let B = 0; B < y.length; B++)
    E[Uo + B] = y[B];
  return E.set(g instanceof Uint8Array ? g : new Uint8Array(g), S), x && E.set(
    x instanceof Uint8Array ? x : new Uint8Array(x),
    k
  ), e && e.length > 0 && E.set(e, D), I;
}
function wt(t, n) {
  return (t[n] << 24 | t[n + 1] << 16 | t[n + 2] << 8 | t[n + 3]) >>> 0;
}
function st(t, n) {
  const e = t[n] << 8 | t[n + 1];
  return e > 32767 ? e - 65536 : e;
}
function lt(t, n) {
  const e = n & 65535;
  t.push(e >> 8 & 255, e & 255);
}
function $o(t, n) {
  t.push(n >> 8 & 255, n & 255);
}
function Ig(t) {
  let n = 1, e = 0;
  for (; n * 2 <= t; )
    n *= 2, e++;
  n *= 16;
  const o = t * 16 - n;
  return { searchRange: n, entrySelector: e, rangeShift: o };
}
function qa(t) {
  let n = 0;
  const e = t.length, o = e + (4 - e % 4) % 4;
  for (let s = 0; s < o; s += 4)
    n = n + ((t[s] || 0) << 24 | (t[s + 1] || 0) << 16 | (t[s + 2] || 0) << 8 | (t[s + 3] || 0)) >>> 0;
  return n;
}
function Dg(t, n) {
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
  const s = 2981146554 - qa(t) >>> 0;
  t[e + 8] = s >> 24 & 255, t[e + 9] = s >> 16 & 255, t[e + 10] = s >> 8 & 255, t[e + 11] = s & 255;
}
const Eg = {
  cmap: vu,
  head: Dr,
  hhea: _0,
  HVAR: O0,
  hmtx: v0,
  maxp: rh,
  MVAR: dh,
  name: Sh,
  hdmx: m0,
  BASE: Zf,
  JSTF: F0,
  MATH: eh,
  MERG: ch,
  meta: lh,
  DSIG: ul,
  LTSH: Q0,
  CBLC: on,
  CBDT: Wo,
  "OS/2": bh,
  kern: Z0,
  PCLT: Ah,
  VDMX: Hh,
  post: Oh,
  STAT: zh,
  "CFF ": Jc,
  CFF2: af,
  VORG: lf,
  fvar: Sl,
  avar: pf,
  loca: ca,
  glyf: I1,
  gvar: z1,
  GDEF: Cl,
  GPOS: Nl,
  GSUB: r0,
  "cvt ": w1,
  cvar: y1,
  fpgm: _1,
  prep: U1,
  gasp: v1,
  vhea: qh,
  VVAR: n1,
  vmtx: Kh,
  COLR: sl,
  CPAL: rl,
  EBDT: dl,
  EBLC: gl,
  EBSC: yl,
  bloc: cu,
  bdat: tu,
  sbix: Bh,
  ltag: K0,
  "SVG ": Ph
}, Gi = 12, $i = 16, Bg = /* @__PURE__ */ new Set(["sfnt", "woff", "woff2"]);
function Tg(t) {
  const n = t._woff?.version;
  return n === 2 ? "woff2" : n === 1 ? "woff" : "sfnt";
}
function am(t, n = {}) {
  if (!t || typeof t != "object")
    throw new TypeError("exportFont expects a font data object");
  const e = n.format ? n.format.toLowerCase() : Tg(t);
  if (!Bg.has(e))
    throw new Error(
      `Unknown export format "${e}". Supported: sfnt, woff, woff2.`
    );
  if (Mg(t)) {
    if (n.split)
      return Rg(t, e);
    const i = Lg(t);
    return e === "woff" ? Po(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : e === "woff2" ? Go(
      i,
      t._woff?.metadata,
      t._woff?.privateData
    ) : i;
  }
  const o = cs(t), s = Ae(o, 0);
  if (e === "woff") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return Po(s, i, r);
  }
  if (e === "woff2") {
    const i = t._woff?.metadata ?? null, r = t._woff?.privateData ?? null;
    return Go(s, i, r);
  }
  return s;
}
function Rg(t, n) {
  const { fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("Collection split expects a non-empty fonts array");
  return e.map((o) => {
    const s = cs(o), i = Ae(s, 0);
    return n === "woff" ? Po(i) : n === "woff2" ? Go(i) : i;
  });
}
function Mg(t) {
  return t.collection && t.collection.tag === "ttcf" && Array.isArray(t.fonts);
}
function cs(t) {
  if (t.header && t.tables)
    return t;
  if (t._header && t.tables)
    return { header: t._header, tables: t.tables };
  if (t.font && t.glyphs)
    return vc(t);
  throw new Error(
    "exportFont: input must have { header, tables } or { font, glyphs }"
  );
}
function Ae(t, n) {
  const { header: e, tables: o } = t, s = Object.keys(o), i = s.length, r = zg(o), a = s.map((h) => {
    const g = o[h];
    let x;
    if (r.has(h))
      x = r.get(h);
    else if (g._raw)
      x = g._raw;
    else {
      const y = Eg[h];
      if (!y)
        throw new Error(`No writer registered for parsed table: ${h}`);
      x = y(g);
    }
    const m = new Uint8Array(x);
    return {
      tag: h,
      data: m,
      length: m.length,
      paddedLength: m.length + (4 - m.length % 4) % 4,
      checksum: g._checksum
    };
  }), c = Gi + i * $i;
  let f = c + (4 - c % 4) % 4;
  for (const h of a)
    h.offset = f, f += h.paddedLength;
  const u = f, l = new ArrayBuffer(u), d = new DataView(l), p = new Uint8Array(l);
  d.setUint32(0, e.sfVersion), d.setUint16(4, i), d.setUint16(6, e.searchRange), d.setUint16(8, e.entrySelector), d.setUint16(10, e.rangeShift);
  for (let h = 0; h < a.length; h++) {
    const g = a[h], x = Gi + h * $i;
    for (let m = 0; m < 4; m++)
      d.setUint8(x + m, g.tag.charCodeAt(m));
    d.setUint32(x + 4, g.checksum), d.setUint32(x + 8, g.offset + n), d.setUint32(x + 12, g.length);
  }
  for (const h of a)
    p.set(h.data, h.offset);
  return l;
}
function Lg(t) {
  const { collection: n, fonts: e } = t;
  if (!Array.isArray(e) || e.length === 0)
    throw new Error("TTC/OTC export expects a non-empty fonts array");
  const o = e.map((m) => cs(m)), s = n.majorVersion ?? 2, i = n.minorVersion ?? 0, r = o.length, a = s >= 2, c = 12 + r * 4 + (a ? 12 : 0);
  let f = c + (4 - c % 4) % 4;
  const l = o.map(
    (m) => new Uint8Array(Ae(m, 0))
  ).map((m) => {
    const y = f;
    return f += m.length, f += (4 - f % 4) % 4, y;
  }), d = o.map(
    (m, y) => new Uint8Array(Ae(m, l[y]))
  ), p = f, h = new ArrayBuffer(p), g = new DataView(h), x = new Uint8Array(h);
  g.setUint8(0, 116), g.setUint8(1, 116), g.setUint8(2, 99), g.setUint8(3, 102), g.setUint16(4, s), g.setUint16(6, i), g.setUint32(8, r);
  for (let m = 0; m < r; m++)
    g.setUint32(12 + m * 4, l[m]);
  if (a) {
    const m = 12 + r * 4;
    g.setUint32(m + 0, n.dsigTag ?? 0), g.setUint32(m + 4, n.dsigLength ?? 0), g.setUint32(m + 8, n.dsigOffset ?? 0);
  }
  for (let m = 0; m < r; m++)
    x.set(d[m], l[m]);
  return h;
}
function zg(t) {
  const n = /* @__PURE__ */ new Map(), e = t.glyf && !t.glyf._raw, o = t.loca && !t.loca._raw;
  if (e && o) {
    const { bytes: u, offsets: l } = aa(t.glyf);
    if (n.set("glyf", u), n.set("loca", ca({ offsets: l })), t.head && !t.head._raw) {
      const p = l.every((h) => h % 2 === 0 && h / 2 <= 65535) ? 0 : 1;
      t.head.indexToLocFormat !== p && n.set(
        "head",
        Dr({ ...t.head, indexToLocFormat: p })
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
function cm(t) {
  if (!t || t.length === 0) return "";
  const n = [];
  for (const e of t)
    !e || e.length === 0 || (e[0].type ? n.push(Vg(e)) : n.push(Fg(e)));
  return n.join(" ");
}
function Vg(t) {
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
function Fg(t) {
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
        const l = (c.x + u.x) / 2, d = (c.y + u.y) / 2;
        n.push(`Q${N(c.x)} ${N(c.y)} ${N(l)} ${N(d)}`), i++;
      }
    }
  }
  const r = t[(o + e - 1) % e];
  return r.onCurve || n.push(
    `Q${N(r.x)} ${N(r.y)} ${N(s.x)} ${N(s.y)}`
  ), n.push("Z"), n.join(" ");
}
function Pg(t, n = "cff") {
  const e = Gg(t);
  if (e.length === 0) return [];
  const o = [];
  let s = null;
  for (const i of e)
    i.op === "M" ? (s && s.length > 0 && o.push(s), s = [i]) : i.op === "Z" ? (s && s.length > 0 && o.push(s), s = null) : s && s.push(i);
  return s && s.length > 0 && o.push(s), n === "truetype" ? o.map((i) => Ng(i)) : o.map((i) => Ug(i));
}
function Ug(t) {
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
function Ng(t) {
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
        const o = n[n.length - 1], s = o ? o.x : 0, i = o ? o.y : 0, r = Ho(
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
function Gg(t) {
  const n = [], e = t.match(
    /[MmLlHhVvCcSsQqTtZz]|[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g
  );
  if (!e) return n;
  let o = 0, s = 0, i = 0, r = 0, a = "", c = 0, f = 0, u = 0;
  function l() {
    return parseFloat(e[u++]);
  }
  for (; u < e.length; ) {
    let d = e[u];
    /[A-Za-z]/.test(d) ? u++ : d = a;
    const p = d === d.toLowerCase();
    switch (d.toUpperCase()) {
      case "M": {
        let g = l(), x = l();
        p && (g += o, x += s), n.push({ op: "M", x: g, y: x }), o = i = g, s = r = x, a = p ? "l" : "L";
        break;
      }
      case "L": {
        let g = l(), x = l();
        p && (g += o, x += s), n.push({ op: "L", x: g, y: x }), o = g, s = x, a = d;
        break;
      }
      case "H": {
        let g = l();
        p && (g += o), n.push({ op: "L", x: g, y: s }), o = g, a = d;
        break;
      }
      case "V": {
        let g = l();
        p && (g += s), n.push({ op: "L", x: o, y: g }), s = g, a = d;
        break;
      }
      case "C": {
        let g = l(), x = l(), m = l(), y = l(), _ = l(), w = l();
        p && (g += o, x += s, m += o, y += s, _ += o, w += s), n.push({ op: "C", x1: g, y1: x, x2: m, y2: y, x: _, y: w }), c = m, f = y, o = _, s = w, a = d;
        break;
      }
      case "S": {
        let g = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "C" && a.toUpperCase() !== "S" && (g = o, x = s);
        let m = l(), y = l(), _ = l(), w = l();
        p && (m += o, y += s, _ += o, w += s), n.push({ op: "C", x1: g, y1: x, x2: m, y2: y, x: _, y: w }), c = m, f = y, o = _, s = w, a = d;
        break;
      }
      case "Q": {
        let g = l(), x = l(), m = l(), y = l();
        p && (g += o, x += s, m += o, y += s), n.push({ op: "Q", x1: g, y1: x, x: m, y }), c = g, f = x, o = m, s = y, a = d;
        break;
      }
      case "T": {
        let g = 2 * o - c, x = 2 * s - f;
        a.toUpperCase() !== "Q" && a.toUpperCase() !== "T" && (g = o, x = s);
        let m = l(), y = l();
        p && (m += o, y += s), n.push({ op: "Q", x1: g, y1: x, x: m, y }), c = g, f = x, o = m, s = y, a = d;
        break;
      }
      case "Z": {
        n.push({ op: "Z" }), o = i, s = r, a = d;
        break;
      }
      default:
        a = d;
        break;
    }
  }
  return n;
}
function Ho(t, n, e, o, s, i, r, a, c = 0) {
  const f = (3 * (e + s) - t - r) / 4, u = (3 * (o + i) - n - a) / 4, l = t + 2 / 3 * (f - t), d = n + 2 / 3 * (u - n), p = r + 2 / 3 * (f - r), h = a + 2 / 3 * (u - a), g = Math.hypot(e - l, o - d), x = Math.hypot(s - p, i - h);
  if (Math.max(g, x) <= 0.5 || c >= 8)
    return [{ cx: f, cy: u, x: r, y: a }];
  const y = (t + e) / 2, _ = (n + o) / 2, w = (e + s) / 2, S = (o + i) / 2, k = (s + r) / 2, b = (i + a) / 2, D = (y + w) / 2, C = (_ + S) / 2, A = (w + k) / 2, I = (S + b) / 2, O = (D + A) / 2, E = (C + I) / 2, B = Ho(
    t,
    n,
    y,
    _,
    D,
    C,
    O,
    E,
    c + 1
  ), R = Ho(
    O,
    E,
    A,
    I,
    k,
    b,
    r,
    a,
    c + 1
  );
  return B.concat(R);
}
function N(t) {
  const n = Math.round(t * 100) / 100;
  return n === Math.floor(n) ? String(n) : n.toFixed(2).replace(/0+$/, "");
}
function fm(t) {
  if (!t || typeof t != "object")
    throw new Error("createGlyph: options object is required");
  const {
    name: n,
    unicode: e,
    unicodes: o,
    advanceWidth: s,
    leftSideBearing: i,
    advanceHeight: r,
    topSideBearing: a,
    path: c,
    contours: f,
    charString: u,
    components: l,
    instructions: d,
    format: p = "cff"
  } = t;
  if (n == null)
    throw new Error("createGlyph: name is required");
  if (s == null)
    throw new Error("createGlyph: advanceWidth is required");
  const h = {
    name: n,
    advanceWidth: s
  };
  if (o && o.length > 0 ? h.unicodes = o : e != null && (h.unicode = e), i !== void 0 && (h.leftSideBearing = i), r !== void 0 && (h.advanceHeight = r), a !== void 0 && (h.topSideBearing = a), d && (h.instructions = d), u)
    h.charString = u;
  else if (c) {
    const g = Pg(c, p);
    h.contours = g, p === "cff" && (h.charString = lo(g));
  } else f ? (h.contours = f, f.length > 0 && f[0] && f[0].length > 0 && f[0][0].type && (h.charString = lo(f))) : l && (h.components = l);
  return h;
}
const $g = {
  cmap: fu,
  head: So,
  hhea: S0,
  HVAR: A0,
  hmtx: b0,
  maxp: ih,
  MVAR: hh,
  name: wh,
  hdmx: g0,
  BASE: Pf,
  JSTF: V0,
  MATH: nh,
  MERG: ah,
  meta: uh,
  DSIG: fl,
  LTSH: J0,
  CBLC: Yo,
  CBDT: jo,
  "OS/2": _h,
  kern: N0,
  PCLT: kh,
  VDMX: $h,
  post: Ch,
  STAT: Mh,
  "CFF ": Xc,
  CFF2: rf,
  VORG: uf,
  fvar: wl,
  avar: df,
  loca: F1,
  glyf: k1,
  gvar: M1,
  GDEF: _l,
  GPOS: Rl,
  GSUB: Ql,
  "cvt ": x1,
  cvar: m1,
  fpgm: S1,
  prep: P1,
  gasp: b1,
  vhea: Yh,
  VVAR: Qh,
  vmtx: Xh,
  COLR: ol,
  CPAL: il,
  EBLC: pl,
  EBDT: hl,
  EBSC: ml,
  bloc: au,
  bdat: Qf,
  sbix: Eh,
  ltag: X0,
  "SVG ": Fh
}, Hg = [
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
function Hi(t) {
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
      const { sfnt: s, metadata: i, privateData: r } = pg(t), a = Hi(s);
      return a._woff = { version: 1 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (o === "wOF2") {
      const { sfnt: s, metadata: i, privateData: r } = Cg(t), a = Hi(s);
      return a._woff = { version: 2 }, i && (a._woff.metadata = i), r && (a._woff.privateData = r), a;
    }
    if (o === "ttcf")
      return jg(t);
  }
  const e = Zg(t);
  return qi(e);
}
function Zg(t) {
  if (!(t instanceof ArrayBuffer))
    throw new TypeError("importFontTables expects an ArrayBuffer");
  const n = new T(new Uint8Array(t)), e = Xa(n), o = Ka(n, e.numTables), s = Ja(t, o);
  return { header: e, tables: s };
}
function jg(t) {
  const n = new T(new Uint8Array(t)), e = n.tag();
  if (e !== "ttcf")
    throw new Error("Invalid TTC/OTC collection signature");
  const o = n.uint16(), s = n.uint16(), i = n.uint32(), r = n.array("uint32", i);
  let a, c, f;
  o >= 2 && (a = n.uint32(), c = n.uint32(), f = n.uint32());
  const u = r.map((d) => {
    const p = new T(new Uint8Array(t), d), h = Xa(p), g = Ka(p, h.numTables), x = Wg(
      t,
      g,
      d
    ), m = Ja(t, x);
    return qi({ header: h, tables: m });
  }), l = {
    tag: e,
    majorVersion: o,
    minorVersion: s,
    numFonts: i
  };
  return o >= 2 && (l.dsigTag = a, l.dsigLength = c, l.dsigOffset = f), { collection: l, fonts: u };
}
function Wg(t, n, e) {
  const o = n.find((d) => d.tag === "head");
  if (!o)
    return n;
  const s = o.offset, i = e + o.offset, r = s + o.length <= t.byteLength, a = i + o.length <= t.byteLength;
  if (!r && a)
    return n.map((d) => ({
      ...d,
      offset: e + d.offset
    }));
  if (r && !a || !r && !a)
    return n;
  const c = So(
    Array.from(new Uint8Array(t, s, o.length))
  ), f = So(
    Array.from(new Uint8Array(t, i, o.length))
  ), u = c.magicNumber === 1594834165;
  return f.magicNumber === 1594834165 && !u ? n.map((d) => ({
    ...d,
    offset: e + d.offset
  })) : n;
}
function Xa(t) {
  return {
    sfVersion: t.uint32(),
    numTables: t.uint16(),
    searchRange: t.uint16(),
    entrySelector: t.uint16(),
    rangeShift: t.uint16()
  };
}
function Ka(t, n) {
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
function Ja(t, n) {
  const e = {}, o = new Map(n.map((a) => [a.tag, a])), s = Hg.filter((a) => o.has(a)), i = n.map((a) => a.tag).filter((a) => !s.includes(a)), r = [...s, ...i];
  for (const a of r) {
    const c = o.get(a), f = c.offset, u = new Uint8Array(t, f, c.length), l = Array.from(u), d = $g[a];
    d ? e[a] = {
      ...d(l, e),
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
const Yg = /* @__PURE__ */ new Set([
  "_dirty",
  "_fileName",
  "_originalBuffer",
  "_collection",
  "_collectionFonts",
  "_woff"
]);
function um(t, n = 2) {
  return JSON.stringify(
    t,
    function(e, o) {
      if (!(this === t && Yg.has(e)))
        return typeof o == "bigint" ? Number(o) : ArrayBuffer.isView(o) && !(o instanceof DataView) ? Array.from(o) : o;
    },
    n
  );
}
function lm(t) {
  return JSON.parse(t);
}
const qg = [
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
], Xg = ["CFF ", "CFF2", "VORG"], Kg = [
  "cvar",
  "cvt ",
  "fpgm",
  "gasp",
  "glyf",
  "gvar",
  "loca",
  "prep"
], Jg = /* @__PURE__ */ new Set([
  ...qg,
  ...Xg,
  ...Kg
]), Qg = [
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
function Qa(t) {
  return Number.isInteger(t) && t >= 0 && t <= 4294967295;
}
function tc(t) {
  return Array.isArray(t?._raw);
}
function F(t, n, e, o, s) {
  t.push({ severity: n, code: e, message: o, path: s });
}
function Zi(t) {
  const n = t > 0 ? 2 ** Math.floor(Math.log2(t)) : 0, e = n * 16, o = n > 0 ? Math.floor(Math.log2(n)) : 0, s = t * 16 - e;
  return { searchRange: e, entrySelector: o, rangeShift: s };
}
function ji(t) {
  return pt(t) && (t["CFF "] || t.CFF2) ? 1330926671 : 65536;
}
function Wi(t) {
  const n = t.filter((s) => s.severity === "error"), e = t.filter((s) => s.severity === "warning"), o = t.filter((s) => s.severity === "info");
  return {
    valid: n.length === 0,
    errors: n,
    warnings: e,
    infos: o,
    issues: t,
    summary: {
      errorCount: n.length,
      warningCount: e.length,
      infoCount: o.length,
      issueCount: t.length
    }
  };
}
function tm(t, n, e, o) {
  let s = t.header;
  if (!pt(s))
    if (pt(t._header))
      t.header = { ...t._header }, s = t.header, F(
        o,
        "info",
        "HEADER_PROMOTED",
        'No "header" found; promoted "_header" for export compatibility.',
        e
      );
    else {
      const a = ji(t.tables), c = Zi(n);
      t.header = {
        sfVersion: a,
        numTables: n,
        ...c
      }, s = t.header, F(
        o,
        "info",
        "HEADER_SYNTHESIZED",
        `No header found; synthesized one (sfVersion=0x${a.toString(16).toUpperCase().padStart(8, "0")}, ${n} tables).`,
        e
      );
      return;
    }
  if (!Qa(s.sfVersion)) {
    const a = ji(t.tables);
    s.sfVersion = a, F(
      o,
      "info",
      "HEADER_SFVERSION_INFERRED",
      `header.sfVersion was missing or invalid; set to 0x${a.toString(16).toUpperCase().padStart(8, "0")} based on outline tables.`,
      `${e}.sfVersion`
    );
  }
  if (s.numTables !== void 0 && (!Number.isInteger(s.numTables) || s.numTables < 0) && F(
    o,
    "error",
    "HEADER_NUMTABLES_INVALID",
    "header.numTables must be a non-negative integer when provided.",
    `${e}.numTables`
  ), s.numTables !== n) {
    const a = s.numTables;
    s.numTables = n, F(
      o,
      "info",
      "HEADER_NUMTABLES_CORRECTED",
      a === void 0 ? `header.numTables was missing; set to ${n}.` : `header.numTables corrected from ${a} to ${n}.`,
      `${e}.numTables`
    );
  }
  const i = Zi(n);
  (s.searchRange !== i.searchRange || s.entrySelector !== i.entrySelector || s.rangeShift !== i.rangeShift) && (s.searchRange = i.searchRange, s.entrySelector = i.entrySelector, s.rangeShift = i.rangeShift, F(
    o,
    "info",
    "HEADER_FIELDS_CORRECTED",
    `Header directory fields auto-corrected for ${n} tables (searchRange=${i.searchRange}, entrySelector=${i.entrySelector}, rangeShift=${i.rangeShift}).`,
    e
  ));
}
function nm(t, n, e) {
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
function em(t, n, e) {
  if (!pt(t))
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
    if (!pt(i)) {
      F(
        e,
        "error",
        "TABLE_DATA_INVALID",
        `Table "${s}" must be an object.`,
        r
      );
      continue;
    }
    i._checksum !== void 0 && !Qa(i._checksum) && F(
      e,
      "error",
      "TABLE_CHECKSUM_INVALID",
      `Table "${s}" _checksum must be uint32 when provided.`,
      `${r}._checksum`
    ), i._raw !== void 0 && nm(i._raw, `${r}._raw`, e);
    const a = Jg.has(s), c = tc(i);
    !c && !a ? F(
      e,
      "error",
      "TABLE_WRITER_UNSUPPORTED",
      `Table "${s}" is parsed JSON but no writer is available. Use _raw for unknown tables.`,
      r
    ) : c && !a && F(
      e,
      "info",
      "TABLE_UNRECOGNIZED_RAW",
      `Table "${s}" is not a recognized OpenType table; preserved via _raw bytes.`,
      r
    );
  }
  return o;
}
function om(t, n, e) {
  const o = (r) => t[r] !== void 0, s = (r) => o(r) && !tc(t[r]), i = (r, a, c = "requires") => {
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
function sm(t, n, e) {
  const o = (r) => t[r] !== void 0;
  for (const r of Qg)
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
function nc(t, n, e) {
  if (!pt(t)) {
    F(
      e,
      "error",
      "FONTDATA_INVALID",
      "Font data must be an object.",
      n
    );
    return;
  }
  const o = em(t.tables, `${n}.tables`, e);
  tm(t, o.length, `${n}.header`, e), pt(t.tables) && (sm(t.tables, `${n}.tables`, e), om(t.tables, `${n}.tables`, e));
}
function im(t, n, e) {
  const o = t.collection, s = t.fonts;
  if (pt(o) || F(
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
  pt(o) && o.numFonts !== void 0 && o.numFonts !== s.length && (o.numFonts = s.length, F(
    e,
    "info",
    "COLLECTION_NUMFONTS_CORRECTED",
    `collection.numFonts corrected to ${s.length} to match fonts array.`,
    `${n}.collection.numFonts`
  ));
  for (let i = 0; i < s.length; i++)
    nc(s[i], `${n}.fonts[${i}]`, e);
}
function hm(t) {
  const n = [];
  return pt(t) ? (t.collection !== void 0 || t.fonts !== void 0 ? im(t, "$", n) : nc(t, "$", n), Wi(n)) : (F(
    n,
    "error",
    "INPUT_INVALID",
    "validateJSON expects a font JSON object.",
    "$"
  ), Wi(n));
}
async function dm() {
  return mg();
}
export {
  rm as assembleCharString,
  vc as buildRawFromSimplified,
  qi as buildSimplified,
  lo as compileCharString,
  cm as contoursToSVGPath,
  fm as createGlyph,
  pc as disassembleCharString,
  am as exportFont,
  lm as fontFromJSON,
  um as fontToJSON,
  Hi as importFont,
  Zg as importFontTables,
  dm as initWoff2,
  hc as interpretCharString,
  Pg as svgPathToContours,
  hm as validateJSON
};
