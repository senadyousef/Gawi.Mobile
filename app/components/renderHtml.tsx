import React from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  Linking,
  TouchableOpacity,
} from 'react-native';

interface Theme {
  ink: string;
  background?: string;
  primary?: string;
  border?: string;
}

interface HtmlRendererProps {
  html: string;
  theme: Theme;
  baseStyle?: object;
  classStyles?: Record<string, object>;
}

// Extract .className { ... } rules from <style> blocks
function extractCssClasses(html: string): Record<string, object> {
  const map: Record<string, object> = {};
  const styleBlocks = [...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi)];
  for (const block of styleBlocks) {
    const ruleRegex = /\.([a-zA-Z0-9_-]+)\s*\{([^}]*)\}/g;
    let m;
    while ((m = ruleRegex.exec(block[1])) !== null) {
      const s = parseInlineStyle(m[2]);
      if (Object.keys(s).length) map[m[1]] = s;
    }
  }
  return map;
}

// Convert CSS property string to RN style object
function parseInlineStyle(style: string): Record<string, any> {
  const result: Record<string, any> = {};
  style.split(';').forEach((rule) => {
    const ci = rule.indexOf(':');
    if (ci === -1) return;
    const prop = rule.slice(0, ci).trim();
    const val = rule.slice(ci + 1).trim();
    if (!prop || !val) return;
    switch (prop) {
      case 'color':
        result.color = val;
        break;
      case 'background-color':
        result.backgroundColor = val;
        break;
      case 'background':
        if (!val.startsWith('url') && !val.startsWith('linear') && !val.startsWith('radial'))
          result.backgroundColor = val;
        break;
      case 'font-weight':
        result.fontWeight = val === 'bold' || Number(val) >= 600 ? '700' : '400';
        break;
      case 'font-style':
        result.fontStyle = val;
        break;
      case 'font-size':
        result.fontSize = parseInt(val, 10) || undefined;
        break;
      case 'text-align':
        result.textAlign = val;
        break;
      case 'text-decoration':
      case 'text-decoration-line':
        if (val.includes('underline')) result.textDecorationLine = 'underline';
        else if (val.includes('line-through')) result.textDecorationLine = 'line-through';
        break;
      case 'padding':
        result.padding = parseInt(val, 10) || undefined;
        break;
      case 'padding-top':
        result.paddingTop = parseInt(val, 10) || undefined;
        break;
      case 'padding-bottom':
        result.paddingBottom = parseInt(val, 10) || undefined;
        break;
      case 'padding-left':
        result.paddingLeft = parseInt(val, 10) || undefined;
        break;
      case 'padding-right':
        result.paddingRight = parseInt(val, 10) || undefined;
        break;
      case 'margin':
        result.margin = parseInt(val, 10) || undefined;
        break;
      case 'margin-top':
        result.marginTop = parseInt(val, 10) || undefined;
        break;
      case 'margin-bottom':
        result.marginBottom = parseInt(val, 10) || undefined;
        break;
      case 'border-radius':
        result.borderRadius = parseInt(val, 10) || undefined;
        break;
      case 'opacity':
        result.opacity = parseFloat(val) || undefined;
        break;
      case 'width':
        if (val.endsWith('px')) result.width = parseInt(val, 10);
        break;
      case 'height':
        if (val.endsWith('px')) result.height = parseInt(val, 10);
        break;
    }
  });
  return result;
}

// Map Quill CSS classes to RN styles
function quillClassStyle(className: string): Record<string, any> | null {
  if (className === 'ql-align-center')  return { textAlign: 'center' };
  if (className === 'ql-align-right')   return { textAlign: 'right' };
  if (className === 'ql-align-justify') return { textAlign: 'justify' };
  if (className === 'ql-direction-rtl') return { writingDirection: 'rtl', textAlign: 'right' };
  if (className === 'ql-size-small')    return { fontSize: 12 };
  if (className === 'ql-size-large')    return { fontSize: 20 };
  if (className === 'ql-size-huge')     return { fontSize: 26 };
  if (className === 'ql-font-serif')    return { fontFamily: 'Georgia' };
  if (className === 'ql-font-monospace')return { fontFamily: 'Courier New' };
  const indent = className.match(/^ql-indent-(\d)$/);
  if (indent) return { paddingLeft: parseInt(indent[1], 10) * 28 };
  return null;
}

interface HtmlNode {
  type: 'element' | 'text';
  tag?: string;
  attrs?: Record<string, string>;
  children?: HtmlNode[];
  text?: string;
}

function parseHtml(html: string): HtmlNode[] {
  let i = 0;

  function parseAttrs(s: string): Record<string, string> {
    const attrs: Record<string, string> = {};
    const re = /(\w[\w-]*)(?:=(?:"([^"]*)"|'([^']*)'|(\S+)))?/g;
    let m;
    while ((m = re.exec(s)) !== null) attrs[m[1]] = m[2] ?? m[3] ?? m[4] ?? 'true';
    return attrs;
  }

  function parseNodes(): HtmlNode[] {
    const result: HtmlNode[] = [];
    while (i < html.length) {
      if (html[i] === '<') {
        if (html.slice(i, i + 4) === '<!--') {
          const c = html.indexOf('-->', i);
          i = c === -1 ? html.length : c + 3;
          continue;
        }
        const close = html.slice(i).match(/^<\/(\w+)\s*>/);
        if (close) { i += close[0].length; return result; }
        const open = html.slice(i).match(/^<(\w+)([^>]*?)(\/?)>/);
        if (open) {
          const tag = open[1].toLowerCase();
          const attrs = parseAttrs(open[2].trim());
          const self = open[3] === '/' || /^(br|hr|img|input|meta|link)$/.test(tag);
          i += open[0].length;
          const node: HtmlNode = { type: 'element', tag, attrs, children: [] };
          if (!self) node.children = parseNodes();
          result.push(node);
          continue;
        }
        i++;
      } else {
        const next = html.indexOf('<', i);
        const raw = next === -1 ? html.slice(i) : html.slice(i, next);
        const text = raw
          .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
          .replace(/&nbsp;/g, ' ').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
        if (text.trim()) result.push({ type: 'text', text });
        i = next === -1 ? html.length : next;
      }
    }
    return result;
  }
  return parseNodes();
}

// Context carries inherited color + background from parent spans
interface Ctx {
  theme: Theme;
  cssClasses: Record<string, object>;
  color?: string;     // inherited text color
  bg?: string;        // inherited background color
}

let _key = 0;
const k = () => String(_key++);

function resolveClasses(classAttr: string | undefined, ctx: Ctx): Record<string, any> {
  if (!classAttr) return {};
  return classAttr.split(/\s+/).filter(Boolean).reduce<Record<string, any>>((acc, cls) => ({
    ...acc,
    ...(quillClassStyle(cls) ?? {}),
    ...(ctx.cssClasses[cls] ?? {}),
  }), {});
}

// Returns merged style + what new inherited colors this node introduces
function getStyle(attrs: Record<string, string>, ctx: Ctx): Record<string, any> {
  return {
    ...(ctx.color ? { color: ctx.color } : {}),           // inherited first (lowest priority)
    ...(ctx.bg    ? { backgroundColor: ctx.bg } : {}),
    ...resolveClasses(attrs.class, ctx),                   // class overrides inherited
    ...parseInlineStyle(attrs.style ?? ''),                // inline style is highest priority
  };
}

// Push new color/bg into ctx so children inherit them
function childCtx(cs: Record<string, any>, ctx: Ctx): Ctx {
  return {
    ...ctx,
    ...(cs.color           ? { color: cs.color } : {}),
    ...(cs.backgroundColor ? { bg: cs.backgroundColor } : {}),
  };
}

type S = ReturnType<typeof makeStyles>;

function renderNodes(ns: HtmlNode[], ctx: Ctx, s: S): React.ReactNode[] {
  return ns.map(n => renderNode(n, ctx, s));
}

function renderNode(n: HtmlNode, ctx: Ctx, s: S): React.ReactNode {
  // Text node — apply inherited color + background from parent spans
  if (n.type === 'text') {
    if (!n.text?.trim() && !n.text?.includes(' ')) return null;
    const inherited: Record<string, any> = {};
    if (ctx.color) inherited.color           = ctx.color;
    if (ctx.bg)    inherited.backgroundColor = ctx.bg;
    return (
      <Text key={k()} style={[s.base, inherited]}>
        {n.text}
      </Text>
    );
  }

  const { tag, attrs = {}, children = [] } = n;
  const cs  = getStyle(attrs, ctx);
  const cCtx = childCtx(cs, ctx);  // ctx to pass into children

  switch (tag) {

    // Block elements
    case 'p':
      return (
        <Text key={k()} style={[s.base, s.p, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 'h1':
      return <Text key={k()} style={[s.base, s.h1, cs]}>{renderNodes(children, cCtx, s)}</Text>;
    case 'h2':
      return <Text key={k()} style={[s.base, s.h2, cs]}>{renderNodes(children, cCtx, s)}</Text>;
    case 'h3':
      return <Text key={k()} style={[s.base, s.h3, cs]}>{renderNodes(children, cCtx, s)}</Text>;
    case 'h4':
    case 'h5':
    case 'h6':
      return <Text key={k()} style={[s.base, s.h4, cs]}>{renderNodes(children, cCtx, s)}</Text>;

    case 'ol':
      return (
        <View key={k()} style={[s.list, cs]}>
          {children.filter(c => c.tag === 'li').map((li, i) => (
            <View key={i} style={s.listRow}>
              <Text style={[s.base, s.bullet]}>{i + 1}.</Text>
              <Text style={[s.base, s.listText, getStyle(li.attrs ?? {}, ctx)]}>
                {renderNodes(li.children ?? [], cCtx, s)}
              </Text>
            </View>
          ))}
        </View>
      );

    case 'ul':
      return (
        <View key={k()} style={[s.list, cs]}>
          {children.filter(c => c.tag === 'li').map((li, i) => (
            <View key={i} style={s.listRow}>
              <Text style={[s.base, s.bullet]}>•</Text>
              <Text style={[s.base, s.listText, getStyle(li.attrs ?? {}, ctx)]}>
                {renderNodes(li.children ?? [], cCtx, s)}
              </Text>
            </View>
          ))}
        </View>
      );

    case 'blockquote':
      return (
        <View key={k()} style={[s.blockquote, cs]}>
          {renderNodes(children, cCtx, s)}
        </View>
      );

    case 'pre':
      return (
        <View key={k()} style={[s.codeBlock, cs]}>
          <Text style={[s.base, s.codeText]}>
            {renderNodes(children, cCtx, s)}
          </Text>
        </View>
      );

    case 'hr':
      return <View key={k()} style={[s.hr, cs]} />;

    case 'br':
      return <Text key={k()}>{'\n'}</Text>;

    case 'div':
    case 'section':
    case 'article':
    case 'main':
    case 'figure':
      return (
        <View key={k()} style={[s.block, cs]}>
          {renderNodes(children, cCtx, s)}
        </View>
      );

    // Inline elements
    case 'strong':
    case 'b':
      return (
        <Text key={k()} style={[s.base, s.bold, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 'em':
    case 'i':
      return (
        <Text key={k()} style={[s.base, s.italic, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 'u':
      return (
        <Text key={k()} style={[s.base, s.underline, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 's':
    case 'del':
      return (
        <Text key={k()} style={[s.base, s.strike, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 'sup':
      return (
        <Text key={k()} style={[s.base, s.sup, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 'sub':
      return (
        <Text key={k()} style={[s.base, s.sub, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 'code':
      return (
        <Text key={k()} style={[s.base, s.inlineCode, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    // Quill color spans — e.g. <span style="color: red; background-color: yellow">
    case 'span':
      return (
        <Text key={k()} style={[s.base, cs]}>
          {renderNodes(children, cCtx, s)}
        </Text>
      );

    case 'font': {
      // legacy <font color="red">
      const color = attrs.color ?? cs.color;
      const finalStyle = { ...cs, ...(color ? { color } : {}) };
      return (
        <Text key={k()} style={[s.base, finalStyle]}>
          {renderNodes(children, childCtx(finalStyle, ctx), s)}
        </Text>
      );
    }

    case 'a': {
      const href = attrs.href ?? '';
      return (
        <TouchableOpacity key={k()} onPress={() => href && Linking.openURL(href)}>
          <Text style={[s.base, s.link, cs]}>
            {renderNodes(children, cCtx, s)}
          </Text>
        </TouchableOpacity>
      );
    }

    case 'img': {
      const src = attrs.src ?? '';
      if (!src) return null;
      const w = attrs.width ? Number(attrs.width) : undefined;
      const h = attrs.height ? Number(attrs.height) : undefined;
      return (
        <Image
          key={k()}
          source={{ uri: src }}
          style={[s.image, w && h ? { width: w, height: h } : undefined, cs]}
          resizeMode="contain"
          accessibilityLabel={attrs.alt ?? ''}
        />
      );
    }

    case 'table':
      return <TableBlock key={k()} n={n} ctx={ctx} s={s} />;

    case 'script':
    case 'style':
    case 'head':
    case 'meta':
    case 'link':
    case 'noscript':
      return null;

    default:
      return (
        <View key={k()} style={cs}>
          {renderNodes(children, cCtx, s)}
        </View>
      );
  }
}

function TableBlock({ n, ctx, s }: { n: HtmlNode; ctx: Ctx; s: S }) {
  const rows: HtmlNode[][] = [];
  function collect(x: HtmlNode) {
    if (x.tag === 'tr') rows.push(x.children?.filter(c => c.tag === 'td' || c.tag === 'th') ?? []);
    x.children?.forEach(collect);
  }
  collect(n);
  return (
    <View style={s.table}>
      {rows.map((row, ri) => (
        <View key={ri} style={[s.tableRow, ri === 0 && s.tableHead]}>
          {row.map((cell, ci) => (
            <View key={ci} style={[s.tableCell, getStyle(cell.attrs ?? {}, ctx)]}>
              <Text style={[s.base, ri === 0 && s.bold]}>
                {renderNodes(cell.children ?? [], ctx, s)}
              </Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

function makeStyles(theme: Theme, baseStyle?: object) {
  const ink     = theme.ink     ?? '#000';
  const primary = theme.primary ?? '#007AFF';
  const border  = theme.border  ?? '#E0E0E0';

  return StyleSheet.create({
    container:  { flex: 1 },
    base:       { color: ink, fontSize: 15, lineHeight: 22, ...(baseStyle as any) },
    block:      { marginBottom: 4 },
    p:          { marginBottom: 8 },
    h1:         { fontSize: 26, fontWeight: '700', marginBottom: 12, lineHeight: 34 },
    h2:         { fontSize: 22, fontWeight: '700', marginBottom: 10, lineHeight: 30 },
    h3:         { fontSize: 18, fontWeight: '600', marginBottom: 8,  lineHeight: 26 },
    h4:         { fontSize: 16, fontWeight: '600', marginBottom: 6,  lineHeight: 24 },
    bold:       { fontWeight: '700' },
    italic:     { fontStyle: 'italic' },
    underline:  { textDecorationLine: 'underline' },
    strike:     { textDecorationLine: 'line-through' },
    sup:        { fontSize: 11, lineHeight: 16 },
    sub:        { fontSize: 11, lineHeight: 16 },
    inlineCode: { fontFamily: 'Courier New', fontSize: 13, backgroundColor: `${ink}12`, paddingHorizontal: 4, borderRadius: 3 },
    codeBlock:  { backgroundColor: `${ink}08`, borderRadius: 6, padding: 12, marginVertical: 8 },
    codeText:   { fontFamily: 'Courier New', fontSize: 13, color: ink },
    blockquote: { borderLeftWidth: 3, borderLeftColor: primary, paddingLeft: 12, marginVertical: 8, opacity: 0.85 },
    hr:         { height: 1, backgroundColor: border, marginVertical: 12 },
    link:       { color: primary, textDecorationLine: 'underline' },
    list:       { marginBottom: 8 },
    listRow:    { flexDirection: 'row', marginBottom: 4, alignItems: 'flex-start' },
    bullet:     { width: 22, marginTop: 1, color: ink },
    listText:   { flex: 1 },
    image:      { width: '100%', height: 200, marginVertical: 8, borderRadius: 8 },
    table:      { borderWidth: 1, borderColor: border, borderRadius: 8, marginVertical: 8, overflow: 'hidden' },
    tableRow:   { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: border },
    tableHead:  { backgroundColor: `${ink}08` },
    tableCell:  { flex: 1, padding: 8, borderRightWidth: 1, borderRightColor: border },
  });
}

export default function HtmlRenderer({ html, theme, baseStyle, classStyles }: HtmlRendererProps) {
  const s = makeStyles(theme, baseStyle);

  const body = html
    .replace(/<html[^>]*>/gi, '')
    .replace(/<\/html>/gi, '')
    .replace(/<head[\s\S]*?<\/head>/gi, '')
    .replace(/<body[^>]*>/gi, '')
    .replace(/<\/body>/gi, '')
    .trim();

  const cssClasses: Record<string, object> = {
    ...extractCssClasses(html),
    ...(classStyles ?? {}),
  };

  const ctx: Ctx = { theme, cssClasses };
  const parsed = parseHtml(body);

  return (
    <ScrollView
      style={s.container}
      contentContainerStyle={{ padding: 4 }}
      showsVerticalScrollIndicator={false}
    >
      {renderNodes(parsed, ctx, s)}
    </ScrollView>
  );
}