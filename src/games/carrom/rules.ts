export const CARROM_RULES_VERSION = "1.0.0";
export const carromModes = ["computer", "practice", "pass-and-play"] as const;

// The published casual singles variant, matching games/Carrom/GAME_SPEC.md.
export const carromRules = [
  { title: "A board between friends", items: [
    "Each player owns nine coins: cream or dark. Share one red queen. Clear your nine coins after the queen has been covered to win one board. This is our casual singles variant, rather than a complete tournament rulebook.",
    "Start with all nineteen coins arranged around the queen in the center. Assign colors before play and choose the opening player randomly. Alternate opening players on rematches. Practice is for repeated shots without an opponent, turn limit, or win/loss result.",
  ] },
  { title: "Place. Aim. Strike.", items: [
    "Place the striker on your baseline without overlapping a coin. Between the end circles it must touch both lines. On an end circle it must cover that circle completely and avoid the diagonal arrow. Choose direction and power, then confirm one shot.",
    "Wait for every piece to stop before placing the striker again. A shot resolves only after its pockets, fouls, and returned coins have been settled. No new shot begins while pieces are moving.",
    "A legal shot that pockets and retains at least one of your own coins earns another turn. Pocket only an opponent’s coin, or pocket nothing, and the turn passes. Opponent coins stay pocketed, subject to the uncovered-queen rule.",
  ] },
  { title: "Make room for the queen", items: [
    "You may pocket the queen only after pocketing at least one own coin in an earlier legal shot, while you still have an own coin remaining. Pocket it too early and it returns; your coins pocketed in that shot also return and your turn ends.",
    "Legally pocket the queen and retain an own coin in the same shot, after debt repayment, to cover it immediately. Otherwise you get one immediate cover attempt: your next shot must legally pocket and retain an own coin after repaying debt.",
    "If the cover attempt fails or is a foul, return the queen to the nearest free spot from the center and end the turn. A covered queen stays pocketed and is recorded for its covering player. Either player may then win by clearing their set.",
  ] },
  { title: "Fouls & a fair return", items: [
    "Pocketing the striker or sending any piece out of bounds is a foul. Return all your coins and any queen pocketed in that shot, return ejected coins, and end your turn. Legally pocketed opponent coins stay down unless their last coin must return because the queen is uncovered.",
    "A foul also returns one previously pocketed own coin. If none is available, you owe one coin. Debts accumulate. Newly pocketed own coins return to repay debt before checking queen cover, an extra turn, or victory.",
    "A shot that only repays debt earns no extra turn unless it grants the queen’s one cover attempt. Returned pieces go to the nearest unoccupied legal spot, searching deterministically from the center without overlap. Penalties always resolve before a winner is decided.",
  ] },
  { title: "The last coin", items: [
    "Your final own coin cannot win while the queen is uncovered: return that coin and end your turn. If you are eligible and legally pocket the queen together with your final own coin, retaining that coin after debt repayment, you cover the queen and win.",
    "Pocket an opponent’s last coin with the queen covered and the opponent wins after fouls and penalties resolve. If a legal shot also completes your own set, you win the simultaneous finish. With the queen uncovered, any would-be final coin returns.",
  ] },
  { title: "A little togetherness", items: [
    "Play practice, an Easy/Medium/Hard computer opponent, or pass-and-play on one device. In pass-and-play, finish any earned extra shots before handing over; the next player accepts the handover. Private online rooms are coming soon.",
    "Online rooms will use a six-character code and a shared settled board. A connected player may claim forfeit after 120 seconds of an opponent’s disconnect or current-turn inactivity. Resignation ends the board immediately. Both players accept an online rematch.",
    "Local boards save only settled positions on this device. Reload during a shot to restore the previous settled board and retake it. Practice has no opponent, penalty debt, or win/loss result. Pause and Exit work inside Vihar's embedded player too.",
  ] },
] as const;
