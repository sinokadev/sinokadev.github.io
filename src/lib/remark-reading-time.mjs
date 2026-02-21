import getReadingTime from 'reading-time';
import { toString } from 'mdast-util-to-string';

export function remarkReadingTime() {
  return function (tree, { data }) {
    const textOnPage = toString(tree);
    const readingTime = getReadingTime(textOnPage);
    
    // readingTime.minutes는 소수점으로 나옵니다 (예: 2.5)
    // 이를 반올림(Math.ceil)하여 "X분" 형식으로 만듭니다.
    const minutes = Math.ceil(readingTime.minutes);
    
    // data.astro.frontmatter에 한국어 형식으로 저장
    data.astro.frontmatter.minutesRead = `${minutes}분 소요`;
  };
}