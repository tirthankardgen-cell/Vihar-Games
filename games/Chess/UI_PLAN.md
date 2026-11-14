# Chess UI implementation plan

## Art direction

Follow GAME_SPEC.md sections 7 and 8 and the inspected Gulam Chor courtyard previews. Use an illustrated ochre/terracotta neighborhood, neem foliage, teal shutters, chai and charpoy details, cream Hindi lettering, and locally bundled Yatra One/Hind. Keep artwork native SVG and all board graphics flat. The cover has a full-screen courtyard scene, a large live शतरंज title, and Play/How to Play actions. Do not introduce separate club branding.

Carry the same courtyard through mode selection, computer/pass-and-play setup, room preparation, and paged rules. Quiet cream paper surfaces hold forms; selected options use ink, a border, and a check. Portraits are clipped within their badge. Room actions remain unavailable until backend credentials are supplied.

## Playing area

Use Chess.com's information organization as inspiration: a large square board on the left, narrow player strips directly above and below, and a fixed move/action rail on the right. Remove ornamental headings and footer space from active play. Size the board from available viewport height and width rather than a small fixed maximum. Keep the final position visible during handover and results.

Phones get a full-width board, compact status/actions, and separate move-history/options dialogs. Short landscape screens retain the side rail with secondary panels available by button. Long rules and histories use paging. Every route and state fits the viewport; only an unusually constrained dialog or accessibility zoom may scroll internally to keep all controls reachable.

## Verification and delivery

Check desktop 1440×900/1280×720, phone 390×844/360×740, landscape, and embedded viewports. Inspect screenshots against Gulam Chor, measure board size and overflow, and exercise setup, keyboard/touch moves, AI, save/resume, handover, promotion, draws, results, and dialogs. Run the repository check command, then commit and push the completed changes to main.

## Mandatory single-viewport presentation

Every screen must fit within one dynamic viewport (`100dvh`), including the overview, mode selection, setup, rules, gameplay, pause, handover, results, room forms, and confirmations where applicable. There must be no browser-page scrolling during normal use. Size the board and artwork from both available width and height, and keep all essential actions visible. Use Previous/Next pages for long rules and histories; dense boards may use zoom/pan inside a fixed board area while controls stay in view. Dialogs also fit the viewport. Preserve access at accessibility zoom without clipping essential content. Verify desktop, phone portrait, short landscape, and embedded player sizes.
