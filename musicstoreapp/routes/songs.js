const {ObjectId} = require("mongodb");
module.exports = function(app,songsRepository) {

    app.get('/publications', function (req, res) {
        let filter = {author : req.session.user};
        let options = {sort: {title: 1}};
        songsRepository.getSongs(filter, options).then(songs => {
            res.render("publications.twig", {songs: songs});
        }).catch(error => {
            res.send("Se ha producido un error al listar las publicaciones del usuario:" + error)
        });
    })

    app.get("/shop",function(req,res){
        let filter = {};
        let options = {sort: { title: 1}};
        if(req.query.search != null && typeof(req.query.search) != "undefined" && req.query.search != ""){
            filter = {"title": {$regex: ".*" + req.query.search + ".*"}};
        }
        let page = parseInt(req.query.page); // Es String !!!
        if (typeof req.query.page === "undefined" || req.query.page === null || req.query.page === "0") { //Puede no venir el param
            page = 1;
        }
        songsRepository.getSongsPg(filter, options, page).then(result => {
            let lastPage = result.total / 4;
            if (result.total % 4 > 0) { // Sobran decimales
                lastPage = lastPage + 1;
            }
            let pages = []; // paginas mostrar
            for (let i = page - 2; i <= page + 2; i++) {
                if (i > 0 && i <= lastPage) {
                    pages.push(i);
                }
            }
            let response = {
                songs: result.songs,
                pages: pages,
                currentPage: page
            }
            res.render("shop.twig", response);
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones del usuario " + error)
        });
    })

    app.get("/songs", function(req, res) {
        let songs = [{
            "title":"Blank space",
            "price":"1.2"
        }, {
            "title":"See you again",
            "price":"1.3"
        }, {
            "title":"Uptown Funk",
            "price":"1.1"
        }];
        let response = {
            seller:'Tienda de canciones',
            songs:songs
        };
        res.render("shop.twig",response);
    })

    app.get('/songs/add', function (req, res) {
        res.render("songs/add.twig");
    })

    app.post('/songs/add', function (req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }
        songsRepository.insertSong(song, function (result) {
            if (result !== null && result !== undefined) {
                if (req.files != null) {
                    let image = req.files.cover;
                    image.mv(app.get("uploadPath") + '/public/covers/' + result + '.png')
                        .then(() => {
                            if (req.files.audio != null) {
                                let audio = req.files.audio;
                                audio.mv(app.get("uploadPath") + '/public/audios/' + result + '.mp3')
                                    .then(() => res.redirect("/publications"))
                                    .catch(error => res.send("Error al subir el audio de la canción" + error))
                            } else {
                                res.redirect("/publications");
                            }
                        })
                        .catch(error => res.send("Error al subir la portada de la canción" + error))
                } else {
                    res.redirect("/publications");
                }
            } else {
                res.send("Error al insertar canción " + (result.error || ""));
            }
        });
    })
    app.get('/songs/buy/:id', async function (req, res) {
        let songId = req.params.id;
        const checkResult = await checkUserPermissionsForSong(req, songId);

        if (checkResult.error) {
            res.send("Ha ocurrido un error al intentar comprar la canción. Por favor, intenta nuevamente desde la página de la canción.");
        } else if (!checkResult.canPurchase) {
            let reason = "";
            if (checkResult.isAuthor) {
                reason = "Como autor de esta canción, no necesitas comprarla.";
            } else if (checkResult.hasPurchased) {
                reason = "Ya has comprado esta canción.";
            }
            res.redirect("/songs/"+songId + '?message='+reason +
                "&messageType=alert-info");
        } else {
            res.redirect("/songs/"+songId + '?message=Para comprar esta canción, por favor,utiliza el botón de compra provisto.' +
                "&messageType=alert-info");
        }
    });
    app.post('/songs/buy/:id', async function (req, res) {
        let songId = req.params.id;
        const checkResult = await checkUserPermissionsForSong(req, songId);

        if (checkResult.error) {
            res.send(checkResult.error);
        } else if (!checkResult.canPurchase) {
            res.send("No puedes comprar esta cancion");
        } else {
            // Proceso de compra
            let shop = {
                user: req.session.user,
                song_id: new ObjectId(songId)
            };
            const result = await songsRepository.buySong(shop);
            if (!result.insertedId) {
                res.send('Error al comprar la canción');
            } else {
                res.redirect("/purchases");
            }
        }
    });

    app.get('/purchases', function (req, res) {
        let filter = {user: req.session.user};
        let options = {projection: {_id: 0, song_id: 1}};
        songsRepository.getPurchases(filter, options).then(purchasedIds => {
            const purchasedSongs = purchasedIds.map(song => song.song_id);
            let filter = {"_id": {$in: purchasedSongs}};
            let options = {sort: {title: 1}};
            songsRepository.getSongs(filter, options).then(songs => {
                res.render("purchase.twig", {songs: songs});
            }).catch(error => {
                res.send("Se ha producido un error al listar las publicaciones del usuario: " + error)
            });
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones del usuario " + error)
        });
    })
    app.get('/songs/delete/:id', function (req, res) {
        let filter = {_id: new ObjectId(req.params.id)};
        songsRepository.deleteSong(filter, {}).then(result => {
            if (result === null || result.deletedCount === 0) {
                res.send("No se ha podido eliminar el registro");
            } else {
                res.redirect("/publications");
            }
        }).catch(error => {
            res.send("Se ha producido un error al intentar eliminar la canción: " + error)
        });
    })
    app.get('/songs/edit/:id',function (req,res) {
        let filter = {_id:new ObjectId(req.params.id)};
        songsRepository.findSong(filter,{}).then(song => {
            res.render("songs/edit.twig",{song:song});
        }).catch(error => {
            res.send("Se ha producido un error al recuperar la cancion "+error)
        });
    })
    app.post('/songs/edit/:id', function (req, res) {
        let song = {
            title: req.body.title,
            kind: req.body.kind,
            price: req.body.price,
            author: req.session.user
        }
        let songId = req.params.id;
        let filter = {_id: new ObjectId(songId)};
        //que no se cree un documento nuevo, si no existe
        const options = {upsert: false}
        songsRepository.updateSong(song, filter, options).then(result => {
            step1UpdateCover(req.files, songId, function (result) {
                if (result == null) {
                    res.send("Error al actualizar la portada o el audio de la canción");
                } else {
                    res.redirect("/publications");
                }
            });
        }).catch(error => {
            res.send("Se ha producido un error al modificar la canción " + error)
        });
    })
    function step1UpdateCover(files, songId, callback) {
        if (files && files.cover != null) {
            let image = files.cover;
            image.mv(app.get("uploadPath") + '/public/covers/' + songId + '.png', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    step2UpdateAudio(files, songId, callback); // SIGUIENTE
                }
            });
        } else {
            step2UpdateAudio(files, songId, callback); // SIGUIENTE
        }
    }
    function step2UpdateAudio(files, songId, callback) {
        if (files && files.audio != null) {
            let audio = files.audio;
            audio.mv(app.get("uploadPath") + '/public/audios/' + songId + '.mp3', function (err) {
                if (err) {
                    callback(null); // ERROR
                } else {
                    callback(true); // FIN
                }
            });
        } else {
            callback(true); // FIN
        }
    }
    app.get('/songs/:id', async function (req, res) {
        let songId = req.params.id;
        const checkResult = await checkUserPermissionsForSong(req, songId);
        const songValue = checkResult.song.price / await getUSDExchangeRate();
        const songusd = Math.round(songValue * 100) / 100;
        if (checkResult.error) {
            res.send(checkResult.error);
        } else {
            res.render("songs/song.twig", {
                song: checkResult.song,
                isPurchasedOrAuthor: checkResult.hasPurchased || checkResult.isAuthor,
                songusd: songusd
            });
        }
    });
    async function getUSDExchangeRate() {
        const settings = {
            url: "http://api.currencylayer.com/live?access_key=491bd9a92db9bf08475cb3829af31bcc&currencies=EUR,USD",
            method: "get"
        };
        let rest = app.get("rest");

        return new Promise((resolve, reject) => {
            rest(settings, function (error, response, body) {
                if (error) {
                    reject(error);
                } else {
                    const responseObject = JSON.parse(body);
                    const rateUSD = responseObject.quotes.USDEUR;
                    resolve(rateUSD);
                }
            });
        });
    }

    async function checkUserPermissionsForSong(req, songId) {
        // Convertir songId a ObjectId si es necesario
        songId = (songId instanceof ObjectId) ? songId : new ObjectId(songId);

        try {
            // Buscar la canción por ID
            const song = await songsRepository.findSong({_id: songId}, {});
            if (!song) {
                return { error: 'Canción no encontrada' };
            }

            // Comprobar si el usuario ha comprado la canción
            const userPurchases = await songsRepository.getPurchases({user: req.session.user}, {});
            const hasPurchased = userPurchases.some(purchase => purchase.song_id.equals(songId));

            // Comprobar si el usuario es el autor de la canción
            const isAuthor = song.author === req.session.user;

            return {
                hasPurchased,
                isAuthor,
                canPurchase: !hasPurchased && !isAuthor,
                song
            };
        } catch (error) {
            return { error };
        }
    }


    app.get('/songs/:kind/:id', function(req, res) {
        let response = 'id: ' + req.params.id + '<br>'
            + 'Tipo de música: ' + req.params.kind;
        res.send(response);
    })

    app.get('/promo*', function (req, res) {

        res.send('Respuesta al patrón promo*');
    })

    app.get('/pro*ar', function (req, res) {
        res.send('Respuesta al patrón pro*ar');
    })

}

