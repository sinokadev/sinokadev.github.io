import { readdirSync, statSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { resolve, join, relative, dirname, extname, sep } from 'node:path';
import { execSync } from 'node:child_process';
import sharp from 'sharp';

const audioExtensions = new Set([
	'.3gp',
	'.aac',
	'.amr',
	'.aif',
	'.aiff',
	'.ape',
	'.dff',
	'.dsf',
	'.flac',
	'.m4a',
	'.mid',
	'.midi',
	'.mka',
	'.mp3',
	'.oga',
	'.ogg',
	'.opus',
	'.spx',
	'.tta',
	'.wav',
	'.wma',
	'.wv',
]);
const videoExtensions = new Set(['.m4v', '.mov', '.mp4', '.ogv', '.webm']);

const musicRoot = resolve(process.cwd(), 'public/music');
const previewRoot = resolve(process.cwd(), 'public/music-previews');

// Load Pretendard font files for pixel-perfect embedding in SVG
const pretendardMediumPath = resolve(process.cwd(), 'node_modules/pretendard/dist/public/static/alternative/Pretendard-Medium.ttf');
const pretendardRegularPath = resolve(process.cwd(), 'node_modules/pretendard/dist/public/static/alternative/Pretendard-Regular.ttf');

const pretendardMedium = existsSync(pretendardMediumPath)
	? readFileSync(pretendardMediumPath).toString('base64')
	: '';
const pretendardRegular = existsSync(pretendardRegularPath)
	? readFileSync(pretendardRegularPath).toString('base64')
	: '';

// Try loading metadata if available
let musicTrackMetadata = {};
try {
	const metadataModule = await import('../src/data/musicMetadata.ts');
	musicTrackMetadata = metadataModule.musicTrackMetadata ?? {};
} catch {
	// Fallback to empty if not loaded
}

function checkFfmpeg() {
	try {
		execSync('ffmpeg -version', { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function resolveTrackDate(audioPath, trackMeta) {
	// 1. Explicit track metadata date
	if (trackMeta?.date && /^\d{4}-\d{2}-\d{2}$/.test(trackMeta.date)) {
		return trackMeta.date;
	}

	// 2. Date pattern in filename (NOT folder)
	const fileName = audioPath ? audioPath.split(/[/\\]/).pop() : '';
	const dateMatch = fileName ? fileName.match(/\b(20\d{2})[-._](0[1-9]|1[0-2])[-._](0[1-9]|[12]\d|3[01])\b/) : null;
	if (dateMatch) {
		return `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
	}

	// 3. Git commit date or filesystem stat date
	if (audioPath && existsSync(audioPath)) {
		try {
			const gitDate = execSync(`git log -1 --format=%cs -- "${audioPath}"`, {
				stdio: ['ignore', 'pipe', 'ignore'],
				encoding: 'utf8',
			}).trim();
			if (gitDate && /^\d{4}-\d{2}-\d{2}$/.test(gitDate)) {
				return gitDate;
			}
		} catch {
			// ignore git failure
		}

		try {
			const s = statSync(audioPath);
			const fileDate = s.birthtime && s.birthtime.getTime() > 0 ? s.birthtime : s.mtime;
			return fileDate.toISOString().slice(0, 10);
		} catch {
			// ignore stat failure
		}
	}

	return undefined;
}

function escapeXml(str) {
	return str.replace(/[<>&"']/g, (c) => {
		switch (c) {
			case '<': return '&lt;';
			case '>': return '&gt;';
			case '&': return '&amp;';
			case '"': return '&quot;';
			case "'": return '&apos;';
			default: return c;
		}
	});
}

function createCoverSvg({ title, date, width = 1200, height = 500 }) {
	const safeTitle = escapeXml(title);
	const safeDate = date ? escapeXml(date) : '';

	const titleFontSize = safeTitle.length > 32 ? 38 : (safeTitle.length > 24 ? 42 : 48);
	const dateFontSize = 22;
	const linkFontSize = 20;

	let content = '';
	if (safeDate) {
		const titleBaseline = 219;
		content = `
    <g transform="translate(90, ${titleBaseline})">
      <text x="0" y="0" class="title">${safeTitle}</text>
      <text x="0" y="52" class="date">${safeDate}</text>
      <text x="0" y="92" class="link">sinoka.dev</text>
    </g>`;
	} else {
		const titleBaseline = 241;
		content = `
    <g transform="translate(90, ${titleBaseline})">
      <text x="0" y="0" class="title">${safeTitle}</text>
      <text x="0" y="48" class="link">sinoka.dev</text>
    </g>`;
	}

	return `
<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">
  <style>
    ${pretendardMedium ? `
    @font-face {
      font-family: "Pretendard";
      src: url("data:font/truetype;charset=utf-8;base64,${pretendardMedium}") format("truetype");
      font-weight: 500;
    }
    ` : ''}
    ${pretendardRegular ? `
    @font-face {
      font-family: "Pretendard";
      src: url("data:font/truetype;charset=utf-8;base64,${pretendardRegular}") format("truetype");
      font-weight: 400;
    }
    ` : ''}
    .title {
      font-family: "Pretendard", ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      font-size: ${titleFontSize}px;
      font-weight: 500;
      fill: #363636;
      letter-spacing: -0.02em;
    }
    .date {
      font-family: "Pretendard", ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      font-size: ${dateFontSize}px;
      font-weight: 400;
      fill: #737373;
      letter-spacing: -0.01em;
    }
    .link {
      font-family: "Pretendard", ui-sans-serif, -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
      font-size: ${linkFontSize}px;
      font-weight: 400;
      fill: #737373;
    }
  </style>
  <rect width="${width}" height="${height}" fill="#f5f5f5"/>
  ${content}
</svg>`;
}

async function collectFiles(dir) {
	const results = [];
	const entries = readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = join(dir, entry.name);
		if (entry.isDirectory()) {
			results.push(...(await collectFiles(fullPath)));
		} else if (entry.isFile()) {
			const ext = extname(entry.name).toLowerCase();
			if (audioExtensions.has(ext) || videoExtensions.has(ext)) {
				results.push(fullPath);
			}
		}
	}
	return results;
}

export async function generatePreviews(force = false) {
	if (!existsSync(musicRoot)) {
		console.log('[music-previews] public/music not found, skipping preview generation.');
		return;
	}

	const hasFfmpeg = checkFfmpeg();
	if (!hasFfmpeg) {
		console.warn('[music-previews] ffmpeg not found in PATH; video preview generation will be skipped.');
	}

	const mediaFiles = await collectFiles(musicRoot);
	if (mediaFiles.length === 0) {
		console.log('[music-previews] No media files found in public/music.');
		return;
	}

	console.log(`[music-previews] Found ${mediaFiles.length} media file(s). Generating previews (1200x500)...`);

	for (const mediaPath of mediaFiles) {
		const relativePath = relative(musicRoot, mediaPath);
		const folderPath = dirname(relativePath);
		const ext = extname(mediaPath).toLowerCase();
		const baseName = relativePath.slice(0, -ext.length);

		const outDir = join(previewRoot, folderPath);
		if (!existsSync(outDir)) {
			mkdirSync(outDir, { recursive: true });
		}

		const pngPath = join(previewRoot, `${baseName}.png`);
		const mp4Path = join(previewRoot, `${baseName}.mp4`);
		const mediaStat = statSync(mediaPath);
		const isVideo = videoExtensions.has(ext);

		if (isVideo) {
			const isPosterOutdated = !existsSync(pngPath) || statSync(pngPath).mtimeMs < mediaStat.mtimeMs;
			if (hasFfmpeg && (force || isPosterOutdated)) {
				const cmd = `ffmpeg -y -ss 0.5 -i "${mediaPath}" -frames:v 1 -vf "scale=1200:-2" "${pngPath}"`;
				try {
					execSync(cmd, { stdio: 'ignore' });
					console.log(`[music-previews] Created video poster: ${relative(previewRoot, pngPath)}`);
				} catch (err) {
					console.error(`[music-previews] Failed to create video poster for ${relativePath}:`, err.message);
				}
			}
			continue;
		}

		// 1. Generate PNG Cover (1200x500)
		let needImage = force;
		if (!needImage && existsSync(pngPath)) {
			const pngStat = statSync(pngPath);
			if (pngStat.mtimeMs < mediaStat.mtimeMs) {
				needImage = true;
			}
		} else if (!existsSync(pngPath)) {
			needImage = true;
		}

		if (needImage) {
			const title = relativePath.split(sep).pop().slice(0, -ext.length);
			const trackMeta = musicTrackMetadata[relativePath];
			const date = resolveTrackDate(mediaPath, trackMeta);

			const svg = createCoverSvg({ title, date, width: 1200, height: 500 });
			await sharp(Buffer.from(svg)).png().toFile(pngPath);
			console.log(`[music-previews] Created cover: ${relative(previewRoot, pngPath)}`);
		}

		// 2. Generate MP4 Video for Discord/Twitter embeds (1200x500)
		const isMidi = ['.mid', '.midi'].includes(ext);
		if (!isMidi && hasFfmpeg) {
			let needVideo = force || needImage;
			if (!needVideo && existsSync(mp4Path)) {
				const mp4Stat = statSync(mp4Path);
				if (mp4Stat.mtimeMs < mediaStat.mtimeMs) {
					needVideo = true;
				}
			} else if (!existsSync(mp4Path)) {
				needVideo = true;
			}

			if (needVideo) {
				const cmd = `ffmpeg -y -loop 1 -i "${pngPath}" -i "${mediaPath}" -c:v libx264 -tune stillimage -preset veryfast -pix_fmt yuv420p -c:a aac -b:a 192k -shortest -movflags +faststart "${mp4Path}"`;
				try {
					execSync(cmd, { stdio: 'ignore' });
					console.log(`[music-previews] Created video: ${relative(previewRoot, mp4Path)}`);
				} catch (err) {
					console.error(`[music-previews] Failed to generate video for ${relativePath}:`, err.message);
				}
			}
		}
	}

	console.log('[music-previews] Preview generation completed.');
}

// Run directly if invoked via node
if (process.argv[1] && process.argv[1].endsWith('generate-music-previews.mjs')) {
	const force = process.argv.includes('--force');
	generatePreviews(force).catch((err) => {
		console.error('[music-previews] Fatal error:', err);
		process.exit(1);
	});
}
