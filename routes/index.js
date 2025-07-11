const express = require('express');
const router = express.Router();
const knex = require('../db/knex');


router.get('/', function (req, res, next) {
  console.log('ルートにアクセス'); // 追加
  const userId = req.session.userid;
  const isAuth = Boolean(userId);
  // console.log(`isAuth: ${isAuth}`);

  //req.session.userid はサインイン時にデータが入るため、未サインインの間はundefinedとなり、Boolean(userId) はfalseを返します。
  knex("tasks")
    .select("*")
    .then(function (results) {
      console.log(results);
      res.render('index', {
        title: 'ToDo App',
        todos: results,
        isAuth:isAuth,
      });
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
      });
    });
});

router.post('/', function (req, res, next) {
  const userId= req.session.userid;
  const isAuth = Boolean(userId);
  const todo = req.body.add;
  knex("tasks")
    .insert({user_id: 1, content: todo})
    .then(function () {
      res.redirect('/')
    })
    .catch(function (err) {
      console.error(err);
      res.render('index', {
        title: 'ToDo App',
        isAuth: isAuth,
      });
    });
});

router.use('/signup', require('./signup'));
router.use('/signin', require('./signin'));
router.use('/logout', require('./logout'));
module.exports = router;