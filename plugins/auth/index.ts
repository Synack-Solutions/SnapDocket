// Auth provider plugin interface — swap implementations without changing call sites

export interface AuthPluginUser {
  id: string;
  email: string;
  name?: string;
  tenantId: string;
  role: string;
}

export interface AuthPlugin {
  readonly name: string;
  signIn(email: string, password: string): Promise<{ user: AuthPluginUser | null; error?: string }>;
  signOut(): Promise<void>;
  getUser(): Promise<AuthPluginUser | null>;
}
