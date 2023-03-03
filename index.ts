import express, { Express, Request, Response } from 'express'
import dotenv from 'dotenv'
import cors from 'cors'
import bodyParser from 'body-parser'
import morgan from 'morgan'
import { Configuration, OpenAIApi } from 'openai'
import { twiml } from 'twilio'

dotenv.config()

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

const app: Express = express()
const port = process.env.PORT || 3000

app.use(morgan('combined'))
app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

app.get('/', (req: Request, res: Response) => {
  res.send('hello from my server :d')
})

app.post('/sms', async (req: Request, res: Response) => {
  // gets the Body from the request body
  // this contains the text message that the user has sent
  const { Body } = req.body

  // creates a messaging response that we'll send back to twilio
  const messagingResponse = new twiml.MessagingResponse()

  try {
    // makes a call to the openai api with the settings
    // the prompt itself is the text message
    const response = await openai.createCompletion({
      model: 'text-davinci-003',
      prompt: Body,
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    })

    // gets the response from openai
    const message = response.data.choices[0].text

    //sets that as the message for twilio
    messagingResponse.message(`${message}`)
  } catch (e) {
    //if there is an error we will reply with this (you can omit this to fail silently)
    messagingResponse.message('Sorry there was an error please try again.')
    console.log(e)
  }

  res.setHeader('Content-Type', 'text/xml')
  return res.status(200).send(messagingResponse.toString())
})

app.listen(port, () => {
  console.log(`⚡️[server]: Server is running at http://localhost:${port}`)
})
