import { Injectable } from '@nestjs/common';
import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

@Injectable()
export class PasswordService {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
