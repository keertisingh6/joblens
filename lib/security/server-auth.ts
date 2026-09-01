import crypto from "crypto";

export interface ServerUserRecord {
  id: string;
  name: string;
  email: string;
  role: string;
  salt: string;
  passwordHash: string;
  createdAt: string;
}

// In-memory persistent user registry for the server runtime
const userDatabase = new Map<string, ServerUserRecord>();

export function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

export function registerServerUser(
  name: string,
  email: string,
  password: string,
  role: string = "Job Candidate"
): { user: Omit<ServerUserRecord, "passwordHash" | "salt">; token: string } {
  const normalizedEmail = email.trim().toLowerCase();

  if (userDatabase.has(normalizedEmail)) {
    throw new Error("An account already exists with this email address");
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(password, salt);
  const id = `usr_${crypto.randomBytes(8).toString("hex")}`;
  const createdAt = new Date().toISOString();

  const record: ServerUserRecord = {
    id,
    name: name.trim(),
    email: normalizedEmail,
    role,
    salt,
    passwordHash,
    createdAt
  };

  userDatabase.set(normalizedEmail, record);

  const token = `jbl_tok_${crypto.randomBytes(24).toString("hex")}`;

  return {
    user: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      createdAt: record.createdAt
    },
    token
  };
}

export function authenticateServerUser(
  email: string,
  password: string
): { user: Omit<ServerUserRecord, "passwordHash" | "salt">; token: string } {
  const normalizedEmail = email.trim().toLowerCase();
  const record = userDatabase.get(normalizedEmail);

  if (!record) {
    throw new Error("Invalid email or password");
  }

  const computedHash = hashPassword(password, record.salt);
  if (!crypto.timingSafeEqual(Buffer.from(computedHash, "hex"), Buffer.from(record.passwordHash, "hex"))) {
    throw new Error("Invalid email or password");
  }

  const token = `jbl_tok_${crypto.randomBytes(24).toString("hex")}`;

  return {
    user: {
      id: record.id,
      name: record.name,
      email: record.email,
      role: record.role,
      createdAt: record.createdAt
    },
    token
  };
}
