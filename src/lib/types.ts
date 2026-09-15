export interface Contributor {
	login: string;
	avatar_url: string | undefined;
	html_url: string | undefined;
	contributions: number;
}

export interface InstallationInfo {
	type: 'npm' | 'pip' | 'cargo' | 'go' | 'git';
	command: string;
}

export interface RepoStats {
	forks: number;
	watchers: number;
	open_issues: number;
	size: number; // KB
	created_at: string; // ISO 8601
	updated_at: string;
	pushed_at: string;
	has_wiki: boolean;
	has_pages: boolean;
	has_discussions: boolean;
}

export interface CacheData {
	slug: string;
	contributors: Contributor[];
	installation: InstallationInfo | null;
	documentation: {
		docs_url?: string;
		changelog_url?: string;
	};
	stats: RepoStats;
	languages: Record<string, number>; // language -> byte count
	updated_at: string; // ISO 8601
}

export interface Category {
	id: string;
	label: string;
	description: string;
	icon: string;
}

export interface GitHubSession {
	access_token: string; // GitHub user access token (public_repo scope)
	login: string; // GitHub username
	avatar_url: string;
	expires_at: number; // Unix timestamp
}

export interface AuthUser {
	login: string;
	avatar_url: string;
}
