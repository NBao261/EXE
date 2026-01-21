import { Request, Response, NextFunction } from "express";
import { authService } from "../services/auth.service.js";
import { registerSchema, loginSchema } from "../validators/auth.validator.js";
import { ZodError } from "zod";

export const authController = {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = registerSchema.parse(req.body);
      const result = await authService.register(validatedData);

      res.status(201).json({
        success: true,
        message: "Đăng ký thành công",
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors,
        });
        return;
      }

      if (error instanceof Error && error.message === "Email đã được sử dụng") {
        res.status(409).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  },

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedData = loginSchema.parse(req.body);
      const result = await authService.login(validatedData);

      res.json({
        success: true,
        message: "Đăng nhập thành công",
        data: result,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({
          success: false,
          message: "Dữ liệu không hợp lệ",
          errors: error.errors,
        });
        return;
      }

      if (
        error instanceof Error &&
        error.message === "Email hoặc mật khẩu không đúng"
      ) {
        res.status(401).json({
          success: false,
          message: error.message,
        });
        return;
      }

      next(error);
    }
  },

  async me(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    try {
      const user = await authService.getUserProfile(userId);
      res.json({
        success: true,
        data: { user },
      });
    } catch (error) {
      res
        .status(500)
        .json({ success: false, message: "Internal server error" });
    }
  },

  async updateProfile(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { name } = req.body;
    if (!name || typeof name !== "string" || name.length < 2) {
      res.status(400).json({ success: false, message: "Tên không hợp lệ" });
      return;
    }

    try {
      await authService.updateProfile(userId, { name });
      res.json({ success: true, message: "Cập nhật thông tin thành công" });
    } catch (error) {
      res.status(500).json({ success: false, message: "Lỗi server" });
    }
  },

  async changePassword(req: Request, res: Response) {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword || newPassword.length < 6) {
      res
        .status(400)
        .json({ success: false, message: "Mật khẩu không hợp lệ" });
      return;
    }

    try {
      await authService.changePassword(userId, { oldPassword, newPassword });
      res.json({ success: true, message: "Đổi mật khẩu thành công" });
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: "Lỗi server" });
      }
    }
  },
};
