import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { Request } from 'express';

const extractTokenFromHeader = (request: Request): string | null => {
  const authHeader = request.get('authorization') ?? '';
  const prefix = 'Bearer ';

  if (authHeader.length <= prefix.length) {
    return null;
  }

  for (let index = 0; index < prefix.length; index += 1) {
    if (authHeader[index] !== prefix[index]) {
      return null;
    }
  }

  let start = prefix.length;
  while (start < authHeader.length && authHeader[start] === ' ') {
    start += 1;
  }

  if (start >= authHeader.length) {
    return null;
  }

  let end = authHeader.length;
  while (end > start && authHeader[end - 1] === ' ') {
    end -= 1;
  }

  if (end <= start) {
    return null;
  }

  let token = '';
  for (let index = start; index < end; index += 1) {
    token += authHeader[index];
  }

  return token.length > 0 ? token : null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    const strategyOptions = {
      jwtFromRequest: extractTokenFromHeader,
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    } as const;

    // PassportStrategy constructor typing uses `any`, but options are validated above.

    super(strategyOptions);
  }

  validate(payload: JwtPayload): JwtPayload {
    return payload;
  }
}
