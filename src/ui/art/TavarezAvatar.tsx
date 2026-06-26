type TavarezAvatarProps = {
  size?: number;
  className?: string;
};

export function TavarezAvatar({ size = 44, className }: TavarezAvatarProps) {
  return (
    <img
      src="/art/tavarez-avatar-medalhao.webp"
      width={size}
      height={size}
      alt="Professor Tavarez"
      className={`tavarez-avatar-img${className ? ` ${className}` : ''}`}
    />
  );
}
