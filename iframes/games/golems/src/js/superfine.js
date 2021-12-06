// var e = {},
//   l = [],
//   t = e => (null == e ? e : e.key),
//   r = function (e) {
//     this.tag[e.type](e);
//   },
//   o = (e, l, t, o, n) => {
//     'key' === l ||
//       ('o' === l[0] && 'n' === l[1]
//         ? ((e.tag || (e.tag = {}))[(l = l.slice(2))] = o) //eslint-disable-line
//           ? t || e.addEventListener(l, r)
//           : e.removeEventListener(l, r)
//         : !n && 'list' !== l && 'form' !== l && l in e
//         ? (e[l] = null == o ? '' : o)
//         : null == o || !1 === o
//         ? e.removeAttribute(l)
//         : e.setAttribute(l, o));
//   },
//   n = (e, l) => {
//     var t = e.props,
//       r =
//         3 === e.tag
//           ? document.createTextNode(e.type)
//           : (l = l || 'svg' === e.type) //eslint-disable-line
//           ? document.createElementNS('http://www.w3.org/2000/svg', e.type, {
//               is: t.is,
//             })
//           : document.createElement(e.type, { is: t.is });
//     for (var d in t) o(r, d, null, t[d], l);
//     return e.children.map(e => r.appendChild(n((e = i(e)), l))), (e.dom = r);
//   },
//   d = (e, l, r, a, u) => {
//     if (r === a);
//     else if (null != r && 3 === r.tag && 3 === a.tag)
//       r.type !== a.type && (l.nodeValue = a.type);
//     else if (null == r || r.type !== a.type)
//       (l = e.insertBefore(n((a = i(a)), u), l)),
//         null != r && e.removeChild(r.dom);
//     else {
//       var m,
//         p,
//         s,
//         v,
//         f = r.props,
//         y = a.props,
//         c = r.children,
//         h = a.children,
//         g = 0,
//         x = 0,
//         C = c.length - 1,
//         k = h.length - 1;
//       for (var w in ((u = u || 'svg' === a.type), { ...f, ...y }))
//         ('value' === w || 'selected' === w || 'checked' === w ? l[w] : f[w]) !==
//           y[w] && o(l, w, f[w], y[w], u);
//       for (; x <= k && g <= C && null != (s = t(c[g])) && s === t(h[x]); )
//         d(l, c[g].dom, c[g++], (h[x] = i(h[x++])), u);
//       for (; x <= k && g <= C && null != (s = t(c[C])) && s === t(h[k]); )
//         d(l, c[C].dom, c[C--], (h[k] = i(h[k--])), u);
//       if (g > C)
//         for (; x <= k; )
//           l.insertBefore(n((h[x] = i(h[x++])), u), (p = c[g]) && p.dom);
//       else if (x > k) for (; g <= C; ) l.removeChild(c[g++].dom);
//       else {
//         var N = {},
//           A = {};
//         for (w = g; w <= C; w++) null != (s = c[w].key) && (N[s] = c[w]);
//         for (; x <= k; )
//           (s = t((p = c[g]))),
//             (v = t((h[x] = i(h[x])))),
//             A[s] || (null != v && v === t(c[g + 1]))
//               ? (null == s && l.removeChild(p.dom), g++)
//               : null == v || 1 === r.tag
//               ? (null == s && (d(l, p && p.dom, p, h[x], u), x++), g++)
//               : (s === v
//                   ? (d(l, p.dom, p, h[x], u), (A[v] = !0), g++)
//                   : null != (m = N[v])
//                   ? (d(l, l.insertBefore(m.dom, p && p.dom), m, h[x], u),
//                     (A[v] = !0))
//                   : d(l, p && p.dom, null, h[x], u),
//                 x++);
//         for (; g <= C; ) null == t((p = c[g++])) && l.removeChild(p.dom);
//         for (var w in N) null == A[w] && l.removeChild(N[w].dom); //eslint-disable-line
//       }
//     }
//     return (a.dom = l);
//   },
//   i = e => (!0 !== e && !1 !== e && e ? e : text('')),
//   a = t =>
//     3 === t.nodeType
//       ? text(t.nodeValue, t)
//       : u(t.nodeName.toLowerCase(), e, l.map.call(t.childNodes, a), t, null, 1),
//   u = (e, l, t, r, o, n) => ({
//     type: e,
//     props: l,
//     children: t,
//     dom: r,
//     key: o,
//     tag: n,
//   });
// var text = (t, r) => u(t, e, l, r, null, 3);
// const G_superfine_text = text;
// var h = (e, t, r) =>
//   u(e, t, Array.isArray(r) ? r : null == r ? l : [r], null, t.key);
// const G_superfine_h = h;
// /*eslint-disable-line no-unused-vars*/ var patch = (e, l) => (
//   ((e = d(e.parentNode, e, e.v || a(e), l)).v = l), e
// );

var SSR_NODE = 1,
  TEXT_NODE = 3,
  EMPTY_OBJ = {},
  EMPTY_ARR = [],
  SVG_NS = '';

var listener = function (event) {
  this.events[event.type](event);
};

var getKey = vdom => (vdom == null ? vdom : vdom.key);

var patchProperty = (node, key, oldValue, newValue, isSvg) => {
  if (key === 'key') {
  } else if (key[0] === 'o' && key[1] === 'n') {
    if (
      !((node.events || (node.events = {}))[(key = key.slice(2))] = newValue)
    ) {
      node.removeEventListener(key, listener);
    } else if (!oldValue) {
      node.addEventListener(key, listener);
    }
  } else if (!isSvg && key !== 'list' && key !== 'form' && key in node) {
    node[key] = newValue == null ? '' : newValue;
  } else if (newValue == null || newValue === false) {
    node.removeAttribute(key);
  } else {
    node.setAttribute(key, newValue);
  }
};

var createNode = (vdom, isSvg) => {
  var props = vdom.props,
    node =
      vdom.type === TEXT_NODE
        ? document.createTextNode(vdom.tag)
        : document.createElement(vdom.tag, { is: props.is });

  for (var k in props) {
    patchProperty(node, k, null, props[k], isSvg);
  }

  for (var i = 0; i < vdom.children.length; i++) {
    node.appendChild(
      createNode((vdom.children[i] = vdomify(vdom.children[i])), isSvg)
    );
  }

  return (vdom.node = node);
};

var patchNode = (parent, node, oldVNode, newVNode, isSvg) => {
  if (oldVNode === newVNode) {
  } else if (
    oldVNode != null &&
    oldVNode.type === TEXT_NODE &&
    newVNode.type === TEXT_NODE
  ) {
    if (oldVNode.tag !== newVNode.tag) node.nodeValue = newVNode.tag;
  } else if (oldVNode == null || oldVNode.tag !== newVNode.tag) {
    node = parent.insertBefore(
      createNode((newVNode = vdomify(newVNode)), isSvg),
      node
    );
    if (oldVNode != null) {
      parent.removeChild(oldVNode.node);
    }
  } else {
    var tmpVKid,
      oldVKid,
      oldKey,
      newKey,
      oldProps = oldVNode.props,
      newProps = newVNode.props,
      oldVKids = oldVNode.children,
      newVKids = newVNode.children,
      oldHead = 0,
      newHead = 0,
      oldTail = oldVKids.length - 1,
      newTail = newVKids.length - 1;

    isSvg = isSvg || newVNode.tag === 'svg';

    for (var i in { ...oldProps, ...newProps }) {
      if (
        (i === 'value' || i === 'selected' || i === 'checked'
          ? node[i]
          : oldProps[i]) !== newProps[i]
      ) {
        patchProperty(node, i, oldProps[i], newProps[i], isSvg);
      }
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldHead])) == null ||
        oldKey !== getKey(newVKids[newHead])
      ) {
        break;
      }

      patchNode(
        node,
        oldVKids[oldHead].node,
        oldVKids[oldHead++],
        (newVKids[newHead] = vdomify(newVKids[newHead++])),
        isSvg
      );
    }

    while (newHead <= newTail && oldHead <= oldTail) {
      if (
        (oldKey = getKey(oldVKids[oldTail])) == null ||
        oldKey !== getKey(newVKids[newTail])
      ) {
        break;
      }

      patchNode(
        node,
        oldVKids[oldTail].node,
        oldVKids[oldTail--],
        (newVKids[newTail] = vdomify(newVKids[newTail--])),
        isSvg
      );
    }

    if (oldHead > oldTail) {
      while (newHead <= newTail) {
        node.insertBefore(
          createNode((newVKids[newHead] = vdomify(newVKids[newHead++])), isSvg),
          (oldVKid = oldVKids[oldHead]) && oldVKid.node
        );
      }
    } else if (newHead > newTail) {
      while (oldHead <= oldTail) {
        node.removeChild(oldVKids[oldHead++].node);
      }
    } else {
      for (var keyed = {}, newKeyed = {}, i = oldHead; i <= oldTail; i++) {
        if ((oldKey = oldVKids[i].key) != null) {
          keyed[oldKey] = oldVKids[i];
        }
      }

      while (newHead <= newTail) {
        oldKey = getKey((oldVKid = oldVKids[oldHead]));
        newKey = getKey((newVKids[newHead] = vdomify(newVKids[newHead])));

        if (
          newKeyed[oldKey] ||
          (newKey != null && newKey === getKey(oldVKids[oldHead + 1]))
        ) {
          if (oldKey == null) {
            node.removeChild(oldVKid.node);
          }
          oldHead++;
          continue;
        }

        if (newKey == null || oldVNode.type === SSR_NODE) {
          if (oldKey == null) {
            patchNode(
              node,
              oldVKid && oldVKid.node,
              oldVKid,
              newVKids[newHead],
              isSvg
            );
            newHead++;
          }
          oldHead++;
        } else {
          if (oldKey === newKey) {
            patchNode(node, oldVKid.node, oldVKid, newVKids[newHead], isSvg);
            newKeyed[newKey] = true;
            oldHead++;
          } else {
            if ((tmpVKid = keyed[newKey]) != null) {
              patchNode(
                node,
                node.insertBefore(tmpVKid.node, oldVKid && oldVKid.node),
                tmpVKid,
                newVKids[newHead],
                isSvg
              );
              newKeyed[newKey] = true;
            } else {
              patchNode(
                node,
                oldVKid && oldVKid.node,
                null,
                newVKids[newHead],
                isSvg
              );
            }
          }
          newHead++;
        }
      }

      while (oldHead <= oldTail) {
        if (getKey((oldVKid = oldVKids[oldHead++])) == null) {
          node.removeChild(oldVKid.node);
        }
      }

      for (var i in keyed) {
        if (newKeyed[i] == null) {
          node.removeChild(keyed[i].node);
        }
      }
    }
  }

  return (newVNode.node = node);
};

var vdomify = newVNode =>
  newVNode !== true && newVNode !== false && newVNode ? newVNode : text('');

var recycleNode = node =>
  node.nodeType === TEXT_NODE
    ? text(node.nodeValue, node)
    : createVNode(
        node.nodeName.toLowerCase(),
        EMPTY_OBJ,
        EMPTY_ARR.map.call(node.childNodes, recycleNode),
        SSR_NODE,
        node
      );

var createVNode = (tag, props, children, type, node) => ({
  tag,
  props,
  key: props.key,
  children,
  type,
  node,
});

var text = (value, node) =>
  createVNode(value, EMPTY_OBJ, EMPTY_ARR, TEXT_NODE, node);

var h = (tag, props, children = EMPTY_ARR) =>
  createVNode(tag, props, Array.isArray(children) ? children : [children]);

var patch = (node, vdom) => (
  ((node = patchNode(
    node.parentNode,
    node,
    node.vdom || recycleNode(node),
    vdom
  )).vdom = vdom),
  node
);

const G_superfine_text = text;
// var h = (e, t, r) =>
//   u(e, t, Array.isArray(r) ? r : null == r ? l : [r], null, t.key);
const G_superfine_h = h;
// /*eslint-disable-line no-unused-vars*/ var patch = (e, l) => (
//   ((e = d(e.parentNode, e, e.v || a(e), l)).v = l), e
// );
