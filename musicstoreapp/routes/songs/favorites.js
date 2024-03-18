const {ObjectId} = require("mongodb");
module.exports = function(app,favoriteSongsRepository) {

    app.get('/songs/favorites',function (req,res) {
        console.log("Listar favoritos");
        favoriteSongsRepository.getfavoriteSongs({}, {}).then(favoriteSongs => {
            res.render("songs/favorites.twig", {favoriteSongs: favoriteSongs});
        }).catch(error => {
            res.send("Se ha producido un error al listar las canciones favoritas:" + error)
        });
    })

    app.get('/songs/favorites/delete/:id', function(req, res) {
        console.log("Eliminar");
        let filter = {_id: new ObjectId(req.params.id)};
        favoriteSongsRepository.deleteFavoriteSong(filter, (result) => {
            if (result.error) {
                console.log(result.error);
                res.status(500).send("Error al eliminar la canción favorita.");
            } else {
                res.redirect('/songs/favorites');
            }
        });
    });

    app.post('/songs/favorites/add/:song_id', function(req, res) {
        console.log("Añadir canción favorita");

        let favoriteSong = {
            title: req.body.title,
            price: req.body.price,
            date: new Date(),
            song_id: new ObjectId(req.params.song_id)
        };

        favoriteSongsRepository.insertfavoriteSong(favoriteSong, (result) => {
            if (result.error) {
                console.log(result.error);
                res.status(500).send("Error al añadir la canción favorita.");
            } else {
                res.redirect('/songs/favorites');
            }
        });
    });


}