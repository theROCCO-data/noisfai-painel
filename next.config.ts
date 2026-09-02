import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Libera acesso ao servidor de dev via IP da rede local (ex: testar no celular),
  // senão o Next bloqueia o HMR e ações do servidor por segurança (origem diferente de localhost).
  allowedDevOrigins: ["192.168.18.18"],
};

export default nextConfig;
