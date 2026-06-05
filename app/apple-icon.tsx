import { ImageResponse } from "next/og";

// Ícone do atalho no iOS (apple-touch-icon). iOS ignora SVG aqui, então
// geramos um PNG 180×180 com as estrelas da marca sobre o laranja.
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
          background: "linear-gradient(135deg, #F4A85E, #C97B5B)",
        }}
      >
        <svg width="180" height="180" viewBox="0 0 512 512" fill="#FBF3E7">
          <path transform="translate(212 228) scale(14) translate(-12 -10)" d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
          <path transform="translate(372 150) scale(6) translate(-12 -10)" d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
          <path transform="translate(152 378) scale(4.6) translate(-12 -10)" d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
