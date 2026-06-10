import express, { Request, Response } from "express";
import db from "../db";
import { hashPassword, comparePassword, generateToken, generateRecoveryCodes, verifyRecoveryCode, useRecoveryCode, verifyChallengeToken, generateChallengeToken } from "../utils/auth";
import { requireBody } from "../middleware/validateBody";
import QRCode from 'qrcode'
import speakeasy from 'speakeasy';
const router = express.Router();

router.route('/register')
  // POST new user
  .post(requireBody, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};

      // Validate input
      if (!username || !password) {
        res.status(400).json({ error: 'Username and password required' });
        return;
      }

      if (password.length < 6) {
        res.status(400).json({ error: 'Password must be at least 6 characters' });
        return;
      }

      // Check if user exists
      const existing_user = await db('user')
        .where({ username })
        .first();

      if (existing_user) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      // Hash password
      const hashed_password = await hashPassword(password);

      // Create user
      const [user_id] = await db('user').insert({
        username,
        password: hashed_password
      });

      // Generate token
      const token = generateToken(user_id);

      res.status(201).json({
        message: 'User registered successfully',
        token,
        user: {
          id: user_id,
          username
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route('/login')
  // POST login user
  .post(requireBody, async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};

      // Validate input
      if (!username || !password) {
        res.status(400).json({ 
          type: 'error',
          error: 'Username and password required' 
        });
        return;
      }

      // Find user
      const user = await db('user')
        .where({ username })
        .first();

      if (!user) {
        res.status(401).json({ 
          type: 'error',
          error: 'Invalid credentials'
        });
        return;
      }

      // Verify password
      const isValid = await comparePassword(password, user.password);

      if (!isValid) {
        res.status(401).json({
          type: 'error',
          error: 'Invalid credentials'
        });
        return;
      }

      // Challenge for 2fa
      if (user.totp_enabled) {
        const challenge_token = generateChallengeToken(user.id)
        
        res.json({
          type: "challenge",
          requires_2fa: true,
          method: "totp",
          challenge_token
        })
        return;
      }

      // Generate token
      const token = generateToken(user.id);

      res.json({
        type: "success",
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          username: user.username
        }
      });
    } catch (error: any) {
      res.status(500).json({
        type: 'error',
        error: error.message
      });
    }
  });

router.route('/')
  // GET all users
  .get(async (req: Request, res: Response) => {
    try {
      const users = await db('user')
        .select('id', 'username', 'created_at')
        .orderBy('username', 'asc');

      res.json(users);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // DELETE current user
  .delete(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;

      const deleted = await db('user')
        .where({ id: user_id })
        .delete();

      if (!deleted) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json({ message: 'User deleted successfully' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route('/profile')
  // GET current user
  .get(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;

      const user = await db('user')
        .where({ id: user_id })
        .select('id', 'username', 'created_at', 'totp_enabled')
        .first();

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  })
  // PATCH current user
  .patch(requireBody, async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { username, currentPassword, newPassword } = req.body;

      // Check if anything was provided to update
      if (!username && !newPassword) {
        res.status(400).json({ error: 'No fields to update' });
        return;
      }

      const updates: any = {};

      // Handle username update if provided
      if (username) {
        // Check if username already exists for a DIFFERENT user
        const existing_user = await db('user')
          .where({ username })
          .whereNot({ id: user_id })
          .first();

        if (existing_user) {
          res.status(409).json({ error: 'Username already exists' });
          return;
        }

        updates.username = username;
      }

      // Handle password update if provided
      if (newPassword) {
        if (!currentPassword) {
          res.status(400).json({ error: 'Current password required to change password' });
          return;
        }

        // Verify current password
        const user = await db('user')
          .where({ id: user_id })
          .first();

        const isValidPassword = await comparePassword(currentPassword, user.password);
        
        if (!isValidPassword) {
          res.status(400).json({ error: 'Current password is incorrect' });
          return;
        }

        // Hash new password
        updates.password = await hashPassword(newPassword);
      }

      // Apply updates
      await db('user')
        .where({ id: user_id })
        .update(updates);

      // Get updated user data
      const updated_user = await db('user')
        .where({ id: user_id })
        .select('id', 'username', 'created_at')
        .first();

      res.json({ 
        message: 'Profile updated successfully',
        user: updated_user 
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

router.route('/login/totp')
  .post(async (req: Request, res: Response) => {
    const { challenge_token, code } = req.body;

    // verify the token
    const decoded = verifyChallengeToken(challenge_token);
    
    // if invalid
    if(!decoded) {
      res.status(400).json({ error: "Invalid or expired challenge token!" })
      return
    }

    // grab the user id if not invalid
    const user_id = decoded.user_id;

    // grab user to return
    const user = await db('user')
      .where({ id: user_id })
      .first();
    
    if(!user || !user.totp_enabled) {
      res.status(400).json({ error: "2FA not enabled!" })
      return
    }

    let ok = false;

    // totp
    if (user.totp_secret) {
      ok = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: code,
        window: 1
      })
    }

    // recovery
    if(!ok) {
      const recovery = await verifyRecoveryCode(user_id, code);
      if (recovery.code_id) {
        await useRecoveryCode(recovery.code_id);
        ok = true;
      }
    }

    if (!ok) {
      res.status(400).json({ error: 'Invalid 2FA code!' })
      return
    }

    // success > issue real JWT
    const token = generateToken(user_id)
    res.json({
      type: 'success',
      token,
      user: {
        id: user.id,
        username: user.username
      }
    })
  })

router.route('/2fa/totp/setup')
  // POST setup totp 2fa
  .post(async (req: Request, res: Response) => {
    const user_id = req.user!.user_id;

    const user = await db('user')
      .where({ id: user_id })
      .select('id', 'username', 'totp_enabled')
      .first();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    } else if (user.totp_enabled) {
      return res.status(400).json({
        error: "totp already enabled! Disable it first to create a new one."
      })
    }

    const secret = speakeasy.generateSecret({ 
      name: `Media Library:${user.username}`, 
      issuer: 'Media Library' 
    });

    // store the secret in db
    await db('user')
      .where({ id: user_id })
      .update({
        totp_secret: secret.base32
      })

    // generate QR code data url
    const otpauthUrl = secret.otpauth_url;
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl || '');

    res.json({
      totp_secret: secret.base32,
      qr_code: qrCodeDataUrl
    })
  })

router.route('/2fa/totp/verify')
  .post(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { code } = req.body;

      const user = await db('user')
        .where({ id: user_id })
        .select('totp_secret', 'totp_enabled')
        .first()
      
      if (!user || !user.totp_secret) {
        return res.status(400).json({ error: 'totp not initialised' });
      }

      let second_factor_ok = false;

      // 1. totp check
      const totp_ok = speakeasy.totp.verify({
        secret: user.totp_secret,
        encoding: 'base32',
        token: code,
        window: 1
      })

      if (totp_ok) {
        second_factor_ok = true;
      }

      // 2. recovery codes
      if (!second_factor_ok) {
        const recovery_code = await verifyRecoveryCode(user_id, code);
        if(recovery_code.code_id) {
          await useRecoveryCode(recovery_code.code_id)
          second_factor_ok = true;
        }
      }

      // 3. exit for failed
      if (!second_factor_ok) {
        return res.status(400).json({ error: 'Invalid 2FA code!' });
      }

      // enable totp
      await db('user')
        .where({ id: user_id })
        .update({
          totp_enabled: true
        })

      // generate recovery codes
      const recovery_codes = await generateRecoveryCodes(user_id);

      res.json({
        message: 'totp enabled successfully!',
        recovery_codes: recovery_codes
      })
    } catch(error: any) {
      res.status(500).json({ error: error.message })
    }
  })

router.route('/2fa/totp/disable')
  .post(async (req: Request, res: Response) => {
    try {
      const user_id = req.user!.user_id;
      const { password, code } = req.body;

      // ensure valid values
      if (!password || !code) {
        return res.status(400).json({ error: 'password and code are required'})
      }

      // 1. get user
      const user = await db('user')
        .where({ id: user_id })
        .first();
      
      // fails
      if (!user) {
        return res.status(400).json({ error: 'user not found!' });
      }
      
      if (!user.totp_enabled) {
        return res.status(400).json({ error: 'totp not enabled!' })
      }

      // 2. verify password
      const password_ok = await comparePassword(password, user.password);
      if (!password_ok) {
        return res.status(400).json({ error: 'Invalid password!' });
      }

      // 3. verify totp or recovery code
      let second_factor_ok = false;

      // totp check
      if (user.totp_secret) {
        const totp_ok = speakeasy.totp.verify({
          secret: user.totp_secret,
          encoding: 'base32',
          token: code,
          window: 1
        })

        if (totp_ok) {
          second_factor_ok = true
        }
      }

      // recovery codes
      if (!second_factor_ok) {
        const recovery_code = await verifyRecoveryCode(user_id, code);
        if(recovery_code.code_id) {
          await useRecoveryCode(recovery_code.code_id)
          second_factor_ok = true;
        }
      }

      if (!second_factor_ok) {
        return res.status(400).json({ error: 'Invalid 2FA' });
      }

      // 4. disable 2FA
      await db('user')
        .where({ id: user_id })
        .update({
          totp_enabled: false,
          totp_secret: null
        })
      
      // 5. cleanup recovery codes
      await db('user_recovery_codes')
        .where({ user_id })
        .del();
      
      return res.json({
        message: '2FA disabled!'
      })
    } catch (error: any) {
      return res.status(500).json({ error: error.message });
    }
  })

router.route('/:id')
  // GET user by ID
  .get(async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const user = await db('user')
        .where({ id: parseInt(id) })
        .select('id', 'username', 'created_at')
        .first();

      if (!user) {
        res.status(404).json({ error: 'User not found' });
        return;
      }

      res.json(user);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

module.exports = router;