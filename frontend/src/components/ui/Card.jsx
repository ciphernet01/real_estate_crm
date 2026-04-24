export function Card({ title, children, cardClassName = '' }) {
  return (
    <div className={`enterprise-card ${cardClassName}`}>
      <div className="enterprise-card-header">
        <h2 className="enterprise-card-title">{title}</h2>
      </div>
      <div className="enterprise-card-body">{children}</div>
    </div>
  );
}
