import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Tyfel Hub · FnB Operations',
    short_name: 'Tyfel Hub',
    description: 'Executive multi-brand unit economics & kitchen command',
    start_url: '/',
    display: 'standalone',
    background_color: '#090d16',
    theme_color: '#090d16',
    icons: [
      {
        src: '/tyfel-logo.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/tyfel-logo.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}
