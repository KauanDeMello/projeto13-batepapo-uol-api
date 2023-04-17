import express from "express"
import cors from "cors"
import { MongoClient, ObjectId } from "mongodb"
import dotenv from "dotenv"
import joi from "joi"
import dayjs from "dayjs"




// Server 
const app = express()

// Setup
app.use(express.json())
app.use(cors())
dotenv.config()

// Database Setup
const mongoClient = new MongoClient(process.env.DATABASE_URL)
let db;
mongoClient.connect()
    .then(() => db = mongoClient.db())
    .catch((err) => console.log(err.message))


// Joi Schema
const participantsSchema = joi.object({
    name: joi.string().required().min(3)
  })


// POST /participants
app.post('/participants', async (req, res) => {
    const { name } = req.body;
  
    
    const { error } = participantsSchema.validate({name})
    if (error) {
      return res.status(422).json({ message: "O campo 'name' é obrigatório e deve ser uma string não vazia." })
    }
  
    
    const participantExists = await db.collection('participante').findOne({ name })
    if (participantExists) {
      return res.status(409).json({ message: "O nome escolhido já está em uso." })
    }
  
    
    const newParticipant = {
    _id: ObjectId(),
      name,
      lastStatus: Date.now()
    }
    await db.collection('participante').insertOne(newParticipant)
  
   
    const newMessage = {
     _id: ObjectId(),
      from: name,
      to: 'Todos',
      text: 'entra na sala...',
      type: 'status',
      time: dayjs().format('HH:mm:ss')
    }
    await db.collection('mensagem').insertOne(newMessage)
  
    
    return res.status(201).send()
  })

// Get / participants

app.get('/participants', (req, res) => {
    db.collection('participante').find().toArray()
      .then((participants) => {
        res.status(200).json(participants);
      })
      .catch((err) => {
        console.error(err);
        res.status(500).json({ message: 'Erro ao buscar participantes' });
      });
  });


// Joi schema message
const messageSchema = joi.object({
    from: joi.string().required(),
    to: joi.string().required(),
    text: joi.string().required(),
    type: joi.string().valid("message", "private_message").required()
  });

// Post messages

app.post("/messages", async(req, res) => {
    const {to, text, type} = req.body
    const {user} = req.headers

    const userExists = await db.collection("participante").findOne({ name: user });
    if (!userExists) {
      return res.status(422).send("User não encontrado.");
    }
  
    const { error } = messageSchema.validate({ from: user, to, text, type });
    if (error) {
      return res.status(422).send(" Mensagem inválida, tente novamente!");
    }

    const message = {
        from: user,
        to,
        text,
        type,
        time: dayjs().format("HH:mm:ss")
    }
    await db.collection('mensagem').insertOne(message)

    res.sendStatus(201)

})

app.get("/messages", async (req, res) => {
    const { user } = req.headers;
    const { limit } = req.query;
  
    let query = {
      $or: [
        { to: "Todos" },
        { to: user },
        { from: user },
        { type: "public" },
      ],
    };
  
    if (isNaN(parseInt(limit)) || parseInt(limit) <= 0) {
      return res.status(422).send("Limit inválido.");
    }
  
    const messages = await db
      .collection("mensagem")
      .find(query)
      .limit(parseInt(limit) || undefined)
      .sort({ $natural: -1 })
      .toArray();
  
    res.send(messages);
  });

  app.post('/status', async (req, res) => {
    const { user } = req.headers;
  
    if (!user) {
      return res.status(404).send('User não informado');
    }
  
    const userExists = await db.collection('participante').findOne({ name: user });
  
    if (!userExists) {
      return res.status(404).send('User não encontrado');
    }
  
    await db.collection('participante').updateOne(
      { name: user },
      { $set: { lastStatus: Date.now() } }
    );
  
    res.sendStatus(200);
  });

  setInterval(async () => {
    const cutoffTimestamp = Date.now() - 10 * 1000 // 10 segundos atrás
    const result = await db.collection('participante').deleteMany({ lastStatus: { $lt: cutoffTimestamp } })
  
    if (result.deletedCount > 0) {
      const messages = result.deletedIds.map((id) => ({
        from: id,
        to: 'Todos',
        text: 'sai da sala...',
        type: 'status',
        time: dayjs().format('HH:mm:ss')
      }))
      await db.collection('mensagem').insertMany(messages)
    }
  }, 15000)

// Port Server
const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))