import NextAuth from "next-auth"
import CognitoProvider from "next-auth/providers/cognito"

export const { handlers, signIn, signOut, auth } = NextAuth({
  debug: process.env.NODE_ENV === 'development',
  providers: [
    CognitoProvider({
      clientId: process.env.COGNITO_CLIENT_ID!,
      issuer: process.env.COGNITO_ISSUER!,
      client: {
        token_endpoint_auth_method: "none"
      },
      authorization: {
        params: {
          scope: "openid email profile",
        },
      },
    })
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token
        token.idToken = account.id_token
      }
      return token
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string
      session.idToken = token.idToken as string
      return session
    },
    async authorized({ auth, request }) {
      // Proteger rutas /admin/*
      const { pathname } = request.nextUrl
      if (pathname.startsWith('/admin')) {
        return !!auth?.user
      }
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24 horas
  },
  trustHost: true,
})


