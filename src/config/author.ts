import { env } from "@/env";

/**
 * The single source of truth for author credentials. Both the persistent footer
 * and the /about page consume this — never hardcode credentials elsewhere
 * (FR-09). The Upwork link is intentionally nullable and gated on
 * NEXT_PUBLIC_UPWORK_URL (OQ-09) so it stays hidden until the profile exists.
 */
export const AUTHOR = {
  name: "Andrei Solovov",
  bio: "Blockchain Lead at Gateway.fm. Production smart contracts deployed on mainnet for Lukso, Lumia, Flare, Humanity, and Wirex Pay. Specialize in EVM L2 architecture, oracles, and gRPC backends.",
  links: {
    linkedin: "https://www.linkedin.com/in/andrey-solovov-bb665884/",
    github: "https://github.com/asolovov",
    source: "https://github.com/asolovov/evm-oracle-demo-frontend",
    upwork: env.NEXT_PUBLIC_UPWORK_URL ?? null,
    email: "mailto:andre.solovov@gmail.com",
  },
  credentials: [
    {
      company: "Gateway.fm",
      role: "Blockchain Lead",
      period: "2024.05 — PRESENT",
      url: "https://gateway.fm/",
    },
    {
      company: "Uddúg",
      role: "Solidity Developer",
      period: "2022.01 — 2024.05",
      url: "https://uddug.com/",
    },
  ],
  projects: [
    {
      name: "Haust Network — price oracle",
      desc: "Multi-source price oracle for an EVM L2.",
      url: "https://haust.network/",
    },
    {
      name: "Lukso — oracles",
      desc: "On-chain oracle infrastructure.",
      url: "https://lukso.network/",
    },
    {
      name: "Lumia — L2 contracts",
      desc: "Core L2 protocol contracts.",
      url: "https://lumia.org/",
    },
    {
      name: "Humanity Protocol — core",
      desc: "Identity protocol core contracts.",
      url: "https://humanity.org/",
    },
    {
      name: "Flare Network — data provider",
      desc: "Decentralized data-provider integration.",
      url: "https://flare.network/",
    },
    {
      name: "Wirex Pay — architecture",
      desc: "Payment-chain architecture.",
      url: "https://wirexpaychain.com/",
    },
  ],
} as const;

/** Footer links, in render order. Upwork is appended only when configured. */
export function footerLinks(): { label: string; href: string }[] {
  const links: { label: string; href: string }[] = [
    { label: "LINKEDIN", href: AUTHOR.links.linkedin },
    { label: "GITHUB", href: AUTHOR.links.github },
    { label: "SOURCE", href: AUTHOR.links.source },
  ];
  if (AUTHOR.links.upwork) links.push({ label: "UPWORK", href: AUTHOR.links.upwork });
  return links;
}
