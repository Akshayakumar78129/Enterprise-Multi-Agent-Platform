export interface MentionParseResult {
  trigger: boolean;
  query: string;
  mentions: string[];
}

export const parseMentions = (text: string): MentionParseResult => {
  const lastAt = text.lastIndexOf('@');
  let trigger = false;
  let query = '';
  if (lastAt >= 0) {
    const post = text.slice(lastAt + 1);
    if (/^[A-Za-z0-9_]{0,20}$/.test(post)) {
      trigger = true;
      query = post;
    }
  }
  const mentions = Array.from(new Set(
    (text.match(/@([A-Za-z0-9_]+)/g) || []).map(m => m.substring(1).toLowerCase())
  ));
  return { trigger, query, mentions };
};
