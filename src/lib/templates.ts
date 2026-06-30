export interface Template {
  id: string;
  title: string;
  icon: string;
  description: string;
  content: () => any;
}

const makeParagraph = (text: string) => ({
  type: "paragraph",
  content: text ? [{ type: "text", text }] : [],
});

const makeHeading = (text: string, level: 1 | 2 | 3) => ({
  type: "heading",
  attrs: { level },
  content: [{ type: "text", text }],
});

const makeTaskItem = (text: string) => ({
  type: "taskItem",
  attrs: { checked: false },
  content: [
    { type: "paragraph", content: text ? [{ type: "text", text }] : [] },
  ],
});

const makeBlockquote = (text: string) => ({
  type: "blockquote",
  content: [{ type: "paragraph", content: [{ type: "text", text }] }],
});

function todayLong(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function todayShort(): string {
  return new Date().toLocaleDateString();
}

export const BUILT_IN_TEMPLATES: Template[] = [
  {
    id: "daily-note",
    title: "Daily Note",
    icon: "calendar",
    description: "Morning reflection and daily tasks",
    content: () => [
      makeHeading(`Daily Note — ${todayLong()}`, 1),
      makeHeading("Morning Reflection", 2),
      makeParagraph(""),
      makeHeading("Today's Goals", 2),
      {
        type: "taskList",
        content: [makeTaskItem(""), makeTaskItem(""), makeTaskItem("")],
      },
      makeHeading("Notes", 2),
      makeParagraph(""),
      makeHeading("End of Day", 2),
      makeParagraph(""),
    ],
  },
  {
    id: "meeting-note",
    title: "Meeting Note",
    icon: "users",
    description: "Agenda, attendees, decisions, action items",
    content: () => [
      makeHeading("Meeting", 1),
      makeParagraph(`Date: ${todayShort()}`),
      makeParagraph("Attendees: "),
      makeHeading("Agenda", 2),
      makeParagraph(""),
      makeHeading("Discussion", 2),
      makeParagraph(""),
      makeHeading("Decisions", 2),
      makeParagraph(""),
      makeHeading("Action Items", 2),
      {
        type: "taskList",
        content: [makeTaskItem("")],
      },
      makeHeading("Next Steps", 2),
      makeParagraph(""),
    ],
  },
  {
    id: "class-note",
    title: "Class Note",
    icon: "book-open",
    description: "Subject, key concepts, examples, summary",
    content: () => [
      makeHeading("Class Notes", 1),
      makeParagraph(`Date: ${todayShort()}`),
      makeParagraph("Subject: "),
      makeParagraph("Instructor: "),
      makeHeading("Key Concepts", 2),
      makeParagraph(""),
      makeHeading("Examples", 2),
      makeParagraph(""),
      makeHeading("Questions", 2),
      makeParagraph(""),
      makeHeading("Summary", 2),
      makeParagraph(""),
    ],
  },
  {
    id: "todo-note",
    title: "Todo / Project",
    icon: "check-square",
    description: "Project overview and task list",
    content: () => [
      makeHeading("Project", 1),
      makeBlockquote("Describe the goal of this project in one sentence."),
      makeHeading("Tasks", 2),
      {
        type: "taskList",
        content: [makeTaskItem(""), makeTaskItem(""), makeTaskItem("")],
      },
      makeHeading("In Progress", 2),
      {
        type: "taskList",
        content: [makeTaskItem("")],
      },
      makeHeading("Done", 2),
      {
        type: "taskList",
        content: [],
      },
      makeHeading("Notes", 2),
      makeParagraph(""),
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}
