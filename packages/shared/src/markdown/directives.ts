import { visit } from "unist-util-visit";
import type { Root, RootContent } from "mdast";
import type { ContainerDirective } from "mdast-util-directive";

export const TAX_DISCLAIMERS = {
  en: "CeyByte POS generates sales reports to assist your tax filing. We are NOT registered tax agents or certified by Inland Revenue Department (IRD). Consult an accountant for certified tax advice.",
  si: "CeyByte POS ඔබගේ බදු වාර්තාකරණයට සහාය වීම සඳහා විකුණුම් වාර්තා සකස් කරයි. අප දේශීය ආදායම් දෙපාර්තමේන්තුව (IRD) විසින් සහතික කරන ලද බදු නියෝජිතයන් නොවේ. සහතික කළ බදු උපදෙස් සඳහා ගණකාධිකාරීවරයෙකුගෙන් විමසන්න.",
  ta: "CeyByte POS உங்கள் வரி தாக்கலுக்கு உதව விற்பனை அறிக்கைகளை உருவாக்குகிறது. நாங்கள் உள்நாட்டு இறைவரித் திணைக்களத்தால் (IRD) சான்றளிக்கப்பட்ட வரி முகவர்கள் அல்ல. சான்றளிக்கப்பட்ட வரி ஆலோசனைக்கு கணக்காளரை அணுகவும்.",
} as const;

const CALLOUT_NAMES = new Set(["note", "tip", "important", "warning", "caution", "disclaimer"]);

const CALLOUT_TITLES: Record<string, string> = {
  note: "Note",
  tip: "Tip",
  important: "Important",
  warning: "Warning",
  caution: "Caution",
  disclaimer: "Disclaimer",
};

export type DirectivePluginOptions = {
  autoTaxDisclaimer?: boolean;
  locale?: string;
};

export function remarkDirectivesPlugin(options: DirectivePluginOptions = {}) {
  const { autoTaxDisclaimer = false, locale = "en" } = options;

  return (tree: Root) => {
    // 1. If autoTaxDisclaimer is requested, prepend a disclaimer directive node
    if (autoTaxDisclaimer) {
      const disclaimerText = TAX_DISCLAIMERS[locale as keyof typeof TAX_DISCLAIMERS] || TAX_DISCLAIMERS.en;

      const disclaimerNode: ContainerDirective = {
        type: "containerDirective",
        name: "disclaimer",
        attributes: { title: "Tax Disclaimer" },
        children: [
          {
            type: "paragraph",
            children: [
              {
                type: "text",
                value: disclaimerText,
              },
            ],
          },
        ],
      };

      tree.children.unshift(disclaimerNode as unknown as RootContent);
    }

    // 2. Transform directives into HAST representation
    visit(tree, (rawNode: unknown) => {
      const node = rawNode as {
        type: string;
        name?: string;
        attributes?: Record<string, string>;
        data?: Record<string, unknown>;
        children?: unknown[];
      };

      if (
        node.type !== "containerDirective" &&
        node.type !== "leafDirective" &&
        node.type !== "textDirective"
      ) {
        return;
      }

      const name = (node.name || "").toLowerCase();
      const attributes = node.attributes || {};

      if (CALLOUT_NAMES.has(name) || name === "callout") {
        let typeName = name;
        if (name === "callout") {
          const t = (attributes.type || "note").toLowerCase();
          typeName = t === "warn" ? "warning" : t === "danger" ? "caution" : t;
        }
        const title =
          attributes.title ||
          CALLOUT_TITLES[typeName] ||
          typeName.charAt(0).toUpperCase() + typeName.slice(1);

        node.data = node.data || {};
        node.data.hName = "aside";
        node.data.hProperties = {
          className: ["callout", `callout-${typeName}`],
          role: "note",
        };

        // Wrap existing children inside header + body if it's a container directive
        const existingChildren = [...(node.children || [])];
        const headerNode = {
          type: "paragraph",
          data: {
            hName: "div",
            hProperties: { className: ["callout-header"] },
          },
          children: [
            {
              type: "text",
              data: {
                hName: "span",
                hProperties: { className: ["callout-title"] },
              },
              value: title,
            },
          ],
        };

        const bodyNode = {
          type: "parent",
          data: {
            hName: "div",
            hProperties: { className: ["callout-body"] },
          },
          children: existingChildren,
        };

        node.children = [headerNode as unknown as RootContent, bodyNode as unknown as RootContent];
      } else if (name === "video") {
        node.data = node.data || {};
        node.data.hName = "video";
        node.data.hProperties = {
          controls: true,
          preload: "metadata",
          playsinline: true,
          src: attributes.src || "",
          className: ["video-player", "w-full", "rounded-lg"],
          ...(attributes.alt ? { ariaLabel: attributes.alt } : {}),
        };

        const children: unknown[] = [];
        const captionsSrc = attributes.captions || attributes.caption || attributes.vtt;
        if (captionsSrc) {
          children.push({
            type: "paragraph",
            data: {
              hName: "track",
              hProperties: {
                kind: "captions",
                src: captionsSrc,
                srclang: locale || "en",
                label: "Captions",
                default: true,
              },
            },
            children: [],
          });
        }
        node.children = children as RootContent[];
      } else if (name === "kbd") {
        node.data = node.data || {};
        node.data.hName = "kbd";
        node.data.hProperties = {
          className: ["kbd-key"],
        };
      } else if (name === "screenshot") {
        node.data = node.data || {};
        node.data.hName = "figure";
        node.data.hProperties = {
          className: ["screenshot-figure", "my-6"],
        };

        const children: unknown[] = [
          {
            type: "image",
            url: attributes.src || "",
            alt: attributes.alt || "",
            data: {
              hName: "img",
              hProperties: {
                src: attributes.src || "",
                alt: attributes.alt || "",
                loading: "lazy",
                className: ["screenshot-img", "rounded-lg", "border", "border-zinc-800", "w-full"],
              },
            },
            children: [],
          },
        ];

        const captionText = attributes.caption || attributes.title;
        if (captionText) {
          children.push({
            type: "paragraph",
            data: {
              hName: "figcaption",
              hProperties: {
                className: ["screenshot-caption", "text-xs", "text-zinc-400", "text-center", "mt-2"],
              },
            },
            children: [
              {
                type: "text",
                value: captionText,
              },
            ],
          });
        }

        node.children = children as RootContent[];
      } else if (name === "step") {
        const title = attributes.title || "";
        node.data = node.data || {};
        node.data.hName = "div";
        node.data.hProperties = {
          className: ["step-card"],
        };

        const existingChildren = [...(node.children || [])];
        const headerChildren: unknown[] = [
          {
            type: "text",
            data: {
              hName: "span",
              hProperties: { className: ["step-badge"] },
            },
            value: "Step",
          },
        ];

        if (title) {
          headerChildren.push({
            type: "text",
            data: {
              hName: "span",
              hProperties: { className: ["step-title"] },
            },
            value: ` ${title}`,
          });
        }

        const headerNode = {
          type: "paragraph",
          data: {
            hName: "div",
            hProperties: { className: ["step-header"] },
          },
          children: headerChildren,
        };

        const bodyNode = {
          type: "parent",
          data: {
            hName: "div",
            hProperties: { className: ["step-body"] },
          },
          children: existingChildren,
        };

        node.children = [headerNode as unknown as RootContent, bodyNode as unknown as RootContent];
      }
    });
  };
}
