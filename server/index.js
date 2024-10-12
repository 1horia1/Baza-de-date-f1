var Express = require("express");
var cors = require("cors");

const bodyParser = require('body-parser');

var app = Express();
app.use(cors());
app.use(bodyParser.json());

var database;

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = "mongodb+srv://horia:Renault34@cluster0.8jxsknk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });

    database = client.db("Formula_1")
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}

var PORT = 5050;

// start the Express server
app.listen(PORT, () => {
    run().catch(console.dir);
    console.log(`Server listening on port ${PORT}`);
  });

app.get("/getTeams", async (req, res) => {
    let collection = await database.collection("Echipe");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
  });
app.get("/getPiloti", async (req, res) => {
    let collection = await database.collection("Piloti");
    let results = await collection.find({}).toArray();
    res.send(results).status(200);
  });
app.get("/getPoints/:id_Pilot", async (req, res) => {
    const id_Pilot = req.params.id_Pilot;

    let collection = await database.collection("Piloti");
    let player = await collection.findOne({ _id: new ObjectId(id_Pilot) });

    res.send(player.Loc).status(200);
  });
app.post("/addPlayer", async (req, res) => {
    try {
      const { Nume, Prenume, Loc, Campionate_castigate,teamId } = req.body;
      const newDocument =   {
                Nume: Nume,
                Prenume: Prenume,
                Loc: Loc,
                Campionate_castigate: Campionate_castigate,
                team:new ObjectId(teamId)
      }
      let collection = await database.collection("Piloti");
      let result = await collection.insertOne(newDocument);
      res.status(204).send(); // trimite un răspuns simplu de tip 204 No Content
    } catch (err) {
      console.error(err);
      res.status(500).send("Error adding player");
    }
});
app.patch("/editPilot/:idPilot", async (req, res) => {
  try {
    const idPilot = req.params.idPilot;
    const newLoc = req.body.Loc; // Se așteaptă ca noul loc să fie transmis în corpul cererii

    const query = { "_id": new ObjectId(idPilot) };
    const updates = {
      $set: {
         "Loc": newLoc,
      },
    };

    const collection = database.collection("Piloti");
    const result = await collection.updateOne(query, updates);

    if (result.modifiedCount === 1) {
      res.status(200).send("Locul pilotului a fost actualizat cu succes.");
    } else {
      res.status(404).send("Pilotul nu a fost găsit sau nu a fost actualizat.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Eroare la actualizarea locului pilotului.");
  }
});
app.get("/getPlayers/:_id_echipa", async (req, res) => {
  const teamId = req.params._id_echipa;

  // Interogare pentru a găsi echipa folosind ID-ul
  let collectionEchipe = await database.collection("Echipe");
  let echipa = await collectionEchipe.findOne({ "_id": new ObjectId(teamId) });

  if (!echipa) {
    return res.status(404).send("Echipa nu a fost găsită.");
  }

  // Extrage ID-ul echipei din obiectul echipa
  const idEchipa = echipa._id;

  // Interogare pentru a găsi toți pilotii care fac parte din această echipă
  let collectionPiloti = await database.collection("Piloti");
  let piloti = await collectionPiloti.find({ "team": new ObjectId(idEchipa) }).toArray();

  res.send(piloti).status(200);
});
app.delete("/deletePlayer/:_id", async (req, res) => {
  try {
      const query = { _id: new ObjectId(req.params._id) };
  
      const collection = database.collection("Piloti");
      let result = await collection.deleteOne(query);
  
      res.send(result).status(200);
    } catch (err) {
      console.error(err);
      res.status(500).send("Error deleting player");
    }
})