import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Padrões para ambiente LOCAL
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
        pathname: '/api/v1/user/file/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '8081',
        pathname: '/api/v1/admin/file/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.18.131',
        port: '8081',
        pathname: '/api/v1/user/file/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.18.139',
        port: '8081',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.18.146',
        port: '8081',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '192.168.18.131',
        port: '8081',
        pathname: '/api/v1/admin/file/**',
      },
      // Padrão para Unsplash (se você usar)
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      // [MUDANÇA] Padrões adicionados para o ambiente de PRODUÇÃO
      {
        protocol: 'https',
        hostname: 'vitabackend.onrender.com',
        port: '',
        pathname: '/api/v1/user/file/**',
      },
      {
        protocol: 'https',
        hostname: 'vitabackend.onrender.com',
        port: '',
        pathname: '/api/v1/admin/file/**',
      },
    ],
  },
};

export default nextConfig;