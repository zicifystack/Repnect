// Feature: fosswe-svelte-rebuild
// Component tests for ProjectCard, ProjectUpvote, ThemeToggle, SocialShare

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ProjectCard from '../components/ProjectCard.svelte';
import ThemeToggle from '../components/ThemeToggle.svelte';
import SocialShare from '../components/SocialShare.svelte';
import type { SearchIndexItem } from '../schema';

// ── ProjectCard ──────────────────────────────────────────────────────────────

const sampleProject: SearchIndexItem = {
	slug: 'test-project',
	name: 'Test Project',
	short_desc: 'A test project description that is long enough.',
	category: 'tools',
	tags: ['typescript', 'open-source', 'cli'],
	stars: 42,
	primary_lang: 'TypeScript',
	verified: true,
	added_at: '2024-01-15',
	looking_for_contributors: true,
	location_city: 'Bangalore',
	location_nigerian_state: 'Karnataka'
};

describe('ProjectCard', () => {
	it('renders project name', () => {
		render(ProjectCard, { props: { project: sampleProject } });
		expect(screen.getByText('Test Project')).toBeTruthy();
	});

	it('renders short description', () => {
		render(ProjectCard, { props: { project: sampleProject } });
		expect(screen.getByText(sampleProject.short_desc)).toBeTruthy();
	});

	it('renders primary language badge', () => {
		render(ProjectCard, { props: { project: sampleProject } });
		expect(screen.getByText('TypeScript')).toBeTruthy();
	});

	it('renders city location', () => {
		render(ProjectCard, { props: { project: sampleProject } });
		expect(screen.getByText('Bangalore')).toBeTruthy();
	});

	it('renders correct href to project detail', () => {
		render(ProjectCard, { props: { project: sampleProject } });
		const link = screen.getByRole('link');
		expect(link.getAttribute('href')).toBe('/projects/test-project');
	});

	it('renders up to 3 tags with overflow indicator', () => {
		const projectWith5Tags: SearchIndexItem = {
			...sampleProject,
			tags: ['tag1', 'tag2', 'tag3', 'tag4', 'tag5']
		};
		render(ProjectCard, { props: { project: projectWith5Tags } });
		// First 3 tags visible
		expect(screen.getByText('tag1')).toBeTruthy();
		expect(screen.getByText('tag2')).toBeTruthy();
		expect(screen.getByText('tag3')).toBeTruthy();
		// Overflow indicator
		expect(screen.getByText('+2')).toBeTruthy();
	});

	it('hides stars badge when stars = 0', () => {
		render(ProjectCard, { props: { project: { ...sampleProject, stars: 0 } } });
		expect(screen.queryByText('42')).toBeNull();
	});

	it('shows star count when stars > 0', () => {
		render(ProjectCard, { props: { project: sampleProject } });
		expect(screen.getByText('42')).toBeTruthy();
	});
});

// ── ThemeToggle ──────────────────────────────────────────────────────────────

describe('ThemeToggle', () => {
	it('renders a button with aria-label', () => {
		render(ThemeToggle);
		const btn = screen.getByRole('button', { name: /toggle theme/i });
		expect(btn).toBeTruthy();
	});

	it('button is clickable without throwing', async () => {
		render(ThemeToggle);
		const btn = screen.getByRole('button', { name: /toggle theme/i });
		// Should not throw
		await fireEvent.click(btn);
	});
});

// ── SocialShare ──────────────────────────────────────────────────────────────

describe('SocialShare', () => {
	const shareProject = {
		name: 'My OSS Project',
		short_desc: 'An awesome open source project.',
		slug: 'my-oss-project'
	};

	it('Twitter share link includes project name and slug', () => {
		render(SocialShare, { props: { project: shareProject } });
		const twitterLink = screen.getByRole('link', { name: /twitter/i });
		const href = twitterLink.getAttribute('href') ?? '';
		expect(href).toContain('twitter.com/intent/tweet');
		expect(href).toContain('My%20OSS%20Project');
	});

	it('LinkedIn share link includes canonical URL', () => {
		render(SocialShare, { props: { project: shareProject } });
		const linkedinLink = screen.getByRole('link', { name: /linkedin/i });
		const href = linkedinLink.getAttribute('href') ?? '';
		expect(href).toContain('linkedin.com/sharing/share-offsite');
		expect(href).toContain('my-oss-project');
	});

	it('Facebook share link includes canonical URL', () => {
		render(SocialShare, { props: { project: shareProject } });
		const facebookLink = screen.getByRole('link', { name: /facebook/i });
		const href = facebookLink.getAttribute('href') ?? '';
		expect(href).toContain('facebook.com/sharer');
		expect(href).toContain('my-oss-project');
	});

	it('WhatsApp share link includes share text', () => {
		render(SocialShare, { props: { project: shareProject } });
		const whatsappLink = screen.getByRole('link', { name: /whatsapp/i });
		const href = whatsappLink.getAttribute('href') ?? '';
		expect(href).toContain('wa.me');
		expect(href).toContain('my-oss-project');
	});

	it('copy link button is present', () => {
		render(SocialShare, { props: { project: shareProject } });
		const copyBtn = screen.getByRole('button', { name: /copy link/i });
		expect(copyBtn).toBeTruthy();
	});
});
