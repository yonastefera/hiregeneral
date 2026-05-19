export type MessageThread = {
  id: string;
  candidateId: string;
  name: string;
  role: string;
  preview: string;
  time: string;
  unread: number;
  jobTitle: string | null;
};

export type ConversationMessage = {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
  createdAt: string;
};

export type EmployerMessagesData = {
  threads: MessageThread[];
  activeThreadId: string | null;
  messages: ConversationMessage[];
};

export function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((namePart) => namePart[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
