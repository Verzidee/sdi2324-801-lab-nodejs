module.exports = {
    mongoClient: null,
    app: null,
    database: "musicStore",
    collectionName: "favorite_songs",
    init: function (app, dbClient) {
        this.dbClient = dbClient;
        this.app = app;
    },
    getfavoriteSongs: async function (filter, options) {
        try {
            await this.dbClient.connect();
            const database = this.dbClient.db(this.database);
            const favoriteSongsCollection = database.collection(this.collectionName);
            const favoriteSongs = await favoriteSongsCollection.find(filter, options).toArray();
            return favoriteSongs;
        } catch (error) {
            throw (error);
        }
    },
    insertfavoriteSong: function (favoriteSongs, callbackFunction) {
        this.dbClient.connect()
            .then(() => {
                const database = this.dbClient.db(this.database);
                const favoriteSongsCollection = database.collection(this.collectionName);favoriteSongsCollection.insertOne(favoriteSongs)
                    .then(result => callbackFunction(result.insertedId))
                    .then(() => this.dbClient.close())
                    .catch(err => callbackFunction({error: err.message}));
            })
            .catch(err => callbackFunction({error: err.message}))
    },
    deleteFavoriteSong: function(favoriteSongs, callbackFunction) {
        this.dbClient.connect()
            .then(() => {
                const database = this.dbClient.db(this.database);
                const favoriteSongsCollection = database.collection(this.collectionName);
                favoriteSongsCollection.deleteOne(favoriteSongs)
                    .then(result => callbackFunction(result.deletedCount))
                    .then(() => this.dbClient.close())
                    .catch(err => callbackFunction({error: err.message}));
            })
            .catch(err => callbackFunction({error: err.message}));
    }
};
