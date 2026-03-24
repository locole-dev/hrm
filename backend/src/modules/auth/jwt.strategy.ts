import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

type JwtPayload = {
  sub: string;
  employeeId?: string | null;
  roles: string[];
  permissions?: string[];
  tokenType?: "access" | "refresh";
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>("JWT_SECRET", "change-me"),
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      employeeId: payload.employeeId ?? null,
      roles: payload.roles ?? [],
      permissions: payload.permissions ?? [],
      tokenType: payload.tokenType ?? "access",
    };
  }
}
