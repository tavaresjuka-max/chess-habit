type LemosAvatarProps = {
  size?: number;
  className?: string;
};

export function LemosAvatar({ size = 44, className }: LemosAvatarProps) {
  return (
    <img
      src="/art/lemos-avatar-medalhao.webp"
      width={size}
      height={size}
      alt="Professor Lemos"
      className={className}
      style={{ borderRadius: '50%', objectFit: 'cover', display: 'block' }}
    />
  );
}
