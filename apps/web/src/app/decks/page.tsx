export default function DecksPage() {
  return (
    <div className="empty-state">
      <h2>Deck builder</h2>
      <p>Coming next: pick a Hero, validate the 39-card deck, save and share.</p>
      <p>
        Validation rules already wired in <code>@altered/cards</code> will enforce: 39 non-Hero
        cards, single faction (Hero faction + Neutral), max 3 copies per non-Hero card, no banned
        cards.
      </p>
    </div>
  );
}
