const pool=require('../config/db');
exports.getMessages=async(req,res,next)=>{try{const r=await pool.query('SELECT * FROM messages WHERE job_id=$1 ORDER BY sent_at ASC',[req.params.job_id]);res.json(r.rows);}catch(err){next(err);}};
exports.sendMessage=async(req,res,next)=>{try{const{job_id}=req.params;const{content}=req.body;const{id,role}=req.user;const r=await pool.query('INSERT INTO messages(job_id,sender_type,sender_id,content)VALUES($1,$2,$3,$4)RETURNING *',[job_id,role,id,content]);res.status(201).json(r.rows[0]);}catch(err){next(err);}};
