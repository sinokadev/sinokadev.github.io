import { readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve, sep } from 'node:path';
import { musicFolderMetadata, musicTrackMetadata, type MusicMetadata } from '../data/musicMetadata';
import { musicEmbeds } from '../data/musicEmbeds';

export const MEDIA_EXTENSIONS = new Set([
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
	'.mp4',
	'.m4v',
	'.mov',
	'.oga',
	'.ogg',
	'.ogv',
	'.opus',
	'.spx',
	'.tta',
	'.wav',
	'.webm',
	'.wma',
	'.wv',
]);

export const VIDEO_EXTENSIONS = new Set(['.mp4', '.m4v', '.mov', '.ogv', '.webm']);

export type MusicFile = {
	id: string;
	name: string;
	title: string;
	slug: string;
	permalink: string;
	embedUrl: string;
	src: string;
	format: string;
	mimeType: string;
	folder: string;
	folderSlug: string;
	relativePath: string;
	description: string;
	date?: Date;
	dateString?: string;
	videoSrc?: string;
	imageSrc?: string;
	isMidi: boolean;
	isVideo: boolean;
};

export type MusicFolder = {
	name: string;
	slug: string;
	index: number;
	description: string;
	date?: Date;
	files: MusicFile[];
};

export type EmbeddedPlayer = {
	provider: string;
	src: string;
	height: number;
	date?: Date;
};

export type EmbeddedMusic = {
	title: string;
	description: string;
	players: EmbeddedPlayer[];
};

export function parseMusicDate(date?: string): Date | undefined {
	if (!date) return undefined;
	const normalized = date.trim().replace(/[._]/g, '-');
	const timestamp = Date.parse(`${normalized}T00:00:00.000Z`);
	if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || Number.isNaN(timestamp) || new Date(timestamp).toISOString().slice(0, 10) !== normalized) {
		return undefined;
	}
	return new Date(timestamp);
}

export function resolveTrackDate(trackMeta?: MusicMetadata): { date?: Date; dateString?: string } {
	// 1. Explicit track metadata date
	if (trackMeta?.date) {
		const parsed = parseMusicDate(trackMeta.date);
		if (parsed) return { date: parsed, dateString: trackMeta.date };
	}

	return { date: undefined, dateString: undefined };
}

export function resolveFolderDate(
	folderName: string,
	folderMeta?: MusicMetadata
): { date?: Date; dateString?: string } {
	// 1. Explicit folder metadata date
	if (folderMeta?.date) {
		const parsed = parseMusicDate(folderMeta.date);
		if (parsed) return { date: parsed, dateString: folderMeta.date };
	}

	// 2. Date pattern in folder name
	const dateMatch = folderName.match(/\b(20\d{2})[-._](0[1-9]|1[0-2])[-._](0[1-9]|[12]\d|3[01])\b/);
	if (dateMatch) {
		const dateStr = `${dateMatch[1]}-${dateMatch[2]}-${dateMatch[3]}`;
		const parsed = parseMusicDate(dateStr);
		if (parsed) return { date: parsed, dateString: dateStr };
	}

	return { date: undefined, dateString: undefined };
}

export function getAudioMimeType(extension: string): string {
	const ext = extension.toLowerCase();
	switch (ext) {
		case '.flac':
			return 'audio/flac';
		case '.mp3':
			return 'audio/mpeg';
		case '.ogg':
		case '.oga':
			return 'audio/ogg';
		case '.wav':
			return 'audio/wav';
		case '.m4a':
		case '.aac':
			return 'audio/mp4';
		case '.opus':
			return 'audio/opus';
		case '.webm':
			return 'audio/webm';
		case '.mid':
		case '.midi':
			return 'audio/midi';
		case '.aif':
		case '.aiff':
			return 'audio/aiff';
		default:
			return 'audio/mpeg';
	}
}

export function getVideoMimeType(extension: string): string {
	switch (extension.toLowerCase()) {
		case '.webm': return 'video/webm';
		case '.ogv': return 'video/ogg';
		case '.mov': return 'video/quicktime';
		case '.m4v':
		case '.mp4':
		default: return 'video/mp4';
	}
}

export function createMusicPlayer({ url: rawUrl, date }: (typeof musicEmbeds)[number]['embeds'][number]): EmbeddedPlayer {
	let url: URL;
	try {
		url = new URL(rawUrl);
	} catch {
		throw new Error(`음악 임베드 URL이 올바르지 않습니다: ${rawUrl}`);
	}

	if (url.protocol !== 'https:') {
		throw new Error(`음악 임베드 URL은 HTTPS여야 합니다: ${rawUrl}`);
	}

	const hostname = url.hostname.toLowerCase().replace(/^www\./, '');
	if (hostname === 'youtube.com' || hostname === 'm.youtube.com' || hostname === 'music.youtube.com' || hostname === 'youtube-nocookie.com' || hostname === 'youtu.be') {
		const parts = url.pathname.split('/').filter(Boolean);
		const videoId = hostname === 'youtu.be'
			? parts[0]
			: url.searchParams.get('v') ?? (['embed', 'shorts', 'live'].includes(parts[0] ?? '') ? parts[1] : undefined);
		if (!videoId || !/^[\w-]{11}$/.test(videoId)) {
			throw new Error(`YouTube 동영상 URL을 확인해 주세요: ${rawUrl}`);
		}
		return {
			provider: 'YouTube',
			src: `https://www.youtube-nocookie.com/embed/${videoId}`,
			height: 315,
			date: parseMusicDate(date),
		};
	}

	if (hostname === 'soundcloud.com') {
		url.search = '';
		return {
			provider: 'SoundCloud',
			src: `https://w.soundcloud.com/player/?${new URLSearchParams({
				url: url.href,
				color: '#ff5500',
				auto_play: 'false',
				hide_related: 'true',
				show_comments: 'false',
				show_user: 'true',
				show_reposts: 'false',
				visual: 'false',
			})}`,
			height: 166,
			date: parseMusicDate(date),
		};
	}

	if (hostname === 'open.spotify.com') {
		const [type, id] = url.pathname.split('/').filter(Boolean);
		if (!['track', 'album', 'playlist', 'episode', 'show'].includes(type ?? '') || !id || !/^[\w]+$/.test(id)) {
			throw new Error(`Spotify 곡·앨범·플레이리스트 URL을 확인해 주세요: ${rawUrl}`);
		}
		return {
			provider: 'Spotify',
			src: `https://open.spotify.com/embed/${type}/${id}`,
			height: type === 'track' || type === 'episode' ? 152 : 352,
			date: parseMusicDate(date),
		};
	}

	throw new Error(`지원하지 않는 음악 서비스 URL입니다: ${rawUrl}`);
}

export function createMusicEmbed({ title, embeds, description = '' }: (typeof musicEmbeds)[number]): EmbeddedMusic {
	if (embeds.length === 0) {
		throw new Error(`음악 섹션에 임베드 URL을 하나 이상 입력해 주세요: ${title}`);
	}
	return {
		title,
		description,
		players: embeds.map(createMusicPlayer),
	};
}

export type MusicData = {
	tracks: MusicFile[];
	folders: MusicFolder[];
	embeddedMusic: EmbeddedMusic[];
	totalTracks: number;
	totalEmbeddedPlayers: number;
	hasMusic: boolean;
};

export async function getMusicData(): Promise<MusicData> {
	const musicRoot = resolve(process.cwd(), 'public/music');
	const previewRoot = resolve(process.cwd(), 'public/music-previews');
	const folderMap = new Map<string, MusicFile[]>();
	const allTracks: MusicFile[] = [];

	if (existsSync(musicRoot)) {
		async function collectMusic(directory: string) {
			for (const entry of await readdir(directory, { withFileTypes: true })) {
				const fullPath = join(directory, entry.name);
				if (entry.isDirectory()) {
					await collectMusic(fullPath);
					continue;
				}

				const extension = extname(entry.name).toLowerCase();
				if (!entry.isFile() || !MEDIA_EXTENSIONS.has(extension)) continue;

				const relativePath = relative(musicRoot, fullPath);
				const folderPath = dirname(relativePath);
				const folder = folderPath === '.' ? '기타' : folderPath.split(sep).join('/');
				const folderSlug = folderPath === '.' ? 'etc' : folderPath.split(sep).join('/');
				const baseNameWithoutExt = entry.name.slice(0, -extension.length);

				// Slug for page URL: folder/track_basename
				const isVideo = VIDEO_EXTENSIONS.has(extension);
				const slugName = isVideo ? entry.name : baseNameWithoutExt;
				const slug = folderPath === '.' ? slugName : `${folderPath.split(sep).join('/')}/${slugName}`;
				const permalink = `/music/${slug.split('/').map(encodeURIComponent).join('/')}`;
				const embedUrl = `${permalink}/embed`;

				const trackMeta = musicTrackMetadata[relativePath];

				const dateInfo = resolveTrackDate(trackMeta);
				const date = dateInfo.date;
				const dateString = dateInfo.dateString;
				const description = trackMeta?.description || '';

				// Preview assets in public/music-previews
				const previewRelBase = folderPath === '.' ? baseNameWithoutExt : `${folderPath.split(sep).join('/')}/${baseNameWithoutExt}`;
				const previewVideoPath = join(previewRoot, `${previewRelBase}.mp4`);
				const previewImagePath = join(previewRoot, `${previewRelBase}.png`);

				const videoSrc = existsSync(previewVideoPath)
					? `/music-previews/${previewRelBase.split('/').map(encodeURIComponent).join('/')}.mp4`
					: undefined;
				const imageSrc = existsSync(previewImagePath)
					? `/music-previews/${previewRelBase.split('/').map(encodeURIComponent).join('/')}.png`
					: undefined;

				const isMidi = ['.mid', '.midi'].includes(extension);

				const track: MusicFile = {
					id: relativePath,
					name: entry.name,
					title: entry.name,
					slug,
					permalink,
					embedUrl,
					src: `/music/${relativePath.split(sep).map(encodeURIComponent).join('/')}`,
					format: extension.slice(1).toUpperCase(),
					mimeType: isVideo ? getVideoMimeType(extension) : getAudioMimeType(extension),
					folder,
					folderSlug,
					relativePath,
					description,
					date,
					dateString,
					videoSrc,
					imageSrc,
					isMidi,
					isVideo,
				};

				allTracks.push(track);
				const list = folderMap.get(folder) ?? [];
				list.push(track);
				folderMap.set(folder, list);
			}
		}

		await collectMusic(musicRoot);
	}

	const folders: MusicFolder[] = [...folderMap.entries()]
		.map(([name, files]) => {
			const metadata = musicFolderMetadata[name];
			const folderPath = files[0]?.folderSlug ?? name;
			const folderDateInfo = resolveFolderDate(name, metadata);
			return {
				name,
				slug: folderPath,
				index: 0,
				description: metadata?.description ?? '',
				date: folderDateInfo.date,
				files: files.sort((a, b) => a.name.localeCompare(b.name, 'ko')),
			};
		})
		.sort((a, b) => a.name.localeCompare(b.name, 'ko'))
		.map((f, index) => ({ ...f, index }));

	const embeddedMusic = musicEmbeds.map(createMusicEmbed);
	const totalTracks = allTracks.length;
	const totalEmbeddedPlayers = embeddedMusic.reduce((count, music) => count + music.players.length, 0);
	const hasMusic = folders.length > 0 || embeddedMusic.length > 0;

	return {
		tracks: allTracks,
		folders,
		embeddedMusic,
		totalTracks,
		totalEmbeddedPlayers,
		hasMusic,
	};
}
