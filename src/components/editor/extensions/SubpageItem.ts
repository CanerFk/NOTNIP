import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { SubpageItemView } from "./SubpageItemView";

export const SubpageItem = Node.create({
  name: "subpageItem",

  group: "block", // Block level
  inline: false, // Not inline
  atom: true, // Treated as a single unit
  isolating: true, // Prevents text from merging into it
  selectable: false, // CRITICAL: Prevents cursor from selecting the node, which would cause typing to replace it
  draggable: false, // Prevent drag-and-drop

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
