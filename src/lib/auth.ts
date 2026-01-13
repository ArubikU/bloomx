import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { env } from "@/lib/env";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || "",
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
            authorization: {
                params: {
                    scope: "openid email profile https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly",
                    prompt: "consent",
                    access_type: "offline",
                    response_type: "code"
                }
            }
        }),
        CredentialsProvider({
            name: "Credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" }
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                console.log(`[AUTH] Attempting login for: ${credentials.email}`);
                const user = await prisma.user.findUnique({
                    where: { email: credentials.email }
                });

                if (!user) {
                    console.log(`[AUTH] User not found: ${credentials.email}`);
                    return null;
                }

                console.log(`[AUTH] User found, checking password...`);
                // Allow password login if user has password set
                if (!user.password) {
                    console.log(`[AUTH] User has no password set (OAuth user?): ${credentials.email}`);
                    return null;
                }

                const isPasswordValid = await bcrypt.compare(credentials.password, user.password);

                if (!isPasswordValid) {
                    console.log(`[AUTH] Invalid password for: ${credentials.email}`);
                    return null;
                }

                console.log(`[AUTH] Login successful: ${credentials.email}`);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    // image: user.avatar, // Commenting out to prevent cookie size issues
                };
            }
        })
    ],
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    callbacks: {
        async session({ session, token }) {

            if (token && session.user) {
                // @ts-ignore
                session.user.id = token.id as string;
                // @ts-ignore
                // session.user.image = token.picture;
                session.user.name = token.name;
            }
            return session;
        },
        async jwt({ token, user, trigger, session }) {
            console.log(`[AUTH-CB] JWT Callback Triggered`, { trigger, hasUser: !!user });
            if (user) {
                token.id = user.id;
                // token.picture = user.image;
                token.name = user.name;
            }

            if (trigger === "update" && session) {
                if (session.user.name) token.name = session.user.name;
                // if (session.user.image) token.picture = session.user.image;
            }

            return token;
        },
        async redirect({ url, baseUrl }) {
            console.log(`[AUTH-CB] Redirect Callback`, { url, baseUrl });
            // Allows relative callback URLs
            if (url.startsWith("/")) return `${baseUrl}${url}`;
            // Allows callback URLs on the same origin
            if (new URL(url).origin === baseUrl) return url;
            return baseUrl;
        }
    },
    secret: process.env.NEXTAUTH_SECRET,
};
