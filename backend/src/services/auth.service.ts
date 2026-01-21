import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { ObjectId } from "mongodb";
import { getDb } from "../config/database.js";
import { config } from "../config/index.js";
import type {
  User,
  RegisterInput,
  LoginInput,
  AuthResponse,
  JwtPayload,
} from "../types/auth.types.js";

const SALT_ROUNDS = 10;

export const authService = {
  async register(input: RegisterInput): Promise<AuthResponse> {
    const db = getDb();
    const users = db.collection<User>("users");

    // Check if user exists
    const existingUser = await users.findOne({ email: input.email });
    if (existingUser) {
      throw new Error("Email đã được sử dụng");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Create user
    const now = new Date();
    const result = await users.insertOne({
      email: input.email,
      password: hashedPassword,
      name: input.name,
      plan: "free",
      createdAt: now,
      updatedAt: now,
    });

    const user = await users.findOne({ _id: result.insertedId });
    if (!user) {
      throw new Error("Không thể tạo user");
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as Omit<User, "password">,
      token,
    };
  },

  async login(input: LoginInput): Promise<AuthResponse> {
    const db = getDb();
    const users = db.collection<User>("users");

    // Find user
    const user = await users.findOne({ email: input.email });
    if (!user) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Check password
    const isValidPassword = await bcrypt.compare(input.password, user.password);
    if (!isValidPassword) {
      throw new Error("Email hoặc mật khẩu không đúng");
    }

    // Generate token
    const token = this.generateToken(user);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword as Omit<User, "password">,
      token,
    };
  },

  generateToken(user: User): string {
    const payload: JwtPayload = {
      userId: user._id!.toString(),
      email: user.email,
    };

    return jwt.sign(payload, config.jwtSecret, {
      expiresIn: config.jwtExpiresIn as string,
    } as jwt.SignOptions);
  },

  verifyToken(token: string): JwtPayload {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  },

  async getUserProfile(userId: string): Promise<Omit<User, "password">> {
    const db = getDb();
    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new Error("Không tìm thấy user");
    }

    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async updateProfile(userId: string, data: { name: string }): Promise<void> {
    const db = getDb();
    await db
      .collection<User>("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: { name: data.name } });
  },

  async changePassword(
    userId: string,
    passwordData: { oldPassword: string; newPassword: string },
  ): Promise<void> {
    const db = getDb();
    const user = await db
      .collection<User>("users")
      .findOne({ _id: new ObjectId(userId) });

    if (!user) {
      throw new Error("User không tồn tại");
    }

    const isValid = await bcrypt.compare(
      passwordData.oldPassword,
      user.password,
    );
    if (!isValid) {
      throw new Error("Mật khẩu cũ không chính xác");
    }

    const hashedPassword = await bcrypt.hash(
      passwordData.newPassword,
      SALT_ROUNDS,
    );
    await db
      .collection<User>("users")
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { password: hashedPassword } },
      );
  },
};
