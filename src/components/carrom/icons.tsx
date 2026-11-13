type IconName = "arrow" | "back" | "book" | "people" | "sun" | "room" | "check" | "target" | "reset" | "close";

export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    close: <path d="m6 6 12 12M6 18 18 6" />,
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    back: <path d="M20 12H5m6-6-6 6 6 6" />,
    book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" /></>,
    people: <><circle cx="8" cy="8" r="3" /><path d="M2 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m3 3a5 5 0 0 1 4 4v2" /></>,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
    room: <><path d="M4 21V8l8-5 8 5v13H4Zm5 0v-8h6v8" /><path d="M12 7v3m-1.5-1.5h3" /></>,
    check: <path d="m5 12 4 4L19 6" />,
    target: <><circle cx="12" cy="12" r="8" /><circle cx="12" cy="12" r="3" /><path d="M12 1v3m0 16v3M1 12h3m16 0h3" /></>,
    reset: <><path d="M4 9a8 8 0 1 1 0 6M4 3v6h6" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
