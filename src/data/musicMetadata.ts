// Dates use YYYY-MM-DD.
export type MusicMetadata = {
	description?: string;
	date?: string;
};

export const musicTrackMetadata: Record<string, MusicMetadata> = {
	'2026-11-23/Project_143_elevater.flac': { description: '' },
	'2026-11-23/Project_143_original.flac': { description: '' },
	'2026-11-23/Project_143_reverbd.flac': { description: '' },
	'2026-11-23/Project_143_stereo.flac': { description: '' },
};

export const musicFolderMetadata: Record<string, MusicMetadata> = {
	'2026-11-23': {
		description: '제미나이가 만들어준 음악(미디파일을 생성하는 파이썬 코드를 생성하라는 식으로 만듬)을 리메이크? 해보았습니다. 하다보니 약간 요즘 관심있던 앨리베이터 음악스럽게 만들어졌어요. 마음에 듭니다.',
		date: '2026-11-23',
	},
};
