interface DebugRendererProps {
  children: React.ReactNode;
  position?: {
    top?: string;
    left?: string;
    right?: string;
    bottom?: string;
  };
  style?: React.CSSProperties;
  color?: string;
}

export function DebugRenderer({
  children,
  position = { top: "50%", left: "50%" },
  style = {},
  color = "red",
}: DebugRendererProps) {
  return (
    <span
      style={{
        position: "fixed",
        zIndex: 1000,
        color,
        ...position,
        ...style,
      }}
    >
      {children}
    </span>
  );
}

DebugRenderer.displayName = "DebugRenderer";
