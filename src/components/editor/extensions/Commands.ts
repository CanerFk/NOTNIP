import { Extension } from "@tiptap/core";
import { TextSelection } from "@tiptap/pm/state";
import Suggestion from "@tiptap/suggestion";
import { BUILT_IN_TEMPLATES } from "../../../lib/templates";
import {
  Heading1,
  Heading2,
  List,
  ListOrdered,
  CheckSquare,
  Code,
  Type,
  Quote,
  Grid3X3,
  ChevronDown,
  FolderPlus,
  Image,
  FileText,
  Minus,
} from "lucide-react";
import React from "react";
import { useStore } from "../../../store/useStore";

export interface CommandFlag {
  key: string;
  label: string;
  isDefault?: boolean;
}

const COLOR_MAP: Record<string, string> = {
  cr: "red",
  cy: "yellow",
  cg: "green",
  cb: "blue",
  cp: "purple",
  ca: "aqua",
  co: "orange",
};

const COLOR_MAP_KEYS = Object.keys(COLOR_MAP);

const ICON_H1 = React.createElement(Heading1, { size: 14 });
const ICON_H2 = React.createElement(Heading2, { size: 14 });
const ICON_LIST = React.createElement(List, { size: 14 });
const ICON_LIST_ORDERED = React.createElement(ListOrdered, { size: 14 });
const ICON_CHECK = React.createElement(CheckSquare, { size: 14 });
const ICON_CODE = React.createElement(Code, { size: 14 });
const ICON_TYPE = React.createElement(Type, { size: 14 });
const ICON_QUOTE = React.createElement(Quote, { size: 14 });
const ICON_GRID = React.createElement(Grid3X3, { size: 14 });
const ICON_CHEVRON = React.createElement(ChevronDown, { size: 14 });
const ICON_FOLDER = React.createElement(FolderPlus, { size: 14 });
const ICON_IMAGE = React.createElement(Image, { size: 14 });
const ICON_FILE_TEXT = React.createElement(FileText, { size: 14 });
const ICON_MINUS = React.createElement(Minus, { size: 14 });

export function parseSlashQuery(query: string) {
  const parts = query.trim().split(/\s+/);
  const activeFlags: string[] = [];
  const cmdParts: string[] = [];

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    if (part.startsWith("-") && part.length > 1) {
      activeFlags.push(part.slice(1).toLowerCase());
    } else if (part !== "-") {
      cmdParts.push(part);
    }
  }

  return {
    commandQuery: cmdParts.join(" ").toLowerCase(),
    activeFlags,
    hasFlags: query.includes(" -"),
  };
}

export const Commands = Extension.create({
  name: "slash-commands",

  addOptions() {
    return {
      suggestion: {
        char: "/",
        allowSpaces: true,
        command: ({ editor, range, props }: any) => {
          props.command({ editor, range });
        },
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      Suggestion({
        editor: this.editor,
        ...this.options.suggestion,
        allow: ({ state, range }: { state: any; range: any }) => {
          const $from = state.doc.resolve(range.from);
          const parentType = $from.parent.type.name;
          if (parentType !== "paragraph" && !parentType.startsWith("heading")) {
            return false;
          }
          const disallowed = [
            "blockquote",
            "codeBlock",
            "table",
            "tableCell",
            "tableHeader",
            "iframe",
          ];
          for (let d = $from.depth; d > 0; d--) {
            if (disallowed.includes($from.node(d).type.name)) {
              return false;
            }
          }
          const textBefore = $from.parent.textContent.slice(
            0,
            range.from - $from.start(),
          );
          if (textBefore.length > 0 && !/\s$/.test(textBefore)) {
            return false;
          }
          return true;
        },
      }),
    ];
  },
});

const convertOrSplitBlock = (editor: any, range: any, action: () => void) => {
  editor.chain().focus().deleteRange(range).run();
  action();
};

function resolveColor(
  activeFlags: string[],
  defaultColor: string,
): string | null {
  const colorFlag = activeFlags
    .slice()
    .reverse()
    .find((f) => COLOR_MAP_KEYS.includes(f) || f.startsWith("c"));
  if (!colorFlag) return null;
  if (colorFlag === "c") return defaultColor;
  return COLOR_MAP[colorFlag] || colorFlag.slice(1);
}

function findEmptyParagraphAfterLastDivider(doc: any, anchor: number) {
  let dividerPos: number | null = null;

  doc.descendants((node: any, pos: number) => {
    if (pos <= anchor && node.type.name === "horizontalRule") {
      dividerPos = pos;
    }
    return true;
  });

  if (dividerPos === null) return null;

  let cursorPos: number | null = null;
  doc.descendants((node: any, pos: number) => {
    if (cursorPos !== null || pos <= dividerPos!) return true;
    if (node.type.name === "paragraph" && node.content.size === 0) {
      cursorPos = pos + 1;
    }
    return cursorPos === null;
  });

  return cursorPos;
}

export const getSuggestionItems = ({ query }: { query: string }) => {
  const { commandQuery, activeFlags } = parseSlashQuery(query);

  const items = [
    {
      group: "Basic Blocks",
      title: "Text",
      icon: ICON_TYPE,
      flags: [] as CommandFlag[],
      command: ({ editor, range }: any) => {
        convertOrSplitBlock(editor, range, () => {
          editor.chain().focus().setParagraph().run();
        });
      },
    },
    {
      group: "Basic Blocks",
      title: "Heading 1",
      icon: ICON_H1,
      flags: [{ key: "c", label: "Color" }] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const color = resolveColor(activeFlags, "yellow");
        convertOrSplitBlock(editor, range, () => {
          editor.chain().focus().setHeading({ level: 1, color }).run();
        });
      },
    },
    {
      group: "Basic Blocks",
      title: "Heading 2",
      icon: ICON_H2,
      flags: [{ key: "c", label: "Color" }] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const color = resolveColor(activeFlags, "yellow");
        convertOrSplitBlock(editor, range, () => {
          editor.chain().focus().setHeading({ level: 2, color }).run();
        });
      },
    },
    {
      group: "Basic Blocks",
      title: "Heading 3",
      icon: ICON_H2,
      flags: [{ key: "c", label: "Color" }] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const color = resolveColor(activeFlags, "yellow");
        convertOrSplitBlock(editor, range, () => {
          editor.chain().focus().setHeading({ level: 3, color }).run();
        });
      },
    },
    {
      group: "Basic Blocks",
      title: "Bullet List",
      icon: ICON_LIST,
      flags: [
        { key: "d", label: "Disc", isDefault: true },
        { key: "s", label: "Square" },
        { key: "c", label: "Circle" },
        { key: "t", label: "Toggleable" },
      ] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const listStyleFlag = activeFlags
          .slice()
          .reverse()
          .find((f) => ["d", "s", "c"].includes(f));
        let listType = "disc";
        if (listStyleFlag === "s") listType = "square";
        else if (listStyleFlag === "c") listType = "circle";

        const listNode = {
          type: "bulletList",
          attrs: { listType },
          content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
        };

        if (activeFlags.includes("t")) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "toggleBlock",
              attrs: { title: "Toggle List" },
              content: [listNode],
            })
            .run();
        } else if (listType !== "disc") {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(listNode)
            .run();
        } else {
          convertOrSplitBlock(editor, range, () => {
            editor.chain().focus().toggleBulletList().run();
          });
        }
      },
    },
    {
      group: "Basic Blocks",
      title: "Numbered List",
      icon: ICON_LIST_ORDERED,
      flags: [
        { key: "n", label: "Numbers", isDefault: true },
        { key: "r", label: "Roman" },
        { key: "l", label: "Letters" },
        { key: "t", label: "Toggleable" },
      ] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const listStyleFlag = activeFlags
          .slice()
          .reverse()
          .find((f) => ["n", "r", "l"].includes(f));
        let listType = "decimal";
        if (listStyleFlag === "r") listType = "roman";
        else if (listStyleFlag === "l") listType = "letters";

        const listNode = {
          type: "orderedList",
          attrs: { listType },
          content: [{ type: "listItem", content: [{ type: "paragraph" }] }],
        };

        if (activeFlags.includes("t")) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "toggleBlock",
              attrs: { title: "Toggle List" },
              content: [listNode],
            })
            .run();
        } else if (listType !== "decimal") {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent(listNode)
            .run();
        } else {
          convertOrSplitBlock(editor, range, () => {
            editor.chain().focus().toggleOrderedList().run();
          });
        }
      },
    },
    {
      group: "Basic Blocks",
      title: "Task List",
      icon: ICON_CHECK,
      flags: [{ key: "t", label: "Toggleable" }] as CommandFlag[],
      command: ({ editor, range }: any) => {
        if (activeFlags.includes("t")) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "toggleBlock",
              content: [
                {
                  type: "taskList",
                  content: [
                    { type: "taskItem", content: [{ type: "paragraph" }] },
                  ],
                },
              ],
            })
            .run();
        } else {
          convertOrSplitBlock(editor, range, () => {
            editor.chain().focus().toggleTaskList().run();
          });
        }
      },
    },
    {
      group: "Basic Blocks",
      title: "Code Block",
      icon: ICON_CODE,
      flags: [
        { key: "ln", label: "Line Numbers" },
        { key: "w", label: "Word Wrap" },
      ] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const lineNumbers = activeFlags.includes("ln");
        const wordWrap = activeFlags.includes("w");
        convertOrSplitBlock(editor, range, () => {
          editor.chain().focus().setCodeBlock({ lineNumbers, wordWrap }).run();
        });
      },
    },
    {
      group: "Basic Blocks",
      title: "Quote",
      icon: ICON_QUOTE,
      flags: [{ key: "a", label: "Author" }] as CommandFlag[],
      command: ({ editor, range }: any) => {
        if (activeFlags.includes("a")) {
          editor
            .chain()
            .focus()
            .deleteRange(range)
            .insertContent({
              type: "blockquote",
              content: [
                { type: "paragraph" },
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: "— Author",
                      marks: [{ type: "italic" }],
                    },
                  ],
                },
              ],
            })
            .run();
        } else {
          convertOrSplitBlock(editor, range, () => {
            editor.chain().focus().toggleBlockquote().run();
          });
        }
      },
    },
    {
      group: "Basic Blocks",
      title: "Table",
      icon: ICON_GRID,
      flags: [{ key: "c", label: "Color" }] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const headerColor = resolveColor(activeFlags, "aqua") || "";

        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "tableBlock",
            attrs: { headerColor },
            content: [
              {
                type: "table",
                content: [
                  {
                    type: "tableRow",
                    content: [
                      { type: "tableHeader", content: [{ type: "paragraph" }] },
                      { type: "tableHeader", content: [{ type: "paragraph" }] },
                      { type: "tableHeader", content: [{ type: "paragraph" }] },
                    ],
                  },
                  {
                    type: "tableRow",
                    content: [
                      { type: "tableCell", content: [{ type: "paragraph" }] },
                      { type: "tableCell", content: [{ type: "paragraph" }] },
                      { type: "tableCell", content: [{ type: "paragraph" }] },
                    ],
                  },
                  {
                    type: "tableRow",
                    content: [
                      { type: "tableCell", content: [{ type: "paragraph" }] },
                      { type: "tableCell", content: [{ type: "paragraph" }] },
                      { type: "tableCell", content: [{ type: "paragraph" }] },
                    ],
                  },
                ],
              },
            ],
          })
          .run();

        setTimeout(() => {
          const { doc } = editor.state;
          let firstCellPos = -1;
          doc.descendants((node: any, pos: number) => {
            if (firstCellPos === -1 && node.type.name === "tableCell") {
              firstCellPos = pos + 1;
            }
          });
          if (firstCellPos !== -1) {
            editor.commands.focus(firstCellPos);
          }
        }, 10);
      },
    },
    {
      group: "Basic Blocks",
      title: "Toggle",
      icon: ICON_CHEVRON,
      flags: [
        { key: "t", label: "Tabbed", isDefault: true },
        { key: "nt", label: "No Tab" },
        { key: "h1", label: "Heading 1" },
        { key: "h2", label: "Heading 2" },
        { key: "s", label: "Small" },
        { key: "c", label: "Color" },
      ] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const tabbed = !activeFlags.includes("nt");

        let headerStyle = "normal";
        if (activeFlags.includes("h1")) headerStyle = "h1";
        else if (activeFlags.includes("h2")) headerStyle = "h2";
        else if (activeFlags.includes("s")) headerStyle = "small";

        const headerColor = resolveColor(activeFlags, "yellow") || "";

        editor
          .chain()
          .focus()
          .deleteRange(range)
          .insertContent({
            type: "toggleBlock",
            attrs: { tabbed, headerStyle, headerColor },
            content: [{ type: "paragraph" }],
          })
          .run();
      },
    },
    {
      group: "Basic Blocks",
      title: "Divider",
      icon: ICON_MINUS,
      flags: [
        { key: "b", label: "Bold" },
        { key: "a", label: "Accent" },
      ] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const bold = activeFlags.includes("b");
        const accent = activeFlags.includes("a");
        editor
          .chain()
          .focus()
          .insertContentAt(
            range,
            [
              {
                type: "horizontalRule",
                attrs: { bold, accent },
              },
              { type: "paragraph" },
            ],
            { updateSelection: true },
          )
          .command(({ tr, dispatch }: { tr: any; dispatch: any }) => {
            if (dispatch) {
              const cursorPos = findEmptyParagraphAfterLastDivider(
                tr.doc,
                tr.selection.from,
              );
              if (cursorPos !== null) {
                tr.setSelection(TextSelection.create(tr.doc, cursorPos));
              }
            }
            return true;
          })
          .run();
      },
    },
    {
      group: "Media",
      title: "Image",
      icon: ICON_IMAGE,
      flags: [
        { key: "f", label: "Full Width" },
        { key: "c", label: "Caption" },
      ] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const fullWidth = activeFlags.includes("f");
        const hasCaption = activeFlags.includes("c");
        editor.chain().focus().deleteRange(range).run();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".jpg,.jpeg,.png,.gif,.webp";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const MAX_SIZE = 5 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
              const { confirm, open } =
                await import("@tauri-apps/plugin-dialog");
              const wantLocal = await confirm(
                `This file (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds Notnip's 5MB limit. Storing large files in system memory can degrade performance.\n\nWould you like to provide a "Local Link" directly to your computer instead of copying it? (Recommended)`,
                { title: "File Too Large (5MB Limit)", kind: "warning" },
              );

              if (wantLocal) {
                const selectedPath = await open({
                  title: "Please select the file from your computer",
                  multiple: false,
                  filters: [
                    {
                      name: "Image",
                      extensions: ["png", "jpg", "jpeg", "webp", "gif"],
                    },
                  ],
                });

                if (selectedPath) {
                  const src = `local-link:${selectedPath}`;
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "resizableImage",
                      attrs: { src, alt: file.name, fullWidth, hasCaption },
                    })
                    .run();
                }
              }
              return;
            }

            const { assetManager } = await import("../../../lib/AssetManager");
            const metadata = await assetManager.uploadFile(file);
            if (metadata) {
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "resizableImage",
                  attrs: {
                    src: metadata.path,
                    alt: metadata.filename,
                    fullWidth,
                    hasCaption,
                  },
                })
                .run();
            }
          }
        };
        input.click();
      },
    },
    {
      group: "Media",
      title: "PDF Document",
      icon: ICON_FILE_TEXT,
      flags: [] as CommandFlag[],
      command: ({ editor, range }: any) => {
        editor.chain().focus().deleteRange(range).run();
        const input = document.createElement("input");
        input.type = "file";
        input.accept = ".pdf";
        input.onchange = async (e) => {
          const file = (e.target as HTMLInputElement).files?.[0];
          if (file) {
            const MAX_SIZE = 5 * 1024 * 1024;
            if (file.size > MAX_SIZE) {
              const { confirm, open } =
                await import("@tauri-apps/plugin-dialog");
              const wantLocal = await confirm(
                `This file (${(file.size / 1024 / 1024).toFixed(1)} MB) exceeds Notnip's 5MB limit. Storing large files in system memory can degrade performance.\n\nWould you like to provide a "Local Link" directly to your computer instead of copying it? (Recommended)`,
                { title: "File Too Large (5MB Limit)", kind: "warning" },
              );

              if (wantLocal) {
                const selectedPath = await open({
                  title: "Please select the file from your computer",
                  multiple: false,
                  filters: [{ name: "PDF", extensions: ["pdf"] }],
                });

                if (selectedPath) {
                  const src = `local-link:${selectedPath}`;
                  editor
                    .chain()
                    .focus()
                    .insertContent({
                      type: "iframe",
                      attrs: { src, title: file.name },
                    })
                    .run();
                }
              }
              return;
            }

            const { assetManager } = await import("../../../lib/AssetManager");
            const metadata = await assetManager.uploadFile(file);
            if (metadata) {
              editor
                .chain()
                .focus()
                .insertContent({
                  type: "iframe",
                  attrs: { src: metadata.path, title: metadata.filename },
                })
                .run();
            }
          }
        };
        input.click();
      },
    },
    {
      group: "Structure",
      title: "Subpage",
      icon: ICON_FOLDER,
      flags: [] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const parentPageId = useStore.getState().activePageId;
        if (!parentPageId) return;
        editor.chain().focus().deleteRange(range).run();
        const { addSubpage } = useStore.getState();
        addSubpage(parentPageId)
          .then((newId: string) => {
            editor
              .chain()
              .focus()
              .insertContent([{ type: "subpageItem", attrs: { id: newId } }])
              .run();
          })
          .catch(() => {});
      },
    },
    ...BUILT_IN_TEMPLATES.map((tpl) => ({
      group: "Templates",
      title: `Template: ${tpl.title}`,
      icon: ICON_FILE_TEXT,
      flags: [] as CommandFlag[],
      command: ({ editor, range }: any) => {
        const nodes = tpl.content();
        editor.chain().focus().deleteRange(range).insertContent(nodes).run();
      },
    })),
  ];

  if (!commandQuery) return items;
  return items.filter((item) =>
    item.title.toLowerCase().includes(commandQuery),
  );
};
