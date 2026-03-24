import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UserStatus } from "@prisma/client";
import { compare } from "bcryptjs";

import { PrismaService } from "../../prisma/prisma.service";
import { LoginDto } from "./dto/login.dto";
import { RefreshTokenDto } from "./dto/refresh-token.dto";

type AuthUser = {
  id: string;
  email: string;
  employeeId: string | null;
  passwordHash: string;
  status: UserStatus;
  roles: {
    role: {
      code: string;
      permissions?: {
        permission: {
          code: string;
        };
      }[];
    };
  }[];
};

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email },
      include: {
        employee: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const validatedUser = await this.validateCredentials(user, payload.password);

    return this.buildAuthResponse(validatedUser);
  }

  async refresh(payload: RefreshTokenDto) {
    const decoded = await this.jwtService.verifyAsync<{
      sub: string;
      tokenType?: string;
    }>(payload.refreshToken);

    if (decoded.tokenType !== "refresh") {
      throw new UnauthorizedException("Invalid refresh token");
    }

    const user = await this.prisma.user.findUnique({
      where: { id: decoded.sub },
      include: {
        employee: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    return this.buildAuthResponse(user);
  }

  async me(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        employee: true,
        roles: {
          include: {
            role: {
              include: {
                permissions: {
                  include: {
                    permission: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("User not found");
    }

    return this.mapUserPayload(user);
  }

  private async validateCredentials(user: AuthUser | null, password: string) {
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const isValidPassword = await compare(password, user.passwordHash);

    if (!isValidPassword) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return user;
  }

  private async buildAuthResponse(user: AuthUser) {
    const roles = user.roles.map((entry) => entry.role.code);
    const permissions = Array.from(
      new Set(
        user.roles.flatMap((entry) =>
          (entry.role.permissions ?? []).map((item) => item.permission.code),
        ),
      ),
    );

    const basePayload = {
      sub: user.id,
      employeeId: user.employeeId,
      roles,
      permissions,
    };

    return {
      accessToken: await this.jwtService.signAsync(
        { ...basePayload, tokenType: "access" },
        { expiresIn: "15m" },
      ),
      refreshToken: await this.jwtService.signAsync(
        { ...basePayload, tokenType: "refresh" },
        { expiresIn: "7d" },
      ),
      user: this.mapUserPayload(user, permissions),
    };
  }

  private mapUserPayload(user: AuthUser, resolvedPermissions?: string[]) {
    const roles = user.roles.map((entry) => entry.role.code);
    const permissions =
      resolvedPermissions ??
      Array.from(
        new Set(
          user.roles.flatMap((entry) =>
            (entry.role.permissions ?? []).map((item) => item.permission.code),
          ),
        ),
      );

    return {
      id: user.id,
      email: user.email,
      employeeId: user.employeeId,
      roles,
      permissions,
    };
  }
}
