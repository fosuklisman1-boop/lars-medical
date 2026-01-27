import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: 'Lars Medical Centre',
        short_name: 'LMC System',
        description: 'Lars Medical Centre Clinic Management System',
        start_url: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#ffffff',
        icons: [
            {
                src: '/logo.jpg',
                sizes: '192x192',
                type: 'image/jpeg',
            },
            {
                src: '/logo.jpg',
                sizes: '512x512',
                type: 'image/jpeg',
            },
        ],
    }
}
