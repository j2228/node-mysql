const express = require('express');
const router = express.Router();
const knex = require('../../db/knex');
const bcrypt = require('bcrypt');


// --- ユーザー情報変更ページの表示 (GET) ---
router.get('/', (req, res, next) => {
  const isAuth = req.isAuthenticated();
  res.render('accounts/edit', {
    title: 'Edit Profile',
    user: req.user, // 現在のユーザー情報をフォームに渡す
    isAuth: isAuth,
    errorMessage: [],
  });
});

// --- ユーザー情報更新処理 (POST) ---
router.post('/', async (req, res, next) => {
  const { name, email, password, password_confirmation } = req.body;
  const userId = req.user.id;
  const isAuth = req.isAuthenticated();

  // パスワードと確認用パスワードが一致しない場合はエラー
  if (password !== password_confirmation) {
    return res.render('accounts/edit', {
      title: 'Edit Profile',
      user: req.user,
      errorMessage: ['Passwords do not match.'],
      isAuth: isAuth,
    });
  }

  try {
    const updateData = { name, email };

    // パスワードが入力されている場合のみ、ハッシュ化して更新データに含める
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateData.password = hashedPassword;
    }

    // データベースのユーザー情報を更新
    await knex('users').where({ id: userId }).update(updateData);
    
    // 更新後はプロフィールページなどにリダイレクト
    res.redirect('/'); 

  } catch (err) {
    console.error(err);
    res.render('edit', {
      title: 'Edit Profile',
      user: req.user,
      isAuth: isAuth,
      errorMessage: [err.message || 'An error occurred.'],
    });
  }
});

module.exports = router;