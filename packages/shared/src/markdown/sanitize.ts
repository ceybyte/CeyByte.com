import { defaultSchema, type Options } from "rehype-sanitize";

// Filter out existing restrictive className tuples from defaultSchema
const baseA = (defaultSchema.attributes?.a || []).filter(
  (attr) => (typeof attr === "string" ? attr : attr[0]) !== "className",
);

const baseCode = (defaultSchema.attributes?.code || []).filter(
  (attr) => (typeof attr === "string" ? attr : attr[0]) !== "className",
);

export const markdownSanitizeSchema: Options = {
  ...defaultSchema,
  clobberPrefix: "",
  tagNames: [...(defaultSchema.tagNames || []), "aside", "div", "span", "section", "nav", "svg", "path"],
  attributes: {
    ...defaultSchema.attributes,
    "*": [
      ...(defaultSchema.attributes?.["*"] || []),
      "className",
      "id",
      "role",
      "ariaHidden",
      "ariaLabel",
      "ariaLabelledby",
      "tabIndex",
    ],
    a: [...baseA, "target", "rel", "className"],
    code: [...baseCode, "className", "style"],
    pre: [...(defaultSchema.attributes?.pre || []), "className", "style"],
    span: ["className", "style"],
    svg: [
      "xmlns",
      "viewBox",
      "width",
      "height",
      "fill",
      "stroke",
      "strokeWidth",
      "strokeLinecap",
      "strokeLinejoin",
      "className",
      "ariaHidden",
    ],
    path: ["d", "fill", "stroke", "strokeWidth", "strokeLinecap", "strokeLinejoin"],
  },
};
