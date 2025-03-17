require('dotenv').config();
const express = require('express');
const cors = require('cors');
const req = require('express/lib/request');
const app = express();
const mongoose = require('mongoose')

// Basic Configuration
const port = process.env.PORT || 3000;

const uri = process.env.MONGO_URI

const connect = async () => {
  try {
    await mongoose.connect(uri)
    console.log("Connected to MongoDB!")
  } catch (error) {
    console.error(error)
  }
}
connect();

const urlSchema = new mongoose.Schema({
  url: { type: String, required: true },
  num: { type: Number, required: true }
})

const Url = mongoose.model("url", urlSchema)

app.use(cors());

app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function (req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});
app.use('/api/shorturl/:num', async (req, res, next) => {
  try{
  const numParam = parseInt(req.params.num)
  if(isNaN(numParam)){
    return res.json({"error": "Wrong format"})
  }
  const numberOfDocs = await Url.countDocuments()
  if(numParam > numberOfDocs){
    return res.json({"error": "No short URL found for the given input"})
    
  }
  console.log("numParam", numParam)
  req.cleanNumber = numParam
  next()
}catch(error){
  next(error)
}

})
app.get('/api/shorturl/:num', async (req, res) => {
  console.log(req.cleanNumber)
  let url
  try {
    url = await Url.findOne({num: req.cleanNumber})
  } catch (error) {
    console.error(error)
    return
  }
  
  console.log("Sending you to", url.url)
  res.redirect(url.url)
})

app.use('/api/shorturl', async (req, res, next) => {
  let code
  try {
    code = await fetch(req.body.url, { method: "HEAD" })
  } catch (error) {
    // console.error(error)
    console.error(code)
  }
  if (code && code != 404) {
    req.cleanUrl = req.body.url
  } else {
    res.json({ "error": "invalid_url" })
    return
  }
  next()
})

app.post("/api/shorturl", async (req, res) => {
  let foundUrl
  try {
    foundUrl = await Url.findOne({url: req.cleanUrl})
    console.log(foundUrl)
  } catch (error) {
    console.error(error)
  }

  if (foundUrl == null) {
    foundUrl = createAndSaveUrl(req.cleanUrl)
  }
  return res.json({"original_url": foundUrl.url, "short_url": foundUrl.num})
})

async function createAndSaveUrl(url) {
  const count = await Url.countDocuments()
  const newUrl = new Url({ url: url, num: count + 1 })
  try {
    await newUrl.save()
     console.log(newUrl.url, "added!")
  } catch (error) {
    console.error(error)
    return
  }
  return newUrl
}

// Your first API endpoint
app.get('/api/hello', function (req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function () {
  console.log(`Listening on port ${port}`);
});
