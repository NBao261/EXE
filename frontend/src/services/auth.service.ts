import type {
  AuthResponse,
  LoginInput,
  RegisterInput,
  ApiError,
} from "../types/auth";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

class AuthService {
  private getHeaders(token?: string | null): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    return headers;
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ApiError).message || "Đăng ký thất bại");
    }

    return data as AuthResponse;
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: this.getHeaders(),
      body: JSON.stringify(input),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error((data as ApiError).message || "Đăng nhập thất bại");
    }

    return data as AuthResponse;
  }

  async getMe(token: string): Promise<AuthResponse> {
    const response = await fetch(`${API_URL}/auth/me`, {
      method: "GET",
      headers: this.getHeaders(token),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        (data as ApiError).message || "Không thể lấy thông tin user",
      );
    }

    return data as AuthResponse;
  }

  async updateProfile(name: string, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/profile`, {
      method: "PUT",
      headers: this.getHeaders(token),
      body: JSON.stringify({ name }),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ApiError).message || "Cập nhật thất bại");
    }
  }

  async changePassword(passwordData: any, token: string): Promise<void> {
    const response = await fetch(`${API_URL}/auth/password`, {
      method: "PUT",
      headers: this.getHeaders(token),
      body: JSON.stringify(passwordData),
    });

    const data = await response.json();
    if (!response.ok) {
      throw new Error((data as ApiError).message || "Đổi mật khẩu thất bại");
    }
  }
}

export const authService = new AuthService();
