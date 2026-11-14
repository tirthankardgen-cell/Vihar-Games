export type IconName = "arrow" | "back" | "people" | "room" | "join" | "flip" | "undo" | "draw" | "claim" | "flag" | "leave" | "book" | "close" | "check" | "sun";
export function Icon({ name }: { name: IconName }) {
  const paths: Record<IconName, React.ReactNode> = {
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    back: <path d="M20 12H5m6-6-6 6 6 6" />,
    people: <><circle cx="8" cy="8" r="3" /><path d="M2 20v-2a6 6 0 0 1 12 0v2m1-15a3 3 0 0 1 0 6m3 3a5 5 0 0 1 4 4v2" /></>,
    room: <><path d="M4 21V8l8-5 8 5v13H4Zm5 0v-8h6v8" /><path d="M12 7v3m-1.5-1.5h3" /></>,
    join: <><path d="M14 4h6v16h-6M3 12h12m-4-4 4 4-4 4" /></>,
    flip: <><path d="M4 8a8 8 0 0 1 14-2l2 2M20 3v5h-5M20 16a8 8 0 0 1-14 2l-2-2m0 5v-5h5" /></>,
    undo: <><path d="m8 5-5 5 5 5M3 10h11a6 6 0 0 1 0 12" /></>,
    draw: <><path d="m3 8 5-3 4 2 4-2 5 3-3 9-5 3-4-3-4-2-2-7Z" /><path d="m8 5 4 2-3 4 2 2 4-3 5 4m-8 2 3 3" /></>,
    claim: <><path d="M7 3h10v18H4V6h3V3Zm0 0v5h10" /><path d="m8 15 2 2 5-5" /></>,
    flag: <path d="M5 22V3m0 1c5-4 9 4 14 0v10c-5 4-9-4-14 0" />,
    leave: <><path d="M10 4H4v16h6m3-12 4 4-4 4m-5-4h13" /></>,
    book: <><path d="M12 5c-3-2-7-2-10-1v15c3-1 7-1 10 1 3-2 7-2 10-1V4c-3-1-7-1-10 1Zm0 0v15" /></>,
    close: <path d="m6 6 12 12M6 18 18 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    sun: <><circle cx="12" cy="12" r="4" /><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2" /></>,
  };
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
