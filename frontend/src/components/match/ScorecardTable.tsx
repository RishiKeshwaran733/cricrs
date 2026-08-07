interface BattingCard {
  player: { id: string; name: string };
  runs: number;
  balls: number;
  fours: number;
  sixes: number;
  strikeRate: number;
  isOut: boolean;
  dismissalText?: string;
  didNotBat?: boolean;
}

interface BowlingCard {
  player: { id: string; name: string };
  overs: string;
  maidens: number;
  runs: number;
  wickets: number;
  economy: number;
  wides: number;
  noBalls: number;
}

interface ScorecardTableProps {
  batting: BattingCard[];
  bowling: BowlingCard[];
  extras: { total: number; wides: number; noBalls: number; byes: number; legByes: number; penalty: number };
  total: { runs: number; wickets: number; overs: string };
  fallOfWickets: { wicketNumber: number; runs: number; over: string; playerName: string }[];
}

export default function ScorecardTable({ batting, bowling, extras, total, fallOfWickets }: ScorecardTableProps) {
  return (
    <div className="space-y-6">
      {/* Batting */}
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text)] mb-2 uppercase tracking-wide">Batting</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="text-left py-2 pr-3 font-semibold">Batter</th>
                <th className="text-right py-2 px-2 font-semibold">R</th>
                <th className="text-right py-2 px-2 font-semibold">B</th>
                <th className="text-right py-2 px-2 font-semibold">4s</th>
                <th className="text-right py-2 px-2 font-semibold">6s</th>
                <th className="text-right py-2 pl-2 font-semibold">SR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {batting.map(card => (
                <tr key={card.player.id} className={card.didNotBat ? 'opacity-40' : ''}>
                  <td className="py-2.5 pr-3">
                    <div className="font-medium text-[var(--color-text)]">{card.player.name}</div>
                    {!card.didNotBat && (
                      <div className="text-[10px] text-[var(--color-text-muted)] truncate max-w-[180px]">
                        {card.isOut ? card.dismissalText || 'out' : 'not out'}
                      </div>
                    )}
                    {card.didNotBat && <div className="text-[10px] text-[var(--color-text-muted)]">did not bat</div>}
                  </td>
                  <td className="py-2.5 px-2 text-right font-bold text-[var(--color-text)]">{card.didNotBat ? '-' : card.runs}</td>
                  <td className="py-2.5 px-2 text-right text-[var(--color-text-muted)]">{card.didNotBat ? '-' : card.balls}</td>
                  <td className="py-2.5 px-2 text-right text-blue-400">{card.didNotBat ? '-' : card.fours}</td>
                  <td className="py-2.5 px-2 text-right text-yellow-400">{card.didNotBat ? '-' : card.sixes}</td>
                  <td className="py-2.5 pl-2 text-right text-[var(--color-text-muted)]">{card.didNotBat ? '-' : card.strikeRate.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Extras & Total */}
        <div className="mt-2 border-t border-[var(--color-border)] pt-2 space-y-1">
          <div className="flex justify-between text-xs text-[var(--color-text-muted)]">
            <span>Extras ({extras.wides}w, {extras.noBalls}nb, {extras.byes}b, {extras.legByes}lb, {extras.penalty}p)</span>
            <span className="font-semibold text-[var(--color-text)]">{extras.total}</span>
          </div>
          <div className="flex justify-between text-sm font-bold text-[var(--color-text)]">
            <span>Total ({total.wickets} Wkt, {total.overs} Ov)</span>
            <span className="text-brand-400 text-base">{total.runs}</span>
          </div>
        </div>
      </div>

      {/* Bowling */}
      <div>
        <h3 className="text-sm font-bold text-[var(--color-text)] mb-2 uppercase tracking-wide">Bowling</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--color-text-muted)] border-b border-[var(--color-border)]">
                <th className="text-left py-2 pr-3 font-semibold">Bowler</th>
                <th className="text-right py-2 px-2 font-semibold">O</th>
                <th className="text-right py-2 px-2 font-semibold">M</th>
                <th className="text-right py-2 px-2 font-semibold">R</th>
                <th className="text-right py-2 px-2 font-semibold">W</th>
                <th className="text-right py-2 pl-2 font-semibold">Eco</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {bowling.map(card => (
                <tr key={card.player.id}>
                  <td className="py-2.5 pr-3 font-medium text-[var(--color-text)]">{card.player.name}</td>
                  <td className="py-2.5 px-2 text-right text-[var(--color-text-muted)]">{card.overs}</td>
                  <td className="py-2.5 px-2 text-right text-[var(--color-text-muted)]">{card.maidens}</td>
                  <td className="py-2.5 px-2 text-right text-[var(--color-text-muted)]">{card.runs}</td>
                  <td className="py-2.5 px-2 text-right font-bold text-green-400">{card.wickets}</td>
                  <td className="py-2.5 pl-2 text-right text-[var(--color-text-muted)]">{card.economy.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Fall of Wickets */}
      {fallOfWickets.length > 0 && (
        <div>
          <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wide mb-2">Fall of Wickets</h3>
          <div className="flex flex-wrap gap-2">
            {fallOfWickets.map(fow => (
              <div key={fow.wicketNumber} className="text-xs bg-[var(--color-surface-2)] rounded-lg px-2 py-1">
                <span className="font-semibold text-[var(--color-text)]">{fow.runs}-{fow.wicketNumber}</span>
                <span className="text-[var(--color-text-muted)] ml-1">({fow.playerName}, {fow.over})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
