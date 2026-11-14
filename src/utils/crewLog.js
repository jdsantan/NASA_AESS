export const EMPTY_LOG = { activities: [], removed: {}, completed: {}, comments: [] };

export function applyLogAction(log, action) {
  if (action.type === "add") {
    if (log.activities.some(({ id }) => id === action.activity.id)) return log;
    return { ...log, activities: [...log.activities, action.activity] };
  }
  if (action.type === "comment") {
    if (log.comments.some(({ id }) => id === action.comment.id)) return log;
    return { ...log, comments: [action.comment, ...log.comments] };
  }
  if (action.type === "remove") {
    const removed = log.removed[action.member] ?? [];
    return { ...log, removed: { ...log.removed, [action.member]: [...new Set([...removed, action.id])] } };
  }
  const day = log.completed[action.day] ?? {};
  const checked = day[action.member] ?? [];
  const next = action.done ? [...new Set([...checked, action.id])] : checked.filter((id) => id !== action.id);
  return { ...log, completed: { ...log.completed, [action.day]: { ...day, [action.member]: next } } };
}

