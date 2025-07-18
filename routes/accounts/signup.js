const express = require('express');
const router = express.Router();
const knex = require("../../db/knex");
const bcrypt = require("bcrypt");

router.get('/', function (req, res, next) {
  const isAuth = req.isAuthenticated();
  res.render('accounts/signup', {
    title: 'Sign up',
    isAuth: isAuth,
  });
});

// ▼▼▼ POSTルートを以下のように書き換える ▼▼▼
router.post('/', async (req, res, next) => {
  const isAuth = req.isAuthenticated();
  const { username, password, repassword } = req.body;

  try {
    // 1. ユーザー名が既に使われていないかチェック
    const existingUser = await knex("users").where({ name: username }).first();
    if (existingUser) {
      return res.render("accounts/signup", {
        title: "Sign up",
        errorMessage: ["このユーザ名は既に使われています"],
        isAuth: isAuth,
      });
    }

    // 2. パスワードが一致するかチェック
    if (password !== repassword) {
      return res.render("accounts/signup", {
        title: "Sign up",
        errorMessage: ["パスワードが一致しません"],
        isAuth: isAuth,
      });
    }

    // 3. パスワードをハッシュ化して、新しいユーザーをDBに登録
    const hashedPassword = await bcrypt.hash(password, 10);
    // .insert()は通常、[newId] のような配列を返す
    const [newUserId] = await knex("users").insert({ name: username, password: hashedPassword });

    // 4. Passportの req.login() を使って手動でログイン処理を行う
    const newUser = { id: newUserId, name: username };
    req.login(newUser, (err) => {
      // ログイン処理でエラーが発生した場合
      if (err) {
        return next(err);
      }
      // ログイン成功後、ホームページにリダイレクト
      return res.redirect("/");
    });

  } catch (err) {
    // DBエラーなど、予期せぬエラーが発生した場合
    console.error(err);
    return res.render("accounts/signup", {
      title: "Sign up",
      errorMessage: [err.message],
      isAuth: isAuth,
    });
  }
});
module.exports = router;