import { api } from '../client';

export interface User {
  id: number;
  username: string;
  created_at: string;
  totp_enabled?: boolean;
}

export interface LoginChallengeResponse {
  type: "challenge";
  requires_2fa: boolean;
  method: string;
  challenge_token: string;
}

export interface LoginSuccessResponse {
  type: "success";
  token: string;
  user: User;
}

export type LoginResponse = 
  | LoginChallengeResponse
  | LoginSuccessResponse

export interface RegisterResponse {
  token: string;
  user: User;
}

export interface UpdateProfileRequest {
  username?: string;
  currentPassword?: string;
  newPassword?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: User;
}

export interface Setup2FAResponse {
  totp_secret: string;
  qr_code: string;
}

export interface Verify2FAResponse {
  message: string;
  recovery_codes: string[];
}

export interface Disable2FARequest {
  password: string;
  code: string;
}

export interface ErrorResponse {
  type: "error";
  error: string;
}

export const userService = {
  // User register
  register: async (username: string, password: string): Promise<RegisterResponse> => {
    const response = await api('/api/users/register', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  // User login
  login: async (username: string, password: string): Promise<LoginResponse> => {
    const response = await api('/api/users/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await api('/api/users/profile');
    return response.json();
  },

  // Get other user profile
  getUser: async (id: number): Promise<User> => {
    const response = await api(`/api/users/${id}`);
    return response.json();
  },

  // Update current user profile
  updateProfile: async (data: UpdateProfileRequest): Promise<UpdateProfileResponse> => {
    const response = await api('/api/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return response.json();
  },

  // Setup 2FA (generate QR + secret)
  setup2FA: async (): Promise<Setup2FAResponse> => {
    const response = await api('/api/users/2fa/totp/setup', {
      method: 'POST',
    })

    return response.json();
  },

  // Verify + enable 2FA
  verify2FA: async (code: string): Promise<Verify2FAResponse> => {
    const response = await api('/api/users/2fa/totp/verify', {
      method: 'POST',
      body: JSON.stringify({ code }),
    })

    return response.json();
  },

  // Disable 2FA
  disable2FA: async (password: string, code: string): Promise<{ message: string }> => {
    const response = await api('/api/users/2fa/totp/disable', {
      method: 'POST',
      body: JSON.stringify({ password, code })
    })

    return response.json();
  },

  // Challenge login
  verifyLogin2FA: async (
    challenge_token: string,
    code: string
  ): Promise<LoginSuccessResponse | ErrorResponse> => {
    const response = await api('/api/users/login/totp', {
      method: 'POST',
      body: JSON.stringify({ challenge_token, code })
    })

    return response.json();
  }
};