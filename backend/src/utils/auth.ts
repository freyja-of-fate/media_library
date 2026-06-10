import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import crypto from 'crypto';
import db from "../db";

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
  user_id: number;
}

// Generate JWT token
export const generateToken = (user_id: number): string => {
  const options: SignOptions = {
    expiresIn: JWT_EXPIRES_IN as any
  };
  
  return jwt.sign({ user_id }, JWT_SECRET, options);
};

// Verify JWT token
export const verifyToken = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    return null;
  }
};

// Hash password
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, 10);
};

// Compare password
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

// Generate user recovery codes
export const generateRecoveryCodes = async (user_id: number) => {
  const codes = Array.from({ length: 8 }, () =>
    crypto.randomBytes(4).toString('hex')
  );

  const hashed = await Promise.all(
    codes.map(code => bcrypt.hash(code, 10))
  );

  await db('user_recovery_codes').insert(
    hashed.map(code_hash => ({
      user_id,
      code_hash,
      used: false
    }))
  );

  return codes;
};

// verify the recovery codes
export const verifyRecoveryCode = async (
  user_id: number,
  inputCode: string
): Promise<{ valid: boolean; code_id?: number }> => {
  const codes = await db('user_recovery_codes')
    .where({ user_id, used: false });

  for (const row of codes) {
    const match = await bcrypt.compare(inputCode, row.code_hash);

    if (match) {
      return { valid: true, code_id: row.id };
    }
  }

  return { valid: false };
};

// consume the recovery code
export const useRecoveryCode = async (id: number) => {
  await db('user_recovery_codes')
    .where({ id })
    .update({
      used: true,
      used_at: db.fn.now()
    });
};

// generate the challenge for 2fa
export const generateChallengeToken = (user_id: number) => {
  return jwt.sign(
    { user_id, stage: "2fa" },
    JWT_SECRET,
    { expiresIn: "5m" }
  );
};

// verify the challenge for 2fa
export const verifyChallengeToken = (token: string) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (decoded.stage !== "2fa") return null;
    return decoded;
  } catch {
    return null;
  }
};
