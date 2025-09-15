// src/modules/auth/auth.model.ts
export interface Auth {
  userId: string;
  password: string;
  old_passwords: string[];
  refreshToken?: string;
  verify_account: boolean;
  verify_code?: string;
  verify_code_expire?: string;
  reset_password_code?: string;
  reset_password_code_expire?: string;
  social_id?: string;
  social_provider?: string;
}
