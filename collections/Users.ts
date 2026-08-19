import type { CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
    slug: 'users',
    admin: {
        useAsTitle: 'email',
    },
    auth: true,
    fields: [
        {
            name: 'role',
            type: 'select',
            options: ['visitor', 'author', 'editor', 'admin'],
            defaultValue: 'visitor',
            required: true,
            access: {
                // Roles should ideally be restricted to admin edits, but keeping it open for now
                update: () => true,
            },
        },
    ],
}
