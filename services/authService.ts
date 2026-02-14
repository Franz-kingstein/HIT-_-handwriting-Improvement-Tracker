// Simple local email/password auth using localStorage

export interface LocalUser {
  uid: string;
  email: string;
  displayName: string;
}

interface StoredUser {
  uid: string;
  email: string;
  displayName: string;
  password: string;
}

const USERS_KEY = 'hitApp_users';
const SESSION_KEY = 'hitApp_session';

const getStoredUsers = (): StoredUser[] => {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveStoredUsers = (users: StoredUser[]) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const signUp = (email: string, password: string, displayName: string): LocalUser => {
  const users = getStoredUsers();
  
  if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
    throw new Error('An account with this email already exists.');
  }
  if (password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  if (!email.includes('@') || !email.includes('.')) {
    throw new Error('Please enter a valid email address.');
  }

  const newUser: StoredUser = {
    uid: 'user_' + Date.now().toString(36) + Math.random().toString(36).slice(2),
    email: email.toLowerCase().trim(),
    displayName: displayName.trim(),
    password,
  };

  saveStoredUsers([...users, newUser]);

  const session: LocalUser = { uid: newUser.uid, email: newUser.email, displayName: newUser.displayName };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const signIn = (email: string, password: string): LocalUser => {
  const users = getStoredUsers();
  const user = users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());

  if (!user) {
    throw new Error('No account found with this email.');
  }
  if (user.password !== password) {
    throw new Error('Incorrect password.');
  }

  const session: LocalUser = { uid: user.uid, email: user.email, displayName: user.displayName };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
};

export const signOut = (): void => {
  localStorage.removeItem(SESSION_KEY);
};

export const getCurrentUser = (): LocalUser | null => {
  const data = localStorage.getItem(SESSION_KEY);
  return data ? JSON.parse(data) : null;
};

