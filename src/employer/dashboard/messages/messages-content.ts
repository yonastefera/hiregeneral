export type MessageThread = {
  id: number;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
};

export type ConversationMessage = {
  id: number;
  from: "me" | "them";
  text: string;
};

export const messageThreads: MessageThread[] = [
  {
    id: 1,
    name: "Maya Chen",
    role: "Senior Product Designer",
    preview: "Thanks for the quick response — I'd love to chat...",
    time: "2m",
    unread: 2,
  },
  {
    id: 2,
    name: "Daniel Okafor",
    role: "Staff Backend Engineer",
    preview: "I'm available Thursday after 2pm PT.",
    time: "1h",
    unread: 0,
  },
  {
    id: 3,
    name: "HireGeneral Admin",
    role: "Account update",
    preview: "Your Growth subscription renews on June 1.",
    time: "1d",
    unread: 1,
  },
  {
    id: 4,
    name: "Priya Subramaniam",
    role: "Senior Product Designer",
    preview: "Attached the case study you asked for.",
    time: "2d",
    unread: 0,
  },
];

export const conversationMessages: ConversationMessage[] = [
  {
    id: 1,
    from: "them",
    text: "Hi Nick — I just applied for the Senior Product Designer role. Really excited about Acme!",
  },
  {
    id: 2,
    from: "me",
    text: "Maya, thanks for reaching out! Your portfolio looks fantastic. Are you available for a 30-min call this week?",
  },
  {
    id: 3,
    from: "them",
    text: "Thanks for the quick response — I'd love to chat. Thursday afternoon works great.",
  },
];

export function getInitials(name: string) {
  return name
    .split(" ")
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2);
}
