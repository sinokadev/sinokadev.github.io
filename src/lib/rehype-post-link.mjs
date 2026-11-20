import fs from 'node:fs';
import path from 'node:path';

function normalizeTarget(value = '') {
	return value
		.replace(/^(?:\.\/|.*\/)/, '')
		.trim()
		.replace(/\.(md|mdx)$/, '');
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

function walk(node, callback) {
	if (!node || typeof node !== 'object') return;
	callback(node);
	if (Array.isArray(node.children)) {
		for (const child of node.children) walk(child, callback);
	}
}

export function rehypePostLink() {
	const titles = getPostTitles();

	return (tree) => {
		walk(tree, (node) => {
			if (!Array.isArray(node.children)) return;

			node.children = node.children.map((child) => {
				if (child.type !== 'element') return child;
				if (!['postlink', 'PostLink'].includes(child.tagName)) return child;

				const properties = child.properties ?? {};
				const target = normalizeTarget(
					properties.id ?? properties.slug ?? properties.name ?? properties.post ?? ''
				);
				const href = target ? `/blog/${target}/` : '#';
				const hasSlot = Array.isArray(child.children) && child.children.length > 0;
				const text = properties.text;

				return {
					type: 'element',
					tagName: 'a',
					properties: {
						...properties,
						id: undefined,
						slug: undefined,
						name: undefined,
						post: undefined,
						text: undefined,
						href,
					},
					children: hasSlot
						? child.children
						: [{ type: 'text', value: text !== undefined ? text : (titles.get(target) ?? target) }],
				};
			});
		});
	};
}
