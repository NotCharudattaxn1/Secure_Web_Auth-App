import { initDb, getUserByUsername, updateUserLockout } from './lib/db.js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
  try {
    await initDb();
    const username = 'User6';
    const user = await getUserByUsername(username);
    if (!user) {
      console.log('User not found');
      return;
    }
    console.log(`[Before] Failed attempts: ${user.failed_login_attempts}, locked_until: ${user.locked_until}`);
    
    // Increment
    let attempts = (user.failed_login_attempts || 0) + 1;
    await updateUserLockout(user.id, attempts, null);
    
    // Fetch again
    const userAfter = await getUserByUsername(username);
    console.log(`[After] Failed attempts: ${userAfter.failed_login_attempts}, locked_until: ${userAfter.locked_until}`);
    
    // Reset back to before so we don't pollute
    await updateUserLockout(user.id, user.failed_login_attempts || 0, user.locked_until);
    
  } catch (err) {
    console.error("Error:", err);
  }
}
main();
