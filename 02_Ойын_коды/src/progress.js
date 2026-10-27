export const missionComplete = (games = {}) => Boolean(games.lab) && Object.keys(games).filter(k => k !== 'lab').length >= 2;
export function selectedLesson(search, lessons) {
 const id = new URLSearchParams(search).get('lesson');
 return Math.max(0, lessons.findIndex(l => l.id === id));
}
