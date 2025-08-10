// SQLite-backed auth with bcrypt hashing, account lockout, CSRF tokens
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const db = require('./db');

function passwordStrong(pw){
  // At least 8 chars, one letter, one number
  return /[A-Za-z]/.test(pw) && /\d/.test(pw) && pw.length >= 8;
}

function createUser(email, password){
  if(!passwordStrong(password)) throw new Error('Weak password');
  const id = crypto.randomUUID();
  const hash = bcrypt.hashSync(password, 12);
  const now = Date.now();
  return new Promise((resolve,reject)=>{
    db.run('INSERT INTO users (id,email,password_hash,created_at) VALUES (?,?,?,?)', [id,email,hash,now], function(err){
      if(err) return reject(err);
      resolve({ id, email, createdAt: now });
    });
  });
}

function getUserByEmail(email){
  return new Promise((resolve,reject)=>{
    db.get('SELECT * FROM users WHERE email=?', [email], (err,row)=>{ if(err) return reject(err); resolve(row||null); });
  });
}

function authenticate(email, password){
  return getUserByEmail(email).then(user => {
    if(!user) return { ok:false };
    const now = Date.now();
    if(user.lock_until && user.lock_until > now) return { ok:false, locked:true, lockUntil:user.lock_until };
    if(!bcrypt.compareSync(password, user.password_hash)){
      const failed = (user.failed_attempts||0)+1;
      const lockUntil = failed >= 5 ? now + 15*60*1000 : 0;
      db.run('UPDATE users SET failed_attempts=?, lock_until=? WHERE id=?', [failed, lockUntil, user.id]);
      return { ok:false };
    }
    // reset failures
    db.run('UPDATE users SET failed_attempts=0, lock_until=0 WHERE id=?', [user.id]);
    return { ok:true, user: { id: user.id, email: user.email, createdAt: user.created_at } };
  });
}

function createSession(userId){
  const id = crypto.randomUUID();
  const csrf = crypto.randomBytes(24).toString('hex');
  const now = Date.now();
  return new Promise((resolve,reject)=>{
    db.run('INSERT INTO sessions (id,user_id,created_at,csrf_token) VALUES (?,?,?,?)',[id,userId,now,csrf], err=>{
      if(err) return reject(err);
      resolve({ id, csrf });
    });
  });
}

function getSession(sid){
  return new Promise((resolve,reject)=>{
    db.get('SELECT * FROM sessions WHERE id=?',[sid], (err,row)=>{ if(err) return reject(err); resolve(row||null); });
  });
}

function getUserById(id){
  return new Promise((resolve,reject)=>{
    db.get('SELECT id,email,created_at FROM users WHERE id=?',[id], (err,row)=>{ if(err) return reject(err); if(!row) return resolve(null); resolve({ id: row.id, email: row.email, createdAt: row.created_at }); });
  });
}

function invalidateSession(sid){
  db.run('DELETE FROM sessions WHERE id=?',[sid]);
}

async function validateCsrf(sid, token){
  const s = await getSession(sid);
  if(!s) return false; return s.csrf_token === token;
}

module.exports = { createUser, authenticate, createSession, getSession, getUserById, invalidateSession, validateCsrf };
// SSO helper: find or create user by email without needing password input
function findOrCreateSsoUser(email){
  return new Promise((resolve,reject)=>{
    db.get('SELECT id,email,created_at FROM users WHERE email=?',[email], (err,row)=>{
      if(err) return reject(err);
      if(row) return resolve({ id: row.id, email: row.email, createdAt: row.created_at });
      const id = crypto.randomUUID();
      // generate strong random password hash (never used directly)
      const randomPw = crypto.randomBytes(12).toString('hex') + '1A';
      const hash = bcrypt.hashSync(randomPw,12);
      const now = Date.now();
      db.run('INSERT INTO users (id,email,password_hash,created_at) VALUES (?,?,?,?)',[id,email,hash,now], (e)=>{
        if(e) return reject(e);
        resolve({ id, email, createdAt: now });
      });
    });
  });
}

module.exports.findOrCreateSsoUser = findOrCreateSsoUser;
