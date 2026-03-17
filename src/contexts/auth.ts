export type AppSession = {
  user: {
    email: string
  }
}

type LoginInput = {
  email: string
  password: string
}

export type AuthContextValue = {
  loading: boolean
  session: AppSession | null
  usingDefaultAdmin: boolean
  signIn: (input: LoginInput) => Promise<void>
  signOut: () => Promise<void>
}
