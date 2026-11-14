import type { Match, Side } from "./engine.ts";

export const opponentName = "Ravi Mehta";
export type Mood = "welcome" | "thinking" | "playing" | "impressed" | "encouraging" | "delighted";
export type Remark = { text: string; mood: Mood };

// Local, position-aware dialogue. No chat service or network request during play.
export function opponentRemark(match: Match, humanSide: Side, thinking: boolean, moving: boolean): Remark {
  const pick = (lines: string[]) => lines[Math.floor(match.revision / 2) % lines.length];
  if (match.result) return match.result.winner === humanSide
    ? { mood: "impressed", text: match.result.reason === "resignation" ? "This one's yours. Shall we start fresh?" : "Beautifully played! You've earned the best chair in the veranda." }
    : { mood: "delighted", text: match.result.reason === "resignation" ? "Another board, whenever you're ready. I'll keep your seat." : "A lovely game. One more? The chai is still warm." };
  if (moving) return { mood: "playing", text: pick(["Let's see where this one takes us…", "A little touch. Let the board do the rest.", "Every bounce has a story."]) };
  if (match.revision === 0 && !thinking) return { mood: "welcome", text: "Come, take a seat. You bring the aim, I'll bring the friendly rivalry." };
  if (match.messages.some((message) => message.startsWith("Foul:"))) return { mood: "encouraging", text: match.turn === humanSide ? "Ah, my striker fancied a pocket too. Your chance!" : "It happens to all of us. A softer touch next time?" };
  if (match.queen === "pending") return { mood: "thinking", text: match.coverSide === humanSide ? "The queen is yours to cover. One of your coins, this very shot." : "Now for the cover. This is where a steady hand helps." };
  if (match.messages.some((message) => message.startsWith("Queen covered!"))) return { mood: "impressed", text: "Queen covered! Now it's a race for the last coin." };
  if (thinking) return { mood: "thinking", text: pick(["Hmm… that cushion might be my friend here.", "Give me a moment. I'm finding my angle.", "A steady hand beats a hurried shot. Let's see…", "There's a little gap there. Can I find it?"]) };
  if (match.messages.some((message) => message === "Your own coin earns another shot.")) return { mood: "impressed", text: pick(["Lovely pocket! Keep that rhythm going.", "Nicely done. The board is listening to you.", "Another one! You're making me work for my chai."]) };
  return { mood: "encouraging", text: pick(["Your turn. Sometimes the gentle shots are the clever ones.", "Take your time. A good angle is worth looking for.", "The cushion is part of the board too. Try a bank shot.", "No rush. We've got the whole evening."]) };
}
