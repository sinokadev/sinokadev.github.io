<script lang="ts">
  type Layout = 'qwerty' | 'hangul' | 'dvorak' | 'colemak';

  // 각 레이아웃별 텍스트 상태
  let values: Record<Layout, string> = {
    qwerty: '',
    hangul: '',
    dvorak: '',
    colemak: '',
  };

  // 복사 완료 피드백 상태
  let copiedLayout: Layout | null = null;
  let copyTimeout: number;

  // ───────────────────────────────────────────────
  // 1. QWERTY <-> Dvorak / Colemak 매핑
  // ───────────────────────────────────────────────
  const Q_LOWER = "`1234567890-=qwertyuiop[]\\asdfghjkl;'zxcvbnm,./";
  const Q_UPPER = "~!@#$%^&*()_+QWERTYUIOP{}|ASDFGHJKL:\"ZXCVBNM<>?";

  const D_LOWER = "`1234567890[]',.pyfgcrl/=\\aoeuidhtns-;qjkxbmwvz";
  const D_UPPER = "~!@#$%^&*(){}\"<>PYFGCRL?+|AOEUIDHTNS_:QJKXBMWVZ";

  const C_LOWER = "`1234567890-=qwfpgjluy;[]\\arstdhneio'zxcvbkm,./";
  const C_UPPER = "~!@#$%^&*()_+QWFPGJLUY:{}|ARSTDHNEIO\"ZXCVBKM<>?";

  function buildMaps(lower: string, upper: string) {
    const fromQwerty: Record<string, string> = {};
    const toQwerty: Record<string, string> = {};
    for (const [qs, ts] of [[Q_LOWER, lower], [Q_UPPER, upper]]) {
      for (let i = 0; i < qs.length; i++) {
        fromQwerty[qs[i]] = ts[i];
        toQwerty[ts[i]] = qs[i];
      }
    }
    return { fromQwerty, toQwerty };
  }

  const { fromQwerty: qwertyToDvorak, toQwerty: dvorakToQwerty } = buildMaps(D_LOWER, D_UPPER);
  const { fromQwerty: qwertyToColemak, toQwerty: colemakToQwerty } = buildMaps(C_LOWER, C_UPPER);

  // ───────────────────────────────────────────────
  // 2. QWERTY 키 <-> 2벌식 자모 & 한글 오토마타
  // ───────────────────────────────────────────────
  const KEY_TO_JAMO: Record<string, string> = {
    q: 'ㅂ', w: 'ㅈ', e: 'ㄷ', r: 'ㄱ', t: 'ㅅ', y: 'ㅛ', u: 'ㅕ', i: 'ㅑ', o: 'ㅐ', p: 'ㅔ',
    a: 'ㅁ', s: 'ㄴ', d: 'ㅇ', f: 'ㄹ', g: 'ㅎ', h: 'ㅗ', j: 'ㅓ', k: 'ㅏ', l: 'ㅣ',
    z: 'ㅋ', x: 'ㅌ', c: 'ㅊ', v: 'ㅍ', b: 'ㅠ', n: 'ㅜ', m: 'ㅡ',
  };
  const SHIFT_JAMO: Record<string, string> = {
    Q: 'ㅃ', W: 'ㅉ', E: 'ㄸ', R: 'ㄲ', T: 'ㅆ', O: 'ㅒ', P: 'ㅖ',
  };

  const JAMO_TO_KEY: Record<string, string> = {};
  for (const [k, j] of Object.entries(KEY_TO_JAMO)) JAMO_TO_KEY[j] = k;
  for (const [k, j] of Object.entries(SHIFT_JAMO)) JAMO_TO_KEY[j] = k;

  const COMPOUND_KEYS: Record<string, string> = {
    'ㅘ': 'hk', 'ㅙ': 'ho', 'ㅚ': 'hl',
    'ㅝ': 'nj', 'ㅞ': 'np', 'ㅟ': 'nl', 'ㅢ': 'ml',
    'ㄳ': 'rt', 'ㄵ': 'sw', 'ㄶ': 'sg',
    'ㄺ': 'fr', 'ㄻ': 'fa', 'ㄼ': 'fq', 'ㄽ': 'ft',
    'ㄾ': 'fx', 'ㄿ': 'fv', 'ㅀ': 'fg', 'ㅄ': 'qt',
  };

  const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
  const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
  const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

  const DOUBLE_JUNG: Record<string, string> = {
    'ㅗㅏ': 'ㅘ', 'ㅗㅐ': 'ㅙ', 'ㅗㅣ': 'ㅚ',
    'ㅜㅓ': 'ㅝ', 'ㅜㅔ': 'ㅞ', 'ㅜㅣ': 'ㅟ',
    'ㅡㅣ': 'ㅢ',
  };
  const DOUBLE_JONG: Record<string, string> = {
    'ㄱㅅ': 'ㄳ', 'ㄴㅈ': 'ㄵ', 'ㄴㅎ': 'ㄶ',
    'ㄹㄱ': 'ㄺ', 'ㄹㅁ': 'ㄻ', 'ㄹㅂ': 'ㄼ', 'ㄹㅅ': 'ㄽ',
    'ㄹㅌ': 'ㄾ', 'ㄹㅍ': 'ㄿ', 'ㄹㅎ': 'ㅀ', 'ㅂㅅ': 'ㅄ',
  };
  const SPLIT_JONG: Record<string, [string, string]> = {};
  for (const [pair, merged] of Object.entries(DOUBLE_JONG)) {
    SPLIT_JONG[merged] = [pair[0], pair[1]];
  }

  const VOWELS = new Set(['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅛ','ㅜ','ㅠ','ㅡ','ㅣ']);

  function keyToJamo(k: string): string | null {
    if (SHIFT_JAMO[k]) return SHIFT_JAMO[k];
    const lower = k.toLowerCase();
    return KEY_TO_JAMO[lower] ?? null;
  }

  function jamoToKeys(j: string): string | null {
    if (COMPOUND_KEYS[j]) return COMPOUND_KEYS[j];
    return JAMO_TO_KEY[j] ?? null;
  }

  function hangulToKeys(text: string): string {
    let keys = '';
    for (const ch of text) {
      const code = ch.codePointAt(0)!;
      if (code >= 0xac00 && code <= 0xd7a3) {
        const s = code - 0xac00;
        const cho = Math.floor(s / 588);
        const jung = Math.floor((s % 588) / 28);
        const jong = s % 28;
        keys += jamoToKeys(CHO[cho]) ?? '';
        keys += jamoToKeys(JUNG[jung]) ?? '';
        if (jong) keys += jamoToKeys(JONG[jong]) ?? '';
      } else {
        keys += jamoToKeys(ch) ?? ch;
      }
    }
    return keys;
  }

  function keysToHangul(keys: string): string {
    let out = '';
    let cho = '', jung = '', jong = '';

    const flush = () => {
      if (cho && jung) {
        const code =
          0xac00 + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28 + (jong ? JONG.indexOf(jong) : 0);
        out += String.fromCharCode(code);
      } else {
        out += cho + jung + jong;
      }
      cho = jung = jong = '';
    };

    for (const k of keys) {
      const j = keyToJamo(k);

      if (!j) {
        flush();
        out += k;
        continue;
      }

      if (VOWELS.has(j)) {
        if (!cho) {
          out += j;
          continue;
        }
        if (!jung) {
          jung = j;
          continue;
        }
        if (!jong) {
          const merged = DOUBLE_JUNG[jung + j];
          if (merged) {
            jung = merged;
          } else {
            flush();
            out += j;
          }
          continue;
        }
        let nextCho: string;
        const split = SPLIT_JONG[jong];
        if (split) {
          jong = split[0];
          nextCho = split[1];
        } else {
          nextCho = jong;
          jong = '';
        }
        flush();
        cho = nextCho;
        jung = j;
        continue;
      }

      if (!cho) {
        cho = j;
        continue;
      }
      if (!jung) {
        flush();
        cho = j;
        continue;
      }
      if (!jong) {
        if (JONG.includes(j)) {
          jong = j;
        } else {
          flush();
          cho = j;
        }
        continue;
      }
      const merged = DOUBLE_JONG[jong + j];
      if (merged) {
        jong = merged;
      } else {
        flush();
        cho = j;
      }
    }
    flush();
    return out;
  }

  // ───────────────────────────────────────────────
  // 3. 변환 및 핸들러 로직
  // ───────────────────────────────────────────────
  const mapChars = (text: string, map: Record<string, string>) =>
    Array.from(text, (ch) => map[ch] ?? ch).join('');

  const toKeys: Record<Layout, (t: string) => string> = {
    qwerty: (t) => t,
    dvorak: (t) => mapChars(t, dvorakToQwerty),
    colemak: (t) => mapChars(t, colemakToQwerty),
    hangul: hangulToKeys,
  };

  const fromKeys: Record<Layout, (k: string) => string> = {
    qwerty: (k) => k,
    dvorak: (k) => mapChars(k, qwertyToDvorak),
    colemak: (k) => mapChars(k, qwertyColemak),
    hangul: keysToHangul,
  };

  const layouts: Layout[] = ['qwerty', 'hangul', 'dvorak', 'colemak'];

  // 특정 입력창이 변경되었을 때 나머지 3개 입력창 동기화
  function handleInput(source: Layout) {
    const keys = toKeys[source](values[source]);
    for (const l of layouts) {
      if (l !== source) {
        values[l] = fromKeys[l](keys);
      }
    }
  }

  function handleClear() {
    values = { qwerty: '', hangul: '', dvorak: '', colemak: '' };
  }

  async function handleCopy(l: Layout) {
    try {
      await navigator.clipboard.writeText(values[l]);
      copiedLayout = l;
      clearTimeout(copyTimeout);
      copyTimeout = window.setTimeout(() => {
        copiedLayout = null;
      }, 1000);
    } catch {
      // 복사 실패 시 예외 처리
    }
  }

  const sections: { id: Layout; label: string; placeholder: string }[] = [
    { id: 'qwerty', label: 'QWERTY (영문)', placeholder: 'QWERTY 자판으로 친 글자...' },
    { id: 'hangul', label: '한글 (2벌식)', placeholder: '2벌식 한글로 친 글자...' },
    { id: 'dvorak', label: 'Dvorak (영문)', placeholder: 'Dvorak 자판으로 친 글자...' },
    { id: 'colemak', label: 'Colemak (영문)', placeholder: 'Colemak 자판으로 친 글자...' },
  ];
</script>

<div class="kbd-converter">
  <h2>QWERTY ⇄ 2벌식 ⇄ Dvorak ⇄ Colemak 변환기</h2>
  <p class="desc">
    같은 물리 키를 눌렀을 때 각 자판 배열에서 나오는 글자를 서로 변환해요.
  </p>

  {#each sections as { id, label, placeholder }}
    <div class="section">
      <div class="label-row">
        <label for="kbd-{id}">{label}</label>
        <span class="btns">
          <button type="button" on:click={() => handleCopy(id)}>
            {copiedLayout === id ? '복사됨!' : '복사'}
          </button>
          {#if id === 'qwerty'}
            <button type="button" on:click={handleClear}>전체 지우기</button>
          {/if}
        </span>
      </div>
      <textarea
        id="kbd-{id}"
        bind:value={values[id]}
        on:input={() => handleInput(id)}
        {placeholder}
        spellcheck="false"
      ></textarea>
    </div>
  {/each}
</div>

<style>
  .kbd-converter {
    --kbd-bg: #ffffff;
    --kbd-fg: #1f2328;
    --kbd-border: #d0d7de;
    --kbd-accent: #3b82f6;
    --kbd-muted: #656d76;
    max-width: 720px;
    margin: 0 auto;
    padding: 1.25rem;
    color: var(--kbd-fg);
  }
  @media (prefers-color-scheme: dark) {
    .kbd-converter {
      --kbd-bg: #161b22;
      --kbd-fg: #e6edf3;
      --kbd-border: #30363d;
      --kbd-muted: #8b949e;
    }
  }
  h2 {
    margin: 0 0 0.25rem;
  }
  .desc {
    margin: 0 0 1.25rem;
    color: var(--kbd-muted);
    font-size: 0.9rem;
  }
  .section {
    margin-bottom: 1rem;
  }
  .label-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.35rem;
  }
  label {
    font-weight: 600;
    font-size: 0.95rem;
  }
  .btns {
    display: flex;
    gap: 0.4rem;
  }
  button {
    font: inherit;
    font-size: 0.8rem;
    padding: 0.2rem 0.6rem;
    border: 1px solid var(--kbd-border);
    border-radius: 6px;
    background: transparent;
    color: var(--kbd-fg);
    cursor: pointer;
  }
  button:hover {
    border-color: var(--kbd-accent);
    color: var(--kbd-accent);
  }
  textarea {
    width: 100%;
    min-height: 6rem;
    box-sizing: border-box;
    padding: 0.6rem 0.75rem;
    font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, 'Noto Sans KR', monospace;
    font-size: 1rem;
    line-height: 1.5;
    background: var(--kbd-bg);
    color: var(--kbd-fg);
    border: 1px solid var(--kbd-border);
    border-radius: 8px;
    resize: vertical;
  }
  textarea:focus {
    outline: 2px solid var(--kbd-accent);
    outline-offset: -1px;
  }
</style>