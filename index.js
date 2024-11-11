require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const Sequelize = require('sequelize')
const app = express()
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())
app.use((req, res, next) => {
  const corsWhitelist = [
    'http://localhost:3000',
    'https://localhost:3000'
  ]
  if (corsWhitelist.indexOf(req.headers.origin) !== -1) {
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  }
  next()
})
const sequelize = new Sequelize(`postgres://${process.env.PGUSER}:${process.env.PGPASSWORD}@${process.env.PGHOST}:${process.env.PGPORT}/${process.env.PGDATABASE}?sslmode=require`,
  {
    dialect: 'postgres',
    protocol: 'postgres',
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false
      }
    }

})
sequelize.authenticate().then(() => {
  console.log('Connection has been established successfully.')
}).catch(err => {
  console.error('Unable to connect to the database:', err)
})

const port = process.env.PORT || 4000

// app.use(express.json())
app.get('/', async (req, res) => {
  res.send("Successfully connected to the server")
})

app.post('/search', async (req, res) => {
  console.log("req body: ", req.body)
  try {
    const query = `
    SELECT chunk, embedding <=>  ai.openai_embed('text-embedding-3-small', '${req.body.query}', dimensions=>768) as distance
    FROM foreign_recipe_embeddings_store
    ORDER BY distance
    LIMIT 10;
    `
    const [results, metadata] = await sequelize.query(query)
    console.log({ results })
    console.log({ metadata })
    res.send(JSON.stringify(results))
  } catch (e) {
    console.log('Error querying from the database')
  }
  
})

app.post('/ask', async (req, res) => {
  console.log("User question: ", req.body)
  try {
    const [results, metadata] = await sequelize.query(`SELECT generate_rag_response('${req.body.query}');`)
    console.log({ results })
    console.log({ metadata})
    res.send(JSON.stringify(results))
  } catch (error) {
    console.log(error)
    res.send(JSON.stringify(error))
  }
})

app.listen(port, () => console.log(`Example app listening at https://localhost:${port}`))