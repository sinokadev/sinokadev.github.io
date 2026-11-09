<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let originalPrice: string = '360,000,000원';
  export let offerPrice: string = '0원';
  export let discountText: string = '100% 할인';

  let now = Date.now();
  let timer: number;
  let endsAt: number = 0;

  onMount(() => {
    // 2 ~ 13시간 사이 랜덤 타이머 (밀리초)
    const duration = (2 + Math.random() * 11) * 60 * 60 * 1_000;
    endsAt = Date.now() + duration;

    timer = window.setInterval(() => {
      now = Date.now();
    }, 1_000);
  });

  onDestroy(() => {
    clearInterval(timer);
  });

  // 남은 시간 계산 (반응형)
  $: remaining = Math.max(0, endsAt - now);

  $: clockText = (() => {
    if (!endsAt) return '--:--:--';

    const hours = Math.floor(remaining / 3_600_000);
    const minutes = Math.floor((remaining % 3_600_000) / 60_000);
    const seconds = Math.floor((remaining % 60_000) / 1_000);

    return [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, '0'))
      .join(':');
  })();
</script>

<section class="special-offer" aria-label="특별 할인 행사">
  <p class="offer-title">특별 할인가</p>
  <div class="offer-prices">
    <del>{originalPrice}</del>
    <span class="offer-arrow" aria-hidden="true">→</span>
    <strong class="offer-price">{offerPrice}</strong>
    <span class="offer-discount">{discountText}</span>
  </div>
  <p class="offer-timer">
    특별 할인가 끝나기까지 <strong>{clockText}</strong>
  </p>
</section>

<style>
  .special-offer {
    max-width: 26rem;
    margin: 1.5rem auto;
    padding: 0.8rem 0 0.7rem;
    border-top: 2px solid #c82027;
    border-bottom: 1px solid #d8d2cc;
    color: inherit;
    text-align: center;
  }

  .offer-title {
    margin: 0 0 0.4rem;
    color: #555;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .offer-prices {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: center;
    gap: 0.5rem;
  }

  .offer-prices del {
    color: #777;
    font-size: 0.95rem;
  }

  .offer-arrow {
    color: #777;
  }

  .offer-price {
    color: #c82027;
    font-size: 2.1rem;
    font-weight: 750;
    line-height: 1.2;
  }

  .offer-discount {
    color: #c82027;
    font-size: 0.85rem;
    font-weight: 700;
    white-space: nowrap;
  }

  .offer-timer {
    margin: 0.55rem 0 0;
    color: #666;
    font-size: 0.85rem;
  }

  .offer-timer strong {
    color: #c82027;
    font-variant-numeric: tabular-nums;
    font-weight: 700;
  }
</style>