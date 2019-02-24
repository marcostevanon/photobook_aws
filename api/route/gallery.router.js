'use strict';
//*     /api/gallery

const router = require('express').Router();
const verifyToken = require('../controllers/auth.controller').verifyToken;  //import middleware to authenticate apis

const galleryController = require('../controllers/gallery.controller');

//*     /api/gallery
router.get('/', verifyToken, galleryController.getGallery);

//*     /api/gallery/ranking
router.get('/ranking', verifyToken, galleryController.getRanking);

//*     /api/gallery/:image_id
router.get('/:image_id', verifyToken, galleryController.getPost);

//*     /api/gallery/edit/:image_id
router.post('/edit/:image_id', verifyToken, galleryController.editImage)

//*     /api/gallery/:image_id
router.delete('/:image_id', verifyToken, galleryController.deleteImage);

module.exports = router;
