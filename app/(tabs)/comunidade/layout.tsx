import { CommunityTabs } from "@/components/comunidade/community-tabs";

// Layout da aba "Elas": a barra de sub-abas (Checkin · Ideias · Ranking) fica
// montada o tempo todo; só o miolo ({children}) troca ao mudar de sub-aba.
export default function ComunidadeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CommunityTabs />
      {children}
    </>
  );
}
