type BrandMarkProps = {
  className?: string;
  title?: string;
};

export function BrandMark({ className, title }: BrandMarkProps) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      role={title ? "img" : undefined}
      aria-hidden={title ? undefined : true}
      aria-label={title}
      xmlns="http://www.w3.org/2000/svg"
    >
      {title ? <title>{title}</title> : null}
      <rect width="64" height="64" rx="18" fill="#00346f" />
      <path
        d="M14 50 32 14 50 50h-7.107L32 28.816 21.106 50H14Z"
        fill="#ffffff"
      />
      <rect x="29" y="31" width="6" height="19" rx="3" fill="#f2b84b" />
    </svg>
  );
}
