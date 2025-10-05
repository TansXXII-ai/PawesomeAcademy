import bcrypt from 'bcryptjs';
import { query } from './db';

export async function hashPassword(password) {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(password, salt);
}

export async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

export async function authenticateUser(email, password) {
  try {
    const result = await query(
      'SELECT id, email, username, password_hash, role, active FROM Users WHERE email = @param0 AND active = 1',
      [email]
    );
    
    if (result.recordset.length === 0) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    const user = result.recordset[0];
    
    // TEMPORARY: Check plain text password (since your DB has plain passwords for now)
    if (password === user.password_hash) {
      return {
        success: true,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          role: user.role
        }
      };
    }
    
    // Also try hashed password in case some are hashed
    const isValid = await verifyPassword(password, user.password_hash);
    
    if (!isValid) {
      return { success: false, message: 'Invalid credentials' };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role
      }
    };
  } catch (err) {
    console.error('Authentication error:', err);
    return { success: false, message: 'Authentication failed' };
  }
}
