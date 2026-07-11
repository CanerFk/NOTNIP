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

const makeTaskList = (items: string[]) => ({
  type: "taskList",
  content: items.map(makeTaskItem),
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
    description: "Focus, tasks, notes, and reflection",
    content: () => [
      makeHeading(`Daily Note - ${todayLong()}`, 1),
      makeHeading("Focus", 2),
      makeParagraph("Today I want to keep attention on:"),
      makeParagraph(""),
      makeHeading("Tasks", 2),
      makeTaskList(["Most important", "Follow up", ""]),
      makeHeading("Notes", 2),
      makeParagraph(""),
      makeHeading("Wins / Reflection", 2),
      makeParagraph("What worked:"),
      makeParagraph("What to adjust:"),
    ],
  },
  {
    id: "meeting-note",
    title: "Meeting Note",
    icon: "users",
    description: "Agenda, notes, decisions, and action items",
    content: () => [
      makeHeading("Meeting Notes", 1),
      makeParagraph("Title: "),
      makeParagraph(`Date: ${todayShort()}`),
      makeParagraph("Attendees: "),
      makeHeading("Agenda", 2),
      makeTaskList(["", ""]),
      makeHeading("Notes", 2),
      makeParagraph(""),
      makeHeading("Decisions", 2),
      makeParagraph(""),
      makeHeading("Action Items", 2),
      makeTaskList(["Owner - task"]),
    ],
  },
  {
    id: "class-note",
    title: "Class Note",
    icon: "book-open",
    description: "Topic, key ideas, examples, questions, tasks",
    content: () => [
      makeHeading("Class Notes", 1),
      makeParagraph("Course / Topic: "),
      makeParagraph(`Date: ${todayShort()}`),
      makeHeading("Key Ideas", 2),
      makeParagraph(""),
      makeParagraph(""),
      makeHeading("Examples", 2),
      makeParagraph(""),
      makeHeading("Questions", 2),
      makeTaskList(["Ask or review"]),
      makeHeading("Homework / Tasks", 2),
      makeTaskList([""]),
    ],
  },
  {
    id: "todo-note",
    title: "Todo / Project",
    icon: "check-square",
    description: "Project goal, next actions, backlog, notes",
    content: () => [
      makeHeading("Project", 1),
      makeParagraph("Project name: "),
      makeHeading("Goal", 2),
      makeBlockquote("Describe the useful outcome in one clear sentence."),
      makeHeading("Next Actions", 2),
      makeTaskList(["Next small step", "Blocker to clear", ""]),
      makeHeading("Backlog", 2),
      makeTaskList(["Later", "Maybe"]),
      makeHeading("Notes", 2),
      makeParagraph(""),
    ],
  },
];

export function getTemplate(id: string): Template | undefined {
  return BUILT_IN_TEMPLATES.find((t) => t.id === id);
}
