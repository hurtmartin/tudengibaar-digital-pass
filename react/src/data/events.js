// `time` is a display label. `startsAt`/`endsAt` (Estonian winter time, +02:00) put a "now" chip on the home button
// while the slot runs; bingo's `endsAt` also marks its home button done once the phone's clock passes it.
// The contest runs past midnight, so its slot is on 5 Dec. The chase runs all night, so it has no times.
export const EVENTS = {
  bingo: {
    path: '/bingo',
    time: '22:15–23:00',
    startsAt: new Date('2026-12-04T22:15:00+02:00'),
    endsAt: new Date('2026-12-04T23:00:00+02:00'),
  },
  contest: {
    path: '/contest',
    time: '00:45–01:30',
    startsAt: new Date('2026-12-05T00:45:00+02:00'),
    endsAt: new Date('2026-12-05T01:30:00+02:00'),
  },
  chase: { path: '/chase' },
}

// True while the event's time slot is running
export function isLive(event, now) {
  return event.startsAt != null && now >= event.startsAt.getTime() && now < event.endsAt.getTime()
}
