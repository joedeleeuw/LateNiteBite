import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "assets/source/mark.svg");
const TARGET = path.join(ROOT, "src/splash/BulbMark.tsx");
const GROUPS = [
  ["glow", "GlowShapes", "BulbGlow"],
  ["body", "BodyShapes", "BulbBody"],
  ["sheen", "SheenShapes", "SheenLayer"],
  ["mouse", "MouseShapes", "MouseLayer"],
];
const IMPORTS = [
  "Circle",
  "Defs",
  "Ellipse",
  "Path",
  "RadialGradient",
  "Stop",
];
const COMPONENT_NAMES = new Map([
  ["circle", "Circle"],
  ["defs", "Defs"],
  ["ellipse", "Ellipse"],
  ["path", "Path"],
  ["radialGradient", "RadialGradient"],
  ["stop", "Stop"],
]);

function parseAttributes(input) {
  const attrs = [];
  const pattern = /([A-Za-z_:][A-Za-z0-9_:.-]*)\s*=\s*(["'])(.*?)\2/g;
  let match = pattern.exec(input);

  while (match) {
    attrs.push([match[1], match[3]]);
    match = pattern.exec(input);
  }

  return attrs;
}

function parseXml(source) {
  const root = { name: "root", attrs: [], children: [] };
  const stack = [root];
  const tokens = source.match(/<[^>]+>/g) ?? [];

  for (const token of tokens) {
    if (token.startsWith("<?") || token.startsWith("<!")) {
      continue;
    }

    if (token.startsWith("</")) {
      const name = token.slice(2, -1).trim();
      const current = stack.pop();

      if (!current || current.name !== name) {
        throw new Error(`unexpected closing tag: ${name}`);
      }

      continue;
    }

    const selfClosing = token.endsWith("/>");
    const content = token.slice(1, selfClosing ? -2 : -1).trim();
    const nameMatch = /^([^\s/>]+)/.exec(content);

    if (!nameMatch) {
      throw new Error(`bad tag: ${token}`);
    }

    const name = nameMatch[1];
    const attrs = parseAttributes(content.slice(name.length));
    const node = { name, attrs, children: [] };
    stack.at(-1)?.children.push(node);

    if (!selfClosing) {
      stack.push(node);
    }
  }

  if (stack.length !== 1) {
    throw new Error("unclosed svg tag");
  }

  const svg = root.children[0];

  if (!svg || svg.name !== "svg") {
    throw new Error("mark source must contain one svg root");
  }

  return svg;
}

function attrValue(attrs, name) {
  return attrs.find(([attrName]) => attrName === name)?.[1];
}

function toPropName(name) {
  return name.replace(/[-:]([a-z])/g, (_, letter) => letter.toUpperCase());
}

function formatProps(attrs) {
  const props = attrs
    .filter(([name]) => name !== "xmlns")
    .map(([name, value]) => `${toPropName(name)}=${JSON.stringify(value)}`);

  return props.length ? ` ${props.join(" ")}` : "";
}

function formatElement(node, depth) {
  const component = COMPONENT_NAMES.get(node.name);

  if (!component) {
    throw new Error(`unsupported svg element: ${node.name}`);
  }

  const pad = " ".repeat(depth);
  const props = formatProps(node.attrs);

  if (node.children.length === 0) {
    return `${pad}<${component}${props} />`;
  }

  return [
    `${pad}<${component}${props}>`,
    ...node.children.map((child) => formatElement(child, depth + 2)),
    `${pad}</${component}>`,
  ].join("\n");
}

function findGroup(svg, id) {
  const group = svg.children.find(
    (child) => child.name === "g" && attrValue(child.attrs, "id") === id,
  );

  if (!group) {
    throw new Error(`missing group: ${id}`);
  }

  return group;
}

function emitShapeFunction(name, group) {
  return [
    `function ${name}() {`,
    "  return (",
    "    <>",
    ...group.children.map((child) => formatElement(child, 6)),
    "    </>",
    "  );",
    "}",
  ].join("\n");
}

function emitLayerExport(name, shapeName, svgProps) {
  return [
    `export function ${name}({ width = 200, height = 300 }: MarkProps) {`,
    "  return (",
    `    <Svg width={width} height={height}${svgProps}>`,
    `      <${shapeName} />`,
    "    </Svg>",
    "  );",
    "}",
  ].join("\n");
}

function emitBulbMark(svgProps) {
  return [
    "export function BulbMark({ width = 200, height = 300 }: MarkProps) {",
    "  return (",
    `    <Svg width={width} height={height}${svgProps}>`,
    ...GROUPS.map(([, shapeName]) => `      <${shapeName} />`),
    "    </Svg>",
    "  );",
    "}",
  ].join("\n");
}

function emit(svg) {
  const svgProps = formatProps(svg.attrs);
  const groups = GROUPS.map(([groupId, shapeName, exportName]) => ({
    group: findGroup(svg, groupId),
    shapeName,
    exportName,
  }));

  return [
    "// generated from assets/source/mark.svg",
    "import Svg, {",
    ...IMPORTS.map((name) => `  ${name},`),
    '} from "react-native-svg";',
    "",
    "type MarkProps = {",
    "  width?: number;",
    "  height?: number;",
    "};",
    "",
    ...groups.flatMap(({ group, shapeName }) => [
      emitShapeFunction(shapeName, group),
      "",
    ]),
    ...groups.flatMap(({ exportName, shapeName }) => [
      emitLayerExport(exportName, shapeName, svgProps),
      "",
    ]),
    emitBulbMark(svgProps),
    "",
  ].join("\n");
}

const source = await readFile(SOURCE, "utf8");
const svg = parseXml(source);
const output = emit(svg);

await writeFile(TARGET, output);
console.log("generated: src/splash/BulbMark.tsx");
