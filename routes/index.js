const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

router.get('/', async function (req, res, next) {
  const isAuth = req.isAuthenticated();
  console.log("isAuth:", isAuth);
  if (isAuth) {
    const userId = req.user.id;
    try {
      // ユーザ情報取得
      const user = await knex('users').where({ id: userId }).first();

      // 投稿一覧取得（全ユーザ分）
      const posts = await knex('microposts')
        .select('microposts.*', 'users.name')
        .leftJoin('users', 'microposts.user_id', 'users.id')
        .orderBy('microposts.created_at', 'desc');

      // 投稿数
      const postCount = await knex('microposts').where({ user_id: userId }).count('id as cnt').first();

      // フォロー数
      const followingCount = await knex('relationships').where({ follower_id: userId }).count('id as cnt').first();

      // フォロワー数
      const followerCount = await knex('relationships').where({ followed_id: userId }).count('id as cnt').first();

      res.render('index', {
        title: '日記',
        isAuth:isAuth,
        user:user,
        postCount: postCount.cnt,
        followingCount: followingCount.cnt,
        followerCount: followerCount.cnt,
        posts,
      });
    } catch (err) {
      console.error(err);
      res.render('index', {
        title: '日記',
        isAuth:isAuth,
        errorMessage: [err.sqlMessage],
      });
    }
  } else {
    res.render('index', {
      title: '日記',
      isAuth:isAuth,
      postCount: 0,
      followingCount: 0,
      followerCount: 0,
    });
  }
});

router.post('/', async function (req, res, next) {
  const isAuth = req.isAuthenticated();
  const userId = req.user.id;
  const content = req.body.add;
  try {
    await knex("microposts").insert({
      user_id: userId,
      content: content,
      created_at: new Date(),
      updated_at: new Date()
    });
    res.redirect('/');
  } catch (err) {
    console.error(err);
    res.render('index', {
      title: '日記',
      isAuth: isAuth,
      errorMessage: [err.sqlMessage],
    });
  }
});
router.use('/accounts/signup', require('./accounts/signup'));
router.use('/accounts/signin', require('./accounts/signin'));
router.use('/logout', require('./logout'));
router.use('/users', require('./users'));

module.exports = router;