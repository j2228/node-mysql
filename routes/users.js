const express = require('express');
const router = express.Router();
const knex = require('../db/knex');

router.get('/:id/following', async function(req, res, next) {
  console.log("Following List");
  const isAuth = req.isAuthenticated();
  const viewerId = req.user?.id; // ログインユーザー（閲覧者）
  const profileUserId = req.params.id; // プロフィール対象ユーザー\
  console.log(viewerId, profileUserId);

  try {
    // 対象ユーザー情報取得
    const user = await knex('users').where({ id: profileUserId }).first();

    // 投稿数
    const postCount = await knex('microposts')
      .where({ user_id: profileUserId })
      .count('id as cnt')
      .first();

    // フォロー数
    const followingCount = await knex('relationships')
      .where({ follower_id: profileUserId })
      .count('id as cnt')
      .first();

    // フォロワー数
    const followerCount = await knex('relationships')
      .where({ followed_id: profileUserId })
      .count('id as cnt')
      .first();

    // フォローしているユーザー一覧取得
    const followingUsers = await knex('relationships')
      .join('users', 'relationships.followed_id', 'users.id')
      .where('relationships.follower_id', profileUserId)
      .select('users.id', 'users.name');

    res.render('following', {
      title: 'Following List',
      isAuth,
      user,
      postCount: postCount.cnt,
      followingCount: followingCount.cnt,
      followerCount: followerCount.cnt,
      followingUsers:followingUsers
    });
  } catch (err) {
    console.error(err);
    res.render('following', {
      title: 'Following List',
      isAuth,
      errorMessage: [err.sqlMessage],
    });
  }
});

router.get('/:id/followers', async (req, res, next) => {
  const isAuth = req.isAuthenticated();
  const profileUserId = req.params.id; // プロフィール対象のユーザーID

  try {
    // --- 左カラムのプロフィール情報を取得 ---

    // 対象ユーザー情報
    const user = await knex('users').where({ id: profileUserId }).first();
    if (!user) {
      // ユーザーが存在しない場合は404エラー
      return next(); 
    }

    // 投稿数
    const postCount = await knex('microposts')
      .where({ user_id: profileUserId })
      .count('id as cnt')
      .first();

    // フォロー数
    const followingCount = await knex('relationships')
      .where({ follower_id: profileUserId })
      .count('id as cnt')
      .first();

    // フォロワー数
    const followerCount = await knex('relationships')
      .where({ followed_id: profileUserId })
      .count('id as cnt')
      .first();

    // --- 右カラムのフォロワー一覧を取得 ---
    // followed_id がプロフィール対象ユーザーIDである行を検索し、
    // その follower_id に紐づくユーザー情報を取得します。
    const followerUsers = await knex('relationships')
      .join('users', 'relationships.follower_id', 'users.id')
      .where('relationships.followed_id', profileUserId)
      .select('users.id', 'users.name');

    // テンプレートにデータを渡してレンダリング
    res.render('followers', {
      title: 'Followers',
      isAuth,
      user, // プロフィール対象のユーザー情報
      postCount: postCount.cnt,
      followingCount: followingCount.cnt,
      followerCount: followerCount.cnt,
      followerUsers, // フォロワーのユーザーリスト
    });

  } catch (err) {
    console.error(err);
    next(err);
  }
});

// users.js に以下のルートを追加
// プロフィールページのルート
router.get('/:id', async (req, res, next) => {
  const isAuth = req.isAuthenticated();
  const profileUserId = req.params.id;
  const viewerId = req.user?.id; // ログインしている閲覧者のID

  try {
    const user = await knex('users').where({ id: profileUserId }).first();
    if (!user) {
      return next();
    }

    // --- 統計情報と投稿の取得 ---
    const postCount = await knex('microposts').where({ user_id: profileUserId }).count('id as cnt').first();
    const followingCount = await knex('relationships').where({ follower_id: profileUserId }).count('id as cnt').first();
    const followerCount = await knex('relationships').where({ followed_id: profileUserId }).count('id as cnt').first();
    const posts = await knex('microposts').where({ user_id: profileUserId }).orderBy('created_at', 'desc');

    // ▼▼▼ この部分を追加 ▼▼▼
    let isFollowing = false;
    // ログインしていて、かつ自分のプロフィールではない場合にフォロー状態をチェック
    if (isAuth && viewerId != profileUserId) {
      const relationship = await knex('relationships')
        .where({
          follower_id: viewerId,
          followed_id: profileUserId
        })
        .first(); // レコードが1つでもあればフォローしている
      if (relationship) {
        isFollowing = true;
      }
    }
    // ▲▲▲ ここまで追加 ▲▲▲

    // 必要なデータをすべて渡してレンダリング
    res.render('profile', {
      title: `${user.name}'s Profile`,
      isAuth,
      user,
      viewerId,
      postCount: postCount.cnt,
      followingCount: followingCount.cnt,
      followerCount: followerCount.cnt,
      posts,
      isFollowing, // ◀◀◀ isFollowing を追加して渡す
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// --- フォロー処理 ---
router.post('/:id/follow', async (req, res, next) => {
  const followed_id = req.params.id;
  const follower_id = req.user.id;

  try {
    const existing = await knex('relationships').where({ followed_id, follower_id }).first();
    if (!existing) {
      await knex('relationships').insert({ followed_id, follower_id });
    }
    res.redirect(`/users/${followed_id}`);
  } catch (err) {
    console.error(err);
    next(err);
  }
});

// --- アンフォロー処理 ---
router.post('/:id/unfollow', async (req, res, next) => {
  const followed_id = req.params.id;
  const follower_id = req.user.id;

  try {
    await knex('relationships').where({ followed_id, follower_id }).del();
    res.redirect(`/users/${followed_id}`);
  } catch (err) {
    console.error(err);
    next(err);
  }
});


// --- ユーザー一覧ページ ---
router.get('/', async (req, res, next) => {
  const isAuth = req.isAuthenticated();
  try {
    const allUsers = await knex('users').select('*').orderBy('id', 'asc');
    
    res.render('users', {
      title: 'All Users',
      isAuth,
      users: allUsers,
      currentUser: req.user, // 管理者判定のためにログインユーザー情報を渡す
    });
  } catch(err) {
    console.error(err);
    next(err);
  }
});

// --- ユーザー削除処理（管理者専用） ---
router.post('/users/:id/delete', async (req, res, next) => {
  // ログインしているか、かつ管理者かをチェック
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    return res.status(403).send('Forbidden: Admins only');
  }
  
  const userIdToDelete = req.params.id;

  // 自分自身は削除できないようにする
  if (req.user.id == userIdToDelete) {
    return res.status(400).send('You cannot delete yourself.');
  }

  try {
    await knex('users').where({ id: userIdToDelete }).del();
    res.redirect('/users');
  } catch(err) {
    console.error(err);
    next(err);
  }
});

module.exports = router;
