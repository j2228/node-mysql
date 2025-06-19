var express = require('express');
var router = express.Router();

//レンダリング 
//表示用のデータをもとに、
//内容を整形して表示すること

let todos = [];
/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { 
    title: 'ToDo App' ,
    todos:todos,
  });
});

router.post('/', function(req,res,next){
  const todo = req.body.add;
  todos.push(todo);
  res.redirect('/');
});

module.exports = router;
