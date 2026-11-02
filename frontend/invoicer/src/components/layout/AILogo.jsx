const AILogo = ({ size = 48, className = "" }) => (
  <img
    src="/logo.png"
    alt="Invoicer"
    width={size}
    height={size}
    className={`block shrink-0 object-contain ${className}`.trim()}
  />
);

export default AILogo;
