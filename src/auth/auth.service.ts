import {
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthDto } from './dto';
import { hash, verify } from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataService } from 'src/data/data.service';

@Injectable({})
export class AuthService {
  constructor(
    private data: DataService,
    private jwt: JwtService,
    private config: ConfigService,
  ) {}
  async signup(dto: AuthDto) {
    const hashPwd = await hash(dto.password);
    try {
      const user = await this.data.user.create({
        data: {
          email: dto.email,
          hash: hashPwd,
        },
      });
      return this.signToken(user.id, user.email);
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError ||
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('Credentials Taken!');
      }
      throw error;
    }
  }

  async signToken(
    userId: number,
    email: string,
  ): Promise<{ access_token: string }> {
    const payload = {
      sub: userId,
      email,
    };
    const token = await this.jwt.signAsync(payload, {
      expiresIn: '15m',
      secret: this.config.get('JWT_SECRET'),
    });
    return {
      access_token: token,
    };
  }

  async login(dto: AuthDto) {
    // find user by email
    const user = await this.data.user.findUnique({
      where: {
        email: dto.email,
      },
    });
    // Guard statement for user
    if (!user) throw new ForbiddenException('Credentials incorrect!');
    // compare password
    const pwdMatches = verify(user.hash, dto.password);
    // Guard statement for incorrect password
    if (!pwdMatches) throw new UnauthorizedException();
    // send the user
    return this.signToken(user.id, user.email);
  }
}
