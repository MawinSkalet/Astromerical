# Live Quiz redesign

The room is a classroom game with a presenter on a shared screen and players on phones. Keep the Zodiac & Numerals identity and matching answer shapes. The memorable element is now a living celestial atlas: four team constellations gather light around an engraved golden sun.

## Celestial Orbit visual revision

- Color: midnight sky #08172f, orbital blue #173959, parchment light #fdfcf9, solar gold #f1d89b, sea light #60ded0, and lilac light #b5a3ff. The four teams retain their red, teal, gold, and violet identities. Glow and gradients depict sunlight and star trails rather than decorating controls.
- Type: retain DM Sans / Noto Sans Thai for controls, questions, and scores; Lora for the entry headline. Use tabular figures for countdowns and animated totals. No new font dependency.
- Layout: retain the existing roster / setup split and large question / four-answer board. Give the atlas the full width below the question rather than a small illustration beside progress bars. On entry, the sun and constellations fill the navy half. On results, a dark observatory panorama joins the winner announcement to the winning constellation; readable standings and player rankings follow below.
- Alignment: left-align questions, setup, and final headings; center team labels on their constellations, the sun, and phone input shapes.

Entry: [headline + celestial atlas | join PIN / host]
Lobby: [room PIN] [four constellation rosters | category + start] [atlas]
Host round: [time / responses] [question] [four answer tiles] [four response counts / live atlas]
Player round: [team / time] [submission star / instructions] [four shape buttons]
Reveal: [correct answer] [host response distribution / personal result + points] [explanation + lesson slide] [next countdown]
Finish: [winner + personal totals | solar flare / constellation reveal] [team standings | top players]

Review against the brief: preserve the familiar page structure and make one purposeful celestial scene carry the dramatic treatment. Participation sends a comet from the sun to that team's stars; it never encodes correctness or points. Team membership creates individual small stars in the lobby. At the finish, constellation strokes draw in, the sun releases an expanding halo, and actual server scores count up. No audio. Use native SVG and CSS with a small requestAnimationFrame counter so the artwork scales crisply without introducing a rendering framework. Reduced-motion users receive the same states immediately, without moving trails or score interpolation. Keep touch targets, shape cues, language switching, and concealed answers intact.

Answer tiles retain red #c8414b, teal #087f8c, gold #ac7a14, and violet #7651b2, paired with triangle, diamond, circle, and square so color is never the only cue. Mobile players have a team strip and four large touch targets without question text. The short-screen fullscreen presentation compresses spacing without reducing the four answer targets on players' phones.

The round flow is preview (5 s), answering (20 s), and answer reveal (8 s), followed automatically by the next preview. The host can start answering immediately, use **Skip** to end answering and reveal the answer, or move from the reveal to the next question (or final results). Otherwise every phase runs until its server deadline, including when everyone has submitted. These host-only controls are checked against both the question ID and phase so repeated clicks or requests racing a deadline cannot skip another phase or question. Ending answering early preserves earned points and immediately closes submissions. Correctness, personal points, the explanation, and response counts are sent only during that question’s reveal. Host and player both receive the answer explanation; each player’s feedback is personalized, including on reconnect. Team totals and individual ranks appear at the final podium. There is no collective answer-review section at the finish. WebSocket carries submissions and state; server receive time determines points. The presenter does not occupy a player slot.

Review of the plan: preserve the site's existing fonts and colors instead of introducing another visual identity. Use the arena only where it communicates participation or final team strength. Keep mobile input free of question payloads, use native buttons with touch-action and keyboard shortcuts, and respect reduced motion. The existing single API process supports the current 32-player limit; adding distributed infrastructure is outside this interface change.

Visual critique and verification: replace system zodiac characters with drawn paths after Edge rendered them as colored emoji. Widen the live atlas geometry so the constellations occupy the stage. Replace SVG animateMotion with a requestAnimationFrame path traversal after a browser measurement showed the head was stationary. Restore gold numeral text on the dark question stage. Verify the comet actually changes position, final totals equal server values, Thai/English switching works both ways, and mobile input fits at 320–390 px. Keep the star map secondary to the readable question and response shapes.
