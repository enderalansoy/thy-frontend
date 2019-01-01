/**
 * PostController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

const axios = require('axios');

const options =
    { // This is the usual stuff
    adapter: require('skipper-better-s3')
    , key: 'AKIAJDWIA2AIFP6AC2FA'
    , secret: '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'
    , bucket: 'thymesis-aws'
    , region: 'us-east-1'
    , s3params:
    { ACL: 'public-read'
    }
    , onProgress: progress => sails.log.verbose('Upload progress:', progress)
    }


const url = 'https://thymesis-memories-v3.herokuapp.com/api/Posts/'
const commentUrl = 'https://thymesis-memories-v3.herokuapp.com/api/Comments/'
const annotationUrl = 'http://thymesis-api.herokuapp.com/add/annotation/'

module.exports = {

    list: (req, res) => {
        axios.get(url).then((response) => {
            return res.send(response.data);
        }).catch((error) => {
            return res.send(error);
        });
    },

    upload: (req, res) => {
        req.file('image').upload(options, (err, filesUploaded) => {
          if (err) return res.serverError(err);
          return res.json({ file: filesUploaded[0].extra.Location});
        });
      },

    new: (req, res) => {
        console.log(req.query);
        console.log(req.cookies.user.home_page)
        console.log(req.cookies.user.user_id)
        if (typeof req.cookies.user !== 'undefined') {
            axios.post(url, {
                uri: req.cookies.user.home_page,
                title: req.query.title,
                summary: req.query.summary,
                body: req.query.body,
                location: req.query.lat + ':' + req.query.lng,
                image_url: req.query.image_url,
                votes: 0,
                user: req.cookies.user.user_id,
            }).then((response) => {
                console.log(response.data);
                return res.send(response.data);
            }).catch((error) => {
                console.log(error)
            });
        } else {
            return res.json('please login for this');
        }
        
    },

    page: (req, res) => {
        if (typeof req.param('id') === 'undefined') {
            return res.redirect('/')
        }
        axios.get(url + req.param('id')).then((response) => {
            let memory = response.data;
            axios.get(commentUrl).then((resp) => {
                let comments = [];
                let allComments = resp.data;
                allComments.forEach((comment) => {
                    if (comment.post === memory.post_id) {
                        comments.push(comment);
                    }
                })
                return res.view('pages/memory', { memory, comments, user: req.cookies.user });
            })
            
        }).catch((error) => {
            return res.send(error);
        });
    },

    create: (req, res) => {
        return res.view('pages/create', {user: req.cookies.user});
    },

    annotate: (req, res) => {
        if (typeof req.param('id') === 'undefined') {
            return res.redirect('/')
        }
        axios.get(url + req.param('id')).then((response) => {
            let memory = response.data;
            return res.view('pages/annotate', { memory, user: req.cookies.user });
        }).catch((error) => {
            return res.send(error);
        });
    },

    annotateimg: (req, res) => {
        if (typeof req.param('id') === 'undefined') {
            return res.redirect('/')
        }
        axios.get(url + req.param('id')).then((response) => {
            let memory = response.data;
            return res.view('pages/annotateimg', { memory, user: req.cookies.user });
        }).catch((error) => {
            return res.send(error);
        });
    },

    newanno: (req, res) => {
        axios.put(`${annotationUrl}?id=${req.query.id}&target=${req.query.target}&creator_1=1`).then((response) => {
            return res.redirect(req.query.id);
        }).catch((error) => {
            let x = error.data;
            return res.send(x);
        })
    },

    user: (req, res) => {
        axios.get(url).then((response) => {
            const posts = response.data;
            const userPosts = [];
            posts.forEach((post) => {   
                if (post.user === req.query.id) {
                    userPosts.push(post);
                }
            });
            return res.json(userPosts);
        });
    },

};

