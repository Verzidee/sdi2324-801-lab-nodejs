module.exports = function (app) {

    app.get("/authors", function(req, res) {
        // Array predefinido de autores con ejemplos reales
        let authors = [
            { name: "Freddie Mercury", group: "Queen", role: "Vocalista" },
            { name: "Jimmy Page", group: "Led Zeppelin", role: "Guitarrista" },
            { name: "Paul McCartney", group: "The Beatles", role: "Bajista" },
            { name: "Mick Jagger", group: "The Rolling Stones", role: "Vocalista" },
            { name: "John Bonham", group: "Led Zeppelin", role: "Baterista" },
            { name: "Kurt Cobain", group: "Nirvana", role: "Vocalista y Guitarrista" },
            { name: "Flea", group: "Red Hot Chili Peppers", role: "Bajista" },
        ];

        let response = {
            Titulo:'Autores',
            authors: authors
        }
        res.render("authors/authors.twig", response);
    });


    app.get("/authors/add", function (req, res) {
        res.render("authors/add.twig");
    });


    app.post("/authors/add", function (req, res) {
        let response = "";
        if (req.body.group !== null && typeof(req.body.group) != "undefined" && req.body.group.trim() !== "") {
            response += "Grupo: " + req.body.group + "<br>";
        } else {
            response += "Grupo: no enviado en la petición" + "<br>";
        }
        if (req.body.name !== null && typeof(req.body.name) != "undefined" && req.body.name.trim() !== "") {
            response = "Nombre: " + req.body.name + "<br>";
        } else {
            response += "Nombre: no enviado en la petición" + "<br>";
        }
        if (req.body.rol !== null && typeof(req.body.rol) != "undefined" && req.body.rol.trim() !== "") {
            response += "Rol: " + req.body.rol + "<br>";
        } else {
            response += "Rol: no enviado en la petición" + "<br>";
        }
        res.send(response);
    });


    app.get("/author*", function(req, res){
        res.redirect("/authors");
    });

};