<script lang="ts">
  import { onMount, onDestroy } from 'svelte';

  export let targetDate: string;
  export let label: string | undefined = undefined;

  let now = Date.now();
  let timer: number;

  onMount(() => {
    timer = window.setInterval(() => {
      now = Date.now();
    }, 1_000);
  });

  onDestroy(() => {
    clearInterval(timer);
  });

  // targetDate가 변경되거나 now가 갱신될 때마다 자동으로 재계산
  $: targetTime = new Date(targetDate).getTime();
  $: remaining = targetTime - now;

  // KST 기준 D-Day 계산
  $: calendarDays = (() => {
    const kstToday = new Date(now + 9 * 60 * 60 * 1000);
    const todayAtUtc = Date.UTC(
      kstToday.getUTCFullYear(),
      kstToday.getUTCMonth(),
      kstToday.getUTCDate()
    );

    const kstTarget = new Date(targetTime + 9 * 60 * 60 * 1000);
    const targetAtUtc = Date.UTC(
      kstTarget.getUTCFullYear(),
      kstTarget.getUTCMonth(),
      kstTarget.getUTCDate()
    );

    return Math.round((targetAtUtc - todayAtUtc) / 86_400_000);
  })();

  // 화면 표시 텍스트 반응형 계산
  $: dDayText = (() => {
    if (calendarDays > 0) return `D-${calendarDays}`;
    if (calendarDays === 0) return 'D-DAY';
    return `D+${Math.abs(calendarDays)}`;
  })();

  $: clockText = (() => {
    const duration = Math.abs(remaining);
    const days = Math.floor(duration / 86_400_000);
    const hours = Math.floor((duration % 86_400_000) / 3_600_000);
    const minutes = Math.floor((duration % 3_600_000) / 60_000);
    const seconds = Math.floor((duration % 60_000) / 1_000);
    const clock = [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, '0'))
      .join(':');

    return remaining >= 0
      ? `남은 시간 ${days}일 ${clock}`
      : `지난 시간 ${days}일 ${clock}`;
  })();
</script>

<section class="countdown" aria-live="polite" aria-atomic="true">
  {#if label}
    <p class="countdown-label">{label}</p>
  {/if}
  <p class="countdown-number">{dDayText}</p>
  <p class="countdown-time">{clockText}</p>
</section>

<style>
  .countdown {
    margin: 2rem 0;
    padding: 2rem 1rem;
    text-align: center;
  }
  .countdown-label {
    margin: 0 0 0.5rem;
    font-size: 1.1rem;
    font-weight: 600;
    opacity: 0.9;
  }
  .countdown-number {
    margin: 0;
    font-size: clamp(3rem, 14vw, 7rem);
    font-weight: 800;
    line-height: 1.1;
    font-variant-numeric: tabular-nums;
  }
  .countdown-time {
    margin: 0.5rem 0 0;
    font-size: 0.95rem;
    opacity: 0.75;
    font-variant-numeric: tabular-nums;
  }
</style>