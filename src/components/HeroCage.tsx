type Props = {
  agent: string;
  cage: string;
  near: string;
  allow: string;
  block: string;
  caption: string;
  allowed: number;
  blocked: number;
  allowedWord: string;
  blockedWord: string;
  pulse: number;
};

export function HeroCage({
  agent,
  cage,
  near,
  allow,
  block,
  caption,
  allowed,
  blocked,
  allowedWord,
  blockedWord,
  pulse,
}: Props) {
  const total = allowed + blocked;
  return (
    <div className={`stage${total > 0 ? " is-live" : ""}`}>
      <div className="stage-scene" key={`scene-${pulse}`} aria-hidden="true">
        <div className="lane" />
        <div className="slot slot-agent">
          <div className="node node-agent">
            <svg viewBox="0 0 48 48" className="node-icon">
              <circle cx="24" cy="16" r="7" fill="#00EC97" />
              <path d="M10 40c2.2-8 7.4-12 14-12s11.8 4 14 12" fill="#C4B5FD" />
            </svg>
          </div>
        </div>
        <div className="slot slot-cage">
          <div className="cage">
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="bar" />
            <span className="cage-lock" />
          </div>
        </div>
        <div className="slot slot-near">
          <div className="node node-near">N</div>
        </div>
        <span className="shot shot-allow">{allow}</span>
        <span className="shot shot-block">{block}</span>
        <span className="shot shot-block shot-block-b">{block}</span>
      </div>
      <div className="stage-legend">
        <span>{agent}</span>
        <span>{cage}</span>
        <span>{near}</span>
      </div>
      <p className="stage-caption">{caption}</p>
      {total > 0 ? (
        <div className="stage-counts" key={`counts-${pulse}`} aria-live="polite">
          <p className="stage-count is-allow">
            <strong>{allowed}</strong>
            <span>{allowedWord}</span>
          </p>
          <p className="stage-count is-block">
            <strong>{blocked}</strong>
            <span>{blockedWord}</span>
          </p>
        </div>
      ) : null}
    </div>
  );
}
