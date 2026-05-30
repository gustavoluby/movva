import { ImageResponse } from "next/og";

// Ícone do atalho no iOS (apple-touch-icon). iOS ignora SVG aqui, então
// geramos um PNG 180×180 com a estrela da marca sobre o sage.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#2D4131",
        }}
      >
        <svg width="104" height="104" viewBox="0 0 24 24" fill="#E0A082">
          <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
