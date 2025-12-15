export interface SessionEvent {
  id: string;
  title: string;
  start: string;  // ISO datetime
  end: string;    // ISO datetime
  mentor?: string;
  backgroundColor?: string; // optional for styling later
}
