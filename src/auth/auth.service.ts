import { ForbiddenException, Injectable } from '@nestjs/common';
import { DataService } from 'src/data/data.service';
import { AuthDto } from './dto';
import { hash, verify } from 'argon2';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';

@Injectable({})
export class AuthService {
  constructor(private data: DataService) {}
  async signup(dto: AuthDto) {
    const hashPwd = await hash(dto.password);
    try {
      const user = await this.data.user.create({
        data: {
          email: dto.email,
          hash: hashPwd,
        },
      });
      delete user.hash;
      // return saved user
      return user;
    } catch (error) {
      if (
        error instanceof PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ForbiddenException('Credentials Taken!');
      }
      throw error;
    }
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
    if (!pwdMatches) throw new ForbiddenException('Credentials incorrect!');
    // send the user
    delete user.hash;
    return user;
  }
}
