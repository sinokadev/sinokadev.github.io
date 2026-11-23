export type MusicEmbedSource = {
	url: string;
	date?: string;
};

export type MusicEmbed = {
	title: string;
	embeds: MusicEmbedSource[];
	description?: string;
};

export const musicEmbeds: MusicEmbed[] = [
	{
		title: 'Super Mario World Game Over Remix',
		embeds: [{ url: 'https://www.youtube.com/watch?v=tkEI4-pLLJ0', date: '2026-10-07' }],
		description: '예전부터 해보고싶던 리믹스인데, 아이디어가 떠올라서 급하게 만들어봤었습니다. 솔직히 좀 급하게 마무리 되는 느낌이라 나중에 더 길게 만들어보고 싶네요.',
	},
	{
		title: '제목 추천좀',
		embeds: [{ url: 'https://www.youtube.com/watch?v=GGGYSTOTvUo', date: '2026-09-29' }],
		description: '심심해서 별로일거라고 생각하고 대충 만들었는데, 생각보다 좋아서 업로드했습니다. 별 생각없이 만든거라 제목도 안 지었어요.',
	},
	{
		title: 'Unknown World',
		embeds: [{ url: 'https://soundcloud.com/sinokadev/unknown-world', date: '2026-03-04' }, {url: "https://www.youtube.com/watch?v=CfZzniHhEX4", date: "2026-08-27"}],
		description: '사운드클라우드에 올린 버전을 만들고 항상 생각하던건데, 오프닝은 진짜 너무 창의적이고 좋은데 후반부가 너무 아쉽다 싶었어요. 유튜브에 올린 버전은 오프닝 빼고 완전 새로 만들어서 올린겁니다.',
	},
	{
		title: "Walking in the rain",
		embeds: [{ url: 'https://www.youtube.com/watch?v=CgXDZH8kl6M', date: '2026-08-01' }, { url: 'https://www.youtube.com/watch?v=qwancW1DkLo', date: '2026-08-04' }, { url: 'https://open.spotify.com/track/5Rew9f8K4FLF0uk7lsIT4n', date: '2026-08-05' }],
		description: '첫 버전(asdf)은 그냥 심심해서 코드 찍어봤는데, 생각보다 너무 좋아서 올렸어요. 그리고 며칠 뒤에 좀 다듬었더니 진짜 들을만 하고 맘에 들어서 발매한 버전이 8월 5일에 발매한 싱글 Walking in the rain입니다. 딱 하나 아쉬운점은 빗소리가 너무 작은것같아요.',
	}
];
