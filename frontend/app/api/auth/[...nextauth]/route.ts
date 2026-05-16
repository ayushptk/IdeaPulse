import NextAuth, { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        try {
          const res = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password
            }),
            headers: { "Content-Type": "application/json" }
          });
          const data = await res.json();
          if (res.ok && data.user) {
            return {
              id: data.user.id.toString(),
              email: data.user.email,
              name: data.user.name,
            };
          }
          return null;
        } catch (e) {
          console.error("Login error:", e);
          return null;
        }
      }
    })
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        try {
          const res = await fetch(`${API_URL}/auth/verify`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: user.email,
              name: user.name,
              picture: user.image,
              provider: "google",
              provider_id: account.providerAccountId,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            user.id = data.user?.id?.toString() || user.id;
            return true;
          }
          return false;
        } catch (error) {
          console.error("Error verifying user with backend:", error);
          return false;
        }
      }
      return true;
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.name = user.name;
        token.email = user.email;
        token.picture = (user as any).picture || user.image;
      }
      
      if (trigger === "update" && session) {
        token.name = session.name || token.name;
        token.picture = session.picture || token.picture;
      }
      
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
