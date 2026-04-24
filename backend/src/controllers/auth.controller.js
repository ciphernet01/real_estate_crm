import passport from 'passport';
import { Router } from 'express';
import { JSend } from 'jsend-standard';

const router = Router();

// @route   GET /api/auth/google
// @desc    Login with Google
// @access  Public
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get(
  '/google/callback',
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

// @route   GET /api/auth/microsoft
// @desc    Login with Microsoft
// @access  Public
router.get('/microsoft', passport.authenticate('microsoft', { scope: ['user.read'] }));

// @route   GET /api/auth/microsoft/callback
// @desc    Microsoft auth callback
// @access  Public
router.get(
  '/microsoft/callback',
  passport.authenticate('microsoft', { failureRedirect: '/login' }),
  (req, res) => {
    res.redirect('/');
  }
);

// @route   GET /api/auth/logout
// @desc    Logout user
// @access  Private
router.get('/logout', (req, res) => {
  req.logout();
  res.redirect('/login');
});

export default router;
