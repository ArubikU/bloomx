import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from "@/lib/session";
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function PUT(req: NextRequest) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || !currentUser.email) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { name, avatar, currentPassword, newPassword } = await req.json();

        // Get current user to check password
        const user = await prisma.user.findUnique({
            where: { email: currentUser.email }
        });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const updateData: any = {
            name,
            avatar
        };

        // Handle password change
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: 'Current password is required to set a new password' }, { status: 400 });
            }

            const isValid = await bcrypt.compare(currentPassword, user.password);
            if (!isValid) {
                return NextResponse.json({ error: 'Incorrect current password' }, { status: 400 });
            }

            const hashed = await bcrypt.hash(newPassword, 10);
            updateData.password = hashed;
        }

        const updatedUser = await prisma.user.update({
            where: { email: user.email },
            data: updateData
        });

        // Omit password from response
        const { password: _, ...userWithoutPassword } = updatedUser;

        return NextResponse.json({ user: userWithoutPassword });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
    }
}
