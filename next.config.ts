import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Les pièces jointes (ACD, notes E&S, PV, justificatifs, PDF scannés…) transitent
    // par des Server Actions ; la limite de corps par défaut (1 Mo) rejette les fichiers
    // réels avant même l'envoi au CMS. 25 Mo couvre les documents scannés multipages.
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
