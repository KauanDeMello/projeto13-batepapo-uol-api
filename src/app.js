import express from "express"
import cors from "cors"

// Server 
const app = express()

// Setup
app.use(express.json())
app.use(cors())

const PORT = 5000
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`))