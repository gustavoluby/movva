// Paleta e estilos compartilhados dos emails Moodpass.
export const colors = {
  sage: "#2D4131",
  terracotta: "#C97B5B",
  cream: "#F4ECE0",
  blush: "#F0D9CC",
  text: "#1A231D",
  whatsapp: "#25D366",
  white: "#FFFFFF",
  muted: "#6B7563",
  border: "#E3D9C9",
};

export const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL || "https://www.moodpass.com.br";

export const main = {
  backgroundColor: colors.cream,
  fontFamily:
    "'Helvetica Neue', Helvetica, Arial, -apple-system, BlinkMacSystemFont, sans-serif",
  color: colors.text,
  margin: "0",
  padding: "0",
};

export const container = {
  maxWidth: "600px",
  margin: "0 auto",
  backgroundColor: colors.white,
  borderRadius: "16px",
  overflow: "hidden",
};

export const header = {
  backgroundColor: colors.sage,
  padding: "28px 32px",
  textAlign: "center" as const,
};

export const logo = {
  color: colors.cream,
  fontSize: "26px",
  fontWeight: "600" as const,
  letterSpacing: "0.5px",
  margin: "0",
};

export const body = {
  padding: "32px",
};

export const h1 = {
  color: colors.sage,
  fontSize: "24px",
  fontWeight: "700" as const,
  margin: "0 0 8px",
  lineHeight: "1.25",
};

export const paragraph = {
  color: colors.text,
  fontSize: "15px",
  lineHeight: "1.6",
  margin: "0 0 16px",
};

export const metaRow = {
  color: colors.text,
  fontSize: "15px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

export const badge = {
  display: "inline-block",
  backgroundColor: "#E4F0E4",
  color: "#1F6B3A",
  fontSize: "14px",
  fontWeight: "600" as const,
  padding: "8px 14px",
  borderRadius: "100px",
  margin: "4px 0 0",
};

export const ctaPrimary = {
  backgroundColor: colors.whatsapp,
  color: colors.white,
  fontSize: "16px",
  fontWeight: "700" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "16px 24px",
  borderRadius: "12px",
  display: "block",
};

export const ctaSecondary = {
  backgroundColor: colors.blush,
  color: colors.sage,
  fontSize: "14px",
  fontWeight: "600" as const,
  textDecoration: "none",
  textAlign: "center" as const,
  padding: "12px 18px",
  borderRadius: "10px",
  display: "block",
};

export const card = {
  backgroundColor: colors.cream,
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  padding: "18px 20px",
  margin: "0 0 20px",
};

export const cardTitle = {
  color: colors.sage,
  fontSize: "18px",
  fontWeight: "700" as const,
  margin: "0 0 10px",
};

export const footer = {
  padding: "24px 32px",
  backgroundColor: colors.cream,
  textAlign: "center" as const,
};

export const footerText = {
  color: colors.muted,
  fontSize: "13px",
  lineHeight: "1.5",
  margin: "0 0 8px",
};

export const smallLink = {
  color: colors.terracotta,
  fontSize: "12px",
  textDecoration: "underline",
};

export const hr = {
  border: "none",
  borderTop: `1px solid ${colors.border}`,
  margin: "20px 0",
};
