import fs from 'node:fs';
import path from 'node:path';

function normalizeTarget(value = '') {
	return value
		.replace(/^(?:\.\/|.*\/)/, '')
		.trim()
		.replace(/\.(md|mdx)$/, '');
}

function getAttribute(source, name) {
	const match = source.match(new RegExp(`(?:^|\\s)${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s/>]+))`, 'i'));
	return match ? (match[1] ?? match[2] ?? match[3]) : '';
}

function parseFrontmatterTitle(source) {
	const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!match) return null;

	const titleMatch = match[1].match(/^title:\s*(?:"([^"]*)"|'([^']*)'|(.+))$/m);
	if (!titleMatch) return null;

	return (titleMatch[1] ?? titleMatch[2] ?? titleMatch[3]).trim();
}

function getPostTitles() {
	const directory = path.join(process.cwd(), 'src/content/blog');
	const titles = new Map();

	for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
		if (!entry.isFile() || !/\.(md|mdx)$/.test(entry.name)) continue;

		const id = entry.name.replace(/\.(md|mdx)$/, '');
		const source = fs.readFileSync(path.join(directory, entry.name), 'utf8');
		const title = parseFrontmatterTitle(source);

		if (title) titles.set(id, title);
	}

	return titles;
}

function createPostLink(source, titles) {
	const target = normalizeTarget(
		getAttribute(source, 'id') ||
		getAttribute(source, 'slug') ||
		getAttribute(source, 'name') ||
		getAttribute(source, 'post')
	);
	const text = getAttribute(source, 'text');

	return {
		type: 'link',
		url: target ? `/blog/${target}/` : '#',
		children: [{ type: 'text', value: text !== '' ? text : (titles.get(target) ?? target) }],
	};
}

function walk(children, titles) {
	if (!Array.isArray(children)) return;

	for (let index = 0; index < children.length; index++) {
		const child = children[index];

		if (child.children) walk(child.children, titles);

		if (child.type !== 'html') continue;

		const opening = child.value.match(/^<PostLink\b([\s\S]*?)(\/?)>$/i);
		if (!opening) continue;

		if (opening[2] === '/') {
			children[index] = createPostLink(opening[1], titles);
			continue;
		}

		let closingIndex = -1;
		for (let candidate = index + 1; candidate < children.length; candidate++) {
			if (/^<\/PostLink\s*>$/i.test(children[candidate].value ?? '')) {
				closingIndex = candidate;
				break;
			}
		}

		if (closingIndex === -1) continue;

		const slotChildren = children.slice(index + 1, closingIndex);
		children.splice(index, closingIndex - index + 1, {
			type: 'link',
			url: `/blog/${normalizeTarget(
				getAttribute(opening[1], 'id') ||
				getAttribute(opening[1], 'slug') ||
				getAttribute(opening[1], 'name') ||
				getAttribute(opening[1], 'post')
			)}/`,
			children: slotChildren.length > 0
				? slotChildren
				: [createPostLink(opening[1], titles).children[0]],
		});
	}
}

export function remarkPostLink() {
	const titles = getPostTitles();

	return (tree) => {
		walk(tree.children, titles);
	};
}
