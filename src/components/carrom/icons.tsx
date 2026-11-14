type IconName = "arrow" | "back" | "book" | "people" | "sun" | "room" | "check" | "target" | "reset" | "close" | "user" | "spark" | "trophy" | "lock" | "save" | "sliders" | "hand" | "cup" | "pause" | "play" | "more" | "crown";

export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    pause: <><path d="M8 5v14M16 5v14" strokeWidth="3" /></>,
    play: <path d="m8 4 12 8-12 8Z" />,
    more: <><circle cx="5" cy="12" r="1.5" fill="currentColor" /><circle cx="12" cy="12" r="1.5" fill="currentColor" /><circle cx="19" cy="12" r="1.5" fill="currentColor" /></>,
    crown: <><path d="m3 7 5 5 4-9 4 9 5-5-2 12H5L3 7Zm3 15h12" /><circle cx="3" cy="5" r="1" /><circle cx="21" cy="5" r="1" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    back: <path d="M20 12H5m6-6-6 6 6 6" />,
    book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" /></>,
    people: <><circle cx="8" cy="8" r="3" /><path d="M2 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m3 3a5 5 0 0 1 4 4v2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
    room: <><rect x="2" y="3" width="13" height="12" rx="3" /><path d="m5 15-1 4 5-4m9-7h1a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3h-1l-3 2v-2h-3a3 3 0 0 1-3-3" /><circle cx="6.5" cy="9" r=".7" /><circle cx="10.5" cy="9" r=".7" /></>,
    user: <><circle cx="12" cy="7" r="4" /><path d="M4 21v-2a8 8 0 0 1 16 0v2" /></>,
    spark: <><path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5Z" /><path d="M20 2v4m-2-2h4" /></>,
    trophy: <><path d="M7 3h10v6a5 5 0 0 1-10 0V3Zm0 2H3v3a4 4 0 0 0 5 4m9-7h4v3a4 4 0 0 1-5 4M12 14v5m-5 3h10m-7-3h4v3h-4Z" /></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="3" /><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" /></>,
    save: <><path d="M5 3h12l4 4v14H3V3h2Zm2 0v6h10V3M7 21v-8h10v8" /><path d="M14 5v2" /></>,
    sliders: <><path d="M4 3v7m0 4v7M12 3v12m0 4v2M20 3v2m0 4v12M1 10h6v4H1Zm8 5h6v4H9Zm8-10h6v4h-6Z" /></>,
    hand: <><path d="M8 13V5a2 2 0 0 1 4 0v6m0-3h2a2 2 0 0 1 2 2h2a2 2 0 0 1 2 2v4a6 6 0 0 1-6 6h-1c-2 0-4-1-5-3l-4-6a2 2 0 0 1 3-2l3 3" /></>,
    cup: <><path d="M4 9h13v6a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5V9Zm13 1h2a3 3 0 0 1 0 6h-2M2 22h18M8 6c-2-2 2-2 0-4m5 4c-2-2 2-2 0-4" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3" /></>,
    reset: <><path d="M4 9a8 8 0 1 1 0 6M4 3v6h6" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
