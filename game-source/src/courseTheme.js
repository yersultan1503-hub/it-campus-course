export const normalizeTheme=value=>value==='light'?'light':'dark';
export function readTheme(storage){try{return normalizeTheme(storage.getItem('campus-theme'));}catch{return 'dark';}}
export function saveTheme(storage,theme){try{storage.setItem('campus-theme',normalizeTheme(theme));}catch{/* Choice still works for this page when storage is unavailable. */}}
