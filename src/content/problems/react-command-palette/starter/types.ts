export interface Command {
  /** Unique, stable id. Used for recents and React keys. */
  id: string;
  /** What the user sees and what the query is matched against. */
  title: string;
  /** Group heading, e.g. "Navigation". */
  section: string;
  /** Optional hint shown next to the title, e.g. "G D". Display only. */
  shortcut?: string;
  /** Disabled commands are listed but cannot be activated or run. */
  disabled?: boolean;
  run: () => void;
}
