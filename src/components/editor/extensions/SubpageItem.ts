import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SubpageItemView } from "./SubpageItemView";

export const SubpageItem = Node.create({
  name: "subpageItem",

  group: "block",
  inline: false,
  atom: true, 
  isolating: true,
  selectable: false, 
  draggable: false,

  addAttributes() {
    return {
      id: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-id"),
        renderHTML: (attributes) => ({
          "data-id": attributes.id,
        }),
      },
      title: {
        default: "Untitled Subpage",
        parseHTML: (element) => element.getAttribute("data-title"),
        renderHTML: (attributes) => ({
          "data-title": attributes.title,
        }),
      },
      icon: {
        default: "file",
        parseHTML: (element) => element.getAttribute("data-icon"),
        renderHTML: (attributes) => ({
          "data-icon": attributes.icon,
        }),
      },
      type: {
        default: "page",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "subpage-item",
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ["subpage-item", mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(SubpageItemView);
  },

  addKeyboardShortcuts() {
    return {};
  },
});
