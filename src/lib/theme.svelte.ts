let theme = $state<'dark' | 'light'>('dark');

export function getTheme() { return theme; }

export function setTheme(t: 'dark' | 'light') {
	theme = t;
	if (typeof document !== 'undefined') {
		document.documentElement.classList.toggle('dark', t === 'dark');
		localStorage.setItem('theme', t);
	}
}

export function toggleTheme() {
	setTheme(theme === 'dark' ? 'light' : 'dark');
}
